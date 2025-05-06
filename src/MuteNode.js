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
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {boolean} [options.active=false]
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
   * @param {boolean} active - Whether the bypass is active or not.
   * @param {number} when - Time at which the change should be applied. In audio
   *  context current time coordinates.
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
