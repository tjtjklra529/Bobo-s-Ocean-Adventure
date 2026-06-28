const Player = {
  x: 0, y: 0, vy: 0,
  radius: 28,
  state: 'swim',
  hitTimer: 0,
  shielded: false,
  invincible: false,
  invincibleTimer: 0,
  flickerOn: true,

  // Animation
  animT: 0,
  blinkTimer: 0,
  blinkInterval: 3200,
  eyeOpen: true,
  breathScale: 1,
  flipperAngle: 0,

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
  },

  update(dt) {
    this.animT += dt;
    this.blinkTimer += dt;
    if (this.blinkTimer > this.blinkInterval) {
      this.eyeOpen = !this.eyeOpen;
      this.blinkTimer = 0;
      this.blinkInterval = this.eyeOpen ? 2800 + Math.random() * 2000 : 90;
    }

    // Breathing scale
    this.breathScale = 1 + Math.sin(this.animT * 0.0015) * 0.025;

    // Flipper angle based on velocity
    this.flipperAngle = this.vy * 0.09;

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

    const tilt = Math.max(-0.38, Math.min(0.38, this.vy * 0.052));
    ctx.rotate(tilt);
    ctx.scale(this.breathScale, this.breathScale);

    // Try image, fall back to canvas drawing
    const img = images && images[this.state];
    if (img && img.complete && img.naturalWidth > 1) {
      const r = this.radius;
      ctx.drawImage(img, -r * 1.5, -r * 1.5, r * 3, r * 3);
    } else {
      this._drawCanvas(ctx);
    }

    // Bubble trail (always some bubbles)
    this._drawBubbles(ctx);

    // Shield ring
    if (this.shielded) {
      const t = this.animT;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
      const sg = ctx.createLinearGradient(-this.radius - 12, 0, this.radius + 12, 0);
      sg.addColorStop(0, 'rgba(100,200,255,0.9)');
      sg.addColorStop(0.5, 'rgba(180,240,255,0.4)');
      sg.addColorStop(1, 'rgba(100,200,255,0.9)');
      ctx.strokeStyle = sg;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#74b9ff';
      ctx.shadowBlur = 14;
      ctx.stroke();
      // Rotating dots
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + t * 0.003;
        const dx = Math.cos(a) * (this.radius + 12);
        const dy = Math.sin(a) * (this.radius + 12);
        ctx.beginPath();
        ctx.arc(dx, dy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#74b9ff';
        ctx.shadowBlur = 6;
        ctx.fill();
      }
    }

    ctx.restore();
  },

  _drawCanvas(ctx) {
    const r = this.radius;
    const t = this.animT;
    const isHit = this.state === 'hit';
    const isBoost = this.state === 'boost';

    // Shadow
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.scale(1, 0.4);
    ctx.beginPath();
    ctx.ellipse(r * 0.3, r * 2.4, r * 0.9, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#001a40';
    ctx.fill();
    ctx.restore();

    // Back flippers
    ctx.save();
    ctx.rotate(-0.2 + this.flipperAngle * 0.5);
    _drawFlipper(ctx, -r * 0.55, r * 0.5, r * 0.55, r * 0.22, '#3d9142');
    ctx.restore();

    // Shell
    const shellCol = isHit ? '#c0392b' : '#2e7d32';
    const shellHi  = isHit ? '#e74c3c' : '#43a047';
    const grad = ctx.createRadialGradient(-r * 0.15, -r * 0.2, r * 0.1, 0, 0, r);
    grad.addColorStop(0, isHit ? '#e74c3c' : '#66bb6a');
    grad.addColorStop(0.6, shellCol);
    grad.addColorStop(1, isHit ? '#922b21' : '#1b5e20');
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.88, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Shell dome highlight
    ctx.beginPath();
    ctx.ellipse(-r * 0.18, -r * 0.22, r * 0.45, r * 0.28, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fill();

    // Shell pattern lines
    ctx.strokeStyle = isHit ? 'rgba(180,40,40,0.6)' : 'rgba(30,100,40,0.5)';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(ang) * r * 0.9, Math.sin(ang) * r * 0.82);
      ctx.stroke();
    }

    // Plastron (belly)
    const bellGrad = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.7);
    bellGrad.addColorStop(0, '#fff9c4');
    bellGrad.addColorStop(1, '#f9a825');
    ctx.beginPath();
    ctx.ellipse(r * 0.12, r * 0.18, r * 0.4, r * 0.52, 0.1, 0, Math.PI * 2);
    ctx.fillStyle = bellGrad;
    ctx.fill();

    // Head
    const headX = r * 0.76, headY = -r * 0.08;
    const headR = r * 0.42;
    const headGrad = ctx.createRadialGradient(headX - headR*0.2, headY - headR*0.2, headR*0.1, headX, headY, headR);
    headGrad.addColorStop(0, isHit ? '#e57373' : '#81c784');
    headGrad.addColorStop(1, isHit ? '#c62828' : '#388e3c');
    ctx.beginPath();
    ctx.arc(headX, headY, headR, 0, Math.PI * 2);
    ctx.fillStyle = headGrad;
    ctx.fill();

    // Cheeks (flush pink when boosting)
    ctx.save();
    ctx.globalAlpha = isBoost ? 0.85 : 0.5;
    ctx.beginPath();
    ctx.ellipse(headX + headR * 0.35, headY + headR * 0.35, headR * 0.22, headR * 0.14, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#f06292';
    ctx.fill();
    ctx.restore();

    // Eye white
    const eyeX = headX + headR * 0.28, eyeY = headY - headR * 0.2;
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, headR * 0.26, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Eye pupil / blink
    if (this.eyeOpen) {
      ctx.beginPath();
      ctx.arc(eyeX + 1, eyeY + 1, headR * 0.15, 0, Math.PI * 2);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      // Eye shine
      ctx.beginPath();
      ctx.arc(eyeX + headR * 0.08, eyeY - headR * 0.08, headR * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    } else {
      // Blink line
      ctx.beginPath();
      ctx.moveTo(eyeX - headR * 0.22, eyeY);
      ctx.lineTo(eyeX + headR * 0.22, eyeY);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Smile (bigger when boosting)
    const smileR = headR * (isBoost ? 0.25 : 0.18);
    const smileX = headX + headR * 0.1, smileY = headY + headR * 0.28;
    ctx.beginPath();
    ctx.arc(smileX, smileY, smileR, 0, Math.PI);
    ctx.strokeStyle = isHit ? '#c62828' : '#1b5e20';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Front flippers
    ctx.save();
    ctx.rotate(this.flipperAngle);
    _drawFlipper(ctx, r * 0.1, r * 0.55, r * 0.55, r * 0.24, '#43a047');
    ctx.restore();
    ctx.save();
    ctx.rotate(-this.flipperAngle * 0.6);
    _drawFlipper(ctx, r * 0.1, -r * 0.62, r * 0.55, r * 0.24, '#43a047');
    ctx.restore();
  },

  _drawBubbles(ctx) {
    const t = this.animT;
    const count = this.state === 'boost' ? 5 : 2;
    const r = this.radius;
    for (let i = 0; i < count; i++) {
      const phase = (t * 0.005 + i * 0.7) % 1;
      const bx = -r - phase * 35 - i * 8;
      const by = (Math.sin(t * 0.008 + i * 2.1)) * r * 0.5;
      const br = (2 + i * 1.2) * (1 - phase * 0.5);
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180,230,255,${0.7 - phase * 0.6})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }
};

function _drawFlipper(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.ellipse(0, 0, w, h, y < 0 ? -0.4 : 0.4, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, color);
  g.addColorStop(1, '#2e7d32');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}
