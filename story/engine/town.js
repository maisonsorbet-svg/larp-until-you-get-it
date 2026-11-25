// Bright, sunny blocky toy-town: a street with shops, towers, trees, cars,
// a billboard whose text each shot can set, a bank, and a sports car prop.
import * as THREE from 'three';

const M = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o });
function tex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function box(w, h, d, m, x, y, z, parent, shadow = true) {
  const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z);
  o.castShadow = shadow; o.receiveShadow = true; parent.add(o); return o;
}

const WALLS = ['#f7f3e8', '#ff8fb1', '#8ec5ff', '#b39ddb', '#c0563f', '#ffd166', '#7ed6a5', '#e9edf2'];
const facadeCache = {};
function facade(color) {
  return facadeCache[color] ||= tex(256, 256, (g) => {
    g.fillStyle = color; g.fillRect(0, 0, 256, 256);
    for (const x of [28, 148]) {
      g.fillStyle = '#ffffff'; g.fillRect(x - 8, 40, 96, 150);
      g.fillStyle = '#3d7bd9'; g.fillRect(x, 48, 80, 134);
      g.fillStyle = '#6fa8ff'; g.fillRect(x, 48, 80, 50);
      g.fillStyle = '#ffffff'; g.fillRect(x + 37, 48, 6, 134); g.fillRect(x, 112, 80, 6);
      g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(x - 8, 190, 96, 10);
    }
  });
}
const glassTex = tex(128, 256, (g) => {
  g.fillStyle = '#5fb3ff'; g.fillRect(0, 0, 128, 256);
  g.fillStyle = '#9fd3ff'; for (let y = 0; y < 256; y += 32) g.fillRect(0, y, 128, 14);
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 6, 256); g.fillRect(64, 0, 4, 256);
});
const awningTex = tex(128, 32, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#ffffff' : '#e63946'; g.fillRect(i * 16, 0, 16, 32); } });

function billboardTex(text) {
  return tex(1024, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a1c71'); gr.addColorStop(1, '#5b2bd1');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ff4fd8'; g.lineWidth = 26; g.strokeRect(13, 13, w - 26, h - 26);
    g.fillStyle = '#ffd400'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = String(text).split('\n');
    const size = lines.length > 1 ? 150 : 200;
    g.font = `900 ${size}px Inter`;
    lines.forEach((l, i) => g.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.05));
  });
}

function car(color, parent) {
  const c = new THREE.Group();
  box(1.9, 0.7, 4.2, M(color, { roughness: 0.4 }), 0, 0.65, 0, c);
  box(1.7, 0.6, 2.2, M(color, { roughness: 0.4 }), 0, 1.3, -0.2, c);
  box(1.72, 0.45, 2.0, M('#bfe3ff', { roughness: 0.1, metalness: 0.3 }), 0, 1.32, -0.2, c);
  for (const [x, z] of [[-0.95, 1.3], [0.95, 1.3], [-0.95, -1.3], [0.95, -1.3]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.3, 14), M('#222')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.38, z); c.add(w);
  }
  box(0.4, 0.2, 0.05, M('#fff6c0', { emissive: '#fff6c0', emissiveIntensity: 1 }), -0.6, 0.75, 2.11, c);
  box(0.4, 0.2, 0.05, M('#fff6c0', { emissive: '#fff6c0', emissiveIntensity: 1 }), 0.6, 0.75, 2.11, c);
  parent.add(c); return c;
}

function sportsCar(parent) {
  const c = new THREE.Group();
  const red = M('#ff1f3d', { roughness: 0.25, metalness: 0.4 });
  box(2.1, 0.55, 4.8, red, 0, 0.55, 0, c);
  box(1.8, 0.45, 1.8, red, 0, 1.05, -0.4, c);
  box(1.82, 0.36, 1.6, M('#1d2b3a', { roughness: 0.1, metalness: 0.5 }), 0, 1.07, -0.4, c);
  box(2.1, 0.12, 0.5, M('#111'), 0, 1.05, -2.3, c);              // spoiler
  for (const [x, z] of [[-1.05, 1.5], [1.05, 1.5], [-1.05, -1.5], [1.05, -1.5]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.34, 16), M('#111')); w.rotation.z = Math.PI / 2; w.position.set(x, 0.42, z); c.add(w);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.36, 12), M('#ffd400', { metalness: 0.9, roughness: 0.2 })); rim.rotation.z = Math.PI / 2; rim.position.set(x, 0.42, z); c.add(rim);
  }
  parent.add(c); return c;
}

export function buildTown() {
  const scene = new THREE.Scene();
  scene.background = tex(4, 512, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#2f8cff'); gr.addColorStop(0.55, '#8cc8ff'); gr.addColorStop(1, '#d8f0ff'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  scene.fog = new THREE.Fog(0xcfeaff, 90, 260);
  scene.add(new THREE.HemisphereLight(0xdff1ff, 0xb8a88a, 1.15));
  const sun = new THREE.DirectionalLight(0xfff3dc, 2.1);
  sun.position.set(-30, 50, 25); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -35, right: 35, top: 35, bottom: -35, near: 1, far: 150 });
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  // ground
  const road = new THREE.Mesh(new THREE.PlaneGeometry(10, 400), M('#5d6470')); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; scene.add(road);
  for (let z = -200; z < 200; z += 6) box(0.25, 0.02, 2.6, M('#ffffff'), 0, 0.01, z, scene, false);
  for (const s of [-1, 1]) {
    box(6, 0.3, 400, M('#c9d1db'), s * 8, 0.15, 0, scene, false);          // sidewalk
    box(0.3, 0.32, 400, M('#b9c2cc'), s * 5.1, 0.16, 0, scene, false);     // curb
    const grass = new THREE.Mesh(new THREE.PlaneGeometry(60, 400), M('#7cd36b')); grass.rotation.x = -Math.PI / 2; grass.position.set(s * 45, -0.01, 0); scene.add(grass);
  }
  // buildings on both sides, shop fronts facing the road
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const shopZ = [];
  for (const s of [-1, 1]) {
    for (let z = -150; z < 60;) {
      const w = 7 + Math.floor(rnd() * 6), h = 7 + Math.floor(rnd() * 5) * 3, d = 12;
      const color = WALLS[Math.floor(rnd() * WALLS.length)];
      const t = facade(color).clone(); t.needsUpdate = true; t.repeat.set(w / 4, h / 4);
      const wall = M('#ffffff', { map: t });
      const b = box(d, h, w, wall, s * (11 + d / 2), h / 2, z + w / 2, scene);
      box(d + 0.4, 0.5, w + 0.4, M('#ffffff'), b.position.x, h + 0.25, b.position.z, scene);       // roof trim
      // shop front
      const fx = s * 10.95;
      box(0.2, 3.0, w - 1.2, M('#1f4fa8', { roughness: 0.15, metalness: 0.4 }), fx, 1.8, z + w / 2, scene);
      const aw = box(1.6, 0.12, w - 0.6, M('#ffffff', { map: awningTex }), s * 10.3, 3.55, z + w / 2, scene);
      aw.rotation.z = s * 0.3;
      shopZ.push([s, z + w / 2, w]);
      z += w + 0.4;
    }
  }
  // glassy towers in the distance
  for (let i = 0; i < 26; i++) {
    const w = 8 + rnd() * 10, h = 30 + rnd() * 60;
    const t = glassTex.clone(); t.needsUpdate = true; t.repeat.set(w / 6, h / 10);
    const x = (rnd() > 0.5 ? 1 : -1) * (30 + rnd() * 60), z = -60 - rnd() * 140;
    box(w, h, w, M('#ffffff', { map: t, roughness: 0.3 }), x, h / 2, z, scene, false);
  }
  // purple neon tower at the end of the street
  box(16, 70, 12, M('#7b3fe4', { map: (() => { const t = glassTex.clone(); t.needsUpdate = true; t.repeat.set(3, 12); return t; })() }), 0, 35, -175, scene, false);
  // trees + lamps
  for (const s of [-1, 1]) for (let z = -120; z < 50; z += 13) {
    box(0.35, 1.6, 0.35, M('#8d5a2b'), s * 9.4, 1.1, z, scene);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 0), M('#3fbf5f', { flatShading: true })); crown.position.set(s * 9.4, 2.8, z); crown.castShadow = true; scene.add(crown);
    box(0.15, 4.6, 0.15, M('#2b2f36'), s * 5.7, 2.6, z + 6, scene);
    box(0.9, 0.15, 0.3, M('#2b2f36'), s * 5.3, 4.9, z + 6, scene);
  }
  // clouds
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.SphereGeometry(3 + rnd() * 3, 10, 8), M('#ffffff', { flatShading: true, emissive: '#ffffff', emissiveIntensity: 0.4 })); p.position.set(k * 4 - 6, rnd() * 2, rnd() * 3); c.add(p); }
    c.position.set(-120 + rnd() * 240, 55 + rnd() * 30, -60 - rnd() * 150); scene.add(c);
  }
  // billboard on the right-hand building nearest the origin (faces the road)
  const bbMat = new THREE.MeshBasicMaterial({ map: billboardTex('') });
  const bb = new THREE.Mesh(new THREE.PlaneGeometry(8, 4), bbMat); bb.rotation.y = -Math.PI / 2; bb.position.set(10.8, 6.0, -2); scene.add(bb);
  box(0.3, 4.5, 8.5, M('#1a1a2e'), 10.95, 6.0, -2, scene);
  let bbText = null;
  // bank storefront sign
  const bank = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.6), new THREE.MeshBasicMaterial({ map: tex(768, 200, (g, w, h) => { g.fillStyle = '#0b6e4f'; g.fillRect(0, 0, w, h); g.fillStyle = '#ffd400'; g.font = '900 130px Inter'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('$ BANK $', w / 2, h / 2 + 6); }) }));
  bank.rotation.y = -Math.PI / 2; bank.position.set(10.75, 4.6, 16); scene.add(bank);

  // traffic
  const cars = ['#ffcc00', '#2d9cdb', '#ffffff', '#ff6b6b', '#27ae60', '#9b51e0'].map((c, i) => ({ g: car(c, scene), lane: i % 2 ? 2.4 : -2.4, off: i * 37 }));
  const hero = sportsCar(scene); hero.visible = false;

  return {
    scene, anchors: {},
    update(t, opt = {}) {
      if ((opt.billboard ?? '') !== bbText) {
        bbText = opt.billboard ?? '';
        if (bbMat.map) bbMat.map.dispose();
        bbMat.map = billboardTex(bbText || 'WELCOME\nTO TOWN'); bbMat.needsUpdate = true;
      }
      for (const c of cars) {
        const dir = c.lane > 0 ? 1 : -1;
        const z = ((t * 9 * dir + c.off) % 220 + 220) % 220 - 160;
        c.g.position.set(c.lane, 0, z); c.g.rotation.y = dir > 0 ? 0 : Math.PI;
        c.g.visible = opt.traffic !== false;
      }
      if (opt.sportsCar) {
        const { from = [2.4, 0, -40], to = [2.4, 0, 1], at = 0, dur = 1.6 } = opt.sportsCar;
        const k = Math.min(1, Math.max(0, ((opt.local || 0) - at) / dur)), e = 1 - Math.pow(1 - k, 3);
        hero.visible = true;
        hero.position.set(from[0] + (to[0] - from[0]) * e, 0, from[2] + (to[2] - from[2]) * e);
        hero.rotation.y = opt.sportsCar.rotY ?? 0;
      } else hero.visible = false;
    },
  };
}
