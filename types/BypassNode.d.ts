/**
 * @typedef {Object} BypassNodeOptions
 */
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
 * @param {BypassNodeOptions} [options={}]
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
export class BypassNode {
    static parameters: {
        active: {
            type: string;
            default: boolean;
        };
    };
    constructor(context: any, { active, }?: {
        active?: boolean;
    }, ...args: any[]);
    /**
     * The BaseAudioContext which owns this AudioNode.
     * @type {BaseAudioContext}
     */
    get context(): BaseAudioContext;
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
    set active(value: boolean);
    /**
     * Defines if the Bypass is active, i.e. if true the signal doesn't pass through
     * the sub graph and flows directly to the output.
     *
     * @type {boolean}
     */
    get active(): boolean;
    /** @inheritdoc */
    connect(...args: any[]): any;
    /** @inheritdoc */
    disconnect(...args: any[]): void;
    #private;
}
export type BypassNodeOptions = any;
//# sourceMappingURL=BypassNode.d.ts.map