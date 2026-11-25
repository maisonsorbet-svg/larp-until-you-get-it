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
