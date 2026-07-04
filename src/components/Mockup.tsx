import type { GarmentColor, Palette, PrintPosition } from "../lib/types";

// Seeded generative mockup: same seed + params always renders the same
// artwork, so saved designs restore pixel-identically from metadata alone.

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface PrintArea {
  x: number;
  y: number;
  w: number;
  h: number;
}

const AREAS: Record<string, PrintArea> = {
  "chest-full": { x: 105, y: 130, w: 90, h: 100 },
  "chest-left": { x: 160, y: 125, w: 38, h: 38 },
  "back-full": { x: 100, y: 120, w: 100, h: 125 },
  sleeve: { x: 34, y: 118, w: 26, h: 44 },
};

function artwork(seed: number, styleId: string, palette: Palette, area: PrintArea) {
  const rnd = mulberry32(seed);
  const pick = () => palette.colors[Math.floor(rnd() * palette.colors.length)];
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;
  const s = Math.min(area.w, area.h);
  const nodes: JSX.Element[] = [];

  if (styleId === "minimal") {
    nodes.push(
      <circle key="a" cx={cx} cy={cy - s * 0.08} r={s * 0.28} fill={pick()} opacity={0.9} />,
      <rect key="b" x={cx - s * 0.3} y={cy + s * 0.26} width={s * 0.6} height={s * 0.05} rx={s * 0.025} fill={pick()} />,
    );
  } else if (styleId === "geometric") {
    for (let i = 0; i < 7; i++) {
      const px = area.x + rnd() * area.w;
      const py = area.y + rnd() * area.h;
      const r = s * (0.08 + rnd() * 0.14);
      const rot = Math.floor(rnd() * 360);
      nodes.push(
        <rect
          key={i}
          x={px - r}
          y={py - r}
          width={r * 2}
          height={r * 2}
          fill={pick()}
          opacity={0.55 + rnd() * 0.4}
          transform={`rotate(${rot} ${px} ${py})`}
        />,
      );
    }
  } else if (styleId === "calligraphy") {
    for (let i = 0; i < 4; i++) {
      const y0 = area.y + area.h * (0.25 + i * 0.18);
      const sway = s * (0.14 + rnd() * 0.22);
      nodes.push(
        <path
          key={i}
          d={`M ${area.x + s * 0.08} ${y0}
              C ${cx - sway} ${y0 - sway}, ${cx + sway} ${y0 + sway},
                ${area.x + area.w - s * 0.08} ${y0 - s * 0.06}`}
          fill="none"
          stroke={pick()}
          strokeWidth={s * (0.03 + rnd() * 0.04)}
          strokeLinecap="round"
          opacity={0.85}
        />,
      );
    }
    nodes.push(<circle key="dot" cx={cx + s * 0.22} cy={area.y + area.h * 0.2} r={s * 0.045} fill={pick()} />);
  } else if (styleId === "ornament") {
    const petals = 8;
    for (let i = 0; i < petals; i++) {
      const ang = (i / petals) * Math.PI * 2;
      const px = cx + Math.cos(ang) * s * 0.26;
      const py = cy + Math.sin(ang) * s * 0.26;
      nodes.push(
        <ellipse
          key={i}
          cx={px}
          cy={py}
          rx={s * 0.11}
          ry={s * 0.055}
          fill={palette.colors[i % 2]}
          opacity={0.85}
          transform={`rotate(${(ang * 180) / Math.PI} ${px} ${py})`}
        />,
      );
    }
    nodes.push(
      <circle key="core" cx={cx} cy={cy} r={s * 0.1} fill={palette.colors[3] ?? pick()} />,
      <circle key="ring" cx={cx} cy={cy} r={s * 0.36} fill="none" stroke={palette.colors[0]} strokeWidth={s * 0.02} opacity={0.7} />,
    );
  } else if (styleId === "boho") {
    for (let i = 0; i < 5; i++) {
      const r = s * (0.32 - i * 0.055);
      nodes.push(
        <circle
          key={i}
          cx={cx + (rnd() - 0.5) * s * 0.1}
          cy={cy + (rnd() - 0.5) * s * 0.1}
          r={Math.max(r, s * 0.04)}
          fill={i % 2 ? "none" : pick()}
          stroke={i % 2 ? pick() : "none"}
          strokeWidth={s * 0.025}
          strokeDasharray={i === 3 ? `${s * 0.05} ${s * 0.04}` : undefined}
          opacity={0.8}
        />,
      );
    }
  } else {
    // handdrawn / fallback: wobbly strokes
    for (let i = 0; i < 5; i++) {
      const y0 = area.y + area.h * (0.2 + i * 0.15);
      let d = `M ${area.x + s * 0.1} ${y0}`;
      for (let xStep = 1; xStep <= 4; xStep++) {
        const px = area.x + s * 0.1 + (area.w - s * 0.2) * (xStep / 4);
        d += ` L ${px} ${y0 + (rnd() - 0.5) * s * 0.12}`;
      }
      nodes.push(
        <path key={i} d={d} fill="none" stroke={pick()} strokeWidth={s * 0.028} strokeLinecap="round" opacity={0.8} />,
      );
    }
  }
  return nodes;
}

export interface MockupProps {
  garmentId: string;
  color: GarmentColor;
  position: PrintPosition;
  palette: Palette;
  styleId: string;
  seed: number;
  className?: string;
}

export function Mockup({ garmentId, color, position, palette, styleId, seed, className }: MockupProps) {
  const area = AREAS[position.id] ?? AREAS["chest-full"];
  const isBack = position.id === "back-full";
  const outline = color.ink === "dark" ? "#00000055" : "#00000022";
  const shade = color.ink === "dark" ? "#ffffff14" : "#00000009";

  let body: JSX.Element;
  if (garmentId === "tote") {
    body = (
      <g>
        <path d="M110 92 C110 66 130 52 150 52 C170 52 190 66 190 92" fill="none" stroke={color.hex} strokeWidth={9} />
        <rect x={78} y={92} width={144} height={170} rx={10} fill={color.hex} stroke={outline} strokeWidth={1.5} />
        <rect x={78} y={92} width={144} height={18} fill={shade} />
      </g>
    );
  } else {
    const hasHood = garmentId === "hoodie";
    body = (
      <g>
        {/* sleeves */}
        <path d="M96 96 L38 122 L54 178 L100 158 Z" fill={color.hex} stroke={outline} strokeWidth={1.5} />
        <path d="M204 96 L262 122 L246 178 L200 158 Z" fill={color.hex} stroke={outline} strokeWidth={1.5} />
        {/* torso */}
        <path
          d="M100 92 L118 78 C128 88 172 88 182 78 L200 92 L204 160 L200 268 C168 278 132 278 100 268 L96 160 Z"
          fill={color.hex}
          stroke={outline}
          strokeWidth={1.5}
        />
        {/* collar or hood */}
        {hasHood && !isBack ? (
          <path d="M118 78 C126 58 174 58 182 78 C172 92 128 92 118 78 Z" fill={shade} stroke={outline} strokeWidth={1.2} />
        ) : (
          <path d="M126 80 C138 90 162 90 174 80" fill="none" stroke={outline} strokeWidth={2} />
        )}
        {hasHood && !isBack && <path d="M142 92 L138 122 M158 92 L162 122" stroke={outline} strokeWidth={2} fill="none" />}
        {/* center back seam hint */}
        {isBack && <path d="M150 92 L150 268" stroke={shade} strokeWidth={2} fill="none" />}
      </g>
    );
  }

  return (
    <svg viewBox="0 0 300 300" className={className} role="img" aria-label="معاينة التصميم على القطعة">
      <rect x={0} y={0} width={300} height={300} fill="transparent" />
      {body}
      <g>{artwork(seed, styleId, palette, area)}</g>
      {/* print-area guide */}
      <rect
        x={area.x}
        y={area.y}
        width={area.w}
        height={area.h}
        fill="none"
        stroke={color.ink === "dark" ? "#ffffff2e" : "#00000018"}
        strokeWidth={1}
        strokeDasharray="4 4"
        rx={4}
      />
    </svg>
  );
}
