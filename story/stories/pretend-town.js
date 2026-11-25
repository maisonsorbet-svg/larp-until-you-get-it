// "In this town, whatever you pretend to be for 30 days... becomes real."
// Original fictional story in the bright blocky "In this town" format.

const R = -Math.PI / 2;            // turn a character to face the camera on the road
// camera standing in the road, looking at `look` from distance d (yaw in degrees, + = towards +z)
const V = (look, d, yaw = 0, up = 0.5) => ({ pos: [look[0] - d * Math.cos(yaw * Math.PI / 180), look[1] + up, look[2] + d * Math.sin(yaw * Math.PI / 180)], look });
const RICH = { shirt: '#7b2ff7', pants: '#1d1d2b', shoes: '#ffffff', chain: true, shades: true };

export default {
  label: '',
  captionMode: 'word',
  wps: 2.7,
  toneMapping: 'none',
  cast: {
    leo:  { kind: 'blocky', skin: '#f2c29b', hair: '#2b1a10', shirt: '#8d99ae', pants: '#3d5a80', shoes: '#333', seed: 0.1 },
    leoR: { kind: 'blocky', skin: '#f2c29b', hair: '#2b1a10', ...RICH, seed: 0.1 },
    max:  { kind: 'blocky', skin: '#c98d5e', hair: '#111111', ...RICH, seed: 0.6 },
    maxL: { kind: 'blocky', skin: '#f2c29b', hair: '#2b1a10', ...RICH, seed: 0.6 },
    amy:  { kind: 'blocky', skin: '#ffd5b8', hair: '#f4c542', hairStyle: 'long', shirt: '#ff5fa2', pants: '#ffffff', shoes: '#ff5fa2', seed: 0.3 },
    jay:  { kind: 'blocky', skin: '#8d5a3b', hairStyle: 'cap', cap: '#1e88e5', shirt: '#ffd400', pants: '#2b2b2b', seed: 0.8 },
    kim:  { kind: 'blocky', skin: '#f6cfa8', hair: '#1a1a1a', shirt: '#2ecc71', pants: '#3d5a80', seed: 0.45 },
  },
  shots: [
    { // 1 — hook: drone over the town
      dur: 5.0, set: 'town', update: { billboard: 'PRETEND\n30 DAYS' },
      cam: { from: { pos: [0, 34, 46], look: [0, 6, -60] }, to: { pos: [1.5, 12, 14], look: [5, 4, -20] }, fov: 55 },
      captions: [{ at: 0.1, text: 'In this town, whatever you pretend to be for 30 days... becomes *real.*' }],
    },
    { // 2 — Leo is broke
      dur: 2.9, set: 'town', update: { billboard: 'PRETEND\n30 DAYS' },
      cam: { from: V([8, 1.4, 0], 6.6, 8), to: V([8, 1.4, 0], 5.8, 4), fov: 45 },
      chars: [{ who: 'leo', pos: [8, 0.3, 0], rotY: R + 0.25, state: { anim: 'sad', face: 'sad' } }],
      popups: [{ at: 0.5, text: '$0.00', dur: 2.3 }],
      captions: [{ at: 0.1, text: 'Leo was broke.' }, { at: 1.4, text: 'Like... *really* broke.' }],
    },
    { // 3 — starts pretending
      dur: 3.1, set: 'town', update: { billboard: 'PRETEND\n30 DAYS' },
      cam: { from: V([8, 1.4, -1.5], 7.2, 25), to: V([8, 1.4, 0], 6.4, 12), fov: 45 },
      chars: [{ who: 'leoR', pos: [8.2, 0.3, -6], move: { to: [8, 0.3, 0], at: 0, dur: 2.1, linear: true }, state: { face: 'smug' }, states: [{ at: 2.1, state: { anim: 'flex' } }] }],
      captions: [{ at: 0.1, text: 'So he started pretending to be *rich.*' }],
    },
    { // 4 — day 1: everyone laughs
      dur: 3.7, set: 'town', update: { billboard: 'DAY 1' },
      cam: { from: V([8, 1.4, 0], 8.4, 2), to: V([8, 1.4, 0], 7.6, -2), fov: 45 },
      chars: [
        { who: 'leoR', pos: [8, 0.3, 0], rotY: R, state: { anim: 'flex', face: 'smug' } },
        { who: 'amy', pos: [7.2, 0.3, -1.5], rotY: 0.5, state: { anim: 'laugh', face: 'laugh' } },
        { who: 'jay', pos: [7.0, 0.3, 1.55], rotY: Math.PI - 0.6, state: { anim: 'laugh', face: 'laugh' } },
        { who: 'kim', pos: [9.4, 0.3, -1.2], rotY: -0.9, state: { anim: 'point', face: 'laugh' } },
      ],
      popups: [{ at: 0.1, text: 'DAY 1', kind: 'day', y: 470, dur: 3.4 }],
      captions: [{ at: 0.1, text: 'Day one. Fake chain. Fake glasses. Everyone *laughed.*' }],
    },
    { // 5 — day 12: the yacht lie
      dur: 6.0, set: 'town', update: { billboard: 'DAY 12' },
      cam: { from: V([8, 1.4, -0.2], 7.4, 18), to: V([8, 1.4, -0.2], 6.6, 12), fov: 45 },
      chars: [
        { who: 'leoR', pos: [8.3, 0.3, 0.6], rotY: -2.1, state: { anim: 'point', face: 'smug', talk: true }, states: [{ at: 3.6, state: { anim: 'idle', face: 'smug', talk: false } }] },
        { who: 'jay', pos: [7.6, 0.3, -1.0], rotY: 0.9, state: { face: 'smug' }, states: [{ at: 3.6, state: { anim: 'laugh', face: 'laugh' } }] },
      ],
      popups: [{ at: 0.1, text: 'DAY 12', kind: 'day', y: 470, dur: 2.6 }],
      captions: [{ at: 0.1, text: 'Day twelve. He told everyone he owned a *yacht.*' },
                 { at: 3.6, text: 'He didn\'t even own a *bike.*' }],
    },
    { // 6 — day 29: $3
      dur: 3.4, set: 'town', update: { billboard: 'BALANCE\n$3.00' },
      cam: { from: V([8, 2.6, -0.4], 7.0, 6, -0.6), to: V([8, 2.6, -0.4], 6.4, 3, -0.6), fov: 50 },
      chars: [{ who: 'leoR', pos: [8, 0.3, 0.3], rotY: R + 0.3, state: { anim: 'sad', face: 'sad', shades: false } }],
      popups: [{ at: 0.1, text: 'DAY 29', kind: 'day', y: 470, dur: 1.6 }, { at: 1.7, text: '$3.00', y: 520, dur: 1.7 }],
      captions: [{ at: 0.1, text: 'Day twenty-nine. His bank account? *Three* dollars.' }],
    },
    { // 7 — day 30
      dur: 2.0, set: 'town', update: { billboard: 'DAY 30' }, shake: { amt: 0.05, dur: 0.5 },
      cam: { from: V([8, 1.7, 0], 4.6, 0, 0.1), to: V([8, 1.75, 0], 3.4, 0, 0.1), fov: 42 },
      chars: [{ who: 'leoR', pos: [8, 0.3, 0], rotY: R, state: { face: 'shock', anim: 'shock', shades: false } }],
      popups: [{ at: 0.05, text: 'DAY 30', kind: 'day', y: 470, dur: 2.0 }],
      captions: [{ at: 0.1, text: 'Day *thirty.*' }],
    },
    { // 8 — one million dollars
      dur: 2.6, set: 'town', update: { billboard: '$1,000,000' }, rain: { at: 0, spread: 7 },
      cam: { from: V([8, 1.5, 0], 6.8, 0), to: V([8, 1.6, 0], 6.0, 0), fov: 50 },
      chars: [{ who: 'leoR', pos: [8, 0.3, 0], rotY: R, state: { anim: 'cheer', face: 'cheer' } }],
      popups: [{ at: 0.15, text: '+$1,000,000', dur: 2.4 }],
      captions: [{ at: 0.1, text: 'One *million* dollars.' }],
    },
    { // 9 — sports car
      dur: 3.1, set: 'town', update: { billboard: '$1,000,000', traffic: false, sportsCar: { from: [2.4, 0, -45], to: [2.8, 0, -3.0], at: 0, dur: 1.4 } }, rain: { at: 0, spread: 9 },
      cam: { from: { pos: [-2.9, 2.5, 2.2], look: [4.4, 1.0, -2.3] }, to: { pos: [-2.2, 2.4, 1.6], look: [4.4, 1.0, -2.3] }, fov: 50 },
      chars: [{ who: 'leoR', pos: [6.0, 0.3, -1.4], rotY: -2.0, state: { anim: 'cheer', face: 'cheer' } }],
      captions: [{ at: 0.1, text: 'A sports car. A mansion. *Everything.*' }],
    },
    { // 10 — the twist begins
      dur: 3.8, set: 'town', update: { billboard: '$1,000,000' },
      cam: { from: V([8, 1.4, -2.5], 7.6, 30), to: V([8, 1.4, -2.0], 6.8, 24), fov: 45 },
      chars: [{ who: 'max', pos: [8.3, 0.3, -9], move: { to: [8.1, 0.3, -1.5], at: 0, dur: 2.8, linear: true }, state: { face: 'smug' }, states: [{ at: 2.8, state: { anim: 'idle' } }] }],
      captions: [{ at: 0.1, text: 'But his best friend Max had been pretending too...' }],
    },
    { // 11 — ...to be Leo
      dur: 3.9, set: 'town', update: { billboard: 'DAY 30' }, shake: { amt: 0.04, dur: 0.4 },
      cam: { from: V([8, 1.6, -0.6], 5.2, 6, 0.2), to: V([8, 1.7, -0.6], 4.2, 4, 0.2), fov: 45 },
      chars: [{ who: 'maxL', pos: [8, 0.3, -0.6], rotY: R + 0.15, state: { face: 'smug', anim: 'flex' } }],
      captions: [{ at: 0.1, text: '...pretending to be *Leo.*' }, { at: 1.6, text: 'And today was day thirty.' }],
    },
    { // 12 — two Leos
      dur: 4.0, set: 'town', update: { billboard: '???' },
      cam: { from: V([8, 1.4, 0], 7.0, 35), to: V([8, 1.4, 0], 7.0, -35), fov: 45 },
      chars: [
        { who: 'leoR', pos: [8, 0.3, 0.9], rotY: Math.PI, state: { anim: 'shock', face: 'shock', shades: false } },
        { who: 'maxL', pos: [8, 0.3, -0.9], rotY: 0, state: { anim: 'shock', face: 'shock', shades: false } },
      ],
      captions: [{ at: 0.1, text: 'Now there are two Leos...' }, { at: 2.1, text: '...and *one* bank account.' }],
    },
    { // 13 — part 2?
      dur: 2.0, set: 'town', update: { billboard: 'PART 2?' },
      cam: { from: V([8, 1.4, 0], 7.4, 0), to: V([8, 1.45, 0], 6.6, 0), fov: 45 },
      chars: [
        { who: 'leoR', pos: [8, 0.3, 0.9], rotY: Math.PI + 0.5, state: { anim: 'point', face: 'angry', shades: false } },
        { who: 'maxL', pos: [8, 0.3, -0.9], rotY: -0.5, state: { anim: 'point', face: 'angry', shades: false } },
      ],
      captions: [{ at: 0.1, text: 'Part *2?*' }],
    },
  ],
};
