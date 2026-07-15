import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ExecutiveStory } from "@/components/ExecutiveStory";
import { SixLevers } from "@/components/SixLevers";
import { LiveCase } from "@/components/LiveCase";
import { OperatingModel } from "@/components/OperatingModel";
import { Header } from "@/components/Header";

export type View = "thesis" | "levers" | "case" | "model" | "portfolio" | "timeline";

const VIEW_ORDER: View[] = ["thesis", "levers", "case", "model", "portfolio", "timeline"];

const loadPortfolioView = () => import("@/components/PortfolioView");
const loadTelesurgeryMap = () => import("@/components/TelesurgeryMap");

const PortfolioView = lazy(() =>
  loadPortfolioView().then((module) => ({ default: module.PortfolioView })),
);
const TelesurgeryMap = lazy(() =>
  loadTelesurgeryMap().then((module) => ({ default: module.TelesurgeryMap })),
);

function viewFromHash(): View {
  const candidate = window.location.hash.slice(1) as View;
  return VIEW_ORDER.includes(candidate) ? candidate : "thesis";
}

export default function App() {
  const [view, setView] = useState<View>(viewFromHash);
  const mainRef = useRef<HTMLElement>(null);

  function focusChapter() {
    window.requestAnimationFrame(() => mainRef.current?.focus({ preventScroll: true }));
  }

  function navigate(next: View) {
    setView(next);
    if (window.location.hash !== `#${next}`) window.location.hash = next;
    window.scrollTo({ top: 0, behavior: "smooth" });
    focusChapter();
  }

  useEffect(() => {
    const handleHashChange = () => {
      setView(viewFromHash());
      window.scrollTo({ top: 0, behavior: "smooth" });
      focusChapter();
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    const preloadPresenterChapters = () => {
      void Promise.allSettled([loadPortfolioView(), loadTelesurgeryMap()]);
    };
    const idleApi = window as unknown as {
      requestIdleCallback?: typeof window.requestIdleCallback;
      cancelIdleCallback?: typeof window.cancelIdleCallback;
    };

    if (idleApi.requestIdleCallback && idleApi.cancelIdleCallback) {
      const handle = idleApi.requestIdleCallback(preloadPresenterChapters, { timeout: 1500 });
      return () => idleApi.cancelIdleCallback?.(handle);
    }

    const handle = window.setTimeout(preloadPresenterChapters, 600);
    return () => window.clearTimeout(handle);
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, select, textarea, button")) return;
      const current = VIEW_ORDER.indexOf(view);
      const delta = event.key === "ArrowRight" ? 1 : -1;
      const next = Math.min(VIEW_ORDER.length - 1, Math.max(0, current + delta));
      if (next !== current) {
        event.preventDefault();
        navigate(VIEW_ORDER[next]);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [view]);

  return (
    <div className="min-h-full bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <Header view={view} onNavigate={navigate} />

      <main ref={mainRef} tabIndex={-1} className="focus:outline-none">
        {view === "thesis" && <ExecutiveStory onNavigate={navigate} />}
        {view === "levers" && <SixLevers onNavigate={navigate} />}
        {view === "case" && <LiveCase onNavigate={navigate} />}
        {view === "model" && <OperatingModel onNavigate={navigate} />}
        {view === "portfolio" && (
          <Suspense fallback={<ChapterLoading label="Loading the evidence library" />}>
            <PortfolioView />
          </Suspense>
        )}
        {view === "timeline" && (
          <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-10 sm:px-8 lg:px-12">
            <div className="mb-8 max-w-3xl">
              <p className="eyebrow">One technology arc</p>
              <h1 className="display-title mt-3">Distance collapsed. Coordination is next.</h1>
              <p className="lede mt-5">
                Robotic surgery proved that expertise can travel. The next operating frontier is making the
                institution around every case move with the same precision.
              </p>
            </div>
            <Suspense fallback={<ChapterLoading label="Loading the surgical timeline" />}>
              <TelesurgeryMap />
            </Suspense>
          </div>
        )}
      </main>

      <footer className="border-t border-[var(--color-line)] bg-white/70 px-5 py-5 text-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--color-muted)]">
        AI Transforming Hospital Operations · Society of Robotic Surgery · July 2026 · Use arrow keys to move between chapters
      </footer>
    </div>
  );
}

function ChapterLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-[45vh] items-center justify-center" role="status" aria-live="polite">
      <span className="eyebrow">{label}…</span>
    </div>
  );
}
