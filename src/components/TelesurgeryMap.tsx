import { useEffect, useMemo, useRef, useState } from "react";
import { teleEvents, TELE_MIN_T, TELE_MAX_T } from "@/data/telesurgery-events";
import { project, arcPath, buildLandPath, MAP_W, MAP_H } from "@/lib/geo";

const SPEED = 1.45; // decimal-years per second

// Deterministic starfield so positions are stable across renders.
const STARS = (() => {
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  return Array.from({ length: 80 }, () => ({
    x: rnd() * MAP_W,
    y: rnd() * MAP_H * 0.96,
    r: rnd() * 0.9 + 0.2,
    o: rnd() * 0.5 + 0.15,
  }));
})();

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");

export function TelesurgeryMap() {
  const land = useMemo(buildLandPath, []);
  const [clock, setClock] = useState(TELE_MIN_T);
  const [playing, setPlaying] = useState(true);
  const raf = useRef(0);
  const last = useRef(0);

  useEffect(() => {
    if (!playing) return;
    let mounted = true;
    last.current = performance.now();
    const tick = (now: number) => {
      if (!mounted) return;
      const dt = (now - last.current) / 1000;
      last.current = now;
      setClock((c) => {
        const n = c + dt * SPEED;
        if (n >= TELE_MAX_T) {
          setPlaying(false);
          return TELE_MAX_T;
        }
        return n;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      cancelAnimationFrame(raf.current);
    };
  }, [playing]);

  const revealed = useMemo(() => teleEvents.filter((e) => e.t <= clock), [clock]);
  const active = revealed[revealed.length - 1];
  const ended = clock >= TELE_MAX_T;

  const cumDist = revealed.reduce((s, e) => s + e.distanceKm, 0);
  const farthest = revealed.reduce((m, e) => Math.max(m, e.distanceKm), 0);
  const countries = new Set(revealed.flatMap((e) => [e.from.country, e.to.country])).size;
  const year = Math.min(2025, Math.floor(clock));

  function replay() {
    setClock(TELE_MIN_T);
    setPlaying(true);
  }
  function togglePlay() {
    if (ended) return replay();
    setPlaying((p) => !p);
  }

  return (
    <div className="-mx-5 overflow-hidden rounded-none bg-[#06101f] sm:mx-0 sm:rounded-[var(--radius-card)]">
      <div className="relative">
        <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} className="block w-full" role="img" aria-label="Telesurgery time-lapse world map">
          <defs>
            <radialGradient id="tele-bg" cx="50%" cy="38%" r="75%">
              <stop offset="0%" stopColor="#0d2444" />
              <stop offset="60%" stopColor="#081627" />
              <stop offset="100%" stopColor="#05101d" />
            </radialGradient>
            <linearGradient id="tele-arc-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4ECDC4" />
              <stop offset="55%" stopColor="#2bb3ff" />
              <stop offset="100%" stopColor="#e8568a" />
            </linearGradient>
            <linearGradient id="tele-arc-hero" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#4ECDC4" />
              <stop offset="100%" stopColor="#ffd36e" />
            </linearGradient>
            <filter id="tele-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="2.2" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="tele-glow-strong" x="-120%" y="-120%" width="340%" height="340%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          <rect width={MAP_W} height={MAP_H} fill="url(#tele-bg)" />

          {/* graticule */}
          {[...Array(11)].map((_, i) => (
            <line key={`v${i}`} x1={(i * MAP_W) / 11} y1={0} x2={(i * MAP_W) / 11} y2={MAP_H} stroke="#1b3a5c" strokeWidth={0.4} opacity={0.35} />
          ))}
          {[...Array(6)].map((_, i) => (
            <line key={`h${i}`} x1={0} y1={(i * MAP_H) / 6} x2={MAP_W} y2={(i * MAP_H) / 6} stroke="#1b3a5c" strokeWidth={0.4} opacity={0.35} />
          ))}

          {/* stars */}
          {STARS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#cfe8ff" opacity={s.o} />
          ))}

          {/* land */}
          <path d={land} fill="#11283f" stroke="#244a6e" strokeWidth={0.4} fillRule="evenodd" />

          {/* arcs */}
          {revealed.map((e) => {
            const a = project(e.from.lng, e.from.lat);
            const b = project(e.to.lng, e.to.lat);
            const d = arcPath(a, b);
            const isActive = e === active;
            const dur = isActive ? "1.7s" : "2.7s";
            return (
              <g key={e.id}>
                <path
                  id={`tarc-${e.id}`}
                  className="tele-arc"
                  d={d}
                  fill="none"
                  stroke={`url(#${e.hero ? "tele-arc-hero" : "tele-arc-grad"})`}
                  strokeWidth={isActive ? 2.1 : 1.2}
                  strokeLinecap="round"
                  pathLength={1}
                  opacity={isActive ? 1 : 0.55}
                  filter="url(#tele-glow)"
                />
                <circle r={isActive ? 3.2 : 2} fill={e.hero ? "#ffe6a8" : "#d8f6ff"} filter="url(#tele-glow-strong)">
                  <animateMotion dur={dur} repeatCount="indefinite" keyPoints="0;1" keyTimes="0;1" calcMode="linear">
                    <mpath href={`#tarc-${e.id}`} />
                  </animateMotion>
                </circle>
              </g>
            );
          })}

          {/* nodes */}
          {revealed.map((e) => {
            const a = project(e.from.lng, e.from.lat);
            const b = project(e.to.lng, e.to.lat);
            const isActive = e === active;
            const dotColor = e.hero ? "#ffd36e" : "#e8568a";
            return (
              <g key={`n-${e.id}`}>
                <circle className="tele-node" cx={a[0]} cy={a[1]} r={2.6} fill="#4ECDC4" filter="url(#tele-glow)" />
                <circle className="tele-node" cx={b[0]} cy={b[1]} r={2.8} fill={dotColor} filter="url(#tele-glow)" />
                {isActive && (
                  <>
                    <circle className="tele-ring" cx={a[0]} cy={a[1]} r={6} fill="none" stroke="#4ECDC4" strokeWidth={1.1} />
                    <circle className="tele-ring" cx={b[0]} cy={b[1]} r={7} fill="none" stroke={dotColor} strokeWidth={1.3} />
                    <text x={a[0]} y={a[1] - 9} textAnchor="middle" fontSize={9} fontWeight={700} fill="#bde7ff">{e.from.city}</text>
                    <text x={b[0]} y={b[1] + 16} textAnchor="middle" fontSize={9} fontWeight={700} fill={e.hero ? "#ffe6a8" : "#ffc2d6"}>{e.to.city}</text>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── HUD overlays ────────────────────────────────────────── */}
        <div className="pointer-events-none absolute left-4 top-4 max-w-[60%]">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[var(--color-accent)] sm:text-xs">
            The Collapse of Distance
          </p>
          <p className="mt-0.5 text-[11px] text-white/55 sm:text-sm">
            Telesurgery milestones · 2001–2025
          </p>
        </div>

        <div className="pointer-events-none absolute right-4 top-3 text-right">
          <div className="font-mono text-3xl font-bold leading-none text-white tabular-nums sm:text-5xl">{year}</div>
        </div>

        {/* legend */}
        <div className="pointer-events-none absolute left-4 bottom-3 flex items-center gap-3 text-[10px] text-white/55">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#4ECDC4]" /> Console</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-[#e8568a]" /> Patient</span>
        </div>
      </div>

      {/* ── HUD strip: caption (left) + counters (right) ─────────── */}
      <div className="flex flex-col gap-3 border-t border-white/10 px-4 py-3 lg:flex-row lg:items-stretch">
        <div className="min-h-[84px] flex-1">
          {active ? (
            <div className="flex items-start gap-2">
              <div className="flex flex-col items-start gap-1">
                <span className="font-mono text-[11px] text-[var(--color-accent)]">
                  {new Date(active.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                </span>
                {active.hero && (
                  <span className="rounded-full bg-[#ffd36e] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#3a2a00]">
                    ★ First FDA-cleared
                  </span>
                )}
              </div>
              <div className="border-l border-white/10 pl-3">
                <h3 className="text-sm font-bold text-white">{active.title}</h3>
                <p className="mt-0.5 text-[12px] font-semibold text-white/80">
                  {active.from.city} → {active.to.city} · {fmt(active.distanceKm)} km · {active.platform}
                </p>
                <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-white/60">{active.note}</p>
                <p className="mt-1 text-[10px] italic text-white/40">Source: {active.source}</p>
              </div>
            </div>
          ) : (
            <p className="text-[13px] text-white/60">
              Press play to watch surgery cross the planet — from one transatlantic first in 2001 to a worldwide network by 2025.
            </p>
          )}
        </div>

        <div className="grid shrink-0 grid-cols-4 gap-2 lg:w-[440px]">
          <Counter label="procedures" value={fmt(revealed.length)} />
          <Counter label="km remote" value={fmt(cumDist)} />
          <Counter label="farthest km" value={fmt(farthest)} />
          <Counter label="countries" value={fmt(countries)} />
        </div>
      </div>

      {/* ── Player controls ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause" : "Play"}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-teal)] text-sm font-bold text-[#06101f] transition-transform hover:scale-105"
        >
          {ended ? "↺" : playing ? "❚❚" : "▶"}
        </button>
        <div className="relative flex-1">
          <input
            type="range"
            min={TELE_MIN_T}
            max={TELE_MAX_T}
            step={0.01}
            value={clock}
            onChange={(e) => {
              setPlaying(false);
              setClock(+e.target.value);
            }}
            className="w-full"
            style={{ accentColor: "var(--color-teal)" }}
            aria-label="Timeline"
          />
          {/* event ticks */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 flex">
            {teleEvents.map((e) => (
              <span
                key={e.id}
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                style={{
                  left: `${((e.t - TELE_MIN_T) / (TELE_MAX_T - TELE_MIN_T)) * 100}%`,
                  background: e.t <= clock ? (e.hero ? "#ffd36e" : "var(--color-teal)") : "#33597f",
                }}
              />
            ))}
          </div>
        </div>
        <span className="shrink-0 font-mono text-xs text-white/55 tabular-nums">{year}</span>
      </div>
    </div>
  );
}

function Counter({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/5 px-2 py-1.5 text-center">
      <div className="font-mono text-sm font-bold leading-none text-white tabular-nums sm:text-lg">{value}</div>
      <div className="mt-1 text-[8.5px] uppercase tracking-wide text-white/45 sm:text-[9px]">{label}</div>
    </div>
  );
}
