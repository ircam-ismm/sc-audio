/**
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {number} [options.volume=0]
 * @param {number} [options.min=-80]
 * @param {number} [options.max=12]
 */
export class VolumeNode extends AudioNode {
    constructor(context: any, { volume, min, max, controlCurve, }?: {
        volume?: number;
        min?: number;
        max?: number;
        controlCurve?: any;
    }, ...args: any[]);
    /**
     * Shallow `super.gain` AudioParam
     * @private
     */
    private get gain();
    /**
     * Minimum value of the volume in dB.
     *
     * @type {number}
     */
    get min(): number;
    /**
     * Maximum value of the volume in dB.
     *
     * @type {number}
     */
    get max(): number;
    /**
     * An AudioParam that Represents the amount of gain in decibels to apply.
     *
     * @type {AudioParam}
     */
    get volume(): AudioParam;
    #private;
}
//# sourceMappingURL=VolumeNode.d.ts.map