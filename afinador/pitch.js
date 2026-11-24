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

  /* ===================================================================
     ESTÁGIO DE PRECISÃO — "estroboscópio digital"
     - Lock-in (demodulação síncrona) em h·fRef, h = 1..H, com fase
       referida ao contador ABSOLUTO de amostras.
     - Janela de Hann com número INTEIRO de períodos de fRef (como a
       IEC 61000-4-7): os harmônicos vizinhos caem nos zeros da janela.
     - Frequência de cada harmônico pela rotação de fase entre medidas:
       f_h = h·fRef + Δφ·sr / (2π·Δn)   (Δn = amostras exatas entre medidas)
     - Ajuste da série harmônica com inarmonicidade, ponderado pela
       energia de cada harmônico:  f_h/h = f0·√(1+B·h²) ≈ a + b·h²
       → devolve f1 = a + b  (frequência da fundamental real).
     =================================================================== */
  function Fine(sr) {
    this.sr = sr; this.fRef = 0; this.W = 0; this.H = 0;
    this.win = null; this.prev = null; this.prevEnd = -1;
  }
  // Prepara a janela sincronizada para uma frequência de referência
  Fine.prototype.setRef = function (fRef, maxW) {
    var sr = this.sr, per = sr / fRef;
    var k = Math.max(8, Math.ceil(0.2 * fRef));               // ≥ 8 períodos e ≈ 200 ms
    while (k > 8 && k * per > (maxW || 16384)) k--;
    var W = Math.round(k * per);
    if (W > (maxW || 16384)) W = maxW || 16384;
    this.fRef = fRef; this.W = W; this.periods = k;
    this.H = Math.max(1, Math.min(5, Math.floor(Math.min(sr * 0.42, 5000) / fRef)));
    var w = new Float64Array(W), s = 0;
    for (var i = 0; i < W; i++) { w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * (i + 0.5) / W); s += w[i]; }
    this.win = w; this.wsum = s;
    this.reset();
  };
  Fine.prototype.reset = function () {
    this.prev = null; this.prevEnd = -1;
    // média e variância recentes de cada harmônico (em cents) → peso pela confiabilidade
    this.mu = new Float64Array(6); this.va = new Float64Array(6).fill(4); this.cnt = new Int32Array(6);
  };
  /* ring: Float32Array circular; mask = tamanho-1; endIdx = índice absoluto
     (exclusivo) da última amostra disponível. Devolve null ou a medida. */
  Fine.prototype.measure = function (ring, mask, endIdx) {
    var W = this.W, sr = this.sr, H = this.H, start = endIdx - W, win = this.win;
    var TWO_PI = 2 * Math.PI, Z = [], energy = 0, i, h;
    for (i = 0; i < W; i++) { var v = ring[(start + i) & mask]; energy += v * v; }
    for (h = 1; h <= H; h++) {
      var om = TWO_PI * h * this.fRef / sr;
      var ph = (om * start) % TWO_PI;                        // fase da referência na 1ª amostra (absoluta)
      var cr = Math.cos(ph), ci = -Math.sin(ph);             // e^{-jφ}
      var dr = Math.cos(om), di = -Math.sin(om);
      var re = 0, im = 0;
      for (i = 0; i < W; i++) {
        var x = ring[(start + i) & mask] * win[i];
        re += x * cr; im += x * ci;
        var nr = cr * dr - ci * di; ci = cr * di + ci * dr; cr = nr;
        if ((i & 1023) === 1023) { var m = 1 / Math.sqrt(cr * cr + ci * ci); cr *= m; ci *= m; }
      }
      Z.push({ re: re, im: im, a: 2 * Math.sqrt(re * re + im * im) / this.wsum });
    }
    var out = null;
    if (this.prev && this.prevEnd >= 0) {
      var dn = endIdx - this.prevEnd;
      if (dn > 0 && dn < sr * 0.25) {
        var fh = [], maxA = 0, capt = 0;
        for (h = 0; h < H; h++) if (Z[h].a > maxA) maxA = Z[h].a;
        for (h = 0; h < H; h++) {
          var p = this.prev[h], z = Z[h];
          // Δφ = arg(z · conj(p))
          var xr = z.re * p.re + z.im * p.im, xi = z.im * p.re - z.re * p.im;
          var dphi = Math.atan2(xi, xr);
          var f = (h + 1) * this.fRef + dphi * sr / (TWO_PI * dn);
          var a = Math.min(z.a, p.a);                         // energia confiável nas duas medidas
          capt += z.a * z.a / 2;
          // confiabilidade: harmônico cuja medida oscila (batimento, outra corda na mesma frequência) perde peso
          var cc = 1200 * Math.log2(f / ((h + 1) * this.fRef));
          if (this.cnt[h] === 0) { this.mu[h] = cc; this.va[h] = 4; }
          else { var d = cc - this.mu[h]; this.mu[h] += 0.25 * d; this.va[h] += 0.25 * (d * d - this.va[h]); }
          this.cnt[h]++;
          var rel = 1 / (this.va[h] + 0.05);
          if (a > 0.03 * maxA) fh.push({ h: h + 1, f: f, w: a * a * rel });
        }
        if (fh.length) out = fitSeries(fh);
        if (out) {   // variância recente média dos harmônicos usados (ponderada pela energia)
          var vs = 0, ws = 0;
          for (h = 0; h < fh.length; h++) { var hh = fh[h].h - 1, e2 = Z[hh].a * Z[hh].a; vs += e2 * this.va[hh]; ws += e2; }
          out.vavg = ws > 0 ? vs / ws : 4;
          // incerteza sugerida para o Kalman (cents²)
          out.r = Math.max(0.02, (0.1 + out.resid) * (0.1 + out.resid) + 0.5 * out.vavg);
        }
        if (out) {
          out.amps = Z.map(function (q) { return q.a; });
          out.captured = energy > 0 ? Math.min(1, capt / (energy / W)) : 0;   // fração da potência que está nos harmônicos
          out.rms = Math.sqrt(energy / W);
          out.dn = dn;
        }
      }
    }
    this.prev = Z; this.prevEnd = endIdx;
    return out;
  };
  // Ajuste ponderado y_h = f_h/h = a + b·h²  (b = a·B/2), b ≥ 0
  function fitSeries(fh) {
    var Sw = 0, Sx = 0, Sy = 0, Sxx = 0, Sxy = 0, i;
    for (i = 0; i < fh.length; i++) {
      var w = fh[i].w, x = fh[i].h * fh[i].h, y = fh[i].f / fh[i].h;
      Sw += w; Sx += w * x; Sy += w * y; Sxx += w * x * x; Sxy += w * x * y;
    }
    var a, b = 0, den = Sw * Sxx - Sx * Sx;
    if (fh.length >= 2 && den > 1e-12 * Sw * Sxx) {
      b = (Sw * Sxy - Sx * Sy) / den; a = (Sy - b * Sx) / Sw;
      if (b < 0 || b > a * 1e-3) { b = Math.max(0, Math.min(b, a * 1e-3)); a = (Sy - b * Sx) / Sw; }
    } else a = Sy / Sw;
    // resíduo ponderado (consistência entre harmônicos), em cents
    var r = 0;
    for (i = 0; i < fh.length; i++) {
      var pred = a + b * fh[i].h * fh[i].h, e = 1200 * Math.log2((fh[i].f / fh[i].h) / pred);
      r += fh[i].w * e * e;
    }
    return { f1: a + b, B: a > 0 ? 2 * b / a : 0, resid: Math.sqrt(r / Sw), n: fh.length, wsum: Sw };
  }

  /* Filtro de Kalman para o valor mostrado (cents): estado = [desvio, velocidade].
     q: quanto o desvio pode mudar (suavização); r: incerteza de cada medida. */
  function Kalman() { this.reset(0); }
  Kalman.prototype.reset = function (c) { this.c = c; this.v = 0; this.P = [[25, 0], [0, 100]]; this.init = false; this.bad = 0; };
  Kalman.prototype.step = function (z, r, dt, q) {
    if (!this.init) { this.reset(z); this.init = true; this.P = [[r, 0], [0, 50]]; return this.c; }
    var P = this.P;
    // previsão (velocidade constante)
    this.c += this.v * dt;
    var p00 = P[0][0] + dt * (P[1][0] + P[0][1]) + dt * dt * P[1][1] + q * dt * dt * dt / 3;
    var p01 = P[0][1] + dt * P[1][1] + q * dt * dt / 2;
    var p11 = P[1][1] + q * dt;
    // atualização
    var S = p00 + r, inn = z - this.c;
    if (inn * inn > 25 * S) { if (++this.bad >= 3) { this.reset(z); this.init = true; this.P = [[r, 0], [0, 50]]; return this.c; } }
    else this.bad = 0;
    var k0 = p00 / S, k1 = p01 / S;
    this.c += k0 * inn; this.v += k1 * inn;
    this.P = [[(1 - k0) * p00, (1 - k0) * p01], [p01 - k1 * p00, p11 - k1 * p01]];
    return this.c;
  };

  /* Média no tempo ponderada pela ENERGIA (teorema da frequência média):
     cada medida pesa pelo quadrado da amplitude dos harmônicos e pela
     confiabilidade. Remove o efeito de batimentos lentos.
     Detector de mudança: se as medidas novas ficam seguidamente do mesmo
     lado (tarraxa girando), descarta as antigas para não atrasar. */
  function EnergyAvg() { this.reset(); }
  EnergyAvg.prototype.reset = function () { this.buf = []; this.env = 0; };
  EnergyAvg.prototype.push = function (t, c, e, T) {
    // energia RELATIVA ao volume do momento: pesa os vales do batimento, mas não favorece o início (mais forte) da nota
    this.env = this.env ? this.env * 0.85 + e * 0.15 : e;
    var w = this.env > 0 ? e / this.env : 1;
    this.buf.push({ t: t, c: c, e: w });
    while (this.buf.length > 1 && this.buf[0].t < t - T) this.buf.shift();
    // detector de mudança: últimas 4 medidas × trecho anterior a elas
    var n = this.buf.length;
    if (n >= 6) {
      var old = this.stats(0, n - 4), rm = 0;
      for (var i = n - 4; i < n; i++) rm += this.buf[i].c / 4;
      if (Math.abs(rm - old.m) > Math.max(1.3, 3.5 * old.sd)) this.buf = this.buf.slice(-4);
    }
    return this.value();
  };
  EnergyAvg.prototype.stats = function (a, b) {
    var se = 0, sc = 0, sv = 0, i;
    for (i = a; i < b; i++) { se += this.buf[i].e; sc += this.buf[i].e * this.buf[i].c; }
    var m = se > 0 ? sc / se : 0;
    for (i = a; i < b; i++) { var d = this.buf[i].c - m; sv += this.buf[i].e * d * d; }
    return { m: m, sd: se > 0 ? Math.sqrt(sv / se) : 0 };
  };
  EnergyAvg.prototype.value = function () {
    var se = 0, sc = 0;
    for (var i = 0; i < this.buf.length; i++) { se += this.buf[i].e; sc += this.buf[i].e * this.buf[i].c; }
    return se > 0 ? sc / se : null;
  };
  EnergyAvg.prototype.spread = function () {
    var m = this.value(); if (m === null) return 0;
    var se = 0, sv = 0;
    for (var i = 0; i < this.buf.length; i++) { var d = this.buf[i].c - m; se += this.buf[i].e; sv += this.buf[i].e * d * d; }
    return se > 0 ? Math.sqrt(sv / se) : 0;
  };

  var api = { Detector: Detector, FFT: FFT, Fine: Fine, Kalman: Kalman, EnergyAvg: EnergyAvg, fitSeries: fitSeries };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CifraPitch = api;
})(this);
