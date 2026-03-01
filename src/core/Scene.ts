import * as PIXI from "pixi.js";

export interface Scene {
  start(): void;
  stop(): void;
  update(deltaTime: number): void;
  destroy(): void;
  readonly view: PIXI.Container;
}
