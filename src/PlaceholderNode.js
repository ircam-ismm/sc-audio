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
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {AudioNode} [options.node=null]
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
   * Wrapped AudioNode
   * @type {AudioNode}
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
   * Replace the wrapped AudioNode at given time.
   *
   * <i>Note that using this method in an wrong order according to the timeline will result in undefined behavior, e.g.:</i>
   * ```js
   * wrapper.setNodeAtTime(node1, audioContext.currentTime + 2);
   * wrapper.setNodeAtTime(node2, audioContext.currentTime + 1);
   * ```
   *
   * @param {AudioNode} node - AudioNode to be wrapped.
   * @param {number} when - Time at which the change should be applied. In audio
   *  context current time coordinates.
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
