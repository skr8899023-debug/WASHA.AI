import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { CELESTIAL_BODIES } from "../../data/celestialBodies";
import { orbitRadius } from "../../utils/scale";
import { useSpaceStore } from "../../state/useSpaceStore";

/** Thin circular orbit guides for sun-orbiting bodies. */
export function OrbitRings() {
  const showOrbits = useSpaceStore((s) => s.showOrbits);
  const scaleMode = useSpaceStore((s) => s.scaleMode);

  const lines = useMemo(() => {
    return CELESTIAL_BODIES.filter(
      (b) => b.visual.orbitRadius && !b.visual.parentId && b.visual.kind !== "belt",
    ).map((b) => {
      const r = orbitRadius(b.visual, scaleMode);
      const segments = 128;
      const positions = new Float32Array((segments + 1) * 3);
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        positions[i * 3] = Math.cos(a) * r;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = Math.sin(a) * r;
      }
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.LineBasicMaterial({
        color: "#43558a",
        transparent: true,
        opacity: 0.38,
      });
      const line = new THREE.Line(geometry, material);
      return { id: b.id, line, geometry, material };
    });
  }, [scaleMode]);

  useEffect(() => {
    return () => {
      for (const { geometry, material } of lines) {
        geometry.dispose();
        material.dispose();
      }
    };
  }, [lines]);

  if (!showOrbits) return null;

  return (
    <group>
      {lines.map(({ id, line }) => (
        <primitive key={id} object={line} />
      ))}
    </group>
  );
}
