import type * as THREE from "three";

/**
 * Registry of live Object3D anchors per body id, used by the camera focus
 * controller to follow moving bodies without prop drilling.
 */
const registry = new Map<string, THREE.Object3D>();

export function registerBodyObject(id: string, object: THREE.Object3D): void {
  registry.set(id, object);
}

export function unregisterBodyObject(id: string): void {
  registry.delete(id);
}

export function getBodyObject(id: string): THREE.Object3D | undefined {
  return registry.get(id);
}
