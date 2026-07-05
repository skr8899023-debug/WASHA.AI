/**
 * Tiny WebAudio synth — every game sound is generated, zero audio files.
 * ensureAudio() must be called from a user gesture (button click) first.
 */

let ctx: AudioContext | null = null;

export function ensureAudio(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, slide = 0): void {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slide !== 0) osc.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  /** UI click / countdown tick */
  tick(): void {
    tone(660, 0.06, "square", 0.08);
  },
  /** egg crack / capture pop */
  pop(): void {
    tone(520, 0.1, "triangle", 0.22, 0, -260);
    tone(1180, 0.05, "sine", 0.1);
  },
  /** happy hatch chirp */
  hatch(): void {
    tone(420, 0.12, "sine", 0.16, 0, 360);
    tone(840, 0.1, "triangle", 0.1, 0.08, 200);
  },
  /** caught it! */
  win(): void {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, "triangle", 0.16, i * 0.085));
  },
  /** out of time */
  lose(): void {
    tone(230, 0.4, "sawtooth", 0.1, 0, -70);
    tone(150, 0.5, "sine", 0.12, 0.12, -40);
  },
};
