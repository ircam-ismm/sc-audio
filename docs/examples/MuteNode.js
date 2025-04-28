import {
  AudioContext,
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import {
  AudioBufferLoader,
  MuteNode,
} from '../../src/index.js';

// in browsers, you will need to resume on a user gesture
const audioContext = new AudioContext();
// load an audio buffer
const loader = new AudioBufferLoader(audioContext);
const buffer = await loader.load('../assets/drum-loop.wav');

// build graph and start source
const mute = new MuteNode(audioContext, { active: false });
const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
src.connect(mute).connect(audioContext.destination);
src.start();

// mute / unmute every seconds
setInterval(() => mute.active = !mute.active, 1000);
