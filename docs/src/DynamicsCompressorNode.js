import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import { ensureResumed } from './ensure-resumed.js';
import { DynamicsCompressorNode } from '../../src/index.js';

let buffer, src, compressor, audioContext;

export async function enter(context) {
  audioContext = context;

  compressor = new DynamicsCompressorNode(audioContext);
  compressor.connect(audioContext.destination);
}

export async function loadAssets(loader) {
  buffer = await loader.load('./assets/drum-loop.wav');
}

export function exit() {
  if (src) {
    src.stop();
  }

  compressor.disconnect();
}

function reductionUpdate() {
  const $reduction = document.querySelector('#reduction');
  if ($reduction) {
    $reduction.value = compressor ? compressor.reduction : 0;
  }
  requestAnimationFrame(reductionUpdate);
}
requestAnimationFrame(reductionUpdate);

export function template(example, api) {


  return html`
<h2>DynamicsCompressorNode</h2>

<p>The DynamicsCompressorNode interface allows to have a knee around the threshold, (while the Web Audio APIDynamicsCompressorNode adds it).</p>

<sc-code-example language="txt">
  [input]
     │
     │
[dynamicsCompressor]
     │
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

        if (src) {
          src.stop();
          src = null;
        }

        if (e.detail.value === 'play') {
          src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
          src.connect(compressor);
          src.start();
        }
      }}
    ></sc-transport>
  </div>

  <div>
    <sc-text>.reduction: float (read-only)</sc-text>
    <sc-slider id="reduction"
      disabled=true
      value=0
      min=-100
      max=0
      number-box
    ></sc-slider>
  </div>

  <div>
    <sc-text>.threshold: float</sc-text>
    <sc-slider
      value=${compressor.threshold}
      min=-100
      max=0
      number-box
      @input=${e => compressor.threshold = e.detail.value}
    ></sc-slider>
  </div>

  <div>
    <sc-text>.ratio: float</sc-text>
    <sc-slider
      value=${compressor.ratio}
      min=1
      max=20
      number-box
      @input=${e => compressor.ratio = e.detail.value}
    ></sc-slider>
  </div>

  <div>
    <sc-text>.knee: float</sc-text>
    <sc-slider
      value=${compressor.knee}
      min=0
      max=40
      number-box
      @input=${e => compressor.knee = e.detail.value}
    ></sc-slider>
  </div>

  <div>
    <sc-text>.attack: float</sc-text>
    <sc-slider
      value=${compressor.attack}
      min=0
      max=1
      number-box
      @input=${e => compressor.attack = e.detail.value}
    ></sc-slider>
  </div>

  <div>
    <sc-text>.release: float</sc-text>
    <sc-slider
      value=${compressor.release}
      min=0
      max=1
      number-box
      @input=${e => compressor.release = e.detail.value}
    ></sc-slider>
  </div>

  <div>
    <sc-text>.preGain: float</sc-text>
    <sc-slider
      value=${compressor.preGain}
      min=-60
      max=60
      number-box
      @input=${e => compressor.preGain = e.detail.value}
    ></sc-slider>
  </div>

  <div>
    <sc-text>.postGain: float</sc-text>
    <sc-slider
      value=${compressor.postGain}
      min=-60
      max=60
      number-box
      @input=${e => compressor.postGain = e.detail.value}
    ></sc-slider>
  </div>

</div>

<h3>Example</h3>
<sc-code-example>${example}</sc-code-example>

${unsafeHTML(api)}
  `;
}
