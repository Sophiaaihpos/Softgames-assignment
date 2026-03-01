import * as PIXI from "pixi.js";
import { BackButton } from "../shared/ui/BackButton";
import { FPSCounter } from "../utils/FpsCounter";
import { getLayout } from "../utils/Responsive";

export abstract class BaseScene extends PIXI.Container {
  private fpsCounter: FPSCounter | null = null;
  private onTick = (ticker: PIXI.Ticker) => this.fpsCounter?.update(ticker);
  private onResize = () => this.handleResize();
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;

  abstract start(): void;
  abstract stop(): void;
  abstract update(deltaTime: number): void;

  public onLayout(_app: PIXI.Application): void {}

  protected buildBaseUI(
    app: PIXI.Application,
    switchScene: (name: string) => void,
    title: string,
    titleColor: number = 0xffffff,
  ): void {
    const layout = getLayout(app.screen.width, app.screen.height);

    const titleText = new PIXI.Text(title, {
      fontFamily: "Arial",
      fontSize: layout.rem(28),
      fontWeight: "bold",
      fill: titleColor,
    });
    titleText.anchor.set(0.5, 0);
    titleText.position.set(app.screen.width / 2, layout.rem(16));
    titleText.name = "__baseTitle";
    this.addChild(titleText);

    this.addChild(new BackButton(switchScene));

    this.fpsCounter = new FPSCounter();
    this.addChild(this.fpsCounter);

    app.ticker.add(this.onTick, this);

    window.addEventListener("resize", this.onResize);
    this._app = app;
  }

  private _app?: PIXI.Application;

  private handleResize(): void {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      if (!this._app) return;
      this.repositionBaseUI(this._app);
      this.onLayout(this._app);
    }, 100);
  }

  private repositionBaseUI(app: PIXI.Application): void {
    const layout = getLayout(app.screen.width, app.screen.height);

    const titleText = this.getChildByName("__baseTitle") as PIXI.Text | null;
    if (titleText) {
      titleText.style.fontSize = layout.rem(28);
      titleText.position.set(app.screen.width / 2, layout.rem(16));
    }
  }

  protected stopBaseUI(app: PIXI.Application): void {
    app.ticker.remove(this.onTick, this);
    window.removeEventListener("resize", this.onResize);
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
  }
}
