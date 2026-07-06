import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ToolKind } from "../../types";

const glassMat = new THREE.MeshPhysicalMaterial({
  color: "#bfe8ff",
  transparent: true,
  opacity: 0.22,
  roughness: 0.08,
  metalness: 0,
  side: THREE.DoubleSide,
});
const liquidMat = new THREE.MeshStandardMaterial({
  color: "#22d3ee",
  transparent: true,
  opacity: 0.65,
  emissive: "#0891b2",
  emissiveIntensity: 0.35,
  roughness: 0.2,
});
const metalMat = new THREE.MeshStandardMaterial({ color: "#64748b", roughness: 0.3, metalness: 0.8 });
const darkMat = new THREE.MeshStandardMaterial({ color: "#1e293b", roughness: 0.6, metalness: 0.3 });
const rubberMat = new THREE.MeshStandardMaterial({ color: "#0e7490", roughness: 0.8 });
const nitrileMat = new THREE.MeshStandardMaterial({ color: "#0d9488", roughness: 0.75 });

function Beaker() {
  return (
    <group>
      <mesh material={glassMat}>
        <cylinderGeometry args={[0.42, 0.4, 0.85, 24, 1, true]} />
      </mesh>
      <mesh position={[0, -0.42, 0]} material={glassMat}>
        <circleGeometry args={[0.4, 24]} />
      </mesh>
      <mesh position={[0, -0.18, 0]} material={liquidMat}>
        <cylinderGeometry args={[0.38, 0.37, 0.44, 24]} />
      </mesh>
    </group>
  );
}

function TestTube() {
  return (
    <group>
      <mesh material={glassMat}>
        <cylinderGeometry args={[0.13, 0.13, 0.9, 16, 1, true]} />
      </mesh>
      <mesh position={[0, -0.45, 0]} material={glassMat}>
        <sphereGeometry args={[0.13, 16, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, -0.22, 0]} material={liquidMat}>
        <cylinderGeometry args={[0.11, 0.11, 0.4, 16]} />
      </mesh>
    </group>
  );
}

function Flask() {
  return (
    <group>
      <mesh position={[0, -0.15, 0]} material={glassMat}>
        <cylinderGeometry args={[0.12, 0.48, 0.65, 24, 1, true]} />
      </mesh>
      <mesh position={[0, -0.475, 0]} material={glassMat}>
        <circleGeometry args={[0.48, 24]} />
      </mesh>
      <mesh position={[0, 0.35, 0]} material={glassMat}>
        <cylinderGeometry args={[0.12, 0.12, 0.35, 16, 1, true]} />
      </mesh>
      <mesh position={[0, -0.32, 0]} material={liquidMat}>
        <cylinderGeometry args={[0.28, 0.44, 0.3, 24]} />
      </mesh>
    </group>
  );
}

function Dropper() {
  return (
    <group>
      <mesh position={[0, 0.35, 0]} material={rubberMat}>
        <sphereGeometry args={[0.14, 16, 12]} />
      </mesh>
      <mesh material={glassMat}>
        <cylinderGeometry args={[0.05, 0.02, 0.75, 12]} />
      </mesh>
      <mesh position={[0, -0.15, 0]} material={liquidMat}>
        <cylinderGeometry args={[0.035, 0.018, 0.35, 10]} />
      </mesh>
    </group>
  );
}

function Scale() {
  return (
    <group>
      <mesh position={[0, -0.35, 0]} material={darkMat}>
        <boxGeometry args={[0.85, 0.22, 0.6]} />
      </mesh>
      <mesh position={[0, -0.18, 0]} material={metalMat}>
        <cylinderGeometry args={[0.08, 0.08, 0.16, 12]} />
      </mesh>
      <mesh position={[0, -0.07, 0]} material={metalMat}>
        <cylinderGeometry args={[0.34, 0.34, 0.05, 24]} />
      </mesh>
      <mesh position={[0.24, -0.28, 0.31]} material={liquidMat}>
        <boxGeometry args={[0.26, 0.08, 0.02]} />
      </mesh>
    </group>
  );
}

const flameMat = new THREE.MeshStandardMaterial({
  color: "#fbbf24",
  emissive: "#f97316",
  emissiveIntensity: 2.2,
  transparent: true,
  opacity: 0.9,
});
const flameCoreMat = new THREE.MeshStandardMaterial({
  color: "#7dd3fc",
  emissive: "#38bdf8",
  emissiveIntensity: 2.5,
  transparent: true,
  opacity: 0.85,
});

function Burner() {
  const flame = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (flame.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 9) * 0.08;
      flame.current.scale.set(1, s, 1);
    }
  });
  return (
    <group>
      <mesh position={[0, -0.4, 0]} material={metalMat}>
        <cylinderGeometry args={[0.32, 0.38, 0.12, 20]} />
      </mesh>
      <mesh position={[0, -0.1, 0]} material={metalMat}>
        <cylinderGeometry args={[0.07, 0.07, 0.55, 12]} />
      </mesh>
      <group ref={flame} position={[0, 0.3, 0]}>
        <mesh material={flameMat}>
          <coneGeometry args={[0.13, 0.42, 12]} />
        </mesh>
        <mesh position={[0, -0.06, 0]} material={flameCoreMat} scale={0.55}>
          <coneGeometry args={[0.13, 0.42, 12]} />
        </mesh>
      </group>
      <pointLight position={[0, 0.45, 0]} color="#fb923c" intensity={1.6} distance={2.4} decay={2} />
    </group>
  );
}

const PH_COLORS = ["#ef4444", "#f97316", "#fbbf24", "#22c55e", "#38bdf8", "#8b5cf6"];
const paperMat = new THREE.MeshStandardMaterial({ color: "#f1f5f9", roughness: 0.9 });

function PhStrip() {
  const mats = useMemo(
    () => PH_COLORS.map((c) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, roughness: 0.7 })),
    [],
  );
  return (
    <group rotation={[0, 0, 0.12]}>
      <mesh position={[0, 0, -0.011]} material={paperMat}>
        <boxGeometry args={[0.3, 1.0, 0.02]} />
      </mesh>
      {PH_COLORS.map((_, i) => (
        <mesh key={i} position={[0, 0.38 - i * 0.152, 0.005]} material={mats[i]}>
          <boxGeometry args={[0.24, 0.12, 0.015]} />
        </mesh>
      ))}
    </group>
  );
}

function Goggles() {
  return (
    <group rotation={[0.25, 0, 0]}>
      <mesh position={[-0.22, 0, 0]} material={glassMat}>
        <torusGeometry args={[0.16, 0.05, 10, 24]} />
      </mesh>
      <mesh position={[0.22, 0, 0]} material={glassMat}>
        <torusGeometry args={[0.16, 0.05, 10, 24]} />
      </mesh>
      <mesh position={[-0.22, 0, 0.01]} material={liquidMat}>
        <circleGeometry args={[0.15, 20]} />
      </mesh>
      <mesh position={[0.22, 0, 0.01]} material={liquidMat}>
        <circleGeometry args={[0.15, 20]} />
      </mesh>
      <mesh material={rubberMat}>
        <boxGeometry args={[0.14, 0.05, 0.05]} />
      </mesh>
      <mesh position={[-0.45, 0, -0.12]} rotation={[0, 0.7, 0]} material={rubberMat}>
        <boxGeometry args={[0.2, 0.05, 0.03]} />
      </mesh>
      <mesh position={[0.45, 0, -0.12]} rotation={[0, -0.7, 0]} material={rubberMat}>
        <boxGeometry args={[0.2, 0.05, 0.03]} />
      </mesh>
    </group>
  );
}

function Gloves() {
  return (
    <group>
      {[-0.24, 0.24].map((x, i) => (
        <group key={i} position={[x, 0, 0]} rotation={[0, 0, i === 0 ? 0.18 : -0.18]}>
          <mesh material={nitrileMat}>
            <capsuleGeometry args={[0.13, 0.3, 6, 12]} />
          </mesh>
          {[-0.08, -0.028, 0.028, 0.08].map((fx, f) => (
            <mesh key={f} position={[fx, 0.3, 0]} material={nitrileMat}>
              <capsuleGeometry args={[0.028, 0.14, 4, 8]} />
            </mesh>
          ))}
          <mesh position={[i === 0 ? -0.15 : 0.15, 0.08, 0]} rotation={[0, 0, i === 0 ? 0.8 : -0.8]} material={nitrileMat}>
            <capsuleGeometry args={[0.03, 0.12, 4, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

const TOOLS: Record<ToolKind, () => JSX.Element> = {
  beaker: Beaker,
  testTube: TestTube,
  flask: Flask,
  dropper: Dropper,
  scale: Scale,
  burner: Burner,
  phStrip: PhStrip,
  goggles: Goggles,
  gloves: Gloves,
};

interface Props {
  tool: ToolKind;
  highlighted: boolean;
}

/** أدوات المختبر مبنية إجرائيًا من أشكال هندسية بسيطة */
export function ToolModel({ tool, highlighted }: Props) {
  const Tool = TOOLS[tool];
  return (
    <group scale={0.95}>
      <Tool />
      {highlighted && <pointLight color="#22d3ee" intensity={1.6} distance={2.4} decay={2} />}
    </group>
  );
}
