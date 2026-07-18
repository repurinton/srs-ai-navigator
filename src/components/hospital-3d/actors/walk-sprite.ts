import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";

export const WALK_FRAME_COUNT = 16;
const CELL = 128;

/**
 * Procedurally draws a 16-frame side-view walk cycle onto a sprite sheet:
 * head, torso, two 2-segment legs and swinging arms, white on transparent so
 * the shader can tint per patient (baseline pale → waiting red).
 * Frame 0 is a neutral standing pose used while queued.
 */
export function createWalkSpriteTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = CELL * WALK_FRAME_COUNT;
  canvas.height = CELL;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let frame = 0; frame < WALK_FRAME_COUNT; frame += 1) {
    const originX = frame * CELL;
    // Frame 0 stands still; the rest run one full gait cycle.
    const phase = frame === 0 ? 0 : ((frame - 1) / (WALK_FRAME_COUNT - 1)) * Math.PI * 2;
    const amplitude = frame === 0 ? 0 : 1;
    const bob = amplitude * 2.5 * Math.abs(Math.sin(phase));

    const hipX = originX + CELL / 2;
    const hipY = 76 - bob;
    const shoulderY = 46 - bob;
    const groundY = 116;

    // Legs: thigh + shin, alternating half a cycle apart.
    for (const side of [0, Math.PI]) {
      const swing = amplitude * Math.sin(phase + side) * 0.62;
      const lift = amplitude * Math.max(0, Math.sin(phase + side + Math.PI / 2)) * 0.5;
      const thighLength = 21;
      const shinLength = 21;
      const kneeX = hipX + Math.sin(swing) * thighLength;
      const kneeY = hipY + Math.cos(swing) * thighLength;
      const shinAngle = swing - lift;
      const footX = kneeX + Math.sin(shinAngle) * shinLength;
      const footY = Math.min(groundY, kneeY + Math.cos(shinAngle) * shinLength);
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.lineTo(kneeX, kneeY);
      ctx.lineTo(footX, footY);
      ctx.stroke();
    }

    // Arms swing opposite the legs.
    for (const side of [Math.PI, 0]) {
      const swing = amplitude * Math.sin(phase + side) * 0.5;
      const armLength = 26;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(hipX, shoulderY + 2);
      ctx.lineTo(hipX + Math.sin(swing) * armLength, shoulderY + Math.cos(swing) * armLength);
      ctx.stroke();
    }

    // Torso and head.
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(hipX, shoulderY);
    ctx.lineTo(hipX, hipY);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hipX, shoulderY - 15, 11, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}
