import fs from "node:fs";
import path from "node:path";

const SAMPLE_RATE = 22050;

function encodeWav(samples) {
  const dataLength = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // Mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

function synthNotes(notes) {
  const totalSec = notes.reduce((max, n) => Math.max(max, n.start + n.dur), 0);
  const out = new Float32Array(Math.ceil(totalSec * SAMPLE_RATE));

  for (const n of notes) {
    const startIdx = Math.floor(n.start * SAMPLE_RATE);
    const len = Math.floor(n.dur * SAMPLE_RATE);
    for (let i = 0; i < len; i += 1) {
      const t = i / SAMPLE_RATE;
      const env = Math.min(1, t / 0.012) * Math.exp((-4.5 * t) / n.dur);
      const wave =
        n.type === "triangle"
          ? (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * n.freq * t))
          : Math.sin(2 * Math.PI * n.freq * t);
      out[startIdx + i] += wave * env * 0.35;
    }
  }
  return encodeWav(out);
}

const outDir = path.resolve("apps/mobile/assets/sounds");
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(
  path.join(outDir, "success.wav"),
  synthNotes([
    { freq: 523.25, start: 0, dur: 0.14, type: "sine" },
    { freq: 659.25, start: 0.09, dur: 0.22, type: "sine" },
  ]),
);

fs.writeFileSync(
  path.join(outDir, "flip.wav"),
  synthNotes([
    { freq: 420, start: 0, dur: 0.06, type: "triangle" },
    { freq: 510, start: 0.04, dur: 0.07, type: "triangle" },
  ]),
);

fs.writeFileSync(
  path.join(outDir, "save.wav"),
  synthNotes([{ freq: 587.33, start: 0, dur: 0.12, type: "triangle" }]),
);

fs.writeFileSync(
  path.join(outDir, "softError.wav"),
  synthNotes([
    { freq: 260, start: 0, dur: 0.14, type: "sine" },
    { freq: 220, start: 0.1, dur: 0.18, type: "sine" },
  ]),
);

console.log("Sons WAV sintetizados em apps/mobile/assets/sounds/");
