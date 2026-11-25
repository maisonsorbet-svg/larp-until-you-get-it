#!/usr/bin/env node
// Renders a story to an MP4 (1080x1920, 30 fps) by stepping the three.js
// timeline frame by frame in headless Chromium and piping frames into ffmpeg.
//
//   node render.js great-impostor                 -> out/great-impostor.mp4
//   node render.js great-impostor --stills 1,8,20 -> PNG stills at those seconds
//   node render.js great-impostor --music bg.mp3  -> with a music bed
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('playwright');

const args = process.argv.slice(2);
const name = args.find((a) => !a.startsWith('--')) || 'great-impostor';
const opt = (k) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : null; };
const FPS = Number(opt('fps') || 30);
const ROOT = __dirname;
const FONT_DIR = '/usr/share/fonts/opentype/inter';
const OUT = path.join(ROOT, 'out');
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.otf': 'font/otf' };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      const url = decodeURIComponent(req.url.split('?')[0]);
      const file = url.startsWith('/fonts/') ? path.join(FONT_DIR, path.basename(url)) : path.join(ROOT, path.normalize(url));
      if (!file.startsWith(ROOT) && !file.startsWith(FONT_DIR)) { rsp.writeHead(403); return rsp.end(); }
      fs.readFile(file, (err, data) => {
        if (err) { rsp.writeHead(404); return rsp.end(); }
        rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
        rsp.end(data);
      });
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

(async () => {
  const srv = await serve();
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  const useVoice = !args.includes('--no-voice') && fs.existsSync(path.join(OUT, `${name}.timing.json`));
  if (useVoice) console.log('using narrator timing from', `out/${name}.timing.json`);
  await page.goto(`http://127.0.0.1:${srv.address().port}/engine/index.html?story=${name}${useVoice ? '&timing=1' : ''}`);
  await page.waitForFunction(() => window.READY || document.body.dataset.error, null, { timeout: 60000 });
  const err = await page.evaluate(() => document.body.dataset.error);
  if (err) throw new Error(err);
  const duration = await page.evaluate(() => window.DURATION);

  const stills = opt('stills');
  if (args.includes('--events')) {          // timeline for the sound mixer
    const ev = await page.evaluate(() => window.STORY.shots.map((s) => ({
      start: s.start, dur: s.dur, music: s.music || null, sfx: s.sfx || [],
      popups: s.popups || [], rain: s.rain || null, sportsCar: (s.update || {}).sportsCar || null,
    })));
    const f = path.join(OUT, `${name}.events.json`);
    fs.writeFileSync(f, JSON.stringify({ duration, shots: ev }, null, 1));
    console.log('events', f);
  } else if (stills) {
    for (const s of stills.split(',')) {
      await page.evaluate((t) => window.renderAt(t), Number(s));
      const f = path.join(OUT, `${name}_${s}s.png`);
      await page.screenshot({ path: f });
      console.log('still', f);
    }
  } else {
    const out = path.join(OUT, `${name}.mp4`);
    const music = opt('music');
    const ff = ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(FPS), '-i', '-'];
    if (music) ff.push('-stream_loop', '-1', '-i', music, '-map', '0:v', '-map', '1:a', '-af', `afade=t=out:st=${(duration - 2).toFixed(2)}:d=2`);
    else ff.push('-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo');
    ff.push('-t', duration.toFixed(3), '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out);
    const proc = spawn('ffmpeg', ff, { stdio: ['pipe', 'inherit', 'inherit'] });
    const n = Math.ceil(duration * FPS);
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      await page.evaluate((t) => window.renderAt(t), i / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
      if (!proc.stdin.write(buf)) await new Promise((r) => proc.stdin.once('drain', r));
      if (i % 150 === 0) console.log(`frame ${i}/${n}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    proc.stdin.end();
    await new Promise((r) => proc.on('close', r));
    console.log(`rendered ${out} (${duration.toFixed(1)}s)`);
  }
  await browser.close();
  srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
