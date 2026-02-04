import {
  AudioContext,
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import {
  AudioBufferLoader,
  PhaserNode,
  DistributorNode,
} from '../../src/index.js';

// in browsers, you will need to resume on a user gesture
const audioContext = new AudioContext();
// load an audio buffer
const loader = new AudioBufferLoader(audioContext);
const buffer = await loader.load('../assets/human-voice.wav');

// build graph and start source
const phaser = new PhaserNode(audioContext, {
  ratio: 0.5,
  stages: 8,
  rate: 10,
  frequency: 1000,
  depth: 50,
});
phaser.connect(audioContext.destination);

const dryWet = new DistributorNode(audioContext);
dryWet.ratio.value = 0.3;
dryWet.connect(audioContext.destination, 0);
dryWet.connect(phaser, 1);

const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
src.connect(dryWet);

// src.connect(audioContext.destination);

src.start();
