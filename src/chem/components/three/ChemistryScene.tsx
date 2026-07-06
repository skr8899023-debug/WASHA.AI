import { Suspense, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { compoundsList, elementsList, toolsList } from "../../data/chemistryItems";
import type { ChemistryItem } from "../../types";
import { useChemistryStore } from "../../state/useChemistryStore";
import { AtomModel } from "./AtomModel";
import { MoleculeModel } from "./MoleculeModel";
import { ToolModel } from "./ToolModel";
import { FloatingLabel } from "./FloatingLabel";
import { LabEnvironment } from "./LabEnvironment";
import { CameraFocusController } from "./CameraFocusController";
import { DEFAULT_CAMERA_POS, itemPositions } from "./sceneLayout";

function SceneItem({ item, labelY }: { item: ChemistryItem; labelY: number }) {
  const selectedId = useChemistryStore((s) => s.selectedId);
  const hoveredId = useChemistryStore((s) => s.hoveredId);
  const labelsVisible = useChemistryStore((s) => s.labelsVisible);
  const selectItem = useChemistryStore((s) => s.selectItem);
  const setHovered = useChemistryStore((s) => s.setHovered);

  const hovered = hoveredId === item.id;
  const selected = selectedId === item.id;
  const highlighted = hovered || selected;

  const onOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setHovered(item.id);
      document.body.style.cursor = "pointer";
    },
    [item.id, setHovered],
  );
  const onOut = useCallback(() => {
    setHovered(null);
    document.body.style.cursor = "auto";
  }, [setHovered]);
  const onClick = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      selectItem(item.id);
    },
    [item.id, selectItem],
  );

  const v = item.visual;
  return (
    <group position={itemPositions[item.id]}>
      <Float speed={1.4} rotationIntensity={0} floatIntensity={0.35} floatingRange={[-0.08, 0.08]}>
        <group onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
          {v.kind === "atom" && <AtomModel color={v.color} shells={v.shells} highlighted={highlighted} />}
          {v.kind === "molecule" && <MoleculeModel visual={v} highlighted={highlighted} />}
          {v.kind === "tool" && <ToolModel tool={v.tool} highlighted={highlighted} />}
        </group>
      </Float>
      {(hovered || (labelsVisible && selected)) && (
        <FloatingLabel
          arabicName={item.arabicName}
          detail={item.symbolOrFormula ?? item.englishName}
          y={labelY}
        />
      )}
    </group>
  );
}

/** المشهد الرئيسي: قوس العناصر، صف المركبات، وطاولة الأدوات */
export function ChemistryScene() {
  const selectItem = useChemistryStore((s) => s.selectItem);
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: DEFAULT_CAMERA_POS, fov: 45 }}
      onPointerMissed={() => selectItem(null)}
      gl={{ antialias: true }}
    >
      <color attach="background" args={["#060b16"]} />
      <Suspense fallback={null}>
        <LabEnvironment />
        {elementsList.map((el) => (
          <SceneItem key={el.id} item={el} labelY={1.35} />
        ))}
        {compoundsList.map((c) => (
          <SceneItem key={c.id} item={c} labelY={1.3} />
        ))}
        {toolsList.map((t) => (
          <SceneItem key={t.id} item={t} labelY={0.95} />
        ))}
        <CameraFocusController />
      </Suspense>
    </Canvas>
  );
}
