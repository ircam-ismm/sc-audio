import { html } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  RtlSdrStream,
  RtlSdrSourceNode
} from '../../src/index.js';
import { ensureResumed } from './ensure-resumed.js';

let audioContext, stream, src;
let freq = 91.7e6;

export async function enter(context) {
  audioContext = context;
  stream = new RtlSdrStream(audioContext, { hardwareFrequency: freq });
  await stream.start();
}

export function exit() {
  if (src) {
    src.stop();
  }

  if (stream) {
    stream.stop();
  }
}

export function template(example, api) {
  return html`
<h2>RtlSdrSourceNode</h2>

<p>The RtlSdrSourceNode interface allows to retrieve data from RTLSDR stick and stream it as a webadio node.</p>

<sc-code-example language="txt">
  [RTLSDR]
     │
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
          src.stop(audioContext.currentTime);
          src = null;
        }

        if (e.detail.value === 'play') {
          src = new RtlSdrSourceNode(audioContext, { stream });
          src.connect(audioContext.destination);
          src.start();
        }
      }}
    ></sc-transport>
    <sc-number
      value="91.7"
      @change=${e => stream.hardwareFrequency = e.detail.value * 1e6}
    ></sc-number>
  </div>
  <div>
  </div>
</div>

<h3>Example</h3>
<sc-code-example>${example}</sc-code-example>

${unsafeHTML(api)}
  `;
}
