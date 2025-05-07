import {
  decibelToLinear,
  isPlainObject,
  isSequence,
} from '@ircam/sc-utils';
import {
  BaseAudioContext,
  GainNode,
  WaveShaperNode,
} from 'isomorphic-web-audio-api';

import {
  ScaledConstantSourceNode,
} from './ScaledConstantSourceNode.js';

import { DEFAULT_WAVETABLE_SIZE } from './utils.js';

// [-80, 12] dB

/** @private */
function computeWavetable(size, min, max) {
  const wavetable = new Float32Array(size);

  for (let i = 0; i < DEFAULT_WAVETABLE_SIZE; i++) {
    const db = min + (i / (DEFAULT_WAVETABLE_SIZE - 1) * (max - min));
    const lin = decibelToLinear(db);
    wavetable[i] = lin;
  }

  return wavetable;
}

/** @private */
const DEFAULT_MIN_DB = -80;
/** @private */
const DEFAULT_MAX_DB = 12;
/** @private */
const DEFAULT_VOLUME_WAVETABLE = computeWavetable(DEFAULT_WAVETABLE_SIZE, DEFAULT_MIN_DB, DEFAULT_MAX_DB);

/**
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {number} [options.volume=0]
 * @param {number} [options.min=-80]
 * @param {number} [options.max=12]
 */
export class VolumeNode extends GainNode {
  #volumeCurveController = null;
  #min = null;
  #max = null;
  #dbWavetable = null;

  constructor(context, {
    volume = 0,
    min = DEFAULT_MIN_DB,
    max = DEFAULT_MAX_DB,
    controlCurve = null,
  } = {}) {
    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError('Failed to construct VolumeNode: argument 1 is not an instance of BaseAudioContext');
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError('Failed to construct VolumeNode: argument 2 is not an object');
    }

    // having a user defined curve make no sens since our mapping from AudioParam
    // to in dB to gain values must be linear. Non-linear controls are just what
    // they are: controls...
    // Just expose a user friendly `controlCurve` option from which we extract the min and the max
    if (controlCurve) {
      if (!isSequence(controlCurve)) {
        throw new TypeError('Failed to construct VolumeNode: options.controlCurve is not a sequence of finite numbers');
      }

      min = controlCurve[0];
      max = controlCurve[controlCurve.length - 1];
    }

    if (!Number.isFinite(volume)) {
      throw new TypeError('Failed to construct VolumeNode: options.volume is not a finite number');
    }

    if (!Number.isFinite(min)) {
      throw new TypeError('Failed to construct VolumeNode: options.min is not a finite number');
    }

    if (!Number.isFinite(max)) {
      throw new TypeError('Failed to construct VolumeNode: options.max is not a finite number');
    }

    const curve = (min !== DEFAULT_MIN_DB || max !== DEFAULT_MAX_DB)
      ? computeWavetable(DEFAULT_WAVETABLE_SIZE, min, max)
      : DEFAULT_VOLUME_WAVETABLE;

    super(context, { gain: 0 });

    this.#min = min;
    this.#max = max;

    this.#dbWavetable = new WaveShaperNode(context, { curve });
    this.#dbWavetable.connect(super.gain);

    this.#volumeCurveController = new ScaledConstantSourceNode(context, {
      inputStart: min,
      inputEnd: max,
      outputStart: -1,
      outputEnd: 1,
      offset: volume,
    });

    this.#volumeCurveController.connect(this.#dbWavetable);
    this.#volumeCurveController.start();
  }

  /**
   * Shallow `super.gain` AudioParam
   * @private
   */
  get gain() {
    return undefined;
  }

  /**
   * Minimum value of the volume in dB.
   *
   * @type {number}
   */
  get min() {
    return this.#min;
  }

  /**
   * Maximum value of the volume in dB.
   *
   * @type {number}
   */
  get max() {
    return this.#max;
  }

  /**
   * Curve used to map from db to linear gain.
   *
   * Note that the returned sequence value is a copy of the actual curve used, then
   * modifying the returned value won't affect the audio computation.
   *
   * @type {Float32Array}
   */
  get curve() {
    return this.#dbWavetable.curve;
  }

  /**
   * An AudioParam that Represents the amount of gain in decibels to apply.
   *
   * @type {AudioParam}
   */
  get volume() {
    return this.#volumeCurveController.offset;
  }
}
