import {
  BaseAudioContext,
  GainNode,
  WaveShaperNode,
  AudioNode,
} from 'isomorphic-web-audio-api';
import {
  isPlainObject,
  isSequence,
} from '@ircam/sc-utils';

import {
  QUARTER_SIN_WAVETABLE,
} from './utils.js';
import {
  ScaledConstantSourceNode,
} from './ScaledConstantSourceNode.js';


/**
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {boolean} [options.ratio=0] - Initial ratio
 * @param {number[]} [options.curve=null] - Curve to apply for the transition.
 *  Defaults to equal power curve.
 */
export class CollectorNode extends GainNode {
  #inputs = [];
  #output = null;
  #ratioCurveController = null;

  constructor(context, {
    ratio = 0,
    curve = QUARTER_SIN_WAVETABLE,
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

    // @note: that super is never is never used in the graph, that's weird
    // probably needs to be refactored...
    super(context);

    this.#output = new GainNode(context);

    //
    const input0 = new GainNode(context, { gain: 0 });
    input0.connect(this.#output);
    const input0Curve = new WaveShaperNode(context, { curve });
    input0Curve.connect(input0.gain);

    const input1 = new GainNode(context, { gain: 0 });
    input1.connect(this.#output);
    const input1Curve = new WaveShaperNode(context, { curve });
    input1Curve.connect(input1.gain);

    this.#ratioCurveController = new ScaledConstantSourceNode(context, {
      inputStart: 0,
      inputEnd: 1,
      outputStart: -1,
      outputEnd: 1,
      offset: ratio,
    });

    const multByMinusOne = new GainNode(context, { gain: -1 });
    this.#ratioCurveController.connect(multByMinusOne).connect(input0Curve);
    this.#ratioCurveController.connect(input1Curve);
    this.#ratioCurveController.start();

    this.#inputs = [input0, input1];
  }

  /** @private */
  get gain() {
    return undefined;
  }

  /** @ignore */
  get numberOfInputs() {
    return 2;
  }

  /**
   * An array of length 2, containing the 2 inputs of the CollectorNode.
   * @type {GainNode[]}
   */
  get inputs() {
    return this.#inputs;
  }

  /**
   * An AudioParam that controls the amount of incoming signal from the inputs to be routed to the output:
   * - `inputs[0]` is at maximum volume when ratio is set to `0`
   * - `inputs[1]` is at maximum volume when ratio is set to `1`
   *
   * @type {AudioParam}
   */
  get ratio() {
    return this.#ratioCurveController.offset;
  }

  /** @ignore */
  connect(...args) {
    return this.#output.connect(...args);
  }

  /** @ignore */
  disconnect(...args) {
    return this.#output.connect(...args);
  }
}
