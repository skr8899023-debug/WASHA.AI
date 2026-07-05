import * as THREE from "three";
import { BlobNode } from "../core/field";
import { RNG } from "../core/rng";
import { CharacterSpec, EarStyle, TailStyle } from "../types";

/**
 * Anatomy planning: turns a CharacterSpec into
 *  - a bone hierarchy (rest pose, identity rotations, world positions)
 *  - a list of blob nodes attached to those bones (the implicit soft body)
 *  - rig metadata (IK legs, arm/wing chains, spring chains, face anchors)
 *
 * Four archetypes cover every spec: biped (legs=2), multiped (legs>=3,
 * generalizes quadruped → centipede), hopper (legs=0) and flyer
 * (movement=fly — a biped whose arms are wings and whose legs dangle).
 */

export interface BoneDef {
  name: string;
  parent: number;
  pos: THREE.Vector3;
}

export interface LegPlan {
  upper: number;
  lower: number;
  foot: number;
  home: THREE.Vector3;
  phase: number;
  /** outward side for IK pole selection: -1 left, +1 right */
  side: number;
  dangle: boolean;
}

export interface ArmPlan {
  shoulder: number;
  fore: number;
  side: number;
  wing: boolean;
}

export type ChainKind = "tail" | "ear" | "antenna";

export interface ChainPlan {
  bones: number[];
  /** rest-pose world tip of the last bone (defines its aim direction/length) */
  tip: THREE.Vector3;
  stiffness: number;
  damping: number;
  gravity: number;
  kind: ChainKind;
  side: number;
}

export interface FacePlan {
  headBone: number;
  center: THREE.Vector3;
  eyeDirL: THREE.Vector3;
  eyeDirR: THREE.Vector3;
  mouthDir: THREE.Vector3;
  eyeRadius: number;
  mouthWidth: number;
}

export interface AnatomyPlan {
  bones: BoneDef[];
  nodes: BlobNode[];
  legs: LegPlan[];
  arms: ArmPlan[];
  chains: ChainPlan[];
  face: FacePlan;
  hipHeight: number;
  bodyRadius: number;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

interface Palette {
  base: THREE.Color;
  belly: THREE.Color;
  dark: THREE.Color;
  blush: THREE.Color;
  tipMix: THREE.Color;
}

function makePalette(spec: CharacterSpec): Palette {
  const base = new THREE.Color(spec.palette[0]);
  const belly = new THREE.Color(spec.palette[1]);
  const dark = new THREE.Color(spec.palette[2]);
  return {
    base,
    belly,
    dark,
    blush: new THREE.Color("#ff6f91").lerp(base, 0.25),
    tipMix: base.clone().lerp(belly, 0.75),
  };
}

class Builder {
  bones: BoneDef[] = [];
  nodes: BlobNode[] = [];
  legs: LegPlan[] = [];
  arms: ArmPlan[] = [];
  chains: ChainPlan[] = [];

  bone(name: string, parent: number, pos: THREE.Vector3): number {
    this.bones.push({ name, parent, pos });
    return this.bones.length - 1;
  }

  cap(
    bone: number,
    a: THREE.Vector3,
    b: THREE.Vector3,
    ra: number,
    rb: number,
    color: THREE.Color,
    blend: number,
    density = 1,
    tint = 1
  ): void {
    this.nodes.push({ a, b, ra, rb, blend, color: color.clone(), bone, density, tint });
  }

  ball(bone: number, c: THREE.Vector3, r: number, color: THREE.Color, blend: number): void {
    this.cap(bone, c, c.clone(), r, r, color, blend);
  }

  /** surface tint with no geometry — belly patches, cheeks, face masks */
  tintBall(c: THREE.Vector3, r: number, color: THREE.Color, strength: number): void {
    this.nodes.push({
      a: c,
      b: c.clone(),
      ra: r,
      rb: r,
      blend: r * 0.5,
      color: color.clone(),
      bone: 0,
      density: 0,
      tint: strength,
    });
  }
}

interface BodyParams {
  len: number;
  rBase: number;
  rTop: number;
}

const BODY: Record<CharacterSpec["body"], BodyParams> = {
  round: { len: 0.3, rBase: 0.3, rTop: 0.27 },
  bean: { len: 0.4, rBase: 0.28, rTop: 0.23 },
  egg: { len: 0.42, rBase: 0.31, rTop: 0.21 },
  pear: { len: 0.38, rBase: 0.33, rTop: 0.2 },
  long: { len: 0.55, rBase: 0.23, rTop: 0.21 },
  blob: { len: 0.2, rBase: 0.37, rTop: 0.3 },
};

// ---------------------------------------------------------------------------
// shared part builders
// ---------------------------------------------------------------------------

function addLeg(
  b: Builder,
  parentBone: number,
  hip: THREE.Vector3,
  side: number,
  phase: number,
  s: number,
  pal: Palette,
  opts: { splay?: number; fwdBias?: number; dangle?: boolean; thick?: number } = {}
): void {
  const splay = (opts.splay ?? 0) * side;
  const fwd = opts.fwdBias ?? 0.02;
  const thick = opts.thick ?? 1;
  const kneeY = hip.y * 0.55;
  const ankleY = Math.max(hip.y * 0.16, 0.075 * s);
  const knee = V(hip.x + splay * 0.6, kneeY, hip.z + fwd * s);
  const ankle = V(hip.x + splay, ankleY, hip.z);

  const upper = b.bone(`leg_${b.legs.length}_upper`, parentBone, hip);
  const lower = b.bone(`leg_${b.legs.length}_lower`, upper, knee);
  const foot = b.bone(`leg_${b.legs.length}_foot`, lower, ankle);

  const rU = 0.085 * s * thick;
  const rL = 0.075 * s * thick;
  b.cap(upper, hip.clone(), knee.clone(), rU, rL, pal.base, 0.1 * s);
  b.cap(lower, knee.clone(), ankle.clone(), rL, rL * 0.92, pal.base, 0.09 * s);
  // foot: a squat forward pad in the "sock" color
  const toe = V(ankle.x, ankle.y - 0.02 * s, ankle.z + 0.13 * s);
  b.cap(foot, ankle.clone(), toe, 0.085 * s * thick, 0.075 * s * thick, pal.belly, 0.08 * s);

  b.legs.push({
    upper,
    lower,
    foot,
    home: V(ankle.x + splay * 0.15, 0, ankle.z + 0.02),
    phase,
    side,
    dangle: opts.dangle ?? false,
  });
}

function addArm(
  b: Builder,
  chestBone: number,
  shoulderPos: THREE.Vector3,
  side: number,
  s: number,
  pal: Palette,
  wing: boolean
): void {
  if (wing) {
    const tipMid = V(shoulderPos.x + side * 0.24 * s, shoulderPos.y + 0.05 * s, shoulderPos.z - 0.02 * s);
    const tipEnd = V(shoulderPos.x + side * 0.48 * s, shoulderPos.y + 0.1 * s, shoulderPos.z - 0.06 * s);
    const shoulder = b.bone(`arm_${side > 0 ? "R" : "L"}_shoulder`, chestBone, shoulderPos);
    const fore = b.bone(`arm_${side > 0 ? "R" : "L"}_fore`, shoulder, tipMid);
    // a fanned pair of tapered capsules reads as a plump little wing
    b.cap(shoulder, shoulderPos.clone(), tipMid.clone(), 0.1 * s, 0.075 * s, pal.base, 0.09 * s);
    b.cap(fore, tipMid.clone(), tipEnd, 0.075 * s, 0.032 * s, pal.tipMix, 0.08 * s);
    const tipEnd2 = V(tipEnd.x - side * 0.05 * s, tipEnd.y - 0.09 * s, tipEnd.z - 0.05 * s);
    b.cap(fore, tipMid.clone(), tipEnd2, 0.06 * s, 0.026 * s, pal.tipMix, 0.07 * s);
    b.arms.push({ shoulder, fore, side, wing: true });
  } else {
    const elbow = V(shoulderPos.x + side * 0.14 * s, shoulderPos.y - 0.16 * s, shoulderPos.z + 0.04 * s);
    const hand = V(elbow.x + side * 0.03 * s, elbow.y - 0.14 * s, elbow.z + 0.06 * s);
    const shoulder = b.bone(`arm_${side > 0 ? "R" : "L"}_shoulder`, chestBone, shoulderPos);
    const fore = b.bone(`arm_${side > 0 ? "R" : "L"}_fore`, shoulder, elbow);
    b.cap(shoulder, shoulderPos.clone(), elbow.clone(), 0.078 * s, 0.066 * s, pal.base, 0.08 * s);
    b.cap(fore, elbow.clone(), hand.clone(), 0.066 * s, 0.06 * s, pal.base, 0.075 * s);
    b.ball(fore, hand, 0.085 * s, pal.belly, 0.07 * s);
    b.arms.push({ shoulder, fore, side, wing: false });
  }
}

function addEar(
  b: Builder,
  headBone: number,
  headCenter: THREE.Vector3,
  headR: number,
  side: number,
  style: EarStyle,
  s: number,
  pal: Palette
): void {
  if (style === "none") return;
  const kind: ChainKind = style === "antennae" ? "antenna" : "ear";

  const base = V(
    headCenter.x + side * headR * (style === "antennae" ? 0.3 : 0.55),
    headCenter.y + headR * (style === "antennae" ? 0.88 : 0.72),
    headCenter.z + (style === "antennae" ? headR * 0.25 : 0)
  );

  let dir: THREE.Vector3;
  let segLen: number;
  let segs: number;
  let r0: number;
  let r1: number;
  let spring: [number, number, number];

  switch (style) {
    case "large_soft":
      dir = V(side * 0.72, 0.62, -0.12).normalize();
      segLen = 0.16 * s;
      segs = 2;
      r0 = 0.105 * s;
      r1 = 0.055 * s;
      spring = [80, 8, 4.6];
      break;
    case "bunny":
      dir = V(side * 0.17, 0.98, -0.06).normalize();
      segLen = 0.2 * s;
      segs = 2;
      r0 = 0.08 * s;
      r1 = 0.052 * s;
      spring = [120, 9, 1.4];
      break;
    case "round":
      dir = V(side * 0.62, 0.78, 0).normalize();
      segLen = 0.11 * s;
      segs = 1;
      r0 = 0.105 * s;
      r1 = 0.09 * s;
      spring = [160, 11, 0.6];
      break;
    case "antennae":
      dir = V(side * 0.34, 0.9, 0.28).normalize();
      segLen = 0.16 * s;
      segs = 2;
      r0 = 0.026 * s;
      r1 = 0.02 * s;
      spring = [70, 5.5, 0.2];
      break;
    case "pointy":
    default:
      dir = V(side * 0.42, 0.88, -0.08).normalize();
      segLen = 0.12 * s;
      segs = 2;
      r0 = 0.075 * s;
      r1 = 0.018 * s;
      spring = [170, 11, 0.5];
      break;
  }

  const boneIdxs: number[] = [];
  let prev = headBone;
  let p = base.clone();
  for (let i = 0; i < segs; i++) {
    const idx = b.bone(`${kind}_${side > 0 ? "R" : "L"}_${i}`, prev, p.clone());
    boneIdxs.push(idx);
    const next = p.clone().addScaledVector(dir, segLen);
    const t0 = i / segs;
    const t1 = (i + 1) / segs;
    const ra = r0 + (r1 - r0) * t0;
    const rb = r0 + (r1 - r0) * t1;
    const col = pal.base.clone().lerp(pal.tipMix, t1 * (style === "pointy" ? 0.4 : 1));
    b.cap(idx, p.clone(), next.clone(), ra, rb, col, 0.07 * s);
    prev = idx;
    p = next;
  }
  if (style === "antennae") {
    // bobble tip in the accent color
    b.ball(boneIdxs[boneIdxs.length - 1], p.clone(), 0.05 * s, pal.dark, 0.05 * s);
  }
  const tip = p.clone().addScaledVector(dir, r1 * 1.5);
  b.chains.push({
    bones: boneIdxs,
    tip,
    stiffness: spring[0],
    damping: spring[1],
    gravity: spring[2],
    kind,
    side,
  });
}

function addTail(
  b: Builder,
  parentBone: number,
  base: THREE.Vector3,
  style: TailStyle,
  s: number,
  pal: Palette
): void {
  if (style === "none") return;

  let pts: THREE.Vector3[];
  let radii: number[];
  let spring: [number, number, number];

  switch (style) {
    case "springy":
      pts = [
        base,
        base.clone().add(V(0, 0.07 * s, -0.13 * s)),
        base.clone().add(V(0, 0.19 * s, -0.2 * s)),
        base.clone().add(V(0, 0.32 * s, -0.18 * s)),
      ];
      radii = [0.07, 0.055, 0.05, 0.085].map((r) => r * s);
      spring = [80, 6, 1.8];
      break;
    case "fluffy":
      pts = [
        base,
        base.clone().add(V(0, 0.06 * s, -0.16 * s)),
        base.clone().add(V(0, 0.16 * s, -0.26 * s)),
      ];
      radii = [0.1, 0.14, 0.11].map((r) => r * s);
      spring = [95, 7.5, 1.2];
      break;
    case "whip":
      pts = [
        base,
        base.clone().add(V(0, 0.02 * s, -0.15 * s)),
        base.clone().add(V(0, 0.06 * s, -0.29 * s)),
        base.clone().add(V(0, 0.12 * s, -0.4 * s)),
        base.clone().add(V(0, 0.2 * s, -0.47 * s)),
      ];
      radii = [0.05, 0.04, 0.032, 0.026, 0.02].map((r) => r * s);
      spring = [90, 6.5, 2.2];
      break;
    case "stub":
    default:
      pts = [base, base.clone().add(V(0, 0.05 * s, -0.11 * s))];
      radii = [0.08, 0.075].map((r) => r * s);
      spring = [150, 10, 1];
      break;
  }

  const boneIdxs: number[] = [];
  let prev = parentBone;
  for (let i = 0; i < pts.length - 1; i++) {
    const idx = b.bone(`tail_${i}`, prev, pts[i].clone());
    boneIdxs.push(idx);
    const t1 = (i + 1) / (pts.length - 1);
    const col = pal.base.clone().lerp(pal.tipMix, t1 * 0.9);
    b.cap(idx, pts[i].clone(), pts[i + 1].clone(), radii[i], radii[i + 1], col, 0.09 * s);
    prev = idx;
  }
  const last = pts[pts.length - 1];
  const dir = last.clone().sub(pts[pts.length - 2]).normalize();
  b.chains.push({
    bones: boneIdxs,
    tip: last.clone().addScaledVector(dir, radii[radii.length - 1]),
    stiffness: spring[0],
    damping: spring[1],
    gravity: spring[2],
    kind: "tail",
    side: 0,
  });
}

interface HeadResult {
  headBone: number;
  center: THREE.Vector3;
  r: number;
  faceForward: THREE.Vector3;
}

function addHead(
  b: Builder,
  neckParent: number,
  neckPos: THREE.Vector3,
  center: THREE.Vector3,
  r: number,
  spec: CharacterSpec,
  s: number,
  pal: Palette,
  faceForward: THREE.Vector3
): HeadResult {
  const neck = b.bone("neck", neckParent, neckPos);
  const headBone = b.bone("head", neck, center.clone());

  if (spec.head === "broad") {
    b.cap(
      headBone,
      V(center.x - r * 0.42, center.y, center.z),
      V(center.x + r * 0.42, center.y, center.z),
      r * 0.82,
      r * 0.82,
      pal.base,
      0.15 * s
    );
  } else {
    b.ball(headBone, center.clone(), r, pal.base, 0.15 * s);
  }

  if (spec.head === "muzzle") {
    const fwd = faceForward.clone().normalize();
    const snoutBase = center.clone().addScaledVector(fwd, r * 0.55).add(V(0, -r * 0.28, 0));
    const snoutTip = center.clone().addScaledVector(fwd, r * 1.18).add(V(0, -r * 0.34, 0));
    b.cap(headBone, snoutBase, snoutTip.clone(), r * 0.4, r * 0.3, pal.base, 0.1 * s);
    // nose bead + muzzle tint
    b.ball(headBone, snoutTip.clone().addScaledVector(fwd, r * 0.16).add(V(0, r * 0.1, 0)), r * 0.14, pal.dark, 0.045 * s);
    b.tintBall(snoutTip.clone().add(V(0, -r * 0.05, 0)), r * 0.5, pal.belly, 1.4);
  }
  return { headBone, center, r, faceForward };
}

function facePlan(
  head: HeadResult,
  spec: CharacterSpec,
  b: Builder,
  s: number,
  pal: Palette
): FacePlan {
  const fwd = head.faceForward.clone().normalize();
  const upMix = spec.head === "muzzle" ? 0.18 : 0.16;
  let spread = 0.42;
  let eyeR = head.r * 0.3;
  switch (spec.eyes) {
    case "big_curious":
      spread = 0.4;
      eyeR = head.r * 0.33;
      break;
    case "wide":
      spread = 0.62;
      eyeR = head.r * 0.28;
      break;
    case "dot_shy":
      spread = 0.38;
      eyeR = head.r * 0.15;
      break;
    case "sleepy":
      spread = 0.44;
      eyeR = head.r * 0.3;
      break;
  }
  const side = new THREE.Vector3(1, 0, 0);
  const up = new THREE.Vector3(0, 1, 0);
  const eyeDirL = fwd.clone().addScaledVector(side, -spread).addScaledVector(up, upMix).normalize();
  const eyeDirR = fwd.clone().addScaledVector(side, spread).addScaledVector(up, upMix).normalize();
  const mouthDir = fwd.clone().addScaledVector(up, spec.head === "muzzle" ? -0.5 : -0.34).normalize();

  // blushy cheeks + a soft face mask, baked straight into vertex color
  const cheekL = head.center.clone().addScaledVector(eyeDirL, head.r * 0.94).add(V(0, -head.r * 0.42, 0));
  const cheekR = head.center.clone().addScaledVector(eyeDirR, head.r * 0.94).add(V(0, -head.r * 0.42, 0));
  b.tintBall(cheekL, head.r * 0.28, pal.blush, 1.6);
  b.tintBall(cheekR, head.r * 0.28, pal.blush, 1.6);
  if (spec.head !== "muzzle") {
    const mask = head.center.clone().addScaledVector(fwd, head.r * 0.78).add(V(0, -head.r * 0.2, 0));
    b.tintBall(mask, head.r * 0.55, pal.belly, 0.75);
  }

  return {
    headBone: head.headBone,
    center: head.center,
    eyeDirL,
    eyeDirR,
    mouthDir,
    eyeRadius: eyeR * s,
    mouthWidth: head.r * 0.34,
  };
}

// ---------------------------------------------------------------------------
// archetypes
// ---------------------------------------------------------------------------

function buildBiped(spec: CharacterSpec, b: Builder, pal: Palette, flyer: boolean): AnatomyPlan {
  const s = spec.size;
  const bp = BODY[spec.body];
  const hipY = flyer ? 0.46 * s : 0.5 * s;
  const bodyBot = V(0, hipY + 0.02 * s, 0);
  const bodyTop = V(0, hipY + bp.len * s, 0.01 * s);

  const root = b.bone("root", -1, V(0, 0, 0));
  const hips = b.bone("hips", root, V(0, hipY, 0));
  const chest = b.bone("chest", hips, V(0, hipY + bp.len * 0.62 * s, 0));

  b.cap(hips, bodyBot, V(0, hipY + bp.len * 0.45 * s, 0), bp.rBase * s, (bp.rBase + bp.rTop) * 0.5 * s, pal.base, 0.18 * s);
  b.cap(chest, V(0, hipY + bp.len * 0.45 * s, 0), bodyTop.clone(), (bp.rBase + bp.rTop) * 0.5 * s, bp.rTop * s, pal.base, 0.18 * s);
  // belly tint
  b.tintBall(V(0, hipY + bp.len * 0.18 * s, bp.rBase * 0.86 * s), bp.rBase * 0.62 * s, pal.belly, 1.5);

  const headR = 0.24 * s * (spec.head === "broad" ? 1.05 : 1);
  const headCenter = V(0, bodyTop.y + headR * 0.62, 0.03 * s);
  const head = addHead(b, chest, V(0, bodyTop.y - 0.02 * s, 0.02 * s), headCenter, headR, spec, s, pal, V(0, 0, 1));

  const hipHalf = bp.rBase * 0.5 * s;
  for (const side of [-1, 1]) {
    addLeg(b, hips, V(side * hipHalf, hipY - 0.02 * s, 0.01 * s), side, side < 0 ? 0 : 0.5, s, pal, {
      dangle: flyer,
      thick: flyer ? 0.72 : 1.06,
    });
  }
  const armCount = Math.min(2, Math.max(0, spec.arms));
  for (let i = 0; i < armCount; i++) {
    const side = i === 0 ? -1 : 1;
    addArm(b, chest, V(side * (bp.rTop + 0.04) * s, bodyTop.y - 0.05 * s, 0.03 * s), side, s, pal, flyer);
  }

  addEar(b, head.headBone, headCenter, headR, -1, spec.ears, s, pal);
  addEar(b, head.headBone, headCenter, headR, 1, spec.ears, s, pal);
  addTail(b, hips, V(0, hipY + 0.04 * s, -bp.rBase * 0.88 * s), spec.tail, s, pal);

  return {
    bones: b.bones,
    nodes: b.nodes,
    legs: b.legs,
    arms: b.arms,
    chains: b.chains,
    face: facePlan(head, spec, b, s, pal),
    hipHeight: hipY,
    bodyRadius: bp.rBase * s,
  };
}

function buildMultiped(spec: CharacterSpec, b: Builder, pal: Palette): AnatomyPlan {
  const s = spec.size;
  const bp = BODY[spec.body];
  const rows = Math.ceil(spec.legs / 2);
  const bodyLen = (0.5 + rows * 0.16) * s * (bp.len / 0.38 + 0.55) * 0.55;
  const bodyY = 0.5 * s;
  const rBack = bp.rBase * 0.88 * s;
  const rFront = bp.rTop * 1.12 * s;

  const back = V(0, bodyY - 0.02 * s, -bodyLen * 0.5);
  const front = V(0, bodyY + 0.04 * s, bodyLen * 0.5);

  const root = b.bone("root", -1, V(0, 0, 0));
  const hips = b.bone("hips", root, V(0, bodyY, -bodyLen * 0.2));
  const chest = b.bone("chest", hips, V(0, bodyY + 0.02 * s, bodyLen * 0.24));

  const mid = V(0, bodyY + 0.02 * s, 0);
  b.cap(hips, back.clone(), mid.clone(), rBack, (rBack + rFront) * 0.5, pal.base, 0.17 * s);
  b.cap(chest, mid.clone(), front.clone(), (rBack + rFront) * 0.5, rFront, pal.base, 0.17 * s);
  b.tintBall(V(0, bodyY - rBack * 0.72, bodyLen * 0.05), rBack * 0.8, pal.belly, 1.4);

  const headR = 0.21 * s * (spec.head === "broad" ? 1.08 : 1);
  const headCenter = V(0, bodyY + 0.34 * s, bodyLen * 0.5 + headR * 0.95);
  const head = addHead(
    b,
    chest,
    V(0, bodyY + 0.16 * s, bodyLen * 0.48),
    headCenter,
    headR,
    spec,
    s,
    pal,
    V(0, -0.12, 1).normalize()
  );

  const bug = spec.legs > 4;
  const hipX = (bug ? 0.66 : 0.52) * rBack;
  for (let row = 0; row < rows; row++) {
    const t = rows === 1 ? 0.5 : row / (rows - 1);
    const z = THREE.MathUtils.lerp(bodyLen * 0.38, -bodyLen * 0.38, t);
    for (const side of [-1, 1]) {
      if (b.legs.length >= spec.legs) break;
      // trot diagonals for 4 legs, alternating tripod for 6+
      const phase = spec.legs === 4 ? ((row + (side > 0 ? 1 : 0)) % 2) * 0.5 : ((row + (side > 0 ? 1 : 0)) % 2) * 0.5;
      addLeg(b, row < rows / 2 ? chest : hips, V(side * hipX, bodyY - 0.03 * s, z), side, phase, s, pal, {
        splay: bug ? 0.14 * s : 0.02 * s,
        thick: bug ? 0.7 : 1.05,
      });
    }
  }

  addEar(b, head.headBone, headCenter, headR, -1, spec.ears, s, pal);
  addEar(b, head.headBone, headCenter, headR, 1, spec.ears, s, pal);
  addTail(b, hips, V(0, bodyY + 0.03 * s, -bodyLen * 0.5 - rBack * 0.4), spec.tail, s, pal);

  return {
    bones: b.bones,
    nodes: b.nodes,
    legs: b.legs,
    arms: b.arms,
    chains: b.chains,
    face: facePlan(head, spec, b, s, pal),
    hipHeight: bodyY,
    bodyRadius: Math.max(rBack, bodyLen * 0.55),
  };
}

function buildHopper(spec: CharacterSpec, b: Builder, pal: Palette): AnatomyPlan {
  const s = spec.size;
  const bp = BODY[spec.body];
  const r = Math.max(bp.rBase, 0.34) * 1.16 * s;
  const cy = r * 0.92;

  const root = b.bone("root", -1, V(0, 0, 0));
  const hips = b.bone("hips", root, V(0, cy, 0));
  const chest = b.bone("chest", hips, V(0, cy + r * 0.4, 0));

  // pudding body: heavy base, soft crown
  b.cap(hips, V(0, cy - r * 0.14, 0), V(0, cy + r * 0.18, 0), r, r * 0.9, pal.base, 0.2 * s);
  b.ball(chest, V(0, cy + r * 0.52, 0.02 * s), r * 0.66, pal.base, 0.2 * s);
  b.tintBall(V(0, cy - r * 0.26, r * 0.92), r * 0.7, pal.belly, 1.5);

  // face lives directly on the body
  const neck = b.bone("neck", chest, V(0, cy + r * 0.5, 0));
  const headBone = b.bone("head", neck, V(0, cy + r * 0.55, 0.05 * s));
  const head: HeadResult = {
    headBone,
    center: V(0, cy + r * 0.42, 0.06 * s),
    r: r * 0.78,
    faceForward: V(0, 0.08, 1).normalize(),
  };

  const armCount = Math.min(2, Math.max(0, spec.arms));
  for (let i = 0; i < armCount; i++) {
    const side = i === 0 ? -1 : 1;
    addArm(b, chest, V(side * r * 0.82, cy + r * 0.28, 0.03 * s), side, s * 0.85, pal, false);
  }

  addEar(b, headBone, head.center, head.r * 0.9, -1, spec.ears, s, pal);
  addEar(b, headBone, head.center, head.r * 0.9, 1, spec.ears, s, pal);
  addTail(b, hips, V(0, cy - r * 0.1, -r * 0.86), spec.tail, s, pal);

  return {
    bones: b.bones,
    nodes: b.nodes,
    legs: b.legs,
    arms: b.arms,
    chains: b.chains,
    face: facePlan(head, spec, b, s, pal),
    hipHeight: cy,
    bodyRadius: r,
  };
}

export function buildAnatomy(spec: CharacterSpec, _rng: RNG): AnatomyPlan {
  const pal = makePalette(spec);
  const b = new Builder();
  if (spec.movement === "fly") return buildBiped(spec, b, pal, true);
  if (spec.legs <= 1) return buildHopper(spec, b, pal);
  if (spec.legs === 2) return buildBiped(spec, b, pal, false);
  return buildMultiped(spec, b, pal);
}
