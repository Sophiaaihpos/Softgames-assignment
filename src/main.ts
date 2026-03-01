import * as PIXI from 'pixi.js';
import { SceneManager } from './core/SceneManager';
import { MenuScene } from './scenes/MenuScene/MenuScene';
import { PhoenixFlameScene } from './scenes/PhoenixFlame/FlameScene';
import { AceOfShadowsScene } from './scenes/AceOfShadows/AceOfShadowsScene';  
import { MagicWordsScene } from './scenes/MagicWords/MagicWordsScene';
import { addFullscreenButton } from './utils/Fullscreen';

const app = new PIXI.Application();
await app.init({
    width:           window.innerWidth,
    height:          window.innerHeight,
    backgroundColor: 0x101010,
    resizeTo:        window,
});
document.body.appendChild(app.view as HTMLCanvasElement);

const manager     = new SceneManager(app);
const switchScene = (name: string) => manager.switchTo(name);

manager.register('Menu',         new MenuScene(app, switchScene));
manager.register('PhoenixFlame', new PhoenixFlameScene(app, switchScene));
manager.register('AceOfShadows', new AceOfShadowsScene(app, switchScene));
manager.register('MagicWords',   new MagicWordsScene(app, switchScene));

manager.switchTo('Menu');

let resizeTimer: ReturnType<typeof setTimeout> | null = null;

function onResize(): void {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        manager.notifyResize();
    }, 80);
}

window.addEventListener('resize', onResize);

document.addEventListener('fullscreenchange',        onResize);
document.addEventListener('webkitfullscreenchange',  onResize);

addFullscreenButton();