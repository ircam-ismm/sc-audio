/**
 * A dynamics compressor node that extends GainNode to provide audio compression
 * with configurable attack, release, threshold, ratio, and knee parameters.
 *
 * The compressor uses a pre-gain stage, a Web Audio API DynamicsCompressorNode,
 * and a post-gain stage to allow flexible control over input and output levels.
 *
 * Contrary to the Web Audio API DynamicsCompressorNode, the knee is around the threshold.
 *
 * All parameters use the same range, but are not AudioParam.
 *
 * @class DynamicsCompressorNode
 * @extends {GainNode}
 *
 * @param {BaseAudioContext} context - The audio context to associate with this node
 * @param {Object} [options={}] - Configuration options for the compressor
 * @param {number} [options.attack=10e-3] - Attack time in seconds
 * @param {number} [options.release=250e-3] - Release time in seconds
 * @param {number} [options.threshold=-6] - Compression threshold in dB
 * @param {number} [options.ratio=12] - Compression ratio
 * @param {number} [options.knee=30] - Knee width in dB
 * @param {number} [options.preGain=0] - Pre-compression gain in dB
 * @param {number} [options.postGain=0] - Post-compression gain in dB
 * @param {number} [options.linearTimeConstant=10e-3] - Time constant for linear ramp in seconds
 * @param {number} [options.curveTimeConstant=10e-3] - Time constant for curve ramp in seconds
 *
 * @throws {TypeError} If context is not an instance of BaseAudioContext
 * @throws {TypeError} If options argument is provided but is not an object
 */
export class DynamicsCompressorNode {
    constructor(context: any, { attack, release, threshold, ratio, knee, preGain, postGain, linearTimeConstant, curveTimeConstant, }?: {
        attack?: number;
        release?: number;
        threshold?: number;
        ratio?: number;
        knee?: number;
        preGain?: number;
        postGain?: number;
        linearTimeConstant?: number;
        curveTimeConstant?: number;
    }, ...args: any[]);
    linearTimeConstant: number;
    curveTimeConstant: number;
    _dynamicsCompressorNode: any;
    /**
     * Shallow `super.gain` AudioParam
     * @private
     */
    private get gain();
    /**
     * Sets the attack time of the dynamics compressor in seconds.
     * @param {number} value - The attack time value (must be a finite number)
     * @throws {TypeError} If the value is not a finite number
     */
    set attack(value: number);
    /**
     * Gets the attack time of the dynamics compressor in seconds.
     * The attack time is the amount of time it takes for the compressor to reduce the gain
     * when the input signal exceeds the threshold.
     *
     * @type {number}
     */
    get attack(): number;
    /**
     * Sets the release time (in seconds) of the dynamics compressor.
     * @param {number} value - The release time in seconds. Must be a finite number.
     * @throws {TypeError} If the value is not a finite number.
     */
    set release(value: number);
    /**
     * Gets the release time of the dynamics compressor in seconds.
     * The release time is the amount of time it takes for the gain to return to 1 when the input level is below the threshold.
     * @returns {number} The release time in seconds.
     */
    get release(): number;
    /**
     * Sets the threshold value for the dynamics compressor.
     * @param {number} value - The threshold value in decibels. Must be a finite number.
     * @throws {TypeError} If the value is not a finite number.
     */
    set threshold(value: number);
    /**
     * Gets the threshold value in decibels of the dynamics compressor node.
     * The threshold is the decibel value above which the compression will start to take effect.
     * @returns {number} The threshold value in decibels.
     */
    get threshold(): number;
    /**
     * Sets the compression ratio of the dynamics compressor node.
     * @param {number} value - The compression ratio. Must be a finite number.
     * @throws {TypeError} If the value is not a finite number.
     */
    set ratio(value: number);
    /**
     * Gets the compression ratio of the dynamics compressor.
     * The ratio defines how much the signal is reduced above the threshold.
     * For example, a ratio of 4 means that for every 4dB the signal rises above the threshold,
     * the output will only rise by 1dB.
     * @returns {number} The compression ratio value.
     */
    get ratio(): number;
    /**
     * Sets the knee value for the dynamics compressor.
     * @param {number} value - The knee value in decibels. Must be a finite number.
     * @throws {TypeError} If the value is not a finite number.
     */
    set knee(value: number);
    /**
     * Gets the knee value of the dynamics compressor.
     * The knee property determines the transition region between the linear and logarithmic portions
     * of the compression curve.
     * @returns {number} The knee value in decibels.
     */
    get knee(): number;
    /**
     * Gets the current reduction value of the dynamics compressor node.
     * @readonly
     * @returns {number} The current reduction value in decibels.
     */
    readonly get reduction(): number;
    /**
     * Sets the pre-gain value for the dynamics compressor.
     * @param {number} value - The pre-gain value in decibels. Must be a finite number.
     * @throws {TypeError} If the value is not a finite number.
     */
    readonly set preGain(value: number);
    /**
     * Gets the current value of the pre-gain applied before compression.
     * @type {number}
     * @readonly
     */
    readonly get preGain(): number;
    /**
     * Sets the post-gain value in decibels for the compressor node.
     * Validates that the provided value is a finite number, then updates the internal post-gain state
     * and applies the corresponding linear gain to the underlying audio node.
     *
     * @param {number} value - The post-gain value in decibels to set. Must be a finite number.
     * @throws {TypeError} If the provided value is not a finite number.
     */
    readonly set postGain(value: number);
    /**
     * Gets the current value of the post-gain applied after compression.
     * @type {number}
     * @readonly
     */
    readonly get postGain(): number;
    /** @ignore */
    connect(...args: any[]): any;
    /** @ignore */
    disconnect(...args: any[]): any;
    #private;
}
//# sourceMappingURL=DynamicsCompressorNode.d.ts.map