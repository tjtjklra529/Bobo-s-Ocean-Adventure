const StartScene = {
  boboFloat: 0,
  boboFloatDir: 1,
  titleWobble: 0,
  btnHover: false,
  btnX: 0,
  btnY: 0,

  init(game) {
    this.boboFloat = game.H * 0.52;
    this.titleWobble = 0;
  },

  update(game, dt) {
    const ctx = game.ctx;
    const W = game.W, H = game.H;

    // Bob Bobo
    this.boboFloat += this.boboFloatDir * 0.4;
    if (this.boboFloat > H * 0.54 || this.boboFloat < H * 0.50) this.boboFloatDir *= -1;
    this.titleWobble += 0.015;

    // Title
    drawTitle(ctx, W, H, this.titleWobble);

    // Bobo
    const bx = W * 0.5;
    const by = this.boboFloat;
    Player.x = bx;
    Player.y = by;
    Player.state = 'idle';
    Player.flickerOn = true;
    Player.draw(ctx, game.images);

    // Subtitle
    ctx.save();
    ctx.font = '20px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = 'rgba(200,240,255,0.8)';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#003566';
    ctx.shadowBlur = 6;
    ctx.fillText('Help Bobo collect memory shells!', W / 2, H * 0.72);
    ctx.restore();

    // Start button (shell-shaped)
    this.btnX = W / 2;
    this.btnY = H * 0.83;
    UI.drawShellButton(ctx, 'START', this.btnX, this.btnY, 90, 40);

    // Controls hint
    ctx.save();
    ctx.font = '15px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = 'rgba(160,220,255,0.65)';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE / TAP to float up · Release to sink', W / 2, H * 0.95);
    ctx.restore();

    // Area badge
    drawAreaBadge(ctx, W * 0.12, H * 0.15);
  },

  onClick(game, cx, cy) {
    const dx = cx - this.btnX;
    const dy = cy - this.btnY;
    if (Math.abs(dx) < 110 && Math.abs(dy) < 50) {
      game.score = 0;
      game.shellsCollected = 0;
      game.setScene('level', 0);
    }
  }
};

function drawTitle(ctx, W, H, t) {
  ctx.save();
  ctx.textAlign = 'center';

  // Shadow
  ctx.font = 'bold 62px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = 'rgba(0,20,60,0.5)';
  ctx.fillText("BOBO'S OCEAN JUMP", W / 2 + 4, H * 0.18 + 4 + Math.sin(t) * 3);

  // Gradient text
  const grad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
  grad.addColorStop(0, '#90e0ef');
  grad.addColorStop(0.3, '#ffffff');
  grad.addColorStop(0.6, '#caf0f8');
  grad.addColorStop(1, '#48cae4');
  ctx.fillStyle = grad;
  ctx.shadowColor = '#0096c7';
  ctx.shadowBlur = 18;
  ctx.fillText("BOBO'S OCEAN JUMP", W / 2, H * 0.18 + Math.sin(t) * 3);

  // Subtitle
  ctx.font = 'bold 22px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = '#ffe066';
  ctx.shadowColor = '#b8860b';
  ctx.shadowBlur = 8;
  ctx.fillText('Area 1: Coral Garden', W / 2, H * 0.27);

  ctx.restore();
}

function drawAreaBadge(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  // Bubble panel
  ctx.beginPath();
  ctx.ellipse(0, 0, 85, 50, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,60,120,0.6)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(100,200,255,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 13px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = '#a8e6cf';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Collect Memory', 0, -12);
  ctx.fillText('Shells 🐚', 0, 10);
  ctx.restore();
}
