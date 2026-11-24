/* Accordatore — captura contínua do microfone com contador ABSOLUTO de amostras.
   Envia blocos de 512 amostras com o índice da primeira (currentFrame), para que
   o estágio de precisão (medição por fase) saiba o tempo exato entre medidas e
   perceba falhas ("engasgos") no áudio. */
class CifraCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.size = 512;
    this.buf = new Float32Array(this.size);
    this.n = 0;
    this.i0 = 0;
  }
  flush() {
    if (this.n > 0) this.port.postMessage({ i0: this.i0, d: this.buf.slice(0, this.n) });
    this.n = 0;
  }
  process(inputs) {
    const inp = inputs[0], ch = inp && inp[0];
    if (!ch) return true;                                  // sem entrada neste bloco (falha): o salto no índice revela
    const frame = currentFrame;                           // índice da 1ª amostra deste bloco
    if (this.n > 0 && frame !== this.i0 + this.n) this.flush();   // descontinuidade: envia o que tem
    if (this.n === 0) this.i0 = frame;
    if (this.n + ch.length > this.size) { this.flush(); this.i0 = frame; }
    this.buf.set(ch, this.n);
    this.n += ch.length;
    if (this.n >= this.size) this.flush();
    return true;
  }
}
registerProcessor('cifra-capture', CifraCapture);
