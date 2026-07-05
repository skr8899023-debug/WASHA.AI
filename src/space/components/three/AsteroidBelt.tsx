import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useSpaceStore } from "../../state/useSpaceStore";
import { registerBodyObject, unregisterBodyObject } from "./bodyRegistry";

const BELT_ID = "asteroid-belt";
const INNER = 14.6;
const OUTER = 17.4;
const COUNT = 520;

/** Instanced asteroid belt, selectable as one educational object. */
export function AsteroidBelt() {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const anchorRef = useRef<THREE.Object3D>(null);

  const selectBody = useSpaceStore((s) => s.selectBody);
  const setHovered = useSpaceStore((s) => s.setHovered);
  const selectedBodyId = useSpaceStore((s) => s.selectedBodyId);
  const reducedMotion = useSpaceStore((s) => s.reducedMotion);
  const isDimmed = selectedBodyId !== null && selectedBodyId !== BELT_ID;

  const transforms = useMemo(() => {
    const dummy = new THREE.Object3D();
    const matrices: THREE.Matrix4[] = [];
    for (let i = 0; i < COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = INNER + Math.random() * (OUTER - INNER);
      dummy.position.set(
        Math.cos(angle) * r,
        (Math.random() - 0.5) * 0.9,
        Math.sin(angle) * r,
      );
      dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      const s = 0.05 + Math.random() * 0.14;
      dummy.scale.set(s, s * (0.7 + Math.random() * 0.6), s);
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    }
    return matrices;
  }, []);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    transforms.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
  }, [transforms]);

  useEffect(() => {
    // label/focus anchor on the belt ring (front section)
    const anchor = anchorRef.current;
    if (anchor) {
      anchor.position.set((INNER + OUTER) / 2, 0, 0);
      registerBodyObject(BELT_ID, anchor);
    }
    return () => unregisterBodyObject(BELT_ID);
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y += delta * 0.012;
    }
    if (matRef.current) {
      const target = isDimmed ? 0.15 : 1;
      matRef.current.opacity += (target - matRef.current.opacity) * Math.min(1, delta * 6);
    }
  });

  return (
    <group ref={groupRef}>
      <object3D ref={anchorRef} />
      <instancedMesh
        ref={meshRef}
        args={[undefined, undefined, COUNT]}
        onClick={(e) => {
          e.stopPropagation();
          selectBody(BELT_ID);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(BELT_ID);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(null);
          document.body.style.cursor = "auto";
        }}
      >
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial ref={matRef} color="#a89a86" roughness={1} transparent />
      </instancedMesh>
    </group>
  );
}
