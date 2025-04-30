import {
  AudioNode,
  BaseAudioContext,
  GainNode,
} from 'isomorphic-web-audio-api';
import {
  isPlainObject,
} from '@ircam/sc-utils';

import {
  SET_TARGET_DEFAULT_TIME_CONSTANT,
} from './utils.js';

/**
 * The PlaceholderNode interface represents an audio node that wraps another node and
 * can replace it by cross-fading between the old and the new one.
 *
 * In particular, it allows to wrap nodes which whose parameters can't be updated dynamically,
 * e.g. WaveshaperNode, ConvolverNode, to update them without producing clicks and
 * pops.
 *
 * ```
 *   [input]
 *      │
 *      │
 * [placeholder] can be replace with another node
 *      │
 *      │
 *  [output]
 * ```
 *
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {AudioNode} [options.node=null]
 *
 * @example
 * import {
 *   AudioContext,
 *   AudioBufferSourceNode,
 *   ConvolverNode,
 * } from 'isomorphic-web-audio-api';
 * import {
 *   AudioBufferLoader,
 *   PlaceholderNode,
 * } from '../../src/index.js';
 *
 * // in browsers, you will need to resume on a user gesture
 * const audioContext = new AudioContext();
 * const loader = new AudioBufferLoader(audioContext);
 * // load two IRs and an audio buffer
 * const ir1 = await loader.load('../assets/plate-small.wav');
 * const ir2 = await loader.load('../assets/room-large.wav');
 * const buffer = await loader.load('../assets/drum-loop.wav');
 * // create graph
 * const placeholder = new PlaceholderNode(audioContext);
 * const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
 * src.connect(placeholder).connect(audioContext.destination);
 * src.start();
 * // create two convolvers and switch them regularly in the placeholder
 * const convolver1 = new ConvolverNode(audioContext, { buffer: ir1 });
 * const convolver2 = new ConvolverNode(audioContext, { buffer: ir2 });
 * placeholder.node = convolver1;
 * // bypass the lowpass filter on each sample loop
 * setInterval(() => {
 *   const convolver = placeholder.node === convolver1 ? convolver2 : convolver1;
 *   placeholder.node = convolver;
 * }, buffer.duration * 1000 - 10);
 */
export class PlaceholderNode extends GainNode {
  #inner = null;
  #env = null;
  #output = null;

  constructor(context, {
    node = null,
  } = {}) {
    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError(`Failed to construct 'PlaceholderNode': Argument 1 is not an instance of BaseAudioContext`);
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError(`Failed to construct 'PlaceholderNode': Argument 2 is not an object`);
    }

    super(context, { gain: 1 });

    this.#output = new GainNode(context, { gain: 1 });

    if (node !== null) {
      this.node = node;
    }
  }

  /** @private */
  get gain() {
    return undefined;
  }

  /**
   * Instance of the wrapped AudioNode
   */
  get node() {
    return this.#inner;
  }

  set node(node) {
    if (!(node instanceof AudioNode)) {
      throw new TypeError(`Failed to set 'node' on 'PlaceholderNode': value is not an instance of AudioNode`);
    }

    this.setNodeAtTime(node, this.context.currentTime);
  }

  /**
   *
   * Note that using this method in an wrong order according to the timeline, e.g.:
   * ```
   * wrapper.setNodeAtTime(node1, 2);
   * wrapper.setNodeAtTime(node2, 1);
   * ```
   * will result in undefined behavior
   */
  setNodeAtTime(node, when) {
    if (!(node instanceof AudioNode)) {
      throw new TypeError(`Failed to execute 'setNodeAtTime' on 'PlaceholderNode': Argument 1 is not an instance of AudioNode`);
    }

    if (!Number.isFinite(when)) {
      throw new TypeError(`Failed to execute 'setNodeAtTime' on 'PlaceholderNode': Argument 2 is not finite number`);
    }
    // first pass, no cross fade
    if (this.#inner === null) {
      this.#env = new GainNode(this.context, { gain: 1 });
      this.#inner = node;
      super.connect(this.#inner).connect(this.#env).connect(this.#output);
    } else {
      const oldInner = this.#inner;
      const oldEnv = this.#env;

      this.#inner = node;
      this.#env = new GainNode(this.context, { gain: 0 });
      super.connect(this.#inner).connect(this.#env).connect(this.#output);
      // schedule cross-fade
      oldEnv.gain.setTargetAtTime(0.0001, when, SET_TARGET_DEFAULT_TIME_CONSTANT);
      this.#env.gain.setTargetAtTime(1, when, SET_TARGET_DEFAULT_TIME_CONSTANT);
      // schedule old nodes disconnection
      const dt = Math.max(0, when - this.context.currentTime);
      const lookahead = SET_TARGET_DEFAULT_TIME_CONSTANT * 10;
      const disconnectDelay = Math.ceil((dt + lookahead) * 1e3);

      setTimeout(() => {
        oldInner.disconnect();
        oldEnv.disconnect();
      }, disconnectDelay);
    }
  }

  /** @ignore */
  connect(...args) {
    return this.#output.connect(...args);
  }

  /** @ignore */
  disconnect(...args) {
    return this.#output.disconnect(...args);
  }
}
