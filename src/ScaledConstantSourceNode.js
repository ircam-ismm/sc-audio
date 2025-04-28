import {
  BaseAudioContext,
  ConstantSourceNode,
  GainNode,
} from 'isomorphic-web-audio-api';
import {
  isPlainObject,
} from '@ircam/sc-utils';

/**
 * A ConstantSourceNode that scales it offset signal from given domain to a given
 * range. Note that output values are not clamped.
 *
 * In particular, this is useful to create an audio param signal to be piped into a
 * WaveShaper node.
 *
 * @private
 */
export class ScaledConstantSourceNode extends ConstantSourceNode {
  #output = null;
  #inputStartOffset = null;
  #outputStartOffset = null;

  constructor(context, {
    inputStart = 0,
    inputEnd = 1,
    outputStart = -1,
    outputEnd = 1,
    offset = 0,
  } = {}) {
    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError('Failed to construct ScaledConstantSourceNode: Argument 1 is not an instance of BaseAudioContext');
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError('Failed to construct ScaledConstantSourceNode: Argument 2 is not an object');
    }

    if (!Number.isFinite(inputStart)) {
      throw new TypeError('Failed to construct ScaledConstantSourceNode: options.inputStart is not a finite number');
    }

    if (!Number.isFinite(inputEnd)) {
      throw new TypeError('Failed to construct ScaledConstantSourceNode: options.inputEnd is not a finite number');
    }

    if (!Number.isFinite(outputStart)) {
      throw new TypeError('Failed to construct ScaledConstantSourceNode: options.outputStart is not a finite number');
    }

    if (!Number.isFinite(outputEnd)) {
      throw new TypeError('Failed to construct ScaledConstantSourceNode: options.outputEnd is not a finite number');
    }

    if (!Number.isFinite(offset)) {
      throw new TypeError('Failed to construct ScaledConstantSourceNode: options.offset is not a finite number');
    }

    super(context, { offset });

    this.#inputStartOffset = new ConstantSourceNode(context, { offset: -inputStart });
    const normalizeFactor = new GainNode(context, { gain: (outputEnd - outputStart) / (inputEnd - inputStart) });
    this.#outputStartOffset = new ConstantSourceNode(context, { offset: outputStart });
    this.#output = new GainNode(context);

    super.connect(normalizeFactor);
    this.#inputStartOffset.connect(normalizeFactor);
    normalizeFactor.connect(this.#output);
    this.#outputStartOffset.connect(this.#output);
  }

  /** @ignore */
  start(...args) {
    super.start(...args);
    this.#inputStartOffset.start(...args);
    this.#outputStartOffset.start(...args);
  }

  /** @ignore */
  stop(...args) {
    super.start(...args);
    this.#inputStartOffset.start(...args);
    this.#outputStartOffset.start(...args);
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
