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
 * @extends AudioNode
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
 * } from '@ircam/sc-audio';
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
export class BypassNode extends AudioNode {
    constructor(context: any, { active, }?: {
        active?: boolean;
    }, ...args: any[]);
    /**
     * Shallow `super.gain` AudioParam
     * @private
     */
    private get gain();
    /**
     * Node to connect to the input of the sub graph
     *
     * @type {GainNode}
     * @example
     * const bypass = new Bypass(audioContext, { active: false });
     * const filter = new BiquadFilterNode(audioContext);
     * bypass.subGraphInput.connect(filter).connect(bypass.subGraphOutput);
     */
    get subGraphInput(): GainNode;
    /**
     * Node to connect to the input of the sub graph
     *
     * @type {GainNode}
     * @example
     * const bypass = new Bypass(audioContext, { active: false });
     * const filter = new BiquadFilterNode(audioContext);
     * bypass.subGraphInput.connect(filter).connect(bypass.subGraphOutput);
     */
    get subGraphOutput(): GainNode;
    set active(active: boolean);
    /**
     * Defines if the Bypass is active, i.e. if true the signal doesn't pass through
     * the sub graph and flows directly to the output.
     *
     * @type {boolean}
     */
    get active(): boolean;
    /**
     * Activate or deactivate the `BypassNode` at given time.
     *
     * @param {boolean} active - whether the bypass is active or not
     * @param {number} when - time at which the change should be applied. In audio
     *  context current time coordinates
     */
    setActiveAtTime(active: boolean, when: number): void;
    /** @ignore */
    connect(...args: any[]): any;
    /** @ignore */
    disconnect(...args: any[]): any;
    #private;
}
//# sourceMappingURL=BypassNode.d.ts.map