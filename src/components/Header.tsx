export function Header() {
  return (
    <header className="bg-[var(--color-navy)] text-white">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold"
            style={{
              background:
                "linear-gradient(135deg, var(--color-teal) 0%, var(--color-cyan) 100%)",
            }}
            aria-hidden
          >
            ⬡
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">
              Robotic Surgery &amp; Surgical AI Navigator
            </h1>
            <p className="text-xs font-medium text-white/60">
              SRS 2026 · Innovation Continues
            </p>
          </div>
        </div>
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold text-[var(--color-accent)]">
            Society of Robotic Surgery
          </p>
          <p className="text-xs text-white/55">Jul 23–26, 2026 · Fort Lauderdale</p>
        </div>
      </div>
    </header>
  );
}
