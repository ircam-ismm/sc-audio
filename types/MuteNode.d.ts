/**
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {boolean} [options.active=false]
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
     * @param {boolean} active - Whether the bypass is active or not.
     * @param {number} when - Time at which the change should be applied. In audio
     *  context current time coordinates.
     */
    setActiveAtTime(active: boolean, when: number): void;
    #private;
}
//# sourceMappingURL=MuteNode.d.ts.map