import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Visual } from "../../types";

const atomGeo = new THREE.SphereGeometry(1, 20, 20);
const bondGeo = new THREE.CylinderGeometry(0.06, 0.06, 1, 10);
const bondMat = new THREE.MeshStandardMaterial({
  color: "#cbd5e1",
  roughness: 0.35,
  metalness: 0.15,
});

type MoleculeVisual = Extract<Visual, { kind: "molecule" }>;

interface Props {
  visual: MoleculeVisual;
  highlighted: boolean;
}

/** نموذج «الكرة والعصا» للجزيء، يدور ببطء حول محوره */
export function MoleculeModel({ visual, highlighted }: Props) {
  const group = useRef<THREE.Group>(null);

  const { atomMats, bonds } = useMemo(() => {
    const mats = visual.atoms.map(
      (a) =>
        new THREE.MeshStandardMaterial({
          color: a.color,
          emissive: a.color,
          emissiveIntensity: 0.25,
          roughness: 0.3,
        }),
    );
    const bondTransforms = visual.bonds.map(([ai, bi]) => {
      const a = new THREE.Vector3(...visual.atoms[ai].pos);
      const b = new THREE.Vector3(...visual.atoms[bi].pos);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const dir = b.clone().sub(a);
      const len = dir.length();
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize(),
      );
      return { mid, quat, len };
    });
    return { atomMats: mats, bonds: bondTransforms };
  }, [visual]);

  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * (highlighted ? 0.6 : 0.25);
  });

  return (
    <group ref={group} scale={0.85}>
      {visual.atoms.map((a, i) => (
        <mesh key={i} geometry={atomGeo} material={atomMats[i]} position={a.pos} scale={a.r} />
      ))}
      {bonds.map((b, i) => (
        <mesh
          key={`b${i}`}
          geometry={bondGeo}
          material={bondMat}
          position={b.mid}
          quaternion={b.quat}
          scale={[1, b.len, 1]}
        />
      ))}
      {highlighted && <pointLight color="#22d3ee" intensity={2} distance={3} decay={2} />}
    </group>
  );
}
