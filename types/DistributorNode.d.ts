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
 * @extends GainNode
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
 * } from '../../src/index.js';
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
export class DistributorNode {
    constructor(context: any, { ratio, curve }?: {
        ratio?: number;
        curve?: Float32Array<ArrayBuffer>;
    }, ...args: any[]);
    get numberOfOutputs(): number;
    get ratio(): any;
    /** @inheritdoc */
    connect(destination: any, output?: number, input?: number, ...args: any[]): void;
    /** @inheritdoc */
    disconnect(...args: any[]): void;
    #private;
}
//# sourceMappingURL=DistributorNode.d.ts.map