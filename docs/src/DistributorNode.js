import { html } from 'lit';
import { DistributorNode } from '../../src/index.js';
import {
  ConvolverNode,
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';

let buffer, src, dryWet, audioContext;

export async function enter(context, loader) {
  audioContext = context;
  const ir = await loader.load('./assets/parking-garage-response.wav');
  buffer = await loader.load('./assets/drum-loop.wav');

  const convolver = new ConvolverNode(audioContext, { buffer: ir });
  convolver.connect(audioContext.destination);

  dryWet = new DistributorNode(audioContext);
  dryWet.connect(audioContext.destination, 0);
  dryWet.connect(convolver, 1);
}

export function exit() {
  if (src) {
    src.stop();
  }
}

export function template(example) {
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
<div>
  <sc-transport
    .buttons=${['play', 'stop']}
    @change=${async e => {
      if (audioContext.state !== 'running') {
        await audioContext.resume();
      }

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
    value="0"
    number-box
    @input=${e => dryWet.ratio.setTargetAtTime(e.detail.value, audioContext.currentTime, 0.01)}
  ></sc-slider>
</div>

<h3>Example</h3>
<sc-code-example>${example}</sc-code-example>
  `;
}
