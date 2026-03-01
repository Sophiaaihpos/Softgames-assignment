import * as PIXI from "pixi.js";

const MARGIN = 20;

export class BackButton extends PIXI.Container {
  constructor(switchScene: (name: string) => void) {
    super();

    const bg = new PIXI.Graphics();
    bg.roundRect(0, 0, 130, 38, 10).fill({ color: 0x1a1a2e, alpha: 0.85 });
    bg.roundRect(0, 0, 130, 38, 10).stroke({
      color: 0xff4500,
      alpha: 0.8,
      width: 1.5,
    });

    const label = new PIXI.Text("← Menu", {
      fontFamily: "Arial",
      fontSize: 16,
      fill: 0xff7733,
    });
    label.anchor.set(0.5);
    label.position.set(65, 19);

    this.addChild(bg, label);
    this.position.set(MARGIN, MARGIN + 60);
    this.eventMode = "static";
    this.cursor = "pointer";
    this.on("pointerdown", () => switchScene("Menu"));
  }
}
