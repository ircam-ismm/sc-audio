import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import { ensureResumed } from './ensure-resumed.js';
import { CollectorNode } from '../../src/index.js';

let buffer0, buffer1, src0, src1, mixer, audioContext;

export async function enter(context) {
  audioContext = context;

  mixer = new CollectorNode(audioContext, { ratio: 0 });
  mixer.connect(audioContext.destination);
}

export async function loadAssets(loader) {
  buffer0 = await loader.load('./assets/drum-loop.wav');
  buffer1 = await loader.load('./assets/clar-bass-mono.wav');
}

export function exit() {
  if (src0 && src1) {
    src0.stop();
    src1.stop();
    src0 = null;
    src1 = null;
  }

  mixer.disconnect();
}

export function template(example, api) {
  return html`
<h2>CollectorNode</h2>

<p>The CollectorNode interface allows to collect two multichannel inputs and mix them in an input according to given ratio.</p>

<p><i>Note that connecting to this node differs from connecting to regular AudioNodes as the node expose an 'inputs' attribute.</i></p>

<sc-code-example language="txt">
inputs[0]   inputs[1]
     │         |
     └────┬────┘
   ratio  │
          │
       [output]
</sc-code-example>

<h3>Demo</h3>
<div class="demo">
  <div>
    <sc-transport
      .buttons=${['play', 'stop']}
      value="stop"
      @change=${async e => {
        await ensureResumed(audioContext);

        if (src0 && src1) {
          src0.stop();
          src1.stop();
          src0 = null;
          src1 = null;
        }

        if (e.detail.value === 'play') {
          // create two source to be connected to the collector inputs
          src0 =  new AudioBufferSourceNode(audioContext, { buffer: buffer0, loop: true });
          src0.connect(mixer.inputs[0]);
          src0.start();

          src1 =  new AudioBufferSourceNode(audioContext, { buffer: buffer1, loop: true });
          src1.connect(mixer.inputs[1]);
          src1.start();
        }
      }}
    ></sc-transport>
  </div>
  <div>
    <sc-text>.ratio: AudioParam</sc-text>
    <sc-slider
      value=${mixer.ratio.value}
      number-box
      @input=${e => mixer.ratio.setTargetAtTime(e.detail.value, audioContext.currentTime, 0.01)}
    ></sc-slider>
  </div>
</div>

<h3>Example</h3>
<sc-code-example>${example}</sc-code-example>

${unsafeHTML(api)}
  `;
}
