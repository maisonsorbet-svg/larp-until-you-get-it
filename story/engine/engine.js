// Timeline engine: renders shot N at time t, deterministic, so render.js can
// step frame by frame. Exposes window.renderAt(t) and window.DURATION.
import * as THREE from 'three';
import { SETS } from './sets.js';
import { Character } from './characters.js';

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

const ease = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

async function load() {
  const name = new URLSearchParams(location.search).get('story') || 'great-impostor';
  const story = (await import(`../stories/${name}.js`)).default;
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
      const ch = new Character({ ...story.cast[c.who], ...(c.def || {}) });
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
      if (a.spec.move) a.ch.group.position.set(...lerp3(a.spec.pos, a.spec.move.to, ease(Math.min(1, Math.max(0, (t - (a.spec.move.at || 0)) / a.spec.move.dur)))));
      a.ch.update(T, camera, state);
    }
    renderer.render(stage.scene, camera);
    // overlays
    $grade.style.cssText = shot.grade || '';
    $fade.style.opacity = t < 0.18 && shot.start > 0 ? 1 - t / 0.18 : 0;
    drawCaption(shot, t);
  };
  window.renderAt(0);
  window.READY = true;
}

// TikTok-style word-by-word captions. *word* = highlighted.
function drawCaption(shot, t) {
  const caps = shot.captions || [];
  let cur = null;
  for (const c of caps) if (t >= c.at) cur = c;
  if (!cur) { $cap.innerHTML = ''; return; }
  const lt = t - cur.at;
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
