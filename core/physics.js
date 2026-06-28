const Physics = {
  GRAVITY: 0.26,
  LIFT: -0.54,
  MAX_DOWN: 5.8,
  MAX_UP: -7.5,
  DAMPING: 0.985,

  update(player, inputPressed) {
    if (inputPressed) {
      player.vy += this.LIFT;
    } else {
      player.vy += this.GRAVITY;
    }
    player.vy *= this.DAMPING;
    player.vy = Math.max(this.MAX_UP, Math.min(this.MAX_DOWN, player.vy));
    player.y += player.vy;
  }
};
