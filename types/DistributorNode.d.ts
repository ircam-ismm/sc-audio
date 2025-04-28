/**
 * The `DistributorNode` interface allows to distribute an input between two output.
 *
 * It can be used for example to create dry / wet controls.
 *
 * ```
 *         [input]
 *            │
 *            │ ratio
 *     ┌──────┴─────┐
 *     │            │
 * [output 0]   [output 1]
 * ```
 *
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {boolean} [options.ratio=0] - Initial ratio
 * @param {number[]} [options.curve=null] - Curve to apply for the transition.
 *  Defaults to equal power curve.
 *
 * @example
 * import {
 *   AudioContext,
 *   AudioBufferSourceNode,
 *   ConvolverNode,
 * } from 'isomorphic-web-audio-api';
 * import {
 *   AudioBufferLoader,
 *   DistributorNode,
 * } from '@ircam/sc-audio';
 *
 * // in browsers, you will need to resume on a user gesture
 * const audioContext = new AudioContext();
 * // load an audio buffer
 * const loader = new AudioBufferLoader(audioContext);
 * const ir = await loader.load('../assets/parking-garage-response.wav');
 * const buffer = await loader.load('../assets/drum-loop.wav');
 *
 * // create the graph
 * const convolver = new ConvolverNode(audioContext, { buffer: ir });
 * convolver.connect(audioContext.destination);
 *
 * const dryWet = new DistributorNode(audioContext);
 * // connect dry output (0) to destination
 * dryWet.connect(audioContext.destination, 0);
 * // connect wet output (1) to convolver
 * dryWet.connect(convolver, 1);
 *
 * // pipe a source in the graph
 * const src = new AudioBufferSourceNode(audioContext, { buffer, loop: true });
 * src.connect(dryWet);
 * src.start();
 *
 * // ramp from dry to wet in 4 seconds, then back to dry
 * dryWet.ratio.setValueAtTime(0, audioContext.currentTime);
 * dryWet.ratio.linearRampToValueAtTime(1, audioContext.currentTime + buffer.duration);
 * dryWet.ratio.exponentialRampToValueAtTime(0.001, audioContext.currentTime + buffer.duration * 2);
 */
export class DistributorNode extends AudioNode {
    constructor(context: any, { ratio, curve }?: {
        ratio?: number;
        curve?: Float32Array<ArrayBuffer>;
    }, ...args: any[]);
    /** @private */
    private get gain();
    /**
     * Amount of incoming signal to route between the two outputs:
     * - a ratio of 0 is routed to output 0
     * - a ratio of 1 is routed to output 1
     * @type AudioParam
     */
    get ratio(): AudioParam;
    /** @ignore */
    connect(destination: any, output?: number, input?: number, ...args: any[]): void;
    /** @ignore */
    disconnect(...args: any[]): void;
    #private;
}
//# sourceMappingURL=DistributorNode.d.ts.map