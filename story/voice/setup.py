#!/usr/bin/env python3
"""Download the Kokoro-82M narrator model (Apache-2.0) and voices into voice/models,
and copy the voices where kokoro-js looks for them. Run once: python3 voice/setup.py"""
import os, shutil, urllib.request
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
repo = 'onnx-community/Kokoro-82M-v1.0-ONNX'
base = f'https://huggingface.co/{repo}/resolve/main/'
dst = ROOT / 'voice' / 'models' / repo
voices = ['am_michael', 'am_adam', 'am_puck', 'am_echo', 'am_fenrir', 'bm_george', 'af_heart', 'af_bella']
for f in ['config.json', 'tokenizer.json', 'tokenizer_config.json', 'onnx/model_quantized.onnx'] + [f'voices/{v}.bin' for v in voices]:
    p = dst / f; p.parent.mkdir(parents=True, exist_ok=True)
    if not p.exists() or p.stat().st_size == 0:
        urllib.request.urlretrieve(base + f, p); print('downloaded', f)
kv = ROOT / 'node_modules' / 'kokoro-js' / 'voices'; kv.mkdir(parents=True, exist_ok=True)
for v in voices: shutil.copy(dst / 'voices' / f'{v}.bin', kv)
print('ready')
