# larp-until-you-get-it

Generator for a TikTok series: animated white text on a black background,
1080×1920 (9:16), 30 fps, H.264 MP4.

## Requirements
- Python 3 + Pillow (`pip install pillow`)
- ffmpeg

## Make a video
1. Copy `episodes/ep01.json` to a new file, such as `episodes/ep04.json`, and edit the text.
2. Render it:

```bash
python3 render.py episodes/ep04.json            # -> out/ep04.mp4
python3 render.py episodes/*.json               # render every episode
python3 render.py episodes/ep04.json --preview  # quick PNG still
python3 render.py episodes/ep04.json --music track.mp3   # bake in audio
```

## Episode format
```json
{
  "series": "Larp until you get it",
  "episode": 4,
  "accent": [255, 204, 0],
  "slides": [
    { "text": "Big hook line with a *highlight*.", "style": "big" },
    { "text": "Normal line.\nForced line break.", "style": "normal", "hold": 2.0 },
    { "text": "Smaller grey side note.", "style": "small" }
  ]
}
```
- `style`: `big`, `normal` or `small`
- `*word*` or `*a few words*` shows in the accent colour
- `hold`: seconds to keep the slide on screen after it is fully shown (default depends on word count)
- `word_delay`: seconds between words appearing (default 0.12)

Text stays out of the bottom and right edges, where TikTok's caption and buttons sit.
Without `--music`, the video gets a silent audio track. Add a TikTok sound in the app instead.

---

# Animated stories (3D sets + 2D characters)

`story/` renders animated story videos. The sets are low-poly 3D (three.js): a warship on the ocean, a sickbay, a cabin, an office, a newspaper and a stage. Flat 2D "paper cut-out" characters stand inside them, with blinking, talking mouths and expressions. TikTok-style word-by-word captions run on top.

```bash
cd story
npm install                                       # installs three.js
node render.js great-impostor                     # -> story/out/great-impostor.mp4 (about 6 min)
node render.js great-impostor --stills 2,10,30    # quick PNG previews at those seconds
node render.js great-impostor --music bed.mp3     # with background music
```

- `story/stories/<name>.js` is the story: cast, shots, camera moves and captions. Copy `great-impostor.js` to start a new one.
- `story/stories/<name>.md` holds the fact check with sources, the voiceover script and the post caption.
- `story/engine/` holds the engine: `sets.js` (3D sets), `characters.js` (2D characters) and `engine.js` (timeline and captions).

Each shot looks like this:
```js
{ dur: 4.4, set: 'sickbay',                        // ocean | sickbay | cabin | office | newsroom | stage
  cam: { from: { pos: [x,y,z], look: [x,y,z] }, to: { ... }, fov: 48 },
  chars: [{ who: 'fred', pos: [0,0,-1], state: { mouth: 'smile', brows: 'smug', pose: 'wave' },
            states: [{ at: 2, state: { talk: true } }] }],
  captions: [{ at: 0.1, text: 'Then he *operated.*', style: 'big' }] }
```
Character states: `mouth` (smile, smirk, open, worried, flat), `brows` (calm, worried, angry, shock, smug), `wide` (big eyes), `talk` (animated mouth), and `pose` (stand, wave, read, paper, lie).

## "In this town" style (bright blocky city)
```bash
cd story && node render.js pretend-town     # -> story/out/pretend-town.mp4
```
- `set: 'town'` is a sunny toy city: shops, towers, trees, traffic, a billboard (`update: { billboard: 'DAY 1' }`) and a sports car (`update: { sportsCar: {...} }`).
- Characters with `kind: 'blocky'` are 3D block people. Options: `anim` (idle, walk, run, cheer, laugh, point, shock, sad, flex), `face` (happy, laugh, cheer, smug, sad, shock, angry), `shades`, `chain` and `hairStyle` (cap, long).
- `captionMode: 'word'` shows one big word at a time, at `wps` words per second.
- `popups: [{ at, text: '+$500' }]` shows a money pill. Add `kind: 'day'` for a pink badge.
- `rain: { at: 0 }` makes cash fall from the sky.
- `move: { to: [x,y,z], dur }` makes a character walk somewhere.

## Sound: original music and sound effects
All the sounds are synthesized from code: no samples and no downloads, so they're yours to use.
```bash
cd story
pip install numpy scipy
python3 audio/synth.py                            # makes audio/music/*.wav and audio/sfx/*.wav (about 4 s)
node render.js pretend-town --events              # exports the video's timeline
python3 audio/mix.py pretend-town --music bouncy  # -> out/pretend-town.bouncy.mp4
```
- **Music:** `bouncy` (happy and cartoony), `lofi` (chill), `suspense` (ticking clock) and `hype` (trap 808s).
- **Effects:** pop, ding, cash, coins, whoosh, womp, scratch, vroom, boing, laugh and drumroll.
- **Automatic cues:**
  - a whoosh on every cut
  - a pop and a ding on DAY badges
  - a cash register on "+$" pop-ups, and a sad trombone on other money pop-ups
  - coins when cash rains, and an engine sound for the sports car
- **Extra cues:** add `sfx: [{ at, name, gain }]` to a shot. Add `music: 'suspense'` to switch the music from that shot on.
- **Volume:** `--music-db -10` makes the music quieter, for example under a loud voiceover.
