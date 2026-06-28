/* ─── UI Rendering ─── */
const UI = {
  // Animated heart wobble
  heartWobble: [0, 0, 0],

  drawHearts(ctx, hearts, max, x, y) {
    for (let i = 0; i < max; i++) {
      const filled = i < hearts;
      if (filled) this.heartWobble[i] = Math.max(0, (this.heartWobble[i] || 0) - 0.04);
      const scale = 1 + (this.heartWobble[i] || 0) * 0.3;
      ctx.save();
      ctx.translate(x + i * 40, y);
      ctx.scale(scale, scale);
      _heart(ctx, 15, filled ? '#ff4d6d' : 'rgba(255,100,120,0.2)', filled ? '#ff8099' : 'rgba(200,80,100,0.25)');
      ctx.restore();
    }
  },

  pingHeart(idx) {
    this.heartWobble[idx] = 1.0;
  },

  drawScore(ctx, score, x, y) {
    ctx.save();
    ctx.font = 'bold 23px Arial Rounded MT Bold, Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = '#b8860b';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffe066';
    ctx.fillText('★ ' + score, x, y);
    ctx.restore();
  },

  drawShells(ctx, count, x, y) {
    ctx.save();
    ctx.font = 'bold 20px Arial Rounded MT Bold, Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = '#2d6a4f';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#a8e6cf';
    ctx.fillText('🐚 ' + count, x, y);
    ctx.restore();
  },

  drawCombo(ctx, combo, x, y) {
    if (combo < 2) return;
    ctx.save();
    const scale = 1 + Math.min(combo - 1, 4) * 0.12;
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.font = 'bold 18px Arial Rounded MT Bold, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff6b00';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#ff9f43';
    ctx.fillText(`x${combo} COMBO!`, 0, 0);
    ctx.restore();
  },

  drawAreaLabel(ctx, text, W, y) {
    ctx.save();
    ctx.font = 'bold 22px Arial Rounded MT Bold, Arial';
    const tw = ctx.measureText(text).width;
    const pad = 24, h = 40;
    const bx = (W - tw - pad * 2) / 2;
    // Bubble pill bg
    _bubblePill(ctx, bx, y - h * 0.8, tw + pad * 2, h, 20);
    ctx.fillStyle = '#cef5ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#004080';
    ctx.shadowBlur = 7;
    ctx.fillText(text, W / 2, y - h * 0.8 + h / 2);
    ctx.restore();
  },

  drawProgressBar(ctx, progress, W, H) {
    const pw = W * 0.46;
    const px = W / 2 - pw / 2, py = H - 16;
    // Track
    ctx.save();
    ctx.globalAlpha = 0.5;
    _rrect(ctx, px, py - 5, pw, 10, 5);
    ctx.fillStyle = 'rgba(0,30,80,0.7)';
    ctx.fill();
    ctx.restore();
    // Fill
    const fillW = pw * Math.min(1, progress);
    if (fillW > 0) {
      const g = ctx.createLinearGradient(px, 0, px + pw, 0);
      g.addColorStop(0, '#0096c7');
      g.addColorStop(1, '#90e0ef');
      _rrect(ctx, px, py - 5, fillW, 10, 5);
      ctx.fillStyle = g;
      ctx.fill();
    }
    // Bobo dot
    ctx.save();
    ctx.beginPath();
    ctx.arc(px + fillW, py, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#66bb6a';
    ctx.shadowColor = '#43a047';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.restore();
  },

  // Shell-shaped button — returns true if (cx,cy) was clicked inside it
  shellButton(ctx, label, x, y, rx, ry, opts) {
    opts = opts || {};
    ctx.save();
    ctx.translate(x, y);
    if (opts.scale) ctx.scale(opts.scale, opts.scale);

    const W2 = rx * 2, H2 = ry * 2;
    ctx.beginPath();
    ctx.moveTo(0, -H2 * 0.5);
    ctx.bezierCurveTo( W2 * 0.6, -H2 * 0.5,  W2 * 0.72, -H2 * 0.1,  W2 * 0.55,  H2 * 0.12);
    ctx.bezierCurveTo( W2 * 0.44,  H2 * 0.42,  W2 * 0.2,  H2 * 0.55, 0,  H2 * 0.5);
    ctx.bezierCurveTo(-W2 * 0.2,  H2 * 0.55, -W2 * 0.44, H2 * 0.42, -W2 * 0.55,  H2 * 0.12);
    ctx.bezierCurveTo(-W2 * 0.72, -H2 * 0.1, -W2 * 0.6, -H2 * 0.5, 0, -H2 * 0.5);
    ctx.closePath();

    const hov = opts.hover;
    const g = ctx.createLinearGradient(0, -H2 * 0.5, 0, H2 * 0.5);
    g.addColorStop(0, hov ? '#ffda6a' : '#f9c74f');
    g.addColorStop(0.5, hov ? '#ff8c42' : '#f3722c');
    g.addColorStop(1, hov ? '#e05020' : '#c9502e');
    ctx.fillStyle = g;
    ctx.shadowColor = hov ? 'rgba(255,140,60,0.7)' : 'rgba(200,80,40,0.4)';
    ctx.shadowBlur = hov ? 20 : 10;
    ctx.fill();
    ctx.strokeStyle = '#fff8e7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Shell lines
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.2;
    for (let i = 1; i <= 4; i++) {
      const yy = -H2 * 0.45 + i * H2 * 0.19;
      ctx.beginPath();
      ctx.moveTo(0, yy);
      ctx.bezierCurveTo(-W2 * 0.3, yy + H2 * 0.04, W2 * 0.3, yy + H2 * 0.04, 0, yy);
      ctx.stroke();
    }

    ctx.font = `bold ${opts.fontSize || 20}px Arial Rounded MT Bold, Arial`;
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 5;
    ctx.fillText(label, 0, opts.textY || 6);
    ctx.restore();
  },

  bubblePanel(ctx, cx, cy, rx, ry, alpha) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = alpha ?? 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(5,40,110,0.78)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,210,255,0.65)';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // Shine
    ctx.beginPath();
    ctx.ellipse(-rx * 0.26, -ry * 0.28, rx * 0.28, ry * 0.14, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();
    ctx.restore();
  },

  drawStars(ctx, count, cx, y) {
    for (let i = 0; i < 3; i++) {
      const filled = i < count;
      ctx.save();
      ctx.translate(cx + (i - 1) * 26, y);
      ctx.beginPath();
      for (let j = 0; j < 10; j++) {
        const a = (j * Math.PI / 5) - Math.PI / 2;
        const r = j % 2 === 0 ? 10 : 4.5;
        const fn = j === 0 ? 'moveTo' : 'lineTo';
        ctx[fn](Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fillStyle = filled ? '#ffe066' : 'rgba(100,120,160,0.4)';
      if (filled) { ctx.shadowColor = '#ffb300'; ctx.shadowBlur = 8; }
      ctx.fill();
      ctx.restore();
    }
  },

  // Fail screen
  drawFail(ctx, W, H) {
    ctx.fillStyle = 'rgba(0,5,20,0.72)';
    ctx.fillRect(0, 0, W, H);
    this.bubblePanel(ctx, W / 2, H / 2, 290, 230);
    ctx.font = 'bold 48px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#ff6b8a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#800020'; ctx.shadowBlur = 16;
    ctx.fillText('Try Again!', W / 2, H / 2 - 68);
    ctx.font = '19px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#b0e0ff'; ctx.shadowBlur = 4;
    ctx.fillText('No worries! You can do it! ♥', W / 2, H / 2 - 18);
    this.shellButton(ctx, 'Retry', W / 2 - 90, H / 2 + 80, 72, 34, { fontSize: 18 });
    this.shellButton(ctx, 'Menu', W / 2 + 90, H / 2 + 80, 72, 34, { fontSize: 18 });
  },

  // Win screen
  drawWin(ctx, W, H, levelNum, score, shells, stars) {
    ctx.fillStyle = 'rgba(0,10,40,0.72)';
    ctx.fillRect(0, 0, W, H);
    this.bubblePanel(ctx, W / 2, H / 2, 330, 260);
    ctx.font = 'bold 48px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#ffe066'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = '#b8860b'; ctx.shadowBlur = 18;
    ctx.fillText('Level Complete!', W / 2, H / 2 - 90);
    ctx.font = 'bold 20px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#a8e6cf'; ctx.shadowBlur = 5;
    ctx.fillText('Great Job! ♥', W / 2, H / 2 - 48);
    this.drawStars(ctx, stars, W / 2, H / 2 - 14);
    ctx.font = '19px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 3;
    ctx.fillText(`★ ${score}   🐚 ${shells}`, W / 2, H / 2 + 28);
    this.shellButton(ctx, 'Next Level', W / 2 - 100, H / 2 + 105, 85, 36, { fontSize: 18 });
    this.shellButton(ctx, 'Menu', W / 2 + 100, H / 2 + 105, 72, 36, { fontSize: 18 });
  },

  // Mute button (top-right corner)
  drawMute(ctx, muted, W) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(W - 30, 30, 18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,30,80,0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,200,255,0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#cef';
    ctx.fillText(muted ? '🔇' : '🔊', W - 30, 30);
    ctx.restore();
  }
};

function _heart(ctx, size, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(0, size * 0.3);
  ctx.bezierCurveTo(-size, -size * 0.4, -size * 1.6, size * 0.4, 0, size * 1.2);
  ctx.bezierCurveTo(size * 1.6, size * 0.4, size, -size * 0.4, 0, size * 0.3);
  ctx.fillStyle = fill; ctx.fill();
  ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke();
}

function _bubblePill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  _rrect(ctx, x, y, w, h, r);
  ctx.fillStyle = 'rgba(10,50,140,0.65)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(100,210,255,0.45)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function _rrect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
