import { AudioContext } from 'isomorphic-web-audio-api';
import { RtlSdrSourceNode, createRtlSdrStream } from '../../src/index.js';

// in browsers, you will need to resume on a user gesture
const audioContext = new AudioContext();

const rtlSdrStream = new createRtlSdrStream({
context: audioContext
});
await rtlSdrStream.ready();

setInterval(() => {
  const src = new RtlSdrSourceNode(audioContext, {
    stream: rtlSdrStream
  });

  // connect bypass to destination
  src.connect(audioContext.destination);
  src.start(audioContext.currentTime);
  src.stop(audioContext.currentTime + 0.2);
}, 100);

// const radio = new RtlSdrSourceNode(audioContext, {

// });
// radio.connect(something);
// await radio.ready();
// radio.start(audioContext.currentTime);
// radio.stop(audioContext.currentTime + 1);