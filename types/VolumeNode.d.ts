/**
 * The VolumeNode interface represents a change in volume controlled in dB.
 *
 * ```
 * [input]
 *    │
 *    │ control volume in dB
 *    │
 * [output]
 *
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {number} [options.volume=0]
 * @param {number} [options.min=-80]
 * @param {number} [options.max=-80]
 * @param {number} [options.curve=null]
 *
 * @example
 * import {
 *   AudioContext,
 *   AudioBufferSourceNode,
 * } from 'isomorphic-web-audio-api';
 * import {
 *   AudioBufferLoader,
 *   VolumeNode,
 * } from '@ircam/sc-audio';
 *
 * // in browsers, you will need to resume on a user gesture
 * const audioContext = new AudioContext();
 * // load an audio buffer
 * const loader = new AudioBufferLoader(audioContext);
 * const buffer = await loader.load('../assets/drum-loop.wav');
 *
 * // build graph and start source
 * const fader = new VolumeNode(audioContext);
 * const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
 * src.connect(fader).connect(audioContext.destination);
 *
 * // start source and ramp from -60 to 0 dB
 * const now = audioContext.currentTime;
 * src.start(now);
 * fader.volume.setValueAtTime(-60, now);
 * fader.volume.linearRampToValueAtTime(0, now + buffer.duration);
 */
export class VolumeNode extends AudioNode {
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
     * Minimum value of the volume in dB.
     * @type number
     */
    get min(): number;
    /**
     * Maximum value of the volume in dB.
     * @type number
     */
    get max(): number;
    /**
     * Curve used to map from db to linear gain.
     *
     * Note that the returned sequence value is a copy of the actual curve used, then
     * modifying the returned value won't affect the audio computation.
     *
     * @type Float32Array
     */
    get curve(): Float32Array;
    /**
     * Represents the amount of gain in decibels to apply.
     * @type AudioParam
     */
    get volume(): AudioParam;
    #private;
}
//# sourceMappingURL=VolumeNode.d.ts.map