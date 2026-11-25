// Flat 2D "paper cut-out" characters, drawn on a canvas and used as textures
// on planes that stand inside the 3D sets (always turned to face the camera).
import * as THREE from 'three';

const OUTLINE = '#141414';
const OUTFITS = {
  doctor:  { top: '#f4f4f0', trim: '#cfd8dc', pants: '#2f3a4a', shoes: '#1b1b1b' },
  sailor:  { top: '#1f3a68', trim: '#ffffff', pants: '#1f3a68', shoes: '#111' },
  officer: { top: '#14233f', trim: '#e8b923', pants: '#14233f', shoes: '#111' },
  suit:    { top: '#6b4f3a', trim: '#b23a3a', pants: '#4d3a2b', shoes: '#2a1d14' },
};

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// Draw a shape twice: thick white "paper edge", then the coloured fill + outline.
function cut(ctx, pathFn, fill, edge = 22) {
  pathFn(); ctx.lineWidth = edge; ctx.strokeStyle = '#ffffff'; ctx.stroke();
  pathFn(); ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 7; ctx.strokeStyle = OUTLINE; ctx.stroke();
}

function drawFace(ctx, cx, cy, look, s) {
  const { blink, mouth, brows } = s;
  // eyes
  ctx.fillStyle = OUTLINE; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 7; ctx.lineCap = 'round';
  for (const dx of [-30, 30]) {
    const ex = cx + dx + look * 6, ey = cy - 6;
    if (blink) { ctx.beginPath(); ctx.moveTo(ex - 11, ey); ctx.lineTo(ex + 11, ey); ctx.stroke(); }
    else if (s.wide) { ctx.beginPath(); ctx.arc(ex, ey, 13, 0, 7); ctx.fillStyle = '#fff'; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(ex + look * 3, ey, 6, 0, 7); ctx.fillStyle = OUTLINE; ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(ex, ey, 9, 0, 7); ctx.fill(); }
  }
  // brows
  ctx.lineWidth = 8;
  const bt = { calm: [0, 0], worried: [10, -6], angry: [-10, 8], shock: [-8, -8], smug: [6, -4] }[brows || 'calm'];
  ctx.beginPath(); ctx.moveTo(cx - 48, cy - 36 - bt[0] * 0); ctx.lineTo(cx - 14, cy - 36 + bt[1]); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 14, cy - 36 + (brows === 'smug' ? -10 : bt[1])); ctx.lineTo(cx + 48, cy - 36); ctx.stroke();
  // mouth
  const my = cy + 34;
  ctx.lineWidth = 7;
  ctx.beginPath();
  if (mouth === 'open') { ctx.ellipse(cx, my + 4, 14, 16, 0, 0, 7); ctx.fillStyle = '#5a1a1a'; ctx.fill(); ctx.stroke(); }
  else if (mouth === 'talk') { ctx.ellipse(cx, my + 2, 16, 9, 0, 0, 7); ctx.fillStyle = '#5a1a1a'; ctx.fill(); ctx.stroke(); }
  else if (mouth === 'smile') { ctx.arc(cx, my - 10, 22, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  else if (mouth === 'smirk') { ctx.moveTo(cx - 16, my + 2); ctx.quadraticCurveTo(cx + 6, my + 8, cx + 22, my - 8); ctx.stroke(); }
  else if (mouth === 'worried') { ctx.arc(cx, my + 18, 18, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
  else { ctx.moveTo(cx - 16, my); ctx.lineTo(cx + 16, my); ctx.stroke(); }
}

// Standing character (512 x 1024 canvas)
function drawStanding(ctx, c, s) {
  const o = OUTFITS[c.outfit];
  const cx = 256;
  // legs
  cut(ctx, () => { rr(ctx, cx - 70, 640, 62, 300, 24); }, o.pants);
  cut(ctx, () => { rr(ctx, cx + 8, 640, 62, 300, 24); }, o.pants);
  cut(ctx, () => { rr(ctx, cx - 86, 915, 84, 44, 20); }, o.shoes);
  cut(ctx, () => { rr(ctx, cx + 2, 915, 84, 44, 20); }, o.shoes);
  // body
  const coatLong = c.outfit === 'doctor';
  cut(ctx, () => { rr(ctx, cx - 110, 360, 220, coatLong ? 420 : 320, 50); }, o.top);
  // outfit details
  ctx.lineWidth = 6; ctx.strokeStyle = OUTLINE;
  if (c.outfit === 'doctor') {
    ctx.beginPath(); ctx.moveTo(cx, 370); ctx.lineTo(cx, 770); ctx.stroke();
    ctx.strokeStyle = '#37474f'; ctx.lineWidth = 9;   // stethoscope
    ctx.beginPath(); ctx.moveTo(cx - 50, 372); ctx.quadraticCurveTo(cx - 60, 500, cx - 10, 520); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 50, 372); ctx.quadraticCurveTo(cx + 40, 480, cx - 10, 520); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx - 10, 532, 14, 0, 7); ctx.fillStyle = '#90a4ae'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = OUTLINE; ctx.stroke();
  } else if (c.outfit === 'sailor') {
    ctx.fillStyle = o.trim; ctx.beginPath(); ctx.moveTo(cx - 80, 365); ctx.lineTo(cx, 470); ctx.lineTo(cx + 80, 365); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (c.outfit === 'officer') {
    ctx.fillStyle = o.trim;
    for (const y of [430, 500, 570, 640]) { ctx.beginPath(); ctx.arc(cx, y, 9, 0, 7); ctx.fill(); }
    rr(ctx, cx - 112, 372, 60, 16, 6); ctx.fill(); rr(ctx, cx + 52, 372, 60, 16, 6); ctx.fill();
  } else if (c.outfit === 'suit') {
    ctx.fillStyle = '#f2efe6'; ctx.beginPath(); ctx.moveTo(cx - 40, 365); ctx.lineTo(cx, 470); ctx.lineTo(cx + 40, 365); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = o.trim; ctx.beginPath(); ctx.moveTo(cx - 10, 380); ctx.lineTo(cx + 10, 380); ctx.lineTo(cx + 14, 470); ctx.lineTo(cx, 490); ctx.lineTo(cx - 14, 470); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  // arms
  const holding = s.pose === 'read' || s.pose === 'paper';
  if (holding) {
    cut(ctx, () => { rr(ctx, cx - 150, 390, 58, 200, 28); }, o.top);
    cut(ctx, () => { rr(ctx, cx + 92, 390, 58, 200, 28); }, o.top);
  } else if (s.pose === 'wave') {
    cut(ctx, () => { rr(ctx, cx - 160, 380, 58, 270, 28); }, o.top);
    cut(ctx, () => { ctx.save(); ctx.translate(cx + 120, 400); ctx.rotate(-2.4); rr(ctx, -29, 0, 58, 250, 28); ctx.restore(); }, o.top);
  } else {
    cut(ctx, () => { rr(ctx, cx - 160, 380, 58, 270, 28); }, o.top);
    cut(ctx, () => { rr(ctx, cx + 102, 380, 58, 270, 28); }, o.top);
  }
  // head
  const hy = 230;
  cut(ctx, () => { rr(ctx, cx - 28, 300, 56, 80, 10); }, c.skin);       // neck
  cut(ctx, () => { ctx.beginPath(); ctx.ellipse(cx, hy, 100, 112, 0, 0, 7); }, c.skin);
  // hair
  ctx.fillStyle = c.hair; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.ellipse(cx, hy - 62, 104, 58, 0, Math.PI, 0); ctx.lineTo(cx + 104, hy - 40); ctx.quadraticCurveTo(cx + 20, hy - 70, cx - 104, hy - 30); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (c.moustache) { ctx.fillStyle = c.hair; ctx.beginPath(); ctx.ellipse(cx, hy + 50, 34, 11, 0, 0, 7); ctx.fill(); ctx.stroke(); }
  drawFace(ctx, cx, hy + 20, c.look || 0, s);
  if (c.hat === 'cap') {          // naval officer cap
    cut(ctx, () => { rr(ctx, cx - 112, hy - 150, 224, 70, 30); }, '#ffffff', 12);
    cut(ctx, () => { rr(ctx, cx - 100, hy - 92, 200, 30, 8); }, '#14233f', 12);
    ctx.fillStyle = '#e8b923'; ctx.beginPath(); ctx.arc(cx, hy - 115, 14, 0, 7); ctx.fill();
  } else if (c.hat === 'sailor') {
    cut(ctx, () => { ctx.beginPath(); ctx.ellipse(cx, hy - 105, 96, 34, 0, 0, 7); }, '#ffffff', 12);
  }
  // held props (drawn over the body, hands on top)
  if (s.pose === 'read') {
    cut(ctx, () => { ctx.save(); ctx.translate(cx, 560); ctx.rotate(-0.08); rr(ctx, -120, -70, 240, 150, 10); ctx.restore(); }, '#8b1e1e');
    ctx.fillStyle = '#f3e9c6'; ctx.save(); ctx.translate(cx, 560); ctx.rotate(-0.08); ctx.fillRect(-108, -58, 216, 10); ctx.restore();
    ctx.fillStyle = '#e8b923'; ctx.font = 'bold 30px Inter'; ctx.textAlign = 'center'; ctx.fillText('SURGERY', cx, 572);
  }
  if (s.pose === 'paper') {
    cut(ctx, () => { rr(ctx, cx - 150, 450, 300, 230, 6); }, '#efe9da');
    ctx.fillStyle = OUTLINE; ctx.font = '900 34px Inter'; ctx.textAlign = 'center'; ctx.fillText('NAVY HERO', cx, 500);
    ctx.fillStyle = '#9e9e9e'; for (let i = 0; i < 6; i++) ctx.fillRect(cx - 125, 525 + i * 24, i % 2 ? 110 : 250, 9);
  }
  if (holding) {
    cut(ctx, () => { ctx.beginPath(); ctx.arc(cx - 120, 600, 30, 0, 7); }, c.skin, 12);
    cut(ctx, () => { ctx.beginPath(); ctx.arc(cx + 120, 600, 30, 0, 7); }, c.skin, 12);
  } else {
    cut(ctx, () => { ctx.beginPath(); ctx.arc(cx - 131, 660, 30, 0, 7); }, c.skin, 12);
    if (s.pose !== 'wave') cut(ctx, () => { ctx.beginPath(); ctx.arc(cx + 131, 660, 30, 0, 7); }, c.skin, 12);
    else cut(ctx, () => { ctx.beginPath(); ctx.arc(cx + 240, 230, 30, 0, 7); }, c.skin, 12);
  }
}

// Patient lying under a blanket (1024 x 512 canvas)
function drawLying(ctx, c, s) {
  cut(ctx, () => { rr(ctx, 260, 210, 700, 200, 70); }, '#b0bec5');   // blanket
  ctx.strokeStyle = '#90a4ae'; ctx.lineWidth = 6;
  for (let x = 380; x < 920; x += 110) { ctx.beginPath(); ctx.moveTo(x, 225); ctx.lineTo(x - 30, 395); ctx.stroke(); }
  cut(ctx, () => { ctx.beginPath(); ctx.ellipse(170, 290, 108, 98, 0, 0, 7); }, c.skin);
  ctx.fillStyle = c.hair; ctx.strokeStyle = OUTLINE; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.ellipse(110, 290, 50, 96, 0, Math.PI * 0.5, Math.PI * 1.5); ctx.closePath(); ctx.fill(); ctx.stroke();
  // bandage
  ctx.fillStyle = '#fff'; rr(ctx, 520, 222, 140, 40, 8); ctx.fill(); ctx.fillStyle = '#c62828'; ctx.beginPath(); ctx.arc(590, 242, 12, 0, 7); ctx.fill();
  drawFace(ctx, 190, 290, 0.6, { ...s, mouth: s.mouth || (s.smile ? 'smile' : 'worried') });
}

export class Character {
  constructor(def) {
    this.def = def;
    this.lying = def.pose === 'lie';
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.lying ? 1024 : 512;
    this.canvas.height = this.lying ? 512 : 1024;
    this.ctx = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 4;
    const h = def.height || 1.85;
    const geo = this.lying ? new THREE.PlaneGeometry(h * 1.1, h * 0.55) : new THREE.PlaneGeometry(h * 0.5, h);
    geo.translate(0, this.lying ? 0 : h / 2, 0);      // pivot at the feet
    this.mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide }));
    this.mesh.renderOrder = 2;
    this.group = new THREE.Group();
    this.group.add(this.mesh);
    if (!this.lying) {                                   // soft contact shadow
      const sh = new THREE.Mesh(new THREE.CircleGeometry(h * 0.22, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
      sh.rotation.x = -Math.PI / 2; sh.scale.y = 0.45; sh.position.y = 0.01;
      this.group.add(sh);
    }
    this.lastKey = '';
    this.seed = Math.random() * 10;
  }

  // state: {pose, mouth, brows, wide, talk, smile}
  update(t, camera, state = {}) {
    const s = { pose: this.def.pose, brows: this.def.brows, mouth: this.def.mouth, ...state };
    s.blink = ((t + this.seed) % 3.4) < 0.12;
    if (s.talk) s.mouth = Math.floor(t * 9) % 2 ? 'talk' : 'flat';
    const key = JSON.stringify(s);
    if (key !== this.lastKey) {
      this.lastKey = key;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      (this.lying ? drawLying : drawStanding)(this.ctx, this.def, s);
      this.tex.needsUpdate = true;
    }
    if (this.lying) {
      const p = new THREE.Vector3(); this.group.getWorldPosition(p);
      this.mesh.rotation.set(-1.2, Math.atan2(camera.position.x - p.x, camera.position.z - p.z), 0, 'YXZ');
    } else {
      // cylindrical billboard + little bounce, like a puppet
      const p = new THREE.Vector3(); this.group.getWorldPosition(p);
      this.mesh.rotation.y = Math.atan2(camera.position.x - p.x, camera.position.z - p.z) - this.group.rotation.y;
      const bounce = s.talk || s.bob || this.def.bob ? Math.abs(Math.sin((t + this.seed) * 5)) * 0.03 : 0;
      this.mesh.position.y = bounce;
      this.mesh.scale.set(this.def.flip ? -1 : 1, 1 + Math.sin((t + this.seed) * 2.2) * 0.008, 1);
    }
  }
}
