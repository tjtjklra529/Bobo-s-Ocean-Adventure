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

  // Win screen — with finish arch
  drawWin(ctx, W, H, levelNum, score, shells, stars) {
    ctx.fillStyle = 'rgba(0,10,40,0.72)';
    ctx.fillRect(0, 0, W, H);
    this.bubblePanel(ctx, W / 2, H / 2, 340, 268);

    // Finish arch centered in upper portion of panel
    this.drawFinishArch(ctx, W / 2, H / 2 - 68, 0.88);

    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    this.drawStars(ctx, stars, W / 2, H / 2 + 20);
    ctx.font = '18px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#004'; ctx.shadowBlur = 3;
    ctx.fillText(`★ ${score}   🐚 ${shells}`, W / 2, H / 2 + 60);
    ctx.restore();

    this.shellButton(ctx, 'Next Level', W / 2 - 100, H / 2 + 115, 85, 36, { fontSize: 18 });
    this.shellButton(ctx, 'Menu', W / 2 + 100, H / 2 + 115, 72, 36, { fontSize: 18 });
  },

  // Mute button — matches artwork: scalloped circle, ocean interior, speaker icon
  drawMute(ctx, muted, W, t) {
    const cx = W - 46, cy = 46;
    ctx.save();
    ctx.translate(cx, cy);

    // Scalloped border — pink if muted, cream if sound on
    const bumps = 12, bumpR = 44;
    for (let i = 0; i < bumps; i++) {
      const a = (i / bumps) * Math.PI * 2;
      const bx = Math.cos(a) * bumpR, by = Math.sin(a) * bumpR;
      ctx.beginPath();
      ctx.arc(bx, by, 7.5, 0, Math.PI * 2);
      const c1 = muted ? '#ff6b9d' : '#e8f4fd';
      const c2 = muted ? '#c9184a' : '#a0c4de';
      const gB = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 7.5);
      gB.addColorStop(0, c1); gB.addColorStop(1, c2);
      ctx.fillStyle = gB;
      ctx.fill();
    }

    // Main circle — ocean gradient
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    const gMain = ctx.createRadialGradient(-10, -14, 3, 0, 0, 38);
    gMain.addColorStop(0, '#90e0ef');
    gMain.addColorStop(0.5, '#0096c7');
    gMain.addColorStop(1, '#023e8a');
    ctx.fillStyle = gMain;
    ctx.fill();

    // Shine spot
    ctx.beginPath();
    ctx.ellipse(-10, -14, 12, 7, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fill();

    // Speaker icon (cream/white)
    ctx.save();
    ctx.strokeStyle = '#f0e6d3';
    ctx.fillStyle = '#f0e6d3';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    // Speaker body
    ctx.beginPath();
    ctx.moveTo(-14, -8); ctx.lineTo(-6, -8);
    ctx.lineTo(2, -16); ctx.lineTo(2, 16);
    ctx.lineTo(-6, 8); ctx.lineTo(-14, 8); ctx.closePath();
    ctx.fill();

    if (muted) {
      // Pink X
      ctx.strokeStyle = '#ff4d6d';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(8, -12); ctx.lineTo(18, -2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18, -12); ctx.lineTo(8, -2); ctx.stroke();
    } else {
      // Sound waves
      ctx.strokeStyle = '#f0e6d3';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      // Inner arc
      ctx.beginPath();
      ctx.arc(2, 0, 9, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
      // Outer arc
      ctx.beginPath();
      ctx.arc(2, 0, 17, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.stroke();
    }
    ctx.restore();

    // Decorations at bottom: tiny seaweed + starfish
    _muteSeaweed(ctx, -18, 34, '#52b788', '#40916c');
    _muteSeaweed(ctx, 20, 34, '#74c69d', '#52b788');
    _muteStarfish(ctx, 2, 40, 6, '#ff9f43');

    ctx.restore();
  },

  // FINISH arch — drawn at the end of a level or on win screen
  drawFinishArch(ctx, cx, cy, scale) {
    scale = scale || 1;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    _finishArch(ctx);
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

function _muteSeaweed(ctx, x, y, col1, col2) {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < 3; i++) {
    const a = (i - 1) * 0.45;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(Math.cos(a) * 8, -10, Math.cos(a) * 5, -20 - i * 3);
    ctx.strokeStyle = i % 2 === 0 ? col1 : col2;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

function _muteStarfish(ctx, x, y, r, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI / 5) - Math.PI / 2;
    const rd = i % 2 === 0 ? r : r * 0.45;
    i === 0 ? ctx.moveTo(Math.cos(a) * rd, Math.sin(a) * rd)
             : ctx.lineTo(Math.cos(a) * rd, Math.sin(a) * rd);
  }
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}

function _finishArch(ctx) {
  // Sandy base
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 72, 120, 14, 0, 0, Math.PI * 2);
  const gSand = ctx.createRadialGradient(0, 72, 2, 0, 72, 120);
  gSand.addColorStop(0, '#f5deb3');
  gSand.addColorStop(1, '#d4a76a');
  ctx.fillStyle = gSand;
  ctx.fill();
  ctx.restore();

  // Left pillar
  _archPillar(ctx, -68, 20);
  // Right pillar
  _archPillar(ctx, 68, 20);

  // Arch curve (purple)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-68, 20);
  ctx.bezierCurveTo(-68, -60, 68, -60, 68, 20);
  ctx.lineWidth = 26;
  ctx.strokeStyle = '#9b72cf';
  ctx.lineCap = 'round';
  ctx.stroke();
  // Highlight edge
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#c39bd3';
  ctx.stroke();
  // Rope knots on arch
  _archKnot(ctx, -62, -14, 0.7);
  _archKnot(ctx, 62, -14, -0.7);
  ctx.restore();

  // Pink banner across top
  ctx.save();
  ctx.beginPath();
  _rrect(ctx, -90, -52, 180, 38, 12);
  const gBanner = ctx.createLinearGradient(0, -52, 0, -14);
  gBanner.addColorStop(0, '#ff6eb4');
  gBanner.addColorStop(1, '#e91e8c');
  ctx.fillStyle = gBanner;
  ctx.fill();
  ctx.strokeStyle = '#ff9fce';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // FINISH! text
  ctx.font = 'bold 28px Arial Rounded MT Bold, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff8f0';
  ctx.shadowColor = '#c9184a';
  ctx.shadowBlur = 8;
  ctx.fillText('FINISH!', 0, -33);
  ctx.shadowBlur = 0;
  ctx.restore();

  // Golden star at top
  ctx.save();
  ctx.translate(0, -72);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI / 5) - Math.PI / 2;
    const r = i % 2 === 0 ? 18 : 8;
    i === 0 ? ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
             : ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  const gStar = ctx.createRadialGradient(0, -4, 2, 0, 0, 18);
  gStar.addColorStop(0, '#ffe77a');
  gStar.addColorStop(1, '#f4900c');
  ctx.fillStyle = gStar;
  ctx.shadowColor = '#ff8c00';
  ctx.shadowBlur = 14;
  ctx.fill();
  // Tiny face
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#8b4513';
  ctx.font = 'bold 7px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', 0, 1);
  ctx.restore();

  // Seaweed clusters at base
  _archSeaweed(ctx, -95, 60, -1);
  _archSeaweed(ctx, 95, 60, 1);
}

function _archPillar(ctx, x, yBottom) {
  const top = yBottom - 90, h = 90, w = 22;
  ctx.save();
  ctx.translate(x, 0);
  // Pillar body
  _rrect(ctx, -w / 2, top, w, h, 6);
  const gPillar = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  gPillar.addColorStop(0, '#b39ddb');
  gPillar.addColorStop(0.4, '#9b72cf');
  gPillar.addColorStop(1, '#7b5ea7');
  ctx.fillStyle = gPillar;
  ctx.fill();
  // Shell decoration
  _archShell(ctx, 0, top + h * 0.55, 10);
  // Rope bands
  [top + h * 0.2, top + h * 0.8].forEach(ry => {
    ctx.beginPath();
    _rrect(ctx, -w / 2 - 3, ry - 5, w + 6, 10, 4);
    ctx.fillStyle = '#c4a882';
    ctx.fill();
  });
  ctx.restore();
}

function _archKnot(ctx, x, y, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#c4a882';
  ctx.fill();
  ctx.strokeStyle = '#a0845c';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function _archShell(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  // Simple clam shell
  ctx.beginPath();
  ctx.arc(0, 0, r, Math.PI, 0);
  ctx.closePath();
  const gS = ctx.createRadialGradient(0, -r * 0.3, 1, 0, 0, r);
  gS.addColorStop(0, '#ffb3c6');
  gS.addColorStop(1, '#c9184a');
  ctx.fillStyle = gS;
  ctx.fill();
  // Ridges
  for (let i = 0; i < 5; i++) {
    const a = Math.PI + (i / 4) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function _archSeaweed(ctx, x, y, dir) {
  ctx.save();
  ctx.translate(x, y);
  const cols = ['#52b788','#74c69d','#95d5b2','#ff9f43','#c77dff','#5e60ce'];
  for (let i = 0; i < 5; i++) {
    const ox = (i - 2) * 10 * dir;
    const h = 25 + Math.random() * 20;
    ctx.beginPath();
    ctx.moveTo(ox, 0);
    ctx.quadraticCurveTo(ox + dir * 8, -h * 0.5, ox + dir * 4, -h);
    ctx.strokeStyle = cols[i % cols.length];
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
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
