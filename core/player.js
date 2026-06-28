/* ─── Player (Bobo the Sea Turtle) ───
   Canvas-drawn to match the provided character art:
   - Large round lime-green head (bigger than body), dark-green spots
   - Teal domed shell with hex/ridge pattern
   - Cream/yellow segmented belly plastron
   - Big brown eyes, white sclera, shine dot
   - Round pink cheeks
   - Two nostrils
   - Swimming side-view pose, flippers extended
*/
const Player = {
  x: 0, y: 0, vy: 0,
  radius: 32,
  state: 'swim',
  hitTimer: 0,
  shielded: false,
  invincible: false,
  invincibleTimer: 0,
  flickerOn: true,

  animT: 0,
  blinkTimer: 0,
  blinkInterval: 3400,
  eyeOpen: true,
  breathScale: 1,
  flipperPhase: 0,

  init(W, H) {
    this.x = W * 0.18;
    this.y = H * 0.5;
    this.vy = 0;
    this.state = 'swim';
    this.hitTimer = 0;
    this.shielded = false;
    this.invincible = false;
    this.invincibleTimer = 0;
    this.animT = 0;
    this.blinkTimer = 0;
    this.eyeOpen = true;
    this.flickerOn = true;
    this.breathScale = 1;
    this.flipperPhase = 0;
  },

  update(dt) {
    this.animT += dt;
    this.flipperPhase += dt * 0.004;

    this.blinkTimer += dt;
    if (this.blinkTimer > this.blinkInterval) {
      this.eyeOpen = !this.eyeOpen;
      this.blinkTimer = 0;
      this.blinkInterval = this.eyeOpen ? 2600 + Math.random() * 2200 : 85;
    }

    this.breathScale = 1 + Math.sin(this.animT * 0.0014) * 0.022;

    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
      this.state = 'hit';
    } else if (this.vy < -2.5) {
      this.state = 'boost';
    } else {
      this.state = 'swim';
    }

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      this.flickerOn = Math.floor(this.invincibleTimer / 70) % 2 === 0;
      if (this.invincibleTimer <= 0) { this.invincible = false; this.flickerOn = true; }
    }
  },

  triggerHit() {
    this.hitTimer = 550;
    this.state = 'hit';
    this.invincible = true;
    this.invincibleTimer = 1600;
  },

  draw(ctx, images) {
    if (!this.flickerOn) return;
    ctx.save();
    ctx.translate(this.x, this.y);

    // Tilt with velocity
    const tilt = Math.max(-0.36, Math.min(0.36, this.vy * 0.05));
    ctx.rotate(tilt);
    ctx.scale(this.breathScale, this.breathScale);

    // Try PNG asset first, fall back to canvas art
    const img = images && images[this.state];
    if (img && img.complete && img.naturalWidth > 1) {
      const r = this.radius;
      ctx.drawImage(img, -r * 1.7, -r * 1.7, r * 3.4, r * 3.4);
    } else {
      this._draw(ctx);
    }

    this._drawBubbles(ctx);

    // Shield aura
    if (this.shielded) {
      const t = this.animT;
      const R = this.radius + 14;
      ctx.beginPath();
      ctx.arc(0, 0, R, 0, Math.PI * 2);
      const sg = ctx.createLinearGradient(-R, 0, R, 0);
      sg.addColorStop(0, 'rgba(100,200,255,0.9)');
      sg.addColorStop(0.5, 'rgba(180,240,255,0.35)');
      sg.addColorStop(1, 'rgba(100,200,255,0.9)');
      ctx.strokeStyle = sg;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#74b9ff';
      ctx.shadowBlur = 16;
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 0.003;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * R, Math.sin(a) * R, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#74b9ff';
        ctx.shadowBlur = 7;
        ctx.fill();
      }
    }

    ctx.restore();
  },

  // ─── Full canvas character matching the provided art ───
  _draw(ctx) {
    const r = this.radius;   // ~32px — use as unit
    const T = this.animT;
    const isHit   = this.state === 'hit';
    const isBoost = this.state === 'boost';
    const isWin   = this.state === 'win';
    const fp = this.flipperPhase;

    // ── 1. Back (rear) flippers ──
    const backFlipAng = isBoost ? Math.sin(fp * 1.4) * 0.38 : Math.sin(fp) * 0.22;
    _flipper(ctx, -r * 0.45,  r * 0.42, r * 0.78, r * 0.28,  0.45 + backFlipAng, '#5aad5e', '#2d7a34');
    _flipper(ctx, -r * 0.45, -r * 0.42, r * 0.78, r * 0.28, -0.45 - backFlipAng, '#5aad5e', '#2d7a34');

    // ── 2. Teal shell ──
    const shellTL = isHit ? '#8b2020' : '#1a7a6e';
    const shellTM = isHit ? '#b02828' : '#1d9688';
    const shellTH = isHit ? '#cc3030' : '#20b0a0';

    ctx.save();
    // Shell dome
    const sg = ctx.createRadialGradient(-r * 0.12, -r * 0.25, r * 0.08, 0, 0, r * 1.02);
    sg.addColorStop(0,   shellTH);
    sg.addColorStop(0.45, shellTM);
    sg.addColorStop(1,   shellTL);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.95, r * 0.82, 0, 0, Math.PI * 2);
    ctx.fillStyle = sg;
    ctx.fill();

    // Shell highlight (dome gloss)
    ctx.beginPath();
    ctx.ellipse(-r * 0.22, -r * 0.28, r * 0.38, r * 0.2, -0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.14)';
    ctx.fill();

    // Hex/ridge scute pattern  (matching art: dark teal lines)
    ctx.strokeStyle = isHit ? 'rgba(80,0,0,0.55)' : 'rgba(10,70,65,0.7)';
    ctx.lineWidth = 1.4;
    // Central pentagon
    _hexPattern(ctx, 0, 0, r * 0.38, 6);
    // Radial spokes
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.38, Math.sin(a) * r * 0.38);
      ctx.lineTo(Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.76);
      ctx.stroke();
    }
    ctx.restore();

    // ── 3. Cream belly / plastron ──
    ctx.save();
    const bg = ctx.createLinearGradient(0, -r * 0.55, 0, r * 0.65);
    bg.addColorStop(0, '#fffde7');
    bg.addColorStop(0.5, '#fff9c4');
    bg.addColorStop(1, '#f9e07a');
    ctx.beginPath();
    ctx.ellipse(r * 0.08, r * 0.1, r * 0.52, r * 0.65, 0.08, 0, Math.PI * 2);
    ctx.fillStyle = bg;
    ctx.fill();
    // Segment lines (matching art: 3 horizontal lines)
    ctx.strokeStyle = 'rgba(200,170,60,0.45)';
    ctx.lineWidth = 1.2;
    for (let i = 1; i <= 3; i++) {
      const sy = -r * 0.38 + i * r * 0.32;
      ctx.beginPath();
      ctx.moveTo(r * 0.08 - r * 0.42, sy);
      ctx.lineTo(r * 0.08 + r * 0.42, sy);
      ctx.stroke();
    }
    ctx.restore();

    // ── 4. Front flippers ──
    const frontFlipAng = isBoost ? Math.sin(fp * 1.4 + 0.5) * 0.42 : Math.sin(fp + 0.6) * 0.25;
    _flipper(ctx,  r * 0.15,  r * 0.52, r * 0.72, r * 0.26,  0.5 + frontFlipAng, '#6abf6e', '#3d9142');
    _flipper(ctx,  r * 0.15, -r * 0.52, r * 0.72, r * 0.26, -0.5 - frontFlipAng, '#6abf6e', '#3d9142');

    // ── 5. Head (large, round, lime green) ──
    // Head sits to the RIGHT in swim pose, matching art
    const hx = r * 0.82, hy = -r * 0.05;
    const hr = r * 0.62;   // head radius — notably large like the art

    // Head shadow/depth
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(hx + 3, hy + 3, hr, 0, Math.PI * 2);
    ctx.fillStyle = '#001a33';
    ctx.fill();
    ctx.restore();

    // Head fill
    const hg = ctx.createRadialGradient(hx - hr * 0.25, hy - hr * 0.28, hr * 0.05, hx, hy, hr);
    if (isHit) {
      hg.addColorStop(0, '#ff8a65');
      hg.addColorStop(0.5, '#e53935');
      hg.addColorStop(1, '#b71c1c');
    } else {
      hg.addColorStop(0, '#b5e867');  // bright lime highlight
      hg.addColorStop(0.35, '#8bc34a');
      hg.addColorStop(0.75, '#6aaa2e');
      hg.addColorStop(1, '#4a8720');
    }
    ctx.beginPath();
    ctx.arc(hx, hy, hr, 0, Math.PI * 2);
    ctx.fillStyle = hg;
    ctx.fill();

    // Head outline
    ctx.strokeStyle = isHit ? 'rgba(120,0,0,0.6)' : 'rgba(40,90,10,0.55)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Dark green spots on head (matching art: 3-4 irregular spots)
    if (!isHit) {
      const spots = [
        { dx: -hr*0.08, dy: -hr*0.45, r: hr*0.19 },
        { dx:  hr*0.3,  dy: -hr*0.52, r: hr*0.13 },
        { dx: -hr*0.35, dy: -hr*0.18, r: hr*0.11 },
        { dx:  hr*0.05, dy: -hr*0.22, r: hr*0.09 },
      ];
      ctx.fillStyle = 'rgba(60,110,10,0.45)';
      for (const s of spots) {
        ctx.beginPath();
        ctx.arc(hx + s.dx, hy + s.dy, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ── 6. Eye ──
    const ex = hx + hr * 0.32, ey = hy - hr * 0.18;
    const er = hr * 0.3;   // large eye matching art

    // Eye white (sclera)
    ctx.beginPath();
    ctx.arc(ex, ey, er, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,0,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (this.eyeOpen && !isHit) {
      // Brown iris
      ctx.beginPath();
      ctx.arc(ex + er * 0.12, ey + er * 0.08, er * 0.68, 0, Math.PI * 2);
      ctx.fillStyle = '#5d3a1a';
      ctx.fill();
      // Dark pupil
      ctx.beginPath();
      ctx.arc(ex + er * 0.14, ey + er * 0.1, er * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = '#1a0a00';
      ctx.fill();
      // Shine (large, top-left, matching art)
      ctx.beginPath();
      ctx.arc(ex - er * 0.06, ey - er * 0.14, er * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      // Secondary small shine
      ctx.beginPath();
      ctx.arc(ex + er * 0.26, ey - er * 0.08, er * 0.1, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.fill();
    } else if (isHit) {
      // X eyes when hit
      ctx.strokeStyle = '#1a0a00';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(ex - er*0.55, ey - er*0.55); ctx.lineTo(ex + er*0.55, ey + er*0.55);
      ctx.moveTo(ex + er*0.55, ey - er*0.55); ctx.lineTo(ex - er*0.55, ey + er*0.55);
      ctx.stroke();
    } else {
      // Blink — curved line
      ctx.beginPath();
      ctx.arc(ex, ey + er * 0.05, er * 0.7, Math.PI + 0.3, -0.3);
      ctx.strokeStyle = '#1a0a00';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // ── 7. Brow / eyebrow (matching art: small dark arch) ──
    if (!isHit) {
      ctx.beginPath();
      ctx.arc(ex, ey - er * 0.72, er * 0.58, Math.PI + 0.45, -0.45);
      ctx.strokeStyle = 'rgba(50,80,10,0.7)';
      ctx.lineWidth = isBoost ? 3 : 1.8;
      ctx.stroke();
    } else {
      // Angry brow when hit
      ctx.beginPath();
      ctx.moveTo(ex - er * 0.5, ey - er * 0.78);
      ctx.lineTo(ex + er * 0.5, ey - er * 0.58);
      ctx.strokeStyle = 'rgba(120,0,0,0.9)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // ── 8. Nostrils ──
    ctx.fillStyle = 'rgba(40,80,10,0.5)';
    ctx.beginPath();
    ctx.ellipse(hx + hr * 0.55, hy - hr * 0.08, hr * 0.055, hr * 0.04, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(hx + hr * 0.55, hy + hr * 0.06, hr * 0.055, hr * 0.04, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // ── 9. Mouth / smile ──
    if (!isHit) {
      // Happy open smile matching art
      const mx = hx + hr * 0.38, my = hy + hr * 0.36;
      const mr = hr * (isBoost || isWin ? 0.28 : 0.2);
      ctx.beginPath();
      ctx.arc(mx, my, mr, 0.1, Math.PI - 0.1);
      ctx.strokeStyle = 'rgba(40,80,10,0.75)';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Pink tongue hint (matching art)
      ctx.beginPath();
      ctx.ellipse(mx, my + mr * 0.55, mr * 0.5, mr * 0.3, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#f06292';
      ctx.fill();
    }

    // ── 10. Pink cheeks ──  (two round rosy spots, matching art)
    ctx.save();
    ctx.globalAlpha = isBoost ? 0.75 : 0.55;
    // Right cheek (lower, visible)
    ctx.beginPath();
    ctx.ellipse(hx + hr * 0.42, hy + hr * 0.3, hr * 0.22, hr * 0.16, 0.2, 0, Math.PI * 2);
    ctx.fillStyle = '#f48fb1';
    ctx.fill();
    ctx.restore();

    // ── Win pose extras ──
    if (isWin) {
      // Stars around head
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + T * 0.001;
        const dist = hr * 1.6;
        const sx = hx + Math.cos(a) * dist;
        const sy = hy + Math.sin(a) * dist;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(T * 0.003 + i);
        _starShape(ctx, 0, 0, 4, 9, '#ffe066');
        ctx.restore();
      }
    }
  },

  _drawBubbles(ctx) {
    const T = this.animT;
    const count = this.state === 'boost' ? 6 : 3;
    const r = this.radius;
    for (let i = 0; i < count; i++) {
      const phase = (T * 0.005 + i * 0.65) % 1;
      const bx = -r - phase * 40 - i * 7;
      const by = Math.sin(T * 0.007 + i * 2.0) * r * 0.55;
      const br = (2.5 + i * 1.1) * (1 - phase * 0.5);
      if (br < 0.5) continue;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180,235,255,${0.72 - phase * 0.65})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // Tiny shine
      ctx.beginPath();
      ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.4 - phase * 0.35})`;
      ctx.fill();
    }
  }
};

// ─── Helpers ───

function _flipper(ctx, x, y, w, h, angle, c1, c2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const g = ctx.createLinearGradient(-w * 0.5, 0, w * 0.5, 0);
  g.addColorStop(0, c1);
  g.addColorStop(1, c2);
  ctx.beginPath();
  // Paddle-shaped flipper matching art (rounded end, tapers at base)
  ctx.moveTo(-w * 0.12, -h * 0.5);
  ctx.bezierCurveTo( w * 0.35, -h * 0.55, w * 0.95, -h * 0.3, w * 0.98, 0);
  ctx.bezierCurveTo( w * 0.95,  h * 0.3,  w * 0.35,  h * 0.55, -w * 0.12,  h * 0.5);
  ctx.bezierCurveTo(-w * 0.5,  h * 0.35, -w * 0.5, -h * 0.35, -w * 0.12, -h * 0.5);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  // Spots on flipper (matching art)
  ctx.fillStyle = 'rgba(40,100,20,0.3)';
  ctx.beginPath(); ctx.arc(w * 0.3, 0, h * 0.22, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(w * 0.62, -h * 0.18, h * 0.14, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function _hexPattern(ctx, cx, cy, r, sides) {
  ctx.beginPath();
  for (let i = 0; i <= sides; i++) {
    const a = (i / sides) * Math.PI * 2 - Math.PI / 6;
    const fn = i === 0 ? 'moveTo' : 'lineTo';
    ctx[fn](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.stroke();
}

function _starShape(ctx, cx, cy, ir, or, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI / 5) - Math.PI / 2;
    const rr = i % 2 === 0 ? or : ir;
    i === 0 ? ctx.moveTo(cx + Math.cos(a)*rr, cy + Math.sin(a)*rr)
             : ctx.lineTo(cx + Math.cos(a)*rr, cy + Math.sin(a)*rr);
  }
  ctx.closePath();
  ctx.fill();
}
