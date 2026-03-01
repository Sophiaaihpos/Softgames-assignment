import * as PIXI from "pixi.js";

export class FPSCounter extends PIXI.Container {
  private fpsText: PIXI.Text;
  private elapsed = 0;

  constructor() {
    super();

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, 90, 38, 10).fill({ color: 0x1a1a2e, alpha: 0.85 });
    bg.roundRect(0, 0, 90, 38, 10).stroke({
      color: 0xff4500,
      alpha: 0.8,
      width: 1.5,
    });

    this.fpsText = new PIXI.Text("FPS: --", {
      fontFamily: "Arial",
      fontSize: 16,
      fill: 0xff7733,
    });
    this.fpsText.anchor.set(0.5);
    this.fpsText.position.set(45, 19);

    this.addChild(bg, this.fpsText);
    this.position.set(20, 20);
  }

  public update(ticker: PIXI.Ticker): void {
    this.elapsed += ticker.deltaMS;
    if (this.elapsed >= 500) {
      this.fpsText.text = `FPS: ${Math.round(ticker.FPS)}`;
      this.elapsed = 0;
    }
  }
}
