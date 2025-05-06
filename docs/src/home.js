import { html } from 'lit';

export const template = html`
<div id="homepage">
  <h1>@ircam/sc-audio</h1>

  <a href="https://badge.fury.io/js/@ircam%2Fsc-audio">
    <img alt="npm version" src="https://badge.fury.io/js/@ircam%2Fsc-audio.svg" />
  </a>

  <div style="margin-top: 20px">
    <img src="./assets/logo-200x200.png" alt="logo" />
  </div>

  <p>
    <i>sc-audio</i> is a <a href="https://webaudio.github.io/web-audio-api/" target="_blank">Web Audio</a> library for
    prototyping and creating interactive audio applications both in the browser and Node.js
    using <a href="isomorphic-web-audio-api">https://github.com/ircam-ismm/isomorphic-web-audio-api</a>].
  </p>

  <p>
    The main philosophy behind <i>sc-audio</i> is to provide audio nodes that behave similarly to native audio nodes,
    so that they can be inserted seamlessly into regular Web Audio graphs.
  </p>

  <h2 style="margin-top: 60px;">Install</h2>

  <sc-code-example>${`
npm install --save @ircam/sc-audio
  `}</sc-code-example>

  <h2 style="margin-top: 60px;">Example Use</h2>

  <sc-code-example>${`
import {
  AudioContext,
  AudioBufferSourceNode,
  ConvolverNode,
} from 'isomorphic-web-audio-api';
import {
  AudioBufferLoader,
  DistributorNode,
} from '@ircam/sc-audio';

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
  `}</sc-code-example>


  <h2 style="margin-top: 60px;">License</h2>
  <a target="_blank" href="https://github.com/ircam-ismm/sc-audio/blob/main/LICENSE">BSD-3-Clause</a>

  <div style="height: 120px;"></div>
`;
