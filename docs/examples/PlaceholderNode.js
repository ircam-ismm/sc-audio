import {
  AudioContext,
  AudioBufferSourceNode,
  ConvolverNode,
} from 'isomorphic-web-audio-api';
import {
  AudioBufferLoader,
  PlaceholderNode,
} from '../../src/index.js';

// in browsers, you will need to resume on a user gesture
const audioContext = new AudioContext();
const loader = new AudioBufferLoader(audioContext);
// load two IRs and an audio buffer
const ir1 = await loader.load('../assets/plate-small.wav');
const ir2 = await loader.load('../assets/room-large.wav');
const buffer = await loader.load('../assets/drum-loop.wav');
// create graph
const placeholder = new PlaceholderNode(audioContext);
const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
src.connect(placeholder).connect(audioContext.destination);
src.start();
// create two convolvers and switch them regularly in the placeholder
const convolver1 = new ConvolverNode(audioContext, { buffer: ir1 });
const convolver2 = new ConvolverNode(audioContext, { buffer: ir2 });
placeholder.node = convolver1;
// bypass the lowpass filter on each sample loop
setInterval(() => {
  const convolver = placeholder.node === convolver1 ? convolver2 : convolver1;
  placeholder.node = convolver;
}, buffer.duration * 1000 - 10);
