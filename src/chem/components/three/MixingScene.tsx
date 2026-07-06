import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { ReactionVisual } from "../../types";

// ---- مواد وأشكال مشتركة (تُنشأ مرة واحدة) ----
const glassMat = new THREE.MeshPhysicalMaterial({
  color: "#cfeeff",
  transparent: true,
  opacity: 0.16,
  roughness: 0.05,
  metalness: 0,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  side: THREE.DoubleSide,
  depthWrite: false,
});
const rimMat = new THREE.MeshStandardMaterial({ color: "#bae6fd", roughness: 0.2, metalness: 0.3, transparent: true, opacity: 0.5 });
const rodMat = new THREE.MeshStandardMaterial({ color: "#e2e8f0", roughness: 0.15, metalness: 0.6 });
const pedestalMat = new THREE.MeshStandardMaterial({ color: "#0e1a30", roughness: 0.6, metalness: 0.4 });
const bubbleMat = new THREE.MeshStandardMaterial({ color: "#eaf7ff", transparent: true, opacity: 0.7, roughness: 0.1 });

const sphereGeo = new THREE.SphereGeometry(1, 12, 12);
const BEAKER_R = 1.0;
const LIQUID_R = 0.9;
const MAX_H = 2.0;

interface SceneProps {
  visual: ReactionVisual;
  stir: boolean;
  heat: boolean;
  pourKey: number;
  pourColor: string;
}

function Liquid({ visual, stir }: { visual: ReactionVisual; stir: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const swirl = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Color(visual.liquidColor ?? "#1a2a44"), [visual.liquidColor]);
  const targetH = (visual.liquidLevel ?? 0) * MAX_H;

  useFrame((_, dt) => {
    if (mesh.current) {
      const cur = mesh.current.scale.y * MAX_H;
      const next = THREE.MathUtils.damp(cur, Math.max(targetH, 0.001), 4, dt);
      mesh.current.scale.y = next / MAX_H;
      mesh.current.position.y = next / 2;
      mesh.current.visible = (visual.liquidLevel ?? 0) > 0.001;
    }
    if (mat.current) mat.current.color.lerp(target, 1 - Math.pow(0.001, dt));
    if (swirl.current && stir) swirl.current.rotation.y += dt * 2.2;
  });

  return (
    <group ref={swirl}>
      <mesh ref={mesh} scale={[1, 0.001, 1]}>
        <cylinderGeometry args={[LIQUID_R, LIQUID_R * 0.98, MAX_H, 40, 1]} />
        <meshPhysicalMaterial
          ref={mat}
          color={visual.liquidColor ?? "#1a2a44"}
          transparent
          opacity={0.85}
          roughness={0.15}
          transmission={0.2}
          thickness={1}
          emissive={visual.liquidColor ?? "#1a2a44"}
          emissiveIntensity={visual.glow ? 0.28 : 0.08}
        />
      </mesh>
    </group>
  );
}

function Bubbles({ level }: { level: number }) {
  const items = useRef<THREE.Mesh[]>([]);
  const seeds = useMemo(
    () => Array.from({ length: 14 }, () => ({ x: (Math.random() - 0.5) * 1.4, z: (Math.random() - 0.5) * 1.4, off: Math.random(), sp: 0.5 + Math.random() * 0.6, s: 0.05 + Math.random() * 0.05 })),
    [],
  );
  useFrame((state) => {
    const top = Math.max(level * MAX_H, 0.2);
    const t = state.clock.elapsedTime;
    seeds.forEach((b, i) => {
      const m = items.current[i];
      if (!m) return;
      const y = ((t * b.sp + b.off) % 1) * top;
      m.position.set(b.x, y, b.z);
      m.scale.setScalar(b.s * (0.6 + (y / top) * 0.8));
    });
  });
  return (
    <group>
      {seeds.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) items.current[i] = el; }} geometry={sphereGeo} material={bubbleMat} />
      ))}
    </group>
  );
}

function Foam({ level }: { level: number }) {
  const puffs = useMemo(
    () => Array.from({ length: 16 }, () => ({ x: (Math.random() - 0.5) * 1.5, z: (Math.random() - 0.5) * 1.5, s: 0.12 + Math.random() * 0.14, o: Math.random() })),
    [],
  );
  const y = Math.max(level * MAX_H, 0.3);
  return (
    <group position={[0, y, 0]}>
      {puffs.map((p, i) => (
        <mesh key={i} geometry={sphereGeo} position={[p.x, p.o * 0.25, p.z]} scale={p.s}>
          <meshStandardMaterial color="#fdfdff" roughness={0.9} transparent opacity={0.92} />
        </mesh>
      ))}
    </group>
  );
}

function Precipitate({ color, level }: { color: string; level: number }) {
  const items = useRef<THREE.Mesh[]>([]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness: 0.85 }), [color]);
  const seeds = useMemo(
    () => Array.from({ length: 22 }, () => ({ x: (Math.random() - 0.5) * 1.5, z: (Math.random() - 0.5) * 1.5, off: Math.random(), s: 0.05 + Math.random() * 0.06, sp: 0.15 + Math.random() * 0.2 })),
    [],
  );
  useFrame((state) => {
    const top = Math.max(level * MAX_H, 0.3);
    const t = state.clock.elapsedTime;
    seeds.forEach((p, i) => {
      const m = items.current[i];
      if (!m) return;
      const fall = (t * p.sp + p.off) % 1;
      const y = top - fall * (top - 0.08);
      m.position.set(p.x * (0.4 + fall * 0.6), Math.max(y, 0.06), p.z * (0.4 + fall * 0.6));
      m.scale.setScalar(p.s);
    });
  });
  return (
    <group>
      {seeds.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) items.current[i] = el; }} geometry={sphereGeo} material={mat} />
      ))}
    </group>
  );
}

function Vapor({ level }: { level: number }) {
  const puffs = useRef<THREE.Mesh[]>([]);
  const data = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ x: (Math.random() - 0.5) * 0.8, off: i / 6, sp: 0.25 + Math.random() * 0.15 })), []);
  const base = Math.max(level * MAX_H, 0.4);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    data.forEach((d, i) => {
      const m = puffs.current[i];
      if (!m) return;
      const p = (t * d.sp + d.off) % 1;
      m.position.set(d.x + Math.sin(t + i) * 0.15, base + p * 2.4, 0);
      m.scale.setScalar(0.18 + p * 0.5);
      (m.material as THREE.MeshStandardMaterial).opacity = (1 - p) * 0.35;
    });
  });
  return (
    <group>
      {data.map((_, i) => (
        <mesh key={i} ref={(el) => { if (el) puffs.current[i] = el; }} geometry={sphereGeo}>
          <meshStandardMaterial color="#e6f4ff" transparent opacity={0.3} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function StirRod() {
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (g.current) g.current.rotation.y += dt * 2.2;
  });
  return (
    <group ref={g}>
      <mesh material={rodMat} position={[0.42, 1.1, 0]} rotation={[0, 0, 0.12]}>
        <cylinderGeometry args={[0.05, 0.05, 2.6, 12]} />
      </mesh>
    </group>
  );
}

function HeatSource() {
  const flame = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (flame.current) flame.current.scale.y = 1 + Math.sin(clock.elapsedTime * 10) * 0.12;
  });
  return (
    <group position={[0, -0.55, 0]}>
      <mesh ref={flame} position={[0, 0.1, 0]}>
        <coneGeometry args={[0.35, 0.6, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#f97316" emissiveIntensity={2.4} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0.02, 0]} scale={0.55}>
        <coneGeometry args={[0.35, 0.6, 16]} />
        <meshStandardMaterial color="#93c5fd" emissive="#38bdf8" emissiveIntensity={2.6} transparent opacity={0.85} />
      </mesh>
      <pointLight position={[0, 0.3, 0]} color="#fb923c" intensity={2.4} distance={4} decay={2} />
    </group>
  );
}

function PourStream({ pourKey, color }: { pourKey: number; color: string }) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (pourKey === 0) return;
    setActive(true);
    const id = setTimeout(() => setActive(false), 850);
    return () => clearTimeout(id);
  }, [pourKey]);
  if (!active) return null;
  return (
    <group position={[0.2, 2.9, 0]}>
      <mesh rotation={[0, 0, 0.18]}>
        <cylinderGeometry args={[0.05, 0.03, 1.5, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

function Beaker() {
  return (
    <group>
      <mesh material={glassMat}>
        <cylinderGeometry args={[BEAKER_R, BEAKER_R * 0.96, MAX_H + 0.25, 44, 1, true]} />
      </mesh>
      <mesh position={[0, -(MAX_H + 0.25) / 2, 0]} material={glassMat}>
        <circleGeometry args={[BEAKER_R * 0.96, 44]} />
      </mesh>
      <mesh position={[0, (MAX_H + 0.25) / 2, 0]} material={rimMat}>
        <torusGeometry args={[BEAKER_R, 0.04, 10, 44]} />
      </mesh>
    </group>
  );
}

function Contents({ visual, stir, pourKey, pourColor }: Omit<SceneProps, "heat">) {
  const level = visual.liquidLevel ?? 0;
  return (
    <group position={[0, -(MAX_H + 0.25) / 2, 0]}>
      <group position={[0, 0.02, 0]}>
        <Liquid visual={visual} stir={stir} />
        {visual.bubbles && <Bubbles level={level} />}
        {visual.precipitate && <Precipitate color={visual.precipitate.color} level={level} />}
        {visual.foam && <Foam level={level} />}
      </group>
      {visual.vapor && <Vapor level={level} />}
      {stir && <StirRod />}
      <PourStream pourKey={pourKey} color={pourColor} />
    </group>
  );
}

function Rig({ children, heat }: { children: React.ReactNode; heat: boolean }) {
  return (
    <>
      <color attach="background" args={["#060b16"]} />
      <fog attach="fog" args={["#060b16", 9, 20]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 9, 6]} intensity={1.0} color="#eaf6ff" />
      <pointLight position={[-5, 4, -3]} intensity={30} color="#22d3ee" distance={20} decay={2} />
      <pointLight position={[5, 4, 3]} intensity={30} color="#a78bfa" distance={20} decay={2} />
      <spotLight position={[0, 8, 2]} angle={0.5} penumbra={0.8} intensity={20} color="#ffffff" distance={22} />

      <mesh position={[0, -(MAX_H + 0.25) / 2 - 0.16, 0]} material={pedestalMat}>
        <cylinderGeometry args={[1.5, 1.7, 0.28, 48]} />
      </mesh>
      <mesh position={[0, -(MAX_H + 0.25) / 2 - 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.15, 1.45, 48]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      <Beaker />
      {heat && <HeatSource />}
      {children}
    </>
  );
}

/** مشهد المزج ثلاثي الأبعاد لمنطقة التفاعلات */
export function MixingScene(props: SceneProps) {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 1.6, 6.2], fov: 42 }} gl={{ antialias: true }}>
      <Suspense fallback={null}>
        <Rig heat={props.heat}>
          <Contents visual={props.visual} stir={props.stir} pourKey={props.pourKey} pourColor={props.pourColor} />
        </Rig>
        <OrbitControls
          makeDefault
          enableDamping
          dampingFactor={0.08}
          autoRotate
          autoRotateSpeed={0.5}
          minDistance={3.5}
          maxDistance={11}
          maxPolarAngle={Math.PI / 2 + 0.1}
          target={[0, 0.2, 0]}
        />
      </Suspense>
    </Canvas>
  );
}
