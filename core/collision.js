const Collision = {
  rectRect(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  },

  circleRect(cx, cy, cr, rx, ry, rw, rh) {
    const nearX = Math.max(rx, Math.min(cx, rx + rw));
    const nearY = Math.max(ry, Math.min(cy, ry + rh));
    const dx = cx - nearX;
    const dy = cy - nearY;
    return dx * dx + dy * dy < cr * cr;
  },

  check(player, obstacles, collectibles, onHit, onCollect) {
    const pr = player.radius;
    const px = player.x;
    const py = player.y;

    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (this.circleRect(px, py, pr - 4, o.x, o.y, o.w, o.h)) {
        onHit(o, i);
      }
    }

    for (let i = collectibles.length - 1; i >= 0; i--) {
      const c = collectibles[i];
      const dx = px - (c.x + c.r);
      const dy = py - (c.y + c.r);
      if (dx * dx + dy * dy < (pr + c.r - 4) * (pr + c.r - 4)) {
        onCollect(c, i);
      }
    }
  }
};
