import * as PIXI from 'pixi.js';
import gsap from 'gsap';
import { BaseScene } from '../BaseScene';
import { AceOfShadowsLogic, MoveCommand } from './AceOfShadowsLogic';
import { getLayout } from '../../utils/Responsive';
import { buildCardTexture} from './CardTexture';
import { CARD_PALETTES, CARD_COUNT, STACK_COUNT } from './AceOfShadowsConstants';

export class AceOfShadowsScene extends BaseScene {
    private logic = new AceOfShadowsLogic(CARD_COUNT, STACK_COUNT);
    private cardSprites = new Map<number, PIXI.Sprite>();
    private stackContainers: PIXI.Container[] = [];
    private cardTextures: PIXI.Texture[] = [];
    private background?: PIXI.Graphics;
    private uiBuilt = false;
    private cardW = 80;
    private cardH = 112;
    private stackLabels: PIXI.Text[] = [];
    private isActive = false;
    private activeTimelines: gsap.core.Timeline[] = [];

    constructor(
        private app: PIXI.Application,
        private switchScene: (name: string) => void,
    ) {
        super();
        this.logic.onMove(cmd => this.animateMove(cmd));
    }

    start(): void {
        this.isActive = true;
        this.calcCardSize();
        if (!this.uiBuilt) {
            this.uiBuilt = true;
            this.buildUI(); 
        }
        this.logic.reset();
        this.cardSprites.forEach(s => { if (!s.destroyed) s.destroy(); });
        this.cardSprites.clear();
        this.stackContainers.forEach(c => c.removeChildren()); 
        this.buildCards();
        this.logic.start();
    }

    stop(): void {
        this.isActive = false;
        this.logic.stop();
        this.activeTimelines.forEach(tl => tl.kill());
        this.activeTimelines = [];
        this.stopBaseUI(this.app);
        this.cardTextures.forEach(t => t.destroy());
        this.cardTextures = [];
        this.cardSprites.forEach(s => {
            if (!s.destroyed) s.destroy();
        });
        this.cardSprites.clear();
        this.stackLabels.forEach(l => l.destroy());
        this.stackLabels = [];
        this.stackContainers.forEach(c => c.destroy({ children: true }));
        this.stackContainers = [];
        this.removeChildren();
        this.uiBuilt = false;
    }
    update(_dt: number): void { }

    public onLayout(app: PIXI.Application): void {
        this.calcCardSize();
        this.rebuildBackground();
        this.repositionStacks(app);
        this.rebuildStackLabels();
    }

    private calcCardSize(): void {
        const { rem, isMobile } = getLayout(this.app.screen.width, this.app.screen.height);
        this.cardW = rem(isMobile ? 52 : 72);
        this.cardH = Math.round(this.cardW * 1.4);
    }

    private rebuildBackground(): void {
        if (this.background) { this.removeChild(this.background); this.background.destroy(); }
        const { width, height } = this.app.screen;
        const bg = new PIXI.Graphics();
        (bg as any).rect(0, 0, width, height).fill({ color: 0x06120a });
        this.background = bg;
        this.addChildAt(bg, 0);
    }

    private buildCardTextures(): void {
        this.cardTextures.forEach(t => t.destroy());
        this.cardTextures = CARD_PALETTES.map((pal: any) =>
            buildCardTexture(this.cardW, this.cardH, pal),
        );
    }

    private buildCards(): void {
        this.buildCardTextures();

        for (let i = 0; i < CARD_COUNT; i++) {
            const sprite = new PIXI.Sprite(this.cardTextures[i % CARD_PALETTES.length]);

            sprite.width = this.cardW;
            sprite.height = this.cardH;
            sprite.anchor.set(0.5);
            sprite.position.set(0, -(i * 0.6));

            this.stackContainers[0].addChild(sprite);
            this.cardSprites.set(i, sprite);
        }
    }

    private rebuildStackLabels(): void {
        this.stackLabels.forEach(l => l.destroy());
        this.stackLabels = [];
        const { rem } = getLayout(this.app.screen.width, this.app.screen.height);

        for (let i = 0; i < STACK_COUNT; i++) {
            const c = this.stackContainers[i];
            const label = new PIXI.Text(`Stack ${i + 1}`, {
                fill: 0x336633, fontSize: rem(11),
                fontFamily: 'Arial', fontStyle: 'italic',
            } as any);
            label.anchor.set(0.5, 0);
            label.position.set(c.x, c.y + this.cardH * 0.6);
            this.addChild(label);
            this.stackLabels.push(label);
        }
    }

    private repositionStacks(app: PIXI.Application): void {
        for (let i = 0; i < STACK_COUNT; i++) {
            const c = this.stackContainers[i];
            if (!c) continue;
            c.x = (app.screen.width / (STACK_COUNT + 1)) * (i + 1);
            c.y = app.screen.height / 2 + (CARD_COUNT * 0.6) / 2;
        }
    }

    private animateMove(cmd: MoveCommand): void {
        const sprite = this.cardSprites.get(cmd.cardId);
        if (!sprite) return;

        const targetStack = this.stackContainers[cmd.toStack];
        const globalStart = sprite.getGlobalPosition();

        sprite.parent?.removeChild(sprite);
        this.addChild(sprite);
        sprite.position.set(globalStart.x, globalStart.y);

        const globalTarget = targetStack.toGlobal(new PIXI.Point(0, cmd.targetOffsetY));
        const midX = (globalStart.x + globalTarget.x) / 2;
        const midY = Math.min(globalStart.y, globalTarget.y) - 120;

        const tl = gsap.timeline({
            onComplete: () => {
                const idx = this.activeTimelines.indexOf(tl);
                if (idx !== -1) this.activeTimelines.splice(idx, 1);
            },
        });

        this.activeTimelines.push(tl);

        tl.to(sprite, {
            x: midX, y: midY,
            rotation: (Math.random() - 0.5) * 0.5,
            duration: 1,
            ease: 'power2.out',
        })
            .to(sprite, {
                x: globalTarget.x, y: globalTarget.y,
                rotation: 0,
                duration: 1,
                ease: 'power2.in',
                onComplete: () => {
                    if (!this.isActive || sprite.destroyed) return;
                    if (targetStack.destroyed) return;
                    this.removeChild(sprite);
                    sprite.position.set(0, cmd.targetOffsetY);
                    sprite.rotation = 0;
                    targetStack.addChild(sprite);
                    this.logic.completeMove(cmd.cardId, cmd.toStack, cmd.targetOffsetY);
                },
            });
    }

    private buildUI(): void {
        this.rebuildBackground();

        for (let i = 0; i < STACK_COUNT; i++) {
            const c = new PIXI.Container();
            this.stackContainers.push(c);
            this.addChild(c);
        }
        this.repositionStacks(this.app);
        this.rebuildStackLabels();
        this.buildBaseUI(this.app, this.switchScene, 'Ace of Shadows', 0x88ffaa);
    }
}