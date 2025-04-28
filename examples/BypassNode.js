import {
  AudioContext,
  AudioBufferSourceNode,
  BiquadFilterNode,
} from 'isomorphic-web-audio-api';
import {
  AudioBufferLoader,
  BypassNode,
} from '../../src/index.js';

// in browsers, you will need to resume on a user gesture
const audioContext = new AudioContext();
// load an audio buffer
const loader = new AudioBufferLoader(audioContext);
const buffer = await loader.load('../assets/drum-loop.wav');

const lowpass = new BiquadFilterNode(audioContext, { frequency: 400 });
const bypass = new BypassNode(audioContext);
// connect bypass to destination
bypass.connect(audioContext.destination);
// connect lowpass filter into subgraph
bypass.subGraphInput
  .connect(lowpass)
  .connect(bypass.subGraphOutput);

// pipe a source in the graph
const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
src.connect(bypass);
src.start();

// bypass the lowpass filter on each sample loop
setInterval(() => bypass.active = !bypass.active, buffer.duration * 1000);
