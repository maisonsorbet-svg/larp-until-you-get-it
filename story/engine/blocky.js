// Blocky 3D toy-style characters (original design): cube head with a drawn
// face, box torso/limbs that swing for walk / cheer / laugh / point / shock.
import * as THREE from 'three';

const mat = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.75 });

function drawFace(g, s, skin) {
  const W = 256;
  g.fillStyle = skin; g.fillRect(0, 0, W, W);
  g.fillStyle = '#1b1b1b'; g.strokeStyle = '#1b1b1b'; g.lineCap = 'round';
  const e = s.face || 'happy';
  // eyes
  if (s.shades) {
    g.fillStyle = '#111'; g.beginPath(); g.roundRect(30, 78, 88, 52, 14); g.roundRect(138, 78, 88, 52, 14); g.fill();
    g.fillRect(110, 88, 36, 10);
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(44, 88, 26, 10); g.fillRect(152, 88, 26, 10);
  } else if (e === 'laugh' || s.blink) {
    g.lineWidth = 12;
    for (const x of [78, 178]) { g.beginPath(); g.arc(x, 112, 20, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); }
  } else if (e === 'shock') {
    for (const x of [78, 178]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, 104, 26, 0, 7); g.fill(); g.lineWidth = 6; g.stroke(); g.fillStyle = '#1b1b1b'; g.beginPath(); g.arc(x, 106, 11, 0, 7); g.fill(); }
  } else {
    for (const x of [78, 178]) { g.beginPath(); g.ellipse(x, 104, 12, 19, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 4, 96, 5, 0, 7); g.fill(); g.fillStyle = '#1b1b1b'; }
  }
  // brows
  g.lineWidth = 10;
  if (e === 'sad') { g.beginPath(); g.moveTo(50, 62); g.lineTo(98, 52); g.moveTo(158, 52); g.lineTo(206, 62); g.stroke(); }
  if (e === 'smug' || e === 'angry') { g.beginPath(); g.moveTo(50, 50); g.lineTo(100, 64); g.moveTo(156, 64); g.lineTo(206, 50); g.stroke(); }
  // mouth
  g.lineWidth = 10;
  if (e === 'laugh' || e === 'cheer') { g.fillStyle = '#7a1f1f'; g.beginPath(); g.moveTo(78, 160); g.quadraticCurveTo(128, 235, 178, 160); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.fillRect(92, 162, 72, 14); }
  else if (e === 'shock') { g.fillStyle = '#7a1f1f'; g.beginPath(); g.ellipse(128, 188, 22, 30, 0, 0, 7); g.fill(); g.stroke(); }
  else if (e === 'sad') { g.beginPath(); g.arc(128, 212, 34, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
  else if (e === 'smug') { g.beginPath(); g.moveTo(92, 178); g.quadraticCurveTo(150, 196, 178, 160); g.stroke(); }
  else if (s.talk) { g.fillStyle = '#7a1f1f'; g.beginPath(); g.ellipse(128, 180, 26, 16, 0, 0, 7); g.fill(); g.stroke(); }
  else { g.beginPath(); g.arc(128, 150, 40, Math.PI * 0.2, Math.PI * 0.8); g.stroke(); }
  if (e === 'sad' && s.tear !== false) { g.fillStyle = '#6ec6ff'; g.beginPath(); g.ellipse(64, 150, 9, 15, 0, 0, 7); g.fill(); }
}

export class Blocky {
  // def: {skin, hair, hairStyle, shirt, pants, shoes, chain, shades, height}
  constructor(def) {
    this.def = def;
    const S = (def.height || 1.9) / 2.5;
    this.group = new THREE.Group();
    const root = new THREE.Group(); root.scale.setScalar(S); this.group.add(root); this.root = root;
    this.body = new THREE.Group(); this.body.position.y = 0.95; root.add(this.body);
    const add = (geo, m, x, y, z, parent) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; };
    // legs (pivot at hip)
    this.legs = [-0.23, 0.23].map((x) => {
      const p = new THREE.Group(); p.position.set(x, 0, 0); this.body.add(p);
      add(new THREE.BoxGeometry(0.44, 0.8, 0.46), mat(def.pants || '#2f5fb3'), 0, -0.4, 0, p);
      add(new THREE.BoxGeometry(0.46, 0.17, 0.5), mat(def.shoes || '#222'), 0, -0.87, 0.02, p);
      return p;
    });
    // torso
    const torso = add(new THREE.BoxGeometry(0.92, 0.96, 0.48), mat(def.shirt || '#e53935'), 0, 0.48, 0, this.body);
    if (def.chain) {
      const ch = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: '#ffcc33', metalness: 0.9, roughness: 0.2, emissive: '#5a4100' }));
      ch.rotation.z = Math.PI; ch.position.set(0, 0.86, 0.26); this.body.add(ch);
      const med = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.03, 16), ch.material); med.rotation.x = Math.PI / 2; med.position.set(0, 0.6, 0.27); this.body.add(med);
    }
    if (def.stripe) add(new THREE.BoxGeometry(0.94, 0.14, 0.5), mat(def.stripe), 0, 0.5, 0, this.body);
    // arms (pivot at shoulder)
    this.arms = [-0.66, 0.66].map((x) => {
      const p = new THREE.Group(); p.position.set(x, 0.86, 0); this.body.add(p);
      add(new THREE.BoxGeometry(0.4, 0.62, 0.44), mat(def.sleeve || def.shirt || '#e53935'), 0, -0.25, 0, p);
      add(new THREE.BoxGeometry(0.38, 0.34, 0.42), mat(def.skin), 0, -0.73, 0, p);
      return p;
    });
    // head
    this.faceCanvas = document.createElement('canvas'); this.faceCanvas.width = this.faceCanvas.height = 256;
    this.faceTex = new THREE.CanvasTexture(this.faceCanvas); this.faceTex.colorSpace = THREE.SRGBColorSpace;
    const sk = mat(def.skin);
    this.head = new THREE.Group(); this.head.position.y = 0.98; this.body.add(this.head);
    const faceMat = new THREE.MeshStandardMaterial({ map: this.faceTex, roughness: 0.8 });
    add(new THREE.BoxGeometry(0.64, 0.64, 0.64), [sk, sk, sk, sk, faceMat, sk], 0, 0.32, 0, this.head);
    const hm = mat(def.hair || '#3b2414');
    if (def.hairStyle === 'cap') {
      add(new THREE.BoxGeometry(0.7, 0.22, 0.7), mat(def.cap || '#1e88e5'), 0, 0.72, 0, this.head);
      add(new THREE.BoxGeometry(0.66, 0.06, 0.32), mat(def.cap || '#1e88e5'), 0, 0.63, 0.46, this.head);
    } else if (def.hairStyle === 'long') {
      add(new THREE.BoxGeometry(0.7, 0.2, 0.7), hm, 0, 0.7, -0.01, this.head);
      add(new THREE.BoxGeometry(0.7, 0.72, 0.16), hm, 0, 0.28, -0.3, this.head);
    } else {
      add(new THREE.BoxGeometry(0.7, 0.22, 0.7), hm, 0, 0.72, -0.01, this.head);
      add(new THREE.BoxGeometry(0.7, 0.3, 0.14), hm, 0, 0.5, -0.3, this.head);
      add(new THREE.BoxGeometry(0.34, 0.14, 0.2), hm, 0.12, 0.62, 0.3, this.head);   // fringe
    }
    // contact shadow
    const sh = new THREE.Mesh(new THREE.CircleGeometry(0.75, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = 0.012; root.add(sh);
    this.seed = (def.seed ?? Math.random()) * 10;
    this.lastKey = '';
  }

  update(t, camera, state = {}) {
    const s = { face: this.def.face, shades: this.def.shades, ...state };
    const tt = t + this.seed;
    s.blink = s.face !== 'shock' && (tt % 3.1) < 0.12;
    if (s.talk) s.talk = Math.floor(t * 8) % 2 === 0;
    const key = JSON.stringify([s.face, s.shades, s.blink, s.talk]);
    if (key !== this.lastKey) {
      this.lastKey = key;
      drawFace(this.faceCanvas.getContext('2d'), s, this.def.skin);
      this.faceTex.needsUpdate = true;
    }
    const [lA, rA] = this.arms, [lL, rL] = this.legs;
    const reset = () => { for (const p of [lA, rA, lL, rL]) p.rotation.set(0, 0, 0); this.body.rotation.set(0, 0, 0); this.head.rotation.set(0, 0, 0); this.body.position.y = 0.95; };
    reset();
    const a = s.anim || 'idle';
    if (a === 'walk' || a === 'run') {
      const sp = a === 'run' ? 13 : 8, amp = a === 'run' ? 0.9 : 0.6;
      const w = Math.sin(tt * sp) * amp;
      lL.rotation.x = w; rL.rotation.x = -w; lA.rotation.x = -w * 0.9; rA.rotation.x = w * 0.9;
      this.body.position.y = 0.95 + Math.abs(Math.cos(tt * sp)) * 0.06;
      if (a === 'run') this.body.rotation.x = 0.15;
    } else if (a === 'cheer') {
      const w = Math.sin(tt * 10) * 0.3;
      lA.rotation.z = -2.6 + w; rA.rotation.z = 2.6 - w;
      this.body.position.y = 0.95 + Math.abs(Math.sin(tt * 5)) * 0.35;
    } else if (a === 'laugh') {
      this.body.rotation.x = -0.18 + Math.sin(tt * 14) * 0.05;
      lA.rotation.x = -0.6; rA.rotation.x = -0.6; lA.rotation.z = 0.5; rA.rotation.z = -0.5;
      this.body.position.y = 0.95 + Math.abs(Math.sin(tt * 14)) * 0.05;
      this.head.rotation.x = -0.2;
    } else if (a === 'point') {
      rA.rotation.x = -1.5; lA.rotation.z = 0.1; this.head.rotation.y = Math.sin(tt * 2) * 0.1;
    } else if (a === 'shock') {
      lA.rotation.z = -0.9; rA.rotation.z = 0.9; lA.rotation.x = -0.4; rA.rotation.x = -0.4;
      this.body.rotation.x = -0.12; this.head.rotation.x = -0.08;
    } else if (a === 'sad') {
      this.head.rotation.x = 0.35; this.body.rotation.x = 0.12; lA.rotation.z = 0.08; rA.rotation.z = -0.08;
    } else if (a === 'flex') {
      lA.rotation.z = -1.5; rA.rotation.z = 1.5; lA.rotation.x = -0.2; rA.rotation.x = -0.2;
      this.body.position.y = 0.95 + Math.abs(Math.sin(tt * 3)) * 0.03;
    } else { // idle breathing + small sway
      lA.rotation.z = 0.06 + Math.sin(tt * 1.8) * 0.03; rA.rotation.z = -0.06 - Math.sin(tt * 1.8) * 0.03;
      this.body.position.y = 0.95 + Math.sin(tt * 1.8) * 0.01;
    }
  }
}
