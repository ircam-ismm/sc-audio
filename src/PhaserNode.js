import {
  BaseAudioContext,
  BiquadFilterNode,
  ConstantSourceNode,
  GainNode,
  OscillatorNode,
} from 'isomorphic-web-audio-api';
import { isPlainObject } from '@ircam/sc-utils';
import { DistributorNode } from './DistributorNode.js';

import {
  SET_TARGET_DEFAULT_TIME_CONSTANT,
} from './utils.js';

export class PhaserNode extends GainNode {
  #output = null;
  #stages = null;
  #dryWet = null;
  #lfoRate = null;
  #lfoDepth = null;
  #filters = [];
  #filtersEnvelop = null;
  #frequencyController = null;

  constructor(context, {
    stages = 4,
    rate = 10, // Hertz
    depth = 10, // Hertz (?)
    feedback = 0, // linear gain
    frequency = 1000,
    ratio = 0.5,
    type = 'sine',
  } = {}) {
     if (!(context instanceof BaseAudioContext)) {
      throw new TypeError(`Failed to construct 'PhaserNode': Argument 1 is not an instance of BaseAudioContext`);
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError(`Failed to construct 'PhaserNode': Argument 2 is not an object`);
    }

    super(context, { gain: 1 });

    this.#output = new GainNode(context, { gain: 1 });

    this.#dryWet = new DistributorNode(context, { ratio });
    super.connect(this.#dryWet);
    this.#dryWet.connect(this.#output, 0, 0);

    // center frequency of phase shift
    this.#frequencyController = new ConstantSourceNode(context, { offset: frequency });
    // lfo to modulate around frequency
    this.#lfoRate = new OscillatorNode(context, { frequency: rate, type });
    this.#lfoDepth = new GainNode(context, { gain: depth });
    this.#lfoRate.connect(this.#lfoDepth);
    // start the sources
    this.#frequencyController.start();
    this.#lfoRate.start();
    // setting the stages will build the filter bank
    this.stages = stages;
  }

  /**
   * Number of cascading allpass filters.
   *
   * Note that changing this parameter at runtime may cause discontinuities
   * @todo - Clean this
   *
   * @type {Number}
   */
  get stages() {
    return this.#filters.length;
  }

  set stages(value) {
    this.#frequencyController.disconnect();
    this.#lfoDepth.disconnect();

    const previousFilters = this.#filters;
    const previousFiltersEnvelop = this.#filtersEnvelop;

    this.#filters = new Array(value);

    for (let i = 0; i < this.#filters.length; i++) {
      const filter = new BiquadFilterNode(super.context, {
        type: 'allpass',
        frequency: 0,
      });
      // connect LFO controllers
      this.#frequencyController.connect(filter.frequency);
      this.#lfoDepth.connect(filter.frequency);

      this.#filters[i] = filter;
    }

    for (let i = 0; i < this.#filters.length - 1; i++) {
      this.#filters[i].connect(this.#filters[i + 1]);
    }

    this.#dryWet.connect(this.#filters[0], 1, 0);
    this.#filters[this.#filters.length - 1].connect(this.#output);

    if (previousFiltersEnvelop === null) {
      // nothing special to do
      this.#filtersEnvelop = new GainNode(this.context, { gain: 1 });
      this.#dryWet.connect(this.#filtersEnvelop, 1, 0);
      this.#filtersEnvelop.connect(this.#filters[0]);
      this.#filters[this.#filters.length - 1].connect(this.#output);
    } else {
      // cross fade between old and new filter banks
      const now = this.context.currentTime;
      const disconnectDelay = Math.ceil(SET_TARGET_DEFAULT_TIME_CONSTANT * 10 * 10e3);
      previousFiltersEnvelop.setTargetAtTime(0, now, SET_TARGET_DEFAULT_TIME_CONSTANT);

      this.#filtersEnvelop = new GainNode(this.context, { gain: 0 });
      this.#dryWet.connect(this.#filtersEnvelop, 1, 0);
      this.#filtersEnvelop.connect(this.#filters[0]);
      this.#filters[this.#filters.length - 1].connect(this.#output);
      // fade in
      this.#filtersEnvelop.setTargetAtTime(1, now, SET_TARGET_DEFAULT_TIME_CONSTANT);

      setTimeout(() => {
        this.#dryWet.disconnect(previousFiltersEnvelop, 1, 0);
        previousFiltersEnvelop.disconnect();

        previousFilters.forEach(filter => {
          this.#frequencyController.disconnect(filter.frequency);
          this.#lfoDepth.disconnect(filter.frequency);
          filter.disconnect();
        });
      }, disconnectDelay);
    }
  }

  /** @private */
  get gain() {
    return undefined;
  }

  /**
   * Mix ratio between dry signal (0) and wet signal (1)
   */
  get ratio() {
    return this.#dryWet.ratio;
  }

  /**
   * Rate (in Hz) of the LFO modulating the frequency of the filter bank.
   */
  get rate() {
    return this.#lfoRate.frequency;
  }

  /**
   * Depth (in Hz) of the modulation applied to the frequency of the filter bank by the LFO.
   *
   * A depth of 100 applied to a frequency of 1000 will produce a frequency comprised
   * between 900 and 1100.
   */
  get depth() {
    return this.#lfoDepth.gain;
  }

  /**
   * Frequency of the all pass filters of the filter bank. This is the frequency at
   * which the phases will be shifted.
   */
  get frequency() {
    return this.#frequencyController.offset;
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
