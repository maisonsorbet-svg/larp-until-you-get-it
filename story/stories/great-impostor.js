// TRUE STORY: Ferdinand Waldo Demara, "The Great Impostor".
// Only facts that several independent sources agree on are used (see SOURCES.md).
// Where sources disagree (exact surgery count, who spotted the newspaper story),
// the captions stay deliberately general.

const SEPIA = 'background:rgba(160,110,50,.45);mix-blend-mode:color';

export default {
  label: '<b></b>TRUE STORY · PART 1',
  cast: {
    fred:    { outfit: 'doctor', skin: '#f0c6a0', hair: '#3a2718', height: 1.85 },
    cyr:     { outfit: 'suit', skin: '#e9b993', hair: '#1c1c1c', moustache: true, height: 1.8 },
    patient: { pose: 'lie', skin: '#d9a47e', hair: '#2a1a10', height: 1.35 },
    sailorA: { outfit: 'sailor', hat: 'sailor', skin: '#e2b08b', hair: '#5b3a1e', height: 1.75 },
    sailorB: { outfit: 'sailor', hat: 'sailor', skin: '#b98260', hair: '#1a1a1a', height: 1.8, flip: true },
    captain: { outfit: 'officer', hat: 'cap', skin: '#eec09c', hair: '#8a8a8a', height: 1.85, moustache: true },
  },
  shots: [
    { // 1 — hook
      dur: 3.8, set: 'sickbay',
      cam: { from: { pos: [-1.6, 1.45, 3.4], look: [-1.8, 1.15, -0.3] }, to: { pos: [-1.75, 1.5, 2.3], look: [-1.8, 1.2, -0.3] }, fov: 46 },
      chars: [{ who: 'fred', pos: [-1.8, 0, -0.3], state: { mouth: 'smirk', brows: 'smug' } }],
      captions: [{ at: 0.1, text: 'He had *zero* medical training.', style: 'big' },
                 { at: 2.0, text: 'So he became a *navy surgeon.*', style: 'big' }],
    },
    { // 2 — setting
      dur: 4.4, set: 'ocean', update: { war: true },
      cam: { from: { pos: [-16, 5, 26], look: [0, -0.5, 0] }, to: { pos: [-11, 3.5, 18], look: [0, 0, 1] }, fov: 50 },
      captions: [{ at: 0.1, text: '1951. The *Korean War.*' },
                 { at: 2.0, text: 'Canadian destroyer *HMCS Cayuga.*' }],
    },
    { // 3 — who he is (flashback)
      dur: 5.0, set: 'office', grade: SEPIA,
      cam: { from: { pos: [-0.3, 1.4, 4.8], look: [0, 0.95, 0] }, to: { pos: [0.2, 1.35, 4.1], look: [0, 0.95, 0] }, fov: 50 },
      chars: [
        { who: 'fred', def: { outfit: 'suit', skin: '#f0c6a0', hair: '#3a2718' }, pos: [-0.55, 0, 0.4], state: { talk: true, brows: 'calm' }, states: [{ at: 2.4, state: { talk: false, mouth: 'smile' } }] },
        { who: 'cyr', def: { outfit: 'doctor' }, pos: [0.6, 0, 0.3], state: { mouth: 'smile' }, states: [{ at: 2.4, state: { talk: true } }] },
      ],
      captions: [{ at: 0.1, text: 'His name: *Ferdinand Waldo Demara.*' },
                 { at: 2.4, text: 'He befriended a real doctor, *Joseph Cyr...*' }],
    },
    { // 4 — the steal
      dur: 3.4, set: 'office', grade: SEPIA,
      cam: { from: { pos: [0.4, 1.8, 1.6], look: [0.5, 1.1, -1.6] }, to: { pos: [0.3, 1.7, 0.9], look: [0.5, 1.15, -1.6] }, fov: 50 },
      chars: [{ who: 'fred', def: { outfit: 'suit', skin: '#f0c6a0', hair: '#3a2718' }, pos: [0.8, 0, -2.3], state: { mouth: 'smirk', brows: 'smug' } }],
      captions: [{ at: 0.15, text: '...and used *his credentials.*', style: 'big' }],
    },
    { // 5 — commissioned
      dur: 3.6, set: 'ocean', update: { war: true },
      cam: { from: { pos: [6, 2.2, 16], look: [0, 2.2, 6] }, to: { pos: [4.5, 2.6, 12], look: [0, 2.6, 4] }, fov: 48 },
      captions: [{ at: 0.1, text: 'The navy made him the ship\'s *doctor.*' }],
    },
    { // 6 — the crisis
      dur: 4.6, set: 'sickbay', shake: { amt: 0.06, dur: 0.6 },
      cam: { from: { pos: [0, 2.0, 3.8], look: [0, 1.1, -0.3] }, to: { pos: [0, 1.95, 3.2], look: [0, 1.15, -0.3] }, fov: 48 },
      chars: [
        { who: 'patient', pos: [0, 1.2, 0.05] },
        { who: 'fred', pos: [0.75, 0, -0.8], state: { wide: true, brows: 'worried', mouth: 'open' } },
        { who: 'sailorA', pos: [-0.95, 0, -0.8], state: { brows: 'worried', mouth: 'worried' } },
      ],
      captions: [{ at: 0.1, text: 'Then wounded men were brought aboard.' },
                 { at: 2.2, text: 'One had a bullet *near his heart.*' }],
    },
    { // 7 — the textbook
      dur: 4.4, set: 'cabin',
      cam: { from: { pos: [0.7, 1.5, 1.4], look: [1.0, 1.15, -1.8] }, to: { pos: [0.85, 1.5, 0.8], look: [1.0, 1.2, -1.8] }, fov: 48 },
      chars: [{ who: 'fred', pos: [1.0, 0, -1.8], state: { pose: 'read', brows: 'worried', mouth: 'flat' }, states: [{ at: 2.3, state: { brows: 'angry', mouth: 'flat' } }] }],
      captions: [{ at: 0.1, text: 'He went to his cabin with a *surgery textbook...*' },
                 { at: 2.3, text: '...then he *operated.*', style: 'big' }],
    },
    { // 8 — the result
      dur: 4.2, set: 'sickbay',
      cam: { from: { pos: [-1.4, 1.9, 3.0], look: [0, 1.05, -0.3] }, to: { pos: [-0.7, 1.8, 2.6], look: [0, 1.1, -0.3] }, fov: 48 },
      chars: [
        { who: 'patient', pos: [0, 1.2, 0.05], state: { smile: true, mouth: 'smile' } },
        { who: 'fred', pos: [0.6, 0, -0.8], state: { mouth: 'smile', brows: 'calm' } },
      ],
      captions: [{ at: 0.1, text: 'He removed the bullet.' },
                 { at: 1.8, text: 'The man *survived.*', style: 'big' }],
    },
    { // 9 — the streak
      dur: 4.6, set: 'sickbay',
      cam: { from: { pos: [0, 1.4, 5.4], look: [0, 1.0, 0.9] }, to: { pos: [0, 1.4, 4.7], look: [0, 1.0, 0.9] }, fov: 52 },
      chars: [
        { who: 'fred', pos: [0, 0, 1.0], state: { pose: 'wave', mouth: 'smile', brows: 'smug' } },
        { who: 'sailorA', pos: [-0.75, 0, 1.25], state: { mouth: 'open', bob: true } },
        { who: 'sailorB', pos: [0.75, 0, 1.25], state: { mouth: 'smile' } },
      ],
      captions: [{ at: 0.1, text: 'He operated on *more than a dozen* men.' },
                 { at: 2.6, text: 'By most accounts, they *all survived.*' }],
    },
    { // 10 — newspaper spin
      dur: 3.4, set: 'newsroom',
      cam: { from: { pos: [0, 0, 5.6], look: [0, 0, 0] }, to: { pos: [0, 0, 5.2], look: [0, 0, 0] }, fov: 50 },
      captions: [{ at: 1.0, text: 'Then it hit the *newspapers.*', style: 'big' }],
    },
    { // 11 — the real Cyr
      dur: 4.6, set: 'office', setOpts: { tone: 'home' },
      cam: { from: { pos: [0, 1.4, 4.2], look: [0, 1.05, 0.4] }, to: { pos: [0, 1.5, 2.8], look: [0, 1.1, 0.4] }, fov: 48 },
      chars: [{ who: 'cyr', pos: [0, 0, 0.6], state: { pose: 'paper', brows: 'calm', mouth: 'flat' }, states: [{ at: 1.9, state: { wide: true, brows: 'shock', mouth: 'open' } }] }],
      shake: null,
      captions: [{ at: 0.1, text: 'Back in New Brunswick...' },
                 { at: 1.9, text: 'the story reached the *REAL Dr. Cyr.*', style: 'big' }],
    },
    { // 12 — consequences
      dur: 5.0, set: 'ocean', setOpts: { mood: 'dusk' }, update: { shipYaw: Math.PI },
      cam: { from: { pos: [8, 5, -20], look: [0, 0, 0] }, to: { pos: [14, 8, -34], look: [0, -1, 0] }, fov: 50 },
      captions: [{ at: 0.1, text: 'The navy was *embarrassed.*' },
                 { at: 1.9, text: 'No charges. They just sent him back to the *US.*' }],
    },
    { // 13 — legacy
      dur: 4.8, set: 'stage',
      cam: { from: { pos: [0, 1.3, 3.8], look: [0, 1.0, 0] }, to: { pos: [0, 1.4, 3.1], look: [0, 1.1, 0] }, fov: 46 },
      chars: [{ who: 'fred', pos: [0, 0, 0], state: { mouth: 'smirk', brows: 'smug' } }],
      captions: [{ at: 0.1, text: 'Hollywood turned it into a movie:' },
                 { at: 1.8, text: '*The Great Impostor* (1961).', style: 'big' }],
    },
    { // 14 — outro / series tie-in
      dur: 4.8, set: 'stage',
      cam: { from: { pos: [0, 1.4, 3.1], look: [0, 1.1, 0] }, to: { pos: [0, 1.45, 2.7], look: [0, 1.15, 0] }, fov: 46 },
      chars: [{ who: 'fred', pos: [0, 0, 0], state: { pose: 'wave', mouth: 'smile', brows: 'smug' } }],
      captions: [{ at: 0.1, text: 'Larp until you get it...' },
                 { at: 1.6, text: 'but maybe *not* as a surgeon.', style: 'big' },
                 { at: 3.4, text: 'Part 2: his *other* fake lives.', style: 'small' }],
    },
  ],
};
