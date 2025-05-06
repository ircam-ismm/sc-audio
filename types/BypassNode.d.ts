/**
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {boolean} [options.active=false]
 */
export class BypassNode extends AudioNode {
    constructor(context: any, { active, }?: {
        active?: boolean;
    }, ...args: any[]);
    /**
     * Shallow `super.gain` AudioParam
     * @private
     */
    private get gain();
    /**
     * Node to connect to the input of the sub graph
     *
     * @type {GainNode}
     * @example
     * const bypass = new Bypass(audioContext, { active: false });
     * const filter = new BiquadFilterNode(audioContext);
     * bypass.subGraphInput.connect(filter).connect(bypass.subGraphOutput);
     */
    get subGraphInput(): GainNode;
    /**
     * Node to connect to the input of the sub graph
     *
     * @type {GainNode}
     * @example
     * const bypass = new Bypass(audioContext, { active: false });
     * const filter = new BiquadFilterNode(audioContext);
     * bypass.subGraphInput.connect(filter).connect(bypass.subGraphOutput);
     */
    get subGraphOutput(): GainNode;
    set active(active: boolean);
    /**
     * Defines if the Bypass is active, i.e. if true the signal doesn't pass through
     * the sub graph and flows directly to the output.
     *
     * @type {boolean}
     */
    get active(): boolean;
    /**
     * Activate or deactivate the `BypassNode` at given time.
     *
     * @param {boolean} active - whether the bypass is active or not
     * @param {number} when - time at which the change should be applied. In audio
     *  context current time coordinates
     */
    setActiveAtTime(active: boolean, when: number): void;
    /** @ignore */
    connect(...args: any[]): any;
    /** @ignore */
    disconnect(...args: any[]): any;
    #private;
}
//# sourceMappingURL=BypassNode.d.ts.map