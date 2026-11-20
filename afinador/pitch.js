/* cifrAmem – Afinador: detecção de altura (McLeod Pitch Method, NSDF via FFT).
   Funciona no navegador (window.CifraPitch) e no Node (module.exports) para testes. */
(function (root) {
  'use strict';

  function FFT(n) {
    this.n = n;
    this.levels = Math.round(Math.log2(n));
    this.cos = new Float64Array(n / 2);
    this.sin = new Float64Array(n / 2);
    for (var i = 0; i < n / 2; i++) {
      this.cos[i] = Math.cos(2 * Math.PI * i / n);
      this.sin[i] = Math.sin(2 * Math.PI * i / n);
    }
    this.rev = new Uint32Array(n);
    for (var j = 0; j < n; j++) {
      var x = j, r = 0;
      for (var b = 0; b < this.levels; b++) { r = (r << 1) | (x & 1); x >>>= 1; }
      this.rev[j] = r;
    }
  }
  // In-place complex FFT (forward).
  FFT.prototype.transform = function (re, im) {
    var n = this.n, rev = this.rev, i, j, k, t;
    for (i = 0; i < n; i++) {
      j = rev[i];
      if (j > i) {
        t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    for (var size = 2; size <= n; size *= 2) {
      var half = size / 2, step = n / size;
      for (i = 0; i < n; i += size) {
        for (j = i, k = 0; j < i + half; j++, k += step) {
          var l = j + half;
          var tre = re[l] * this.cos[k] + im[l] * this.sin[k];
          var tim = -re[l] * this.sin[k] + im[l] * this.cos[k];
          re[l] = re[j] - tre; im[l] = im[j] - tim;
          re[j] += tre; im[j] += tim;
        }
      }
    }
  };

  function Detector(bufferSize) {
    this.N = bufferSize;
    this.M = 1; while (this.M < 2 * bufferSize) this.M *= 2;
    this.fft = new FFT(this.M);
    this.re = new Float64Array(this.M);
    this.im = new Float64Array(this.M);
    this.nsdf = new Float64Array(bufferSize);
    this.x = new Float64Array(bufferSize);
    // Spectral refinement: Hann window, zero-padded 4x
    this.P = 4 * bufferSize;
    this.fft4 = new FFT(this.P);
    this.sre = new Float64Array(this.P);
    this.sim = new Float64Array(this.P);
    this.hann = new Float64Array(bufferSize);
    // 4-term Blackman-Harris (sidelobes ~ -92 dB) to keep strong harmonics from leaking
    for (var i = 0; i < bufferSize; i++) {
      var w = 2 * Math.PI * i / (bufferSize - 1);
      this.hann[i] = 0.35875 - 0.48829 * Math.cos(w) + 0.14128 * Math.cos(2 * w) - 0.01168 * Math.cos(3 * w);
    }
  }

  /* Spectrum peaks (Blackman-Harris, 4x zero padding) of the current frame in this.x.
     Fills this.pk = [{f, a}] (frequency Hz, linear amplitude), strongest first. */
  Detector.prototype.spectrum = function (sr, fmax) {
    var N = this.N, P = this.P, re = this.sre, im = this.sim, x = this.x, h = this.hann, i;
    for (i = 0; i < N; i++) { re[i] = x[i] * h[i]; im[i] = 0; }
    for (i = N; i < P; i++) { re[i] = 0; im[i] = 0; }
    this.fft4.transform(re, im);
    var binHz = sr / P, hiBin = Math.min(P / 2 - 2, Math.floor(fmax / binHz)), loBin = Math.max(2, Math.floor(18 / binHz));
    var maxP = 0;
    for (i = loBin - 1; i <= hiBin + 1; i++) { re[i] = re[i] * re[i] + im[i] * im[i]; if (re[i] > maxP) maxP = re[i]; }
    var floor = maxP * 1e-5; // −50 dB
    var pk = [];
    for (i = loBin; i <= hiBin; i++) {
      var v = re[i];
      if (v > floor && v > re[i - 1] && v >= re[i + 1]) {
        var a = Math.log(re[i - 1] + 1e-30), b = Math.log(v), c = Math.log(re[i + 1] + 1e-30);
        var den = a - 2 * b + c, d = den !== 0 ? 0.5 * (a - c) / den : 0;
        if (d > 1 || d < -1) d = 0;
        pk.push({ f: (i + d) * binHz, a: Math.sqrt(Math.exp(b - 0.25 * (a - c) * d)) });
      }
    }
    pk.sort(function (p1, p2) { return p2.a - p1.a; });
    if (pk.length > 48) pk.length = 48;
    this.pk = pk;
    return pk;
  };

  // strongest spectral peak within ±tol cents of f
  Detector.prototype.peakNear = function (f, tol) {
    var pk = this.pk, r = Math.pow(2, tol / 1200), lo = f / r, hi = f * r, best = null;
    for (var i = 0; i < pk.length; i++) {
      var p = pk[i];
      if (p.f >= lo && p.f <= hi && (!best || p.a > best.a)) best = p;
    }
    return best;
  };

  // Harmonic-sum score: how well a harmonic series on f0 explains the spectrum
  Detector.prototype.score = function (f0, fmax) {
    var s = 0, w = 1, used = [], expl = 0;
    for (var hN = 1; hN <= 10 && hN * f0 < fmax; hN++, w *= 0.84) {
      var p = this.peakNear(hN * f0, 22 + 4 * hN);
      if (p && used.indexOf(p) < 0) { used.push(p); s += w * p.a; expl += p.a; }
    }
    return { s: s, expl: expl };
  };

  /* Returns {freq, clarity, rms}; freq = 0 when no clear note.
     opts: sampleRate, minFreq, maxFreq, minClarity (0..1), minRms */
  Detector.prototype.detect = function (input, opts) {
    var N = this.N, x = this.x, i;
    var sr = opts.sampleRate;
    var mean = 0;
    for (i = 0; i < N; i++) mean += input[i];
    mean /= N;
    var energy = 0;
    for (i = 0; i < N; i++) { x[i] = input[i] - mean; energy += x[i] * x[i]; }
    var rms = Math.sqrt(energy / N);
    var none = { freq: 0, clarity: 0, rms: rms };
    if (rms < (opts.minRms || 0)) return none;

    // 1) MPM (autocorrelation) estimate: good candidate for clean single notes
    var mpm = this.mpm(sr, opts);

    // 2) Spectrum + harmonic-sum decision: robust when other strings ring along
    var fmax = Math.min(sr * 0.46, opts.maxFreq * 10);
    this.fmax = fmax;
    var pk = this.spectrum(sr, fmax);
    if (!pk.length) return none;
    var cands = [];
    if (mpm) cands.push(mpm, mpm / 2, mpm * 2, mpm / 3);
    for (i = 0; i < Math.min(8, pk.length); i++) for (var hN = 1; hN <= 4; hN++) cands.push(pk[i].f / hN);
    var best = 0, bestS = null;
    for (i = 0; i < cands.length; i++) {
      var f = cands[i];
      if (f < opts.minFreq * 0.97 || f > opts.maxFreq * 1.03) continue;
      var sc = this.score(f, fmax);
      if (!bestS || sc.s > bestS.s * 1.0001) { best = f; bestS = sc; }
    }
    if (!bestS || bestS.s <= 0) return none;
    var total = 0;
    for (i = 0; i < pk.length; i++) total += pk[i].a;
    var clarity = total > 0 ? bestS.expl / total : 0;

    // 3) Precise frequency: the fundamental partial, or the 2nd partial / 2 if the fundamental is weak
    var p1 = this.peakNear(best, 30), p2 = this.peakNear(2 * best, 34), freq = best;
    if (p1 && (!p2 || p1.a >= 0.3 * p2.a)) freq = p1.f;
    else if (p2) freq = p2.f / 2;
    else if (mpm && Math.abs(1200 * Math.log2(mpm / best)) < 30) freq = mpm;
    if (!p1 && !p2) return { freq: 0, clarity: clarity, rms: rms };
    if (clarity < (opts.minClarity || 0)) return { freq: 0, clarity: clarity, rms: rms };
    if (freq < opts.minFreq * 0.97 || freq > opts.maxFreq * 1.03) return { freq: 0, clarity: clarity, rms: rms };
    return { freq: freq, clarity: clarity, rms: rms, score: bestS.s };
  };

  /* Follows a known note in the last analysed frame: looks for its fundamental
     (or 2nd partial) within ±tol cents of f. Returns {freq, s} or null. */
  Detector.prototype.track = function (f, tol) {
    if (!this.pk || !this.pk.length) return null;
    var p1 = this.peakNear(f, tol), p2 = this.peakNear(2 * f, tol + 4), f0 = 0;
    if (p1 && (!p2 || p1.a >= 0.3 * p2.a)) f0 = p1.f;
    else if (p2) f0 = p2.f / 2;
    if (!f0) return null;
    return { freq: f0, s: this.score(f0, this.fmax).s };
  };

  // McLeod Pitch Method on this.x; returns frequency or 0
  Detector.prototype.mpm = function (sr, opts) {
    var N = this.N, x = this.x, i, energy = 0;
    for (i = 0; i < N; i++) energy += x[i] * x[i];
    var re = this.re, im = this.im, M = this.M;
    for (i = 0; i < N; i++) { re[i] = x[i]; im[i] = 0; }
    for (i = N; i < M; i++) { re[i] = 0; im[i] = 0; }
    this.fft.transform(re, im);
    for (i = 0; i < M; i++) { re[i] = re[i] * re[i] + im[i] * im[i]; im[i] = 0; }
    this.fft.transform(re, im); // P is real & symmetric -> forward FFT == M * IFFT
    var minTau = Math.max(2, Math.floor(sr / opts.maxFreq));
    var maxTau = Math.min(Math.floor(N / 2), Math.ceil(sr / opts.minFreq) + 2);
    var nsdf = this.nsdf, m = 2 * energy, tau;
    nsdf[0] = 1;
    for (tau = 1; tau <= maxTau; tau++) {
      m -= x[tau - 1] * x[tau - 1] + x[N - tau] * x[N - tau];
      nsdf[tau] = m > 1e-12 ? 2 * (re[tau] / M) / m : 0;
    }
    var peaks = [], curMaxTau = -1, curMax = -Infinity;
    tau = 1;
    while (tau < maxTau && nsdf[tau] > 0) tau++;
    while (tau < maxTau && nsdf[tau] <= 0) tau++;
    for (; tau < maxTau; tau++) {
      if (nsdf[tau] > 0) {
        if (nsdf[tau] > curMax && nsdf[tau] >= nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1]) { curMax = nsdf[tau]; curMaxTau = tau; }
      } else if (curMaxTau > 0) { peaks.push(curMaxTau); curMax = -Infinity; curMaxTau = -1; }
    }
    if (curMaxTau > 0) peaks.push(curMaxTau);
    if (!peaks.length) return 0;
    var top = 0;
    for (i = 0; i < peaks.length; i++) if (nsdf[peaks[i]] > top) top = nsdf[peaks[i]];
    if (top < 0.5) return 0;
    var k = opts.threshold || 0.9, chosen = -1;
    for (i = 0; i < peaks.length; i++) if (peaks[i] >= minTau && nsdf[peaks[i]] >= k * top) { chosen = peaks[i]; break; }
    if (chosen < 0) return 0;
    var a = nsdf[chosen - 1], b = nsdf[chosen], c = nsdf[chosen + 1], den = a - 2 * b + c, shift = 0;
    if (den !== 0) { shift = 0.5 * (a - c) / den; if (shift > 1 || shift < -1) shift = 0; }
    return sr / (chosen + shift);
  };

  var api = { Detector: Detector, FFT: FFT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CifraPitch = api;
})(this);
