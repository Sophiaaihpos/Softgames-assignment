export interface ParticleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  startScale: number;
  tint: number;
  alpha: number;
  scale: number;
}

export class PhoenixFlameLogic {
  particles: ParticleState[] = [];
  emitterX = 0;
  emitterY = 0;

  private spawnTimer = 0;
  private readonly SPAWN_INTERVAL = 3;
  private readonly MAX_PARTICLES = 10;

  setEmitter(x: number, y: number): void {
    this.emitterX = x;
    this.emitterY = y;
  }

  update(delta: number): void {
    this.spawnTimer += delta;
    if (this.spawnTimer >= this.SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      if (this.particles.length < this.MAX_PARTICLES) {
        this.trySpawn();
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= delta;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      const t = p.life / p.maxLife; // 1 --> 0 (fresh --> dead)
      const progress = 1 - t; // 0 --> 1
      // Fire rises fast, wobbles sideways
      p.vx += (Math.random() - 0.5) * 0.35;
      p.vx *= 0.92;
      p.vy -= 0.055 * delta;
      p.x += p.vx * delta;
      p.y += p.vy * delta;

      // Scale: blooms up then shrinks to a tip
      const pulse = Math.sin(progress * Math.PI);
      p.scale = p.startScale * (0.3 + pulse * 0.9);

      // Fade in quickly, stay bright, fade out near end
      p.alpha = t < 0.25 ? t / 0.25 : t > 0.85 ? (1 - t) / 0.15 : 1.0;
      p.tint = this.calcTint(progress);
    }
  }

  private trySpawn(): void {
    if (this.particles.length >= this.MAX_PARTICLES) return;

    const maxLife = 45 + Math.random() * 30;

    const startScale = 0.55 + Math.random() * 0.65;

    this.particles.push({
      x: this.emitterX + (Math.random() - 0.5) * 22,
      y: this.emitterY + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 1.8,
      vy: -(2.4 + Math.random() * 3.2),
      life: maxLife,
      maxLife,
      startScale,
      tint: 0xffffff,
      alpha: 0,
      scale: startScale,
    });
  }

  private calcTint(progress: number): number {
    let r: number, g: number, b: number;

    // White-hot core (0–0.10)
    if (progress < 0.1) {
      const q = progress / 0.1;
      r = 255;
      g = 255;
      b = Math.round(255 * (1 - q));

      // Yellow orange (0.10–0.35)
    } else if (progress < 0.35) {
      const q = (progress - 0.1) / 0.25;
      r = 255;
      g = Math.round(255 - q * 175);
      b = 0;

      // Orange bright red (0.35–0.60)
    } else if (progress < 0.6) {
      const q = (progress - 0.35) / 0.25;
      r = 255;
      g = Math.round(80 - q * 80);
      b = 0;

      // Deep red dark crimson (0.60–0.85)
    } else if (progress < 0.85) {
      const q = (progress - 0.6) / 0.25;
      r = Math.round(255 - q * 120);
      g = 0;
      b = 0;

      // Crimson near-black ember (0.85–1.0)
    } else {
      const q = (progress - 0.85) / 0.15;
      r = Math.round(135 - q * 100);
      g = 0;
      b = 0;
    }
    return (r << 16) | (g << 8) | b;
  }
}
