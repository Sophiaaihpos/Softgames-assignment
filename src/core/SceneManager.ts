import * as PIXI from "pixi.js";
import { BaseScene } from "../scenes/BaseScene";

class SceneManager {
  private currentScene: BaseScene | null = null;
  private scenes = new Map<string, BaseScene>();

  constructor(private app: PIXI.Application) {
    app.ticker.add((ticker) => {
      this.currentScene?.update(ticker.deltaTime);
    });
  }

  register(name: string, scene: BaseScene): void {
    this.scenes.set(name, scene);
  }

  switchTo(name: string): void {
    if (this.currentScene) {
      this.currentScene.stop();
      this.app.stage.removeChild(this.currentScene);
    }

    const next = this.scenes.get(name);
    if (!next) throw new Error(`Scene "${name}" not registered`);

    this.currentScene = next;
    this.app.stage.addChild(next);
    next.start();
  }
  notifyResize(): void {
    this.currentScene?.onLayout(this.app);
  }
}
export { SceneManager };
