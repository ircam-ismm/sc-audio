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
 * @param {number} [options.curve=null]
 *
 * @example
 * import {
 *   AudioContext,
 *   AudioBufferSourceNode,
 * } from 'isomorphic-web-audio-api';
 * import {
 *   AudioBufferLoader,
 *   VolumeNode,
 * } from '@ircam/sc-audio';
 *
 * // in browsers, you will need to resume on a user gesture
 * const audioContext = new AudioContext();
 * // load an audio buffer
 * const loader = new AudioBufferLoader(audioContext);
 * const buffer = await loader.load('../assets/drum-loop.wav');
 *
 * // build graph and start source
 * const fader = new VolumeNode(audioContext);
 * const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
 * src.connect(fader).connect(audioContext.destination);
 *
 * // start source and ramp from -60 to 0 dB
 * const now = audioContext.currentTime;
 * src.start(now);
 * fader.volume.setValueAtTime(-60, now);
 * fader.volume.linearRampToValueAtTime(0, now + buffer.duration);
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
    curve = null,
  } = {}) {
    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError('Failed to construct VolumeNode: argument 1 is not an instance of BaseAudioContext');
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError('Failed to construct VolumeNode: argument 2 is not an object');
    }

    if (!Number.isFinite(volume)) {
      throw new TypeError('Failed to construct VolumeNode: options.volume is not a finite number');
    }

    let dbCurve = null;

    if (curve !== null) {
      if (!isSequence(curve)) {
        throw new TypeError('Failed to construct VolumeNode: options.curve is not a sequence of finite number');
      }

      dbCurve = curve;
    } else {
      if (!Number.isFinite(min)) {
        throw new TypeError('Failed to construct VolumeNode: options.min is not a finite number');
      }

      if (!Number.isFinite(max)) {
        throw new TypeError('Failed to construct VolumeNode: options.max is not a finite number');
      }

      if (min !== DEFAULT_MIN_DB || max !== DEFAULT_MAX_DB) {
        dbCurve = computeWavetable(DEFAULT_WAVETABLE_SIZE, min, max);
      } else {
        dbCurve = DEFAULT_VOLUME_WAVETABLE;
      }
    }

    super(context, { gain: 0 });

    this.#min = min;
    this.#max = max;

    this.#dbWavetable = new WaveShaperNode(context, { curve: dbCurve });
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
