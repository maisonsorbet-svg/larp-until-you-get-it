// Low-poly 3D sets. Each builder returns { scene, update(t), anchors }.
import * as THREE from 'three';

const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.85, ...extra });
const glow = (color, intensity = 2) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity });

function gradientTexture(stops, w = 4, h = 512) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, h);
  stops.forEach(([p, col]) => gr.addColorStop(p, col));
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function box(w, h, d, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z); m.castShadow = m.receiveShadow = true;
  parent && parent.add(m); return m;
}
function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, parent, seg = 12) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z); m.castShadow = true; parent && parent.add(m); return m;
}

// ---------------------------------------------------------------- warship
export function buildShip() {
  const ship = new THREE.Group();
  const hullMat = std(0x6f7f8f), deckMat = std(0x45484c), supMat = std(0x8796a5), dark = std(0x2b2f33);
  const s = new THREE.Shape();
  s.moveTo(-2, -12); s.lineTo(2, -12); s.lineTo(2.1, 5); s.quadraticCurveTo(1.6, 10.5, 0, 14);
  s.quadraticCurveTo(-1.6, 10.5, -2.1, 5); s.closePath();
  const hullGeo = new THREE.ExtrudeGeometry(s, { depth: 2.2, bevelEnabled: false });
  hullGeo.rotateX(-Math.PI / 2); hullGeo.translate(0, -1.2, 0);
  const hull = new THREE.Mesh(hullGeo, hullMat); hull.castShadow = true; ship.add(hull);
  const deckGeo = new THREE.ShapeGeometry(s); deckGeo.rotateX(-Math.PI / 2); deckGeo.translate(0, 1.01, 0);
  ship.add(new THREE.Mesh(deckGeo, deckMat));
  box(2.6, 1.6, 6, supMat, 0, 1.8, 1.5, ship);            // superstructure
  box(2.2, 1.2, 2.4, supMat, 0, 3.2, 3.2, ship);          // bridge
  for (let i = -2; i <= 2; i++) box(0.3, 0.25, 0.05, glow(0xffd27a, 3), i * 0.42, 3.35, 4.42, ship); // bridge windows
  for (let i = 0; i < 6; i++) box(0.05, 0.2, 0.25, glow(0xffd27a, 2), 1.31, 1.9, -0.6 + i * 0.75, ship);
  cyl(0.55, 0.65, 2.2, dark, 0, 3.6, 0.2, ship);          // funnel
  cyl(0.09, 0.12, 6, dark, 0, 5.5, 2.6, ship, 6);         // mast
  box(2.4, 0.08, 0.08, dark, 0, 7, 2.6, ship);
  const lamp = box(0.18, 0.18, 0.18, glow(0xff3b30, 4), 0, 8.5, 2.6, ship);
  for (const z of [8.3, -7.5]) {                           // gun turrets
    const tur = new THREE.Group(); tur.position.set(0, 1.4, z); ship.add(tur);
    box(1.5, 0.8, 1.7, supMat, 0, 0, 0, tur);
    for (const x of [-0.3, 0.3]) { const b = cyl(0.08, 0.08, 2.4, dark, x, 0.1, (z > 0 ? 1 : -1) * 1.6, tur, 6); b.rotation.x = Math.PI / 2; }
  }
  const nav = new THREE.PointLight(0xffd27a, 6, 14); nav.position.set(0, 4, 5); ship.add(nav);
  return { ship, lamp };
}

// ---------------------------------------------------------------- ocean
export function buildOcean({ mood = 'night' } = {}) {
  const scene = new THREE.Scene();
  const night = mood === 'night';
  scene.background = gradientTexture(night
    ? [[0, '#03050c'], [0.45, '#0b1730'], [0.62, '#1d3557'], [1, '#0b1730']]
    : [[0, '#1b1036'], [0.4, '#6d2e46'], [0.6, '#e07a3f'], [1, '#1b1036']]);
  scene.fog = new THREE.Fog(night ? 0x0b1730 : 0x6d2e46, 30, 170);
  scene.add(new THREE.HemisphereLight(night ? 0x8fb3ff : 0xffb38a, 0x0a0f1e, night ? 0.9 : 1.4));
  const moon = new THREE.DirectionalLight(night ? 0xcfe0ff : 0xffa060, night ? 1.6 : 2.2);
  moon.position.set(-40, 30, -60); scene.add(moon);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(night ? 6 : 12, 48), new THREE.MeshBasicMaterial({ color: night ? 0xf2f0e6 : 0xffb050, fog: false }));
  disc.position.set(-60, night ? 45 : 8, -150); disc.lookAt(0, 0, 0); scene.add(disc);
  if (night) {
    const pts = []; for (let i = 0; i < 700; i++) {
      const a = Math.random() * Math.PI * 2, e = 0.15 + Math.random() * 1.2, r = 180;
      pts.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6, fog: false })));
  }
  const geo = new THREE.PlaneGeometry(400, 400, 90, 90); geo.rotateX(-Math.PI / 2);
  const base = geo.attributes.position.array.slice();
  const water = new THREE.Mesh(geo, std(night ? 0x123a63 : 0x3b2a5a, { roughness: 0.35, metalness: 0.2 }));
  water.receiveShadow = true; scene.add(water);
  const { ship, lamp } = buildShip(); scene.add(ship);
  // distant flashes on the horizon (war)
  const flash = new THREE.PointLight(0xff8a3d, 0, 200); flash.position.set(60, 6, -110); scene.add(flash);
  const wave = (x, z, t) => Math.sin(x * 0.09 + t * 1.1) * 0.55 + Math.cos(z * 0.07 + t * 0.8) * 0.45 + Math.sin((x + z) * 0.2 + t * 1.9) * 0.15;
  return {
    scene, anchors: { ship },
    update(t, opt = {}) {
      const p = geo.attributes.position.array;
      for (let i = 0; i < p.length; i += 3) p[i + 1] = wave(base[i], base[i + 2], t);
      geo.attributes.position.needsUpdate = true; geo.computeVertexNormals();
      const sz = opt.shipZ || 0;
      ship.position.set(0, wave(0, sz, t) * 0.6 - 0.2, sz);
      ship.rotation.set(Math.sin(t * 0.9) * 0.03, opt.shipYaw || 0, Math.sin(t * 0.7) * 0.05);
      lamp.material.emissiveIntensity = (t % 1.2) < 0.5 ? 5 : 0.3;
      flash.intensity = opt.war ? ((t * 1.7) % 2.3 < 0.12 ? 9000 : 0) : 0;
    },
  };
}

// ---------------------------------------------------------------- interiors
function room({ w = 10, d = 10, h = 4.2, wall = 0x5f7c7a, floor = 0x3d4143, ceiling = 0x2c3133 }) {
  const g = new THREE.Group();
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std(floor)); fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; g.add(fl);
  const ce = new THREE.Mesh(new THREE.PlaneGeometry(w, d), std(ceiling)); ce.rotation.x = Math.PI / 2; ce.position.y = h; g.add(ce);
  const wm = std(wall);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wm); back.position.set(0, h / 2, -d / 2); back.receiveShadow = true; g.add(back);
  const l = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wm); l.rotation.y = Math.PI / 2; l.position.set(-w / 2, h / 2, 0); l.receiveShadow = true; g.add(l);
  const r = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wm); r.rotation.y = -Math.PI / 2; r.position.set(w / 2, h / 2, 0); r.receiveShadow = true; g.add(r);
  // rivet band, a "ship" detail
  box(w, 0.12, 0.05, std(0x3f5150), 0, 1.1, -d / 2 + 0.03, g);
  return g;
}

function porthole(x, y, z, ry, parent, color = 0x2b5d9b) {
  const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.y = ry;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 10, 24), std(0xb08d57, { metalness: 0.7, roughness: 0.3 })); p.add(ring);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), glow(color, 0.8)); glass.position.z = -0.01; p.add(glass);
  parent.add(p); return p;
}

export function buildSickbay() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b0f12);
  const r = room({ wall: 0x6f8f8a }); scene.add(r);
  scene.add(new THREE.HemisphereLight(0xcfe8ff, 0x303030, 1.1));
  // operating table
  box(2.6, 0.12, 1.1, std(0xd9dde0), 0, 1.0, 0, scene);
  for (const [x, z] of [[-1.1, -0.4], [1.1, -0.4], [-1.1, 0.4], [1.1, 0.4]]) cyl(0.05, 0.05, 1, std(0x9ea7ad), x, 0.5, z, scene, 6);
  // swinging surgical lamp
  const lampPivot = new THREE.Group(); lampPivot.position.set(0, 4.2, 0); scene.add(lampPivot);
  cyl(0.03, 0.03, 1.2, std(0x333333), 0, -0.6, 0, lampPivot, 6);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.45, 20, 1, true), std(0xdfe6e9, { side: THREE.DoubleSide })); shade.position.y = -1.3; lampPivot.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), glow(0xfff4d6, 4)); bulb.position.y = -1.45; lampPivot.add(bulb);
  const spot = new THREE.SpotLight(0xfff1d0, 90, 12, 0.75, 0.5, 1.6); spot.position.y = -1.4; spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024); lampPivot.add(spot); spot.target.position.set(0, -5, 0); lampPivot.add(spot.target);
  // cabinets, tray, red cross
  box(1.6, 2.2, 0.6, std(0xe3e7e8), -3.6, 1.1, -4.6, scene);
  for (let i = 0; i < 3; i++) box(1.4, 0.04, 0.5, std(0x9bb0b3), -3.6, 0.5 + i * 0.7, -4.28, scene);
  box(0.8, 0.06, 0.5, std(0xb0bec5, { metalness: 0.8, roughness: 0.25 }), 1.9, 1.15, 0.6, scene);
  cyl(0.04, 0.04, 1.1, std(0x9ea7ad), 1.9, 0.6, 0.6, scene, 6);
  const cross = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), new THREE.MeshBasicMaterial({ map: canvasTex(256, 256, (g) => { g.fillStyle = '#f5f5f5'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#c62828'; g.fillRect(96, 32, 64, 192); g.fillRect(32, 96, 192, 64); }) }));
  cross.position.set(2.5, 2.7, -4.97); scene.add(cross);
  porthole(-1.2, 2.6, -4.96, 0, scene); porthole(0.4, 2.6, -4.96, 0, scene);
  const ambient = new THREE.PointLight(0x7fb6ff, 16, 12); ambient.position.set(-2, 3, 2); scene.add(ambient);
  return {
    scene, anchors: { table: new THREE.Vector3(0, 1.06, 0) },
    update(t) { lampPivot.rotation.z = Math.sin(t * 1.3) * 0.08; lampPivot.rotation.x = Math.sin(t * 0.9) * 0.05; },
  };
}

export function buildCabin() {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x07090b);
  scene.add(room({ w: 7, d: 7, h: 3.6, wall: 0x5d6b7a, floor: 0x4a3b2e }));
  scene.add(new THREE.HemisphereLight(0x9fb7d9, 0x1a1410, 0.35));
  const wood = std(0x7a4e2d);
  box(2.2, 0.1, 1.0, wood, 1.4, 1.0, -2.9, scene);                 // desk
  for (const x of [0.4, 2.4]) box(0.1, 1.0, 0.9, wood, x, 0.5, -2.9, scene);
  box(2.6, 0.5, 1.1, std(0x4d5c6b), -2.0, 0.5, -2.8, scene);         // bunk
  box(2.4, 0.2, 1.0, std(0xd7ccc8), -2.0, 0.85, -2.8, scene);
  // stacked books on the desk
  [[0x8b1e1e, 0], [0x1e4d8b, 0.12], [0x2e7d32, 0.24]].forEach(([c, y]) => box(0.6, 0.11, 0.42, std(c), 2.0, 1.11 + y, -3.0, scene));
  const lampHead = cyl(0.05, 0.22, 0.25, std(0x2e7d32), 0.8, 1.7, -3.1, scene); lampHead.rotation.z = 0.4;
  cyl(0.02, 0.02, 0.65, std(0x222222), 0.75, 1.35, -3.1, scene, 6);
  const warm = new THREE.PointLight(0xffb45e, 18, 7, 1.4); warm.position.set(0.7, 1.6, -2.6); warm.castShadow = true; scene.add(warm);
  porthole(-0.8, 2.3, -3.46, 0, scene, 0x0d1d3a);
  return {
    scene, anchors: {},
    update(t) { warm.intensity = 18 + Math.sin(t * 17) * 0.6 + Math.sin(t * 5.3) * 0.8; },
  };
}

export function buildOffice({ tone = 'warm' } = {}) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0a0806);
  scene.add(room({ w: 9, d: 8, h: 3.8, wall: tone === 'warm' ? 0x9c7a55 : 0x7d8a6e, floor: 0x5a3e28, ceiling: 0x3a2c1f }));
  scene.add(new THREE.HemisphereLight(0xffe2b8, 0x2a1d12, 0.7));
  // window with daylight
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), glow(0xfff1c9, 1.2)); win.position.set(-2.2, 2.2, -3.98); scene.add(win);
  box(0.08, 1.6, 0.05, std(0x3a2a1a), -2.2, 2.2, -3.95, scene); box(2.2, 0.08, 0.05, std(0x3a2a1a), -2.2, 2.2, -3.95, scene);
  const sun = new THREE.SpotLight(0xffe0a8, 60, 14, 0.6, 0.6, 1.2); sun.position.set(-2.2, 2.4, -3.6); sun.target.position.set(0.5, 0, 1); sun.castShadow = true;
  scene.add(sun, sun.target);
  // bookshelf
  box(2.4, 3, 0.5, std(0x5c3b22), 2.8, 1.5, -3.7, scene);
  const cols = [0x8b1e1e, 0x1e4d8b, 0x2e7d32, 0xc9a227, 0x5d4037, 0x37474f];
  for (let row = 0; row < 4; row++) for (let i = 0; i < 9; i++) box(0.2, 0.5 + (i % 3) * 0.06, 0.32, std(cols[(i + row * 2) % cols.length]), 1.8 + i * 0.24, 0.5 + row * 0.72, -3.55, scene);
  // diploma frame on the wall
  const dip = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.7), new THREE.MeshBasicMaterial({ map: canvasTex(360, 280, (g) => {
    g.fillStyle = '#3a2a1a'; g.fillRect(0, 0, 360, 280); g.fillStyle = '#f3ead2'; g.fillRect(18, 18, 324, 244);
    g.fillStyle = '#3a2a1a'; g.font = 'bold 34px serif'; g.textAlign = 'center'; g.fillText('DOCTOR OF', 180, 110); g.fillText('MEDICINE', 180, 150);
    g.fillStyle = '#b71c1c'; g.beginPath(); g.arc(280, 215, 22, 0, 7); g.fill();
  }) }));
  dip.position.set(0.2, 2.5, -3.97); scene.add(dip);
  // desk
  box(2.8, 0.12, 1.2, std(0x6d4426), 0.2, 1.0, -1.2, scene);
  box(0.12, 1.0, 1.1, std(0x6d4426), -1.1, 0.5, -1.2, scene); box(0.12, 1.0, 1.1, std(0x6d4426), 1.5, 0.5, -1.2, scene);
  // papers on the desk (the "credentials")
  const papers = [];
  for (let i = 0; i < 3; i++) { const p = box(0.5, 0.01, 0.66, std(0xf5f0e1), -0.2 + i * 0.25, 1.07 + i * 0.01, -1.1, scene); p.rotation.y = 0.2 * i - 0.2; papers.push(p); }
  return { scene, anchors: { papers }, update() {} };
}

export function buildNewsroom() {
  const scene = new THREE.Scene();
  scene.background = gradientTexture([[0, '#120c06'], [0.5, '#2b1a0c'], [1, '#120c06']]);
  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const key = new THREE.DirectionalLight(0xffe2b0, 2.5); key.position.set(2, 3, 5); scene.add(key);
  const tex = canvasTex(1024, 1400, (g, w, h) => {
    g.fillStyle = '#efe7d3'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#1a1a1a'; g.textAlign = 'center';
    g.font = '900 92px serif'; g.fillText('★  NEWS  ★', w / 2, 120);
    g.fillRect(40, 150, w - 80, 8); g.font = 'italic 30px serif'; g.fillText('1951', w / 2, 200); g.fillRect(40, 220, w - 80, 4);
    g.font = '900 104px serif'; g.fillText('SHIP\'S DOCTOR', w / 2, 360); g.fillText('SAVES SAILORS', w / 2, 475);
    g.font = 'italic 40px serif'; g.fillText('(illustration)', w / 2, 560);
    g.fillStyle = '#9b9384'; g.fillRect(70, 610, 420, 360);
    g.fillStyle = '#5d574c'; g.beginPath(); g.arc(280, 760, 95, 0, 7); g.fill(); g.fillRect(170, 860, 220, 110);
    g.fillStyle = '#3c3830'; for (let i = 0; i < 26; i++) g.fillRect(i < 14 ? 530 : 70, (i < 14 ? 620 : 1000 - 14 * 42) + i * 42, i % 4 === 3 ? 260 : 420, 14);
  });
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(3, 4.1), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide, roughness: 0.9 }));
  scene.add(paper);
  return {
    scene, anchors: { paper },
    update(t, opt = {}) {
      const k = Math.min(1, (opt.local || 0) / 1.1), e = 1 - Math.pow(1 - k, 3);
      paper.rotation.z = (1 - e) * Math.PI * 6; paper.position.z = -14 + e * 14;
      paper.rotation.x = Math.sin(t * 0.8) * 0.04; paper.rotation.y = Math.sin(t * 0.6) * 0.06;
    },
  };
}

export function buildStage() {   // black stage for the title card / outro
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x000000);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 0.7));
  const spot = new THREE.SpotLight(0xffe7b0, 120, 20, 0.45, 0.5, 1.2); spot.position.set(0, 8, 2); spot.castShadow = true;
  scene.add(spot, spot.target);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(6, 48), std(0x1b1b1b)); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  return { scene, anchors: {}, update() {} };
}

export const SETS = { ocean: buildOcean, sickbay: buildSickbay, cabin: buildCabin, office: buildOffice, newsroom: buildNewsroom, stage: buildStage };
