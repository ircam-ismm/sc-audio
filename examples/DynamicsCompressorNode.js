import {
  AudioContext,
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import {
  AudioBufferLoader,
  DynamicsCompressorNode,
} from '../../src/index.js';

// in browsers, you will need to resume on a user gesture
const audioContext = new AudioContext();

// hard limiter
const compressor = new DynamicsCompressorNode(audioContext, {
  attack: 10e-3,
  release: 250e-3,
  threshold: -6,
  knee: 12, // smooth transition
  ratio: 20, // hard limiter
  preGain: 6, // raise gain and compress a bit
});
compressor.connect(audioContext.destination);

// load an audio buffer
const loader = new AudioBufferLoader(audioContext);
const buffer = await loader.load('../assets/drum-loop.wav');

// pipe a source in the graph
const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
src.connect(compressor);
src.start();

