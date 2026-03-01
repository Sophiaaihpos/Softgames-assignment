# Softgames Assignment

A PixiJS interactive demo application built as part of the Softgames application process.  
Live demo: **[https://sophiasigethy.github.io/Softgames-assignment/](https://sophiasigethy.github.io/Softgames-assignment/)**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Scenes](#scenes)
- [Architecture](#architecture)
- [Local Setup](#local-setup)
- [Build & Deployment](#build--deployment)
- [Design Decisions](#design-decisions)

---

## Overview

This project contains three interactive demos, each showcasing different aspects of game and UI development with PixiJS v8:

| Scene | Description |
|---|---|
| **Ace of Shadows** | 144 cards distributed across 3 stacks, animated with GSAP |
| **Magic Words** | Chat dialogue system with remote emoji/avatar loading |
| **Phoenix Flame** | Mouse-guided particle flame effect |

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| [PixiJS](https://pixijs.com/) | ^8.16 | 2D WebGL rendering |
| [GSAP](https://gsap.com/) | ^3.14 | Card move animations |
| [TypeScript](https://www.typescriptlang.org/) | ~5.7 | Type safety |
| [Webpack](https://webpack.js.org/) | ^5.98 | Bundling |
| [ESLint](https://eslint.org/) + [Prettier](https://prettier.io/) | latest | Code quality |

---

## Project Structure

```
src/
├── main.ts                  # App entry point, PIXI init, scene registration
├── core/
│   ├── Scene.ts             # Scene interface definition
│   └── SceneManager.ts      # Scene lifecycle management (register, switch, resize)
├── scenes/
│   ├── BaseScene.ts         # Abstract base: FPS counter, back button, resize handling
│   ├── MenuScene/           # Scene selection grid
│   ├── AceOfShadows/        # Card stack animation scene
│   ├── MagicWords/          # Dialogue + emoji rendering scene
│   └── PhoenixFlame/        # Particle flame scene
├── shared/
│   └── ui/
│       └── BackButton.ts    # Reusable navigation component
└── utils/
    ├── FpsCounter.ts        # Live FPS display overlay
    ├── Fullscreen.ts        # Fullscreen toggle utility
    └── Responsive.ts        # Layout scaling helpers (rem, isMobile)
```

---

## Scenes

### Ace of Shadows

- **144 cards** are placed on **stack 0** at startup.
- Every **1 second**, the top card of the lowest-index non-empty stack is moved to the next stack via a **GSAP arc animation** (parabolic path with mid-point lift).
- Cards are rendered using procedurally generated **Canvas 2D textures** with 4 color palettes.
- On resize, stacks are repositioned and card sizes are recalculated responsively.

**Key files:** [`AceOfShadowsScene.ts`](src/scenes/AceOfShadows/AceOfShadowsScene.ts), [`AceOfShadowsLogic.ts`](src/scenes/AceOfShadows/AceOfShadowsLogic.ts), [`CardTexture.ts`](src/scenes/AceOfShadows/CardTexture.ts)

---

### Magic Words

- Fetches dialogue, emoji and avatar data from a **remote API** with graceful fallback to local data.
- Text lines are parsed for `{emoji_name}` tokens and replaced with **sprite images**.
- Word wrapping is implemented manually using a Canvas 2D measurement approach.
- Avatars are rendered with **circular masks** and colored accent rings.
- Lines fade in/out with **ticker-based alpha transitions**.
- Advance via `Space`, click, or tap.

**Key files:** [`MagicWordsScene.ts`](src/scenes/MagicWords/MagicWordsScene.ts), [`MagicWordsLogic.ts`](src/scenes/MagicWords/MagicWordsLogic.ts), [`TextLayout.ts`](src/scenes/MagicWords/TextLayout.ts)

---

### Phoenix Flame

- Up to **10 particles** rendered via a sprite pool (object pooling pattern).
- Particles follow the **mouse/touch position** with physics-based movement (rise, wobble, fade).
- Color transitions from white-hot core → yellow → orange → deep red → ember using bitwise RGB interpolation.
- Background uses layered glow circles for atmosphere.

**Key files:** [`FlameScene.ts`](src/scenes/PhoenixFlame/FlameScene.ts), [`FlameLogic.ts`](src/scenes/PhoenixFlame/FlameLogic.ts)

---

## Architecture

### Scene Management

```
SceneManager
 ├── register(name, scene)   → stores scene instances
 ├── switchTo(name)          → calls stop() on old, start() on new
 └── notifyResize()          → calls onLayout() on active scene
```

All scenes extend [`BaseScene`](src/scenes/BaseScene.ts) which provides:
- Shared **FPS counter** and **back button** via `buildBaseUI()`
- Debounced **resize handling** (100ms) that triggers `onLayout()`
- Clean teardown via `stopBaseUI()`

### Responsive Layout

[`getLayout(width, height)`](src/utils/Responsive.ts) returns a `LayoutMetrics` object with:
- `scale` — uniform scale factor relative to a 1280×720 base
- `rem(px)` — scales any pixel value to the current viewport
- `isMobile` — `true` when width < 768px

---

## Local Setup

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5143)
npm run dev

# Lint
npm run lint

# Production build → /dist
npm run build
```

---

## Build & Deployment

The project is automatically deployed to **GitHub Pages** on every push to `main` via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. `npm ci` — clean install
2. `npm run build` — lint + webpack production bundle
3. Deploy `./dist` to the `gh-pages` branch

---

## Design Decisions

| Decision | Reason |
|---|---|
| **Logic/Scene separation** | Each scene has a `*Logic` class holding pure state/update logic, keeping the scene class focused on rendering. |
| **Sprite pooling (Flame)** | Avoids runtime allocations; sprites are reused and toggled visible/invisible. |
| **Canvas 2D card textures** | Generates  card visuals without external assets. |
| **Debounced resize** | Prevents layout thrashing on rapid window resize events. |
| **Fallback dialogue data** | Ensures the Magic Words demo works even if the external API is unavailable. |
| **GSAP for card animation** | Provides smooth, configurable easing