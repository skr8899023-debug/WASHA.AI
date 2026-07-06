import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { useChemistryStore } from "../../state/useChemistryStore";
import { DEFAULT_CAMERA_POS, DEFAULT_TARGET, itemPositions } from "./sceneLayout";

/** يحرّك الكاميرا بنعومة نحو العنصر المحدد، ويعيدها عند طلب إعادة الضبط */
export function CameraFocusController() {
  const controls = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const selectedId = useChemistryStore((s) => s.selectedId);
  const resetSignal = useChemistryStore((s) => s.resetSignal);
  const goal = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);

  useEffect(() => {
    if (selectedId && itemPositions[selectedId]) {
      const target = new THREE.Vector3(...itemPositions[selectedId]);
      goal.current = {
        target,
        pos: target.clone().add(new THREE.Vector3(0, 0.9, 3.9)),
      };
    }
  }, [selectedId]);

  useEffect(() => {
    if (resetSignal === 0) return;
    goal.current = {
      target: new THREE.Vector3(...DEFAULT_TARGET),
      pos: new THREE.Vector3(...DEFAULT_CAMERA_POS),
    };
  }, [resetSignal]);

  useFrame((_, dt) => {
    const c = controls.current;
    const g = goal.current;
    if (!c || !g) return;
    const k = 1 - Math.pow(0.0015, dt);
    camera.position.lerp(g.pos, k);
    c.target.lerp(g.target, k);
    c.update();
    if (camera.position.distanceTo(g.pos) < 0.02 && c.target.distanceTo(g.target) < 0.02) {
      goal.current = null;
    }
  });

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={1.8}
      maxDistance={24}
      maxPolarAngle={Math.PI / 2 - 0.03}
      target={DEFAULT_TARGET}
    />
  );
}
