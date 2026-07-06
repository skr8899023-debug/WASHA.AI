import { Html } from "@react-three/drei";

interface Props {
  arabicName: string;
  detail?: string;
  y?: number;
}

export function FloatingLabel({ arabicName, detail, y = 1.1 }: Props) {
  return (
    <Html position={[0, y, 0]} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div className="chem-3d-label">
        {arabicName}
        {detail ? <small>{detail}</small> : null}
      </div>
    </Html>
  );
}
