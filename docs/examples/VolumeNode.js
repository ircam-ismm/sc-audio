import {
  AudioContext,
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import {
  AudioBufferLoader,
  VolumeNode,
} from '../../src/index.js';

// in browsers, you will need to resume on a user gesture
const audioContext = new AudioContext();
// load an audio buffer
const loader = new AudioBufferLoader(audioContext);
const buffer = await loader.load('../assets/drum-loop.wav');

// build graph and start source
const fader = new VolumeNode(audioContext);
const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
src.connect(fader).connect(audioContext.destination);

// start source and ramp from -60 to 0 dB
const now = audioContext.currentTime;
src.start(now);
fader.volume.setValueAtTime(-60, now);
fader.volume.linearRampToValueAtTime(0, now + buffer.duration);
