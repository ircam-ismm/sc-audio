import {
  AudioContext,
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import {
  AudioBufferLoader,
  CollectorNode,
} from '../../src/index.js';

// in browsers, you will need to resume on a user gesture
const audioContext = new AudioContext();
// load an audio buffer
const loader = new AudioBufferLoader(audioContext);
const buffer0 = await loader.load('../assets/drum-loop.wav');
const buffer1 = await loader.load('../assets/clar-bass-mono.wav');

// create the graph
const mixer = new CollectorNode(audioContext, { ratio: 0 });
mixer.connect(audioContext.destination);
// create two source to be connected to the collector inputs
const src0 =  new AudioBufferSourceNode(audioContext, { buffer: buffer0, loop: true });
// note how the connect call differ from regular AudioNode
src0.connect(mixer.inputs[0]);
src0.start();

const src1 =  new AudioBufferSourceNode(audioContext, { buffer: buffer1, loop: true });
src1.connect(mixer.inputs[1]);
src1.start();

// go from src0 to src1 in 4 seconds, then back to src0
mixer.ratio.setValueAtTime(0, audioContext.currentTime);
mixer.ratio.linearRampToValueAtTime(1, audioContext.currentTime + 4);
mixer.ratio.linearRampToValueAtTime(0, audioContext.currentTime + 8);
