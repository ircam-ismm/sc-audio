import {
  BaseAudioContext,
  GainNode,
  DynamicsCompressorNode as WebAudioDynamicsCompressorNode,
} from 'isomorphic-web-audio-api';

import {
  decibelToLinear,
  isPlainObject,
} from '@ircam/sc-utils';

const nodeName = 'DynamicsCompressorNode';

/*
 * @param {BaseAudioContext} audioContext
 * @param {Object} [options={}]
 */
export class DynamicsCompressorNode extends GainNode {

  #attack;
  #release;
  #threshold;
  #ratio;
  #knee;

  #preGain;
  #postGain;

  #context;
  // preGainNode is super (alias)
  #dynamicsCompressorNode;
  #postGainNode;

  constructor(context, {
    attack = 10e-3, // seconds, quick
    release = 250e-3, // seconds, medium
    threshold = -6, // dB
    ratio = 12, // hard (max is 20)
    knee = 30, // dB
    preGain = 0, // dB
    postGain = 0, // dB
    linearTimeConstant = 0.01, // seconds
    curveTimeConstant = 0.01, // seconds
  } = {}) {
    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError(`Failed to construct ${nodeName}: first argument is not an instance of BaseAudioContext`);
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError(`Failed to construct ${nodeName}: second argument is not an object`);
    }

    // preGainNode is super (alias)
    // instantiate before using this
    super(context, { gain: decibelToLinear(preGain) });

    this.#context = context;

    this.linearTimeConstant = linearTimeConstant;
    this.curveTimeConstant = curveTimeConstant;

    this.#postGainNode = new GainNode(this.#context, { gain: decibelToLinear(postGain) });

    this.#dynamicsCompressorNode = new WebAudioDynamicsCompressorNode(this.#context, {
      attack,
      release,
      threshold: this.#thresholdToWebAudio(threshold, knee),
      ratio,
      knee,
    });
    this.#dynamicsCompressorNode.connect(this.#postGainNode);
    this._dynamicsCompressorNode = this.#dynamicsCompressorNode;

    // preGainNode is super (alias)
    super.connect(this.#dynamicsCompressorNode);

    this.#attack = attack;
    this.#release = release;
    this.#threshold = threshold;
    this.#ratio = ratio;
    this.#knee = knee;

    this.#preGain = preGain;
    this.#postGain = postGain;
  }

  /**
   * Shallow `super.gain` AudioParam
   * @private
   */
  get gain() {
    return undefined;
  }

  set attack(value) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Failed to set attack: value is not a finite number`);
    }
    this.#attack = value;
    this.#audioParamLinearApply(this.#dynamicsCompressorNode.attack, this.#attack);
  }
  get attack() {
    return this.#attack;
  }

  set release(value) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Failed to set release: value is not a finite number`);
    }
    this.#release = value;
    this.#audioParamLinearApply(this.#dynamicsCompressorNode.release, this.#release);
  }
  get release() {
    return this.#release;
  }

  set threshold(value) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Failed to set threshold: value is not a finite number`);
    }
    this.#threshold = value;
    this.#thresholdApply();
  }
  get threshold() {
    return this.#threshold;
  }
  #thresholdToWebAudio(threshold, knee) {
    const thresholdWebAudio = threshold - knee * 0.5;
    // valid range is [-100; 0] dB
    const thresholdWebAudioLimited =
      Math.min(
        Math.max(
          thresholdWebAudio,
          -100),
        0,
      );
    return thresholdWebAudioLimited;
  }
  // apply threshold
  // on threshold or knee changes
  #thresholdApply() {
    const thresholdWebAudio = this.#thresholdToWebAudio(this.#threshold, this.#knee);
    this.#audioParamLinearApply(
      this.#dynamicsCompressorNode.threshold,
      thresholdWebAudio,
    );
  }

  set ratio(value) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Failed to set ratio: value is not a finite number`);
    }
    this.#ratio = value;
    this.#audioParamLinearApply(this.#dynamicsCompressorNode.ratio, this.#ratio);
  }
  get ratio() {
    return this.#ratio;
  }

  set knee(value) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Failed to set knee: value is not a finite number`);
    }
    this.#knee = value;
    this.#audioParamLinearApply(this.#dynamicsCompressorNode.knee, this.#knee);
    this.#thresholdApply();
  }
  get knee() {
    return this.#knee;
  }

  get reduction() {
    if (typeof this.#dynamicsCompressorNode.reduction.value !== 'undefined') {
      return this.#dynamicsCompressorNode.reduction.value;
    }

    if (typeof this.#dynamicsCompressorNode.reduction !== 'undefined') {
      return this.#dynamicsCompressorNode.reduction;
    }

    return 0;
  }

  set preGain(value) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Failed to set preGain: value is not a finite number`);
    }
    this.#preGain = value;
    this.#audioParamCurveApply(super.gain, decibelToLinear(this.#preGain));
  }
  get preGain() {
    return this.#preGain;
  }

  set postGain(value) {
    if (!Number.isFinite(value)) {
      throw new TypeError(`Failed to set postGain: value is not a finite number`);
    }
    this.#postGain = value;
    this.#audioParamCurveApply(this.#postGainNode.gain, decibelToLinear(this.#postGain));
  }
  get postGain() {
    return this.#postGain;
  }

  #audioParamCurveApply(parameter, value) {
    const now = this.#context.currentTime;
    parameter.setTargetAtTime(value, now, this.curveTimeConstant);
  }

  #audioParamLinearApply(parameter, value) {
    const now = this.#context.currentTime;
    parameter.linearRampToValueAtTime(value, now + this.linearTimeConstant);
  }

  /** @ignore */
  connect(...args) {
    return this.#postGainNode.connect(...args);
  }

  /** @ignore */
  disconnect(...args) {
    return this.#postGainNode.disconnect(...args);
  }

}
