import * as PIXI from "pixi.js";
import { BaseScene } from "../BaseScene";
import { getLayout } from "../../utils/Responsive";
import type { TextStyleOptions } from "pixi.js";

const SCENES: { name: string; emoji: string; color: number }[] = [
  { name: "AceOfShadows", emoji: "🃏", color: 0x4466ff },
  { name: "MagicWords", emoji: "💬", color: 0xaa44ff },
  { name: "PhoenixFlame", emoji: "🔥", color: 0xff5500 },
];

export class MenuScene extends BaseScene {
  private uiBuilt = false;

  constructor(
    private app: PIXI.Application,
    private switchScene: (name: string) => void,
  ) {
    super();
  }

  start(): void {
    if (!this.uiBuilt) {
      this.uiBuilt = true;
      this.buildUI();
    }
  }

  update(): void {}

  stop(): void {
    this.removeChildren();
    this.uiBuilt = false;
  }

  public onLayout(): void {
    this.removeChildren();
    this.uiBuilt = false;
    this.buildUI();
  }

  private getTitle(): PIXI.Text {
    const { rem, isMobile } = getLayout(
      this.app.screen.width,
      this.app.screen.height,
    );
    const titleSize = rem(isMobile ? 30 : 52);
    const title = new PIXI.Text({
      text: "Softgames Demos",
      style: {
        fill: 0xffffff,
        fontSize: titleSize,
        fontWeight: "bold",
        fontFamily: "Arial",
        dropShadow: {
          color: 0x4466ff,
          distance: rem(4),
          blur: rem(12),
        },
      } satisfies TextStyleOptions,
    });
    title.anchor.set(0.5, 0);
    title.position.set(this.app.screen.width / 2, rem(36));
    return title;
  }

  private buildUI(): void {
    const { width, height, rem, isMobile } = getLayout(
      this.app.screen.width,
      this.app.screen.height,
    );

    const bg = new PIXI.Graphics();
    bg.rect(0, 0, width, height).fill({ color: 0x0a0a1a });
    this.addChild(bg);

    this.addChild(this.getTitle());

    const useRow = width >= 700;
    const cardW = useRow
      ? Math.min(rem(280), (width - rem(80)) / SCENES.length)
      : Math.min(rem(340), width - rem(48));
    const cardH = rem(isMobile ? 120 : 160);
    const cardGap = rem(useRow ? 24 : 20);

    const totalW = useRow
      ? SCENES.length * cardW + (SCENES.length - 1) * cardGap
      : cardW;
    const totalH = useRow
      ? cardH
      : SCENES.length * cardH + (SCENES.length - 1) * cardGap;

    const startX = (width - totalW) / 2;
    const startY = (height - totalH) / 2 + rem(30);

    SCENES.forEach(({ name, emoji, color }, i) => {
      const cx = useRow ? startX + i * (cardW + cardGap) : startX;
      const cy = useRow ? startY : startY + i * (cardH + cardGap);

      const card = this.buildCard(name, emoji, color, cardW, cardH, rem);
      card.position.set(cx, cy);
      card.on("pointerdown", () => this.switchScene(name));
      this.addChild(card);
    });
  }

  private buildCard(
    name: string,
    emoji: string,
    color: number,
    w: number,
    h: number,
    rem: (px: number) => number,
  ): PIXI.Container {
    const card = new PIXI.Container();
    card.eventMode = "static";
    card.cursor = "pointer";

    const bg = new PIXI.Graphics();
    const drawBg = (hover: boolean) => {
      bg.clear();
      bg.roundRect(0, 0, w, h, rem(14)).fill({
        color: hover ? color : 0x16162a,
        alpha: hover ? 0.25 : 0.9,
      });
      bg.roundRect(0, 0, w, h, rem(14)).stroke({
        color,
        alpha: hover ? 1 : 0.45,
        width: hover ? 2 : 1.5,
      });
    };
    drawBg(false);
    card.addChild(bg);

    const glow = new PIXI.Graphics();
    glow
      .roundRect(-rem(6), -rem(6), w + rem(12), h + rem(12), rem(20))
      .fill({ color, alpha: 0.12 });
    glow.visible = false;
    card.addChildAt(glow, 0);

    const emojiText = new PIXI.Text(emoji, { fontSize: rem(42) });
    emojiText.anchor.set(0.5);
    emojiText.position.set(w / 2, h * 0.36);
    card.addChild(emojiText);

    const label = new PIXI.Text(name, {
      fill: 0xffffff,
      fontSize: rem(16),
      fontWeight: "bold",
      fontFamily: "Arial",
    });
    label.anchor.set(0.5);
    label.position.set(w / 2, h * 0.72);
    card.addChild(label);

    card.on("pointerover", () => {
      drawBg(true);
      glow.visible = true;
      label.style.fill = color;
    });
    card.on("pointerout", () => {
      drawBg(false);
      glow.visible = false;
      label.style.fill = 0xffffff;
    });

    return card;
  }
}
