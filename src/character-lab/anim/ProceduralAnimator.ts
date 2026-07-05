import * as THREE from "three";
import { BuiltCharacter } from "../factory/CharacterFactory";
import { Personality } from "../types";
import { damp, setBoneWorldQuaternion, solveTwoBoneIK, wrapAngle } from "./boneUtils";
import { RNG } from "../core/rng";

/**
 * ProceduralAnimator — no animation files, ever.
 *
 * One update() drives:
 *   locomotion  — gait IK for 2/4/6/8-legged walkers (phase-offset stepping),
 *                 spring-timed hopping with anticipation squash + landing
 *                 wobble, or hover-flight with wing flaps and banking turns
 *   steering    — characters wander a small roam disc with smooth heading
 *   secondary   — every ear/tail/antenna is a SpringChain fed by body motion
 *   life        — breathing, blinks, micro head noise, personality scaling
 *
 * Squash & stretch is applied on bones (volume-preserving scale), so the
 * fused skinning stretches the whole soft body like real puppet rubber.
 */

interface PersonalityTuning {
  tempo: number;
  amp: number;
  wag: number;
  blink: number;
  headBob: number;
  earMood: number; // -1 droopy/back … +1 perky
}

const PERSONALITY: Record<Personality, PersonalityTuning> = {
  playful: { tempo: 1.12, amp: 1.2, wag: 1.7, blink: 1, headBob: 1.2, earMood: 0.5 },
  shy: { tempo: 0.85, amp: 0.7, wag: 0.6, blink: 1.5, headBob: 0.7, earMood: -0.55 },
  zen: { tempo: 0.62, amp: 0.55, wag: 0.35, blink: 0.5, headBob: 0.5, earMood: 0.1 },
  grumpy: { tempo: 0.9, amp: 0.72, wag: 0.25, blink: 0.8, headBob: 0.6, earMood: -0.8 },
  manic: { tempo: 1.55, amp: 1.4, wag: 2.3, blink: 1.9, headBob: 1.5, earMood: 0.8 },
};

const BASE_SPEED: Record<string, number> = {
  bouncy_walk: 0.55,
  waddle: 0.4,
  trot: 0.8,
  scuttle: 0.72,
  hop: 0.6,
  fly: 0.85,
};

export interface RoamArea {
  x: number;
  z: number;
  r: number;
}

/**
 * Who decides where the creature goes:
 *  - wander: autonomous roaming inside the area (the sandbox default)
 *  - drive:  external input vector (the player)
 *  - flee:   run away from `fleeFrom` with panicky wiggle (chase targets)
 */
export type ControlMode = "wander" | "drive" | "flee";

const _v1 = new THREE.Vector3();
const _pole = new THREE.Vector3();
const _yawQ = new THREE.Quaternion();
const _tiltQ = new THREE.Quaternion();
const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);

export class ProceduralAnimator {
  /** steering source — see ControlMode */
  controlMode: ControlMode = "wander";
  /** desired world-XZ direction when controlMode === "drive" (x → X, y → Z) */
  readonly driveInput = new THREE.Vector2();
  /** object to run away from when controlMode === "flee" */
  fleeFrom: THREE.Object3D | null = null;
  /** external speed scaling (gameplay balancing) */
  speedMultiplier = 1;

  private tune: PersonalityTuning;
  private mode: "walk" | "hop" | "fly";
  private speed: number;
  private stepFreq: number;

  private heading: number;
  private turnRate = 0;
  private pos = new THREE.Vector2();
  private phase = 0;
  private seedA: number;
  private seedB: number;
  /** smoothed 0..1 "how much am I moving" — blends gait ↔ idle */
  private moveScale = 1;

  private blinkTimer: number;
  private blinkPhase = -1; // <0 idle, otherwise 0..1 through a blink

  constructor(
    private c: BuiltCharacter,
    private area: RoamArea = { x: 0, z: 0, r: 2.1 }
  ) {
    const rng = new RNG(c.spec.seed ^ 0x5f3759df);
    this.tune = PERSONALITY[c.spec.personality];
    const movement = c.spec.movement;
    this.mode = movement === "fly" ? "fly" : movement === "hop" && c.spec.legs === 0 ? "hop" : "walk";
    this.speed = (BASE_SPEED[movement] ?? 0.55) * this.tune.tempo * c.spec.size;

    const perStep: Record<string, number> = {
      bouncy_walk: 1.9,
      waddle: 1.7,
      trot: 2.5,
      scuttle: 3.4,
      hop: 1.05,
      fly: 1,
    };
    this.stepFreq = (perStep[movement] ?? 2) * this.tune.tempo;

    // spawn near the roam center, loosely facing the default camera
    this.heading = 0.6 + rng.range(-0.5, 0.5);
    this.pos.set(area.x + rng.range(-0.2, 0.2) * area.r, area.z + rng.range(-0.2, 0.2) * area.r);
    this.seedA = rng.range(0, 100);
    this.seedB = rng.range(0, 100);
    this.blinkTimer = rng.range(1, 3);
  }

  get baseSpeed(): number {
    return this.speed;
  }

  get worldPosition(): THREE.Vector3 {
    return this.c.group.position;
  }

  /** teleport (spawns, level layout) — also resets springs so nothing whips */
  setPlacement(x: number, z: number, heading = this.heading): void {
    this.pos.set(x, z);
    this.heading = heading;
    this.turnRate = 0;
    this.c.group.position.set(x, this.c.group.position.y, z);
    this.c.group.quaternion.setFromAxisAngle(AXIS_Y, heading);
    for (const s of this.c.springs) s.reset();
  }

  update(dtIn: number, t: number): void {
    const dt = Math.min(dtIn, 0.05);
    const g = this.c.group;

    this.steer(dt, t);

    switch (this.mode) {
      case "hop":
        this.updateHop(dt, t);
        break;
      case "fly":
        this.updateFly(dt, t);
        break;
      default:
        this.updateWalk(dt, t);
        break;
    }

    this.updateLife(dt, t);

    // one full refresh, then IK + springs patch their own subtrees
    g.updateMatrixWorld(true);

    if (this.mode === "walk") this.solveFeet(t);
    if (this.mode === "fly") this.dangleLegs(t);

    for (const chain of this.c.springs) {
      this.applyChainMood(chain, t);
      chain.update(dt);
    }

    this.updateShadow();
  }

  // -- steering ---------------------------------------------------------------

  private steer(dt: number, t: number): void {
    let target = 0;
    let desiredScale = 1;
    const dx = this.pos.x - this.area.x;
    const dz = this.pos.y - this.area.z;
    const r = Math.hypot(dx, dz);

    if (this.controlMode === "drive") {
      const len = this.driveInput.length();
      if (len > 0.08) {
        const desired = Math.atan2(this.driveInput.x, this.driveInput.y);
        target = wrapAngle(desired - this.heading) * 5;
        desiredScale = Math.min(1, len);
      } else {
        desiredScale = 0;
      }
      this.turnRate = damp(this.turnRate, target, 8, dt);
    } else if (this.controlMode === "flee" && this.fleeFrom) {
      const fx = this.pos.x - this.fleeFrom.position.x;
      const fz = this.pos.y - this.fleeFrom.position.z;
      const away = Math.atan2(fx, fz);
      target = wrapAngle(away - this.heading) * 2.6 + Math.sin(t * 2.1 + this.seedA) * 0.7;
      desiredScale = 0.86 + 0.18 * Math.sin(t * 3.1 + this.seedB);
      if (r > this.area.r) {
        const toCenter = Math.atan2(-dx, -dz);
        target = wrapAngle(toCenter - this.heading) * 2.6;
      }
      this.turnRate = damp(this.turnRate, target, 3.5, dt);
    } else {
      target = Math.sin(t * 0.31 + this.seedA) * 0.55 + Math.sin(t * 0.13 + this.seedB) * 0.45;
      if (r > this.area.r) {
        const toCenter = Math.atan2(-dx, -dz);
        target = wrapAngle(toCenter - this.heading) * 2.2;
      }
      this.turnRate = damp(this.turnRate, target, 3, dt);
    }

    this.heading += this.turnRate * dt;
    this.moveScale = damp(this.moveScale, desiredScale, 6, dt);
  }

  private advance(dt: number, speedScale = 1): void {
    const v = this.speed * this.speedMultiplier * this.moveScale * speedScale;
    this.pos.x += Math.sin(this.heading) * v * dt;
    this.pos.y += Math.cos(this.heading) * v * dt;
    if (this.controlMode === "drive") {
      // the player never leaves the arena
      const dx = this.pos.x - this.area.x;
      const dz = this.pos.y - this.area.z;
      const r = Math.hypot(dx, dz);
      if (r > this.area.r) {
        const k = this.area.r / r;
        this.pos.x = this.area.x + dx * k;
        this.pos.y = this.area.z + dz * k;
      }
    }
  }

  // -- locomotion modes ---------------------------------------------------------

  private updateWalk(dt: number, t: number): void {
    const c = this.c;
    const g = c.group;
    const tune = this.tune;
    const waddle = c.spec.movement === "waddle";
    const scuttle = c.spec.movement === "scuttle";
    const extraBounce = c.spec.movement === "hop" ? 1.35 : 1; // legged "hoppers" bounce hard

    const mv = this.moveScale;
    this.advance(dt);
    this.phase += dt * this.stepFreq * Math.max(mv, 0.02);
    const ph = this.phase;

    g.position.set(this.pos.x, 0, this.pos.y);
    _yawQ.setFromAxisAngle(AXIS_Y, this.heading);
    g.quaternion.copy(_yawQ);

    const hips = c.bones.hips;
    const rest = hips.userData.restLocal as THREE.Vector3;
    const bobAmp = (waddle ? 0.02 : 0.03) * tune.amp * extraBounce * c.spec.size * mv;
    hips.position.y = rest.y + bobAmp * (0.5 - 0.5 * Math.cos(ph * Math.PI * 4));
    const roll = (waddle ? 0.14 : scuttle ? 0.02 : 0.05) * tune.amp * Math.sin(ph * Math.PI * 2) * mv;
    const pitch = 0.03 * this.speed * mv;
    const yawWiggle = scuttle ? 0.05 * Math.sin(ph * Math.PI * 2) * mv : 0;
    hips.quaternion
      .setFromAxisAngle(AXIS_Z, roll)
      .multiply(_tiltQ.setFromAxisAngle(AXIS_X, pitch))
      .multiply(_tiltQ.setFromAxisAngle(AXIS_Y, yawWiggle));

    // vertical squash synced with the bounce (volume preserved)
    const squash = 1 + 0.05 * tune.amp * extraBounce * Math.sin(ph * Math.PI * 4) * mv;
    hips.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));

    // arms swing (or flap excitedly for manic critters)
    for (const arm of c.arms) {
      if (arm.wing) {
        arm.shoulder.rotation.set(0, 0, -arm.side * (0.25 + 0.12 * Math.sin(t * 3 + this.seedA)));
        arm.fore.rotation.set(0, 0, -arm.side * 0.2);
      } else {
        const swing = 0.45 * tune.amp * mv * Math.sin(ph * Math.PI * 2 + (arm.side > 0 ? 0 : Math.PI));
        arm.shoulder.rotation.set(swing, 0, -arm.side * 0.12);
        arm.fore.rotation.set(swing * 0.5, 0, 0);
      }
    }
  }

  private solveFeet(t: number): void {
    const c = this.c;
    const stepH = 0.085 * this.tune.amp * c.spec.size * this.moveScale;
    const stride = Math.min(0.16 * c.spec.size, this.speed * 0.32) * this.moveScale;
    const bug = c.spec.legs > 4;

    for (const leg of c.legs) {
      if (leg.dangle) continue;
      const ph = (this.phase + leg.phase) * Math.PI * 2;
      const lift = Math.max(0, Math.sin(ph));
      _v1.copy(leg.home);
      _v1.z += stride * Math.cos(ph);
      _v1.y = stepH * lift * lift;
      _v1.applyMatrix4(c.group.matrixWorld);

      if (bug) _pole.set(leg.side, 0.3, 0).applyQuaternion(c.group.quaternion);
      else _pole.set(0, 0.15, 1).applyQuaternion(c.group.quaternion);

      solveTwoBoneIK(leg, _v1, _pole);
      _yawQ.setFromAxisAngle(AXIS_Y, this.heading);
      setBoneWorldQuaternion(leg.foot, _yawQ);
    }
    void t;
  }

  private updateHop(dt: number, t: number): void {
    const c = this.c;
    const g = c.group;
    const tune = this.tune;

    this.phase += dt * this.stepFreq * (0.35 + 0.65 * this.moveScale);
    const hp = this.phase % 1;
    const H = 0.34 * tune.amp * c.spec.size * (0.4 + 0.6 * this.moveScale);

    const CROUCH = 0.3;
    const PUSH = 0.42;
    const LAND = 0.86;

    let y = 0;
    let squash = 1;
    let pitch = 0;
    let airFrac = 0;

    if (hp < CROUCH) {
      const k = hp / CROUCH;
      squash = 1 - 0.2 * smooth01(k);
      pitch = 0.08 * k;
    } else if (hp < PUSH) {
      const k = (hp - CROUCH) / (PUSH - CROUCH);
      squash = THREE.MathUtils.lerp(0.8, 1.18, easeOutCubic(k));
      y = 0.03 * k;
      pitch = 0.08 - 0.18 * k;
    } else if (hp < LAND) {
      const k = (hp - PUSH) / (LAND - PUSH);
      y = H * 4 * k * (1 - k) + 0.03;
      squash = THREE.MathUtils.lerp(1.18, 1.0, Math.min(1, k * 1.6));
      pitch = -0.1 + 0.26 * k;
      airFrac = 1 / (LAND - PUSH);
    } else {
      const k = (hp - LAND) / (1 - LAND);
      squash = 1 - 0.17 * Math.sin(k * Math.PI);
      pitch = 0.16 * (1 - k);
    }

    // forward travel happens only while airborne
    this.advance(dt, airFrac * (LAND - PUSH) * 2.4);

    g.position.set(this.pos.x, y, this.pos.y);
    _yawQ.setFromAxisAngle(AXIS_Y, this.heading);
    _tiltQ.setFromAxisAngle(AXIS_X, pitch);
    g.quaternion.copy(_yawQ).multiply(_tiltQ);

    const root = c.bones.root;
    root.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));

    for (const arm of c.arms) {
      const up = squash > 1.05 ? 0.9 : 0.15;
      arm.shoulder.rotation.set(0, 0, -arm.side * (up + 0.1 * Math.sin(t * 5)));
      arm.fore.rotation.set(0, 0, -arm.side * 0.25);
    }
  }

  private updateFly(dt: number, t: number): void {
    const c = this.c;
    const g = c.group;
    const tune = this.tune;

    this.advance(dt);
    const hover = 0.85 * c.spec.size + 0.11 * tune.amp * Math.sin(t * 2.3 + this.seedA);

    g.position.set(this.pos.x, hover, this.pos.y);
    const bank = -this.turnRate * 0.55;
    const pitch = 0.1 + 0.05 * Math.sin(t * 2.3 + this.seedA + 1.3);
    _yawQ.setFromAxisAngle(AXIS_Y, this.heading);
    g.quaternion
      .copy(_yawQ)
      .multiply(_tiltQ.setFromAxisAngle(AXIS_X, pitch))
      .multiply(_tiltQ.setFromAxisAngle(AXIS_Z, bank));

    // wing flap with tip lag — the flap also pumps a little body bounce
    const flapHz = 2.7 * tune.tempo;
    const flap = Math.sin(t * Math.PI * 2 * flapHz);
    const flapLag = Math.sin(t * Math.PI * 2 * flapHz - 0.9);
    for (const arm of c.arms) {
      arm.shoulder.rotation.set(0, 0, -arm.side * (0.72 * flap * tune.amp + 0.18));
      arm.fore.rotation.set(0, 0, -arm.side * 0.55 * flapLag * tune.amp);
    }
    const hips = c.bones.hips;
    const rest = hips.userData.restLocal as THREE.Vector3;
    hips.position.y = rest.y + 0.015 * flapLag;

    const squash = 1 + 0.035 * flap;
    hips.scale.set(1 / Math.sqrt(squash), squash, 1 / Math.sqrt(squash));
    void dt;
  }

  private dangleLegs(t: number): void {
    let i = 0;
    for (const leg of this.c.legs) {
      const sway = Math.sin(t * 2.3 + this.seedA + i * 1.7);
      leg.upper.rotation.set(0.35 + 0.1 * sway, 0, -leg.side * 0.08);
      leg.lower.rotation.set(0.25 + 0.12 * Math.sin(t * 2.3 + this.seedA + i * 1.7 - 0.6), 0, 0);
      leg.upper.updateWorldMatrix(false, false);
      leg.lower.updateWorldMatrix(false, false);
      i++;
    }
  }

  // -- life: breath, blink, head noise, ear/tail mood ---------------------------

  private updateLife(dt: number, t: number): void {
    const c = this.c;
    const tune = this.tune;

    const chest = c.bones.chest;
    if (chest) {
      const breath = 1 + 0.028 * Math.sin(t * Math.PI * 2 * 0.42 * tune.tempo + this.seedB);
      chest.scale.set(breath, breath, breath);
    }

    const head = c.bones.head;
    if (head) {
      const lookY = 0.24 * tune.headBob * (Math.sin(t * 0.7 + this.seedA) * 0.6 + Math.sin(t * 0.23 + this.seedB) * 0.4);
      const nodX =
        0.06 * tune.headBob * Math.sin(this.phase * Math.PI * 4 + 1.2) +
        (c.spec.personality === "shy" ? 0.14 : c.spec.personality === "grumpy" ? 0.1 : 0);
      head.quaternion
        .setFromAxisAngle(AXIS_Y, lookY)
        .multiply(_tiltQ.setFromAxisAngle(AXIS_X, nodX));
    }

    // blinking
    this.blinkTimer -= dt;
    if (this.blinkTimer <= 0 && this.blinkPhase < 0) {
      this.blinkPhase = 0;
      this.blinkTimer = (1.6 + Math.abs(Math.sin(t * 7.3 + this.seedA)) * 3.4) / tune.blink;
    }
    if (this.blinkPhase >= 0) {
      this.blinkPhase += dt / 0.16;
      const k = this.blinkPhase;
      const lid = k >= 1 ? 1 : 1 - Math.sin(Math.min(1, k) * Math.PI) * 0.92;
      const base = c.spec.eyes === "sleepy" ? 0.5 : 1;
      for (const eye of c.eyes) eye.scale.y = base * lid;
      if (k >= 1) this.blinkPhase = -1;
    }
  }

  private applyChainMood(chain: { kind: string; side: number; swayY: number; swayZ: number }, t: number): void {
    const tune = this.tune;
    if (chain.kind === "tail") {
      chain.swayY = 0.5 * tune.wag * Math.sin(t * Math.PI * 2 * 1.15 * tune.tempo + this.seedA);
      chain.swayZ = 0;
    } else {
      // ears/antennae: mood pose — perky up or drooped back
      chain.swayZ = chain.side * -0.28 * tune.earMood;
      chain.swayY = chain.side * 0.15 * tune.earMood;
    }
  }

  private updateShadow(): void {
    const c = this.c;
    const h = Math.max(0, c.group.position.y);
    const fade = THREE.MathUtils.clamp(1 - h * 0.55, 0.25, 1);
    c.shadow.position.x = c.group.position.x;
    c.shadow.position.z = c.group.position.z;
    c.shadow.scale.setScalar(c.shadowBaseScale * (0.75 + 0.25 * fade));
    (c.shadow.material as THREE.MeshBasicMaterial).opacity = fade;
  }
}

function smooth01(x: number): number {
  return x * x * (3 - 2 * x);
}

function easeOutCubic(x: number): number {
  const k = 1 - x;
  return 1 - k * k * k;
}
