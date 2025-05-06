import {
  AudioContext,
  AudioBufferSourceNode,
  ConvolverNode,
} from 'isomorphic-web-audio-api';
import {
  AudioBufferLoader,
  DistributorNode,
} from '../../src/index.js';

// in browsers, you will need to resume on a user gesture
const audioContext = new AudioContext();
// load an audio buffer
const loader = new AudioBufferLoader(audioContext);
const ir = await loader.load('../assets/room-large.wav');
const buffer = await loader.load('../assets/drum-loop.wav');

// create the graph
const convolver = new ConvolverNode(audioContext, { buffer: ir });
convolver.connect(audioContext.destination);

const dryWet = new DistributorNode(audioContext);
// connect dry output (0) to destination
dryWet.connect(audioContext.destination, 0);
// connect wet output (1) to convolver
dryWet.connect(convolver, 1);

// pipe a source in the graph
const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
src.connect(dryWet);
src.start();

// ramp from dry to wet in 4 seconds, then back to dry
dryWet.ratio.setValueAtTime(0, audioContext.currentTime);
dryWet.ratio.linearRampToValueAtTime(1, audioContext.currentTime + buffer.duration);
dryWet.ratio.exponentialRampToValueAtTime(0.001, audioContext.currentTime + buffer.duration * 2);
