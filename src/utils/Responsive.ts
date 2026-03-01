export interface LayoutMetrics {
  width: number;
  height: number;
  scale: number;
  isMobile: boolean;
  rem: (px: number) => number;
}

const BASE_W = 1280;
const BASE_H = 720;

export function getLayout(width: number, height: number): LayoutMetrics {
  const scale = Math.min(width / BASE_W, height / BASE_H);
  const isMobile = width < 768;
  return {
    width,
    height,
    scale,
    isMobile,
    rem: (px: number) => Math.round(px * scale),
  };
}
