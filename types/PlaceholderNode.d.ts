/**
 * @extends AudioNode
 * @param {BaseAudioContext} context
 * @param {Object} [options={}]
 * @param {AudioNode} [options.node=null]
 */
export class PlaceholderNode {
    constructor(context: any, { node, }?: {
        node?: any;
    }, ...args: any[]);
    set node(node: AudioNode);
    /**
     * Wrapped AudioNode
     * @type {AudioNode}
     */
    get node(): AudioNode;
    /** @private */
    private get gain();
    /**
     * Replace the wrapped AudioNode at given time.
     *
     * <i>Note that using this method in an wrong order according to the timeline will result in undefined behavior, e.g.:</i>
     * ```js
     * wrapper.setNodeAtTime(node1, audioContext.currentTime + 2);
     * wrapper.setNodeAtTime(node2, audioContext.currentTime + 1);
     * ```
     *
     * @param {AudioNode} node - AudioNode to be wrapped.
     * @param {number} when - Time at which the change should be applied. In audio
     *  context current time coordinates.
     */
    setNodeAtTime(node: AudioNode, when: number): void;
    /** @ignore */
    connect(...args: any[]): any;
    /** @ignore */
    disconnect(...args: any[]): any;
    #private;
}
//# sourceMappingURL=PlaceholderNode.d.ts.map