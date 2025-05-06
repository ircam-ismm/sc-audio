/**
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {boolean} [options.ratio=0] - Initial ratio
 * @param {number[]} [options.curve=null] - Curve to apply for the transition.
 *  Defaults to equal power curve.
 */
export class DistributorNode extends AudioNode {
    constructor(context: any, { ratio, curve, }?: {
        ratio?: number;
        curve?: Float32Array<ArrayBuffer>;
    }, ...args: any[]);
    /** @private */
    private get gain();
    /**
     * An AudioParam that controls the amount of incoming signal to route between the two outputs:
     * - a ratio of 0 is routed to output 0
     * - a ratio of 1 is routed to output 1
     *
     * @type {AudioParam}
     */
    get ratio(): AudioParam;
    /** @ignore */
    connect(destination: any, output?: number, input?: number, ...args: any[]): void;
    /** @ignore */
    disconnect(...args: any[]): void;
    #private;
}
//# sourceMappingURL=DistributorNode.d.ts.map