import * as PIXI from 'pixi.js';

const BASE_FONT_SIZE   = 18;

function measureText(str: string): number {
    const canvas2d = document.createElement('canvas').getContext('2d')!;
    canvas2d.font = `${BASE_FONT_SIZE}px Arial`;
    return canvas2d.measureText(str).width;
}

export function appendText(
    text: string,
    container: PIXI.Container,
    pen: { x: number; y: number },
    maxWidth: number,
    newLine: () => void,
): void {
    const words = text.split(' ');
    let buffer = '';

    const measure = (str: string) => measureText(str);

    const flush = () => {
        if (!buffer) return;
        const t = new PIXI.Text(buffer, new PIXI.TextStyle({ fill: 0xffffff, fontSize: BASE_FONT_SIZE }));
        t.position.set(pen.x, pen.y);
        container.addChild(t);
        pen.x += t.width;
        buffer = '';
    };

    for (let i = 0; i < words.length; i++) {
        const word = i < words.length - 1 ? `${words[i]} ` : words[i];
        const probe = buffer + word;
        if (pen.x + measure(probe) > maxWidth && buffer) {
            flush();
            newLine();
        }
        buffer += word;
    }
    flush();
}