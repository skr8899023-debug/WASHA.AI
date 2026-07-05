import * as THREE from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import { mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";
import {
  BlobNode,
  computeBounds,
  falloff,
  fillField,
  nodeDistance,
  projectToSurface,
} from "../core/field";
import { hashString, RNG } from "../core/rng";
import { createFusedToonMaterial } from "../material/FusedToonMaterial";
import { SpringChain, SpringLink } from "../anim/SpringChain";
import { CharacterSpec, CharacterSpecInput, Movement } from "../types";
import { AnatomyPlan, buildAnatomy } from "./anatomy";

/**
 * CharacterFactory: JSON spec → living puppet.
 *
 * Pipeline (all at build time, then it's just one skinned draw call):
 *   1. anatomy plan     — bones + blob nodes from the spec
 *   2. field bake       — smooth-union density field, polygonized once with
 *                         marching cubes → a single seamless manifold mesh
 *   3. vertex pass      — per-vertex color AND skin weights derived from the
 *                         same node influences, so color blends and soft
 *                         deformation follow the exact same fusion falloff
 *   4. rig assembly     — THREE.Bone skeleton, IK legs, arm/wing chains,
 *                         spring chains, surface-projected face
 */

export interface LegRig {
  upper: THREE.Bone;
  lower: THREE.Bone;
  foot: THREE.Bone;
  restDirUpper: THREE.Vector3;
  restDirLower: THREE.Vector3;
  l1: number;
  l2: number;
  home: THREE.Vector3;
  phase: number;
  side: number;
  dangle: boolean;
}

export interface ArmRig {
  shoulder: THREE.Bone;
  fore: THREE.Bone;
  side: number;
  wing: boolean;
}

export interface BuiltCharacter {
  spec: CharacterSpec;
  group: THREE.Group;
  mesh: THREE.SkinnedMesh;
  material: THREE.ShaderMaterial;
  bones: Record<string, THREE.Bone>;
  legs: LegRig[];
  arms: ArmRig[];
  springs: SpringChain[];
  eyes: THREE.Object3D[];
  shadow: THREE.Mesh;
  shadowBaseScale: number;
  hipHeight: number;
  bodyRadius: number;
  triCount: number;
  bakeMs: number;
  dispose(): void;
}

const DEFAULT_PALETTE: [string, string, string] = ["#ffb86b", "#fff2d8", "#2a1f1a"];

function defaultMovement(legs: number): Movement {
  if (legs === 0) return "hop";
  if (legs === 2) return "bouncy_walk";
  if (legs <= 4) return "trot";
  return "scuttle";
}

export function normalizeSpec(input: CharacterSpecInput): CharacterSpec {
  const legs = Math.max(0, Math.min(8, Math.round(input.legs ?? 2)));
  const movement = input.movement ?? defaultMovement(legs);
  return {
    species: input.species || "critter",
    body: input.body ?? "round",
    head: input.head ?? (legs >= 3 ? "muzzle" : "round"),
    eyes: input.eyes ?? "big_curious",
    legs,
    arms: Math.max(0, Math.min(2, Math.round(input.arms ?? (legs >= 3 ? 0 : 2)))),
    ears: input.ears ?? "round",
    tail: input.tail ?? "stub",
    palette: input.palette ?? DEFAULT_PALETTE,
    movement,
    personality: input.personality ?? "playful",
    size: THREE.MathUtils.clamp(input.size ?? 1, 0.5, 1.8),
    seed: input.seed ?? hashString(input.species || "critter"),
  };
}

// --- shared, lazily created resources ---------------------------------------

let shadowTexture: THREE.CanvasTexture | null = null;
function getShadowTexture(): THREE.CanvasTexture {
  if (shadowTexture) return shadowTexture;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, "rgba(74, 48, 22, 0.5)");
  g.addColorStop(0.55, "rgba(74, 48, 22, 0.22)");
  g.addColorStop(1, "rgba(74, 48, 22, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  shadowTexture = new THREE.CanvasTexture(c);
  return shadowTexture;
}

// -----------------------------------------------------------------------------

export class CharacterFactory {
  constructor(private resolution = 64) {}

  build(input: CharacterSpecInput): BuiltCharacter {
    const t0 = performance.now();
    const spec = normalizeSpec(input);
    const rng = new RNG(spec.seed);
    const plan = buildAnatomy(spec, rng);

    const group = new THREE.Group();
    group.name = `puppet:${spec.species}`;

    // 1. skeleton -------------------------------------------------------------
    const bones: THREE.Bone[] = plan.bones.map((def) => {
      const bone = new THREE.Bone();
      bone.name = def.name;
      return bone;
    });
    plan.bones.forEach((def, i) => {
      if (def.parent >= 0) {
        bones[def.parent].add(bones[i]);
        bones[i].position.copy(def.pos).sub(plan.bones[def.parent].pos);
      } else {
        bones[i].position.copy(def.pos);
      }
      bones[i].userData.restLocal = bones[i].position.clone();
    });
    group.add(bones[0]);
    group.updateMatrixWorld(true);

    // 2. bake the fused soft body ----------------------------------------------
    const geometry = this.bakeGeometry(plan.nodes, bones.length);

    const material = createFusedToonMaterial();
    const skeleton = new THREE.Skeleton(bones);
    const mesh = new THREE.SkinnedMesh(geometry, material);
    mesh.frustumCulled = false;
    group.add(mesh);
    mesh.bind(skeleton);

    // 3. face -------------------------------------------------------------------
    const eyes = this.buildFace(plan, bones, spec, group);

    // 4. rigs --------------------------------------------------------------------
    const boneMap: Record<string, THREE.Bone> = {};
    bones.forEach((b) => (boneMap[b.name] = b));

    const legs: LegRig[] = plan.legs.map((p) => {
      const a = plan.bones[p.upper].pos;
      const b = plan.bones[p.lower].pos;
      const c = plan.bones[p.foot].pos;
      return {
        upper: bones[p.upper],
        lower: bones[p.lower],
        foot: bones[p.foot],
        restDirUpper: b.clone().sub(a).normalize(),
        restDirLower: c.clone().sub(b).normalize(),
        l1: b.distanceTo(a),
        l2: c.distanceTo(b),
        home: p.home.clone(),
        phase: p.phase,
        side: p.side,
        dangle: p.dangle,
      };
    });

    const arms: ArmRig[] = plan.arms.map((p) => ({
      shoulder: bones[p.shoulder],
      fore: bones[p.fore],
      side: p.side,
      wing: p.wing,
    }));

    const springs: SpringChain[] = plan.chains.map((chain) => {
      const links: SpringLink[] = chain.bones.map((bi, i) => {
        const pos = plan.bones[bi].pos;
        const next = i < chain.bones.length - 1 ? plan.bones[chain.bones[i + 1]].pos : chain.tip;
        return {
          bone: bones[bi],
          restDir: next.clone().sub(pos).normalize(),
          len: Math.max(1e-4, next.distanceTo(pos)),
        };
      });
      return new SpringChain(links, chain.stiffness, chain.damping, chain.gravity, chain.kind, chain.side);
    });

    // 5. contact shadow ------------------------------------------------------------
    const shadowBaseScale = plan.bodyRadius * 2.6;
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: getShadowTexture(),
        transparent: true,
        depthWrite: false,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.012;
    shadow.scale.setScalar(shadowBaseScale);
    shadow.renderOrder = 1;

    const triCount = (geometry.index ? geometry.index.count : geometry.attributes.position.count) / 3;
    const bakeMs = performance.now() - t0;

    return {
      spec,
      group,
      mesh,
      material,
      bones: boneMap,
      legs,
      arms,
      springs,
      eyes,
      shadow,
      shadowBaseScale,
      hipHeight: plan.hipHeight,
      bodyRadius: plan.bodyRadius,
      triCount,
      bakeMs,
      dispose() {
        geometry.dispose();
        material.dispose();
        (shadow.material as THREE.Material).dispose();
        shadow.geometry.dispose();
      },
    };
  }

  // ---------------------------------------------------------------------------

  private bakeGeometry(nodes: BlobNode[], boneCount: number): THREE.BufferGeometry {
    const res = this.resolution;
    const bounds = computeBounds(nodes);

    const mc = new MarchingCubes(res, new THREE.MeshBasicMaterial(), false, false, 300000);
    const mcAny = mc as unknown as {
      field: Float32Array;
      positionArray: Float32Array;
      normalArray: Float32Array;
      isolation: number;
    };
    mcAny.isolation = 1.0;
    mc.reset();
    fillField(mcAny.field, res, nodes, bounds);
    mc.update();

    const count = mc.geometry.drawRange.count;
    let geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(mcAny.positionArray.slice(0, count * 3), 3));
    geo.setAttribute("normal", new THREE.BufferAttribute(mcAny.normalArray.slice(0, count * 3), 3));
    mc.geometry.dispose();
    (mc.material as THREE.Material).dispose();

    // weld the triangle soup into an indexed mesh (identical verts/normals on
    // shared edges → watertight merge, ~6x fewer vertices)
    geo = mergeVertices(geo, 1e-4);

    // grid-local [-1,1]³ → world, with anisotropic normal correction
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const nor = geo.attributes.normal as THREE.BufferAttribute;
    const { center, halfExt } = bounds;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(
        i,
        center.x + pos.getX(i) * halfExt.x,
        center.y + pos.getY(i) * halfExt.y,
        center.z + pos.getZ(i) * halfExt.z
      );
      const nx = nor.getX(i) / halfExt.x;
      const ny = nor.getY(i) / halfExt.y;
      const nz = nor.getZ(i) / halfExt.z;
      const inv = 1 / (Math.sqrt(nx * nx + ny * ny + nz * nz) || 1);
      nor.setXYZ(i, nx * inv, ny * inv, nz * inv);
    }

    // per-vertex color + skin weights from the same node influences
    const vCount = pos.count;
    const colors = new Float32Array(vCount * 3);
    const skinIndex = new Uint16Array(vCount * 4);
    const skinWeight = new Float32Array(vCount * 4);
    const boneW = new Float32Array(boneCount);

    for (let v = 0; v < vCount; v++) {
      const px = pos.getX(v);
      const py = pos.getY(v);
      const pz = pos.getZ(v);
      boneW.fill(0);
      let cr = 0;
      let cg = 0;
      let cb = 0;
      let cw = 0;

      for (let ni = 0; ni < nodes.length; ni++) {
        const n = nodes[ni];
        const d = nodeDistance(n, px, py, pz);
        if (n.density > 0) {
          const wSkin = falloff(d, n.blend * 2.4 + 0.03);
          if (wSkin > 0) boneW[n.bone] += wSkin * n.density;
        }
        const wCol = n.tint * falloff(d, n.blend * (n.density > 0 ? 1.5 : 1.0) + 0.03);
        if (wCol > 0) {
          cr += n.color.r * wCol;
          cg += n.color.g * wCol;
          cb += n.color.b * wCol;
          cw += wCol;
        }
      }

      // subtle baked top-light gradient for extra softness
      const grad = 0.94 + 0.1 * THREE.MathUtils.clamp(nor.getY(v) * 0.5 + 0.5, 0, 1);
      const invW = cw > 1e-6 ? grad / cw : 0;
      colors[v * 3] = cr * invW;
      colors[v * 3 + 1] = cg * invW;
      colors[v * 3 + 2] = cb * invW;

      // strongest 4 bones, normalized
      let i0 = 0;
      let i1 = 0;
      let i2 = 0;
      let i3 = 0;
      let w0 = 0;
      let w1 = 0;
      let w2 = 0;
      let w3 = 0;
      for (let bIdx = 0; bIdx < boneCount; bIdx++) {
        const w = boneW[bIdx];
        if (w > w0) {
          w3 = w2; i3 = i2; w2 = w1; i2 = i1; w1 = w0; i1 = i0; w0 = w; i0 = bIdx;
        } else if (w > w1) {
          w3 = w2; i3 = i2; w2 = w1; i2 = i1; w1 = w; i1 = bIdx;
        } else if (w > w2) {
          w3 = w2; i3 = i2; w2 = w; i2 = bIdx;
        } else if (w > w3) {
          w3 = w; i3 = bIdx;
        }
      }
      const total = w0 + w1 + w2 + w3;
      if (total < 1e-6) {
        skinIndex[v * 4] = 1; // hips fallback
        skinWeight[v * 4] = 1;
      } else {
        skinIndex[v * 4] = i0;
        skinIndex[v * 4 + 1] = i1;
        skinIndex[v * 4 + 2] = i2;
        skinIndex[v * 4 + 3] = i3;
        skinWeight[v * 4] = w0 / total;
        skinWeight[v * 4 + 1] = w1 / total;
        skinWeight[v * 4 + 2] = w2 / total;
        skinWeight[v * 4 + 3] = w3 / total;
      }
    }

    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("skinIndex", new THREE.BufferAttribute(skinIndex, 4));
    geo.setAttribute("skinWeight", new THREE.BufferAttribute(skinWeight, 4));
    geo.computeBoundingSphere();
    return geo;
  }

  // ---------------------------------------------------------------------------

  private buildFace(
    plan: AnatomyPlan,
    bones: THREE.Bone[],
    spec: CharacterSpec,
    group: THREE.Group
  ): THREE.Object3D[] {
    const face = plan.face;
    const headBone = bones[face.headBone];
    const headRest = plan.bones[face.headBone].pos;
    const eyes: THREE.Object3D[] = [];

    const eyeGeo = new THREE.SphereGeometry(1, 24, 16);
    const eyeColor = new THREE.Color(spec.palette[2]).multiplyScalar(0.55);
    const eyeMat = new THREE.MeshPhysicalMaterial({
      color: eyeColor,
      roughness: 0.08,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
    });
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });

    for (const dir of [face.eyeDirL, face.eyeDirR]) {
      const surf = projectToSurface(plan.nodes, face.center, dir);
      const r = face.eyeRadius;
      const eyeGroup = new THREE.Group();
      eyeGroup.position.copy(surf).addScaledVector(dir, r * 0.1).sub(headRest);

      const bead = new THREE.Mesh(eyeGeo, eyeMat);
      bead.scale.setScalar(r);
      eyeGroup.add(bead);

      const shine = new THREE.Mesh(eyeGeo, shineMat);
      shine.scale.setScalar(r * 0.32);
      shine.position.set(r * 0.32, r * 0.34, r * 0.72).applyQuaternion(
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize())
      );
      eyeGroup.add(shine);
      const spark = new THREE.Mesh(eyeGeo, shineMat);
      spark.scale.setScalar(r * 0.14);
      spark.position.set(-r * 0.3, -r * 0.25, r * 0.75).applyQuaternion(
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize())
      );
      eyeGroup.add(spark);

      if (spec.eyes === "sleepy") eyeGroup.scale.y = 0.5;
      headBone.add(eyeGroup);
      eyes.push(eyeGroup);
    }

    // mouth: a soft arc sitting on the fused surface
    const mouthSurf = projectToSurface(plan.nodes, face.center, face.mouthDir);
    const arc = Math.PI * 0.62;
    const mouthGeo = new THREE.TorusGeometry(face.mouthWidth, face.mouthWidth * 0.13, 8, 24, arc);
    const grumpy = spec.personality === "grumpy";
    mouthGeo.rotateZ((grumpy ? Math.PI / 2 : -Math.PI / 2) - arc / 2);
    const mouth = new THREE.Mesh(mouthGeo, eyeMat);
    const mDir = face.mouthDir.clone().normalize();
    mouth.position.copy(mouthSurf).addScaledVector(mDir, face.mouthWidth * 0.12).sub(headRest);
    if (grumpy) mouth.position.y -= face.mouthWidth * 0.8;
    mouth.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), mDir);
    mouth.scale.z = 0.35; // flatten against the surface
    headBone.add(mouth);

    void group;
    return eyes;
  }
}
