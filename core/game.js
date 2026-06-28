/* ─── Game Core ─── */
const Game = {
  canvas: null, ctx: null,
  W: 1140, H: 540,

  scene: 'start',   // start | select | level
  currentLevel: 0,
  score: 0,
  shellsCollected: 0,
  combo: 0,
  comboTimer: 0,

  inputPressed: false,
  lastTime: 0,
  images: {},

  // Transition
  trans: { active: false, alpha: 0, phase: 'out', cb: null },

  // Ambient
  bubbles: [],
  rays: [],
  fish: [],
  jellyfish: [],
  t: 0,  // total time ms

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.W;
    this.canvas.height = this.H;

    Save.init();
    Audio.init();
    this._loadImages();
    this._initAmbient();
    this._bindInput();

    this.setScene('start');
    requestAnimationFrame(ts => this._loop(ts));
  },

  _loadImages() {
    const map = { idle:'bobo_idle', swim:'bobo_swim', boost:'bobo_boost', hit:'bobo_hit', win:'bobo_win' };
    for (const [k, f] of Object.entries(map)) {
      const img = new Image();
      img.src = `assets/${f}.png`;
      this.images[k] = img;
    }
  },

  _initAmbient() {
    this.bubbles = Array.from({ length: 32 }, () => this._newBubble(true));
    this.rays = Array.from({ length: 8 }, (_, i) => ({
      x: (i / 8 + Math.random() * 0.05) * this.W,
      w: 35 + Math.random() * 70,
      alpha: 0.04 + Math.random() * 0.06,
      spd: 0.00015 + Math.random() * 0.0002,
      phase: Math.random() * Math.PI * 2,
    }));
    // Decorative fish
    this.fish = Array.from({ length: 10 }, () => this._newFish(true));
    this.jellyfish = Array.from({ length: 5 }, () => this._newJelly(true));
  },

  _newBubble(scatter) {
    return {
      x: Math.random() * this.W,
      y: scatter ? Math.random() * this.H : this.H + 10,
      r: 2 + Math.random() * 8,
      spd: 0.35 + Math.random() * 0.7,
      wob: Math.random() * Math.PI * 2,
      wobSpd: 0.018 + Math.random() * 0.025,
      alpha: 0.15 + Math.random() * 0.4,
    };
  },

  _newFish(scatter) {
    const side = Math.random() < 0.5 ? 1 : -1;
    return {
      x: scatter ? Math.random() * this.W : (side > 0 ? -60 : this.W + 60),
      y: 80 + Math.random() * (this.H - 160),
      vx: (0.6 + Math.random() * 1.2) * (side > 0 ? 1 : -1),
      r: 10 + Math.random() * 14,
      color: ['#ff9f43', '#ffeaa7', '#74b9ff', '#fd79a8', '#55efc4'][Math.floor(Math.random() * 5)],
      tailPhase: Math.random() * Math.PI * 2,
      depth: 0.2 + Math.random() * 0.3,
    };
  },

  _newJelly(scatter) {
    return {
      x: scatter ? Math.random() * this.W : Math.random() * this.W,
      y: scatter ? Math.random() * this.H : this.H + 80,
      r: 18 + Math.random() * 22,
      spd: 0.18 + Math.random() * 0.25,
      pulsePhase: Math.random() * Math.PI * 2,
      color: ['rgba(180,100,255,0.35)', 'rgba(100,180,255,0.32)', 'rgba(255,150,220,0.3)'][Math.floor(Math.random() * 3)],
    };
  },

  _updateAmbient(dt) {
    this.t += dt;
    const T = this.t;

    for (const b of this.bubbles) {
      b.y -= b.spd;
      b.wob += b.wobSpd;
      b.x += Math.sin(b.wob) * 0.45;
      if (b.y < -12) Object.assign(b, this._newBubble(false));
    }
    for (const r of this.rays) {
      r.alpha = 0.035 + 0.035 * Math.sin(T * r.spd + r.phase);
    }
    for (const f of this.fish) {
      f.x += f.vx;
      f.tailPhase += 0.08;
      if (f.x > this.W + 80 || f.x < -80) Object.assign(f, this._newFish(false));
    }
    for (const j of this.jellyfish) {
      j.y -= j.spd;
      j.pulsePhase += 0.04;
      if (j.y < -100) Object.assign(j, this._newJelly(false));
    }
  },

  drawBg(ctx) {
    const W = this.W, H = this.H;

    // Gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#002b55');
    grad.addColorStop(0.35, '#0077b6');
    grad.addColorStop(1, '#01263f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Light rays
    for (const r of this.rays) {
      ctx.save();
      ctx.globalAlpha = r.alpha;
      const rg = ctx.createLinearGradient(r.x, 0, r.x, H);
      rg.addColorStop(0, 'rgba(200,245,255,1)');
      rg.addColorStop(1, 'rgba(0,100,180,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(r.x - r.w * 0.5, 0);
      ctx.lineTo(r.x + r.w * 0.5, 0);
      ctx.lineTo(r.x + r.w * 2, H);
      ctx.lineTo(r.x - r.w * 2, H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Caustic shimmer on floor
    this._drawCaustics(ctx, W, H);

    // Distant silhouette layer
    this._drawSilhouettes(ctx, W, H);

    // Jellyfish
    for (const j of this.jellyfish) {
      ctx.save();
      ctx.globalAlpha = 0.55;
      const pulse = 1 + Math.sin(j.pulsePhase) * 0.12;
      ctx.translate(j.x, j.y);
      ctx.scale(pulse, 1);
      ctx.beginPath();
      ctx.arc(0, 0, j.r, Math.PI, 0);
      ctx.fillStyle = j.color;
      ctx.fill();
      // Tentacles
      for (let i = 0; i < 5; i++) {
        const tx = (i - 2) * (j.r * 0.45);
        const swoop = Math.sin(j.pulsePhase + i * 0.8) * 12;
        ctx.beginPath();
        ctx.moveTo(tx, 0);
        ctx.bezierCurveTo(tx + swoop, j.r * 0.8, tx - swoop, j.r * 1.4, tx + swoop * 0.5, j.r * 2.2);
        ctx.strokeStyle = j.color.replace('0.3', '0.5').replace('0.32', '0.5').replace('0.35', '0.5');
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();
    }

    // Fish schools (parallax 0.3x handled in level scene)
    for (const f of this.fish) {
      this._drawFish(ctx, f);
    }

    // Bubbles
    for (const b of this.bubbles) {
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(180,230,255,0.8)';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.fillStyle = 'rgba(200,240,255,0.12)';
      ctx.fill();
      ctx.restore();
    }

    // Floor + coral
    this._drawFloor(ctx, W, H);
  },

  _drawCaustics(ctx, W, H) {
    const t = this.t * 0.001;
    ctx.save();
    ctx.globalAlpha = 0.055;
    ctx.strokeStyle = '#90e0ef';
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      for (let px = 0; px <= W; px += 6) {
        const py = H - 40 + Math.sin(px * 0.04 + t * 0.9 + i * 1.3) * 10
                         + Math.sin(px * 0.07 + t * 0.6 - i * 0.9) * 6;
        px === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  },

  _drawSilhouettes(ctx, W, H) {
    ctx.save();
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = '#001a33';
    // Rock formations
    const rocks = [80, 240, 480, 700, 920, 1100];
    for (const rx of rocks) {
      ctx.beginPath();
      ctx.moveTo(rx - 60, H - 60);
      ctx.bezierCurveTo(rx - 40, H - 160, rx + 10, H - 180, rx + 30, H - 140);
      ctx.bezierCurveTo(rx + 55, H - 100, rx + 70, H - 70, rx + 80, H - 60);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  },

  _drawFish(ctx, f) {
    ctx.save();
    ctx.globalAlpha = f.depth * 0.9;
    ctx.translate(f.x, f.y);
    if (f.vx < 0) ctx.scale(-1, 1);
    const tw = Math.sin(f.tailPhase) * f.r * 0.35;
    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, f.r, f.r * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = f.color;
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(-f.r * 0.8, 0);
    ctx.lineTo(-f.r * 1.4, -f.r * 0.4 + tw);
    ctx.lineTo(-f.r * 1.4, f.r * 0.4 + tw);
    ctx.closePath();
    ctx.fill();
    // Eye
    ctx.beginPath();
    ctx.arc(f.r * 0.45, -f.r * 0.1, f.r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#1a1a1a';
    ctx.fill();
    ctx.restore();
  },

  _drawFloor(ctx, W, H) {
    const fy = H - 55;
    const sg = ctx.createLinearGradient(0, fy, 0, H);
    sg.addColorStop(0, '#b5924c');
    sg.addColorStop(1, '#6b4a1a');
    ctx.fillStyle = sg;
    ctx.fillRect(0, fy, W, H - fy);
    // Sand ripples
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.strokeStyle = '#d4a96a';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) {
        const y = fy + 10 + i * 10 + Math.sin(x * 0.03 + i * 1.2) * 3;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
    // Corals on floor
    _floorCorals(ctx, W, fy);
  },

  // ─── Transition ───
  goScene(name, level) {
    this.trans = {
      active: true, alpha: 0, phase: 'out',
      cb: () => {
        this.setScene(name, level);
        this.trans.phase = 'in';
      }
    };
  },

  setScene(name, level) {
    this.scene = name;
    if (name === 'start') { StartScene.init(this); }
    else if (name === 'select') { LevelSelect.init(this); }
    else if (name === 'level') {
      this.currentLevel = level ?? 0;
      this.score = 0; this.shellsCollected = 0;
      this.combo = 0; this.comboTimer = 0;
      LevelScene.init(this, CoralGardenLevels[this.currentLevel]);
      Audio.startMusic();
    }
  },

  _bindInput() {
    const dn = () => { this.inputPressed = true; Audio.resume(); };
    const up = () => { this.inputPressed = false; };
    window.addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); dn(); }
      if (e.code === 'KeyM') Audio.toggleMute();
    });
    window.addEventListener('keyup', e => {
      if (e.code === 'Space' || e.code === 'ArrowUp') up();
    });
    this.canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      dn();
      const r = this.canvas.getBoundingClientRect();
      const sx = this.W / r.width, sy = this.H / r.height;
      const cx = (e.clientX - r.left) * sx;
      const cy = (e.clientY - r.top) * sy;
      this._handleClick(cx, cy);
    });
    this.canvas.addEventListener('pointerup', up);
    this.canvas.addEventListener('touchstart', e => { e.preventDefault(); dn(); }, { passive: false });
    this.canvas.addEventListener('touchend', e => { e.preventDefault(); up(); }, { passive: false });
  },

  _handleClick(cx, cy) {
    // Mute button
    if (cx > this.W - 55 && cy < 55) { Audio.toggleMute(); return; }
    if (this.scene === 'start') StartScene.onClick(this, cx, cy);
    else if (this.scene === 'select') LevelSelect.onClick(this, cx, cy);
    else if (this.scene === 'level') LevelScene.onClick(this, cx, cy);
  },

  _loop(ts) {
    const dt = Math.min(ts - this.lastTime, 50);
    this.lastTime = ts;
    const ctx = this.ctx;

    // Update ambient
    this._updateAmbient(dt);
    Camera.update();
    Particles.update();

    // Combo decay
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) { this.combo = 0; }
    }

    // Draw
    this.drawBg(ctx);

    Camera.apply(ctx);
    if (this.scene === 'start') StartScene.update(this, dt);
    else if (this.scene === 'select') LevelSelect.update(this, dt);
    else if (this.scene === 'level') LevelScene.update(this, dt);
    Camera.restore(ctx);

    Camera.drawFlash(ctx, this.W, this.H);
    Particles.draw(ctx);

    // Transition overlay
    this._updateTrans(dt, ctx);

    // Mute button always visible
    UI.drawMute(ctx, Audio.muted, this.W);

    requestAnimationFrame(ts2 => this._loop(ts2));
  },

  _updateTrans(dt, ctx) {
    const T = this.trans;
    if (!T.active) return;
    const spd = 1 / 220;
    if (T.phase === 'out') {
      T.alpha = Math.min(1, T.alpha + dt * spd);
      if (T.alpha >= 1) T.cb && T.cb();
    } else {
      T.alpha = Math.max(0, T.alpha - dt * spd);
      if (T.alpha <= 0) T.active = false;
    }
    ctx.save();
    ctx.fillStyle = `rgba(0,5,20,${T.alpha})`;
    ctx.fillRect(0, 0, this.W, this.H);
    ctx.restore();
  },

  addCombo() {
    this.combo++;
    this.comboTimer = 2200;
    if (this.combo >= 2) {
      Audio.sfx('combo');
      Particles.text(Player.x, Player.y - 50, `x${this.combo}!`, '#ff9f43');
    }
  },

  resetCombo() {
    this.combo = 0;
    this.comboTimer = 0;
  }
};

// ─── Floor coral decorations ───
function _floorCorals(ctx, W, fy) {
  const placements = [
    { x:55,  h:72, c:'#ff6b9d' }, { x:155, h:58, c:'#ff9f43' },
    { x:285, h:82, c:'#ff6b9d' }, { x:425, h:62, c:'#26de81' },
    { x:570, h:78, c:'#fd79a8' }, { x:715, h:66, c:'#fdcb6e' },
    { x:855, h:88, c:'#e17055' }, { x:975, h:56, c:'#74b9ff' },
    { x:1075,h:72, c:'#a29bfe' },
  ];
  for (const p of placements) _coral(ctx, p.x, fy, p.h, p.c);
  const weeds = [108, 248, 368, 508, 648, 788, 928, 1038];
  for (const wx of weeds) _seaweed(ctx, wx, fy, 45 + Math.random() * 25);
}

function _coral(ctx, x, baseY, h, color) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 5.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, baseY); ctx.lineTo(x, baseY - h); ctx.stroke();
  ctx.lineWidth = 3.5;
  [[1, 20], [-1, 18], [1, 16]].forEach(([side, blen], i) => {
    const by = baseY - h * (0.38 + i * 0.2);
    ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x + side * blen, by - blen); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + side * blen, by - blen, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  });
  ctx.beginPath(); ctx.arc(x, baseY - h, 7, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}

function _seaweed(ctx, x, baseY, h) {
  ctx.save();
  ctx.strokeStyle = '#2d6a4f'; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, baseY);
  for (let i = 1; i <= 6; i++) {
    const t = i / 6;
    const cx1 = x + (i % 2 === 0 ? 11 : -11);
    const cy1 = baseY - h * t * 0.72;
    ctx.bezierCurveTo(cx1, cy1, x + (i % 2 === 0 ? -7 : 7), baseY - h * t, x, baseY - h * t);
  }
  ctx.stroke();
  ctx.restore();
}
