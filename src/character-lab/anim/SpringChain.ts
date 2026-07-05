import * as THREE from "three";
import { ChainKind } from "../factory/anatomy";

/**
 * Secondary-motion solver for ears, tails and antennae.
 *
 * Each link tracks a virtual tip particle in world space with a critically-ish
 * damped spring toward its animated rest target (where the tip would be if the
 * chain were rigid). The bone is then rotated to aim at the particle. Because
 * the target is recomputed from the *current* parent pose every frame, all
 * body motion (walk bounce, hops, turns) automatically injects wobble, lag and
 * overshoot — no keyframes, no per-mode code.
 */

export interface SpringLink {
  bone: THREE.Bone;
  /** rest aim direction in the parent's rest frame (== character space) */
  restDir: THREE.Vector3;
  len: number;
}

const _target = new THREE.Vector3();
const _base = new THREE.Vector3();
const _dir = new THREE.Vector3();
const _qParent = new THREE.Quaternion();
const _qInv = new THREE.Quaternion();
const _swayed = new THREE.Vector3();

export class SpringChain {
  /** extra procedural sway (e.g. tail wag), applied to rest directions */
  swayY = 0;
  swayZ = 0;

  private tips: THREE.Vector3[] = [];
  private vels: THREE.Vector3[] = [];
  private inited = false;

  constructor(
    public links: SpringLink[],
    private stiffness: number,
    private damping: number,
    private gravity: number,
    public kind: ChainKind,
    public side: number
  ) {
    for (let i = 0; i < links.length; i++) {
      this.tips.push(new THREE.Vector3());
      this.vels.push(new THREE.Vector3());
    }
  }

  reset(): void {
    this.inited = false;
    for (const v of this.vels) v.set(0, 0, 0);
  }

  update(dt: number): void {
    for (let i = 0; i < this.links.length; i++) {
      const link = this.links[i];
      const bone = link.bone;
      const parent = bone.parent as THREE.Object3D;

      parent.getWorldQuaternion(_qParent);
      _base.copy(bone.position).applyMatrix4(parent.matrixWorld);

      _swayed.copy(link.restDir);
      if (this.swayY !== 0 || this.swayZ !== 0) {
        _swayed.applyAxisAngle(AXIS_Y, this.swayY);
        _swayed.applyAxisAngle(AXIS_Z, this.swayZ);
      }
      _target.copy(_swayed).applyQuaternion(_qParent).multiplyScalar(link.len).add(_base);

      const tip = this.tips[i];
      const vel = this.vels[i];
      if (!this.inited) {
        tip.copy(_target);
        vel.set(0, 0, 0);
      }

      vel.addScaledVector(_target.sub(tip), this.stiffness * dt);
      vel.y -= this.gravity * dt;
      const decay = Math.max(0, 1 - this.damping * dt);
      vel.multiplyScalar(decay);
      tip.addScaledVector(vel, dt);

      // keep the chain inextensible
      _dir.copy(tip).sub(_base);
      const l = _dir.length();
      if (l < 1e-6) continue;
      _dir.multiplyScalar(1 / l);
      tip.copy(_base).addScaledVector(_dir, link.len);

      _dir.applyQuaternion(_qInv.copy(_qParent).invert());
      bone.quaternion.setFromUnitVectors(link.restDir, _dir);
      bone.updateWorldMatrix(false, false);
    }
    this.inited = true;
  }
}

const AXIS_Y = new THREE.Vector3(0, 1, 0);
const AXIS_Z = new THREE.Vector3(0, 0, 1);
