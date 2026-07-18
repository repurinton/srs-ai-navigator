import type { View } from "@/App";

const NAV: { key: View; label: string }[] = [
  { key: "thesis", label: "The thesis" },
  { key: "levers", label: "Six levers" },
  { key: "case", label: "Hospital lab" },
  { key: "model", label: "Operating model" },
  { key: "portfolio", label: "Portfolio" },
  { key: "timeline", label: "Timeline" },
];

export function Header({ view, onNavigate }: { view: View; onNavigate: (view: View) => void }) {
  return (
    <header className="app-header sticky top-0 z-50 border-b border-white/10 bg-[rgba(5,18,27,0.94)] text-white backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-5 py-3 sm:px-8 lg:px-12">
        <button
          type="button"
          onClick={() => onNavigate("thesis")}
          className="flex shrink-0 items-center gap-3 text-left"
          aria-label="Return to the thesis"
        >
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>
            <span className="block text-[13px] font-extrabold tracking-[-0.01em]">AI × HOSPITAL OPERATIONS</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em] text-white/45">SRS · 2026</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 xl:flex" aria-label="Presentation chapters">
          {NAV.map((item, index) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              aria-current={view === item.key ? "page" : undefined}
              className="rounded-full px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.1em] transition-colors"
              style={{
                background: view === item.key ? "rgba(91, 240, 195, 0.14)" : "transparent",
                color: view === item.key ? "var(--color-mint)" : "rgba(255,255,255,0.58)",
              }}
            >
              <span className="mr-1 text-white/30">0{index + 1}</span>{item.label}
            </button>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => onNavigate("case")}
          className="hidden shrink-0 rounded-full border border-[var(--color-mint)]/50 px-4 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[var(--color-mint)] transition-colors hover:bg-[var(--color-mint)] hover:text-[var(--color-night)] sm:block"
        >
          Run simulation
        </button>
      </div>

      <div className="overflow-x-auto border-t border-white/5 xl:hidden">
        <nav className="mx-auto flex min-w-max items-center px-4" aria-label="Presentation chapters">
          {NAV.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onNavigate(item.key)}
              aria-current={view === item.key ? "page" : undefined}
              className="border-b-2 px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em]"
              style={{
                borderColor: view === item.key ? "var(--color-mint)" : "transparent",
                color: view === item.key ? "var(--color-mint)" : "rgba(255,255,255,0.5)",
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
