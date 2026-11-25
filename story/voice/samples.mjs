import { env } from '@huggingface/transformers';
import { KokoroTTS } from 'kokoro-js';
import path from 'path';
env.localModelPath = path.resolve('voice/models') + '/';
env.allowRemoteModels = false;
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
const line = 'In this town, whatever you pretend to be for 30 days... becomes real. Leo was broke. Like... really broke.';
for (const v of ['am_michael', 'am_adam', 'am_puck', 'am_echo', 'am_fenrir', 'bm_george', 'af_heart', 'af_bella']) {
  const a = await tts.generate(line, { voice: v, speed: 1.1 });
  await a.save(`out/samples/voice-${v}.wav`);
  console.log(v, (a.audio.length / a.sampling_rate).toFixed(1) + 's');
}
