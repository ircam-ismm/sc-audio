/**
 * A ConstantSourceNode that scales it offset signal from given domain to a given
 * range. Note that output values are not clamped.
 *
 * In particular, this is useful to create an audio param signal to be piped into a
 * WaveShaper node.
 *
 * @private
 */
export class ScaledConstantSourceNode {
    constructor(context: any, { inputStart, inputEnd, outputStart, outputEnd, offset, }?: {
        inputStart?: number;
        inputEnd?: number;
        outputStart?: number;
        outputEnd?: number;
        offset?: number;
    }, ...args: any[]);
    /** @ignore */
    start(...args: any[]): void;
    /** @ignore */
    stop(...args: any[]): void;
    /** @ignore */
    connect(...args: any[]): any;
    /** @ignore */
    disconnect(...args: any[]): any;
    #private;
}
//# sourceMappingURL=ScaledConstantSourceNode.d.ts.map