const StartScene = {
  boboY: 0, boboDir: 1,
  titleT: 0,
  settingsOpen: false,
  muteHover: false,

  // Per-button independent float phases
  _btn: [
    { phase: 0,    driftPhase: 1.2, rotPhase: 0.7  }, // Start
    { phase: 2.1,  driftPhase: 0.3, rotPhase: 2.4  }, // Settings
    { phase: 4.4,  driftPhase: 2.8, rotPhase: 1.1  }, // Exit
  ],

  init(game) {
    this.boboY = game.H * 0.52;
    this.titleT = 0;
    this.settingsOpen = false;
    Player.x = game.W * 0.18;
    Player.y = this.boboY;
    Player.state = 'swim';
    Player.flickerOn = true;
    Player.shielded = false;
    Player.invincible = false;
    Audio.stopMusic();
  },

  update(game, dt) {
    const ctx = game.ctx;
    const W = game.W, H = game.H;
    this.titleT += dt;
    const T = this.titleT;

    // Bobo swims slowly across screen
    Player.x += 0.55;
    if (Player.x > W * 0.95) Player.x = -60;
    this.boboY += this.boboDir * 0.32;
    if (this.boboY > H * 0.56 || this.boboY < H * 0.48) this.boboDir *= -1;
    Player.y = this.boboY;
    Player.vy = Math.sin(T * 0.0008) * 1.5;
    Player.state = 'swim';
    Player.update(dt);

    // Global ambient bubbles
    if (Math.random() < 0.05) {
      Particles.bubble(Math.random() * W, H * 0.98);
    }

    // Spawn bubbles near each button
    const btnCenters = _getBtnCenters(W, H);
    for (let i = 0; i < 3; i++) {
      if (Math.random() < 0.025) {
        const bc = btnCenters[i];
        const b = this._btn[i];
        const bx = bc.x + Math.cos(T * 0.001 + b.driftPhase) * 4;
        const by = bc.y + Math.sin(T * 0.0015 + b.phase) * 9;
        Particles.bubble(bx + (Math.random() - 0.5) * 70, by + 35 + Math.random() * 20);
      }
    }

    // Draw title
    _drawTitle(ctx, W, H, T);

    // Draw Bobo
    Player.draw(ctx, game.images);

    // Draw 3 floating buttons
    _drawStartBtn(ctx, W, H, T, this._btn[0]);
    _drawSettingsBtn(ctx, W, H, T, this._btn[1]);
    _drawExitBtn(ctx, W, H, T, this._btn[2]);

    // Controls hint
    ctx.save();
    ctx.font = '13px Arial Rounded MT Bold, Arial';
    ctx.fillStyle = 'rgba(160,220,255,0.55)';
    ctx.textAlign = 'center';
    ctx.fillText('SPACE / TAP = Float Up  ·  Release = Sink Down  ·  M = Mute', W / 2, H * 0.96);
    ctx.restore();

    // Settings panel overlay
    if (this.settingsOpen) {
      _drawSettingsPanel(ctx, W, H, T);
    }
  },

  onClick(game, cx, cy) {
    const W = game.W, H = game.H;

    // Close settings panel
    if (this.settingsOpen) {
      // Close button: top-right of panel
      const px = W / 2, py = H * 0.5;
      if (Math.abs(cx - (px + 155)) < 24 && Math.abs(cy - (py - 110)) < 24) {
        this.settingsOpen = false;
        Audio.sfx('click');
      }
      // Mute toggle inside panel
      if (Math.abs(cx - px) < 80 && Math.abs(cy - (py - 10)) < 30) {
        Audio.toggleMute();
        Audio.sfx('click');
      }
      return;
    }

    const T = this.titleT;
    const btnCenters = _getBtnCenters(W, H);

    for (let i = 0; i < 3; i++) {
      const b = this._btn[i];
      const bc = btnCenters[i];
      const bx = bc.x + Math.cos(T * 0.001 + b.driftPhase) * 4;
      const by = bc.y + Math.sin(T * 0.0015 + b.phase) * 9;

      const hitW = i === 0 ? 120 : 80;
      const hitH = i === 0 ? 100 : 80;

      if (Math.abs(cx - bx) < hitW && Math.abs(cy - by) < hitH) {
        Audio.sfx('click');
        if (i === 0) { game.goScene('level', 0); }
        else if (i === 1) { this.settingsOpen = true; }
        else { game.goScene('start'); } // Exit: just go back to start (or could close tab)
        return;
      }
    }
  }
};

// ─── Button center positions ───────────────────────────────────────────────
function _getBtnCenters(W, H) {
  return [
    { x: W * 0.5,   y: H * 0.72 }, // Start (center, larger)
    { x: W * 0.32,  y: H * 0.83 }, // Settings (left)
    { x: W * 0.68,  y: H * 0.83 }, // Exit (right)
  ];
}

// ─── START button (pink clam fan shell) ────────────────────────────────────
function _drawStartBtn(ctx, W, H, T, b) {
  const bc = _getBtnCenters(W, H)[0];
  const bx = bc.x + Math.cos(T * 0.001 + b.driftPhase) * 4;
  const by = bc.y + Math.sin(T * 0.0015 + b.phase) * 9;
  const rot = Math.sin(T * 0.0009 + b.rotPhase) * 0.022;

  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(rot);

  // Shadow
  ctx.save();
  ctx.translate(4, 6);
  ctx.globalAlpha = 0.22;
  _drawClamShape(ctx, 0, 0, 100, 88);
  ctx.fillStyle = '#002244';
  ctx.fill();
  ctx.restore();

  // Outer shell (pink gradient)
  _drawClamShape(ctx, 0, 0, 100, 88);
  const gOuter = ctx.createRadialGradient(-10, -20, 5, 0, 0, 108);
  gOuter.addColorStop(0, '#ffb3c6');
  gOuter.addColorStop(0.45, '#ff6b9d');
  gOuter.addColorStop(0.8, '#c9184a');
  gOuter.addColorStop(1, '#a4133c');
  ctx.fillStyle = gOuter;
  ctx.fill();

  // Shell rim highlight
  _drawClamShape(ctx, 0, 0, 100, 88);
  ctx.strokeStyle = 'rgba(255,200,220,0.85)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Scalloped top bumps along the arc
  _drawScallopBumps(ctx, 0, -44, 90, 8, '#ffccd5', '#ff6b9d');

  // Cream fan interior
  ctx.save();
  ctx.beginPath();
  _drawClamPath(ctx, 0, 4, 82, 72);
  ctx.clip();
  const gInner = ctx.createLinearGradient(0, -50, 0, 60);
  gInner.addColorStop(0, '#fff8f0');
  gInner.addColorStop(0.5, '#ffd6a5');
  gInner.addColorStop(1, '#ffb347');
  ctx.fillStyle = gInner;
  ctx.fill();

  // Radiating ridges
  ctx.save();
  ctx.globalAlpha = 0.28;
  for (let r = 0; r < 10; r++) {
    const a = -Math.PI + (r / 9) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(0, 52);
    ctx.lineTo(Math.cos(a) * 88, Math.sin(a) * 88 + 52);
    ctx.strokeStyle = '#c77800';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
  ctx.restore();

  // START text
  ctx.font = 'bold 26px Arial Rounded MT Bold, Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 4;
  ctx.strokeText('START', 0, 8);
  ctx.fillStyle = '#fff8e7';
  ctx.fillText('START', 0, 8);

  // Starfish at bottom centre
  _drawStarfish(ctx, 0, 52, 13, '#ff9966');

  ctx.restore();
}

// ─── SETTINGS button (round scalloped gear) ────────────────────────────────
function _drawSettingsBtn(ctx, W, H, T, b) {
  const bc = _getBtnCenters(W, H)[1];
  const bx = bc.x + Math.cos(T * 0.001 + b.driftPhase) * 4;
  const by = bc.y + Math.sin(T * 0.0015 + b.phase) * 9;
  const rot = Math.sin(T * 0.0009 + b.rotPhase) * 0.022;

  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(rot);

  // Shadow
  ctx.save();
  ctx.translate(3, 5);
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fillStyle = '#001133';
  ctx.fill();
  ctx.restore();

  // Scalloped border
  _drawScallopCircle(ctx, 0, 0, 42, 12, '#ff6b9d', '#c9184a');

  // Main circle – ocean gradient
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  const gBg = ctx.createRadialGradient(-8, -12, 2, 0, 0, 36);
  gBg.addColorStop(0, '#90e0ef');
  gBg.addColorStop(0.6, '#0096c7');
  gBg.addColorStop(1, '#023e8a');
  ctx.fillStyle = gBg;
  ctx.fill();

  // Gear icon (white rounded)
  _drawGearIcon(ctx, 0, -5, 15, 6, T);

  // Blue pearl center
  ctx.beginPath();
  ctx.arc(0, -5, 5, 0, Math.PI * 2);
  const gPearl = ctx.createRadialGradient(-2, -8, 1, 0, -5, 5);
  gPearl.addColorStop(0, '#caf0f8');
  gPearl.addColorStop(1, '#0077b6');
  ctx.fillStyle = gPearl;
  ctx.fill();

  // "Settings" pill banner
  _drawPillBanner(ctx, 0, 26, 62, 16, '#0096c7', '#023e8a', 'Settings', '#caf0f8', 11);

  ctx.restore();
}

// ─── EXIT GAME button (round pearl/white) ─────────────────────────────────
function _drawExitBtn(ctx, W, H, T, b) {
  const bc = _getBtnCenters(W, H)[2];
  const bx = bc.x + Math.cos(T * 0.001 + b.driftPhase) * 4;
  const by = bc.y + Math.sin(T * 0.0015 + b.phase) * 9;
  const rot = Math.sin(T * 0.0009 + b.rotPhase) * 0.022;

  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(rot);

  // Shadow
  ctx.save();
  ctx.translate(3, 5);
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.fillStyle = '#001133';
  ctx.fill();
  ctx.restore();

  // Scalloped pearl border
  _drawScallopCircle(ctx, 0, 0, 42, 12, '#e8f4fd', '#a0c4de');

  // Main circle – aqua teal gradient
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  const gBg = ctx.createRadialGradient(-8, -12, 2, 0, 0, 36);
  gBg.addColorStop(0, '#a8edea');
  gBg.addColorStop(0.55, '#43b89c');
  gBg.addColorStop(1, '#0b6e4f');
  ctx.fillStyle = gBg;
  ctx.fill();

  // Exit door icon
  _drawExitIcon(ctx, 0, -5);

  // "Exit Game" pill banner
  _drawPillBanner(ctx, 0, 26, 66, 16, '#7b2d8b', '#4a0e57', 'Exit Game', '#e8d5f5', 10);

  ctx.restore();
}

// ─── Settings Panel Overlay ────────────────────────────────────────────────
function _drawSettingsPanel(ctx, W, H, T) {
  // Dim
  ctx.save();
  ctx.fillStyle = 'rgba(0,10,30,0.68)';
  ctx.fillRect(0, 0, W, H);

  const px = W / 2, py = H * 0.5;
  const pw = 320, ph = 220;

  // Panel bubble
  ctx.beginPath();
  ctx.roundRect(px - pw / 2, py - ph / 2, pw, ph, 28);
  const gPan = ctx.createLinearGradient(px, py - ph / 2, px, py + ph / 2);
  gPan.addColorStop(0, '#023e8a');
  gPan.addColorStop(1, '#03045e');
  ctx.fillStyle = gPan;
  ctx.fill();
  ctx.strokeStyle = '#48cae4';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Title
  ctx.font = 'bold 22px Arial Rounded MT Bold, Arial';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#caf0f8';
  ctx.shadowColor = '#0096c7';
  ctx.shadowBlur = 10;
  ctx.fillText('Settings', px, py - 72);
  ctx.shadowBlur = 0;

  // Mute toggle
  const muted = Audio.muted;
  ctx.font = 'bold 16px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = '#90e0ef';
  ctx.textAlign = 'center';
  ctx.fillText('Sound', px, py - 28);

  ctx.beginPath();
  ctx.roundRect(px - 70, py - 18, 140, 28, 14);
  ctx.fillStyle = muted ? 'rgba(60,80,100,0.8)' : 'rgba(0,150,200,0.7)';
  ctx.fill();
  ctx.strokeStyle = muted ? '#4a6080' : '#48cae4';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 14px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText(muted ? '🔇 Muted' : '🔊 Sound On', px, py - 1);

  // Controls reminder
  ctx.font = '13px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = 'rgba(160,220,255,0.7)';
  ctx.fillText('SPACE / TAP = Float  ·  M = Mute', px, py + 40);

  // Version
  ctx.font = '11px Arial';
  ctx.fillStyle = 'rgba(100,160,200,0.5)';
  ctx.fillText("Bobo's Ocean Jump  v1.0", px, py + 72);

  // Close X
  ctx.beginPath();
  ctx.arc(px + 155, py - 110, 16, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(200,60,80,0.75)';
  ctx.fill();
  ctx.font = 'bold 16px Arial';
  ctx.fillStyle = '#fff';
  ctx.fillText('✕', px + 155, py - 106);

  ctx.restore();
}

// ─── Title ─────────────────────────────────────────────────────────────────
function _drawTitle(ctx, W, H, T) {
  ctx.save();
  ctx.textAlign = 'center';
  const bounce = Math.sin(T * 0.0012) * 5;

  // Drop shadow
  ctx.font = 'bold 62px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = 'rgba(0,10,40,0.45)';
  ctx.fillText("BOBO'S OCEAN JUMP", W / 2 + 3, H * 0.2 + 3 + bounce);

  // Main gradient text
  const g = ctx.createLinearGradient(W * 0.15, 0, W * 0.85, 0);
  g.addColorStop(0, '#90e0ef');
  g.addColorStop(0.3, '#ffffff');
  g.addColorStop(0.65, '#caf0f8');
  g.addColorStop(1, '#48cae4');
  ctx.fillStyle = g;
  ctx.shadowColor = '#0096c7';
  ctx.shadowBlur = 24;
  ctx.fillText("BOBO'S OCEAN JUMP", W / 2, H * 0.2 + bounce);

  // Subtitle
  ctx.font = 'bold 22px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = '#ffe066';
  ctx.shadowColor = '#b8860b';
  ctx.shadowBlur = 10;
  ctx.fillText('Area 1: Coral Garden', W / 2, H * 0.31 + bounce * 0.5);
  ctx.restore();
}

// ─── Drawing helpers ───────────────────────────────────────────────────────

function _drawClamPath(ctx, x, y, w, h) {
  // Fan/clam shape: flat bottom, arched top
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + h / 2);
  ctx.quadraticCurveTo(x - w / 2, y + h / 2 + 10, x, y + h / 2 + 14);
  ctx.quadraticCurveTo(x + w / 2, y + h / 2 + 10, x + w / 2, y + h / 2);
  ctx.bezierCurveTo(x + w / 2 + 12, y, x + w * 0.55, y - h / 2, x, y - h / 2 - 14);
  ctx.bezierCurveTo(x - w * 0.55, y - h / 2, x - w / 2 - 12, y, x - w / 2, y + h / 2);
}

function _drawClamShape(ctx, x, y, w, h) {
  _drawClamPath(ctx, x, y, w, h);
  ctx.closePath();
}

function _drawScallopBumps(ctx, cx, cy, radius, count, fill, stroke) {
  const step = Math.PI / (count - 1);
  for (let i = 0; i < count; i++) {
    const a = -Math.PI + i * step;
    const bx = cx + Math.cos(a) * radius;
    const by = cy + Math.sin(a) * (radius * 0.38);
    ctx.beginPath();
    ctx.arc(bx, by, 8, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function _drawScallopCircle(ctx, cx, cy, radius, bumps, fill1, fill2) {
  // Bumpy circle border
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    const bx = cx + Math.cos(a) * radius;
    const by = cy + Math.sin(a) * radius;
    ctx.beginPath();
    ctx.arc(bx, by, 7, 0, Math.PI * 2);
    const gB = ctx.createRadialGradient(bx - 2, by - 2, 1, bx, by, 7);
    gB.addColorStop(0, fill1);
    gB.addColorStop(1, fill2);
    ctx.fillStyle = gB;
    ctx.fill();
  }
}

function _drawGearIcon(ctx, cx, cy, outerR, innerR, T) {
  const teeth = 8;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(T * 0.0004); // slow spin
  ctx.beginPath();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? outerR : outerR - 4;
    const fn = i === 0 ? 'moveTo' : 'lineTo';
    ctx[fn](Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  // Hollow center
  ctx.beginPath();
  ctx.arc(0, 0, innerR, 0, Math.PI * 2);
  ctx.fillStyle = 'transparent';
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

function _drawExitIcon(ctx, cx, cy) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Door rectangle
  ctx.beginPath();
  ctx.roundRect(-11, -12, 14, 20, 2);
  ctx.stroke();

  // Arrow pointing right (exit arrow)
  ctx.beginPath();
  ctx.moveTo(2, -2);
  ctx.lineTo(12, -2);
  ctx.moveTo(9, -6);
  ctx.lineTo(13, -2);
  ctx.lineTo(9, 2);
  ctx.stroke();
  ctx.restore();
}

function _drawPillBanner(ctx, cx, cy, w, h, col1, col2, text, textCol, fontSize) {
  ctx.beginPath();
  ctx.roundRect(cx - w / 2, cy - h / 2, w, h, h / 2);
  const gP = ctx.createLinearGradient(cx - w / 2, cy, cx + w / 2, cy);
  gP.addColorStop(0, col1);
  gP.addColorStop(1, col2);
  ctx.fillStyle = gP;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.font = `bold ${fontSize}px Arial Rounded MT Bold, Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = textCol;
  ctx.fillText(text, cx, cy + 1);
}

function _drawStarfish(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI / 5) - Math.PI / 2;
    const rd = i % 2 === 0 ? r : r * 0.42;
    const fn = i === 0 ? 'moveTo' : 'lineTo';
    ctx[fn](Math.cos(a) * rd, Math.sin(a) * rd);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#cc5500';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
