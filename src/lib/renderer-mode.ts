/**
 * Renderer selection for the hospital scene.
 *
 * Resolution order:
 *   1. `?renderer=2d|3d|3d-low` URL override (presenter escape hatch).
 *   2. Session fallback latch — any 3D failure pins 2D for the session so a
 *      live run never retries a broken renderer.
 *   3. Capability detection: WebGL2 without a major performance caveat.
 *
 * The ladder is: full 3D → reduced 3D (`3d-low`) → 2D cutaway.
 */
export type HospitalRendererMode = "3d" | "3d-low" | "2d";

const FALLBACK_LATCH_KEY = "hospital-renderer-fallback";
const FALLBACK_REASON_KEY = "hospital-renderer-fallback-reason";

function safeSessionStorage(): Storage | undefined {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
}

export function rendererOverride(): HospitalRendererMode | undefined {
  const value = new URLSearchParams(window.location.search).get("renderer");
  if (value === "2d" || value === "3d" || value === "3d-low") return value;
  return undefined;
}

export function isFallbackLatched(): boolean {
  return safeSessionStorage()?.getItem(FALLBACK_LATCH_KEY) === "true";
}

/** Pin the 2D renderer for the rest of the session after any 3D failure. */
export function latchRendererFallback(reason: string) {
  const storage = safeSessionStorage();
  storage?.setItem(FALLBACK_LATCH_KEY, "true");
  storage?.setItem(FALLBACK_REASON_KEY, reason.slice(0, 500));
  console.error(`[hospital-renderer] falling back to 2D for this session: ${reason}`);
}

export function rendererFallbackReason(): string | undefined {
  return safeSessionStorage()?.getItem(FALLBACK_REASON_KEY) ?? undefined;
}

export function clearRendererFallback() {
  const storage = safeSessionStorage();
  storage?.removeItem(FALLBACK_LATCH_KEY);
  storage?.removeItem(FALLBACK_REASON_KEY);
}

let cachedDetection: { supported: boolean; reducedTier: boolean } | undefined;

/**
 * Capability probe. Runs at most ONCE per page load (probe contexts count
 * against the browser's small WebGL context pool — re-probing on every mount
 * can evict the live scene's context). A null context with the API present is
 * treated as pool pressure, not lack of support: the real canvas gets to try,
 * and the error boundary ladder catches genuine failure.
 */
function detectWebGL2(): { supported: boolean; reducedTier: boolean } {
  if (cachedDetection) return cachedDetection;
  if (typeof WebGL2RenderingContext === "undefined") {
    cachedDetection = { supported: false, reducedTier: false };
    return cachedDetection;
  }
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const gl = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (gl) {
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      cachedDetection = { supported: true, reducedTier: false };
    } else {
      cachedDetection = { supported: true, reducedTier: true };
    }
  } catch {
    cachedDetection = { supported: true, reducedTier: true };
  }
  return cachedDetection;
}

function isConstrainedDevice(): boolean {
  const memory = (navigator as { deviceMemory?: number }).deviceMemory;
  if (memory !== undefined && memory <= 4) return true;
  return window.matchMedia("(max-width: 820px)").matches;
}

export function resolveHospitalRendererMode(): HospitalRendererMode {
  const override = rendererOverride();
  if (override) {
    if (override !== "2d") clearRendererFallback();
    return override;
  }
  if (isFallbackLatched()) return "2d";
  const gl = detectWebGL2();
  if (!gl.supported) return "2d";
  if (gl.reducedTier || isConstrainedDevice()) return "3d-low";
  return "3d";
}
