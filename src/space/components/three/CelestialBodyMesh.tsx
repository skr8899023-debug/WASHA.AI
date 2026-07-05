import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { CelestialBody } from "../../utils/astronomyTypes";
import { bodyRadius, orbitRadius } from "../../utils/scale";
import { useSpaceStore } from "../../state/useSpaceStore";
import { createBodyTexture, createGlowTexture } from "./proceduralTextures";
import { getBodyObject, registerBodyObject, unregisterBodyObject } from "./bodyRegistry";
import { BODY_BY_ID } from "../../data/celestialBodies";

const UP = new THREE.Vector3(0, 1, 0);
const tmpVec = new THREE.Vector3();

interface Props {
  body: CelestialBody;
}

export function CelestialBodyMesh({ body }: Props) {
  const { visual } = body;
  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const angleRef = useRef(visual.orbitPhase ?? 0);
  const materialsRef = useRef<THREE.Material[]>([]);
  const [hovered, setHovered] = useState(false);

  const scaleMode = useSpaceStore((s) => s.scaleMode);
  const selectedBodyId = useSpaceStore((s) => s.selectedBodyId);
  const reducedMotion = useSpaceStore((s) => s.reducedMotion);
  const selectBody = useSpaceStore((s) => s.selectBody);
  const setHoveredStore = useSpaceStore((s) => s.setHovered);

  const radius = bodyRadius(visual, scaleMode);
  const isSelected = selectedBodyId === body.id;
  // keep a selected body's parent lit, and a selected parent's satellites lit
  const isRelated =
    selectedBodyId !== null &&
    (visual.parentId === selectedBodyId ||
      BODY_BY_ID[selectedBodyId]?.visual.parentId === body.id);
  const isDimmed = selectedBodyId !== null && !isSelected && !isRelated;

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    registerBodyObject(body.id, group);
    // collect materials once for dim-fading
    const mats: THREE.Material[] = [];
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh || (obj as THREE.Points).type === "Points" || (obj as THREE.Sprite).isSprite) {
        const m = (mesh.material ?? null) as THREE.Material | THREE.Material[] | null;
        if (Array.isArray(m)) mats.push(...m);
        else if (m) mats.push(m);
      }
    });
    for (const m of mats) {
      m.transparent = true;
      if (m.userData.baseOpacity === undefined) m.userData.baseOpacity = m.opacity;
    }
    materialsRef.current = mats;
    return () => unregisterBodyObject(body.id);
  }, [body.id]);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hovered]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1);
    const group = groupRef.current;
    if (!group) return;

    // orbital position
    if (visual.fixedPosition) {
      group.position.set(...visual.fixedPosition);
    } else if (visual.orbitRadius) {
      if (!reducedMotion) angleRef.current += (visual.orbitSpeed ?? 0.1) * delta * 0.4;
      const r = orbitRadius(visual, scaleMode);
      const parent = visual.parentId ? getBodyObject(visual.parentId) : undefined;
      const px = parent?.position.x ?? 0;
      const pz = parent?.position.z ?? 0;
      const py = parent?.position.y ?? 0;
      group.position.set(
        px + Math.cos(angleRef.current) * r,
        py,
        pz + Math.sin(angleRef.current) * r,
      );
    }

    // self spin
    if (spinRef.current && !reducedMotion) {
      spinRef.current.rotation.y += delta * (visual.kind === "galaxy" ? 0.02 : 0.15);
    }

    // comet tail: wide end away from the sun (apex at the nucleus)
    if (tailRef.current && visual.kind === "comet") {
      tmpVec.copy(group.position).normalize(); // direction away from sun
      tailRef.current.position.copy(tmpVec).multiplyScalar(radius * 6);
      tmpVec.negate();
      tailRef.current.quaternion.setFromUnitVectors(UP, tmpVec);
    }

    // dim fade
    const target = isDimmed ? 0.15 : 1;
    for (const m of materialsRef.current) {
      const base = (m.userData.baseOpacity as number) ?? 1;
      m.opacity += (base * target - m.opacity) * Math.min(1, delta * 6);
    }
  });

  const showLabel =
    hovered || isSelected || visual.fixedPosition !== undefined;

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        selectBody(body.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        setHoveredStore(body.id);
      }}
      onPointerOut={() => {
        setHovered(false);
        setHoveredStore(null);
      }}
    >
      {/* enlarged invisible hitbox for small bodies */}
      <mesh visible={false}>
        <sphereGeometry args={[Math.max(radius * 1.5, 1), 8, 8]} />
        <meshBasicMaterial />
      </mesh>

      {/* host star sits outside the spin group so it doesn't orbit its planet */}
      {visual.kind === "exoplanet" && <HostStar />}

      <group ref={spinRef} rotation={[0, 0, THREE.MathUtils.degToRad(visual.tiltDeg ?? 0)]}>
        <BodyVisual body={body} radius={radius} />
        {visual.kind === "comet" && (
          <mesh ref={tailRef}>
            <coneGeometry args={[radius * 0.9, radius * 14, 12, 1, true]} />
            <meshBasicMaterial
              color={visual.accentColor ?? visual.color}
              transparent
              opacity={0.28}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {showLabel && (
        <Html
          position={[0, radius + 0.9, 0]}
          center
          zIndexRange={[10, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className={`body-label${isSelected ? " selected" : hovered ? "" : " faint"}`}>
            {body.arabicName}
          </div>
        </Html>
      )}
    </group>
  );
}

function BodyVisual({ body, radius }: { body: CelestialBody; radius: number }) {
  const { visual } = body;
  switch (visual.kind) {
    case "star":
      return <StarVisual radius={radius} color={visual.color} accent={visual.accentColor ?? visual.color} />;
    case "planet":
    case "moon":
    case "exoplanet":
      return <PlanetVisual body={body} radius={radius} />;
    case "comet":
      return <CometNucleus radius={radius} color={visual.color} />;
    case "asteroid":
      return <AsteroidVisual radius={radius} color={visual.color} />;
    case "galaxy":
      return <GalaxyVisual radius={radius} color={visual.color} accent={visual.accentColor ?? visual.color} />;
    case "blackhole":
      return <BlackHoleVisual radius={radius} accent={visual.accentColor ?? "#ffb347"} />;
    case "nebula":
      return <NebulaVisual radius={radius} color={visual.color} accent={visual.accentColor ?? visual.color} />;
    case "spacecraft":
      return <SpacecraftVisual radius={radius} color={visual.color} accent={visual.accentColor ?? visual.color} />;
    default:
      return null;
  }
}

function StarVisual({ radius, color, accent }: { radius: number; color: string; accent: string }) {
  const texture = useMemo(() => createBodyTexture("sun", color, accent), [color, accent]);
  const glow = useMemo(() => createGlowTexture(color, 0.8), [color]);
  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 48, 48]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <sprite scale={[radius * 5.2, radius * 5.2, 1]}>
        <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.85} />
      </sprite>
      <pointLight intensity={3.2} distance={200} decay={0.45} color="#fff3dd" />
    </group>
  );
}

function PlanetVisual({ body, radius }: { body: CelestialBody; radius: number }) {
  const { visual } = body;
  const texture = useMemo(
    () =>
      visual.texture
        ? createBodyTexture(visual.texture, visual.color, visual.accentColor ?? visual.color)
        : null,
    [visual.texture, visual.color, visual.accentColor],
  );
  const ringTexture = useMemo(
    () => (visual.rings ? createGlowTexture(visual.rings.color, 0.55) : null),
    [visual.rings],
  );

  return (
    <group>
      <mesh>
        <sphereGeometry args={[radius, 40, 40]} />
        {texture ? (
          <meshStandardMaterial map={texture} roughness={0.9} metalness={0.05} />
        ) : (
          <meshStandardMaterial color={visual.color} roughness={0.85} metalness={0.05} />
        )}
      </mesh>
      {visual.rings && ringTexture && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * visual.rings.inner, radius * visual.rings.outer, 96]} />
          <meshBasicMaterial
            color={visual.rings.color}
            side={THREE.DoubleSide}
            transparent
            opacity={0.45}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

/** Distant dim host star for the exoplanet exhibit. */
function HostStar() {
  const glow = useMemo(() => createGlowTexture("#ffd9a0", 0.85), []);
  return (
    <group position={[3, 1.1, -1.5]}>
      <mesh>
        <sphereGeometry args={[0.35, 20, 20]} />
        <meshBasicMaterial color="#ffddad" toneMapped={false} />
      </mesh>
      <sprite scale={[2.4, 2.4, 1]}>
        <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.8} />
      </sprite>
    </group>
  );
}

function CometNucleus({ radius, color }: { radius: number; color: string }) {
  return (
    <mesh>
      <icosahedronGeometry args={[radius, 1]} />
      <meshStandardMaterial color={color} roughness={0.7} flatShading />
    </mesh>
  );
}

function AsteroidVisual({ radius, color }: { radius: number; color: string }) {
  const geometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(radius, 1);
    const pos = geo.getAttribute("position");
    const rand = (i: number) => Math.abs(Math.sin(i * 127.1 + 311.7)) * 0.35;
    for (let i = 0; i < pos.count; i++) {
      const scale = 1 + rand(i) - 0.18;
      pos.setXYZ(i, pos.getX(i) * scale, pos.getY(i) * scale, pos.getZ(i) * scale);
    }
    geo.computeVertexNormals();
    return geo;
  }, [radius]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color={color} roughness={1} flatShading />
    </mesh>
  );
}

function GalaxyVisual({ radius, color, accent }: { radius: number; color: string; accent: string }) {
  const { positions, colors } = useMemo(() => {
    const count = 1400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const inner = new THREE.Color(accent);
    const outer = new THREE.Color(color);
    const arms = 3;
    for (let i = 0; i < count; i++) {
      const t = Math.pow(Math.random(), 0.6);
      const arm = Math.floor(Math.random() * arms);
      const angle = t * 4.2 + (arm * Math.PI * 2) / arms + (Math.random() - 0.5) * 0.5;
      const r = t * radius;
      positions[i * 3] = Math.cos(angle) * r + (Math.random() - 0.5) * 0.4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * radius * 0.08;
      positions[i * 3 + 2] = Math.sin(angle) * r + (Math.random() - 0.5) * 0.4;
      const c = inner.clone().lerp(outer, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, [radius, color, accent]);
  const coreGlow = useMemo(() => createGlowTexture(accent, 0.9), [accent]);

  return (
    <group rotation={[0.5, 0, 0.15]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.28}
          vertexColors
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          sizeAttenuation
        />
      </points>
      <sprite scale={[radius * 0.9, radius * 0.9, 1]}>
        <spriteMaterial map={coreGlow} blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.9} />
      </sprite>
    </group>
  );
}

function BlackHoleVisual({ radius, accent }: { radius: number; accent: string }) {
  const glow = useMemo(() => createGlowTexture(accent, 0.7), [accent]);
  return (
    <group rotation={[0.9, 0, 0.3]}>
      <mesh>
        <sphereGeometry args={[radius * 0.55, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh>
        <torusGeometry args={[radius, radius * 0.16, 2, 90]} />
        <meshBasicMaterial color={accent} transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <sprite scale={[radius * 4, radius * 4, 1]}>
        <spriteMaterial map={glow} blending={THREE.AdditiveBlending} depthWrite={false} opacity={0.35} />
      </sprite>
    </group>
  );
}

function NebulaVisual({ radius, color, accent }: { radius: number; color: string; accent: string }) {
  const puffA = useMemo(() => createGlowTexture(color, 0.5), [color]);
  const puffB = useMemo(() => createGlowTexture(accent, 0.45), [accent]);
  const offsets: [number, number, number][] = [
    [0, 0, 0],
    [radius * 0.4, radius * 0.15, -radius * 0.2],
    [-radius * 0.35, -radius * 0.1, radius * 0.15],
    [radius * 0.15, -radius * 0.3, 0],
  ];
  return (
    <group>
      {offsets.map((pos, i) => (
        <sprite key={i} position={pos} scale={[radius * (1.6 - i * 0.2), radius * (1.4 - i * 0.2), 1]}>
          <spriteMaterial
            map={i % 2 === 0 ? puffA : puffB}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            opacity={0.5}
          />
        </sprite>
      ))}
    </group>
  );
}

function SpacecraftVisual({ radius, color, accent }: { radius: number; color: string; accent: string }) {
  const s = radius;
  return (
    <group>
      {/* bus */}
      <mesh>
        <boxGeometry args={[s * 0.7, s * 0.5, s * 0.7]} />
        <meshStandardMaterial color={accent} roughness={0.5} metalness={0.6} />
      </mesh>
      {/* dish */}
      <mesh position={[0, s * 0.65, 0]} rotation={[-Math.PI / 2.4, 0, 0]}>
        <coneGeometry args={[s * 0.9, s * 0.35, 24, 1, true]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* boom */}
      <mesh position={[s * 1.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[s * 0.03, s * 0.03, s * 1.6, 6]} />
        <meshStandardMaterial color={color} roughness={0.6} metalness={0.4} />
      </mesh>
      {/* RTG-ish block */}
      <mesh position={[-s * 0.8, 0, 0]}>
        <cylinderGeometry args={[s * 0.12, s * 0.12, s * 0.6, 10]} />
        <meshStandardMaterial color="#4a4f58" roughness={0.8} />
      </mesh>
    </group>
  );
}
