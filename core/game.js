const Game = {
  canvas: null,
  ctx: null,
  W: 1140,
  H: 540,
  scene: null,    // 'start' | 'level'
  currentLevel: 0,
  score: 0,
  shellsCollected: 0,
  inputPressed: false,
  lastTime: 0,
  images: {},
  bubbles: [],
  lightRays: [],

  init() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = this.W;
    this.canvas.height = this.H;

    this.loadImages();
    this.initAmbient();
    this.bindInput();
    this.setScene('start');
    requestAnimationFrame(t => this.loop(t));
  },

  loadImages() {
    const map = {
      idle:  'assets/bobo_idle.png',
      swim:  'assets/bobo_swim.png',
      boost: 'assets/bobo_boost.png',
      hit:   'assets/bobo_hit.png',
      win:   'assets/bobo_win.png',
    };
    for (const [key, src] of Object.entries(map)) {
      const img = new Image();
      img.src = src;
      this.images[key] = img;
    }
  },

  initAmbient() {
    this.bubbles = [];
    for (let i = 0; i < 28; i++) {
      this.bubbles.push(this.newBubble(true));
    }
    this.lightRays = [];
    for (let i = 0; i < 7; i++) {
      this.lightRays.push({
        x: (i / 7 + Math.random() * 0.08) * this.W,
        width: 30 + Math.random() * 60,
        alpha: 0.04 + Math.random() * 0.08,
        speed: 0.0002 + Math.random() * 0.0003,
        phase: Math.random() * Math.PI * 2
      });
    }
  },

  newBubble(randomY) {
    return {
      x: Math.random() * this.W,
      y: randomY ? Math.random() * this.H : this.H + 10,
      r: 2 + Math.random() * 7,
      speed: 0.4 + Math.random() * 0.8,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
      alpha: 0.2 + Math.random() * 0.45
    };
  },

  updateAmbient(dt) {
    const t = this.lastTime;
    for (const b of this.bubbles) {
      b.y -= b.speed;
      b.wobble += b.wobbleSpeed;
      b.x += Math.sin(b.wobble) * 0.5;
      if (b.y < -20) Object.assign(b, this.newBubble(false));
    }
    for (const r of this.lightRays) {
      r.alpha = 0.04 + 0.04 * Math.sin(t * r.speed + r.phase);
    }
  },

  drawOceanBg(ctx) {
    const W = this.W, H = this.H;
    // Deep gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#003566');
    grad.addColorStop(0.4, '#0077b6');
    grad.addColorStop(1, '#023e58');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Light rays
    for (const r of this.lightRays) {
      ctx.save();
      ctx.globalAlpha = r.alpha;
      const rg = ctx.createLinearGradient(r.x, 0, r.x, H);
      rg.addColorStop(0, 'rgba(180,240,255,1)');
      rg.addColorStop(1, 'rgba(0,100,180,0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(r.x - r.width / 2, 0);
      ctx.lineTo(r.x + r.width / 2, 0);
      ctx.lineTo(r.x + r.width * 1.5, H);
      ctx.lineTo(r.x - r.width * 1.5, H);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Bubbles
    for (const b of this.bubbles) {
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(180,230,255,0.8)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = 'rgba(200,240,255,0.18)';
      ctx.fill();
      ctx.restore();
    }

    // Coral floor
    drawCoralFloor(ctx, W, H);
  },

  setScene(name, levelIndex) {
    this.scene = name;
    if (name === 'start') {
      StartScene.init(this);
    } else if (name === 'level') {
      this.currentLevel = levelIndex ?? 0;
      LevelScene.init(this, CoralGardenLevels[this.currentLevel]);
    }
  },

  bindInput() {
    const press = () => { this.inputPressed = true; };
    const release = () => { this.inputPressed = false; };
    window.addEventListener('keydown', e => {
      if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); press(); }
    });
    window.addEventListener('keyup', e => {
      if (e.code === 'Space' || e.code === 'ArrowUp') release();
    });
    this.canvas.addEventListener('pointerdown', e => { e.preventDefault(); press(); this.handleClick(e); });
    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('touchstart', e => { e.preventDefault(); press(); }, { passive: false });
    this.canvas.addEventListener('touchend', e => { e.preventDefault(); release(); }, { passive: false });
  },

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.W / rect.width;
    const scaleY = this.H / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;
    if (this.scene === 'start') StartScene.onClick(this, cx, cy);
    else if (this.scene === 'level') LevelScene.onClick(this, cx, cy);
  },

  loop(t) {
    const dt = Math.min(t - this.lastTime, 50);
    this.lastTime = t;
    this.updateAmbient(dt);

    const ctx = this.ctx;
    this.drawOceanBg(ctx);

    if (this.scene === 'start') StartScene.update(this, dt);
    else if (this.scene === 'level') LevelScene.update(this, dt);

    requestAnimationFrame(ts => this.loop(ts));
  }
};

// --- Coral / seaweed decorations ---
function drawCoralFloor(ctx, W, H) {
  const floorY = H - 60;

  // Sand
  const sand = ctx.createLinearGradient(0, floorY, 0, H);
  sand.addColorStop(0, '#c8a96e');
  sand.addColorStop(1, '#8b6914');
  ctx.fillStyle = sand;
  ctx.fillRect(0, floorY, W, H - floorY);

  // Corals
  const corals = [
    { x: 60, h: 70, c: '#ff6b9d' }, { x: 160, h: 55, c: '#ff9f43' },
    { x: 290, h: 80, c: '#ff6b9d' }, { x: 430, h: 60, c: '#26de81' },
    { x: 580, h: 75, c: '#fd79a8' }, { x: 720, h: 65, c: '#fdcb6e' },
    { x: 860, h: 85, c: '#e17055' }, { x: 980, h: 55, c: '#74b9ff' },
    { x: 1080, h: 70, c: '#a29bfe' },
  ];
  for (const c of corals) {
    drawCoral(ctx, c.x, floorY, c.h, c.c);
  }

  // Seaweed
  const weeds = [110, 250, 370, 510, 650, 790, 930, 1040];
  for (const wx of weeds) {
    drawSeaweed(ctx, wx, floorY, 50 + Math.random() * 30);
  }
}

function drawCoral(ctx, x, baseY, h, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';

  // Main branch
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  ctx.lineTo(x, baseY - h);
  ctx.stroke();

  // Sub-branches
  ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) {
    const by = baseY - h * (0.4 + i * 0.2);
    const side = i % 2 === 0 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(x, by);
    ctx.lineTo(x + side * 22, by - 22);
    ctx.stroke();

    // Tips
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + side * 22, by - 22, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Top tip
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, baseY - h, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSeaweed(ctx, x, baseY, h) {
  ctx.save();
  ctx.strokeStyle = '#2d6a4f';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY);
  for (let i = 0; i < 6; i++) {
    const t = (i + 1) / 6;
    const cx1 = x + (i % 2 === 0 ? 12 : -12);
    const cy1 = baseY - h * t * 0.7;
    const cx2 = x + (i % 2 === 0 ? -8 : 8);
    const cy2 = baseY - h * t;
    ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x, baseY - h * t);
  }
  ctx.stroke();
  ctx.restore();
}
