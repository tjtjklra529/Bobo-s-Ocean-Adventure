const Physics = {
  GRAVITY: 0.28,
  LIFT: -0.52,
  MAX_VEL_DOWN: 6,
  MAX_VEL_UP: -7,

  update(player, inputPressed) {
    if (inputPressed) {
      player.vy += this.LIFT;
    } else {
      player.vy += this.GRAVITY;
    }
    player.vy = Math.max(this.MAX_VEL_UP, Math.min(this.MAX_VEL_DOWN, player.vy));
    player.y += player.vy;
  }
};
