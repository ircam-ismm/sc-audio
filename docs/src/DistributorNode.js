import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  ConvolverNode,
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import { ensureResumed } from './ensure-resumed.js';
import { DistributorNode } from '../../src/index.js';

let buffer, src, dryWet, convolver, audioContext;

export async function enter(context) {
  audioContext = context;

  convolver = new ConvolverNode(audioContext, { buffer });
  convolver.connect(audioContext.destination);

  dryWet = new DistributorNode(audioContext);
  dryWet.connect(audioContext.destination, 0);
  dryWet.connect(convolver, 1);
}

export async function loadAssets(loader) {
  convolver.buffer = await loader.load('./assets/room-large.wav');
  buffer = await loader.load('./assets/drum-loop.wav');
}

export function exit() {
  if (src) {
    src.stop();
  }

  convolver.disconnect();
  dryWet.disconnect();
}

export function template(example, api) {
  return html`
<h2>DistributorNode</h2>

<p>The DistributorNode interface allows to distribute an input between two output.</p>
<p>It can be used for example to create dry / wet controls.</p>

<sc-code-example language="txt">
        [input]
           │
           │ ratio
    ┌──────┴─────┐
    │            │
[output 0]   [output 1]
</sc-code-example>

<h3>Demo</h3>
<div class="demo">
  <div>
    <sc-transport
      .buttons=${['play', 'stop']}
      value="stop"
      @change=${async e => {
        await ensureResumed(audioContext);

        if (src) {
          src.stop();
          src = null;
        }

        if (e.detail.value === 'play') {
          src = new AudioBufferSourceNode(audioContext, { buffer });
          src.connect(dryWet);
          src.loop = true;
          src.start();
        }
      }}
    ></sc-transport>
  </div>
  <div>
    <sc-text>.ratio: AudioParam</sc-text>
    <sc-slider
      value=${dryWet.ratio.value}
      number-box
      @input=${e => dryWet.ratio.setTargetAtTime(e.detail.value, audioContext.currentTime, 0.01)}
    ></sc-slider>
  </div>
</div>

<h3>Example</h3>
<sc-code-example>${example}</sc-code-example>

${unsafeHTML(api)}
  `;
}
