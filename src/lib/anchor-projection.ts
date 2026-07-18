/**
 * Pub/sub bridge between the 3D renderer and the DOM overlay layer.
 * The scene projects world anchors to viewport percentages each frame the
 * camera moves; the DOM side subscribes (via useSyncExternalStore) and
 * re-positions zone labels, lever beacons, and callout leader dots so they
 * stay attached through camera tweens. The 2D renderer never publishes, so
 * subscribers fall back to their authored percentage positions.
 */
export type ProjectedAnchor = { x: number; y: number };

const anchors = new Map<string, ProjectedAnchor>();
const listeners = new Set<() => void>();
let version = 0;

const EPSILON = 0.05;

export function publishProjectedAnchors(next: Record<string, ProjectedAnchor>) {
  let changed = false;
  for (const [id, point] of Object.entries(next)) {
    const previous = anchors.get(id);
    if (!previous || Math.abs(previous.x - point.x) > EPSILON || Math.abs(previous.y - point.y) > EPSILON) {
      anchors.set(id, point);
      changed = true;
    }
  }
  if (!changed) return;
  version += 1;
  for (const listener of listeners) listener();
}

export function clearProjectedAnchors() {
  if (anchors.size === 0) return;
  anchors.clear();
  version += 1;
  for (const listener of listeners) listener();
}

export function subscribeProjectedAnchors(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function projectedAnchorsVersion() {
  return version;
}

export function projectedAnchor(id: string): ProjectedAnchor | undefined {
  return anchors.get(id);
}
