const LevelScene = {
  data: null,
  obstacles: [],
  collectibles: [],
  hearts: 3,
  maxHearts: 3,
  scrollX: 0,
  speed: 130,
  state: 'tutorial',  // tutorial | playing | fail | complete
  tutStep: 0,
  tutTimer: 0,

  // Per-level stats
  shellsThisLevel: 0,
  scoreThisLevel: 0,
  hitsTaken: 0,
  totalShellsInLevel: 0,

  shieldTimer: 0,
  mustCollect: 0,

  // State timers
  failTimer: 0,
  completeTimer: 0,
  starsEarned: 0,

  // Level time
  levelT: 0,

  init(game, data) {
    this.data = data;
    this.hearts = 3;
    this.maxHearts = 3;
    this.scrollX = 0;
    this.speed = data.speed;
    this.state = data.tutorial ? 'tutorial' : 'playing';
    this.tutStep = 0;
    this.tutTimer = 0;
    this.shieldTimer = 0;
    this.mustCollect = data.mustCollectShells || 0;
    this.shellsThisLevel = 0;
    this.scoreThisLevel = 0;
    this.hitsTaken = 0;
    this.levelT = 0;
    this.failTimer = 0;
    this.completeTimer = 0;
    Particles.clear();

    Player.init(game.W, game.H);
    Player.shielded = false;
    Player.invincible = false;

    const W = game.W, H = game.H, len = data.length;

    this.obstacles = data.obstacles.map(o => ({
      xBase: o.xFrac * len,
      yBase: o.yFrac * H,
      x: o.xFrac * len,
      y: o.yFrac * H,
      w: o.w, h: o.h,
      type: o.type,
      move: o.move || null,
      wobble: Math.random() * Math.PI * 2,
    }));

    this.collectibles = data.collectibles.map(c => ({
      xBase: c.xFrac * len,
      yBase: c.yFrac * H,
      x: c.xFrac * len,
      y: c.yFrac * H,
      r: c.type === 'shield' ? 20 : 18,
      type: c.type,
      collected: false,
      wob: Math.random() * Math.PI * 2,
      wobSpd: 0.022 + Math.random() * 0.018,
    }));

    this.totalShellsInLevel = this.collectibles.filter(c => c.type === 'shell').length;

    // Spawn welcome bubbles
    for (let i = 0; i < 8; i++) Particles.bubble(
      Math.random() * game.W, game.H * 0.9
    );
  },

  update(game, dt) {
    const ctx = game.ctx;
    const W = game.W, H = game.H;
    this.levelT += dt;

    switch(this.state) {
      case 'tutorial': this._tutorial(ctx, game, dt, W, H); return;
      case 'fail':     this._drawGame(ctx, game, dt); this._drawFail(ctx, game, W, H); return;
      case 'complete': this._drawGame(ctx, game, dt); this._drawComplete(ctx, game, W, H); return;
    }

    // ─── Playing ───
    if (this.shieldTimer > 0) {
      this.shieldTimer -= dt;
      if (this.shieldTimer <= 0) { Player.shielded = false; }
    }

    // Physics
    const wasPressed = game.inputPressed;
    Physics.update(Player, game.inputPressed);
    if (wasPressed && Player.vy < -3) {
      // Jump sound only at lift-off
      if (!this._wasPressingLast) Audio.sfx('jump');
    }
    this._wasPressingLast = wasPressed;

    Player.update(dt);

    // Boundary
    const floor = H - 90, ceil = 28;
    if (Player.y > floor) { Player.y = floor; Player.vy = -2.5; }
    if (Player.y < ceil)  { Player.y = ceil;  Player.vy = 2; }

    // Scroll
    this.scrollX += this.speed * (dt / 1000);

    // Update moving obstacles
    for (const o of this.obstacles) {
      o.wobble += 0.03;
      if (o.move) {
        const m = o.move;
        o.y = o.yBase + Math.sin(this.levelT * m.spd * Math.PI * 2 + (m.phase || 0)) * m.amp;
      }
    }
    for (const c of this.collectibles) { c.wob += c.wobSpd; }

    // Collision
    this._checkCollisions(game);

    // Level end
    const finishX = this.data.length - W * 0.12;
    if (this.scrollX >= finishX) {
      const canFinish = !this.mustCollect || this.shellsThisLevel >= this.mustCollect;
      if (canFinish) { this._triggerComplete(game); return; }
    }

    // Spawn trail bubbles
    if (Math.random() < 0.12) Particles.bubble(Player.x - Player.radius, Player.y);

    this._drawGame(ctx, game, dt);
    this._drawHUD(ctx, game, W, H);
  },

  _checkCollisions(game) {
    const px = Player.x, py = Player.y, pr = Player.radius - 5;

    for (const o of this.obstacles) {
      if (o.destroyed) continue;
      const sx = o.x - this.scrollX;
      if (sx > game.W + 60 || sx + o.w < -60) continue;
      // Circle-rect
      const nearX = Math.max(sx, Math.min(px, sx + o.w));
      const nearY = Math.max(o.y, Math.min(py, o.y + o.h));
      const dx = px - nearX, dy = py - nearY;
      if (dx * dx + dy * dy < pr * pr) {
        this._onHit(game, o);
      }
    }

    for (const c of this.collectibles) {
      if (c.collected) continue;
      const sx = c.x - this.scrollX;
      if (sx > game.W + 40 || sx + c.r * 2 < -40) continue;
      const dx = px - (sx + c.r), dy = py - (c.y + c.r);
      if (dx * dx + dy * dy < (pr + c.r - 2) * (pr + c.r - 2)) {
        this._onCollect(game, c, sx);
      }
    }
  },

  _onHit(game, o) {
    if (Player.invincible) return;
    if (Player.shielded) {
      Player.shielded = false;
      this.shieldTimer = 0;
      Camera.flash('#74b9ff', 0.4);
      Camera.shake(10);
      Audio.sfx('shield');
      Particles.ring(Player.x, Player.y, '#74b9ff');
      Particles.spawn(Player.x, Player.y, { count:10, colors:['#74b9ff','#90e0ef'], rMin:4, rMax:9, glow:true });
      return;
    }
    if (this.data.noPunishment) { Player.triggerHit(); return; }
    this.hearts--;
    this.hitsTaken++;
    Player.triggerHit();
    Camera.shake(18);
    Camera.flash('#ff4d6d', 0.5);
    Audio.sfx('hit');
    Particles.spawn(Player.x, Player.y, { count:14, colors:['#ff4d6d','#ff8099','#fff'], rMin:4, rMax:10, glow:true });
    Particles.ring(Player.x, Player.y, '#ff4d6d');
    UI.pingHeart(this.hearts);
    game.resetCombo();
    if (this.hearts <= 0) {
      this.state = 'fail';
      this.failTimer = 0;
    }
  },

  _onCollect(game, c, sx) {
    c.collected = true;
    const cx = sx + c.r;
    if (c.type === 'shell') {
      this.shellsThisLevel++;
      game.shellsCollected++;
      game.addCombo();
      Audio.sfx('shell');
      Particles.spawn(cx, c.y + c.r, { count:12, colors:['#f9c74f','#fff8e7','#ffe066'], type:'star', rMin:5, rMax:12, glow:true });
      Particles.ring(cx, c.y + c.r, '#f9c74f');
      const mult = Math.max(1, game.combo);
      const pts = 200 * mult;
      this.scoreThisLevel += pts;
      game.score += pts;
      Particles.text(cx, c.y + c.r - 20, `+${pts}`, '#ffe066');
    } else if (c.type === 'starfish') {
      game.addCombo();
      Audio.sfx('star');
      Particles.spawn(cx, c.y + c.r, { count:10, colors:['#fdcb6e','#ffe066','#fff'], type:'star', rMin:4, rMax:9 });
      const mult = Math.max(1, game.combo);
      const pts = 100 * mult;
      this.scoreThisLevel += pts;
      game.score += pts;
      Particles.text(cx, c.y + c.r - 20, `+${pts}`, '#fdcb6e');
    } else if (c.type === 'shield') {
      Player.shielded = true;
      this.shieldTimer = 8000;
      Audio.sfx('shield');
      Particles.spawn(cx, c.y + c.r, { count:12, colors:['#74b9ff','#a0c8ff'], rMin:4, rMax:8, glow:true });
      Particles.text(cx, c.y + c.r - 20, 'SHIELD!', '#74b9ff');
    }
  },

  _triggerComplete(game) {
    this.state = 'complete';
    this.completeTimer = 0;
    Audio.sfx('complete');
    Camera.flash('#ffe066', 0.5);

    // Star calculation
    const allShells = this.shellsThisLevel >= this.totalShellsInLevel;
    const noHits = this.hitsTaken === 0;
    this.starsEarned = Save.calcStars(true, allShells, noHits);

    Save.recordLevel(game.currentLevel, this.starsEarned, game.score, game.shellsCollected);

    // Celebration particles
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        Particles.spawn(Player.x, Player.y, {
          count: 20, colors: ['#ffe066','#ff9f43','#ff6b9d','#74b9ff','#a8e6cf'],
          type: 'star', rMin: 5, rMax: 14, glow: true,
          speedMin: 2, speedMax: 6, upBias: -2,
        });
      }, i * 200);
    }
    Player.state = 'win';
  },

  _drawGame(ctx, game, dt) {
    const W = game.W, H = game.H;

    // Parallax bg details (scrolled at 0.4x)
    this._drawParallax(ctx, W, H);

    // Current arrows (level 7 onward)
    if (game.currentLevel >= 6) this._drawCurrentArrows(ctx, W, H);

    // Obstacles
    for (const o of this.obstacles) {
      if (o.destroyed) continue;
      const sx = o.x - this.scrollX;
      if (sx > W + 80 || sx + o.w < -80) continue;
      _drawObs(ctx, sx, o.y, o.w, o.h, o.type, o.wobble, this.levelT);
    }

    // Collectibles
    for (const c of this.collectibles) {
      if (c.collected) continue;
      const sx = c.x - this.scrollX;
      if (sx > W + 40 || sx < -40) continue;
      _drawCollectible(ctx, sx + c.r, c.y + c.r, c.r, c.type, c.wob);
    }

    // Finish gate
    const finX = this.data.length - W * 0.12;
    const finSx = finX - this.scrollX;
    if (finSx < W + 100 && finSx > -100) _drawFinishGate(ctx, finSx, H);

    // Bobo
    Player.draw(ctx, game.images);
  },

  _drawParallax(ctx, W, H) {
    // Extra mid-ground coral at 0.45x scroll speed
    ctx.save();
    ctx.globalAlpha = 0.22;
    const off = (this.scrollX * 0.45) % (W + 220);
    const cols = ['#ff6b9d','#ff9f43','#26de81','#fdcb6e','#a29bfe','#74b9ff'];
    for (let i = 0; i < 6; i++) {
      const bx = (i * 220 - off + W * 2) % (W + 220) - 110;
      _smallCoral(ctx, bx, H - 75, 28 + (i % 3) * 10, cols[i % cols.length]);
    }
    ctx.restore();
  },

  _drawCurrentArrows(ctx, W, H) {
    ctx.save();
    ctx.globalAlpha = 0.1 + 0.04 * Math.sin(this.levelT * 0.003);
    ctx.strokeStyle = '#90e0ef';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      const x = ((i * 240 - (this.scrollX * 0.6) % 240) + W) % W;
      const y = H * 0.3 + i * 30;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 20, y + 6);
      ctx.lineTo(x, y + 12);
      ctx.stroke();
    }
    ctx.restore();
  },

  _drawHUD(ctx, game, W, H) {
    UI.drawHearts(ctx, this.hearts, this.maxHearts, 22, 34);
    UI.drawAreaLabel(ctx, `Area 1 · Lv.${this.data.id}: ${this.data.name}`, W, 26);
    UI.drawScore(ctx, game.score, W - 18, 34);
    UI.drawShells(ctx, game.shellsCollected, W - 18, 62);
    UI.drawCombo(ctx, game.combo, W * 0.5, H * 0.88);

    // Shield bar
    if (Player.shielded) {
      const pct = this.shieldTimer / 8000;
      ctx.save();
      ctx.beginPath();
      _rrectPath(ctx, 22, 52, 120 * pct, 8, 4);
      ctx.fillStyle = '#74b9ff';
      ctx.shadowColor = '#74b9ff';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.font = '12px Arial Rounded MT Bold, Arial';
      ctx.fillStyle = '#a0c8ff';
      ctx.textAlign = 'left';
      ctx.fillText('🛡 Shield', 22, 50);
      ctx.restore();
    }

    // Shell requirement
    if (this.mustCollect > 0) {
      const need = this.mustCollect - this.shellsThisLevel;
      if (need > 0) {
        ctx.save();
        ctx.font = 'bold 15px Arial Rounded MT Bold, Arial';
        ctx.fillStyle = '#fdcb6e';
        ctx.textAlign = 'center';
        ctx.fillText(`Collect ${need} more shell${need > 1 ? 's' : ''} to pass!`, W / 2, H - 22);
        ctx.restore();
      }
    }

    // Progress bar
    const finX = this.data.length - game.W * 0.12;
    UI.drawProgressBar(ctx, this.scrollX / finX, W, H);
  },

  // ─── Tutorial ───
  _tutorial(ctx, game, dt, W, H) {
    this.tutTimer += dt;
    Physics.update(Player, game.inputPressed);
    const fl = H - 90, cl = 28;
    if (Player.y > fl) { Player.y = fl; Player.vy = -2; }
    if (Player.y < cl) { Player.y = cl; Player.vy = 1.5; }
    Player.update(dt);
    Player.draw(ctx, game.images);

    if (Math.random() < 0.08) Particles.bubble(Player.x - Player.radius, Player.y);

    this._drawHUD(ctx, game, W, H);

    if (this.tutStep === 0 && this.tutTimer > 2500) this.tutStep = 1;

    // Tutorial card
    const cx = W / 2, cy = H * 0.42;
    ctx.save();
    ctx.globalAlpha = 0.92;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 220, 110, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(5,30,100,0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,210,255,0.65)';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#48cae4';
    ctx.shadowBlur = 14;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#003566';
    ctx.shadowBlur = 6;
    if (this.tutStep === 0) {
      ctx.font = 'bold 24px Arial Rounded MT Bold, Arial';
      ctx.fillStyle = '#cef5ff';
      ctx.fillText("Hi! I'm Bobo! 🐢", cx, cy - 28);
      ctx.font = '17px Arial Rounded MT Bold, Arial';
      ctx.fillStyle = '#a8e6cf';
      ctx.fillText("Let's explore the ocean!", cx, cy + 6);
      ctx.fillStyle = 'rgba(160,220,255,0.6)';
      ctx.font = '13px Arial Rounded MT Bold, Arial';
      ctx.fillText('(waiting for you...)', cx, cy + 34);
    } else {
      ctx.font = 'bold 20px Arial Rounded MT Bold, Arial';
      ctx.fillStyle = '#ffe066';
      ctx.fillText('SPACE / TAP = Float Up ↑', cx, cy - 36);
      ctx.font = 'bold 20px Arial Rounded MT Bold, Arial';
      ctx.fillStyle = '#90e0ef';
      ctx.fillText('Release = Sink Down ↓', cx, cy - 10);
      ctx.font = '15px Arial Rounded MT Bold, Arial';
      ctx.fillStyle = '#a8e6cf';
      ctx.fillText('Collect 🐚 shells · Avoid obstacles!', cx, cy + 20);
    }
    ctx.restore();

    UI.shellButton(ctx, 'Play!', W / 2, H * 0.8, 68, 30, { fontSize: 18, textY: 6 });
  },

  // ─── Fail overlay ───
  _drawFail(ctx, game, W, H) {
    UI.drawFail(ctx, W, H);
    // Sad Bobo pose
    ctx.save();
    Player.x = W * 0.62; Player.y = H * 0.37;
    Player.state = 'hit'; Player.flickerOn = true;
    Player.draw(ctx, game.images);
    ctx.restore();
  },

  // ─── Complete overlay ───
  _drawComplete(ctx, game, W, H) {
    this.completeTimer += 16;
    UI.drawWin(ctx, W, H, this.data.id, game.score, game.shellsCollected, this.starsEarned, game.images);
    // Win Bobo
    ctx.save();
    Player.x = W * 0.62; Player.y = H * 0.37;
    Player.state = 'win'; Player.flickerOn = true; Player.vy = 0;
    Player.draw(ctx, game.images);
    ctx.restore();
  },

  onClick(game, cx, cy) {
    const W = game.W, H = game.H;
    if (this.state === 'tutorial') {
      if (Math.abs(cx - W / 2) < 88 && Math.abs(cy - H * 0.8) < 44) {
        this.state = 'playing';
        this.scrollX = 0;
        Player.init(game.W, game.H);
      } else {
        this.tutStep = 1;
      }
      return;
    }
    if (this.state === 'fail') {
      // Retry
      if (Math.abs(cx - (W / 2 - 90)) < 100 && Math.abs(cy - (H / 2 + 80)) < 50) {
        Audio.sfx('click');
        game.goScene('level', game.currentLevel);
      }
      // Menu
      if (Math.abs(cx - (W / 2 + 90)) < 100 && Math.abs(cy - (H / 2 + 80)) < 50) {
        Audio.sfx('click');
        Audio.stopMusic();
        game.goScene('start');
      }
      return;
    }
    if (this.state === 'complete') {
      // Next Level
      if (Math.abs(cx - (W / 2 - 100)) < 115 && Math.abs(cy - (H / 2 + 105)) < 52) {
        Audio.sfx('click');
        const next = game.currentLevel + 1;
        if (next < CoralGardenLevels.length) {
          game.goScene('level', next);
        } else {
          Audio.stopMusic();
          game.goScene('start');
        }
      }
      // Menu
      if (Math.abs(cx - (W / 2 + 100)) < 100 && Math.abs(cy - (H / 2 + 105)) < 52) {
        Audio.sfx('click');
        Audio.stopMusic();
        game.goScene('start');
      }
    }
  }
};

// ─── Obstacle rendering ───
function _drawObs(ctx, x, y, w, h, type, wobble, t) {
  ctx.save();
  switch(type) {
    case 'coral':   _obsCoral(ctx, x, y, w, h, t); break;
    case 'bubble':  _obsBubble(ctx, x, y, w, h, wobble, t); break;
    case 'seaweed': _obsSeaweed(ctx, x, y, w, h, wobble, t); break;
    default:        _obsCoral(ctx, x, y, w, h, t);
  }
  ctx.restore();
}

function _obsCoral(ctx, x, y, w, h, t) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#ff6b9d');
  g.addColorStop(0.45, '#e91e8c');
  g.addColorStop(1, '#ad1457');
  ctx.beginPath();
  ctx.moveTo(x + w * 0.08, y);
  ctx.bezierCurveTo(x + w * 0.5, y + h * 0.05, x + w * 0.9, y, x + w * 0.92, y + h * 0.5);
  ctx.bezierCurveTo(x + w * 0.95, y + h * 0.8, x + w * 0.8, y + h, x + w * 0.5, y + h);
  ctx.bezierCurveTo(x + w * 0.2, y + h, x + w * 0.05, y + h * 0.8, x + w * 0.08, y + h * 0.5);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.shadowColor = '#ff6b9d';
  ctx.shadowBlur = 6;
  ctx.fill();
  // Highlight
  ctx.beginPath();
  ctx.ellipse(x + w * 0.3, y + h * 0.18, w * 0.15, h * 0.08, -0.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,200,220,0.25)';
  ctx.fill();
  // Caustic lines
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = '#ff80b0';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 3; i++) {
    const ly = y + h * (0.2 + i * 0.22);
    ctx.beginPath();
    ctx.moveTo(x + 6, ly + Math.sin(t * 0.004 + i) * 3);
    ctx.lineTo(x + w - 6, ly + Math.sin(t * 0.004 + i + 1.5) * 3);
    ctx.stroke();
  }
}

function _obsBubble(ctx, x, y, w, h, wobble, t) {
  const cx = x + w / 2 + Math.sin(wobble) * 4;
  const cy = y + h / 2;
  const rx = w / 2, ry = h / 2;
  const g = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 4, cx, cy, Math.max(rx, ry));
  g.addColorStop(0, 'rgba(160,220,255,0.25)');
  g.addColorStop(0.7, 'rgba(80,170,255,0.12)');
  g.addColorStop(1, 'rgba(50,140,255,0.05)');
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = `rgba(140,210,255,${0.6 + Math.sin(t * 0.005 + wobble) * 0.15})`;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // Shine
  ctx.beginPath();
  ctx.ellipse(cx - rx * 0.28, cy - ry * 0.28, rx * 0.22, ry * 0.12, -0.45, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.38)';
  ctx.fill();
}

function _obsSeaweed(ctx, x, y, w, h, wobble, t) {
  const baseX = x + w / 2;
  const sway = Math.sin(t * 0.002 + wobble) * w * 0.55;
  const g = ctx.createLinearGradient(baseX, y + h, baseX, y);
  g.addColorStop(0, '#1b5e20');
  g.addColorStop(0.5, '#2e7d32');
  g.addColorStop(1, '#43a047');
  ctx.strokeStyle = g;
  ctx.lineWidth = w * 0.48;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(baseX, y + h);
  const segs = 8;
  for (let i = 1; i <= segs; i++) {
    const tr = i / segs;
    const sw = Math.sin(t * 0.002 + wobble + tr * 2.5) * w * 0.55 * tr;
    ctx.lineTo(baseX + sw, y + h - h * tr);
  }
  ctx.stroke();
  // Edge highlight
  ctx.strokeStyle = 'rgba(100,200,120,0.2)';
  ctx.lineWidth = w * 0.2;
  ctx.stroke();
}

// ─── Collectible rendering ───
function _drawCollectible(ctx, cx, cy, r, type, wob) {
  const floatY = Math.sin(wob) * 5;
  ctx.save();
  ctx.translate(cx, cy + floatY);

  // Glow
  const glowColor = type === 'shell' ? '#f9c74f' : type === 'starfish' ? '#fdcb6e' : '#74b9ff';
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 14 + Math.sin(wob * 2) * 5;

  switch(type) {
    case 'shell':    _collectShell(ctx, r); break;
    case 'starfish': _collectStar(ctx, r); break;
    case 'shield':   _collectShield(ctx, r); break;
  }

  // Sparkle dots
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.5 + Math.sin(wob * 3) * 0.3;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + wob;
    const dist = r * 1.4;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist, 2, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.fill();
  }
  ctx.restore();
}

function _collectShell(ctx, r) {
  // Main shell shape
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo( r*0.65, -r,  r,    -r*0.3, r*0.72,  r*0.18);
  ctx.bezierCurveTo( r*0.44,  r*0.44,  r*0.2,  r, 0,  r*0.8);
  ctx.bezierCurveTo(-r*0.2,  r,  -r*0.44, r*0.44, -r*0.72, r*0.18);
  ctx.bezierCurveTo(-r,    -r*0.3, -r*0.65, -r, 0, -r);
  ctx.closePath();
  const g = ctx.createRadialGradient(-r*0.2, -r*0.3, 0, 0, 0, r);
  g.addColorStop(0, '#fff8dc');
  g.addColorStop(0.4, '#f9c74f');
  g.addColorStop(0.8, '#e07b2a');
  g.addColorStop(1, '#c9502e');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,240,180,0.7)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Ridges
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 1;
  for (let i = 1; i <= 4; i++) {
    const yy = -r * 0.85 + i * r * 0.42;
    ctx.beginPath();
    ctx.moveTo(0, yy);
    ctx.bezierCurveTo(-r * 0.35, yy + r * 0.05, r * 0.35, yy + r * 0.05, 0, yy);
    ctx.stroke();
  }
}

function _collectStar(ctx, r) {
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, '#fff8dc');
  g.addColorStop(0.4, '#ffe066');
  g.addColorStop(1, '#f0a500');
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI / 5) - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    i === 0 ? ctx.moveTo(Math.cos(a)*rad, Math.sin(a)*rad)
             : ctx.lineTo(Math.cos(a)*rad, Math.sin(a)*rad);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,220,60,0.6)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Center
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#f0a500';
  ctx.fill();
}

function _collectShield(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.bezierCurveTo(r, -r, r, r*0.3, r, r*0.3);
  ctx.bezierCurveTo(r, r*0.7, 0, r, 0, r);
  ctx.bezierCurveTo(0, r, -r, r*0.7, -r, r*0.3);
  ctx.bezierCurveTo(-r, r*0.3, -r, -r, 0, -r);
  ctx.closePath();
  const g = ctx.createRadialGradient(-r*0.2, -r*0.3, 0, 0, 0, r);
  g.addColorStop(0, 'rgba(180,230,255,0.9)');
  g.addColorStop(0.6, 'rgba(100,180,255,0.7)');
  g.addColorStop(1, 'rgba(50,120,255,0.5)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = '#74b9ff';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.font = `bold ${r * 0.9}px Arial`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowBlur = 0;
  ctx.fillText('🛡', 0, 2);
}

// ─── Finish gate — delegates to UI.drawFinishArch ───
function _drawFinishGate(ctx, x, H) {
  UI.drawFinishArch(ctx, x + 51, H * 0.5 + 20, 1.05, Game.images);
}

function _smallCoral(ctx, x, baseY, h, color) {
  ctx.strokeStyle = color; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - h); ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, baseY - h*0.5); ctx.lineTo(x+14, baseY-h*0.72); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x, baseY - h*0.65); ctx.lineTo(x-12, baseY-h*0.85); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, baseY-h, 5.5, 0, Math.PI*2);
  ctx.fillStyle = color; ctx.fill();
}

function _rrectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r);
  ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h);
  ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r);
  ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath();
}
