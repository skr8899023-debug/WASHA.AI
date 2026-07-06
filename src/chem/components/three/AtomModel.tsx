import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const nucleusGeo = new THREE.SphereGeometry(1, 24, 24);
const electronGeo = new THREE.SphereGeometry(1, 10, 10);
const ringGeo = new THREE.TorusGeometry(1, 0.008, 8, 64);

interface Props {
  color: string;
  shells: number[];
  highlighted: boolean;
}

/** ذرة بنموذج بور المبسّط: نواة متوهجة ومدارات إلكترونية متحركة */
export function AtomModel({ color, shells, highlighted }: Props) {
  const shellRefs = useRef<(THREE.Group | null)[]>([]);

  const shellData = useMemo(
    () =>
      shells.map((count, i) => {
        const radius = 0.42 + ((i + 1) * 0.52) / shells.length;
        const tilt = (i * Math.PI) / (shells.length + 1);
        const speed = 0.9 - i * 0.16;
        const electrons = Array.from({ length: count }, (_, e) => (e / count) * Math.PI * 2);
        return { radius, tilt, speed, electrons };
      }),
    [shells],
  );

  const materials = useMemo(() => {
    const c = new THREE.Color(color);
    return {
      nucleus: new THREE.MeshStandardMaterial({
        color: c,
        emissive: c,
        emissiveIntensity: 0.55,
        roughness: 0.35,
      }),
      electron: new THREE.MeshStandardMaterial({
        color: "#a5f3fc",
        emissive: "#22d3ee",
        emissiveIntensity: 1.1,
        roughness: 0.4,
      }),
      ring: new THREE.MeshBasicMaterial({
        color: "#67e8f9",
        transparent: true,
        opacity: 0.28,
      }),
    };
  }, [color]);

  useFrame((_, dt) => {
    shellRefs.current.forEach((g, i) => {
      if (g) g.rotation.z += dt * shellData[i].speed;
    });
  });

  return (
    <group>
      <mesh geometry={nucleusGeo} material={materials.nucleus} scale={highlighted ? 0.34 : 0.3} />
      {shellData.map((shell, i) => (
        <group key={i} rotation={[shell.tilt, shell.tilt * 0.6, 0]}>
          <mesh geometry={ringGeo} material={materials.ring} scale={shell.radius} />
          <group ref={(el) => (shellRefs.current[i] = el)}>
            {shell.electrons.map((angle, e) => (
              <mesh
                key={e}
                geometry={electronGeo}
                material={materials.electron}
                scale={0.05}
                position={[Math.cos(angle) * shell.radius, Math.sin(angle) * shell.radius, 0]}
              />
            ))}
          </group>
        </group>
      ))}
      {highlighted && (
        <pointLight color={color} intensity={2.5} distance={3.2} decay={2} />
      )}
    </group>
  );
}
