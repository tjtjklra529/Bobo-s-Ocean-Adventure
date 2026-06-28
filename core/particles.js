const Particles = {
  pool: [],

  spawn(x, y, cfg) {
    const n = cfg.count || 8;
    for (let i = 0; i < n; i++) {
      const angle = (cfg.angle ?? Math.random() * Math.PI * 2);
      const spread = cfg.spread ?? Math.PI * 2;
      const a = angle - spread / 2 + Math.random() * spread;
      const spd = lerp(cfg.speedMin ?? 1, cfg.speedMax ?? 4, Math.random());
      const colors = cfg.colors || [cfg.color || '#fff'];
      this.pool.push({
        x, y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd + (cfg.upBias ?? -0.8),
        r: lerp(cfg.rMin ?? 3, cfg.rMax ?? 7, Math.random()),
        life: 1.0,
        decay: lerp(cfg.decayMin ?? 0.014, cfg.decayMax ?? 0.026, Math.random()),
        color: colors[Math.floor(Math.random() * colors.length)],
        type: cfg.type || 'circle',
        gravity: cfg.gravity ?? 0.07,
        glow: cfg.glow ?? false,
        wobble: 0,
        wobbleSpd: cfg.wobbleSpd ?? 0,
      });
    }
  },

  text(x, y, str, color) {
    this.pool.push({
      x, y, text: str,
      type: 'text', color: color || '#ffe066',
      life: 1.0, decay: 0.016,
      vx: (Math.random() - 0.5) * 0.6, vy: -1.5,
      gravity: 0.018, r: 0,
    });
  },

  bubble(x, y) {
    this.pool.push({
      x, y,
      vx: (Math.random() - 0.5) * 0.9,
      vy: -(0.7 + Math.random() * 1.4),
      r: 3 + Math.random() * 9,
      life: 1.0, decay: 0.007 + Math.random() * 0.009,
      type: 'bubble', gravity: -0.03,
      wobble: Math.random() * Math.PI * 2, wobbleSpd: 0.04,
    });
  },

  ring(x, y, color) {
    this.pool.push({
      x, y, r: 8, maxR: 55,
      type: 'ring', color: color || '#90e0ef',
      life: 1.0, decay: 0.04,
      vx: 0, vy: 0, gravity: 0,
    });
  },

  update() {
    for (let i = this.pool.length - 1; i >= 0; i--) {
      const p = this.pool[i];
      p.x += p.vx; p.y += p.vy;
      p.vy += p.gravity || 0;
      p.wobble += p.wobbleSpd || 0;
      if (p.wobbleSpd) p.x += Math.sin(p.wobble) * 0.4;
      if (p.type === 'ring') p.r = lerp(p.r, p.maxR, 0.12);
      p.life -= p.decay;
      if (p.life <= 0) this.pool.splice(i, 1);
    }
  },

  draw(ctx) {
    for (const p of this.pool) {
      if (p.life <= 0) continue;
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);

      switch(p.type) {
        case 'text':
          ctx.font = 'bold 20px Arial Rounded MT Bold, Arial';
          ctx.fillStyle = p.color;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 5;
          ctx.fillText(p.text, p.x, p.y);
          break;

        case 'bubble':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(180,230,255,0.85)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.fillStyle = 'rgba(200,240,255,0.1)';
          ctx.fill();
          // Shine
          ctx.beginPath();
          ctx.arc(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.25, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fill();
          break;

        case 'ring':
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 3 * p.life;
          ctx.stroke();
          break;

        case 'star':
          _drawStarParticle(ctx, p.x, p.y, p.r * 0.45, p.r, p.color);
          break;

        default:
          if (p.glow) { ctx.shadowColor = p.color; ctx.shadowBlur = p.r * 2.5; }
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(0.5, p.r * p.life), 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.fill();
      }
      ctx.restore();
    }
  },

  clear() { this.pool = []; }
};

function _drawStarParticle(ctx, cx, cy, ir, or, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI / 5) - Math.PI / 2;
    const r = i % 2 === 0 ? or : ir;
    const fn = i === 0 ? 'moveTo' : 'lineTo';
    ctx[fn](cx + Math.cos(ang) * r, cy + Math.sin(ang) * r);
  }
  ctx.closePath();
  ctx.fill();
}

function lerp(a, b, t) { return a + (b - a) * t; }
