import * as PIXI from 'pixi.js';
import { BaseScene } from '../BaseScene';
import { PhoenixFlameLogic, ParticleState } from './FlameLogic';
import { getLayout } from '../../utils/Responsive';

const MAX_SPRITES = 10;

export class PhoenixFlameScene extends BaseScene {
    private logic             = new PhoenixFlameLogic();
    private spritePool:         PIXI.Sprite[] = [];
    private flameTexture:       PIXI.Texture | null = null;
    private particleContainer = new PIXI.Container();
    private background?:        PIXI.Graphics;
    private hint?:              PIXI.Text;
    private counter?:           PIXI.Text;
    private bgGlowCircles:      PIXI.Graphics[] = [];

    constructor(
        private app: PIXI.Application,
        private switchScene: (name: string) => void,
    ) {
        super();
    }

    start(): void {
        this.resetEmitter();
         if (!this.flameTexture) {
            this.buildTextures();
        } else {
            this.addChildAt(this.particleContainer, 0);
        }
        this.app.stage.eventMode = 'static';
        this.app.stage.on('pointermove', this.onPointerMove, this);
        this.app.stage.on('pointerdown', this.onPointerMove, this);
        this.buildUI();
    }

    stop(): void {
        this.app.stage.off('pointermove', this.onPointerMove, this);
        this.app.stage.off('pointerdown', this.onPointerMove, this);
        this.stopBaseUI(this.app);
        this.spritePool.forEach(s => { s.visible = false; });
        this.logic.particles = [];
        this.removeChildren();
    }

    update(deltaTime: number): void {
        if (!this.flameTexture) return;
        this.logic.update(deltaTime);
        this.syncSprites(this.logic.particles);
    }

    public onLayout(app: PIXI.Application): void {
        this.resetEmitter();
        this.rebuildBackground();
        this.repositionUI(app);
    }

    private resetEmitter(): void {
        this.logic.setEmitter(
            this.app.screen.width  / 2,
            this.app.screen.height * 0.65,
        );
    }

    private rebuildBackground(): void {
        if (this.background) { this.removeChild(this.background); this.background.destroy(); }
        this.bgGlowCircles = [];

        const { width, height } = this.app.screen;
        const { rem }           = getLayout(width, height);
        const bg                = new PIXI.Graphics();

        (bg as any).rect(0, 0, width, height).fill({ color: 0x0d0500 });

        for (let y = 0; y < height; y += rem(6)) {
            (bg as any).rect(0, y, width, 1).fill({ color: 0x1a0800, alpha: 0.3 });
        }

        this.background = bg;
        this.addChildAt(bg, 0);

        const cx = width / 2, cy = height * 0.65;
        const glowDefs = [
            { r: height * 0.55, color: 0x1a0500, alpha: 0.6 },
            { r: height * 0.32, color: 0x551000, alpha: 0.45 },
            { r: height * 0.16, color: 0xff3300, alpha: 0.14 },
            { r: height * 0.07, color: 0xff8800, alpha: 0.20 },
        ];
        for (const { r, color, alpha } of glowDefs) {
            const g = new PIXI.Graphics();
            (g as any).circle(cx, cy, r).fill({ color, alpha });
            this.addChildAt(g, 1);
            this.bgGlowCircles.push(g);
        }
    }

    private syncSprites(states: ParticleState[]): void {
        const visible = states.slice(0, MAX_SPRITES);

        for (let i = visible.length; i < this.spritePool.length; i++) {
            this.spritePool[i].visible = false;
        }
        for (let i = 0; i < visible.length; i++) {
            if (i >= this.spritePool.length) {
                const s = new PIXI.Sprite();
                s.anchor.set(0.5);
                this.particleContainer.addChild(s);
                this.spritePool.push(s);
            }
            const sprite     = this.spritePool[i];
            const p          = visible[i];
            sprite.visible   = true;
            sprite.texture   = this.flameTexture!;
            sprite.blendMode = 'add' as any;
            sprite.x         = p.x;
            sprite.y         = p.y;
            sprite.scale.set(p.scale);
            sprite.tint      = p.tint;
            sprite.alpha     = p.alpha;
        }

        if (this.counter) {
            const n            = visible.length;
            this.counter.text  = `${n} / ${MAX_SPRITES} particles`;
            this.counter.tint  = n >= MAX_SPRITES ? 0xff4400 : 0xffffff;
        }
    }

    private onPointerMove = (e: PIXI.FederatedPointerEvent) => {
        const pos = e.getLocalPosition(this.app.stage);
        this.logic.setEmitter(pos.x, pos.y);
    };

    private buildTextures(): void {
        const flameRings = [
            { r: 54, color: 0xff0800, alpha: 0.06 },
            { r: 42, color: 0xff2200, alpha: 0.18 },
            { r: 30, color: 0xff6600, alpha: 0.42 },
            { r: 19, color: 0xff9900, alpha: 0.68 },
            { r: 10, color: 0xffcc00, alpha: 0.88 },
            { r:  5, color: 0xffffff, alpha: 1.00 },
        ];
        const fg = new PIXI.Graphics();
        flameRings.forEach(({ r, color, alpha }) =>
            (fg as any).circle(54, 54, r).fill({ color, alpha }),
        );
        this.flameTexture = this.app.renderer.generateTexture(fg);
        fg.destroy();

        this.addChildAt(this.particleContainer, 0);
    }

    private repositionUI(app: PIXI.Application): void {
        const { width, height, rem } = getLayout(app.screen.width, app.screen.height);
        if (this.hint)    this.hint.position.set(width / 2, height - rem(24));
        if (this.counter) this.counter.position.set(width / 2, rem(62));
    }

    private buildUI(): void {
        const { width, height, rem, isMobile } = getLayout(
            this.app.screen.width,
            this.app.screen.height,
        );

        this.rebuildBackground();

        this.hint = new PIXI.Text(
            isMobile ? 'Drag to guide the flame' : 'Move mouse to guide the flame',
            { fontFamily: 'Arial', fontSize: rem(14), fill: 0xff9966, fontStyle: 'italic' } as any,
        );
        this.hint.alpha = 0.75;
        this.hint.anchor.set(0.5, 1);
        this.hint.position.set(width / 2, height - rem(24));
        this.addChild(this.hint);

        this.counter = new PIXI.Text(`0 / ${MAX_SPRITES} particles`, {
            fontFamily: 'Arial', fontSize: rem(13), fill: 0xffcc88,
        } as any);
        this.counter.anchor.set(0.5, 0);
        this.counter.position.set(width / 2, rem(62));
        this.addChild(this.counter);

        this.buildBaseUI(this.app, this.switchScene, 'Phoenix Flame', 0xff5500);
    }
}