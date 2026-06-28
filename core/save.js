const Save = {
  KEY: 'bobo_ocean_v2',
  d: null,

  init() {
    try {
      const raw = localStorage.getItem(this.KEY);
      this.d = raw ? JSON.parse(raw) : this._blank();
    } catch(e) { this.d = this._blank(); }
  },

  _blank() {
    return {
      levels: Array(10).fill(null).map((_, i) => ({
        stars: 0, bestScore: 0, unlocked: i === 0
      })),
      totalScore: 0,
      totalShells: 0,
    };
  },

  save() {
    try { localStorage.setItem(this.KEY, JSON.stringify(this.d)); } catch(e) {}
  },

  isUnlocked(idx) {
    return idx === 0 || (this.d.levels[idx] && this.d.levels[idx].unlocked);
  },

  getStars(idx) { return this.d.levels[idx]?.stars ?? 0; },

  calcStars(completed, allShells, noHits) {
    if (!completed) return 0;
    if (noHits && allShells) return 3;
    if (allShells) return 2;
    return 1;
  },

  recordLevel(idx, stars, score, shells) {
    const L = this.d.levels[idx];
    if (!L) return;
    L.stars = Math.max(L.stars, stars);
    L.bestScore = Math.max(L.bestScore, score);
    // Unlock next
    if (idx + 1 < this.d.levels.length) this.d.levels[idx + 1].unlocked = true;
    this.d.totalScore += score;
    this.d.totalShells += shells;
    this.save();
  }
};
