/**
 * The MuteNode interface allows to mute a given input.
 *
 * ```
 * [input]
 *    │
 *    │ mute
 *    │
 * [output]
 * ```
 *
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {boolean} [options.active=false]
 *
 * @example
 * import {
 *   AudioContext,
 *   AudioBufferSourceNode,
 * } from 'isomorphic-web-audio-api';
 * import {
 *   AudioBufferLoader,
 *   MuteNode,
 * } from '../../src/index.js';
 *
 * // in browsers, you will need to resume on a user gesture
 * const audioContext = new AudioContext();
 * // load an audio buffer
 * const loader = new AudioBufferLoader(audioContext);
 * const buffer = await loader.load('../assets/drum-loop.wav');
 *
 * // build graph and start source
 * const mute = new MuteNode(audioContext, { active: false });
 * const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
 * src.connect(mute).connect(audioContext.destination);
 * src.start();
 *
 * // mute / unmute every seconds
 * setInterval(() => mute.active = !mute.active, 1000);
 */
export class MuteNode extends AudioNode {
    constructor(context: any, { active, }?: {
        active?: boolean;
    }, ...args: any[]);
    /**
     * Shallow `super.gain` AudioParam
     * @private
     */
    private get gain();
    set active(active: boolean);
    /**
     * Defines whether the mute is active (muted) or not (pass trough).
     *
     * @type {boolean}
     */
    get active(): boolean;
    /**
     * Activate or deactivate the `MuteNode` at given time.
     *
     * @param {boolean} active - whether the bypass is active or not
     * @param {number} when - time at which the change should be applied. In audio
     *  context current time coordinates
     */
    setActiveAtTime(active: boolean, when: number): void;
    #private;
}
//# sourceMappingURL=MuteNode.d.ts.map