/* ─── Web Audio Engine ─── */
const Audio = {
  ctx: null,
  master: null,
  musicBus: null,
  sfxBus: null,
  reverb: null,
  lowpass: null,
  compressor: null,
  muted: false,
  musicStarted: false,

  // Scheduler state
  nextBeat: 0,
  beatIdx: 0,
  chordIdx: 0,
  scheduler: null,
  chordTimer: null,
  activeNodes: [],    // { osc, gain } for cleanup

  NOTE: {
    A1:55, E2:82.41,
    A2:110, B2:123.47, C3:130.81, D3:146.83, E3:164.81, G3:196,
    A3:220, B3:246.94, C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392,
    A4:440, B4:493.88, C5:523.25, D5:587.33, E5:659.25, G5:783.99,
    A5:880, C6:1046.5
  },

  init() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();

      // Dynamics
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -14;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.2;
      this.compressor.connect(this.ctx.destination);

      this.master = this.ctx.createGain();
      this.master.gain.value = 0.8;
      this.master.connect(this.compressor);

      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = 0.55;
      this.musicBus.connect(this.master);

      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = 0.85;
      this.sfxBus.connect(this.master);

      // Underwater reverb (convolution)
      this.reverb = this._buildReverb(1.8);
      const reverbGain = this.ctx.createGain();
      reverbGain.gain.value = 0.45;
      this.reverb.connect(reverbGain);
      reverbGain.connect(this.musicBus);

      // Dry path through low-pass for underwater muffle
      this.lowpass = this.ctx.createBiquadFilter();
      this.lowpass.type = 'lowpass';
      this.lowpass.frequency.value = 1100;
      this.lowpass.Q.value = 0.4;
      this.lowpass.connect(this.musicBus);

      // Ambient water noise
      this._startWaterNoise();
    } catch(e) { console.warn('Audio init failed:', e); }
  },

  _buildReverb(duration) {
    const conv = this.ctx.createConvolver();
    const sr = this.ctx.sampleRate;
    const len = Math.floor(sr * duration);
    const buf = this.ctx.createBuffer(2, len, sr);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++)
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
    }
    conv.buffer = buf;
    return conv;
  },

  _startWaterNoise() {
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, sr * 3, sr);
    const d = buf.getChannelData(0);
    let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0;
    for (let i = 0; i < d.length; i++) {
      const wn = Math.random() * 2 - 1;
      b0 = 0.99886*b0 + wn*0.0555179; b1 = 0.99332*b1 + wn*0.0750759;
      b2 = 0.96900*b2 + wn*0.1538520; b3 = 0.86650*b3 + wn*0.3104856;
      b4 = 0.55000*b4 + wn*0.5329522; b5 = -0.7616*b5 - wn*0.0168980;
      d[i] = (b0+b1+b2+b3+b4+b5+wn*0.5362) * 0.11;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const g = this.ctx.createGain(); g.gain.value = 0.04;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass';
    f.frequency.value = 280; f.Q.value = 0.6;
    src.connect(f); f.connect(g); g.connect(this.musicBus);
    src.start();
    this._waterNoise = src;
  },

  // ─── Background Music ───
  startMusic() {
    if (!this.ctx || this.musicStarted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.musicStarted = true;

    this._startBass();
    this._startPad();
    this._startArp();
    this.nextBeat = this.ctx.currentTime + 0.1;
    this.beatIdx = 0;
    this._scheduleMelody();
    this.scheduler = setInterval(() => this._scheduleMelody(), 80);
  },

  _startBass() {
    // Rich sub-bass: two detuned sines for warmth
    const N = this.NOTE;
    [N.A2, N.A2 * 1.003].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = i === 0 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      g.gain.value = i === 0 ? 0.26 : 0.1;
      osc.connect(g);
      g.connect(this.reverb);
      g.connect(this.lowpass);
      osc.start();
      this.activeNodes.push({ osc });
      if (i === 0) { this._bassOsc = osc; this._bassGain = g; }
    });
  },

  _startPad() {
    const N = this.NOTE;
    // Am - F - C - G7 : richer voicing with detuned pairs
    const CHORDS = [
      [N.A2, N.E3, N.A3, N.C4, N.E4, N.A4],
      [N.F2||87.31, N.C3, N.F3, N.A3, N.C4, N.F4||349.23],
      [N.C3, N.G3, N.C4, N.E4, N.G4, N.C5],
      [N.G2||98, N.D3, N.G3, N.B3||246.94, N.D4||293.66, N.G4],
    ];
    this._padOscs = CHORDS[0].map((freq, vi) => {
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator(); // detuned twin
      const g = this.ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      osc2.type = 'sine';    osc2.frequency.value = freq * 1.005;
      g.gain.value = vi < 2 ? 0.042 : 0.028; // bass notes louder
      osc.connect(g); osc2.connect(g);
      g.connect(this.reverb);
      osc.start(); osc2.start();
      this.activeNodes.push({ osc }, { osc: osc2 });
      return { osc, osc2, g };
    });
    this.chordIdx = 0;
    // Advance chord every 2 bars (at BPM 88, 8 beats = ~5.45s)
    const BAR = (60 / 88) * 8;
    this.chordTimer = setInterval(() => {
      this.chordIdx = (this.chordIdx + 1) % CHORDS.length;
      const now = this.ctx.currentTime;
      const freqs = CHORDS[this.chordIdx];
      this._padOscs.forEach((p, i) => {
        p.osc.frequency.setTargetAtTime(freqs[i], now, 0.55);
        p.osc2.frequency.setTargetAtTime(freqs[i] * 1.005, now, 0.55);
      });
      // Bass root follows
      const bassRoots = [N.A2, N.F2||87.31, N.C3, N.G2||98];
      if (this._bassOsc) this._bassOsc.frequency.setTargetAtTime(bassRoots[this.chordIdx], now, 0.35);
    }, BAR * 1000);
  },

  _startArp() {
    // Twinkling high arpeggio: triangle wave, fast 16th notes at BPM 88
    const N = this.NOTE;
    const ARP_SEQS = [
      [N.A4, N.C5, N.E5, N.A5],
      [N.A4, N.C5, N.F4||349.23, N.A4],
      [N.G4, N.C5, N.E5, N.G5||783.99],
      [N.G4, N.B4||493.88, N.D5||587.33, N.G5||783.99],
    ];
    this._arpIdx = 0;
    this._arpSeqIdx = 0;
    const BEAT = 60 / 88;
    const arpStep = () => {
      if (!this.ctx || !this.musicStarted) return;
      const seq = ARP_SEQS[this.chordIdx % ARP_SEQS.length];
      const freq = seq[this._arpIdx % seq.length];
      this._arpIdx++;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * 2; // upper octave shimmer
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.038, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.001, t + BEAT * 0.38);
      osc.connect(g); g.connect(this.reverb);
      osc.start(t); osc.stop(t + BEAT * 0.4);
    };
    this._arpTimer = setInterval(arpStep, (60 / 88 / 2) * 1000); // 8th notes
    this.activeNodes.push({ osc: { stop: () => clearInterval(this._arpTimer) } });
  },

  // Melody sequence: 32-step, two-bar phrase, catchy & oceanic
  _MELODY: null,
  _HARMONY: null,
  _getMelody() {
    if (this._MELODY) return this._MELODY;
    const N = this.NOTE;
    const R = 0; // rest marker
    // Main melody: A minor pentatonic, bouncy & memorable
    this._MELODY = [
      N.E5,   N.A4,   N.C5,   N.E5,   N.G5||783.99, N.E5,   N.C5,   N.A4,
      N.D5||587.33, N.C5, N.A4, N.C5,  N.E5,   N.D5||587.33, N.C5, R,
      N.A4,   N.C5,   N.E5,   N.G5||783.99, N.A5, N.G5||783.99, N.E5, N.C5,
      N.E5,   N.D5||587.33, N.C5, N.A4, N.G4,  N.A4,   N.C5,   R,
    ];
    // Harmony: thirds below melody
    this._HARMONY = [
      N.C5,   N.E4,   N.A4,   N.C5,   N.E5,  N.C5,  N.A4,  N.E4,
      N.B4||493.88, N.A4, N.E4, N.A4, N.C5,  N.B4||493.88, N.A4, R,
      N.E4,   N.A4,   N.C5,   N.E5,   N.G5||783.99, N.E5, N.C5, N.A4,
      N.C5,   N.B4||493.88, N.A4, N.E4, N.E4,  N.E4,  N.A4,  R,
    ];
    return this._MELODY;
  },

  _scheduleMelody() {
    if (!this.ctx) return;
    const BPM = 88;
    const BEAT = 60 / BPM;
    const AHEAD = 0.22;
    const M = this._getMelody();
    const H = this._HARMONY;
    while (this.nextBeat < this.ctx.currentTime + AHEAD) {
      const step = this.beatIdx % M.length;
      const mFreq = M[step];
      const hFreq = H[step];
      const isLong = step % 8 === 0;
      const dur = BEAT * (isLong ? 1.6 : 0.85);
      if (mFreq) this._schedNote(mFreq, this.nextBeat, dur, 0.082, false);
      if (hFreq) this._schedNote(hFreq, this.nextBeat, dur, 0.038, true);
      this.nextBeat += BEAT * 0.5; // 8th-note grid
      this.beatIdx++;
    }
  },

  _schedNote(freq, t, dur, vol, isHarmony) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = isHarmony ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    // Gentle vibrato on main melody
    if (!isHarmony) {
      const vib = this.ctx.createOscillator();
      const vibG = this.ctx.createGain();
      vib.type = 'sine'; vib.frequency.value = 5.8;
      vibG.gain.value = 3.5;
      vib.connect(vibG); vibG.connect(osc.frequency);
      vib.start(t); vib.stop(t + dur + 0.05);
    }
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.04);
    g.gain.setValueAtTime(vol * 0.7, t + dur * 0.55);
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(g);
    g.connect(this.reverb);
    if (!isHarmony) g.connect(this.lowpass);
    osc.start(t); osc.stop(t + dur + 0.05);
  },

  stopMusic() {
    this.musicStarted = false;
    if (this.scheduler)  { clearInterval(this.scheduler);  this.scheduler  = null; }
    if (this.chordTimer) { clearInterval(this.chordTimer); this.chordTimer = null; }
    if (this._arpTimer)  { clearInterval(this._arpTimer);  this._arpTimer  = null; }
    this.activeNodes.forEach(n => { try { n.osc.stop(); } catch(e){} });
    this.activeNodes = [];
    if (this._padOscs) {
      this._padOscs.forEach(p => {
        try { p.osc.stop(); } catch(e){}
        try { p.osc2.stop(); } catch(e){}
      });
      this._padOscs = null;
    }
    this._MELODY = null;
    this._HARMONY = null;
  },

  // ─── SFX ───
  sfx(name) {
    if (!this.ctx || this.muted) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    switch(name) {
      case 'jump':     this._sfxJump(t); break;
      case 'shell':    this._sfxShell(t); break;
      case 'star':     this._sfxStar(t); break;
      case 'hit':      this._sfxHit(t); break;
      case 'complete': this._sfxComplete(t); break;
      case 'shield':   this._sfxShield(t); break;
      case 'click':    this._sfxClick(t); break;
      case 'combo':    this._sfxCombo(t); break;
    }
  },

  _tone(freq, t, dur, vol, type='sine', dest=null, freqEnd=null) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(vol, t + Math.min(0.015, dur * 0.1));
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g); g.connect(dest || this.sfxBus);
    osc.start(t); osc.stop(t + dur + 0.05);
  },

  _sfxJump(t) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(560, t + 0.13);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g); g.connect(this.sfxBus);
    osc.start(t); osc.stop(t + 0.22);
  },

  _sfxShell(t) {
    [523.25, 659.25, 783.99].forEach((f, i) => {
      this._tone(f, t + i * 0.075, 0.22, 0.28, 'sine');
    });
  },

  _sfxStar(t) {
    [880, 1108.73, 1318.51].forEach((f, i) => {
      this._tone(f, t + i * 0.045, 0.1, 0.18, 'sine');
    });
  },

  _sfxHit(t) {
    // Low thump
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.18);
    g.gain.setValueAtTime(0.55, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    osc.connect(g); g.connect(this.sfxBus);
    osc.start(t); osc.stop(t + 0.32);
    // Crunch noise
    this._noise(t, 0.12, 0.12, 500);
  },

  _noise(t, vol, dur, cutoff) {
    const sr = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, Math.ceil(sr * dur), sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus);
    src.start(t);
  },

  _sfxComplete(t) {
    [523.25, 659.25, 783.99, 1046.5, 1318.51].forEach((f, i) => {
      this._tone(f, t + i * 0.1, 0.38, 0.24, 'sine');
    });
    this._tone(261.63, t, 0.55, 0.18, 'triangle');
  },

  _sfxShield(t) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, t);
    osc.frequency.exponentialRampToValueAtTime(1400, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.35);
    g.gain.setValueAtTime(0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
    osc.connect(g); g.connect(this.sfxBus);
    osc.start(t); osc.stop(t + 0.48);
  },

  _sfxClick(t) {
    this._tone(600, t, 0.06, 0.22, 'sine');
  },

  _sfxCombo(t) {
    // Ascending pitch for each combo level
    const baseFreq = 440 * Math.pow(1.3, Math.min(Game.combo - 1, 4));
    this._tone(baseFreq, t, 0.12, 0.22, 'sine');
  },

  toggleMute() {
    this.muted = !this.muted;
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.8;
    return this.muted;
  },

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }
};
