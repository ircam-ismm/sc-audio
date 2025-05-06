import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import { ensureResumed } from './ensure-resumed.js';
import { MuteNode } from '../../src/index.js';

let buffer, src, mute, audioContext;

export async function enter(context, loader) {
  audioContext = context;
  buffer = await loader.load('./assets/drum-loop.wav');

  mute = new MuteNode(audioContext);
  mute.connect(audioContext.destination);
}

export function exit() {
  if (src) {
    src.stop();
  }

  mute.disconnect();
}

export function template(example, api) {
  return html`
<h2>MuteNode</h2>

<p>The MuteNode interface allows to mute a given input.</p>

<sc-code-example language="txt">
[input]
   │
   │ mute
   │
[output]
</sc-code-example>

<h3>Demo</h3>
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
        src.connect(mute);
        src.start();
      }
    }}
  ></sc-transport>
</div>
<div>
  <sc-text>.active: Boolean</sc-text>
  <sc-toggle
    ?active=${mute.active}
    @change=${e => mute.active = e.detail.value}
  ></sc-toggle>
</div>

<h3>Example</h3>
<sc-code-example>${example}</sc-code-example>

${unsafeHTML(api)}
  `;
}
