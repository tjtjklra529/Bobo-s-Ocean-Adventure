const StartScene = {
  boboY: 0, boboDir: 1,
  titleT: 0,
  bgFish: [],

  init(game) {
    this.boboY = game.H * 0.52;
    this.titleT = 0;
    Player.x = game.W * 0.5;
    Player.y = this.boboY;
    Player.state = 'idle';
    Player.flickerOn = true;
    Player.shielded = false;
    Player.invincible = false;
    Audio.stopMusic();
  },

  update(game, dt) {
    const ctx = game.ctx;
    const W = game.W, H = game.H;
    this.titleT += dt;

    // Bobo bobs
    this.boboY += this.boboDir * 0.38;
    if (this.boboY > H * 0.545 || this.boboY < H * 0.495) this.boboDir *= -1;
    Player.y = this.boboY;
    Player.update(dt);

    // Decorative bubbles rising around Bobo
    if (Math.random() < 0.06) {
      Particles.bubble(W * 0.3 + Math.random() * W * 0.4, H * 0.75);
    }

    // Draw Bobo first (behind title)
    Player.draw(ctx, game.images);

    // Title
    _drawTitle(ctx, W, H, this.titleT);

    // Subtitle + badges
    _drawBadges(ctx, W, H, this.titleT);

    // Buttons
    const bx = W / 2, by = H * 0.83;
    UI.shellButton(ctx, 'PLAY', bx - 105, by, 85, 38, { fontSize: 22, textY: 8 });
    UI.shellButton(ctx, 'LEVELS', bx + 105, by, 85, 38, { fontSize: 18, textY: 8 });

    // Controls hint
    ctx.save();
    ctx.font = '14px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = 'rgba(160,220,255,0.6)';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE / TAP = Float Up  ·  Release = Sink Down  ·  M = Mute', W / 2, H * 0.95);
    ctx.restore();
  },

  onClick(game, cx, cy) {
    const W = game.W, H = game.H;
    const by = H * 0.83;
    if (Math.abs(cx - (W / 2 - 105)) < 105 && Math.abs(cy - by) < 52) {
      Audio.sfx('click');
      game.goScene('level', 0);
    } else if (Math.abs(cx - (W / 2 + 105)) < 105 && Math.abs(cy - by) < 52) {
      Audio.sfx('click');
      game.goScene('select');
    }
  }
};

function _drawTitle(ctx, W, H, t) {
  ctx.save();
  ctx.textAlign = 'center';
  const bounce = Math.sin(t * 0.0012) * 5;

  // Glow shadow
  ctx.font = 'bold 68px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = 'rgba(0,30,80,0.5)';
  ctx.fillText("BOBO'S OCEAN JUMP", W / 2 + 3, H * 0.17 + 3 + bounce);

  // Main gradient text
  const g = ctx.createLinearGradient(W * 0.15, 0, W * 0.85, 0);
  g.addColorStop(0, '#90e0ef');
  g.addColorStop(0.3, '#ffffff');
  g.addColorStop(0.6, '#caf0f8');
  g.addColorStop(1, '#48cae4');
  ctx.fillStyle = g;
  ctx.shadowColor = '#0096c7';
  ctx.shadowBlur = 22;
  ctx.fillText("BOBO'S OCEAN JUMP", W / 2, H * 0.17 + bounce);

  // Sub
  ctx.font = 'bold 24px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = '#ffe066';
  ctx.shadowColor = '#b8860b';
  ctx.shadowBlur = 10;
  ctx.fillText('Area 1: Coral Garden', W / 2, H * 0.27 + bounce * 0.5);
  ctx.restore();
}

function _drawBadges(ctx, W, H, t) {
  const pulse = 1 + Math.sin(t * 0.002) * 0.04;

  // Left badge
  ctx.save();
  ctx.translate(W * 0.1, H * 0.16);
  ctx.scale(pulse, pulse);
  ctx.beginPath();
  ctx.ellipse(0, 0, 78, 46, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,50,110,0.62)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(100,200,255,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = 'bold 13px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = '#a8e6cf';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Collect Shells', 0, -10);
  ctx.fillText('🐚 Unlock Stories', 0, 10);
  ctx.restore();

  // Right badge
  ctx.save();
  ctx.translate(W * 0.9, H * 0.16);
  ctx.scale(pulse, pulse);
  ctx.beginPath();
  ctx.ellipse(0, 0, 78, 46, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,50,110,0.62)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(100,200,255,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.font = 'bold 13px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = '#ffe066';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★ Earn Stars', 0, -10);
  ctx.fillText('10 Levels', 0, 10);
  ctx.restore();
}
