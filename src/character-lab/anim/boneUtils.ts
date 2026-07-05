import * as THREE from "three";

const _q1 = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _p = new THREE.Vector3();
const _d = new THREE.Vector3();
const _dHat = new THREE.Vector3();
const _bend = new THREE.Vector3();
const _knee = new THREE.Vector3();

/** Current world position of a bone, assuming its parent's matrixWorld is fresh. */
export function boneWorldPos(bone: THREE.Bone, out: THREE.Vector3): THREE.Vector3 {
  const parent = bone.parent as THREE.Object3D;
  return out.copy(bone.position).applyMatrix4(parent.matrixWorld);
}

/**
 * Rotate `bone` so that its rest direction (`restDir`, expressed in the
 * parent's rest frame — all rest rotations are identity, so this is simply
 * character space) points at `targetWorld`. Updates the bone's matrixWorld so
 * children solved afterwards see fresh transforms.
 */
export function aimBone(bone: THREE.Bone, restDir: THREE.Vector3, targetWorld: THREE.Vector3): void {
  const parent = bone.parent as THREE.Object3D;
  parent.getWorldQuaternion(_q1);
  _p.copy(bone.position).applyMatrix4(parent.matrixWorld);
  _d.copy(targetWorld).sub(_p);
  if (_d.lengthSq() < 1e-10) return;
  _d.normalize().applyQuaternion(_q2.copy(_q1).invert());
  bone.quaternion.setFromUnitVectors(restDir, _d);
  bone.updateWorldMatrix(false, false);
}

export interface IKLeg {
  upper: THREE.Bone;
  lower: THREE.Bone;
  restDirUpper: THREE.Vector3;
  restDirLower: THREE.Vector3;
  l1: number;
  l2: number;
}

/** Analytic two-bone IK with an explicit pole (knee bend) direction. */
export function solveTwoBoneIK(leg: IKLeg, targetWorld: THREE.Vector3, poleWorld: THREE.Vector3): void {
  boneWorldPos(leg.upper, _p);
  _d.copy(targetWorld).sub(_p);
  const maxLen = leg.l1 + leg.l2;
  let len = _d.length();
  if (len < 1e-5) return;
  if (len > maxLen * 0.999) {
    _d.multiplyScalar((maxLen * 0.999) / len);
    len = maxLen * 0.999;
  }
  _dHat.copy(_d).normalize();

  let cosA = (leg.l1 * leg.l1 + len * len - leg.l2 * leg.l2) / (2 * leg.l1 * len);
  cosA = Math.min(1, Math.max(-1, cosA));
  const sinA = Math.sqrt(1 - cosA * cosA);

  _bend.copy(poleWorld).addScaledVector(_dHat, -poleWorld.dot(_dHat));
  if (_bend.lengthSq() < 1e-8) _bend.set(0, 0, 1).addScaledVector(_dHat, -_dHat.z);
  _bend.normalize();

  _knee.copy(_p).addScaledVector(_dHat, cosA * leg.l1).addScaledVector(_bend, sinA * leg.l1);
  aimBone(leg.upper, leg.restDirUpper, _knee);
  aimBone(leg.lower, leg.restDirLower, targetWorld);
}

/** Set a bone's WORLD orientation (e.g. keep feet flat), given fresh parents. */
export function setBoneWorldQuaternion(bone: THREE.Bone, worldQuat: THREE.Quaternion): void {
  const parent = bone.parent as THREE.Object3D;
  parent.getWorldQuaternion(_q1);
  bone.quaternion.copy(_q1.invert()).multiply(worldQuat);
  bone.updateWorldMatrix(false, false);
}

export function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export function damp(current: number, target: number, lambda: number, dt: number): number {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}
