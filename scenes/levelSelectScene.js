const LevelSelect = {
  boboX: 0, boboY: 0,
  hoveredLevel: -1,
  t: 0,
  panelPositions: [],

  init(game) {
    this.t = 0;
    this.boboX = game.W * 0.08;
    this.boboY = game.H * 0.5;
    Player.init(game.W, game.H);
    Player.x = this.boboX;
    Player.y = this.boboY;
    Player.state = 'swim';
    Audio.stopMusic();

    // Pre-compute panel positions (2 rows x 5 cols)
    this.panelPositions = [];
    const cols = 5, rows = 2;
    const padX = 82, padY = 88;
    const startX = game.W / 2 - (cols - 1) * padX / 2;
    const startY = game.H * 0.4;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.panelPositions.push({
          x: startX + c * padX,
          y: startY + r * padY,
          idx: r * cols + c,
          bobPhase: Math.random() * Math.PI * 2,
        });
      }
    }
  },

  update(game, dt) {
    const ctx = game.ctx;
    const W = game.W, H = game.H;
    this.t += dt;

    // Bobo swims left-right
    this.boboX += 0.7;
    if (this.boboX > W * 0.92) this.boboX = -50;
    Player.x = this.boboX;
    Player.y = H * 0.5 + Math.sin(this.t * 0.001) * 20;
    Player.vy = Math.sin(this.t * 0.001) * 2;
    Player.state = 'swim';
    Player.update(dt);

    // Bubble particles
    if (Math.random() < 0.04) {
      Particles.bubble(Math.random() * W, H * 0.95);
    }

    // Title
    ctx.save();
    ctx.font = 'bold 36px Arial Rounded MT Bold, Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#caf0f8';
    ctx.shadowColor = '#0096c7';
    ctx.shadowBlur = 14;
    ctx.fillText('Area 1: Coral Garden — Select Level', W / 2, H * 0.12);
    ctx.restore();

    // Level panels
    for (const p of this.panelPositions) {
      this._drawPanel(ctx, game, p);
    }

    // Bobo (on top)
    Player.draw(ctx, game.images);

    // Back button
    UI.shellButton(ctx, '← Back', W * 0.08, H * 0.9, 70, 32, { fontSize: 15 });

    // Total stars
    const total = Save.d.levels.reduce((s, l) => s + l.stars, 0);
    ctx.save();
    ctx.font = 'bold 18px Arial Rounded MT Bold, Arial';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffe066';
    ctx.shadowColor = '#b8860b';
    ctx.shadowBlur = 8;
    ctx.fillText(`Total ★: ${total} / 30`, W * 0.96, H * 0.92);
    ctx.restore();
  },

  _drawPanel(ctx, game, p) {
    const idx = p.idx;
    const unlocked = Save.isUnlocked(idx);
    const stars = Save.getStars(idx);
    const lvData = CoralGardenLevels[idx];
    const bob = Math.sin(this.t * 0.0015 + p.bobPhase) * 5;
    const hov = this.hoveredLevel === idx;

    ctx.save();
    ctx.translate(p.x, p.y + bob);
    const scale = hov ? 1.12 : 1;
    ctx.scale(scale, scale);

    // Bubble background
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 34, 0, 0, Math.PI * 2);
    ctx.fillStyle = unlocked
      ? (hov ? 'rgba(0,100,200,0.85)' : 'rgba(5,60,140,0.72)')
      : 'rgba(20,30,60,0.65)';
    ctx.fill();
    ctx.strokeStyle = unlocked
      ? (stars === 3 ? 'rgba(255,220,60,0.9)' : hov ? 'rgba(100,220,255,0.9)' : 'rgba(80,180,255,0.6)')
      : 'rgba(60,80,120,0.4)';
    ctx.lineWidth = hov ? 3 : 2;
    ctx.shadowColor = hov ? '#48cae4' : 'transparent';
    ctx.shadowBlur = hov ? 16 : 0;
    ctx.stroke();

    // Level number
    ctx.font = `bold 18px Arial Rounded MT Bold, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = unlocked ? '#fff' : '#4a5a7a';
    ctx.fillText(idx + 1, 0, unlocked ? -8 : 0);

    if (unlocked) {
      // Stars (tiny)
      for (let s = 0; s < 3; s++) {
        const sx = (s - 1) * 12;
        ctx.beginPath();
        for (let j = 0; j < 10; j++) {
          const a = (j * Math.PI / 5) - Math.PI / 2;
          const r = j % 2 === 0 ? 6 : 2.8;
          const fn = j === 0 ? 'moveTo' : 'lineTo';
          ctx[fn](sx + Math.cos(a) * r, 14 + Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fillStyle = s < stars ? '#ffe066' : 'rgba(100,130,180,0.35)';
        ctx.fill();
      }

      // Level name tooltip on hover
      if (hov) {
        ctx.font = 'bold 11px Arial Rounded MT Bold, Arial';
        ctx.fillStyle = '#a8e6cf';
        ctx.fillText(lvData?.name || '', 0, -24);
      }
    } else {
      // Lock icon
      ctx.font = '16px Arial';
      ctx.fillText('🔒', 0, 0);
    }
    ctx.restore();
  },

  onClick(game, cx, cy) {
    // Back
    if (Math.abs(cx - game.W * 0.08) < 90 && Math.abs(cy - game.H * 0.9) < 45) {
      Audio.sfx('click');
      game.goScene('start');
      return;
    }
    // Level panels
    for (const p of this.panelPositions) {
      const bob = Math.sin(this.t * 0.0015 + p.bobPhase) * 5;
      const dx = cx - p.x, dy = cy - (p.y + bob);
      if (dx * dx + dy * dy < 38 * 38) {
        if (Save.isUnlocked(p.idx)) {
          Audio.sfx('click');
          game.goScene('level', p.idx);
        }
        return;
      }
    }
  },

  // Track mouse for hover (called from game._handleClick detection at mousemove — simplified)
  setHover(cx, cy) {
    this.hoveredLevel = -1;
    for (const p of this.panelPositions) {
      const dx = cx - p.x, dy = cy - p.y;
      if (dx * dx + dy * dy < 42 * 42 && Save.isUnlocked(p.idx)) {
        this.hoveredLevel = p.idx;
        return;
      }
    }
  }
};

// Hook mousemove for hover
window.addEventListener('mousemove', e => {
  if (!Game.canvas) return;
  if (Game.scene !== 'select') return;
  const r = Game.canvas.getBoundingClientRect();
  const cx = (e.clientX - r.left) * (Game.W / r.width);
  const cy = (e.clientY - r.top) * (Game.H / r.height);
  LevelSelect.setHover(cx, cy);
});
