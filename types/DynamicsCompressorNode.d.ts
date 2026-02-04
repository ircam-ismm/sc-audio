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
    set attack(value: number);
    get attack(): number;
    set release(value: number);
    get release(): number;
    set threshold(value: number);
    get threshold(): number;
    set ratio(value: any);
    set knee(value: number);
    get knee(): number;
    get reduction(): any;
    set preGain(value: number);
    get preGain(): number;
    set postGain(value: number);
    get postGain(): number;
    /** @ignore */
    connect(...args: any[]): any;
    /** @ignore */
    disconnect(...args: any[]): any;
    #private;
}
//# sourceMappingURL=DynamicsCompressorNode.d.ts.map