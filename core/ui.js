const UI = {
  drawHearts(ctx, hearts, maxHearts, x, y) {
    for (let i = 0; i < maxHearts; i++) {
      const filled = i < hearts;
      ctx.save();
      ctx.translate(x + i * 38, y);
      drawHeart(ctx, 14, filled ? '#ff4d6d' : 'rgba(255,100,120,0.25)', filled ? '#ff80a0' : 'rgba(255,150,160,0.3)');
      ctx.restore();
    }
  },

  drawScore(ctx, score, x, y) {
    ctx.save();
    ctx.font = 'bold 22px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#ffe066';
    ctx.shadowColor = '#b8860b';
    ctx.shadowBlur = 6;
    ctx.fillText('★ ' + score, x, y);
    ctx.restore();
  },

  drawShellCount(ctx, count, x, y) {
    ctx.save();
    ctx.font = 'bold 20px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#a8e6cf';
    ctx.shadowColor = '#2d6a4f';
    ctx.shadowBlur = 5;
    ctx.fillText('🐚 ' + count, x, y);
    ctx.restore();
  },

  drawAreaTitle(ctx, text, canvasW, y) {
    ctx.save();
    const pad = 28;
    const metrics = ctx.measureText(text);
    ctx.font = 'bold 26px Arial Rounded MT Bold, Arial';
    const w = ctx.measureText(text).width + pad * 2;
    const h = 44;
    const bx = (canvasW - w) / 2;

    // Bubble-style pill
    ctx.beginPath();
    roundRect(ctx, bx, y - h * 0.75, w, h, 22);
    ctx.fillStyle = 'rgba(20,80,140,0.65)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,200,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#e0f7ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#0a3060';
    ctx.shadowBlur = 8;
    ctx.fillText(text, canvasW / 2, y - h * 0.75 + h / 2);
    ctx.restore();
  },

  drawShellButton(ctx, label, cx, cy, rx, ry, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha ?? 1;
    ctx.translate(cx, cy);

    // Shell shape using bezier curves
    const sw = rx * 2, sh = ry * 2;
    ctx.beginPath();
    ctx.moveTo(0, -sh * 0.5);
    ctx.bezierCurveTo(sw * 0.6, -sh * 0.5, sw * 0.7, -sh * 0.15, sw * 0.55, sh * 0.1);
    ctx.bezierCurveTo(sw * 0.45, sh * 0.4, sw * 0.2, sh * 0.55, 0, sh * 0.5);
    ctx.bezierCurveTo(-sw * 0.2, sh * 0.55, -sw * 0.45, sh * 0.4, -sw * 0.55, sh * 0.1);
    ctx.bezierCurveTo(-sw * 0.7, -sh * 0.15, -sw * 0.6, -sh * 0.5, 0, -sh * 0.5);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, -sh * 0.5, 0, sh * 0.5);
    grad.addColorStop(0, '#f9c74f');
    grad.addColorStop(0.5, '#f3722c');
    grad.addColorStop(1, '#c9502e');
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#fff8e7';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Shell lines
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.5;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, -sh * 0.45 + i * sh * 0.18);
      ctx.bezierCurveTo(-sw * 0.3, -sh * 0.45 + i * sh * 0.18 + sh * 0.05, sw * 0.3, -sh * 0.45 + i * sh * 0.18 + sh * 0.05, 0, -sh * 0.45 + i * sh * 0.18);
      ctx.stroke();
    }

    ctx.font = 'bold 22px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6;
    ctx.fillText(label, 0, 8);
    ctx.restore();
  },

  drawBubblePanel(ctx, cx, cy, rx, ry, fillColor, strokeColor) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = fillColor || 'rgba(10,50,120,0.72)';
    ctx.fill();
    ctx.strokeStyle = strokeColor || 'rgba(120,210,255,0.6)';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Shine
    ctx.beginPath();
    ctx.ellipse(-rx * 0.25, -ry * 0.3, rx * 0.3, ry * 0.15, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fill();
    ctx.restore();
  },

  drawLevelFailScreen(ctx, W, H, onRetry) {
    // dim overlay
    ctx.fillStyle = 'rgba(0,10,30,0.75)';
    ctx.fillRect(0, 0, W, H);

    this.drawBubblePanel(ctx, W / 2, H / 2, 280, 220, 'rgba(20,60,120,0.88)', 'rgba(100,200,255,0.7)');

    ctx.font = 'bold 42px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#ff6b8a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#800020';
    ctx.shadowBlur = 12;
    ctx.fillText('Try Again!', W / 2, H / 2 - 60);

    ctx.font = '20px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#b0e0ff';
    ctx.shadowBlur = 4;
    ctx.fillText('No worries! You can do it! ♥', W / 2, H / 2 - 10);

    this.drawShellButton(ctx, 'Retry', W / 2, H / 2 + 80, 80, 36);
  },

  drawLevelCompleteScreen(ctx, W, H, levelNum, score, shells) {
    ctx.fillStyle = 'rgba(0,20,50,0.75)';
    ctx.fillRect(0, 0, W, H);

    this.drawBubblePanel(ctx, W / 2, H / 2, 320, 250, 'rgba(10,80,140,0.9)', 'rgba(80,200,255,0.8)');

    ctx.font = 'bold 46px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#ffe066';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#b8860b';
    ctx.shadowBlur = 14;
    ctx.fillText('Level Complete!', W / 2, H / 2 - 80);

    ctx.font = 'bold 22px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#a8e6cf';
    ctx.shadowBlur = 5;
    ctx.fillText('Great Job! ♥', W / 2, H / 2 - 30);

    ctx.font = '20px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 3;
    ctx.fillText('★ Score: ' + score + '   🐚 Shells: ' + shells, W / 2, H / 2 + 20);

    this.drawShellButton(ctx, 'Next Level', W / 2, H / 2 + 110, 100, 38);
  }
};

function drawHeart(ctx, size, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.bezierCurveTo(-size, -size * 0.4, -size * 1.6, size * 0.4, 0, size * 1.2);
  ctx.bezierCurveTo(size * 1.6, size * 0.4, size, -size * 0.4, 0, size * 0.3);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
