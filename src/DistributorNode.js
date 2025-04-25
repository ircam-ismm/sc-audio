import {
  BaseAudioContext,
  GainNode,
  WaveShaperNode,
} from 'isomorphic-web-audio-api';
import {
  isPlainObject,
  isSequence,
} from '@ircam/sc-utils';

import {
  QUARTER_SIN_WAVETABLE,
} from './utils.js';
import {
  ScaledConstantSourceNode
} from './ScaledConstantSourceNode.js';


/**
 * The `DistributorNode` interface allows to distribute an input between two output.
 *
 * It can be used for example to create dry / wet controls.
 *
 * ```
 *         [input]
 *            │
 *            │ ratio
 *     ┌──────┴─────┐
 *     │            │
 * [output 0]   [output 1]
 * ```
 *
 * @extends GainNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {boolean} [options.ratio=0] - Initial ratio
 * @param {number[]} [options.curve=null] - Curve to apply for the transition.
 *  Defaults to equal power curve.
 *
 * @example
 * import {
 *   AudioContext,
 *   AudioBufferSourceNode,
 *   ConvolverNode,
 * } from 'isomorphic-web-audio-api';
 * import {
 *   AudioBufferLoader,
 *   DistributorNode,
 * } from '../../src/index.js';
 *
 * // in browsers, you will need to resume on a user gesture
 * const audioContext = new AudioContext();
 * // load an audio buffer
 * const loader = new AudioBufferLoader(audioContext);
 * const ir = await loader.load('../assets/parking-garage-response.wav');
 * const buffer = await loader.load('../assets/drum-loop.wav');
 *
 * // create the graph
 * const convolver = new ConvolverNode(audioContext, { buffer: ir });
 * convolver.connect(audioContext.destination);
 *
 * const dryWet = new DistributorNode(audioContext);
 * // connect dry output (0) to destination
 * dryWet.connect(audioContext.destination, 0);
 * // connect wet output (1) to convolver
 * dryWet.connect(convolver, 1);
 *
 * // pipe a source in the graph
 * const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
 * src.connect(dryWet);
 * src.start();
 *
 * // ramp from dry to wet in 4 seconds, then back to dry
 * dryWet.ratio.setValueAtTime(0, audioContext.currentTime);
 * dryWet.ratio.linearRampToValueAtTime(1, audioContext.currentTime + buffer.duration);
 * dryWet.ratio.exponentialRampToValueAtTime(0.001, audioContext.currentTime + buffer.duration * 2);
 */
export class DistributorNode extends GainNode {
  #dryGain = null;
  #wetGain = null;
  #ratioCurveController = null;

  constructor(context, {
    ratio = 0,
    curve = QUARTER_SIN_WAVETABLE
  } = {}) {
    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError('Failed to construct DistributorNode: Argument 1 is not an instance of BaseAudioContext');
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError('Failed to construct DistributorNode: Argument 2 is not an object');
    }

    if (!Number.isFinite(ratio)) {
      throw new TypeError('Failed to construct DistributorNode: options.ratio is not a finite number');
    }

    if (!isSequence(curve)) {
      throw new TypeError('Failed to construct DistributorNode: options.curve is not a sequence of finite number');
    }

    super(context);

    this.#dryGain = new GainNode(context, { gain: 0 });
    super.connect(this.#dryGain);
    // when `ratio` is at 0, dry should be 1
    const dryGainCurve = new WaveShaperNode(context, { curve });
    dryGainCurve.connect(this.#dryGain.gain);

    this.#wetGain = new GainNode(context, { gain: 0 });
    super.connect(this.#wetGain);
    // when `ratio` is at 0, wet should be 0
    const wetGainCurve = new WaveShaperNode(context, { curve });
    wetGainCurve.connect(this.#wetGain.gain);

    this.#ratioCurveController = new ScaledConstantSourceNode(context, {
      inputStart: 0,
      inputEnd: 1,
      outputStart: -1,
      outputEnd: 1,
      offset: ratio,
    });

    // - dry gain: inverse signal from ratioCurveController before applying wavetable
    // - wet gain: can use signal from ratioCurveController directly
    const multByMinusOne = new GainNode(context, { gain: -1 });
    this.#ratioCurveController.connect(multByMinusOne).connect(dryGainCurve);
    this.#ratioCurveController.connect(wetGainCurve);
    this.#ratioCurveController.start();
  }

  /** @private */
  get gain() {
    return undefined;
  }

  /** @ignore */
  get numberOfOutputs() {
      return 2;
  }

  /**
   * Amount of incoming signal to route between the two outputs:
   * - a ratio of 0 is routed to output 0
   * - a ratio of 1 is routed to output 1
   * @type AudioParam
   */
  get ratio() {
    return this.#ratioCurveController.offset;
  }

  /** @ignore */
  connect(destination, output = 0, input = 0) {
    // [spec]
    // AudioNode connect (AudioNode destinationNode,
    //   optional unsigned long output = 0,
    //   optional unsigned long input = 0);
    // undefined connect (AudioParam destinationParam, optional unsigned long output = 0);

    // enforce explicit definition of output index
    if (arguments.length < 2) {
      throw new Error(`Cannot execute 'connect' on 'DistributorNode': Argument 2 (output index) is not defined`);
    }

    if (![0, 1].includes(output)) {
      throw new Error(`Cannot execute 'connect' on 'DistributorNode': Argument 2 (output index) must be either 0 (dry) or 1 (wet)`);
    }

    if (output === 0) {
      this.#dryGain.connect(destination, 0, input);
    } else {
      this.#wetGain.connect(destination, 0, input);
    }
  }

  /** @ignore */
  disconnect(...args) {
    // [spec]
    // undefined disconnect ();
    // undefined disconnect (unsigned long output);
    // undefined disconnect (AudioNode destinationNode);
    // undefined disconnect (AudioNode destinationNode, unsigned long output);
    // undefined disconnect (AudioNode destinationNode,
    //                       unsigned long output,
    //                       unsigned long input);
    // undefined disconnect (AudioParam destinationParam);
    // undefined disconnect (AudioParam destinationParam, unsigned long output);

    if (args.length === 0) {
      // disconnect everything
      this.#dryGain.disconnect();
      this.#wetGain.disconnect();
      return;
    }

    if (Number.isInteger(args[0])) {
      if (![0, 1].includes(args[0])) {
        throw new Error(`Cannot execute 'disconnect' on 'DistributorNode': Argument 1 (output index) must be either 0 (dry) or 1 (wet)`);
      }

      if (args[0] === 0) {
        this.#dryGain.disconnect();
      } else {
        this.#wetGain.disconnect();
      }
    // if destination is given, require explicit output index
    } else if (args[0] instanceof AudioNode || args[0] instanceof AudioParam) {
      if (![0, 1].includes(args[1])) {
        throw new Error(`Cannot execute 'disconnect' on 'DistributorNode': Argument 2 (output index) must be either 0 (dry) or 1 (wet)`);
      }

      if (args[1] === 0) {
        this.#dryGain.disconnect(args[0]);
      } else {
        this.#wetGain.disconnect(args[0]);
      }
    } else {
      throw new Error(`Cannot execute 'disconnect' on 'DistributorNode': Overload resolution failed`);
    }
  }
}
