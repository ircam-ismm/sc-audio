export class MuteNode {
    constructor(context: any, { active, }?: {
        active?: boolean;
    }, ...args: any[]);
    /**
     * Shallow `super.gain` AudioParam
     * @private
     */
    private get gain();
    set active(value: any);
    /**
     * Defines wether the mute is active (muted) or not (pass trough).
     */
    get active(): any;
    #private;
}
//# sourceMappingURL=MuteNode.d.ts.map