/**
 * The Volume, is similar to a gain but controllable in decibels
 */
export class VolumeNode {
    constructor(context: any, { volume, min, max, curve, }?: {
        volume?: number;
        min?: number;
        max?: number;
        curve?: any;
    }, ...args: any[]);
    /**
     * Shallow `super.gain` AudioParam
     * @private
     */
    private get gain();
    /**
     * Represents the amount of gain in decibels to apply.
     * @type AudioParam
     */
    get volume(): AudioParam;
    #private;
}
//# sourceMappingURL=VolumeNode.d.ts.map