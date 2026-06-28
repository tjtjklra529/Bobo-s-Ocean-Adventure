const LevelScene = {
  levelData: null,
  obstacles: [],
  collectibles: [],
  hearts: 3,
  maxHearts: 3,
  score: 0,
  shellsThisLevel: 0,
  scrollX: 0,
  levelLen: 0,
  speed: 130,
  state: 'playing',   // playing | fail | complete | tutorial
  tutorialStep: 0,
  tutorialTimer: 0,
  driftY: 0,
  driftDir: 1,
  particles: [],
  finishX: 0,
  shieldTimer: 0,
  shellsRequired: 0,
  levelTimer: 0,

  init(game, data) {
    this.levelData = data;
    this.hearts = 3;
    this.maxHearts = 3;
    this.score = 0;
    this.shellsThisLevel = 0;
    this.scrollX = 0;
    this.levelLen = data.length;
    this.speed = data.speed;
    this.state = data.tutorial ? 'tutorial' : 'playing';
    this.tutorialStep = 0;
    this.tutorialTimer = 0;
    this.particles = [];
    this.driftY = 0;
    this.driftDir = 1;
    this.shieldTimer = 0;
    this.shellsRequired = data.mustCollectShells || 0;
    this.levelTimer = 0;
    this.finishX = data.length - game.W * 0.15;

    Player.init(game.W, game.H);
    Player.shielded = false;
    Player.invincible = false;

    // Build obstacles & collectibles from data fractions
    const W = game.W, H = game.H;
    const len = data.length;

    this.obstacles = data.obstacles.map(o => ({
      x: o.xFrac * len,
      y: o.yFrac * H,
      w: o.w,
      h: o.h,
      type: o.type,
      wobble: Math.random() * Math.PI * 2
    }));

    this.collectibles = data.collectibles.map(c => ({
      x: c.xFrac * len,
      y: c.yFrac * H,
      r: c.type === 'shell' ? 18 : c.type === 'starfish' ? 16 : 20,
      type: c.type,
      collected: false,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.02
    }));
  },

  update(game, dt) {
    const ctx = game.ctx;
    const W = game.W, H = game.H;

    if (this.state === 'tutorial') {
      this.updateTutorial(game, dt);
      return;
    }
    if (this.state === 'fail') {
      this.drawGameplay(ctx, game, dt);
      UI.drawLevelFailScreen(ctx, W, H);
      this.drawBoboOnScreen(ctx, game, W * 0.65, H * 0.38);
      return;
    }
    if (this.state === 'complete') {
      this.drawGameplay(ctx, game, dt);
      UI.drawLevelCompleteScreen(ctx, W, H, this.levelData.id, game.score, game.shellsCollected);
      this.drawBoboWin(ctx, game, W * 0.65, H * 0.38);
      return;
    }

    // Playing
    this.levelTimer += dt;
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) Player.shielded = false;
    }

    // Drift current
    if (this.levelData.currentDrift) {
      this.driftY += this.driftDir * 0.18;
      if (Math.abs(this.driftY) > 28) this.driftDir *= -1;
      Player.y += this.driftY * 0.015;
    }

    // Physics
    Physics.update(Player, game.inputPressed);
    Player.update(dt);

    // Scroll
    this.scrollX += this.speed * (dt / 1000);

    // Keep Bobo in bounds
    const floorY = H - 90;
    const ceilY = 30;
    if (Player.y > floorY) { Player.y = floorY; Player.vy = -2; }
    if (Player.y < ceilY) { Player.y = ceilY; Player.vy = 2; }

    // Update collectible wobble
    for (const c of this.collectibles) {
      c.wobble += c.wobbleSpeed;
    }

    // Particles
    this.updateParticles(dt);

    // Collisions
    const visObs = this.obstacles.filter(o => !o.destroyed && this.isVisible(o, W));
    const visCol = this.collectibles.filter(c => !c.collected && this.isVisibleC(c, W));

    Collision.check(
      Player,
      visObs,
      visCol,
      (o, idx) => this.handleHit(game, o),
      (c, idx) => this.handleCollect(game, c)
    );

    // Level complete check
    if (this.scrollX >= this.finishX) {
      if (this.shellsRequired > 0 && this.shellsThisLevel < this.shellsRequired) {
        // Can't finish without shells — keep playing
      } else {
        this.completeLvel(game);
        return;
      }
    }

    // Draw
    this.drawGameplay(ctx, game, dt);
    this.drawHUD(ctx, game, W, H);
  },

  drawGameplay(ctx, game, dt) {
    const W = game.W, H = game.H;

    // Background coral details (parallax layer)
    this.drawParallaxBg(ctx, W, H);

    // Obstacles
    for (const o of this.obstacles) {
      if (o.destroyed) continue;
      if (!this.isVisible(o, W)) continue;
      const sx = o.x - this.scrollX;
      drawObstacle(ctx, sx, o.y, o.w, o.h, o.type, o.wobble);
    }

    // Collectibles
    for (const c of this.collectibles) {
      if (c.collected) continue;
      if (!this.isVisibleC(c, W)) continue;
      const sx = c.x - this.scrollX;
      drawCollectible(ctx, sx, c.y, c.r, c.type, c.wobble);
    }

    // Finish gate
    if (this.finishX - this.scrollX < W) {
      drawFinishGate(ctx, this.finishX - this.scrollX, H);
    }

    // Particles
    this.drawParticles(ctx);

    // Bobo
    Player.draw(ctx, game.images);
  },

  drawParallaxBg(ctx, W, H) {
    // Mid-depth corals that move slower
    ctx.save();
    ctx.globalAlpha = 0.25;
    const offset = (this.scrollX * 0.35) % W;
    for (let i = 0; i < 5; i++) {
      const bx = (i * 240 - offset + W * 2) % (W + 240) - 120;
      const col = ['#ff6b9d','#ff9f43','#26de81','#fdcb6e','#a29bfe'][i % 5];
      drawSmallCoral(ctx, bx, H - 80, 35, col);
    }
    ctx.restore();
  },

  isVisible(o, W) {
    const sx = o.x - this.scrollX;
    return sx < W + 80 && sx + o.w > -80;
  },

  isVisibleC(c, W) {
    const sx = c.x - this.scrollX;
    return sx < W + 40 && sx + c.r * 2 > -40;
  },

  handleHit(game, o) {
    if (Player.invincible) return;
    if (Player.shielded) {
      Player.shielded = false;
      this.shieldTimer = 0;
      this.spawnParticles(Player.x, Player.y, '#74b9ff', 12);
      return;
    }
    if (this.levelData.noPunishment) {
      Player.triggerHit();
      return;
    }
    this.hearts--;
    Player.triggerHit();
    this.spawnParticles(Player.x, Player.y, '#ff4d6d', 14);
    if (this.hearts <= 0) {
      this.state = 'fail';
    }
  },

  handleCollect(game, c) {
    c.collected = true;
    this.spawnParticles(c.x - this.scrollX, c.y, collectColor(c.type), 10);
    if (c.type === 'shell') {
      this.shellsThisLevel++;
      game.shellsCollected++;
    } else if (c.type === 'starfish') {
      this.score += 100;
      game.score += 100;
    } else if (c.type === 'shield') {
      Player.shielded = true;
      this.shieldTimer = 8000;
    }
  },

  completeLvel(game) {
    this.state = 'complete';
    game.score += this.shellsThisLevel * 200 + Math.floor(this.score);
    this.spawnParticles(Player.x, Player.y, '#ffe066', 22);
    Player.state = 'win';
  },

  spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        r: 3 + Math.random() * 5,
        life: 1.0,
        decay: 0.02 + Math.random() * 0.03,
        color
      });
    }
  },

  updateParticles(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  },

  drawParticles(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    }
  },

  drawHUD(ctx, game, W, H) {
    // Heart display
    UI.drawHearts(ctx, this.hearts, this.maxHearts, 24, 32);

    // Area title
    UI.drawAreaTitle(ctx, `Area 1 - Level ${this.levelData.id}: ${this.levelData.name}`, W, 28);

    // Score
    UI.drawScore(ctx, game.score, W - 160, 36);

    // Shells
    UI.drawShellCount(ctx, game.shellsCollected, W - 160, 66);

    // Shield indicator
    if (Player.shielded) {
      ctx.save();
      ctx.font = 'bold 16px Arial Rounded MT Bold, Arial';
      ctx.fillStyle = '#74b9ff';
      ctx.textAlign = 'left';
      ctx.fillText('🛡 Shield Active', 24, 72);
      ctx.restore();
    }

    // Shell requirement warning
    if (this.levelData.mustCollectShells) {
      const need = this.levelData.mustCollectShells - this.shellsThisLevel;
      if (need > 0) {
        ctx.save();
        ctx.font = '16px Arial Rounded MT Bold, Arial';
        ctx.fillStyle = '#fdcb6e';
        ctx.textAlign = 'center';
        ctx.fillText(`Collect ${need} more shell${need > 1 ? 's' : ''} to pass!`, W / 2, H - 18);
        ctx.restore();
      }
    }

    // Progress bar
    const progW = W * 0.5;
    const progX = W / 2 - progW / 2;
    const progY = H - 14;
    const prog = Math.min(1, this.scrollX / this.finishX);
    ctx.save();
    ctx.beginPath();
    roundRectPath(ctx, progX, progY - 6, progW, 10, 5);
    ctx.fillStyle = 'rgba(0,30,80,0.5)';
    ctx.fill();
    ctx.beginPath();
    roundRectPath(ctx, progX, progY - 6, progW * prog, 10, 5);
    const pg = ctx.createLinearGradient(progX, 0, progX + progW, 0);
    pg.addColorStop(0, '#0096c7');
    pg.addColorStop(1, '#90e0ef');
    ctx.fillStyle = pg;
    ctx.fill();
    // Bobo icon on bar
    ctx.beginPath();
    ctx.arc(progX + progW * prog, progY - 1, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#5cb85c';
    ctx.fill();
    ctx.restore();
  },

  updateTutorial(game, dt) {
    const ctx = game.ctx;
    const W = game.W, H = game.H;

    game.drawOceanBg(ctx);

    Physics.update(Player, game.inputPressed);
    Player.update(dt);
    const floorY = H - 90;
    if (Player.y > floorY) { Player.y = floorY; Player.vy = -2; }
    if (Player.y < 30) { Player.y = 30; Player.vy = 1; }

    Player.draw(ctx, game.images);
    this.drawHUD(ctx, game, W, H);

    // Tutorial overlay
    this.tutorialTimer += dt;
    if (this.tutorialStep === 0 && this.tutorialTimer > 3000) this.tutorialStep = 1;

    ctx.save();
    ctx.fillStyle = 'rgba(0,20,60,0.7)';
    roundRectPath(ctx, W / 2 - 200, H * 0.35, 400, 140, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,210,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#e0f7ff';
    ctx.shadowColor = '#003566';
    ctx.shadowBlur = 8;

    if (this.tutorialStep === 0) {
      ctx.font = 'bold 24px Arial Rounded MT Bold, Arial';
      ctx.fillText("Welcome to Bobo's Ocean Jump!", W / 2, H * 0.44);
      ctx.font = '18px Arial Rounded MT Bold, Arial';
      ctx.fillStyle = '#a8e6cf';
      ctx.fillText("I'm Bobo the sea turtle!", W / 2, H * 0.44 + 36);
    } else {
      ctx.font = 'bold 22px Arial Rounded MT Bold, Arial';
      ctx.fillText('SPACE / TAP = Float Up', W / 2, H * 0.44 - 18);
      ctx.font = '18px Arial Rounded MT Bold, Arial';
      ctx.fillStyle = '#ffe066';
      ctx.fillText('Release = Sink Down', W / 2, H * 0.44 + 16);
      ctx.font = '16px Arial Rounded MT Bold, Arial';
      ctx.fillStyle = '#a8e6cf';
      ctx.fillText('Collect shells & avoid obstacles!', W / 2, H * 0.44 + 48);
    }

    // Skip button
    UI.drawShellButton(ctx, 'Play!', W / 2, H * 0.8, 70, 30);
    ctx.restore();
  },

  onClick(game, cx, cy) {
    if (this.state === 'tutorial') {
      // Shell button area
      if (Math.abs(cx - game.W / 2) < 90 && Math.abs(cy - game.H * 0.8) < 44) {
        this.state = 'playing';
        this.scrollX = 0;
        Player.init(game.W, game.H);
      } else {
        this.tutorialStep = 1;
      }
      return;
    }
    if (this.state === 'fail') {
      // Retry button center
      if (Math.abs(cx - game.W / 2) < 110 && Math.abs(cy - game.H / 2 - 80) < 50) {
        game.setScene('level', game.currentLevel);
      }
      return;
    }
    if (this.state === 'complete') {
      // Next level button
      if (Math.abs(cx - game.W / 2) < 130 && Math.abs(cy - game.H / 2 - 110) < 55) {
        const next = game.currentLevel + 1;
        if (next < CoralGardenLevels.length) {
          game.setScene('level', next);
        } else {
          game.setScene('start');
        }
      }
    }
  },

  drawBoboOnScreen(ctx, game, x, y) {
    ctx.save();
    Player.x = x;
    Player.y = y;
    Player.state = 'hit';
    Player.flickerOn = true;
    Player.draw(ctx, game.images);
    ctx.restore();
  },

  drawBoboWin(ctx, game, x, y) {
    ctx.save();
    Player.x = x;
    Player.y = y;
    Player.state = 'win';
    Player.flickerOn = true;
    Player.draw(ctx, game.images);
    ctx.restore();
  }
};

// --- Obstacle rendering ---
function drawObstacle(ctx, x, y, w, h, type, wobble) {
  ctx.save();
  switch (type) {
    case 'coral':      drawCoralObstacle(ctx, x, y, w, h); break;
    case 'bubble':     drawBubbleObstacle(ctx, x, y, w, h, wobble); break;
    case 'seaweed':    drawSeaweedObstacle(ctx, x, y, w, h, wobble); break;
    default:           drawCoralObstacle(ctx, x, y, w, h);
  }
  ctx.restore();
}

function drawCoralObstacle(ctx, x, y, w, h) {
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, '#ff6b9d');
  grad.addColorStop(0.5, '#e84393');
  grad.addColorStop(1, '#c2185b');
  ctx.fillStyle = grad;
  // Organic coral shape
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, y);
  ctx.lineTo(x + w * 0.45, y + h * 0.15);
  ctx.lineTo(x + w * 0.85, y);
  ctx.lineTo(x + w * 0.9, y + h * 0.5);
  ctx.bezierCurveTo(x + w * 0.95, y + h * 0.8, x + w * 0.8, y + h, x + w * 0.5, y + h);
  ctx.bezierCurveTo(x + w * 0.2, y + h, x + w * 0.05, y + h * 0.8, x + w * 0.1, y + h * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,200,220,0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Spots
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(x + w * (0.2 + i * 0.2), y + h * (0.3 + (i % 2) * 0.3), 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBubbleObstacle(ctx, x, y, w, h, wobble) {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;
  ctx.beginPath();
  ctx.ellipse(cx + Math.sin(wobble) * 3, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(100,200,255,0.25)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(150,220,255,0.75)';
  ctx.lineWidth = 3;
  ctx.stroke();
  // Shine
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.3 + Math.sin(wobble) * 2, cy - ry * 0.25, rx * 0.25, ry * 0.12, -0.4, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
}

function drawSeaweedObstacle(ctx, x, y, w, h, wobble) {
  const base = y + h;
  ctx.strokeStyle = '#2d6a4f';
  ctx.lineWidth = w * 0.45;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x + w / 2, base);
  const segs = 7;
  for (let i = 1; i <= segs; i++) {
    const t = i / segs;
    const sw = Math.sin(wobble + t * 3) * w * 0.5;
    ctx.lineTo(x + w / 2 + sw, base - h * t);
  }
  ctx.stroke();
  // Highlight
  ctx.strokeStyle = 'rgba(100,200,120,0.25)';
  ctx.lineWidth = w * 0.2;
  ctx.stroke();
}

// --- Collectible rendering ---
function drawCollectible(ctx, x, y, r, type, wobble) {
  const cy = y + Math.sin(wobble) * 5;
  ctx.save();
  ctx.translate(x + r, cy + r);
  switch (type) {
    case 'shell':    drawShellCollectible(ctx, r); break;
    case 'starfish': drawStarfishCollectible(ctx, r); break;
    case 'shield':   drawShieldCollectible(ctx, r); break;
  }
  // Glow
  ctx.beginPath();
  ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,150,${0.08 + 0.06 * Math.sin(wobble * 2)})`;
  ctx.fill();
  ctx.restore();
}

function drawShellCollectible(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo(r * 0.7, -r, r, -r * 0.3, r * 0.7, r * 0.2);
  ctx.bezierCurveTo(r * 0.4, r * 0.7, r * 0.2, r, 0, r * 0.8);
  ctx.bezierCurveTo(-r * 0.2, r, -r * 0.4, r * 0.7, -r * 0.7, r * 0.2);
  ctx.bezierCurveTo(-r, -r * 0.3, -r * 0.7, -r, 0, -r);
  ctx.closePath();
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  grad.addColorStop(0, '#fff8e7');
  grad.addColorStop(0.5, '#f9c74f');
  grad.addColorStop(1, '#c9502e');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#fff8e7';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Lines
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.9 + i * r * 0.5);
    ctx.bezierCurveTo(-r * 0.4, -r * 0.9 + i * r * 0.5 + 4, r * 0.4, -r * 0.9 + i * r * 0.5 + 4, 0, -r * 0.9 + i * r * 0.5);
    ctx.stroke();
  }
}

function drawStarfishCollectible(ctx, r) {
  ctx.fillStyle = '#f9c74f';
  ctx.strokeStyle = '#e5990a';
  ctx.lineWidth = 1.5;
  drawStar(ctx, 0, 0, r * 0.45, r, 5);
  ctx.fill();
  ctx.stroke();
  // Center dot
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = '#e5990a';
  ctx.fill();
}

function drawStar(ctx, cx, cy, ir, or, pts) {
  const step = Math.PI / pts;
  ctx.beginPath();
  for (let i = 0; i < pts * 2; i++) {
    const ang = i * step - Math.PI / 2;
    const rad = i % 2 === 0 ? or : ir;
    i === 0 ? ctx.moveTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad)
             : ctx.lineTo(cx + Math.cos(ang) * rad, cy + Math.sin(ang) * rad);
  }
  ctx.closePath();
}

function drawShieldCollectible(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo(r, -r, r, 0, r, r * 0.3);
  ctx.bezierCurveTo(r, r * 0.7, 0, r, 0, r);
  ctx.bezierCurveTo(0, r, -r, r * 0.7, -r, r * 0.3);
  ctx.bezierCurveTo(-r, 0, -r, -r, 0, -r);
  ctx.closePath();
  ctx.fillStyle = 'rgba(116,185,255,0.7)';
  ctx.fill();
  ctx.strokeStyle = '#74b9ff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // 🛡 label
  ctx.font = `bold ${r * 0.9}px Arial`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🛡', 0, 2);
}

function drawFinishGate(ctx, x, H) {
  const gateH = H - 120;
  // Gate posts
  const grad = ctx.createLinearGradient(x, 0, x + 20, 0);
  grad.addColorStop(0, '#fdcb6e');
  grad.addColorStop(1, '#e17055');
  ctx.fillStyle = grad;
  ctx.fillRect(x, 20, 20, gateH);
  ctx.fillRect(x + 60, 20, 20, gateH);

  // Arch
  ctx.beginPath();
  ctx.arc(x + 50, 20, 50, Math.PI, 0);
  ctx.fillStyle = 'rgba(253,203,110,0.5)';
  ctx.fill();
  ctx.strokeStyle = '#fdcb6e';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Starfish deco
  ctx.save();
  ctx.translate(x + 50, 20);
  drawStarfishCollectible(ctx, 18);
  ctx.restore();

  // "FINISH" text
  ctx.save();
  ctx.font = 'bold 18px Arial Rounded MT Bold, Arial';
  ctx.fillStyle = '#ffe066';
  ctx.textAlign = 'center';
  ctx.fillText('FINISH', x + 50, H - 80);
  ctx.restore();
}

function drawSmallCoral(ctx, x, baseY, h, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - h);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x, baseY - h * 0.5);
  ctx.lineTo(x + 14, baseY - h * 0.72);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, baseY - h * 0.65);
  ctx.lineTo(x - 12, baseY - h * 0.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, baseY - h, 5, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function collectColor(type) {
  if (type === 'shell') return '#f9c74f';
  if (type === 'starfish') return '#fdcb6e';
  if (type === 'shield') return '#74b9ff';
  return '#ffffff';
}

function roundRectPath(ctx, x, y, w, h, r) {
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
