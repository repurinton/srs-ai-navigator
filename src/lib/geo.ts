import world from "@/data/world-land.json";

// Equirectangular projection into a 2:1 SVG canvas.
export const MAP_W = 1000;
export const MAP_H = 500;

export function project(lng: number, lat: number): [number, number] {
  return [((lng + 180) / 360) * MAP_W, ((90 - lat) / 180) * MAP_H];
}

type Ring = number[][];
interface Feature {
  geometry: { type: string; coordinates: Ring[] | Ring[][] };
}

/** Build one SVG path string for all land masses (memoize at call site). */
export function buildLandPath(): string {
  let d = "";
  for (const f of (world as { features: Feature[] }).features) {
    const g = f.geometry;
    const polys = (g.type === "Polygon" ? [g.coordinates] : g.coordinates) as Ring[][];
    for (const poly of polys) {
      for (const ring of poly) {
        ring.forEach((pt, i) => {
          const [x, y] = project(pt[0], pt[1]);
          d += (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
        });
        d += "Z";
      }
    }
  }
  return d;
}

/** A bowed quadratic-bezier arc between two projected points (bows toward the pole-ward side). */
export function arcPath(a: [number, number], b: [number, number]): string {
  const [x1, y1] = a;
  const [x2, y2] = b;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy) || 1;
  // unit perpendicular, chosen so the arc bows upward on screen
  let nx = -dy / dist;
  let ny = dx / dist;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const lift = Math.min(dist * 0.32, 200);
  const cx = mx + nx * lift;
  const cy = my + ny * lift;
  return `M${x1.toFixed(1)} ${y1.toFixed(1)} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}
