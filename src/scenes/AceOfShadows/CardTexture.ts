import * as PIXI from "pixi.js";
import { CARD_PALETTES } from "./AceOfShadowsConstants";

export function buildCardTexture(
  w: number,
  h: number,
  pal: (typeof CARD_PALETTES)[number],
): PIXI.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  const r = 6;

  const roundRect = (
    x: number,
    y: number,
    rw: number,
    rh: number,
    radius: number,
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + rw - radius, y);
    ctx.arcTo(x + rw, y, x + rw, y + radius, radius);
    ctx.lineTo(x + rw, y + rh - radius);
    ctx.arcTo(x + rw, y + rh, x + rw - radius, y + rh, radius);
    ctx.lineTo(x + radius, y + rh);
    ctx.arcTo(x, y + rh, x, y + rh - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  };

  roundRect(0, 0, w, h, r);
  ctx.fillStyle = pal.base;
  ctx.fill();

  roundRect(3, 3, w - 6, h - 6, r - 1);
  ctx.strokeStyle = pal.accent + "99";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(w * 0.55, 0);
  ctx.lineTo(0, h * 0.45);
  ctx.lineTo(0, r);
  ctx.closePath();
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.fill();

  const cx = w / 2,
    cy = h / 2,
    pipR = w * 0.18;
  ctx.beginPath();
  ctx.arc(cx, cy, pipR, 0, Math.PI * 2);
  ctx.fillStyle = pal.pip + "40";
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx, cy, pipR, 0, Math.PI * 2);
  ctx.strokeStyle = pal.pip + "8C";
  ctx.lineWidth = 1;
  ctx.stroke();

  for (const [dx, dy] of [
    [8, 8],
    [w - 8, 8],
    [8, h - 8],
    [w - 8, h - 8],
  ] as [number, number][]) {
    ctx.beginPath();
    ctx.arc(dx, dy, 2, 0, Math.PI * 2);
    ctx.fillStyle = pal.accent + "80";
    ctx.fill();
  }

  return PIXI.Texture.from(canvas);
}
