import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { BufferAttribute, Color, EdgesGeometry, BoxGeometry, PlaneGeometry, ShaderMaterial, Vector3, type Group, type Mesh } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  WORLD_ELEVATOR,
  WORLD_HELIPAD,
  WORLD_SURFACES,
  WORLD_ZONES,
} from "@/lib/hospital-world";
import { ELEVATOR_CABS, elevatorCabState, elevatorClock, type ElevatorCabSpec } from "./elevators";
import {
  WORLD_LAKE,
  STRETCHER_PATH,
  boatState,
  parkedCarSlots,
  PARKING_ROWS,
} from "@/lib/campus-props";
import { FadeGroup } from "./FadeGroup";

function translatedBox(size: [number, number, number], position: [number, number, number]) {
  const geometry = new BoxGeometry(...size);
  geometry.translate(...position);
  return geometry;
}

/** Translated box carrying a uniform vertex color, so a palette of parked
 * cars merges into one vertex-colored draw call. */
function coloredBox(size: [number, number, number], position: [number, number, number], hex: string) {
  const geometry = translatedBox(size, position);
  const c = new Color(hex);
  const count = geometry.attributes.position.count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geometry.setAttribute("color", new BufferAttribute(colors, 3));
  return geometry;
}

const Z = WORLD_ZONES;

function CTScanner({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <torusGeometry args={[1.35, 0.42, 10, 20]} />
        <meshLambertMaterial color="#e8ecef" />
      </mesh>
      <mesh position={[0, 0.8, 1.6]}>
        <boxGeometry args={[0.75, 0.18, 3.6]} />
        <meshLambertMaterial color="#cfd8dd" />
      </mesh>
      <mesh position={[0, 0.35, 2.6]}>
        <boxGeometry args={[0.6, 0.7, 1.1]} />
        <meshLambertMaterial color="#b9c4cb" />
      </mesh>
    </group>
  );
}

function MRIScanner({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.25, -0.4]}>
        <boxGeometry args={[2.6, 2.5, 2.2]} />
        <meshLambertMaterial color="#dde4e8" />
      </mesh>
      <mesh position={[0, 1.1, 0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.5, 14]} />
        <meshLambertMaterial color="#25333c" />
      </mesh>
      <mesh position={[0, 0.75, 1.7]}>
        <boxGeometry args={[0.75, 0.16, 2.4]} />
        <meshLambertMaterial color="#cfd8dd" />
      </mesh>
    </group>
  );
}

function XRayMachine({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[2.2, 0.14, 0.85]} />
        <meshLambertMaterial color="#dfe6ea" />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <boxGeometry args={[0.6, 0.85, 0.6]} />
        <meshLambertMaterial color="#9aa7ae" />
      </mesh>
      {/* Overhead tube on a column */}
      <mesh position={[1.15, 1.5, 0]}>
        <cylinderGeometry args={[0.12, 0.16, 3, 8]} />
        <meshLambertMaterial color="#c3ccd2" />
      </mesh>
      <mesh position={[0.35, 2.7, 0]}>
        <boxGeometry args={[1.7, 0.14, 0.16]} />
        <meshLambertMaterial color="#c3ccd2" />
      </mesh>
      <mesh position={[-0.35, 2.35, 0]}>
        <boxGeometry args={[0.5, 0.55, 0.5]} />
        <meshLambertMaterial color="#e8ecef" emissive="#8fb9c9" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

/** All OR bays merged into three draw calls: structure, dividers, lights. */
function ORRow({ positions }: { positions: [number, number, number][] }) {
  const { structure, dividers, lights } = useMemo(() => {
    const structureParts = [];
    const dividerParts = [];
    const lightParts = [];
    // Partition walls between adjacent bays so each OR reads as its own
    // room. They stop short of the docking lane so stretchers pulling up
    // alongside the tables never pass through them.
    for (let i = 0; i < positions.length - 1; i += 1) {
      const [ax, ay, az] = positions[i];
      const [bx] = positions[i + 1];
      const wall = new BoxGeometry(0.25, 3.4, 3.0);
      wall.translate((ax + bx) / 2, ay + 1.7, az - 0.9);
      dividerParts.push(wall);
    }
    for (const [x, y, z] of positions) {
      const pedestal = new BoxGeometry(0.55, 0.9, 0.5);
      pedestal.translate(x, y + 0.45, z);
      const table = new BoxGeometry(2.1, 0.14, 0.75);
      table.translate(x, y + 0.98, z);
      const column = new BoxGeometry(0.3, 2.1, 0.3);
      column.translate(x + 1.15, y + 1.05, z - 0.85);
      const boomA = new BoxGeometry(1.35, 0.14, 0.16);
      boomA.rotateZ(-0.35);
      boomA.rotateY(0.7);
      boomA.translate(x + 0.7, y + 1.95, z - 0.5);
      const boomB = new BoxGeometry(1.05, 0.12, 0.14);
      boomB.rotateZ(0.5);
      boomB.rotateY(0.4);
      boomB.translate(x + 0.25, y + 1.55, z - 0.15);
      structureParts.push(pedestal, table, column, boomA, boomB);
      const light = new BoxGeometry(0.8, 0.14, 0.8);
      light.translate(x - 0.7, y + 2.3, z + 0.35);
      lightParts.push(light);
    }
    return {
      structure: mergeGeometries(structureParts),
      dividers: mergeGeometries(dividerParts),
      lights: mergeGeometries(lightParts),
    };
  }, [positions]);

  return (
    <group>
      <mesh geometry={structure}>
        <meshLambertMaterial color="#dbe2e7" />
      </mesh>
      <mesh geometry={dividers}>
        <meshLambertMaterial color="#aab4bb" />
      </mesh>
      <mesh geometry={lights}>
        <meshLambertMaterial color="#f2f6f8" emissive="#8fb9c9" emissiveIntensity={0.35} />
      </mesh>
    </group>
  );
}

/** A row of beds merged into one geometry — one draw call per row. */
function BedRow({
  start,
  count,
  gap,
}: {
  start: [number, number, number];
  count: number;
  gap: number;
}) {
  const geometry = useMemo(() => {
    const parts = [];
    for (let i = 0; i < count; i += 1) {
      const x = i * gap;
      parts.push(
        translatedBox([0.95, 0.5, 2.1], [x, 0.45, 0]),
        translatedBox([0.95, 0.7, 0.14], [x, 0.75, -0.95]),
        translatedBox([0.85, 0.14, 1.1], [x, 0.74, 0.35]),
      );
    }
    return mergeGeometries(parts);
  }, [count, gap]);

  return (
    <mesh geometry={geometry} position={start}>
      <meshLambertMaterial color="#ccd6dc" />
    </mesh>
  );
}

function Canopy({
  position,
  width,
  depth,
  accent,
}: {
  position: [number, number, number];
  width: number;
  depth: number;
  accent?: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 3.1, 0]}>
        <boxGeometry args={[width, 0.28, depth]} />
        <meshLambertMaterial color={accent ?? "#aab4ba"} />
      </mesh>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}-${sz}`} position={[sx * (width / 2 - 0.4), 1.5, sz * (depth / 2 - 0.4)]}>
            <cylinderGeometry args={[0.12, 0.12, 3, 6]} />
            <meshLambertMaterial color="#8c979e" />
          </mesh>
        )),
      )}
    </group>
  );
}

function SeatRows({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {[0, 1, 2].map((row) => (
        <mesh key={row} position={[0, 0.35, row * 1.7]}>
          <boxGeometry args={[6.5, 0.7, 0.7]} />
          <meshLambertMaterial color="#7d94a2" />
        </mesh>
      ))}
    </group>
  );
}

function Counter({ position, width }: { position: [number, number, number]; width: number }) {
  return (
    <mesh position={position}>
      <boxGeometry args={[width, 1.05, 0.7]} />
      <meshLambertMaterial color="#b3bfc7" />
    </mesh>
  );
}

function Workstations({ position }: { position: [number, number, number] }) {
  const { desks, screens } = useMemo(() => {
    const deskParts = [];
    const screenParts = [];
    for (let i = 0; i < 3; i += 1) {
      const desk = new BoxGeometry(1.8, 0.1, 0.9);
      desk.translate(i * 2.6, 0.75, 0);
      deskParts.push(desk);
      const screen = new BoxGeometry(1.3, 0.75, 0.08);
      screen.translate(i * 2.6, 1.35, -0.3);
      screenParts.push(screen);
    }
    return { desks: mergeGeometries(deskParts), screens: mergeGeometries(screenParts) };
  }, []);
  return (
    <group position={position}>
      <mesh geometry={desks}>
        <meshLambertMaterial color="#b3bfc7" />
      </mesh>
      <mesh geometry={screens}>
        <meshLambertMaterial color="#1d3d4d" emissive="#3b8ca8" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

/** Shimmering, rippling elliptical lake on the east side, its east lobe pushed
 * off the map edge (implied broader water). Water shading uses summed
 * directional waves with analytic normals, a Fresnel deep→sky blend,
 * Blinn-Phong specular sparkle, and crest + shoreline foam — masked to the
 * ellipse with a soft foam edge so the shoreline reads curved, not square. */
function Lake() {
  const { geometry, material, center } = useMemo(() => {
    const [rx, rz] = WORLD_LAKE.radius;
    const geo = new PlaneGeometry(rx * 2, rz * 2, 64, 48);
    geo.rotateX(-Math.PI / 2);
    const mat = new ShaderMaterial({
      transparent: true,
      depthWrite: false, // translucent surface — avoid depth-sort artifacts
      uniforms: {
        uTime: { value: 0 },
        uLight: { value: new Vector3(-0.35, 0.9, 0.28).normalize() },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorld;
        varying float vCrest;

        // Three drifting directional waves; analytic normal from their slopes.
        void wave(vec2 pos, out float h, out vec2 slope) {
          vec2 d1 = vec2(0.95, 0.31); float a1 = 0.11, w1 = 0.42, s1 = 1.05;
          vec2 d2 = vec2(-0.45, 0.89); float a2 = 0.08, w2 = 0.7, s2 = 0.9;
          vec2 d3 = vec2(0.6, -0.8); float a3 = 0.05, w3 = 1.15, s3 = 1.4;
          float p1 = dot(d1, pos) * w1 + uTime * s1;
          float p2 = dot(d2, pos) * w2 + uTime * s2;
          float p3 = dot(d3, pos) * w3 - uTime * s3;
          h = a1 * sin(p1) + a2 * sin(p2) + a3 * sin(p3);
          slope = a1 * w1 * d1 * cos(p1) + a2 * w2 * d2 * cos(p2) + a3 * w3 * d3 * cos(p3);
        }

        void main() {
          vUv = uv;
          vec3 p = position;
          float h; vec2 slope;
          wave(p.xz, h, slope);
          p.y += h;
          vCrest = h;
          vNormal = normalize(vec3(-slope.x, 1.0, -slope.y));
          vec4 world = modelMatrix * vec4(p, 1.0);
          vWorld = world.xyz;
          gl_Position = projectionMatrix * viewMatrix * world;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform vec3 uLight;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vWorld;
        varying float vCrest;

        void main() {
          vec2 c = vUv * 2.0 - 1.0;
          float edge = length(c);
          if (edge > 1.0) discard;

          vec3 N = normalize(vNormal);
          vec3 V = normalize(cameraPosition - vWorld);
          // Schlick Fresnel: grazing angles catch the sky, steep angles go deep.
          float fres = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 4.0);

          vec3 deep = vec3(0.03, 0.16, 0.24);
          vec3 shallow = vec3(0.10, 0.40, 0.48);
          vec3 sky = vec3(0.42, 0.66, 0.74);
          vec3 col = mix(deep, shallow, clamp(0.5 + vCrest * 3.5, 0.0, 1.0));
          col = mix(col, sky, fres * 0.7);

          // Blinn-Phong specular glint from the key light.
          vec3 H = normalize(uLight + V);
          float spec = pow(max(dot(N, H), 0.0), 140.0);
          col += spec * 0.9;
          // Fine drifting sparkle so still water still glitters.
          float sp = sin(vWorld.x * 3.1 + uTime * 2.2) * sin(vWorld.z * 2.7 - uTime * 1.8);
          col += smoothstep(0.86, 1.0, sp) * 0.25;

          // Crest whitecaps + soft curved shoreline foam.
          float foam = smoothstep(0.11, 0.16, vCrest);
          float shore = smoothstep(0.9, 1.0, edge);
          col = mix(col, vec3(0.80, 0.90, 0.95), max(foam * 0.4, shore * 0.85));

          float alpha = 0.94 * (1.0 - smoothstep(0.985, 1.0, edge));
          gl_FragColor = vec4(col, alpha);
        }
      `,
    });
    return {
      geometry: geo,
      material: mat,
      center: [WORLD_LAKE.center[0], WORLD_LAKE.y, WORLD_LAKE.center[2]] as [number, number, number],
    };
  }, []);
  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta;
  });
  return <mesh geometry={geometry} material={material} position={center} />;
}

/** A motorboat that noses onto the visible lake, U-turns, and heads back off
 * the east edge every BOAT_PERIOD seconds (see campus-props). */
function Motorboat() {
  const ref = useRef<Group>(null);
  const clock = useRef(0);
  useFrame((_, delta) => {
    clock.current += delta;
    const boat = boatState(clock.current);
    const group = ref.current;
    if (!group) return;
    group.position.set(boat.x, 0.35, boat.z);
    group.rotation.y = boat.heading;
    group.visible = boat.visible;
  });
  return (
    <group ref={ref} visible={false}>
      {/* hull, modeled along +x with a tapered bow */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[2.6, 0.4, 1.1]} />
        <meshLambertMaterial color="#c4ccd2" />
      </mesh>
      <mesh position={[1.5, 0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[0.8, 0.4, 0.8]} />
        <meshLambertMaterial color="#c4ccd2" />
      </mesh>
      {/* cabin / windscreen */}
      <mesh position={[-0.2, 0.5, 0]}>
        <boxGeometry args={[0.9, 0.5, 0.85]} />
        <meshLambertMaterial color="#3f6f9a" />
      </mesh>
      {/* white wake trailing the stern */}
      <mesh position={[-2.0, 0.02, 0]}>
        <boxGeometry args={[1.6, 0.02, 1.4]} />
        <meshLambertMaterial color="#dfeaf0" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/** Static parked cars filling stalls while animated traffic comes and goes.
 * Layout comes from campus-props so the interaction QA checks the same slots. */
function ParkedCars() {
  const geometry = useMemo(() => {
    const parts = [];
    // Nose-in cars sit long-axis along z, facing the aisles; each a palette hue.
    for (const { x, z, color } of parkedCarSlots()) {
      parts.push(
        coloredBox([1.05, 0.55, 2.2], [x, 0.45, z], color),
        coloredBox([0.9, 0.42, 1.15], [x, 0.93, z + 0.12], color),
      );
    }
    return mergeGeometries(parts);
  }, []);
  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial vertexColors />
    </mesh>
  );
}

/**
 * The two independent elevator cabs. Both render from the same pure
 * schedule function that drives patient boarding, so a cab's position and
 * door state always match the riders. Doors face east and slide open at
 * every dwell so patients visibly enter and exit.
 */
function ElevatorCabs({ ceilingY }: { ceilingY: number }) {
  return (
    <group>
      {ELEVATOR_CABS.map((cab, index) => (
        <ElevatorCabUnit key={index} cab={cab} ceilingY={ceilingY} />
      ))}
    </group>
  );
}

function ElevatorCabUnit({ cab, ceilingY }: { cab: ElevatorCabSpec; ceilingY: number }) {
  const cabRef = useRef<Group>(null);
  const doorNorthRef = useRef<Mesh>(null);
  const doorSouthRef = useRef<Mesh>(null);
  // Fade toward whatever the floors are doing: a cab riding above the focused
  // floor must not hang in the air as a solid box (matches FadeGroup behavior,
  // but tracked per-frame because the cab moves).
  const fade = useRef(1);
  const doorX = WORLD_ELEVATOR.max[0] - 0.12;

  useFrame((_, delta) => {
    // Read the shared elevator time PatientFlow publishes, so the cab and its
    // riders are always sampled at the identical moment.
    const state = elevatorCabState(elevatorClock.current, cab);
    const group = cabRef.current;
    if (!group) return;
    group.position.y = state.y;
    const slide = 0.12 + state.doorsOpen * 0.72;
    if (doorNorthRef.current) doorNorthRef.current.position.z = cab.z - slide;
    if (doorSouthRef.current) doorSouthRef.current.position.z = cab.z + slide;

    // The cab body spans [state.y, state.y + ~3]; hide once its floor reaches
    // the focus ceiling, matching the zone floors above it.
    const target = state.y >= ceilingY - 0.01 ? 0 : 1;
    fade.current += (target - fade.current) * Math.min(1, delta * 6);
    const opacity = fade.current;
    group.visible = opacity > 0.02;
    group.traverse((object) => {
      const mesh = object as Mesh;
      if (!mesh.material) return;
      const material = mesh.material as unknown as { transparent: boolean; opacity: number; needsUpdate: boolean };
      if (!material.transparent) {
        material.transparent = true;
        material.needsUpdate = true;
      }
      material.opacity = opacity;
    });
  });

  return (
    <group ref={cabRef}>
      <mesh position={[cab.x, 1.5, cab.z]}>
        <boxGeometry args={[3.2, 2.9, 2.3]} />
        <meshLambertMaterial color="#b9cdd4" transparent />
      </mesh>
      {/* Sliding doors on the east face */}
      <mesh ref={doorNorthRef} position={[doorX, 1.45, cab.z - 0.12]}>
        <boxGeometry args={[0.1, 2.7, 1.1]} />
        <meshLambertMaterial color="#7fd4c0" transparent />
      </mesh>
      <mesh ref={doorSouthRef} position={[doorX, 1.45, cab.z + 0.12]}>
        <boxGeometry args={[0.1, 2.7, 1.1]} />
        <meshLambertMaterial color="#7fd4c0" transparent />
      </mesh>
    </group>
  );
}

/** Helipad on the grounds plus an occasional helicopter arrival. */
function Helipad() {
  const marking = useMemo(() => {
    const bar = (w: number, h: number, x: number, z: number) => {
      const geo = new BoxGeometry(w, 0.05, h);
      geo.translate(x, 0, z);
      return geo;
    };
    return mergeGeometries([
      bar(0.5, 3.2, -1, 0),
      bar(0.5, 3.2, 1, 0),
      bar(1.6, 0.5, 0, 0),
    ]);
  }, []);
  const [cx, cy, cz] = WORLD_HELIPAD.center;
  return (
    <group position={[cx, cy, cz]}>
      <mesh>
        <cylinderGeometry args={[WORLD_HELIPAD.radius, WORLD_HELIPAD.radius, 0.12, 24]} />
        <meshLambertMaterial color="#22343d" />
      </mesh>
      <mesh position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[WORLD_HELIPAD.radius - 0.7, WORLD_HELIPAD.radius - 0.25, 24]} />
        <meshLambertMaterial color="#e8ecef" />
      </mesh>
      <mesh geometry={marking} position={[0, 0.1, 0]}>
        <meshLambertMaterial color="#e8ecef" />
      </mesh>
    </group>
  );
}

// One quadcopter arrival every PERIOD seconds; the pad-to-ED stretcher run
// lasts longer than a period, so two runner instances alternate landings.
const QUAD_PERIOD = 27.5;
const QUAD_TOUCHDOWN = 14;
const STRETCHER_RUN_START = 16; // two beats after touchdown = the handoff
const STRETCHER_RUN_DURATION = 26; // must stay under 2×PERIOD − RUN_START

/**
 * Medical delivery quadcopter: white X-frame drone with a red cross and an
 * underslung med-payload pod. Recurring cycle — approach, vertical descent,
 * idle on the pad, climb out, depart. Each landing hands a patient to a
 * stretcher crew that rolls them around the front plaza into the ED. The
 * clock starts mid-cycle so the first arrival lands shortly after load.
 */
function MedicalQuadcopter() {
  const groupRef = useRef<Group>(null);
  const rotorsRef = useRef<Group>(null);
  const stretcherRefs = [useRef<Group>(null), useRef<Group>(null)];
  const clock = useRef(2);
  const [px, , pz] = WORLD_HELIPAD.center;

  // Rerouted (campus-props): skirts north/west of the lake and enters the ED
  // from the south apron — never crossing the lake or the highway.
  const path = useMemo(() => {
    const points = STRETCHER_PATH;
    const lengths: number[] = [0];
    for (let i = 1; i < points.length; i += 1) {
      lengths.push(lengths[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][2] - points[i - 1][2]));
    }
    return { points, lengths, total: lengths[lengths.length - 1] };
  }, []);

  useFrame((_, delta) => {
    // Verification hook mirroring __patientFlowFF: consume a one-shot
    // fast-forward so headless checks can reach any point in the cycle.
    const globals = window as unknown as { __quadFF?: number; __quadDebug?: unknown };
    if (typeof globals.__quadFF === "number") {
      clock.current += globals.__quadFF;
      delete globals.__quadFF;
    }
    clock.current += delta;
    const t = clock.current % QUAD_PERIOD;
    const group = groupRef.current;
    if (!group) return;

    let x = px + 34;
    let y = 26;
    let z = pz - 22;
    let visible = false;
    let rotorSpeed = 30;

    const ease = (v: number) => v * v * (3 - 2 * v);
    if (t >= 5 && t < 11) {
      const p = ease((t - 5) / 6);
      x = px + 34 - 34 * p;
      y = 26 - 16 * p;
      z = pz - 22 + 22 * p;
      visible = true;
    } else if (t >= 11 && t < QUAD_TOUCHDOWN) {
      const p = ease((t - 11) / 3);
      x = px;
      y = 10 - 9.72 * p;
      z = pz;
      visible = true;
    } else if (t >= QUAD_TOUCHDOWN && t < 20) {
      x = px;
      y = 0.28;
      z = pz;
      visible = true;
      rotorSpeed = 8;
    } else if (t >= 20 && t < 23) {
      const p = ease((t - 20) / 3);
      x = px;
      y = 0.28 + 12 * p;
      z = pz;
      visible = true;
    } else if (t >= 23 && t < QUAD_PERIOD) {
      const p = ease((t - 23) / 4.5);
      x = px + 40 * p;
      y = 12.5 + 14 * p;
      z = pz - 26 * p;
      visible = true;
    }

    group.position.set(x, y, z);
    group.visible = visible;
    if (rotorsRef.current) {
      rotorsRef.current.children.forEach((rotor, index) => {
        rotor.rotation.y += delta * rotorSpeed * (index % 2 === 0 ? 1 : -1);
      });
    }

    // Stretcher runs: landing n belongs to instance n % 2, departing the pad
    // STRETCHER_RUN_START into its cycle and rolling the patient into the ED.
    for (let k = 0; k < 2; k += 1) {
      const runner = stretcherRefs[k].current;
      if (!runner) continue;
      const doublePeriods = Math.floor((clock.current - STRETCHER_RUN_START - k * QUAD_PERIOD) / (2 * QUAD_PERIOD));
      const startTime = k * QUAD_PERIOD + doublePeriods * 2 * QUAD_PERIOD + STRETCHER_RUN_START;
      const u = (clock.current - startTime) / STRETCHER_RUN_DURATION;
      if (u < 0 || u > 1) {
        runner.visible = false;
        continue;
      }
      const distance = u * path.total;
      let segment = 1;
      while (segment < path.lengths.length - 1 && path.lengths[segment] < distance) segment += 1;
      const a = path.points[segment - 1];
      const b = path.points[segment];
      const span = path.lengths[segment] - path.lengths[segment - 1];
      const p = span > 0 ? (distance - path.lengths[segment - 1]) / span : 0;
      runner.position.set(a[0] + (b[0] - a[0]) * p, a[1], a[2] + (b[2] - a[2]) * p);
      runner.rotation.y = Math.atan2(b[0] - a[0], b[2] - a[2]) - Math.PI / 2;
      // Shrink out over the last stretch — the crew wheels into the bay.
      const shrink = u > 0.94 ? Math.max((1 - u) / 0.06, 0.001) : 1;
      runner.scale.setScalar(shrink);
      runner.visible = true;
    }

    globals.__quadDebug = {
      t: Number(t.toFixed(2)),
      copterVisible: group.visible,
      copterY: Number(group.position.y.toFixed(2)),
      runners: stretcherRefs.map((ref) => ({
        visible: ref.current?.visible ?? false,
        x: Number((ref.current?.position.x ?? 0).toFixed(1)),
        z: Number((ref.current?.position.z ?? 0).toFixed(1)),
      })),
    };
  });

  const armLength = 1.55;
  const rotorPositions: [number, number][] = [
    [armLength, armLength],
    [armLength, -armLength],
    [-armLength, armLength],
    [-armLength, -armLength],
  ];

  return (
    <>
    <group ref={groupRef} visible={false}>
    <group scale={2}>
      {/* Body with red cross */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.5, 0.55, 1.5]} />
        <meshLambertMaterial color="#e8ecef" />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[1.0, 0.06, 0.34]} />
        <meshLambertMaterial color="#e04f48" />
      </mesh>
      <mesh position={[0, 1.02, 0]}>
        <boxGeometry args={[0.34, 0.06, 1.0]} />
        <meshLambertMaterial color="#e04f48" />
      </mesh>
      {/* Underslung medical payload pod */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.9, 0.45, 0.9]} />
        <meshLambertMaterial color="#e04f48" />
      </mesh>
      {/* X-frame arms */}
      <mesh position={[0, 0.86, 0]} rotation={[0, Math.PI / 4, 0]}>
        <boxGeometry args={[4.4, 0.1, 0.16]} />
        <meshLambertMaterial color="#5b6d74" />
      </mesh>
      <mesh position={[0, 0.86, 0]} rotation={[0, -Math.PI / 4, 0]}>
        <boxGeometry args={[4.4, 0.1, 0.16]} />
        <meshLambertMaterial color="#5b6d74" />
      </mesh>
      {/* Landing feet */}
      {rotorPositions.map(([ax, az], index) => (
        <mesh key={`foot-${index}`} position={[ax * 0.62, 0.18, az * 0.62]}>
          <boxGeometry args={[0.1, 0.5, 0.1]} />
          <meshLambertMaterial color="#5b6d74" />
        </mesh>
      ))}
      {/* Motors + spinning rotors inside white prop-guard rings */}
      {rotorPositions.map(([ax, az], index) => (
        <mesh key={`motor-${index}`} position={[ax, 0.95, az]}>
          <cylinderGeometry args={[0.12, 0.14, 0.22, 8]} />
          <meshLambertMaterial color="#22343d" />
        </mesh>
      ))}
      {rotorPositions.map(([ax, az], index) => (
        <mesh key={`guard-${index}`} position={[ax, 1.1, az]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.88, 0.055, 8, 24]} />
          <meshLambertMaterial color="#f2f6f8" />
        </mesh>
      ))}
      <group ref={rotorsRef}>
        {rotorPositions.map(([ax, az], index) => (
          <group key={`rotor-${index}`} position={[ax, 1.1, az]}>
            <mesh>
              <boxGeometry args={[1.5, 0.04, 0.16]} />
              <meshLambertMaterial color="#22343d" />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[1.5, 0.04, 0.16]} />
              <meshLambertMaterial color="#22343d" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
    </group>
      {stretcherRefs.map((ref, index) => (
        <group key={`helipad-stretcher-${index}`} ref={ref} visible={false}>
          {/* Frame + wheels hint, long axis along +x to match vehicle yaw */}
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[1.9, 0.1, 0.6]} />
            <meshLambertMaterial color="#8fa3ad" />
          </mesh>
          {/* Mattress */}
          <mesh position={[0, 0.52, 0]}>
            <boxGeometry args={[1.9, 0.16, 0.62]} />
            <meshLambertMaterial color="#e8ecef" />
          </mesh>
          {/* Patient lying on the stretcher */}
          <mesh position={[0, 0.72, 0]} rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.21, 1.05, 4, 8]} />
            <meshLambertMaterial color="#cfd9e6" />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** Glass elevator core riding the tower's open west end. */
function ElevatorCore({ ceilingY }: { ceilingY: number }) {
  // Cap the glass shaft at the focused floor so it doesn't rise past the
  // cutaway as a wireframe box (matches the floors fading above the focus).
  const topY = Math.min(WORLD_ELEVATOR.max[1], Number.isFinite(ceilingY) ? ceilingY : WORLD_ELEVATOR.max[1]);
  const { size, center, edges } = useMemo(() => {
    const s: [number, number, number] = [
      WORLD_ELEVATOR.max[0] - WORLD_ELEVATOR.min[0],
      topY - WORLD_ELEVATOR.min[1],
      WORLD_ELEVATOR.max[2] - WORLD_ELEVATOR.min[2],
    ];
    const c: [number, number, number] = [
      (WORLD_ELEVATOR.min[0] + WORLD_ELEVATOR.max[0]) / 2,
      (WORLD_ELEVATOR.min[1] + topY) / 2,
      (WORLD_ELEVATOR.min[2] + WORLD_ELEVATOR.max[2]) / 2,
    ];
    return { size: s, center: c, edges: new EdgesGeometry(new BoxGeometry(...s)) };
  }, [topY]);
  return (
    <group>
      <mesh position={center}>
        <boxGeometry args={size} />
        <meshLambertMaterial color="#7fd4c0" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges} position={center}>
        <lineBasicMaterial color="#7fd4c0" transparent opacity={0.5} />
      </lineSegments>
    </group>
  );
}

/** Dashed lane divider plus parking stall lines — one merged draw call. */
function RoadMarkings() {
  const geometry = useMemo(() => {
    const road = WORLD_SURFACES.mainRoad;
    const parking = WORLD_SURFACES.parking;
    const parts = [];
    // Dashed centerline between the two highway lanes (z=15).
    for (let x = road.min[0] + 4; x < road.max[0] - 4; x += 6) {
      parts.push(translatedBox([2.4, 0.03, 0.22], [x, 0.16, 15]));
    }
    // Stall lines for the parking rows (matching campus-props PARKING_ROWS).
    for (const z of PARKING_ROWS) {
      for (let x = parking.min[0] + 2.5; x <= parking.max[0] - 4.5; x += 3.1) {
        parts.push(translatedBox([0.16, 0.03, 2.4], [x, 0.16, z]));
      }
    }
    // Zebra crosswalk on the front apron between the drop-off and the entrance,
    // where valet/patient walk paths cross the circulating cars.
    for (let z = 5.4; z <= 8.4; z += 0.7) {
      parts.push(translatedBox([1.8, 0.03, 0.24], [1, 0.17, z]));
    }
    return mergeGeometries(parts);
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshLambertMaterial color="#4b5f6b" />
    </mesh>
  );
}

/** One silhouette outline per zone volume — the "architectural drawing" read. */
function ZoneOutlines({ ceilingY }: { ceilingY: number }) {
  const outlines = useMemo(
    () =>
      Object.values(Z).filter((zone) => zone.id !== "home").map((zone) => {
        const size: [number, number, number] = [
          zone.max[0] - zone.min[0],
          zone.max[1] - zone.min[1],
          zone.max[2] - zone.min[2],
        ];
        const center: [number, number, number] = [
          (zone.min[0] + zone.max[0]) / 2,
          (zone.min[1] + zone.max[1]) / 2,
          (zone.min[2] + zone.max[2]) / 2,
        ];
        return { id: zone.id, minY: zone.min[1], geometry: new EdgesGeometry(new BoxGeometry(...size)), center };
      }),
    [],
  );
  return (
    <group>
      {outlines.map(({ id, minY, geometry, center }) => (
        <FadeGroup key={id} hidden={minY >= ceilingY - 0.01}>
          <lineSegments geometry={geometry} position={center}>
            <lineBasicMaterial color="#04141c" transparent opacity={0.55} />
          </lineSegments>
        </FadeGroup>
      ))}
    </group>
  );
}

export function ZoneEquipment({ ceilingY }: { ceilingY: number }) {
  const hiddenAbove = (floorMinY: number) => floorMinY >= ceilingY - 0.01;

  return (
    <group name="equipment">
      {/* Floor 1 — intake lobby, ED + EMS, discharge (never above the focus) */}
      <Counter position={[0, Z.access.min[1] + 0.9, -3]} width={5} />
      <Counter position={[6, Z.access.min[1] + 0.9, -3]} width={3} />
      <Canopy position={[2, Z.access.min[1], 9]} width={9} depth={3.2} accent="#7fd4c0" />
      <BedRow start={[-22, Z.ems.min[1] + 0.4, -3]} count={6} gap={2.3} />
      <Canopy position={[-26.5, Z.ems.min[1], -4]} width={4.5} depth={7} accent="#ff716d" />
      <SeatRows position={[18, Z.longitudinal.min[1] + 0.4, -2]} />

      {/* Floor 2 — radiology (two CT, two MRI, two X-ray) + precision */}
      <FadeGroup hidden={hiddenAbove(Z.diagnosis.min[1])}>
        <CTScanner position={[-22, Z.diagnosis.min[1] + 0.4, -9]} />
        <CTScanner position={[-17, Z.diagnosis.min[1] + 0.4, -9]} />
        <MRIScanner position={[-11, Z.diagnosis.min[1] + 0.4, -9.5]} />
        <MRIScanner position={[-6, Z.diagnosis.min[1] + 0.4, -9.5]} />
        <XRayMachine position={[-1, Z.diagnosis.min[1] + 0.4, -9]} />
        <XRayMachine position={[-19, Z.diagnosis.min[1] + 0.4, -13]} />
        <Workstations position={[9, Z.precision.min[1] + 0.4, -9]} />
        <Workstations position={[9, Z.precision.min[1] + 0.4, -13]} />
      </FadeGroup>

      {/* Floor 3 — pre-op readiness bays */}
      <FadeGroup hidden={hiddenAbove(Z.readiness.min[1])}>
        <BedRow start={[-21, Z.readiness.min[1] + 0.4, -9.5]} count={8} gap={2.4} />
      </FadeGroup>

      {/* Floor 4 — eight robotic ORs */}
      <FadeGroup hidden={hiddenAbove(Z.robotics.min[1])}>
        <ORRow
          positions={Array.from({ length: 8 }, (_, i) => [-21 + i * 5.6, Z.robotics.min[1] + 0.4, -9.5])}
        />
      </FadeGroup>

      {/* Floors 5–6 — recovery wards */}
      <FadeGroup hidden={hiddenAbove(Z.care.min[1])}>
        <BedRow start={[-21, Z.care.min[1] + 0.4, -9.5]} count={8} gap={2.4} />
        <BedRow start={[2, Z.care.min[1] + 0.4, -12.5]} count={6} gap={2.4} />
      </FadeGroup>
      <FadeGroup hidden={hiddenAbove(Z["care-upper"].min[1])}>
        <BedRow start={[-21, Z["care-upper"].min[1] + 0.4, -9.5]} count={8} gap={2.4} />
        <BedRow start={[2, Z["care-upper"].min[1] + 0.4, -12.5]} count={6} gap={2.4} />
      </FadeGroup>

      <ElevatorCore ceilingY={ceilingY} />
      <ElevatorCabs ceilingY={ceilingY} />
      <Helipad />
      <MedicalQuadcopter />
      <Lake />
      <Motorboat />
      <ParkedCars />
      <RoadMarkings />
      <ZoneOutlines ceilingY={ceilingY} />
    </group>
  );
}
