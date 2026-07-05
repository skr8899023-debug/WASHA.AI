import * as THREE from "three";
import { RNG } from "../core/rng";
import { randomSpec } from "../presets";
import { CharacterSpec, CharacterSpecInput } from "../types";
import { GameStage, LiveCharacter } from "./stage";
import { sfx } from "./sfx";

/**
 * Mission #1 — the Chase. A mystery egg drops into the arena, wobbles, and
 * hatches a brand-new procedurally generated creature (the ~150 ms bake hides
 * inside the wobble, so hatching feels instant). The creature flees in a
 * panic; catch it before the timer runs out.
 *
 * Missions implement this same shape (start / update / cleanup) so racing,
 * herding and puzzle modes can slot into GameDirector later.
 */

export type MissionTick = "playing" | "caught" | "timeout";

export interface MissionUI {
  toast(msg: string): void;
}

const ARENA_R = 3;
const INTRO_DUR = 1.35;

export class ChaseMission {
  readonly timeTotal: number;
  timeLeft: number;

  private state: "intro" | "chase" = "intro";
  private introT = 0;
  private lastTick = -1;
  private egg: THREE.Group | null = null;
  private target: LiveCharacter | null = null;
  private speedFactor: number;

  constructor(
    level: number,
    private stage: GameStage,
    private player: LiveCharacter,
    private rng: RNG,
    private ui: MissionUI
  ) {
    this.timeTotal = Math.max(26 - level * 2, 12);
    this.timeLeft = this.timeTotal;
    this.speedFactor = Math.min(0.68 + level * 0.055, 1.0);
  }

  get live(): LiveCharacter | null {
    return this.target;
  }

  get progress(): number {
    return this.timeLeft / this.timeTotal;
  }

  get running(): boolean {
    return this.state === "chase";
  }

  start(): void {
    // spawn the egg away from the player
    const pp = this.player.built.group.position;
    let ang = Math.atan2(-pp.x, -pp.z) + this.rng.range(-0.9, 0.9);
    if (pp.lengthSq() < 0.2) ang = this.rng.range(0, Math.PI * 2);
    const d = ARENA_R * 0.68;
    const ex = Math.sin(ang) * d;
    const ez = Math.cos(ang) * d;

    this.egg = makeEgg();
    this.egg.position.set(ex, 0, ez);
    this.stage.scene.add(this.egg);

    // bake the surprise now, keep it hidden until the shell cracks
    let spec: CharacterSpecInput = randomSpec(this.rng);
    for (let i = 0; i < 8 && spec.movement === "fly"; i++) spec = randomSpec(this.rng);
    const target = this.stage.add(spec, { x: 0, z: 0, r: ARENA_R * 0.96 });
    if (!target) return;
    this.target = target;
    target.built.group.visible = false;
    target.built.shadow.visible = false;
    target.animator.setPlacement(ex, ez, this.rng.range(0, Math.PI * 2));
    target.animator.controlMode = "flee";
    target.animator.fleeFrom = this.player.built.group;
    target.animator.speedMultiplier = (0.95 * this.speedFactor) / Math.max(target.animator.baseSpeed, 0.05);
  }

  update(dt: number): MissionTick {
    if (this.state === "intro") {
      this.introT += dt;
      if (this.egg) {
        const k = this.introT / INTRO_DUR;
        this.egg.rotation.z = Math.sin(this.introT * 22) * 0.16 * k;
        const s = 1 + 0.06 * Math.sin(this.introT * 30) * k;
        this.egg.scale.set(s, 1 / s, s);
        const step = Math.floor(k * 3);
        if (step !== this.lastTick) {
          this.lastTick = step;
          sfx.tick();
        }
      }
      if (this.introT >= INTRO_DUR) this.hatch();
      return "playing";
    }

    this.timeLeft -= dt;
    if (this.target) {
      const tp = this.target.built.group.position;
      const pp = this.player.built.group.position;
      const dx = tp.x - pp.x;
      const dz = tp.z - pp.z;
      const catchR = (this.player.built.bodyRadius + this.target.built.bodyRadius) * 0.82;
      if (dx * dx + dz * dz < catchR * catchR) return "caught";
    }
    if (this.timeLeft <= 0) return "timeout";
    return "playing";
  }

  private hatch(): void {
    if (this.egg) {
      const at = this.egg.position.clone().setY(0.35);
      this.stage.confetti.burst(at, [new THREE.Color("#fffdf4"), new THREE.Color("#ffe3a3")], 90);
      this.stage.scene.remove(this.egg);
      disposeObject(this.egg);
      this.egg = null;
    }
    if (this.target) {
      this.target.built.group.visible = true;
      this.target.built.shadow.visible = true;
      const spec = this.target.built.spec as CharacterSpec;
      this.ui.toast(`فقّست «${spec.species}» — الحقها! 🏃`);
    }
    sfx.hatch();
    this.state = "chase";
  }

  cleanup(removeTarget: boolean): void {
    if (this.egg) {
      this.stage.scene.remove(this.egg);
      disposeObject(this.egg);
      this.egg = null;
    }
    if (this.target && removeTarget) {
      this.stage.remove(this.target);
      this.target = null;
    }
  }
}

function makeEgg(): THREE.Group {
  const g = new THREE.Group();
  const shellMat = new THREE.MeshPhysicalMaterial({
    color: "#fff4de",
    roughness: 0.35,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25,
  });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), shellMat);
  shell.scale.set(0.3, 0.38, 0.3);
  shell.position.y = 0.36;
  g.add(shell);
  const spotMat = new THREE.MeshBasicMaterial({ color: "#ecd7ae" });
  const spotGeo = new THREE.SphereGeometry(1, 10, 8);
  const spots: [number, number, number, number][] = [
    [0.16, 0.48, 0.2, 0.05],
    [-0.18, 0.32, 0.18, 0.04],
    [0.05, 0.24, -0.26, 0.055],
  ];
  for (const [x, y, z, r] of spots) {
    const s = new THREE.Mesh(spotGeo, spotMat);
    s.position.set(x, y, z);
    s.scale.setScalar(r);
    g.add(s);
  }
  return g;
}

function disposeObject(root: THREE.Object3D): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    }
  });
}
