const Player = {
  x: 0,
  y: 0,
  vy: 0,
  radius: 28,
  state: 'idle',   // idle | swim | boost | hit | win
  hitTimer: 0,
  shielded: false,
  invincible: false,
  invincibleTimer: 0,
  flickerOn: true,

  init(canvasW, canvasH) {
    this.x = canvasW * 0.18;
    this.y = canvasH * 0.5;
    this.vy = 0;
    this.state = 'swim';
    this.hitTimer = 0;
    this.shielded = false;
    this.invincible = false;
    this.invincibleTimer = 0;
  },

  update(dt) {
    if (this.hitTimer > 0) {
      this.hitTimer -= dt;
      this.state = 'hit';
    } else if (this.vy < -2) {
      this.state = 'boost';
    } else {
      this.state = 'swim';
    }

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
      this.flickerOn = Math.floor(this.invincibleTimer / 80) % 2 === 0;
      if (this.invincibleTimer <= 0) {
        this.invincible = false;
        this.flickerOn = true;
      }
    }
  },

  triggerHit() {
    this.hitTimer = 600;
    this.state = 'hit';
    this.invincible = true;
    this.invincibleTimer = 1500;
  },

  draw(ctx, images) {
    if (!this.flickerOn) return;
    ctx.save();
    const r = this.radius;

    // tilt based on velocity
    const tilt = Math.max(-0.35, Math.min(0.35, this.vy * 0.05));
    ctx.translate(this.x, this.y);
    ctx.rotate(tilt);

    const img = images[this.state] || images['swim'];
    if (img && img.complete) {
      ctx.drawImage(img, -r * 1.4, -r * 1.4, r * 2.8, r * 2.8);
    } else {
      // Fallback canvas turtle
      drawTurtleFallback(ctx, r, this.state);
    }

    // bubble trail when boosting
    if (this.state === 'boost') {
      drawBubbleTrail(ctx, r);
    }

    // Shield ring
    if (this.shielded) {
      ctx.beginPath();
      ctx.arc(0, 0, r + 10, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,200,255,0.7)';
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    ctx.restore();
  }
};

function drawTurtleFallback(ctx, r, state) {
  // Shell
  ctx.fillStyle = state === 'hit' ? '#ff6666' : '#2d8a4e';
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shell pattern
  ctx.fillStyle = '#1a6635';
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.55, r * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#5cb85c';
  ctx.beginPath();
  ctx.arc(r * 0.8, -r * 0.1, r * 0.38, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(r * 0.95, -r * 0.2, r * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(r * 0.97, -r * 0.2, r * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // Flippers
  ctx.fillStyle = '#4a9e4a';
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, -r * 0.75, r * 0.22, r * 0.45, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-r * 0.2, r * 0.72, r * 0.22, r * 0.45, 0.3, 0, Math.PI * 2);
  ctx.fill();
}

function drawBubbleTrail(ctx, r) {
  for (let i = 0; i < 3; i++) {
    const bx = -r - i * 14 - Math.random() * 6;
    const by = (Math.random() - 0.5) * r;
    const br = 3 + Math.random() * 5;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(180,230,255,${0.6 - i * 0.15})`;
    ctx.fill();
  }
}
