import {
  isPlainObject,
} from '@ircam/sc-utils';
import {
  BaseAudioContext,
  GainNode,
} from 'isomorphic-web-audio-api';

import {
  SET_TARGET_DEFAULT_TIME_CONSTANT,
} from './utils.js';

/**
 * The MuteNode interface allows to mute a given input.
 *
 * ```
 * [input]
 *    │
 *    │ mute
 *    │
 * [output]
 * ```
 *
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {boolean} [options.active=false]
 *
 * @example
 * import {
 *   AudioContext,
 *   AudioBufferSourceNode,
 * } from 'isomorphic-web-audio-api';
 * import {
 *   AudioBufferLoader,
 *   MuteNode,
 * } from '../../src/index.js';
 *
 * // in browsers, you will need to resume on a user gesture
 * const audioContext = new AudioContext();
 * // load an audio buffer
 * const loader = new AudioBufferLoader(audioContext);
 * const buffer = await loader.load('../assets/drum-loop.wav');
 *
 * // build graph and start source
 * const mute = new MuteNode(audioContext, { active: false });
 * const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
 * src.connect(mute).connect(audioContext.destination);
 * src.start();
 *
 * // mute / unmute every seconds
 * setInterval(() => mute.active = !mute.active, 1000);
 */
export class MuteNode extends GainNode {
  #active = null;

  constructor(context, {
    active = false,
  } = {}) {
    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError(`Failed to construct 'MuteNode': Argument 1 is not an instance of BaseAudioContext`);
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError(`Failed to construct 'MuteNode': Argument 2 is not an object`);
    }

    active = !!active;

    super(context, { gain: active ? 0 : 1 });

    this.#active = active;
  }

  /**
   * Shallow `super.gain` AudioParam
   * @private
   */
  get gain() {
    return undefined;
  }

  /**
   * Defines whether the mute is active (muted) or not (pass trough).
   *
   * @type {boolean}
   */
  get active() {
    return this.#active;
  }

  set active(active) {
    this.setActiveAtTime(active, this.context.currentTime);
  }

  /**
   * Activate or deactivate the `MuteNode` at given time.
   *
   * @param {boolean} active - whether the bypass is active or not
   * @param {number} when - time at which the change should be applied. In audio
   *  context current time coordinates
   */
  setActiveAtTime(active, when) {
    if (!Number.isFinite(when)) {
      throw new TypeError(`Failed to execute 'setActiveAtTime' on 'MuteNode': argument 2 is not a finite number`);
    }

    active = !!active;

    if (active !== this.#active) {
      this.#active = active;
      when = Math.max(when, this.context.currentTime);
      super.gain.setTargetAtTime(this.#active ? 0 : 1, when, SET_TARGET_DEFAULT_TIME_CONSTANT);
    }
  }
}
