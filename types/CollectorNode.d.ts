/**
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {boolean} [options.ratio=0] - Initial ratio
 * @param {number[]} [options.curve=null] - Curve to apply for the transition.
 *  Defaults to equal power curve.
 */
export class CollectorNode extends AudioNode {
    constructor(context: any, { ratio, curve, }?: {
        ratio?: number;
        curve?: Float32Array<ArrayBuffer>;
    }, ...args: any[]);
    /** @private */
    private get gain();
    /**
     * An array of length 2, containing the 2 inputs of the CollectorNode.
     * @type {GainNode[]}
     */
    get inputs(): GainNode[];
    /**
     * An AudioParam that controls the amount of incoming signal from the inputs to be routed to the output:
     * - `inputs[0]` is at maximum volume when ratio is set to `0`
     * - `inputs[1]` is at maximum volume when ratio is set to `1`
     *
     * @type {AudioParam}
     */
    get ratio(): AudioParam;
    /** @ignore */
    connect(...args: any[]): any;
    /** @ignore */
    disconnect(...args: any[]): any;
    #private;
}
//# sourceMappingURL=CollectorNode.d.ts.map