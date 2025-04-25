import { BaseAudioContext, GainNode } from 'isomorphic-web-audio-api';
import { isPlainObject } from '@ircam/sc-utils';

/**
 * The `BypassNode` interface allows to wrap and bypass an audio sub graph.
 *
 * ```
 *   [input]
 *      │     bypass
 *      ├───────┐
 *      │       │
 * [subGraph]   │
 *      │       │
 *      ├───────┘
 *      │
 *  [output]
 * ```
 *
 * @extends GainNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {boolean} [options.active=false]
 *
 * @example
 * import {
 *   AudioContext,
 *   AudioBufferSourceNode,
 *   BiquadFilterNode,
 * } from 'isomorphic-web-audio-api';
 * import {
 *   AudioBufferLoader,
 *   BypassNode,
 * } from '../../src/index.js';
 *
 * // in browsers, you will need to resume on a user gesture
 * const audioContext = new AudioContext();
 * // load an audio buffer
 * const loader = new AudioBufferLoader(audioContext);
 * const buffer = await loader.load('../assets/drum-loop.wav');
 *
 * const lowpass = new BiquadFilterNode(audioContext, { frequency: 400 });
 * const bypass = new BypassNode(audioContext);
 * // connect bypass to destination
 * bypass.connect(audioContext.destination);
 * // connect lowpass filter into subgraph
 * bypass.subGraphInput
 *   .connect(lowpass)
 *   .connect(bypass.subGraphOutput);
 *
 * // pipe a source in the graph
 * const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
 * src.connect(bypass);
 * src.start();
 *
 * // bypass the lowpass filter in 1 second
 * setInterval(() => {
 *   bypass.active = !bypass.active;
 *   console.log('set active to:', bypass.active)
 * }, buffer.duration * 1000);
 */
export class BypassNode extends GainNode {
  #active = true;
  #bypass = null;
  #subGraphIn = null;
  #output = null;

  constructor(context, {
    active = false,
  } = {}) {
    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError('Failed to construct BypassNode: argument 1 is not an instance of BaseAudioContext');
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError('Failed to construct BypassNode: argument 2 is not an object');
    }

    super(context);

    this.#active = !!active;

    this.#bypass = new GainNode(this.context, { gain: this.#active ? 1 : 0 });
    super.connect(this.#bypass);

    this.#subGraphIn = new GainNode(this.context, { gain: this.#active ? 0 : 1 });
    super.connect(this.#subGraphIn);

    this.#output = new GainNode(this.context);
    this.#bypass.connect(this.#output);
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

    const now = this.context.currentTime;
    this.#bypass.gain.setTargetAtTime(this.#active ? 1 : 0, now, 0.01);
    this.#subGraphIn.gain.setTargetAtTime(this.#active ? 0 : 1, now, 0.01);
  }

  /** [AudioNode#connect]{@link https://developer.mozilla.org/en-US/docs/Web/API/AudioNode/connect} */
  connect(...args) {
    return this.#output.connect(...args);
  }

  /** @inheritdoc */
  disconnect(...args) {
    return this.#output.disconnect(...args);
  }
}
