import type { StageState } from "../../types";

const PH_SCALE = ["#dc2626", "#ea580c", "#f59e0b", "#eab308", "#84cc16", "#22c55e", "#10b981", "#14b8a6", "#0ea5e9", "#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#c026d3", "#d946ef"];

/** منصة التجربة: رسم SVG لكأس زجاجي تفاعلي يعكس حالة الخطوة الحالية */
export function ExperimentStage({ stage }: { stage: StageState }) {
  const level = stage.liquidLevel ?? 0;
  const liquidTop = 250 - level * 160;

  return (
    <div>
      <svg viewBox="0 0 360 300" className="chem-stage-svg" role="img" aria-label={stage.caption}>
        <defs>
          <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(191,232,255,0.16)" />
            <stop offset="50%" stopColor="rgba(191,232,255,0.05)" />
            <stop offset="100%" stopColor="rgba(191,232,255,0.16)" />
          </linearGradient>
          <linearGradient id="liquid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stage.liquidColor ?? "#38bdf8"} stopOpacity="0.85" />
            <stop offset="100%" stopColor={stage.liquidColor ?? "#38bdf8"} stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* سطح الطاولة */}
        <rect x="20" y="262" width="320" height="10" rx="5" fill="#16263f" />

        {/* اللهب أسفل الكأس */}
        {stage.flame && (
          <g className="chem-anim-flame">
            <ellipse cx="180" cy="258" rx="26" ry="18" fill="#f97316" opacity="0.85" />
            <ellipse cx="180" cy="260" rx="15" ry="11" fill="#fbbf24" />
            <ellipse cx="180" cy="261" rx="7" ry="6" fill="#7dd3fc" />
          </g>
        )}

        {/* السائل */}
        {level > 0 && (
          <g>
            <rect x="112" y={liquidTop} width="136" height={250 - liquidTop} rx="4" fill="url(#liquid)" />
            <ellipse cx="180" cy={liquidTop} rx="68" ry="7" fill={stage.liquidColor ?? "#38bdf8"} opacity="0.9" />
          </g>
        )}

        {/* جسيمات المذاب */}
        {stage.particles &&
          Array.from({ length: stage.particles.count }).map((_, i) => {
            const px = 122 + ((i * 53) % 116);
            const py = stage.particles!.settled
              ? 236 - ((i * 17) % 14)
              : liquidTop + 16 + ((i * 37) % Math.max(230 - liquidTop, 20));
            return (
              <circle
                key={i}
                className={stage.particles!.settled ? undefined : "chem-anim-drift"}
                style={{ animationDelay: `${(i % 5) * 0.55}s` }}
                cx={px}
                cy={py}
                r={4}
                fill={stage.particles!.color}
                opacity="0.9"
              />
            );
          })}

        {/* فقاعات */}
        {stage.bubbles &&
          Array.from({ length: 7 }).map((_, i) => (
            <circle
              key={`bub-${i}`}
              className="chem-anim-bubble"
              style={{ animationDelay: `${i * 0.4}s` }}
              cx={130 + ((i * 31) % 100)}
              cy={244}
              r={3 + (i % 3)}
              fill="rgba(224,242,254,0.75)"
            />
          ))}

        {/* جدار الكأس الزجاجي */}
        <path
          d="M108 78 L108 246 Q108 254 116 254 L244 254 Q252 254 252 246 L252 78"
          fill="url(#glass)"
          stroke="rgba(186,230,253,0.5)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <line x1="100" y1="76" x2="118" y2="76" stroke="rgba(186,230,253,0.5)" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="242" y1="76" x2="260" y2="76" stroke="rgba(186,230,253,0.5)" strokeWidth="2.5" strokeLinecap="round" />
        {/* تدريج */}
        {[0, 1, 2].map((i) => (
          <line key={i} x1="234" y1={120 + i * 40} x2="248" y2={120 + i * 40} stroke="rgba(186,230,253,0.35)" strokeWidth="2" />
        ))}

        {/* بادجات المواد الطافية */}
        {stage.badges?.map((b, i) => {
          const bx = 180 + (i - (stage.badges!.length - 1) / 2) * 74;
          return (
            <g key={i} className="chem-anim-float" style={{ animationDelay: `${i * 0.5}s` }}>
              <rect x={bx - 32} y={30} width="64" height="26" rx="13" fill="rgba(8,14,27,0.85)" stroke={b.color} strokeWidth="1.5" />
              <text x={bx} y={47} textAnchor="middle" fill={b.color} fontSize="13" fontWeight="700" fontFamily="Tajawal, sans-serif">
                {b.text}
              </text>
            </g>
          );
        })}

        {/* مقياس pH */}
        {stage.phValue !== undefined && (
          <g>
            {PH_SCALE.map((c, i) => (
              <rect key={i} x={40 + i * 19} y={284} width="17" height="10" rx="2" fill={c} opacity={i === Math.round((stage.phValue! / 14) * 14) ? 1 : 0.35} />
            ))}
            <g>
              <circle cx={40 + Math.round((stage.phValue / 14) * 14) * 19 + 8.5} cy={280} r="3.5" fill="#ecf5ff" />
              <text x={40 + Math.round((stage.phValue / 14) * 14) * 19 + 8.5} y={273} textAnchor="middle" fill="#ecf5ff" fontSize="12" fontWeight="800" fontFamily="Tajawal, sans-serif">
                pH {stage.phValue}
              </text>
            </g>
          </g>
        )}
      </svg>
      <div className="chem-stage-caption">{stage.caption}</div>
    </div>
  );
}
