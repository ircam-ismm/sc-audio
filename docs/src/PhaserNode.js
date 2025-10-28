import {
  BaseAudioContext,
  BiquadFilterNode,
  ConstantSourceNode,
  GainNode,
  OscillatorNode,
} from 'isomorphic-web-audio-api';
import { isPlainObject } from '@ircam/sc-utils';
import { DistributorNode } from './DistributorNode.js';

export class PhaserNode extends GainNode {
  #output = null;

  #dryWet = null;
  #lfoRate = null;
  #lfoDepth = null;
  #filters = [];
  #frequencyController = null;

  constructor(context, {
    rate = 10, // Hertz
    depth = 10, // Hertz (?)
    feedback = 0, // linear gain
    frequency = 1000,
    ratio = 0.6,
    stages = 4,
    type = 'sine',
  } = {}) {
     if (!(context instanceof BaseAudioContext)) {
      throw new TypeError(`Failed to construct 'PhaserNode': Argument 1 is not an instance of BaseAudioContext`);
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError(`Failed to construct 'PhaserNode': Argument 2 is not an object`);
    }

    super(AudioContext, { gain: 1 });

    this.#output = new GainNode(AudioContext, { gain: 1 });

    this.#dryWet = new DistributorNode(context, { ratio: 0.6 });
    this.#dryWet.connect(this.#output, 0, 0);

    // center frequency of phase shift
    this.#frequencyController = new ConstantSourceNode(context, { offset: frequency });
    // lfo to modulate around frequency
    this.#lfoRate = new OscillatorNode(context, { frequency: rate, type });
    this.#lfoDepth = new GainNode(context, { gain: depth });
    this.#lfoRate.connect(this.#lfoDepth);

    // @todo - make it dynamic
    for (let i = 0; i < stages; i++) {
      const filter = new BiquadFilterNode(context, { type: 'allpass', frequency });
      this.#frequencyController.connect(filter.frequency);
      this.#lfoDepth.connect(filter.frequency);

      this.#filters.push(filter);
    }

    this.#dryWet.connect(this.#filters[0], 1, 0);

    for (let i = 0; i < this.#filters.length - 1; i++) {
      this.#filters[i].connect(this.#filters[i + 1]);
    }

    this.#filters[this.#filters.length - 1].connect(this.#output);

    // start the sources
    this.#frequencyController.start();
    this.#lfoRate.start();
  }

  /** @private */
  get gain() {
    return undefined;
  }

  // get rate() {

  // }

  // get depth() {

  // }

  /** @ignore */
  connect(...args) {
    return this.#output.connect(...args);
  }

  /** @ignore */
  disconnect(...args) {
    return this.#output.disconnect(...args);
  }
}
