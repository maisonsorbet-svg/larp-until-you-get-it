#!/usr/bin/env python3
"""
Mix a soundtrack for a rendered story and put it on the video.

    node render.js pretend-town --events          # export the timeline once
    python3 audio/mix.py pretend-town --music bouncy

Automatic cues from the story:
  * every cut              -> soft whoosh
  * popup kind 'day'       -> pop + ding
  * money popup '+$...'    -> cash register;  other money popups ($0.00) -> sad trombone
  * rain                   -> coin shower
  * sportsCar              -> engine vroom
  * shot.music = 'name'    -> music switches to that track from this shot on
  * shot.sfx = [{at, name, gain}] -> any extra sound effect
Music is kept quiet (ducked) so a voiceover added in TikTok sits on top.
"""
import argparse, json, subprocess
import numpy as np
from pathlib import Path
from scipy.io import wavfile

SR = 44100
HERE = Path(__file__).parent
ROOT = HERE.parent


def load(path):
    sr, x = wavfile.read(path)
    assert sr == SR, path
    x = x.astype(np.float32) / 32768
    return x if x.ndim == 2 else np.column_stack([x, x])


def place(buf, x, at, gain=1.0):
    i = max(0, int(at * SR))
    if i >= len(buf): return
    x = x[: len(buf) - i]
    buf[i:i + len(x)] += x * gain


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('story')
    ap.add_argument('--music', default='bouncy', help='bouncy | lofi | suspense | hype')
    ap.add_argument('--music-db', type=float, default=-7, help='music level (lower = quieter)')
    ap.add_argument('--no-sfx', action='store_true')
    a = ap.parse_args()

    out = ROOT / 'out'
    ev = json.loads((out / f'{a.story}.events.json').read_text())
    n = int(ev['duration'] * SR)
    music = np.zeros((n, 2), np.float32)
    sfx = np.zeros((n, 2), np.float32)
    S = {p.stem: load(p) for p in (HERE / 'sfx').glob('*.wav')}

    # music: a track plays from its switch point until the next switch
    segments, cur = [], (0.0, a.music)
    for s in ev['shots']:
        if s['music'] and s['music'] != cur[1]:
            segments.append((cur[0], s['start'], cur[1])); cur = (s['start'], s['music'])
    segments.append((cur[0], ev['duration'], cur[1]))
    for start, end, name in segments:
        track = load(HERE / 'music' / f'{name}.wav')
        seg = np.tile(track, (int(np.ceil((end - start) * SR / len(track))) + 1, 1))[: int((end - start) * SR)].copy()
        f = int(0.04 * SR); seg[:f] *= np.linspace(0, 1, f)[:, None]; seg[-f:] *= np.linspace(1, 0, f)[:, None]
        place(music, seg, start)
    music *= 10 ** (a.music_db / 20)
    tail = int(1.5 * SR); music[-tail:] *= np.linspace(1, 0, tail)[:, None]

    if not a.no_sfx:
        for k, s in enumerate(ev['shots']):
            t0 = s['start']
            if k: place(sfx, S['whoosh'], t0 - 0.15, 0.18)
            for p in s['popups']:
                at = t0 + p['at']
                if p.get('kind') == 'day':
                    place(sfx, S['pop'], at, 0.5); place(sfx, S['ding'], at + 0.03, 0.3)
                elif str(p['text']).startswith('+'):
                    place(sfx, S['cash'], at, 0.55)
                else:
                    place(sfx, S['womp'], at, 0.22)
            if s['rain']: place(sfx, S['coins'], t0 + (s['rain'].get('at') or 0), 0.35)
            if s['sportsCar']: place(sfx, S['vroom'], t0 + (s['sportsCar'].get('at') or 0), 0.28)
            for e in s['sfx']:
                place(sfx, S[e['name']], t0 + e['at'], 0.5 * e.get('gain', 1))

    mix = music + sfx
    peak = np.max(np.abs(mix))
    if peak > 0.95: mix *= 0.95 / peak
    wav = out / f'{a.story}.soundtrack.wav'
    wavfile.write(wav, SR, (mix * 32767).astype(np.int16))

    video = out / f'{a.story}.mp4'
    final = out / f'{a.story}.{a.music}.mp4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', str(video), '-i', str(wav), '-map', '0:v', '-map', '1:a',
                    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', str(final)], check=True)
    print('soundtrack', wav)
    print('video     ', final)


if __name__ == '__main__':
    main()
