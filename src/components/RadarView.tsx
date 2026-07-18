import { useMemo } from "react";
import type { UseCase } from "@/data/schema";
import { plotDots, type RadarGeom } from "@/lib/radar";

const G: RadarGeom = { cx: 410, cy: 410, maxR: 310, plotR: 280 };

const QUADRANT_FILL = [
  { color: "#2ec7d6", opacity: 0.09 }, // TR
  { color: "#3aa0e8", opacity: 0.09 }, // TL
  { color: "#E87722", opacity: 0.09 }, // BL
  { color: "#43c98d", opacity: 0.09 }, // BR
];

const ARC_LABELS = [
  { id: "arcTR", text: "AUTONOMOUS PATIENT AI", sub: "Self-Driving Consumer Experience", color: "#2ec7d6", a0: -Math.PI / 2, a1: -0, flip: false },
  { id: "arcTL", text: "INTELLIGENT AUTOMATION", sub: "Zero-Touch Enterprise Operations", color: "#3aa0e8", a0: -Math.PI, a1: -Math.PI / 2, flip: false },
  { id: "arcBL", text: "OPERATIONAL INTELLIGENCE", sub: "Data-Driven Revenue Analytics", color: "#E87722", a0: Math.PI / 2, a1: Math.PI, flip: true },
  { id: "arcBR", text: "AUGMENTED CARE DELIVERY", sub: "AI-Enhanced Clinical Decisions", color: "#43c98d", a0: 0, a1: Math.PI / 2, flip: true },
];

const MATURITY_LEGEND = [
  { label: "Standard of Care", color: "#43c98d" },
  { label: "Best Practice", color: "#4db8ff" },
  { label: "Frontier", color: "#E87722" },
  { label: "Emerging Research", color: "#9d86b3" },
];

const PAD = 0.12;

function arcD(r: number, a0: number, a1: number, flip: boolean): string {
  const start = a0 + PAD;
  const end = a1 - PAD;
  const x1 = G.cx + r * Math.cos(start);
  const y1 = G.cy + r * Math.sin(start);
  const x2 = G.cx + r * Math.cos(end);
  const y2 = G.cy + r * Math.sin(end);
  const large = Math.abs(end - start) > Math.PI ? 1 : 0;
  return flip
    ? `M${x2.toFixed(1)},${y2.toFixed(1)} A${r},${r} 0 ${large},0 ${x1.toFixed(1)},${y1.toFixed(1)}`
    : `M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

export function RadarView({
  ucs,
  onSelect,
}: {
  ucs: UseCase[];
  onSelect?: (uc: UseCase) => void;
}) {
  const { cx, cy, maxR } = G;
  const dots = useMemo(() => plotDots(ucs, G), [ucs]);
  const arcR = maxR + 20;
  const arcRsub = maxR + 44;

  return (
    <div className="rounded-[var(--radius-card)] border border-white/10 bg-white/[0.035] p-3 shadow-[var(--shadow-card)]">
      <div className="mb-1 flex items-center gap-2 px-2 pt-1">
        <h3 className="text-sm font-bold text-white">
          Autonomy vs. Patient Proximity Radar
        </h3>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/70">
          {ucs.length}
        </span>
      </div>

      <svg viewBox="-80 -80 980 980" className="mx-auto block w-full max-w-[860px]" role="img" aria-label="Autonomy vs patient proximity radar">
        <rect x={-80} y={-80} width={980} height={980} fill="var(--color-deep)" rx={8} />

        {/* Quadrant wedge fills */}
        <path d={`M${cx},${cy} L${cx + maxR},${cy} A${maxR},${maxR} 0 0,0 ${cx},${cy - maxR} Z`} fill={QUADRANT_FILL[0].color} opacity={QUADRANT_FILL[0].opacity} />
        <path d={`M${cx},${cy} L${cx},${cy - maxR} A${maxR},${maxR} 0 0,0 ${cx - maxR},${cy} Z`} fill={QUADRANT_FILL[1].color} opacity={QUADRANT_FILL[1].opacity} />
        <path d={`M${cx},${cy} L${cx - maxR},${cy} A${maxR},${maxR} 0 0,0 ${cx},${cy + maxR} Z`} fill={QUADRANT_FILL[2].color} opacity={QUADRANT_FILL[2].opacity} />
        <path d={`M${cx},${cy} L${cx},${cy + maxR} A${maxR},${maxR} 0 0,0 ${cx + maxR},${cy} Z`} fill={QUADRANT_FILL[3].color} opacity={QUADRANT_FILL[3].opacity} />

        {/* Concentric rings */}
        {[105, 210, maxR].map((r) => (
          <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={1} strokeDasharray="6,4" />
        ))}

        {/* Axes */}
        <line x1={cx} y1={cy - maxR - 10} x2={cx} y2={cy + maxR + 10} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
        <line x1={cx - maxR - 10} y1={cy} x2={cx + maxR + 10} y2={cy} stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} />
        <polygon points={`${cx},${cy - maxR - 18} ${cx - 5},${cy - maxR - 8} ${cx + 5},${cy - maxR - 8}`} fill="rgba(255,255,255,0.45)" />
        <polygon points={`${cx},${cy + maxR + 18} ${cx - 5},${cy + maxR + 8} ${cx + 5},${cy + maxR + 8}`} fill="rgba(255,255,255,0.45)" />
        <polygon points={`${cx - maxR - 18},${cy} ${cx - maxR - 8},${cy - 5} ${cx - maxR - 8},${cy + 5}`} fill="rgba(255,255,255,0.45)" />
        <polygon points={`${cx + maxR + 18},${cy} ${cx + maxR + 8},${cy - 5} ${cx + maxR + 8},${cy + 5}`} fill="rgba(255,255,255,0.45)" />

        {/* Axis labels */}
        <text x={cx} y={cy - maxR - 30} textAnchor="middle" fill="rgba(255,255,255,0.88)" fontSize={20} fontWeight={700} letterSpacing={2}>FULLY AUTONOMOUS</text>
        <text x={cx} y={cy - maxR - 48} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize={13}>(AI Acts Independently)</text>
        <text x={cx} y={cy + maxR + 42} textAnchor="middle" fill="rgba(255,255,255,0.88)" fontSize={20} fontWeight={700} letterSpacing={2}>DECISION SUPPORT</text>
        <text x={cx} y={cy + maxR + 60} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize={13}>(AI Augments Human Judgment)</text>
        <text x={cx - maxR - 34} y={cy - 4} textAnchor="middle" fill="rgba(255,255,255,0.88)" fontSize={18} fontWeight={700} letterSpacing={1} transform={`rotate(-90,${cx - maxR - 34},${cy})`}>INTERNAL</text>
        <text x={cx - maxR - 54} y={cy - 4} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize={12} transform={`rotate(-90,${cx - maxR - 54},${cy})`}>(Operations / Back Office)</text>
        <text x={cx + maxR + 34} y={cy + 4} textAnchor="middle" fill="rgba(255,255,255,0.88)" fontSize={18} fontWeight={700} letterSpacing={1} transform={`rotate(90,${cx + maxR + 34},${cy})`}>EXTERNAL</text>
        <text x={cx + maxR + 54} y={cy + 4} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize={12} transform={`rotate(90,${cx + maxR + 54},${cy})`}>(Patient / Consumer Facing)</text>

        {/* Curved quadrant labels */}
        <defs>
          {ARC_LABELS.map((al) => (
            <g key={al.id}>
              <path id={al.id} d={arcD(arcR, al.a0, al.a1, al.flip)} fill="none" />
              <path id={`${al.id}sub`} d={arcD(arcRsub, al.a0, al.a1, al.flip)} fill="none" />
            </g>
          ))}
        </defs>
        {ARC_LABELS.map((al) => (
          <g key={`lbl-${al.id}`}>
            <text fill={al.color} fontSize={16} fontWeight={800} letterSpacing={2.5} opacity={0.8}>
              <textPath href={`#${al.id}`} startOffset="50%" textAnchor="middle">{al.text}</textPath>
            </text>
            <text fill={al.color} fontSize={11} fontWeight={500} fontStyle="italic" opacity={0.5} letterSpacing={0.5}>
              <textPath href={`#${al.id}sub`} startOffset="50%" textAnchor="middle">{al.sub}</textPath>
            </text>
          </g>
        ))}

        {/* Dots */}
        {dots.map((d) => (
          <g key={d.uc.id}>
            {d.uc.fdaCleared && (
              <circle cx={d.x} cy={d.y} r={d.r + 2.5} fill="none" stroke={d.color} strokeWidth={1} opacity={0.3} />
            )}
            <circle
              cx={d.x}
              cy={d.y}
              r={d.r}
              fill={d.color}
              fillOpacity={0.8}
              stroke={d.color}
              strokeWidth={1.5}
              style={{ cursor: onSelect ? "pointer" : "default" }}
              onClick={() => onSelect?.(d.uc)}
            >
              <title>{`${d.uc.name} (${d.uc.id}) — ${d.uc.maturity}`}</title>
            </circle>
          </g>
        ))}

        {/* Legend */}
        {MATURITY_LEGEND.map((ml, i) => {
          const lx = 60 + i * 210;
          return (
            <g key={ml.label}>
              <circle cx={lx} cy={-55} r={6} fill={ml.color} />
              <text x={lx + 12} y={-51} fontSize={11} fontWeight={600} fill="rgba(255,255,255,0.75)">{ml.label}</text>
            </g>
          );
        })}
        <circle cx={60} cy={-33} r={5} fill="#8B9BB5" fillOpacity={0.5} />
        <circle cx={60} cy={-33} r={7.5} fill="none" stroke="#8B9BB5" strokeWidth={1} opacity={0.4} />
        <text x={72} y={-29} fontSize={10} fill="rgba(255,255,255,0.6)">= FDA Cleared (outer ring)</text>
      </svg>
    </div>
  );
}
