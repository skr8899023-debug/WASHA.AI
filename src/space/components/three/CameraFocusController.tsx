import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useSpaceStore } from "../../state/useSpaceStore";
import { getBodyObject } from "./bodyRegistry";
import { BODY_BY_ID } from "../../data/celestialBodies";
import { bodyRadius } from "../../utils/scale";

export const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 30, 52);
const ORIGIN = new THREE.Vector3(0, 0, 0);

const desiredTarget = new THREE.Vector3();
const desiredPos = new THREE.Vector3();
const offsetDir = new THREE.Vector3();

/**
 * Smoothly follows the selected body (which keeps orbiting) and
 * returns to the overview on reset.
 */
export function CameraFocusController({
  controlsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl | null>;
}) {
  const camera = useThree((s) => s.camera);
  const selectedBodyId = useSpaceStore((s) => s.selectedBodyId);
  const scaleMode = useSpaceStore((s) => s.scaleMode);
  const cameraResetToken = useSpaceStore((s) => s.cameraResetToken);
  const reducedMotion = useSpaceStore((s) => s.reducedMotion);

  const lastResetToken = useRef(cameraResetToken);
  const returning = useRef(false);

  if (lastResetToken.current !== cameraResetToken) {
    lastResetToken.current = cameraResetToken;
    returning.current = true;
  }

  useFrame((_, rawDelta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const delta = Math.min(rawDelta, 0.1);
    const ease = reducedMotion ? 1 : 1 - Math.exp(-delta * 3.2);

    if (selectedBodyId) {
      returning.current = false;
      const obj = getBodyObject(selectedBodyId);
      const body = BODY_BY_ID[selectedBodyId];
      if (!obj || !body) return;
      desiredTarget.copy(obj.position);
      const r = bodyRadius(body.visual, scaleMode);
      const dist = Math.max(r * 4.2, 3.2);
      offsetDir.copy(camera.position).sub(obj.position);
      // keep a slight elevation so we never end up edge-on with the ecliptic
      if (offsetDir.lengthSq() < 0.001) offsetDir.set(0, 0.5, 1);
      offsetDir.normalize();
      offsetDir.y = Math.max(offsetDir.y, 0.25);
      offsetDir.normalize();
      desiredPos.copy(obj.position).addScaledVector(offsetDir, dist);

      controls.target.lerp(desiredTarget, ease);
      camera.position.lerp(desiredPos, ease);
    } else if (returning.current) {
      controls.target.lerp(ORIGIN, ease);
      camera.position.lerp(DEFAULT_CAMERA_POS, ease);
      if (
        camera.position.distanceToSquared(DEFAULT_CAMERA_POS) < 0.05 &&
        controls.target.lengthSq() < 0.05
      ) {
        returning.current = false;
      }
    }
    controls.update();
  });

  return null;
}
