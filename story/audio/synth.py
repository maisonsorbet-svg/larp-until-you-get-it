#!/usr/bin/env python3
"""
Original, royalty-free music beds and sound effects, synthesized from scratch
(no samples, no downloads), so they're safe to use on TikTok.

    python3 audio/synth.py            # writes audio/music/*.wav and audio/sfx/*.wav
"""
import numpy as np
from pathlib import Path
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
rng = np.random.default_rng(7)
HERE = Path(__file__).parent


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def lp(x, hz, order=2):
    return sosfilt(butter(order, hz, 'low', fs=SR, output='sos'), x)


def hp(x, hz, order=2):
    return sosfilt(butter(order, hz, 'high', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)


def adsr(n, a=0.005, d=0.1, s=0.0, r=0.05):
    a, d, r = int(a * SR), int(d * SR), int(r * SR)
    e = np.full(n, s, dtype=float)
    a = min(a, n); e[:a] = np.linspace(0, 1, a)
    dd = min(d, n - a)
    if dd > 0: e[a:a + dd] = np.linspace(1, s, dd)
    if r and n > r: e[-r:] *= np.linspace(1, 0, r)
    return e


def put(buf, x, at):
    i = int(at * SR)
    if i >= len(buf): return
    x = x[: len(buf) - i]
    buf[i:i + len(x)] += x


# ---------------------------------------------------------------- instruments
def marimba(f, dur=0.35):
    t = t_(dur)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 40)
    return x * np.exp(-t * 9)


def pluck(f, dur=0.3, bright=3000):
    t = t_(dur)
    x = sum(np.sin(2 * np.pi * f * k * t) / k for k in range(1, 7))
    return lp(x * np.exp(-t * 10), bright)


def bass(f, dur=0.4):
    t = t_(dur)
    x = np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t)
    return x * adsr(len(t), 0.004, dur * 0.6, 0.5, 0.04)


def rhodes(f, dur=1.5):
    t = t_(dur)
    x = np.sin(2 * np.pi * f * t + 0.6 * np.sin(2 * np.pi * f * t) * np.exp(-t * 3))
    x += 0.3 * np.sin(2 * np.pi * f * 2.003 * t) * np.exp(-t * 4)
    return x * adsr(len(t), 0.01, 0.6, 0.45, 0.3) * (1 + 0.12 * np.sin(2 * np.pi * 4.5 * t))


def bell(f, dur=0.8):
    t = t_(dur)
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 6) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 12)
    return x * np.exp(-t * 4)


def b808(f, dur=0.9, glide_from=None):
    t = t_(dur)
    fr = np.full(len(t), f) if glide_from is None else f + (glide_from - f) * np.exp(-t * 18)
    ph = 2 * np.pi * np.cumsum(fr) / SR
    return np.tanh(1.6 * np.sin(ph)) * adsr(len(t), 0.003, dur, 0.0, 0.05) ** 0.6


def kick(dur=0.35):
    t = t_(dur)
    f = 45 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)


def snare(dur=0.2):
    t = t_(dur)
    n = bp(rng.standard_normal(len(t)), 1200, 7000) * np.exp(-t * 22)
    return 0.8 * n + 0.4 * np.sin(2 * np.pi * 185 * t) * np.exp(-t * 30)


def clap(dur=0.2):
    t = t_(dur)
    n = bp(rng.standard_normal(len(t)), 900, 5000)
    e = sum(np.exp(-np.clip(t - d, 0, None) * 60) * (t >= d) for d in (0, 0.01, 0.022)) + 0.6 * np.exp(-t * 15)
    return n * e * 0.6


def hat(dur=0.05, open_=False):
    t = t_(0.25 if open_ else dur)
    return hp(rng.standard_normal(len(t)), 7000) * np.exp(-t * (12 if open_ else 70)) * 0.5


def tick(hi=True):
    t = t_(0.04)
    return np.sin(2 * np.pi * (2600 if hi else 1900) * t) * np.exp(-t * 160)


# ---------------------------------------------------------------- music beds
def master(x, gain_db=-1.0):
    x = x - np.mean(x)
    x = np.tanh(x / (np.max(np.abs(x)) + 1e-9) * 1.4)        # gentle saturation / glue
    x = x / np.max(np.abs(x)) * 10 ** (gain_db / 20)
    fade = int(0.02 * SR); x[:fade] *= np.linspace(0, 1, fade)
    return x


def song(bpm, bars, fill):
    beat = 60 / bpm
    buf = np.zeros(int(bars * 4 * beat * SR) + SR)
    fill(buf, beat)
    return master(buf)


def bouncy():
    """Upbeat, cartoony, major key: marimba + plucky chords + bouncy drums (120 BPM)."""
    prog = [(60, [0, 4, 7]), (55, [0, 4, 7]), (57, [0, 3, 7]), (53, [0, 4, 7])]   # C G Am F
    motif = [0, 2, 4, 2, 7, 4, 2, 4]
    scale = [0, 2, 4, 5, 7, 9, 11]

    def fill(buf, b):
        for bar in range(24):
            root, tri = prog[bar % 4]
            t0 = bar * 4 * b
            for i in range(4):
                put(buf, 0.9 * kick(), t0 + i * b) if i % 2 == 0 else put(buf, 0.55 * clap(), t0 + i * b)
                put(buf, 0.5 * bass(midi(root - 24), b * 0.9), t0 + i * b)
                put(buf, 0.35 * bass(midi(root - 12), b * 0.4), t0 + i * b + b / 2) if i % 2 else None
            for i in range(8):
                put(buf, hat(), t0 + i * b / 2)
                if i % 2: [put(buf, 0.12 * pluck(midi(root + n), 0.25), t0 + i * b / 2) for n in tri]
                if bar >= 2:
                    deg = motif[(i + bar) % 8]
                    note = 72 + scale[deg % 7] + (12 if deg >= 7 else 0) + (root - 60) * 0 + {60: 0, 55: -1, 57: 0, 53: 0}[root]
                    put(buf, 0.33 * marimba(midi(note)), t0 + i * b / 2)
    return song(120, 24, fill)


def lofi():
    """Chill lo-fi: warm electric piano chords, lazy swung drums, vinyl crackle (84 BPM)."""
    chords = [[62, 65, 69, 72, 76], [55, 59, 65, 69, 76], [60, 64, 67, 71, 74], [57, 60, 64, 67, 71]]  # Dm9 G13 Cmaj9 Am9

    def fill(buf, b):
        for bar in range(16):
            t0 = bar * 4 * b
            for n in chords[bar % 4]:
                put(buf, 0.13 * rhodes(midi(n), 4 * b), t0 + 0.01 * (n % 5))
            put(buf, 0.5 * bass(midi(chords[bar % 4][0] - 24), 2 * b), t0)
            put(buf, 0.4 * bass(midi(chords[bar % 4][0] - 24), b), t0 + 2.5 * b)
            for i, (d, k) in enumerate([(0, 'k'), (1, 's'), (2.5, 'k'), (3, 's')]):
                put(buf, 0.8 * kick() if k == 'k' else 0.5 * snare(), t0 + d * b)
            for i in range(8):
                put(buf, 0.6 * hat(), t0 + i * b / 2 + (0.06 if i % 2 else 0))
        n = len(buf)
        crackle = (rng.random(n) > 0.9995) * rng.standard_normal(n) * 0.5 + rng.standard_normal(n) * 0.0015
        buf[:] = lp(buf, 5500) + hp(crackle, 1500)
    return song(84, 16, fill)


def suspense():
    """Tension: ticking clock, low drone, plucked minor arpeggio, rising pulse (100 BPM)."""
    arp = [57, 60, 64, 60, 57, 60, 65, 60]   # A minor -> F colour

    def fill(buf, b):
        bars = 20
        tt = np.arange(len(buf)) / SR
        drone = np.sin(2 * np.pi * midi(33) * tt) + 0.5 * np.sin(2 * np.pi * midi(40) * tt) + 0.25 * np.sin(2 * np.pi * midi(45) * tt * 1.002)
        buf += 0.35 * lp(drone, 400) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.25 * tt))
        for bar in range(bars):
            t0 = bar * 4 * b
            for i in range(8):
                put(buf, 0.35 * tick(i % 2 == 0), t0 + i * b / 2)
                put(buf, 0.22 * pluck(midi(arp[i] + (12 if bar % 4 == 3 else 0)), 0.18, 2200), t0 + i * b / 2)
            if bar >= 4:
                for i in range(4): put(buf, 0.7 * kick(0.25), t0 + i * b)
            if bar >= 8 and bar % 2: put(buf, 0.4 * b808(midi(33), 2 * b), t0)
    return song(100, 20, fill)


def hype():
    """Hard trap: 808 slides, rolling hi-hats, dark bell melody (140 BPM, half-time)."""
    mel = [69, None, 72, None, 76, 74, 72, None, 69, None, 67, None, 69, None, None, None]

    def fill(buf, b):
        for bar in range(26):
            t0 = bar * 4 * b
            roots = [33, 33, 29, 31]
            put(buf, 0.9 * b808(midi(roots[bar % 4]), 1.6 * b, glide_from=midi(roots[(bar - 1) % 4]) if bar % 2 else None), t0)
            put(buf, 0.7 * b808(midi(roots[bar % 4]), 0.8 * b), t0 + 2.5 * b)
            put(buf, 1.0 * kick(), t0); put(buf, 0.8 * kick(), t0 + 2.5 * b)
            put(buf, 0.7 * clap(), t0 + 2 * b); put(buf, 0.5 * snare(), t0 + 2 * b)
            for i in range(16):
                put(buf, 0.45 * hat(), t0 + i * b / 4)
                if bar % 2 and i >= 12:                                           # hi-hat roll
                    put(buf, 0.3 * hat(0.03), t0 + i * b / 4 + b / 8)
                if bar >= 2 and mel[i] is not None:
                    put(buf, 0.18 * bell(midi(mel[i])), t0 + i * b / 4)
    return song(140, 26, fill)


# ---------------------------------------------------------------- sound effects
def fx_pop():
    t = t_(0.15); f = 400 + 900 * (1 - np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30)


def fx_ding():
    return 0.7 * bell(midi(88), 1.0) + 0.4 * bell(midi(95), 1.0)


def fx_cash():                                  # "ka-ching": drawer clunk + two bells
    out = np.zeros(int(1.2 * SR))
    put(out, 0.6 * lp(rng.standard_normal(int(0.08 * SR)) * np.exp(-t_(0.08) * 50), 1500), 0)
    put(out, 0.8 * bell(midi(91), 1.0), 0.09); put(out, 0.8 * bell(midi(96), 1.0), 0.16)
    return out


def fx_coins():                                 # shower of small coins
    out = np.zeros(int(2.0 * SR))
    for i in range(38):
        put(out, 0.25 * bell(midi(rng.integers(90, 104)), 0.25), rng.random() * 1.6)
    return out


def fx_whoosh():
    t = t_(0.45); n = rng.standard_normal(len(t))
    env = np.sin(np.pi * t / t[-1]) ** 2
    lo = bp(n, 300, 1500) * (1 - t / t[-1]); hi = bp(n, 1500, 6000) * (t / t[-1])
    return (lo + hi) * env


def fx_womp():                                  # sad descending trombone-ish
    out = np.zeros(int(1.8 * SR))
    for k, (m, d) in enumerate([(58, 0.32), (57, 0.32), (56, 0.32), (55, 0.8)]):
        t = t_(d); f = midi(m) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t) * (k == 3))
        x = sum(np.sin(2 * np.pi * np.cumsum(f * h) / SR) / h for h in range(1, 6))
        put(out, 0.5 * lp(x, 1800) * adsr(len(t), 0.03, d, 0.8, 0.08), k * 0.34)
    return out


def fx_scratch():                               # record scratch
    t = t_(0.5); speed = np.sin(2 * np.pi * 3.2 * t) * 0.8
    n = bp(rng.standard_normal(len(t)), 400, 3500) * (np.abs(speed) + 0.1)
    tone = np.sin(2 * np.pi * np.cumsum(300 + 500 * speed) / SR) * 0.3
    return (n + tone) * adsr(len(t), 0.005, 0.5, 0.0, 0.05)


def fx_vroom():                                 # car zooms in and stops
    t = t_(1.5)
    f = 55 + 140 * np.sin(np.pi * np.clip(t / 1.2, 0, 1)) ** 0.7
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.tanh(2 * (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)))
    x = lp(x + 0.3 * rng.standard_normal(len(t)), 2500)
    return x * np.clip(np.sin(np.pi * t / 1.5), 0, 1) ** 0.5


def fx_boing():
    t = t_(0.6); f = 180 + 200 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 5)


def fx_laugh():                                 # cartoon crowd "ha-ha-ha" texture
    out = np.zeros(int(1.6 * SR))
    for v in range(4):
        base = 220 + v * 70
        for i in range(6):
            t = t_(0.11); f = base * (1 + 0.15 * np.exp(-t * 30))
            x = sum(np.sin(2 * np.pi * f * h * t) * (1 / h) for h in range(1, 8))
            put(out, 0.15 * bp(x, 400, 3000) * np.sin(np.pi * t / t[-1]), 0.05 * v + i * 0.2 + rng.random() * 0.03)
    return out


def fx_drumroll():
    out = np.zeros(int(1.8 * SR))
    for i in range(int(1.5 / 0.035)):
        put(out, (0.25 + 0.5 * i / 43) * snare(0.08), i * 0.035)
    put(out, 0.9 * snare(0.4) + 0.5 * np.pad(fx_ding()[: int(0.4 * SR)], (0, 0)), 1.5)
    return out


MUSIC = {'bouncy': bouncy, 'lofi': lofi, 'suspense': suspense, 'hype': hype}
SFX = {'pop': fx_pop, 'ding': fx_ding, 'cash': fx_cash, 'coins': fx_coins, 'whoosh': fx_whoosh, 'womp': fx_womp,
       'scratch': fx_scratch, 'vroom': fx_vroom, 'boing': fx_boing, 'laugh': fx_laugh, 'drumroll': fx_drumroll}


def write(path, x):
    path.parent.mkdir(parents=True, exist_ok=True)
    x = x / (np.max(np.abs(x)) + 1e-9) * 0.89
    wavfile.write(path, SR, (np.column_stack([x, x]) * 32767).astype(np.int16))


if __name__ == '__main__':
    for name, fn in MUSIC.items():
        write(HERE / 'music' / f'{name}.wav', fn()); print('music', name)
    for name, fn in SFX.items():
        write(HERE / 'sfx' / f'{name}.wav', fn()); print('sfx', name)
