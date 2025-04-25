import {
  BaseAudioContext,
  ConstantSourceNode,
  GainNode
} from 'isomorphic-web-audio-api';
import {
  isPlainObject
} from '@ircam/sc-utils';

/**
 * A ConstantSourceNode that scales it offset signal from given domain to a given
 * range.
 *
 * In particular, this is useful to create an audio param signal to be piped into a
 * WaveShaper node.
 *
 * Note that output values are not clamped.
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

  /** @inheritdoc */
  start(...args) {
    super.start(...args);
    this.#inputStartOffset.start(...args);
    this.#outputStartOffset.start(...args);
  }

  /** @inheritdoc */
  stop(...args) {
    super.start(...args);
    this.#inputStartOffset.start(...args);
    this.#outputStartOffset.start(...args);
  }

  /** @inheritdoc */
  connect(...args) {
    return this.#output.connect(...args);
  }

  /** @inheritdoc */
  disconnect(...args) {
    return this.#output.connect(...args);
  }
}
