import { BaseAudioContext, GainNode } from 'isomorphic-web-audio-api';
import { isPlainObject } from '@ircam/sc-utils';

/**
 * A class that allows to wrap a given sub graph, so that it can be bypassed.
 *
 * ```
 *     │     bypass
 *     ├───────┐
 *     │       │
 * [subGraph]  │
 *     │       │
 *     ├───────┘
 *     │
 * ```
 *
 * @extends GainNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {boolean} [options.active=false]
 *
 * @example
 * import { AudioContext, BiquadFilterNode } from 'isomorphic-web-audio-api';
 * import { BypassNode } from '@ircam/sc-audio';
 *
 * const audioContext = new AudioContext();
 *
 * const filter = new BiquadFilterNode(audioContext); // the effect to bypass
 * const bypass = new BypassNode(audioContext, { active: true });
 * // wrap the subgraph within the bypass
 * bypass.subGraphInput.connect(filter).connect(bypass.subGraphOutput);
 * // connect the bypass to the overall graph
 * someSource.connect(bypass).connect(audioContext.destination);
 */
export class BypassNode extends GainNode {
  static parameters = {
    active: {
      type: 'boolean',
      default: false,
    },
  };

  #context = true;
  #active = true;
  #bypass = null;
  #subGraphIn = null;
  #output = null;

  constructor(context, {
    active = BypassNode.parameters.active.default,
  } = {}) {
    super(context);

    if (!(context instanceof BaseAudioContext)) {
      throw new Error('Failed to construct BypassNode: argument 1 is not an instance of BaseAudioContext');
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new Error('Failed to construct BypassNode: argument 2 is not an object');
    }

    this.#context = context;
    this.#active = !!active;

    this.#bypass = new GainNode(this.#context, {
      gain: this.#active ? 1 : 0,
    });
    super.connect(this.#bypass);

    this.#subGraphIn = new GainNode(this.#context, {
      gain: this.#active ? 0 : 1,
    });
    super.connect(this.#subGraphIn);

    this.#output = new GainNode(this.#context);
    this.#bypass.connect(this.#output);
  }

  /**
   * The BaseAudioContext which owns this AudioNode.
   * @type {BaseAudioContext}
   */
  get context() {
    return this.#context;
  }

  /**
   * Node to connect to the input of the sub graph
   *
   * @type {GainNode}
   * @example
   * const bypass = new Bypass(audioContext, { active: false });
   * const filter = new BiquadFilterNode(audioContext);
   * bypass.subGraphInput.connect(filter).connect(bypass.subGraphOutput);
   */
  get subGraphInput() {
    return this.#subGraphIn;
  }

  /**
   * Node to connect to the input of the sub graph
   *
   * @type {GainNode}
   * @example
   * const bypass = new Bypass(audioContext, { active: false });
   * const filter = new BiquadFilterNode(audioContext);
   * bypass.subGraphInput.connect(filter).connect(bypass.subGraphOutput);
   */
  get subGraphOutput() {
    return this.#output;
  }

  /**
   * Defines if the Bypass is active, i.e. if true the signal doesn't pass through
   * the sub graph and flows directly to the output.
   *
   * @type {boolean}
   */
  get active() {
    return this.#active;
  }

  set active(value) {
    this.#active = value;

    const now = this.#context.currentTime;
    this.#bypass.gain.setTargetAtTime(this.#active ? 1 : 0, now, 0.01);
    this.#subGraphIn.gain.setTargetAtTime(this.#active ? 0 : 1, now, 0.01);
  }

  /** @inheritdoc */
  connect(...args) {
    return this.#output.connect(...args);
  }

  /** @inheritdoc */
  disconnect(...args) {
    this.#output.disconnect(...args);
  }
}
