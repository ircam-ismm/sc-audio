import { AudioContext } from 'isomorphic-web-audio-api';
import {
  RtlSdrStream,
  RtlSdrSourceNode,
} from '../../src/index.js';

// in browsers, you will need to resume on a user gesture
const context = new AudioContext();

const stream = new RtlSdrStream(context, { bufferingDuration: 0.05 });
await stream.start();

// kind of granular radio :)
setInterval(() => {
  const now = context.currentTime;
  const src = new RtlSdrSourceNode(context, { stream });
  src.connect(context.destination);
  src.start(now);
  src.stop(now + 0.2);
}, 100);
