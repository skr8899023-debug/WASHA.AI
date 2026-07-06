import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Grid, Sparkles } from "@react-three/drei";
import * as THREE from "three";

const floorMat = new THREE.MeshStandardMaterial({ color: "#0a1224", roughness: 0.85, metalness: 0.25 });
const benchMat = new THREE.MeshStandardMaterial({ color: "#101c33", roughness: 0.5, metalness: 0.4 });
const benchTopMat = new THREE.MeshStandardMaterial({
  color: "#16263f",
  roughness: 0.25,
  metalness: 0.5,
});
const stationRingMat = new THREE.MeshBasicMaterial({
  color: "#22d3ee",
  transparent: true,
  opacity: 0.22,
  side: THREE.DoubleSide,
});
const shelfGlowMat = new THREE.MeshBasicMaterial({
  color: "#a78bfa",
  transparent: true,
  opacity: 0.16,
  side: THREE.DoubleSide,
});

/** جسيمات جزيئية عائمة تدور ببطء لإحساس «هواء المختبر» */
function AmbientDust() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const count = 220;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 28;
      positions[i * 3 + 1] = Math.random() * 9 + 0.3;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: "#67e8f9",
        size: 0.035,
        transparent: true,
        opacity: 0.5,
        sizeAttenuation: true,
      }),
    [],
  );
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.012;
  });
  return <points ref={ref} geometry={geo} material={mat} />;
}

export function LabEnvironment() {
  return (
    <group>
      {/* الإضاءة */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[6, 12, 8]} intensity={0.9} color="#e0f2fe" />
      <pointLight position={[-10, 6, -4]} intensity={40} color="#22d3ee" distance={26} decay={2} />
      <pointLight position={[10, 6, -4]} intensity={40} color="#a78bfa" distance={26} decay={2} />
      <pointLight position={[0, 3, 8]} intensity={18} color="#34d399" distance={18} decay={2} />

      {/* الأرضية والشبكة */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} material={floorMat}>
        <circleGeometry args={[24, 48]} />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[48, 48]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#173052"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#1d4560"
        fadeDistance={30}
        fadeStrength={2}
        infiniteGrid={false}
      />

      {/* رف العناصر الخلفي المتوهج */}
      <mesh position={[0, 1.45, -5.8]} material={shelfGlowMat}>
        <boxGeometry args={[18.5, 0.08, 1.6]} />
      </mesh>

      {/* منصة المركبات */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, -0.8]} material={stationRingMat}>
        <ringGeometry args={[10.4, 10.7, 64, 1, 0, Math.PI]} />
      </mesh>

      {/* طاولة الأدوات */}
      <group position={[0, 0, 3.6]}>
        <mesh position={[0, 0.14, 0]} material={benchMat}>
          <boxGeometry args={[18.6, 0.28, 1.9]} />
        </mesh>
        <mesh position={[0, 0.31, 0]} material={benchTopMat}>
          <boxGeometry args={[18.8, 0.06, 2.05]} />
        </mesh>
      </group>

      {/* أجواء */}
      <AmbientDust />
      <Sparkles count={90} scale={[22, 7, 16]} position={[0, 3.5, -1]} size={1.6} speed={0.25} color="#7dd3fc" opacity={0.5} />
      <fog attach="fog" args={["#060b16", 18, 38]} />
    </group>
  );
}
