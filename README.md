# sc-audio

_sc-audio_ is a [Web Audio](https://webaudio.github.io/web-audio-api/) library for prototyping and creating interactive audio applications both in the browser and Node.js (see [isomorphic-web-audio-api](https://github.com/ircam-ismm/isomorphic-web-audio-api)).

The main philosophy behind _sc-audio_ is to provide audio nodes that behave, as much as, possible, similarly to native audio nodes, so that they can be inserted seamlessly into regular Web Audio graphs.

<!-- While we don't refuse per se to use AudioWorklet, we try to rely other native nodes wherever possible so that applications running on non-secure `http` protocol can still use most parts of the library. -->

> _Work in progress_

## Documentation

[http://ircam-ismm.github.io/sc-audio](http://ircam-ismm.github.io/sc-audio)

You can also run the examples in `docs/examples` using Node.js, by simply cloning the repository and run:

```sh
npm install
node docs/examples/BypassNode.js
```

## Install

```sh
npm install --save @ircam/sc-audio
```

## Example Use

```js
import {
  AudioContext,
  AudioBufferSourceNode,
  ConvolverNode,
} from 'isomorphic-web-audio-api';
import {
  AudioBufferLoader,
  DistributorNode,
} from '@ircam/sc-audio';

// in browsers, you will need to resume on a user gesture
const audioContext = new AudioContext();
// load an audio buffer
const loader = new AudioBufferLoader(audioContext);
const ir = await loader.load('../assets/room-large.wav');
const buffer = await loader.load('../assets/drum-loop.wav');

// create the graph
const convolver = new ConvolverNode(audioContext, { buffer: ir });
convolver.connect(audioContext.destination);

const dryWet = new DistributorNode(audioContext);
// connect dry output (0) to destination
dryWet.connect(audioContext.destination, 0);
// connect wet output (1) to convolver
dryWet.connect(convolver, 1);

// pipe a source in the graph
const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
src.connect(dryWet);
src.start();

// ramp from dry to wet in 4 seconds, then back to dry
dryWet.ratio.setValueAtTime(0, audioContext.currentTime);
dryWet.ratio.linearRampToValueAtTime(1, audioContext.currentTime + buffer.duration);
dryWet.ratio.exponentialRampToValueAtTime(0.001, audioContext.currentTime + buffer.duration * 2);
```

## License

[BSD-3-Clause](./LICENSE)

