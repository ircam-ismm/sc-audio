export class PhaserNode {
    constructor(context: any, { stages, rate, depth, frequency, ratio, type, }?: {
        stages?: number;
        rate?: number;
        depth?: number;
        frequency?: number;
        ratio?: number;
        type?: string;
    }, ...args: any[]);
    set stages(value: number);
    /**
     * Number of cascading allpass filters.
     *
     * Note that changing this parameter at runtime may cause discontinuities
     * @todo - Clean this
     *
     * @type {Number}
     */
    get stages(): number;
    /** @private */
    private get gain();
    /**
     * Mix ratio between dry signal (0) and wet signal (1)
     */
    get ratio(): any;
    /**
     * Rate (in Hz) of the LFO modulating the frequency of the filter bank.
     */
    get rate(): any;
    /**
     * Depth (in Hz) of the modulation applied to the frequency of the filter bank by the LFO.
     *
     * A depth of 100 applied to a frequency of 1000 will produce a frequency comprised
     * between 900 and 1100.
     */
    get depth(): any;
    /**
     * Frequency of the all pass filters of the filter bank. This is the frequency at
     * which the phases will be shifted.
     */
    get frequency(): any;
    /** @ignore */
    connect(...args: any[]): any;
    /** @ignore */
    disconnect(...args: any[]): any;
    #private;
}
//# sourceMappingURL=PhaserNode.d.ts.map