// Generate a narrator voiceover for every caption of a story, then re-time the
// story so captions and shots follow the voice exactly.
//
//   node voice/narrate.mjs pretend-town --voice am_michael --speed 1.1
//
// Writes out/voice/<story>/*.wav and out/<story>.timing.json. render.js and
// audio/mix.py pick the timing file up automatically.
import { env } from '@huggingface/transformers';
import { KokoroTTS } from 'kokoro-js';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--')) || 'pretend-town';
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const VOICE = opt('voice', 'am_michael');
const SPEED = Number(opt('speed', '1.1'));
const GAP = 0.12;                       // pause between lines inside a shot
const TAIL = 0.3;                       // breathing room before the next cut

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
env.localModelPath = path.join(ROOT, 'voice/models') + '/';
env.allowRemoteModels = false;
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
const story = (await import(pathToFileURL(path.join(ROOT, 'stories', `${name}.js`)))).default;

// trim leading/trailing near-silence so lines butt up naturally
function trim(audio, sr) {
  const thr = 0.01; let a = 0, b = audio.length - 1;
  while (a < b && Math.abs(audio[a]) < thr) a++;
  while (b > a && Math.abs(audio[b]) < thr) b--;
  return audio.slice(Math.max(0, a - sr * 0.02), Math.min(audio.length, b + sr * 0.06));
}
function wav(file, samples, sr) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVEfmt ', 8);
  buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22); buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((s, i) => buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(s * 32767))), 44 + i * 2));
  fs.writeFileSync(file, buf);
}

const dir = path.join(ROOT, 'out', 'voice', name);
fs.mkdirSync(dir, { recursive: true });
const timing = { voice: VOICE, speed: SPEED, shots: [], lines: [] };
let start = 0;
for (const [si, shot] of story.shots.entries()) {
  const caps = shot.captions || [];
  let cursor = caps.length ? caps[0].at : 0;
  const out = [];
  for (const [ci, c] of caps.entries()) {
    const text = c.text.replaceAll('*', '');
    const a = await tts.generate(text, { voice: VOICE, speed: SPEED });
    const audio = trim(a.audio, a.sampling_rate);
    const dur = audio.length / a.sampling_rate;
    const file = path.join(dir, `${String(si).padStart(2, '0')}_${ci}.wav`);
    wav(file, audio, a.sampling_rate);
    out.push({ at: +cursor.toFixed(3), dur: +dur.toFixed(3) });
    timing.lines.push({ t: +(start + cursor).toFixed(3), file: path.relative(ROOT, file), text });
    cursor += dur + GAP;
    console.log(`shot ${si + 1} line ${ci + 1}: ${dur.toFixed(2)}s  ${text}`);
  }
  const last = si === story.shots.length - 1;
  const dur = caps.length ? Math.max(cursor - GAP + TAIL, 1.6) + (last ? 0.9 : 0) : shot.dur;
  timing.shots.push({ dur: +dur.toFixed(3), captions: out });
  start += dur;
}
timing.duration = +start.toFixed(3);
fs.writeFileSync(path.join(ROOT, 'out', `${name}.timing.json`), JSON.stringify(timing, null, 1));
console.log(`total ${start.toFixed(1)}s -> out/${name}.timing.json`);
