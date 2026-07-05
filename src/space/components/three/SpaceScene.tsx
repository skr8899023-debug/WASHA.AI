import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { CELESTIAL_BODIES } from "../../data/celestialBodies";
import { CelestialBodyMesh } from "./CelestialBodyMesh";
import { StarField } from "./StarField";
import { AsteroidBelt } from "./AsteroidBelt";
import { OrbitRings } from "./OrbitRings";
import { CameraFocusController, DEFAULT_CAMERA_POS } from "./CameraFocusController";
import { useSpaceStore } from "../../state/useSpaceStore";

/** Soft fill that follows the camera so a focused body's near side stays readable. */
function CameraFillLight() {
  const lightRef = useRef<THREE.PointLight>(null);
  useFrame(({ camera }) => {
    lightRef.current?.position.copy(camera.position);
  });
  // decay 0 keeps this a gentle constant fill regardless of focus distance
  return <pointLight ref={lightRef} intensity={0.55} distance={0} decay={0} color="#cfd8ef" />;
}

export function SpaceScene() {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const selectBody = useSpaceStore((s) => s.selectBody);

  return (
    <Canvas
      dpr={[1, 1.8]}
      camera={{
        position: DEFAULT_CAMERA_POS.toArray(),
        fov: 48,
        near: 0.1,
        far: 600,
      }}
      onPointerMissed={() => selectBody(null)}
      style={{ background: "radial-gradient(ellipse at 50% 35%, #101a33 0%, #05070f 65%, #020308 100%)" }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <hemisphereLight args={["#2b3a5e", "#05070f", 0.25]} />
        <CameraFillLight />

        <StarField />
        <OrbitRings />
        <AsteroidBelt />

        {CELESTIAL_BODIES.filter((b) => b.visual.kind !== "belt").map((body) => (
          <CelestialBodyMesh key={body.id} body={body} />
        ))}

        <CameraFocusController controlsRef={controlsRef} />
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={3}
          maxDistance={130}
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI * 0.92}
        />
      </Suspense>
    </Canvas>
  );
}
