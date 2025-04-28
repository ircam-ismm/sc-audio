import { html } from 'lit';
import {
  BiquadFilterNode,
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import { ensureResumed } from './ensure-resumed.js';
import { BypassNode } from '../../src/index.js';

let buffer, src, bypass,lowpass,  audioContext;

export async function enter(context, loader) {
  audioContext = context;
  buffer = await loader.load('./assets/drum-loop.wav');

  lowpass = new BiquadFilterNode(audioContext, { frequency: 400 });

  bypass = new BypassNode(audioContext);
  bypass.connect(audioContext.destination);
  // connect lowpass filter into subgraph
  bypass.subGraphInput
    .connect(lowpass)
    .connect(bypass.subGraphOutput);
}

export function exit() {
  if (src) {
    src.stop();
  }

  lowpass.disconnect();
  bypass.disconnect();
}

export function template(example) {
  return html`
<h2>BypassNode</h2>

<p>The BypassNode interface allows to wrap and bypass an audio sub graph.</p>
<p>When the bypass is "active", the signal does not flow into the subgraph.</p>

<sc-code-example language="txt">
  [input]
     │     bypass
     ├───────┐
     │       │
[subGraph]   │
     │       │
     ├───────┘
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
        src.connect(bypass);
        src.start();
      }
    }}
  ></sc-transport>
</div>
<div>
  <sc-text>.active: boolean</sc-text>
  <sc-toggle
    @change=${e => bypass.active = e.detail.value}
  ></sc-toggle>
</div>

<h3>Example</h3>
<sc-code-example>${example}</sc-code-example>
  `;
}
