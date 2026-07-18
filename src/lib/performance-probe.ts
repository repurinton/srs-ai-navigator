type LayoutShiftEntry = PerformanceEntry & {
  value?: number;
  hadRecentInput?: boolean;
};

type LargestContentfulPaintEntry = PerformanceEntry & {
  renderTime?: number;
  loadTime?: number;
};

export type HospitalPerformanceProbe = {
  schemaVersion: 1;
  ready: true;
  durationMs: number;
  sampleCount: number;
  frameTimeP50Ms: number;
  frameTimeP95Ms: number;
  frameTimeP99Ms: number;
  estimatedFpsP50: number;
  estimatedFpsP5: number;
  droppedFrameRatePct: number;
  longTaskCount: number;
  longTaskTotalMs: number;
  longestLongTaskMs: number;
  cumulativeLayoutShift: number;
  largestContentfulPaintMs: number | null;
  firstContentfulPaintMs: number | null;
  resourceCount: number;
  transferredKiB: number;
  scriptResourceCount: number;
  imageResourceCount: number;
  runtimeErrorCount: number;
};

type HospitalStoryTimingProbe = {
  schemaVersion: 1;
  ready: true;
  runtimeMs: number;
  observedStateCount: number;
  stateTransitions: Array<{ stateId: string; elapsedMs: number }>;
};

type Rgba = [number, number, number, number];

type HospitalAccessibilityProbe = {
  schemaVersion: 1;
  ready: true;
  pass: boolean;
  interactiveCount: number;
  keyboardReachabilityPercent: number;
  minimumTargetPx: number;
  unnamedControlCount: number;
  duplicateAccessibleNameCount: number;
  visibleFocusFailureCount: number;
  minimumFocusContrast: number;
  normalTextContrastMinimum: number;
  largeTextContrastMinimum: number | null;
  contrastFailureCount: number;
  colorIndependentMeaningPercent: number;
  liveRegionCount: number;
};

const round = (value: number, digits = 2) => Number(value.toFixed(digits));

function percentile(values: number[], quantile: number) {
  if (!values.length) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * quantile) - 1));
  return sorted[index] ?? 0;
}

function parseCssColor(value: string): Rgba {
  if (value === "transparent") return [0, 0, 0, 0];
  const rgb = value.match(/^rgba?\(([^)]+)\)$/u);
  if (rgb) {
    const components = (rgb[1] ?? "").replace(/\//gu, " ").split(/[\s,]+/u).filter(Boolean).map(Number);
    return [components[0] ?? 0, components[1] ?? 0, components[2] ?? 0, components[3] ?? 1];
  }
  const srgb = value.match(/^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/u);
  if (srgb) return [Number(srgb[1]) * 255, Number(srgb[2]) * 255, Number(srgb[3]) * 255, Number(srgb[4] ?? 1)];
  return [0, 0, 0, 0];
}

function composite(foreground: Rgba, background: Rgba): Rgba {
  const alpha = foreground[3] + background[3] * (1 - foreground[3]);
  if (alpha === 0) return [0, 0, 0, 0];
  return [
    (foreground[0] * foreground[3] + background[0] * background[3] * (1 - foreground[3])) / alpha,
    (foreground[1] * foreground[3] + background[1] * background[3] * (1 - foreground[3])) / alpha,
    (foreground[2] * foreground[3] + background[2] * background[3] * (1 - foreground[3])) / alpha,
    alpha,
  ];
}

function effectiveBackground(element: Element) {
  const lineage: Element[] = [];
  for (let current: Element | null = element; current; current = current.parentElement) lineage.unshift(current);
  return lineage.reduce<Rgba>((background, current) => {
    const color = parseCssColor(getComputedStyle(current).backgroundColor);
    return color[3] > 0 ? composite(color, background) : background;
  }, [6, 15, 24, 1]);
}

function relativeLuminance(color: Rgba) {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(color[0]) + 0.7152 * channel(color[1]) + 0.0722 * channel(color[2]);
}

function contrastRatio(foreground: Rgba, background: Rgba) {
  const renderedForeground = composite(foreground, background);
  const foregroundLuminance = relativeLuminance(renderedForeground);
  const backgroundLuminance = relativeLuminance(background);
  return (Math.max(foregroundLuminance, backgroundLuminance) + 0.05)
    / (Math.min(foregroundLuminance, backgroundLuminance) + 0.05);
}

export function scheduleHospitalPerformanceProbe() {
  const parameters = new URLSearchParams(window.location.search);
  if (parameters.get("qa") !== "performance") return;

  const runtimeErrors: string[] = [];
  window.addEventListener("error", (event) => runtimeErrors.push(event.message || "window error"));
  window.addEventListener("unhandledrejection", () => runtimeErrors.push("unhandled rejection"));

  const frameIntervals: number[] = [];
  const longTasks: number[] = [];
  let cumulativeLayoutShift = 0;
  let largestContentfulPaintMs: number | null = null;
  const observers: PerformanceObserver[] = [];

  const observe = (type: string, callback: (entries: PerformanceEntry[]) => void) => {
    if (!PerformanceObserver.supportedEntryTypes.includes(type)) return;
    const observer = new PerformanceObserver((list) => callback(list.getEntries()));
    observer.observe({ type, buffered: true });
    observers.push(observer);
  };

  observe("longtask", (entries) => entries.forEach((entry) => longTasks.push(entry.duration)));
  observe("layout-shift", (entries) => entries.forEach((entry) => {
    const shift = entry as LayoutShiftEntry;
    if (!shift.hadRecentInput) cumulativeLayoutShift += shift.value ?? 0;
  }));
  observe("largest-contentful-paint", (entries) => entries.forEach((entry) => {
    const paint = entry as LargestContentfulPaintEntry;
    largestContentfulPaintMs = paint.renderTime || paint.loadTime || paint.startTime;
  }));

  const probeDelayMs = 1_200;
  const probeDurationMs = 6_000;
  window.setTimeout(() => {
    const startedAt = performance.now();
    let previousFrame: number | null = null;

    const complete = () => {
      observers.forEach((observer) => observer.disconnect());
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const firstContentfulPaint = performance
        .getEntriesByName("first-contentful-paint")
        .at(-1)?.startTime ?? null;
      const p50 = percentile(frameIntervals, 0.5);
      const p95 = percentile(frameIntervals, 0.95);
      const p99 = percentile(frameIntervals, 0.99);
      const droppedFrames = frameIntervals.filter((interval) => interval > 25).length;
      const result: HospitalPerformanceProbe = {
        schemaVersion: 1,
        ready: true,
        durationMs: probeDurationMs,
        sampleCount: frameIntervals.length,
        frameTimeP50Ms: round(p50),
        frameTimeP95Ms: round(p95),
        frameTimeP99Ms: round(p99),
        estimatedFpsP50: p50 ? round(1_000 / p50, 1) : 0,
        estimatedFpsP5: p95 ? round(1_000 / p95, 1) : 0,
        droppedFrameRatePct: frameIntervals.length ? round((droppedFrames / frameIntervals.length) * 100) : 100,
        longTaskCount: longTasks.length,
        longTaskTotalMs: round(longTasks.reduce((total, duration) => total + duration, 0)),
        longestLongTaskMs: round(Math.max(0, ...longTasks)),
        cumulativeLayoutShift: round(cumulativeLayoutShift, 4),
        largestContentfulPaintMs: largestContentfulPaintMs === null ? null : round(largestContentfulPaintMs),
        firstContentfulPaintMs: firstContentfulPaint === null ? null : round(firstContentfulPaint),
        resourceCount: resources.length,
        transferredKiB: round(resources.reduce((total, resource) => total + resource.transferSize, 0) / 1_024, 1),
        scriptResourceCount: resources.filter((resource) => resource.initiatorType === "script").length,
        imageResourceCount: resources.filter((resource) => resource.initiatorType === "img" || resource.name.endsWith(".webp")).length,
        runtimeErrorCount: runtimeErrors.length,
      };
      document.documentElement.dataset.performanceQa = JSON.stringify(result);
      document.documentElement.dataset.performanceQaReady = "true";
    };

    const sample = (timestamp: number) => {
      if (previousFrame !== null) frameIntervals.push(timestamp - previousFrame);
      previousFrame = timestamp;
      if (performance.now() - startedAt >= probeDurationMs) {
        complete();
        return;
      }
      window.requestAnimationFrame(sample);
    };
    window.requestAnimationFrame(sample);
  }, probeDelayMs);
}

export function scheduleHospitalStoryTimingProbe() {
  const parameters = new URLSearchParams(window.location.search);
  if (parameters.get("qa") !== "story-timing") return;

  let startedAt: number | null = null;
  let lastStateId: string | null = null;
  const stateTransitions: HospitalStoryTimingProbe["stateTransitions"] = [];

  const inspect = () => {
    const shell = document.querySelector<HTMLElement>(".twin-shell");
    const playButton = document.querySelector<HTMLButtonElement>('[data-testid="story-play"]');
    const stateId = shell?.dataset.storyStateId;
    const buttonText = playButton?.textContent?.trim() ?? "";
    if (!stateId || !playButton) return;

    if (startedAt === null && buttonText === "Pause guided demo") startedAt = performance.now();
    if (startedAt !== null && stateId !== lastStateId) {
      stateTransitions.push({ stateId, elapsedMs: round(performance.now() - startedAt) });
      lastStateId = stateId;
    }

    if (startedAt !== null && stateId === "automation:reveal" && buttonText === "Replay guided demo") {
      const result: HospitalStoryTimingProbe = {
        schemaVersion: 1,
        ready: true,
        runtimeMs: round(performance.now() - startedAt),
        observedStateCount: stateTransitions.length,
        stateTransitions,
      };
      document.documentElement.dataset.storyTimingQa = JSON.stringify(result);
      document.documentElement.dataset.storyTimingQaReady = "true";
      observer.disconnect();
    }
  };

  const observer = new MutationObserver(inspect);
  observer.observe(document.documentElement, {
    attributes: true,
    childList: true,
    characterData: true,
    subtree: true,
  });
  window.setTimeout(inspect, 0);
}

export function scheduleHospitalAccessibilityProbe() {
  const parameters = new URLSearchParams(window.location.search);
  if (parameters.get("qa") !== "accessibility") return;

  window.setTimeout(() => {
    const isVisible = (element: Element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const accessibleName = (element: Element) => {
      const labelledBy = (element.getAttribute("aria-labelledby") ?? "")
        .split(/\s+/u)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
        .join(" ")
        .trim();
      return element.getAttribute("aria-label")?.trim()
        || labelledBy
        || element.textContent?.replace(/\s+/gu, " ").trim()
        || "";
    };

    const interactives = Array.from(document.querySelectorAll<HTMLElement>(
      'a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])',
    )).filter(isVisible);
    const names = interactives.map(accessibleName);
    const duplicateNames = names.filter((name, index) => name && names.indexOf(name) !== index);
    const focusResults = interactives.map((element) => {
      element.focus();
      const style = getComputedStyle(element);
      const outlineWidth = Number.parseFloat(style.outlineWidth);
      const focusContrast = contrastRatio(
        parseCssColor(style.outlineColor),
        effectiveBackground(element.parentElement ?? element),
      );
      const rect = element.getBoundingClientRect();
      return {
        reached: document.activeElement === element,
        visible: style.outlineStyle !== "none" && outlineWidth >= 2 && focusContrast >= 3,
        focusContrast,
        width: rect.width,
        height: rect.height,
      };
    });
    (document.activeElement as HTMLElement | null)?.blur();

    const contrastSelectors = [
      ".twin-command-actions button",
      ".cutaway-callout-kicker",
      ".cutaway-callout-card strong",
      ".cutaway-callout-detail",
      ".cutaway-callout-card b",
      ".cutaway-flow-kicker",
      ".cutaway-flow-dashboard-header strong",
      ".cutaway-flow-dashboard-header small",
      ".cutaway-flow-constraint span",
      ".cutaway-flow-constraint strong",
      ".cutaway-flow-metrics dt",
      ".cutaway-flow-metrics dd",
      ".cutaway-flow-metrics small",
      ".twin-stage-caption span",
      ".twin-stage-caption strong",
      ".twin-stage-caption p",
      ".twin-trust-line",
    ];
    const contrastTargets = Array.from(new Set(
      contrastSelectors.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector))),
    )).filter((element) => isVisible(element) && Boolean(element.textContent?.trim()));
    const contrastResults = contrastTargets.map((element) => {
      const style = getComputedStyle(element);
      const background = effectiveBackground(element);
      const ratio = contrastRatio(parseCssColor(style.color), background);
      const fontSize = Number.parseFloat(style.fontSize);
      const fontWeight = Number.parseFloat(style.fontWeight) || 400;
      const large = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      return { ratio, large, pass: ratio >= (large ? 3 : 4.5) };
    });
    const normalContrasts = contrastResults.filter((result) => !result.large).map((result) => result.ratio);
    const largeContrasts = contrastResults.filter((result) => result.large).map((result) => result.ratio);
    const colorMeaningChecks = [
      Boolean(document.querySelector(".cutaway-callout-kicker")?.textContent?.trim()),
      Boolean(document.querySelector(".cutaway-callout-card strong")?.textContent?.trim()),
      Boolean(document.querySelector(".cutaway-flow-constraint span")?.textContent?.trim()),
      Boolean(document.querySelector(".cutaway-flow-constraint strong")?.textContent?.trim()),
    ];
    const minimumTarget = Math.min(...focusResults.flatMap((result) => [result.width, result.height]));
    const keyboardReached = focusResults.filter((result) => result.reached).length;
    const visibleFocusFailures = focusResults.filter((result) => !result.visible).length;
    const contrastFailures = contrastResults.filter((result) => !result.pass).length;
    const result: HospitalAccessibilityProbe = {
      schemaVersion: 1,
      ready: true,
      pass: interactives.length > 0
        && keyboardReached === interactives.length
        && minimumTarget >= 44
        && names.every(Boolean)
        && duplicateNames.length === 0
        && visibleFocusFailures === 0
        && contrastFailures === 0
        && colorMeaningChecks.every(Boolean)
        && document.querySelectorAll('[aria-live="polite"]').length > 0,
      interactiveCount: interactives.length,
      keyboardReachabilityPercent: round((keyboardReached / interactives.length) * 100, 1),
      minimumTargetPx: round(minimumTarget),
      unnamedControlCount: names.filter((name) => !name).length,
      duplicateAccessibleNameCount: duplicateNames.length,
      visibleFocusFailureCount: visibleFocusFailures,
      minimumFocusContrast: round(Math.min(...focusResults.map((result) => result.focusContrast)), 2),
      normalTextContrastMinimum: round(Math.min(...normalContrasts), 2),
      largeTextContrastMinimum: largeContrasts.length ? round(Math.min(...largeContrasts), 2) : null,
      contrastFailureCount: contrastFailures,
      colorIndependentMeaningPercent: round((colorMeaningChecks.filter(Boolean).length / colorMeaningChecks.length) * 100, 1),
      liveRegionCount: document.querySelectorAll('[aria-live="polite"]').length,
    };
    document.documentElement.dataset.accessibilityQa = JSON.stringify(result);
    document.documentElement.dataset.accessibilityQaReady = "true";
  }, 2_000);
}
