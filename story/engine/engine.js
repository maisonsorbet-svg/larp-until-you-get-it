// Timeline engine: renders shot N at time t, deterministic, so render.js can
// step frame by frame. Exposes window.renderAt(t) and window.DURATION.
import * as THREE from 'three';
import { SETS } from './sets.js';
import { Character } from './characters.js';
import { Blocky } from './blocky.js';
import { buildTown } from './town.js';
SETS.town = buildTown;

const W = 1080, H = 1920;
const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 600);
const $cap = document.getElementById('cap');
const $label = document.getElementById('label');
const $fade = document.getElementById('fade');
const $grade = document.getElementById('grade');
const $pops = document.getElementById('pops');

// cash / paper rain: a pool of spinning bills, deterministic in time
const billTex = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d');
  g.fillStyle = '#7fd67a'; g.fillRect(0, 0, 256, 128); g.strokeStyle = '#2e7d32'; g.lineWidth = 10; g.strokeRect(8, 8, 240, 112);
  g.fillStyle = '#2e7d32'; g.beginPath(); g.arc(128, 64, 34, 0, 7); g.fill(); g.fillStyle = '#c8f5c4'; g.font = '900 52px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$', 128, 66);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const rain = new THREE.Group();
const rnd = (i, k) => { const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return x - Math.floor(x); };
for (let i = 0; i < 140; i++) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), new THREE.MeshBasicMaterial({ map: billTex, side: THREE.DoubleSide }));
  rain.add(m);
}
function updateRain(shot, t, look) {
  const r = shot.rain;
  if (!r || t < (r.at || 0)) { rain.removeFromParent(); return; }
  shot.stage.scene.add(rain);
  const lt = t - (r.at || 0);
  rain.children.forEach((m, i) => {
    const fall = (lt * (1.6 + rnd(i, 1) * 1.2) + rnd(i, 2) * 9) % 9;
    m.position.set(look[0] + (rnd(i, 3) - 0.5) * (r.spread || 9), look[1] + 6 - fall, look[2] + (rnd(i, 4) - 0.5) * (r.spread || 9));
    m.rotation.set(lt * (2 + rnd(i, 5) * 3), lt * (1 + rnd(i, 6) * 2), rnd(i, 7) * 6);
    m.visible = lt * 6 > rnd(i, 8) * 6;
  });
}

// pop-ups: money pills (+$500) and day badges
function drawPops(shot, t) {
  const html = [];
  for (const p of shot.popups || []) {
    const lt = t - p.at, dur = p.dur || 2.2;
    if (lt < 0 || lt > dur) continue;
    const k = Math.min(1, lt / 0.25);
    const sc = k < 1 ? 0.4 + 0.75 * Math.sin(k * Math.PI * 0.62) / Math.sin(Math.PI * 0.62) : 1 + Math.sin(lt * 6) * 0.02;
    const op = lt > dur - 0.2 ? (dur - lt) / 0.2 : 1;
    const y = (p.y || 560) - lt * 18;
    if (p.kind === 'day') html.push(`<div class="pop day" style="top:${y}px;opacity:${op};transform:translateX(-50%) rotate(-6deg) scale(${sc})">${p.text}</div>`);
    else html.push(`<div class="pop money" style="top:${y}px;opacity:${op};transform:translateX(-50%) scale(${sc})"><i></i>${p.text}</div>`);
  }
  $pops.innerHTML = html.join('');
}

const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

async function load() {
  const name = new URLSearchParams(location.search).get('story') || 'great-impostor';
  const story = (await import(`../stories/${name}.js`)).default;
  if (story.toneMapping === 'none') renderer.toneMapping = THREE.NoToneMapping;
  if (story.captionMode) document.body.classList.add('cap-' + story.captionMode);
  await document.fonts.load('900 80px Inter');
  await document.fonts.load('700 30px Inter');
  $label.innerHTML = story.label || '';

  const setCache = {};
  let start = 0;
  for (const shot of story.shots) {
    const key = shot.set + JSON.stringify(shot.setOpts || {});
    shot.stage = setCache[key] ||= SETS[shot.set](shot.setOpts || {});
    shot.start = start; start += shot.dur;
    shot.actors = (shot.chars || []).map((c) => {
      const def = { ...story.cast[c.who], ...(c.def || {}) };
      const ch = def.kind === 'blocky' ? new Blocky(def) : new Character(def);
      ch.group.position.set(...c.pos);
      if (c.rotY) ch.group.rotation.y = c.rotY;
      return { ch, spec: c };
    });
  }
  window.DURATION = start;
  window.STORY = story;

  window.renderAt = (T) => {
    const shot = story.shots.find((s) => T < s.start + s.dur) || story.shots.at(-1);
    const t = T - shot.start;
    const k = Math.min(1, Math.max(0, t / shot.dur));
    const { stage } = shot;
    // show only this shot's actors
    for (const s of story.shots) for (const a of s.actors) a.ch.group.removeFromParent();
    for (const a of shot.actors) stage.scene.add(a.ch.group);
    stage.update(T, { ...(shot.update || {}), local: t });
    // camera move
    const c = shot.cam, e = ease(c.ease === 'linear' ? k : k);
    const pos = lerp3(c.from.pos, (c.to || c.from).pos, c.ease === 'linear' ? k : e);
    const look = lerp3(c.from.look, (c.to || c.from).look, c.ease === 'linear' ? k : e);
    const sh = shot.shake && t < shot.shake.dur ? shot.shake.amt * (1 - t / shot.shake.dur) : 0;
    camera.position.set(pos[0] + Math.sin(T * 47) * sh, pos[1] + Math.cos(T * 39) * sh, pos[2]);
    camera.fov = c.fov || 50; camera.updateProjectionMatrix();
    camera.lookAt(...look);
    if (shot.roll) camera.rotation.z += Math.sin(T * 0.9) * shot.roll;
    // actors
    for (const a of shot.actors) {
      let state = { ...(a.spec.state || {}) };
      for (const st of a.spec.states || []) if (t >= st.at) state = { ...state, ...st.state };
      if (a.spec.move) {
        const mv = a.spec.move, mk = Math.min(1, Math.max(0, (t - (mv.at || 0)) / mv.dur));
        a.ch.group.position.set(...lerp3(a.spec.pos, mv.to, mv.linear ? mk : ease(mk)));
        if (mk > 0 && mk < 1) {
          state.anim = state.anim || mv.anim || 'walk';
          if (a.spec.rotY === undefined) a.ch.group.rotation.y = Math.atan2(mv.to[0] - a.spec.pos[0], mv.to[2] - a.spec.pos[2]);
        }
      }
      a.ch.update(T, camera, state);
    }
    updateRain(shot, t, look);
    renderer.render(stage.scene, camera);
    // overlays
    $grade.style.cssText = shot.grade || '';
    $fade.style.opacity = t < 0.18 && shot.start > 0 ? 1 - t / 0.18 : 0;
    drawCaption(shot, t, story);
    drawPops(shot, t);
  };
  window.renderAt(0);
  window.READY = true;
}

// TikTok-style word-by-word captions. *word* = highlighted.
function drawCaption(shot, t, story) {
  const caps = shot.captions || [];
  let cur = null;
  for (const c of caps) if (t >= c.at) cur = c;
  if (!cur) { $cap.innerHTML = ''; return; }
  const lt = t - cur.at;
  if (story.captionMode === 'word') {            // one word at a time, narration pace
    const words = cur.text.split(' ');
    const wps = cur.wps || story.wps || 2.7;
    const i = Math.min(words.length - 1, Math.floor(lt * wps));
    if (cur.hold === false && lt * wps >= words.length + 0.6) { $cap.innerHTML = ''; return; }
    const wt = lt - i / wps, p = Math.min(1, wt / 0.12);
    const sc = 0.7 + 0.3 * p + Math.sin(p * Math.PI) * 0.12;
    const w = words[i];
    $cap.className = '';
    $cap.innerHTML = `<span class="w${w.includes('*') ? ' hl' : ''}" style="transform:scale(${sc})">${w.replaceAll('*', '')}</span>`;
    return;
  }
  let hl = false;
  const words = cur.text.split(' ').map((w, i) => {
    const start = w.startsWith('*'); const end = w.slice(1).includes('*');
    const on = hl || start; if (start && !end) hl = true; if (end) hl = false;
    const p = Math.min(1, Math.max(0, (lt - i * (cur.speed || 0.085)) / 0.16));
    const pop = p <= 0 ? 0 : 1 + Math.sin(p * Math.PI) * 0.07;
    return `<span class="w${on ? ' hl' : ''}" style="opacity:${p > 0 ? 1 : 0};transform:scale(${pop})">${w.replaceAll('*', '')}</span>`;
  });
  $cap.className = cur.style || '';
  $cap.innerHTML = words.join('');
}

load().catch((e) => { document.body.dataset.error = e.stack || String(e); console.error(e); });
