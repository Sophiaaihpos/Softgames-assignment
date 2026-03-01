import * as PIXI from "pixi.js";
import { BaseScene } from "../BaseScene";
import { MagicWordsLogic, Avatar, DialogueLine } from "./MagicWordsLogic";
import { getLayout } from "../../utils/Responsive";
import { appendText } from "./TextLayout";
import {
  ACCENT_COLORS,
  BASE_AVATAR_SIZE,
  BASE_EMOJI_SIZE,
  BASE_FONT_SIZE,
  BASE_LINE_HEIGHT,
  BASE_PADDING,
  BUBBLE_COLORS,
  BUBBLE_RADIUS,
} from "./MagicWordsConstants";

export class MagicWordsScene extends BaseScene {
  private logic = new MagicWordsLogic();
  private dialogContainer = new PIXI.Container();
  private textures = new Map<string, PIXI.Texture>();
  private hint?: PIXI.Text;

  private padding = BASE_PADDING;
  private avatarSize = BASE_AVATAR_SIZE;
  private emojiSize = BASE_EMOJI_SIZE;
  private lineHeight = BASE_LINE_HEIGHT;
  private fontSize = BASE_FONT_SIZE;
  private bubbleMaxWidth = 700;

  private readonly onKey = (e: KeyboardEvent) => {
    if (e.code === "Space") {
      e.preventDefault();
      this.renderNextLine();
    }
  };
  private readonly onClick = () => this.renderNextLine();

  constructor(
    private app: PIXI.Application,
    private switchScene: (name: string) => void,
  ) {
    super();
  }

  start(): void {
    this.removeChildren();
    this.logic.reset();
    this.textures.clear();
    this.hint = undefined;

    this.applyLayout();
    this.dialogContainer = new PIXI.Container();
    this.addChild(this.dialogContainer);

    this.buildUI();
    this.attachInputListeners();
    this.loadData().catch((err) => console.error("MagicWords load error", err));
  }

  stop(): void {
    window.removeEventListener("keydown", this.onKey);
    (this.app.view as HTMLCanvasElement).removeEventListener(
      "pointerdown",
      this.onClick,
    );
    this.stopBaseUI(this.app);
    this.removeChildren();
  }

  update(): void {}

  public onLayout(): void {
    this.applyLayout();
    const line = this.logic.currentLine;
    if (line != null) {
      this.dialogContainer.removeChildren();
      const row = this.buildRow(line, this.logic.avatarMap.get(line.name));
      this.dialogContainer.addChild(row);
      this.centerRow(row);
    }
    if (this.hint) this.repositionHint();
  }

  private applyLayout(): void {
    const { rem, isMobile, width } = getLayout(
      this.app.screen.width,
      this.app.screen.height,
    );
    this.padding = rem(BASE_PADDING);
    this.avatarSize = rem(isMobile ? 44 : BASE_AVATAR_SIZE);
    this.emojiSize = rem(isMobile ? 16 : BASE_EMOJI_SIZE);
    this.lineHeight = rem(isMobile ? 20 : BASE_LINE_HEIGHT);
    this.fontSize = rem(isMobile ? 14 : BASE_FONT_SIZE);
    this.bubbleMaxWidth = Math.min(rem(620), width - rem(isMobile ? 100 : 180));
  }

  private async loadData(): Promise<void> {
    await this.logic.fetchAndPrepare();
    await Promise.allSettled([
      ...this.logic.data.emojies.map((e) =>
        this.cacheTexture(`emoji:${e.name}`, e.url),
      ),
      ...this.logic.data.avatars.map((a) =>
        this.cacheTexture(`avatar:${a.name}`, a.url),
      ),
    ]);
    this.showHint();
    this.renderNextLine();
  }

  private async cacheTexture(key: string, url: string): Promise<void> {
    if (this.textures.has(key)) return;
    try {
      this.textures.set(key, await this.loadTextureFromUrl(url));
    } catch {
      console.warn(`Texture failed [${key}]`);
    }
  }

  private loadTextureFromUrl(url: string): Promise<PIXI.Texture> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(PIXI.Texture.from(img));
      img.onerror = () => reject(new Error(`Failed: ${url}`));
      img.src = url;
    });
  }

  private attachInputListeners(): void {
    window.addEventListener("keydown", this.onKey);
    const canvas = this.app.view as HTMLCanvasElement;
    canvas.tabIndex = canvas.tabIndex || 0;
    canvas.focus();
    canvas.addEventListener("pointerdown", this.onClick);
  }

  private buildUI(): void {
    const bg = new PIXI.Graphics();
    const { width, height } = this.app.screen;
    bg.rect(0, 0, width, height).fill({ color: 0x080818 });
    this.addChildAt(bg, 0);

    this.buildBaseUI(this.app, this.switchScene, "💬 Magic Words");
  }

  private showHint(): void {
    const { isMobile } = getLayout(
      this.app.screen.width,
      this.app.screen.height,
    );
    this.hint = new PIXI.Text(
      isMobile ? "👆 Tap to advance" : "␣ Space or click to advance",
      {
        fill: 0x6688aa,
        fontSize: this.fontSize - 2,
        fontFamily: "Arial",
        fontStyle: "italic",
      },
    );
    this.hint.anchor.set(0.5, 1);
    this.repositionHint();
    this.addChild(this.hint);
  }

  private repositionHint(): void {
    const { width, height, rem } = getLayout(
      this.app.screen.width,
      this.app.screen.height,
    );
    this.hint!.position.set(width / 2, height - rem(24));
  }

  private centerRow(row: PIXI.Container): void {
    const { rem } = getLayout(this.app.screen.width, this.app.screen.height);
    const topY = rem(80);
    const bottomY = this.app.screen.height - rem(60);
    row.x = 0;
    row.y = topY + (bottomY - topY - row.height) / 2;
  }

  private renderNextLine(): void {
    const line = this.logic.advance();
    if (!line) return;

    const old = this.dialogContainer.children[0] as PIXI.Container | undefined;
    if (old) {
      const onTick = (ticker: PIXI.Ticker) => {
        old.alpha -= ticker.deltaTime * 0.1;
        if (old.alpha <= 0) {
          this.app.ticker.remove(onTick);
          this.dialogContainer.removeChildren();
          this.appendRow(line);
        }
      };
      this.app.ticker.add(onTick);
    } else {
      this.appendRow(line);
    }
  }

  private appendRow(line: DialogueLine): void {
    const row = this.buildRow(line, this.logic.avatarMap.get(line.name));
    row.alpha = 0;
    this.dialogContainer.addChild(row);
    this.centerRow(row);

    const onTick = (ticker: PIXI.Ticker) => {
      row.alpha += ticker.deltaTime * 0.08;
      if (row.alpha >= 1) {
        row.alpha = 1;
        this.app.ticker.remove(onTick);
      }
    };
    this.app.ticker.add(onTick);
  }

  private buildRow(line: DialogueLine, avatar?: Avatar): PIXI.Container {
    const row = new PIXI.Container();
    const isLeft = !avatar || avatar.position === "left";
    const avatarTex = avatar
      ? this.textures.get(`avatar:${avatar.name}`)
      : undefined;
    const bubble = this.buildBubble(line.text, isLeft);
    const nameLabel = new PIXI.Text(line.name, {
      fill: isLeft ? 0x66aaff : 0xcc88ff,
      fontSize: this.fontSize - 2,
      fontWeight: "bold",
      fontFamily: "Arial",
    });

    const avatarContainer = this.buildAvatar(avatarTex, isLeft);
    const avatarW = avatarTex ? this.avatarSize : 0;
    const nameH = nameLabel.height + 4;

    if (isLeft) {
      nameLabel.position.set(this.padding, 0);
      avatarContainer.position.set(this.padding, nameH);
      bubble.position.set(this.padding + avatarW + this.padding, nameH);
    } else {
      const bubbleX =
        this.app.screen.width -
        this.padding -
        this.bubbleMaxWidth -
        avatarW -
        this.padding;
      nameLabel.position.set(
        bubbleX + this.bubbleMaxWidth - nameLabel.width,
        0,
      );
      bubble.position.set(bubbleX, nameH);
      avatarContainer.position.set(
        bubbleX + this.bubbleMaxWidth + this.padding,
        nameH,
      );
    }

    row.addChild(nameLabel, avatarContainer, bubble);
    return row;
  }

  private buildAvatar(
    tex: PIXI.Texture | undefined,
    isLeft: boolean,
  ): PIXI.Container {
    const container = new PIXI.Container();
    if (!tex) return container;

    const r = this.avatarSize / 2;
    const mask = new PIXI.Graphics();
    mask.circle(r, r, r).fill({ color: 0xffffff });

    const sprite = new PIXI.Sprite(tex);
    sprite.width = this.avatarSize;
    sprite.height = this.avatarSize;
    sprite.mask = mask;

    const ring = new PIXI.Graphics();
    ring.circle(r, r, r + 2).stroke({
      color: isLeft ? ACCENT_COLORS.left : ACCENT_COLORS.right,
      width: 2,
      alpha: 0.8,
    });

    container.addChild(mask, sprite, ring);
    return container;
  }

  private buildBubble(text: string, isLeft: boolean): PIXI.Container {
    const bubble = new PIXI.Container();
    const bg = new PIXI.Graphics();
    const content = new PIXI.Container();
    const maxInner = this.bubbleMaxWidth - this.padding * 2;
    const color = isLeft ? BUBBLE_COLORS.left : BUBBLE_COLORS.right;
    const accent = isLeft ? ACCENT_COLORS.left : ACCENT_COLORS.right;
    const pen = { x: this.padding, y: this.padding };
    const newLine = () => {
      pen.x = this.padding;
      pen.y += this.lineHeight;
    };

    for (const seg of this.logic.parseSegments(text)) {
      if (seg.type === "emoji") {
        if (pen.x + this.emojiSize > maxInner) newLine();
        const tex = this.textures.get(`emoji:${seg.content}`);
        if (tex) {
          const sprite = new PIXI.Sprite(tex);
          sprite.width = sprite.height = this.emojiSize;
          sprite.position.set(pen.x, pen.y + 2);
          content.addChild(sprite);
          pen.x += this.emojiSize + 4;
        } else {
          appendText(`{${seg.content}}`, content, pen, maxInner, newLine);
        }
      } else {
        seg.content.split("\n").forEach((part, i) => {
          if (i > 0) newLine();
          appendText(part, content, pen, maxInner, newLine);
        });
      }
    }

    const totalH = pen.y + this.lineHeight + this.padding;

    bg.roundRect(0, 0, this.bubbleMaxWidth, totalH, BUBBLE_RADIUS).fill({
      color,
    });
    bg.roundRect(0, 0, 4, totalH, BUBBLE_RADIUS).fill({
      color: accent,
      alpha: 0.9,
    });

    bubble.addChild(bg, content);
    return bubble;
  }
}
