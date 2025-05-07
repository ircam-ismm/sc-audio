import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  ConvolverNode,
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import { ensureResumed } from './ensure-resumed.js';
import { PlaceholderNode } from '../../src/index.js';

let buffer, src, placeholder, convolver1, convolver2, audioContext;

export async function enter(context) {
  audioContext = context;

  convolver1 = new ConvolverNode(audioContext);
  convolver2 = new ConvolverNode(audioContext);

  placeholder = new PlaceholderNode(audioContext);
  placeholder.node = convolver1;
  placeholder.connect(audioContext.destination);
}

export async function loadAssets(loader) {
  buffer = await loader.load('./assets/drum-loop.wav');

  convolver1.buffer = await loader.load('./assets/plate-small.wav');
  convolver2.buffer = await loader.load('./assets/room-large.wav');
}

export function exit() {
  if (src) {
    src.stop();
  }

  placeholder.disconnect();
}

export function template(example, api) {
  return html`
<h2>PlaceholderNode</h2>

<p>The PlaceholderNode interface represents an audio node that wraps another node and can replace it seamlessly by cross-fading between the old and the new one.</p>

<p>In particular, it allows to wrap nodes which whose parameters can't be updated dynamically, e.g. WaveshaperNode, ConvolverNode, to update them without producing clicks and pops.</p>

<sc-code-example language="txt">
  [input]
     │
     │
[placeholder] replace wrapped node at runtime
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
          src.connect(placeholder);
          src.start();
        }
      }}
    ></sc-transport>
  </div>
  <div>
    <sc-text>.node: AudioNode</sc-text>
    <sc-tab
      @change=${e => placeholder.node = e.detail.value === 'convolver1' ? convolver1 : convolver2}
      value="convolver1"
      .options=${['convolver1', 'convolver2']}
    ></sc-tab>
  </div>
</div>

<h3>Example</h3>
<sc-code-example>${example}</sc-code-example>

${unsafeHTML(api)}
  `;
}
