/**
 * A ConstantSourceNode that scales it offset signal from given domain to a given
 * range.
 *
 * In particular, this is useful to create an audio param signal to be piped into a
 * WaveShaper node.
 *
 * Note that output values are not clamped.
 */
export class ScaledConstantSourceNode {
    constructor(context: any, { inputStart, inputEnd, outputStart, outputEnd, offset, }?: {
        inputStart?: number;
        inputEnd?: number;
        outputStart?: number;
        outputEnd?: number;
        offset?: number;
    }, ...args: any[]);
    /** @inheritdoc */
    start(...args: any[]): void;
    /** @inheritdoc */
    stop(...args: any[]): void;
    /** @inheritdoc */
    connect(...args: any[]): any;
    /** @inheritdoc */
    disconnect(...args: any[]): any;
    #private;
}
//# sourceMappingURL=ScaledConstantSourceNode.d.ts.map