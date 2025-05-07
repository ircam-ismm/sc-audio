import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import { ensureResumed } from './ensure-resumed.js';
import { VolumeNode } from '../../src/index.js';

let buffer, src, fader, audioContext;

export async function enter(context) {
  audioContext = context;

  fader = new VolumeNode(audioContext);
  fader.connect(audioContext.destination);
}

export async function loadAssets(loader) {
  buffer = await loader.load('./assets/drum-loop.wav');
}

export function exit() {
  if (src) {
    src.stop();
  }

  fader.disconnect();
}

export function template(example, api) {
  return html`
<h2>VolumeNode</h2>

<p>The VolumeNode interface represents a change in volume controlled in dB.</p>

<sc-code-example language="txt">
[input]
   │
   │ control volume in dB
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
          src.connect(fader);
          src.start();
        }
      }}
    ></sc-transport>
  </div>
  <div>
    <sc-text>.volume: AudioParam</sc-text>
    <sc-slider
      number-box
      min=${fader.min}
      max=${fader.max}
      value=${fader.volume.value}
      @input=${e => fader.volume.setTargetAtTime(e.detail.value, audioContext.currentTime, 0.01)}
    ></sc-slider>
  </div>
</div>

<h3>Example</h3>
<sc-code-example>${example}</sc-code-example>

${unsafeHTML(api)}
  `;
}
