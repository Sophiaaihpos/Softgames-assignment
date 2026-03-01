export interface CardState {
    id: number;
    stackIndex: number;
    offsetY: number;
    animating: boolean;
}

export interface MoveCommand {
    cardId: number;
    fromStack: number;
    toStack: number;
    targetOffsetY: number;
}

export class AceOfShadowsLogic {
    cards: CardState[] = [];
    stackCount: number;
    private lastTargetIndex = 0;
    private intervalId?: number;
    private onMoveCard?: (cmd: MoveCommand) => void;
    private readonly cardCount: number;

    constructor(cardCount: number, stackCount: number) {
        this.stackCount = stackCount;
        this.cardCount = cardCount;
        this.initCards();
    }

    private initCards(): void {
        this.cards = [];
        for (let i = 0; i < this.cardCount; i++) {
            this.cards.push({
                id: i,
                stackIndex: 0,
                offsetY: - (i * 0.6), 
                animating: false,
            });
        }
    }

    reset(): void {
        this.stop();
        this.lastTargetIndex = 0;
        this.initCards();
    }

    onMove(cb: (cmd: MoveCommand) => void): void {
        this.onMoveCard = cb;
    }

    start(): void {
        if (this.intervalId) return;
        this.intervalId = window.setInterval(() => this.tick(), 1000);
    }

    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        this.cards.forEach(c => { c.animating = false; });
    }

    private tick(): void {
        let sourceStack = -1;
        let topCard: CardState | null = null;

        for (let s = 0; s < this.stackCount; s++) {
            const candidates = this.cards
                .filter(c => c.stackIndex === s && !c.animating)
                .sort((a, b) => a.offsetY - b.offsetY); 

            if (candidates.length > 0) {
                sourceStack = s;
                topCard = candidates[0];
                break;
            }
        }

        if (!topCard || sourceStack === -1) return;

        let targetIndex = (this.lastTargetIndex + 1) % this.stackCount;
        if (targetIndex === sourceStack) {
            targetIndex = (targetIndex + 1) % this.stackCount;
        }
        this.lastTargetIndex = targetIndex;

        const topOnTarget = this.cards
            .filter(c => c.stackIndex === targetIndex)
            .reduce((min, c) => Math.min(min, c.offsetY), 0);
        const targetOffsetY = topOnTarget - 0.6; 

        topCard.animating = true;

        this.onMoveCard?.({
            cardId:        topCard.id,
            fromStack:     sourceStack,
            toStack:       targetIndex,
            targetOffsetY,
        });
    }

    completeMove(cardId: number, toStack: number, targetOffsetY: number): void {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;
        card.stackIndex = toStack;
        card.offsetY    = targetOffsetY;
        card.animating  = false;
    }
}