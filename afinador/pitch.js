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

  /* Measures the fundamental partial precisely around a rough estimate (Hz).
     Returns refined frequency or the rough one if no clear peak. */
  Detector.prototype.refine = function (rough, sr) {
    var N = this.N, P = this.P, re = this.sre, im = this.sim, x = this.x, h = this.hann, i;
    for (i = 0; i < N; i++) { re[i] = x[i] * h[i]; im[i] = 0; }
    for (i = N; i < P; i++) { re[i] = 0; im[i] = 0; }
    this.fft4.transform(re, im);
    var binHz = sr / P;
    var lo = Math.max(2, Math.floor(rough * Math.pow(2, -35 / 1200) / binHz));
    var hi = Math.min(P / 2 - 2, Math.ceil(rough * Math.pow(2, 35 / 1200) / binHz));
    var best = -1, bestMag = 0;
    for (i = lo; i <= hi; i++) {
      var mg = re[i] * re[i] + im[i] * im[i];
      if (mg > bestMag) { bestMag = mg; best = i; }
    }
    if (best <= lo || best >= hi) return rough; // edge: not a true local peak
    // Only trust the fundamental if it is not much weaker than the 2nd partial
    var h2 = Math.round(2 * (best) ), h2max = 0;
    for (i = h2 - 8; i <= h2 + 8 && i < P / 2; i++) {
      var m2 = re[i] * re[i] + im[i] * im[i];
      if (m2 > h2max) h2max = m2;
    }
    if (bestMag < 0.1 * h2max) return rough; // fundamental < ~ -10 dB of 2nd partial
    var mag = function (k) { return Math.log(re[k] * re[k] + im[k] * im[k] + 1e-30); };
    var a = mag(best - 1), b = mag(best), c = mag(best + 1);
    var den = a - 2 * b + c;
    var d = den !== 0 ? 0.5 * (a - c) / den : 0;
    if (d > 1 || d < -1) d = 0;
    var f = (best + d) * binHz;
    return Math.abs(1200 * Math.log2(f / rough)) < 30 ? f : rough;
  };

  /* Returns {freq, clarity, rms} or null.
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
    if (rms < (opts.minRms || 0)) return { freq: 0, clarity: 0, rms: rms };

    // Autocorrelation via FFT
    var re = this.re, im = this.im, M = this.M;
    for (i = 0; i < N; i++) { re[i] = x[i]; im[i] = 0; }
    for (i = N; i < M; i++) { re[i] = 0; im[i] = 0; }
    this.fft.transform(re, im);
    for (i = 0; i < M; i++) { re[i] = re[i] * re[i] + im[i] * im[i]; im[i] = 0; }
    this.fft.transform(re, im); // P is real & symmetric -> forward FFT == M * IFFT
    var minTau = Math.max(2, Math.floor(sr / opts.maxFreq));
    var maxTau = Math.min(Math.floor(N / 2), Math.ceil(sr / opts.minFreq) + 2);

    // NSDF n(τ) = 2 r(τ) / m(τ)
    var nsdf = this.nsdf, m = 2 * energy;
    nsdf[0] = 1;
    for (var tau = 1; tau <= maxTau; tau++) {
      m -= x[tau - 1] * x[tau - 1] + x[N - tau] * x[N - tau];
      nsdf[tau] = m > 1e-12 ? 2 * (re[tau] / M) / m : 0;
    }

    // Key maxima between positive-going zero crossings (MPM)
    var peaks = [], curMaxTau = -1, curMax = -Infinity;
    tau = 1;
    while (tau < maxTau && nsdf[tau] > 0) tau++;          // skip first lobe
    while (tau < maxTau && nsdf[tau] <= 0) tau++;
    for (; tau < maxTau; tau++) {
      if (nsdf[tau] > 0) {
        if (nsdf[tau] > curMax && nsdf[tau] >= nsdf[tau - 1] && nsdf[tau] >= nsdf[tau + 1]) {
          curMax = nsdf[tau]; curMaxTau = tau;
        }
      } else if (curMaxTau > 0) {
        peaks.push(curMaxTau); curMax = -Infinity; curMaxTau = -1;
      }
    }
    if (curMaxTau > 0) peaks.push(curMaxTau);
    if (!peaks.length) return { freq: 0, clarity: 0, rms: rms };

    var best = 0;
    for (i = 0; i < peaks.length; i++) if (nsdf[peaks[i]] > best) best = nsdf[peaks[i]];
    var k = opts.threshold || 0.9, chosen = -1;
    for (i = 0; i < peaks.length; i++) {
      if (peaks[i] >= minTau && nsdf[peaks[i]] >= k * best) { chosen = peaks[i]; break; }
    }
    if (chosen < 0) return { freq: 0, clarity: 0, rms: rms };

    // Parabolic interpolation
    var a = nsdf[chosen - 1], b = nsdf[chosen], c = nsdf[chosen + 1];
    var den = a - 2 * b + c, shift = 0, peakVal = b;
    if (den !== 0) {
      shift = 0.5 * (a - c) / den;
      if (shift > 1 || shift < -1) shift = 0;
      peakVal = b - 0.25 * (a - c) * shift;
    }
    var period = chosen + shift;
    var clarity = Math.min(1, peakVal);
    if (clarity < (opts.minClarity || 0)) return { freq: 0, clarity: clarity, rms: rms };
    var freq = sr / period;
    if (opts.refine !== false) freq = this.refine(freq, sr);
    if (freq < opts.minFreq * 0.97 || freq > opts.maxFreq * 1.03) return { freq: 0, clarity: clarity, rms: rms };
    return { freq: freq, clarity: clarity, rms: rms };
  };

  var api = { Detector: Detector, FFT: FFT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CifraPitch = api;
})(this);
