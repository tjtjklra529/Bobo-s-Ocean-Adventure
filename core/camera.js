const Camera = {
  shakePow: 0,
  shakeX: 0,
  shakeY: 0,
  flashAlpha: 0,
  flashColor: '#ff4d6d',
  DECAY: 0.87,

  shake(power) {
    this.shakePow = Math.max(this.shakePow, power);
  },

  flash(color, alpha) {
    this.flashColor = color || '#ff4d6d';
    this.flashAlpha = alpha || 0.45;
  },

  update() {
    if (this.shakePow > 0.3) {
      this.shakeX = (Math.random() - 0.5) * this.shakePow;
      this.shakeY = (Math.random() - 0.5) * this.shakePow;
      this.shakePow *= this.DECAY;
    } else {
      this.shakeX = 0; this.shakeY = 0; this.shakePow = 0;
    }
    if (this.flashAlpha > 0) this.flashAlpha -= 0.04;
  },

  apply(ctx) {
    ctx.save();
    ctx.translate(Math.round(this.shakeX), Math.round(this.shakeY));
  },

  restore(ctx) {
    ctx.restore();
  },

  drawFlash(ctx, W, H) {
    if (this.flashAlpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.flashAlpha);
    ctx.fillStyle = this.flashColor;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
};
