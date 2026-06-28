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
    this.nextBeat = this.ctx.currentTime + 0.1;
    this.beatIdx = 0;
    this._scheduleMelody();
    this.scheduler = setInterval(() => this._scheduleMelody(), 120);
  },

  _startBass() {
    const N = this.NOTE;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lfo = this.ctx.createOscillator();
    const lfoG = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = N.A2;
    lfo.type = 'sine'; lfo.frequency.value = 0.12;
    lfoG.gain.value = 1.5;
    lfo.connect(lfoG); lfoG.connect(osc.frequency);
    gain.gain.value = 0.22;
    osc.connect(gain); gain.connect(this.reverb); gain.connect(this.lowpass);
    osc.start(); lfo.start();
    this.activeNodes.push({ osc }, { osc: lfo });
    this._bassGain = gain;
    this._bassOsc = osc;
  },

  _startPad() {
    const N = this.NOTE;
    const CHORDS = [
      [N.E3, N.A3, N.C4, N.E4],
      [N.C3, N.F3, N.A3, N.C4],
      [N.C3, N.E3, N.G3, N.C4],
      [N.G2, N.D3, N.G3, N.B3],
    ];
    this._padOscs = CHORDS[0].map(freq => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      g.gain.value = 0.055;
      osc.connect(g); g.connect(this.reverb);
      osc.start();
      this.activeNodes.push({ osc });
      return { osc, g };
    });
    this.chordIdx = 0;
    this.chordTimer = setInterval(() => {
      this.chordIdx = (this.chordIdx + 1) % CHORDS.length;
      const now = this.ctx.currentTime;
      const freqs = CHORDS[this.chordIdx];
      this._padOscs.forEach((p, i) => {
        p.osc.frequency.setTargetAtTime(freqs[i], now, 0.6);
      });
      // Bass follows chord root
      const bassMap = [N.A2, N.F2||87.31, N.C3, N.G2||98];
      if (this._bassOsc) this._bassOsc.frequency.setTargetAtTime(bassMap[this.chordIdx], now, 0.4);
    }, 6000);
  },

  _MELODY: null,
  _getMelody() {
    if (this._MELODY) return this._MELODY;
    const N = this.NOTE;
    return this._MELODY = [
      N.A4, N.G4, N.E4, N.A4, N.C5, N.A4, N.G4, N.E4,
      N.C4, N.E4, N.G4, N.A4, N.G4, N.E4, N.D4||293.66, N.E4,
    ];
  },

  _scheduleMelody() {
    if (!this.ctx) return;
    const BPM = 76;
    const BEAT = 60 / BPM;
    const AHEAD = 0.28;
    const M = this._getMelody();
    while (this.nextBeat < this.ctx.currentTime + AHEAD) {
      if (this.beatIdx % 2 === 0) {
        const f = M[Math.floor(this.beatIdx / 2) % M.length];
        const dur = BEAT * (this.beatIdx % 8 === 0 ? 1.5 : 1);
        this._schedNote(f, this.nextBeat, dur, 0.075);
      }
      this.nextBeat += BEAT;
      this.beatIdx++;
    }
  },

  _schedNote(freq, t, dur, vol) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const vib = this.ctx.createOscillator();
    const vibG = this.ctx.createGain();
    osc.type = 'sine'; osc.frequency.value = freq;
    vib.type = 'sine'; vib.frequency.value = 5.5;
    vibG.gain.value = 4;
    vib.connect(vibG); vibG.connect(osc.frequency);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.06);
    g.gain.setValueAtTime(vol * 0.65, t + dur * 0.6);
    g.gain.linearRampToValueAtTime(0, t + dur);
    osc.connect(g); g.connect(this.reverb);
    osc.start(t); vib.start(t);
    osc.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
  },

  stopMusic() {
    this.musicStarted = false;
    if (this.scheduler) { clearInterval(this.scheduler); this.scheduler = null; }
    if (this.chordTimer) { clearInterval(this.chordTimer); this.chordTimer = null; }
    this.activeNodes.forEach(n => { try { n.osc.stop(); } catch(e){} });
    this.activeNodes = [];
    if (this._padOscs) { this._padOscs.forEach(p => { try { p.osc.stop(); } catch(e){} }); this._padOscs = null; }
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
