import * as THREE from "three";

/**
 * The character's implicit "soft body" is a scalar density field: a smooth
 * union of blob nodes (tapered capsules — spheres are the degenerate case).
 * Each node contributes  density * falloff(signedDistance, blend)  so that a
 * lone node's iso-surface (iso = 1) sits exactly on its geometric surface,
 * while nearby nodes sum and bulge into a seamless organic weld — the
 * metaball/smooth-union look, but polygonized ONCE at build time instead of
 * raymarched per pixel.
 *
 * The same node influences later drive vertex colors (smooth color blending
 * across parts) and skin weights (soft, fused deformation), which is what
 * makes separate primitives read as one continuous creature.
 */
export interface BlobNode {
  a: THREE.Vector3;
  b: THREE.Vector3;
  ra: number;
  rb: number;
  /** fusion falloff distance in world units — bigger = softer weld */
  blend: number;
  color: THREE.Color;
  /** index into the character's bone list */
  bone: number;
  /** field contribution; 0 = tint-only node (colors the surface, no geometry) */
  density: number;
  /** color influence multiplier */
  tint: number;
}

export const ISO_LEVEL = 1.0;

/** Signed distance from p to a tapered capsule (segment a→b, radius ra→rb). */
export function nodeDistance(n: BlobNode, px: number, py: number, pz: number): number {
  const bax = n.b.x - n.a.x;
  const bay = n.b.y - n.a.y;
  const baz = n.b.z - n.a.z;
  const pax = px - n.a.x;
  const pay = py - n.a.y;
  const paz = pz - n.a.z;
  const bb = bax * bax + bay * bay + baz * baz;
  let h = bb > 1e-9 ? (pax * bax + pay * bay + paz * baz) / bb : 0;
  h = h < 0 ? 0 : h > 1 ? 1 : h;
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  const dz = paz - baz * h;
  const r = n.ra + (n.rb - n.ra) * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
}

/**
 * C1-continuous falloff. f(0) = 1 (the iso level), f(blend) = 0.
 * Inside the primitive it keeps rising linearly so bisection stays monotonic.
 */
export function falloff(d: number, blend: number): number {
  const t = 1 - d / blend;
  if (t <= 0) return 0;
  if (t >= 1) return 1 + (t - 1) * 3;
  return t * t * t;
}

export function sampleDensity(nodes: BlobNode[], px: number, py: number, pz: number): number {
  let sum = 0;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.density === 0) continue;
    const d = nodeDistance(n, px, py, pz);
    if (d < n.blend) sum += n.density * falloff(d, n.blend);
  }
  return sum;
}

export interface FieldBounds {
  center: THREE.Vector3;
  halfExt: THREE.Vector3;
}

/** Axis-aligned bounds of the whole soft body, padded for the blend skirt. */
export function computeBounds(nodes: BlobNode[]): FieldBounds {
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (const n of nodes) {
    if (n.density === 0) continue;
    const pad = Math.max(n.ra, n.rb) + n.blend;
    min.x = Math.min(min.x, n.a.x - pad, n.b.x - pad);
    min.y = Math.min(min.y, n.a.y - pad, n.b.y - pad);
    min.z = Math.min(min.z, n.a.z - pad, n.b.z - pad);
    max.x = Math.max(max.x, n.a.x + pad, n.b.x + pad);
    max.y = Math.max(max.y, n.a.y + pad, n.b.y + pad);
    max.z = Math.max(max.z, n.a.z + pad, n.b.z + pad);
  }
  const center = min.clone().add(max).multiplyScalar(0.5);
  const halfExt = max.clone().sub(min).multiplyScalar(0.5).addScalar(0.06);
  halfExt.x = Math.max(halfExt.x, 0.3);
  halfExt.y = Math.max(halfExt.y, 0.3);
  halfExt.z = Math.max(halfExt.z, 0.3);
  return { center, halfExt };
}

/**
 * Fill a marching-cubes grid (index = x + y*size + z*size²) with the density
 * field. Grid local space is [-1,1]³ mapped anisotropically onto the bounds.
 * Each node only touches cells inside its own AABB, so fill cost scales with
 * blob volume, not grid volume.
 */
export function fillField(
  field: Float32Array,
  size: number,
  nodes: BlobNode[],
  bounds: FieldBounds
): void {
  const { center, halfExt } = bounds;
  const size2 = size * size;
  const half = size / 2;

  const toCell = (w: number, c: number, h: number) => ((w - c) / h + 1) * half;
  const toWorld = (cell: number, c: number, h: number) => c + ((cell - half) / half) * h;

  for (const n of nodes) {
    if (n.density === 0) continue;
    const pad = Math.max(n.ra, n.rb) + n.blend;
    const minX = Math.max(1, Math.floor(toCell(Math.min(n.a.x, n.b.x) - pad, center.x, halfExt.x)));
    const maxX = Math.min(size - 2, Math.ceil(toCell(Math.max(n.a.x, n.b.x) + pad, center.x, halfExt.x)));
    const minY = Math.max(1, Math.floor(toCell(Math.min(n.a.y, n.b.y) - pad, center.y, halfExt.y)));
    const maxY = Math.min(size - 2, Math.ceil(toCell(Math.max(n.a.y, n.b.y) + pad, center.y, halfExt.y)));
    const minZ = Math.max(1, Math.floor(toCell(Math.min(n.a.z, n.b.z) - pad, center.z, halfExt.z)));
    const maxZ = Math.min(size - 2, Math.ceil(toCell(Math.max(n.a.z, n.b.z) + pad, center.z, halfExt.z)));

    for (let z = minZ; z <= maxZ; z++) {
      const wz = toWorld(z, center.z, halfExt.z);
      const zOff = size2 * z;
      for (let y = minY; y <= maxY; y++) {
        const wy = toWorld(y, center.y, halfExt.y);
        const yOff = zOff + size * y;
        for (let x = minX; x <= maxX; x++) {
          const wx = toWorld(x, center.x, halfExt.x);
          const d = nodeDistance(n, wx, wy, wz);
          if (d < n.blend) field[yOff + x] += n.density * falloff(d, n.blend);
        }
      }
    }
  }
}

/**
 * March from `origin` along `dir` until the density drops below the iso
 * level, then bisect. Used to sit eyes/mouths exactly on the fused surface.
 */
export function projectToSurface(
  nodes: BlobNode[],
  origin: THREE.Vector3,
  dir: THREE.Vector3,
  maxDist = 2.5
): THREE.Vector3 {
  const d = dir.clone().normalize();
  const step = 0.02;
  let tIn = 0;
  let tOut = maxDist;
  let found = false;
  for (let t = step; t <= maxDist; t += step) {
    const px = origin.x + d.x * t;
    const py = origin.y + d.y * t;
    const pz = origin.z + d.z * t;
    if (sampleDensity(nodes, px, py, pz) < ISO_LEVEL) {
      tOut = t;
      tIn = t - step;
      found = true;
      break;
    }
  }
  if (!found) tIn = maxDist - step;
  for (let i = 0; i < 12; i++) {
    const tm = (tIn + tOut) * 0.5;
    const px = origin.x + d.x * tm;
    const py = origin.y + d.y * tm;
    const pz = origin.z + d.z * tm;
    if (sampleDensity(nodes, px, py, pz) >= ISO_LEVEL) tIn = tm;
    else tOut = tm;
  }
  const t = (tIn + tOut) * 0.5;
  return new THREE.Vector3(origin.x + d.x * t, origin.y + d.y * t, origin.z + d.z * t);
}
