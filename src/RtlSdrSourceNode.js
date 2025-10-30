import {
  Demodulator
} from '@jtarrio/webrtlsdr/demod/demodulator.js';
import {
  Radio
} from '@jtarrio/webrtlsdr/radio.js';
import {
  getMode,
  // getSchemes,
  // modeParameters,
} from "@jtarrio/webrtlsdr/demod/modes.js";
import {
  RTL2832U_Provider,
  DirectSampling,
} from '@jtarrio/webrtlsdr/rtlsdr.js';
import {
  isPlainObject,
} from '@ircam/sc-utils';
import {
  AudioBuffer,
  AudioBufferSourceNode,
  BaseAudioContext,
  GainNode,
  // AudioContext
} from 'isomorphic-web-audio-api';
import {
  ensureWebUSB
} from '#ensure-webusb.js'

// values picked from base class
const DEFAULT_BUFFERING_DURATION = 0.05;
const STR_LDR_STREAM_SAMPLE_RATE = 48000;

export class RtlSdrSourceNode extends GainNode {
  #stream;

  constructor(context, {
    stream
  } = {}) {
    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError(`Failed to construct 'RtlSdrSourceNode': Argument 1 is not an instance of BaseAudioContext`);
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError(`Failed to construct 'RtlSdrSourceNode': Argument 2 is not an object`);
    }

    if (!(stream instanceof RtlSdrStream)) {
      throw new TypeError(`Failed to construct 'RtlSdrSourceNode': 'stream' option is not an instance of RtlSdrStream`);
    }

    super(context, { gain: 0 });
    this.#stream = stream;
  }

  // shadow super.gain audio param
  get gain() {
    return undefined;
  }

  #process = (bufferStartTime, buffer) => {
    // @note - buffer duration is ~50ms, any possibilities to reduce that?
    // @todo - support modifying detune and playbackRate
    const src = new AudioBufferSourceNode(this.context, { buffer });
    src.connect(this.context.destination);
    src.start(bufferStartTime);
  }

  start(startTime = this.context.currentTime) {
    // @todo - make sure we can't start a source twice for consistency w/ regular web audio sources
    this.#stream.addProcessor(this.#process);
    super.gain.setValueAtTime(1, startTime);
  }

  stop(stopTime) {
    super.gain.setValueAtTime(0, stopTime);
    // context.currentTime can be one block ahead of time, then we add a block duration for safety
    const dt = stopTime - this.context.currentTime + (128 / this.context.sampleRate);
    setTimeout(() => this.#stream.deleteProcessor(this.#process), dt * 1000);
  }

  // delegate connect / disconnect to `super`
}

export class RtlSdrStream {
  #context;
  #streamDispatcher;
  #demodulator;
  #readyPromise;
  #radio;

  constructor(context, {
    bufferingDuration = DEFAULT_BUFFERING_DURATION, // room for buffering, see if we can lower it safely
    provider = new RTL2832U_Provider(), // actual hardware?
    hfSampleRate = 1.8e6,
    hardwareFrequency = 91.7e6,
    frequencyOffset = 0,
    hfGain = null, // AGC
    frequencyCorrection = 0, // le crystal là // ???
    filterWidth = 150e6, // change only on NBFM, AM, SSB, and CW
    demodulationMode = 'WBFM',
  } = {}) {
    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError(`Failed to construct 'RtlSdrStream': Argument 1 is not an instance of BaseAudioContext`);
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError(`Failed to construct 'RtlSdrStream': Argument 2 is not an object`);
    }

    // @todo - check / sanitize the arguments

    this.#context = context;

    const {
      promise,
      resolve,
    } = Promise.withResolvers();

    this.#readyPromise = promise;
    this.#streamDispatcher = new StreamDispatcher(
      this.#context, // we need this for timing reasons
      bufferingDuration,
      resolve, // make sure we resolve `start` when we actually have something to play
    );

    this.#demodulator = new Demodulator(this.#streamDispatcher);
    this.#radio = new Radio(provider, this.#demodulator);

    this.#radio.setFrequency(hardwareFrequency);
    this.#radio.setDirectSamplingMethod(DirectSampling.Off);
    this.#radio.setFrequencyCorrection(frequencyCorrection);
    this.#radio.setGain(hfGain);
    this.#radio.setSampleRate(hfSampleRate);

    this.#demodulator.setFrequencyOffset(frequencyOffset);
    this.#demodulator.setMode(this.#demodulator.getMode(demodulationMode));

    // @todo
    // this.#demodulator.setVolume(1);
  }

  async start() {
    // @note - looks ok to have this here
    // - ensure window.navigator.usb exists in browsers
    // - monkey patch globalThis with webusb in node.js
    await ensureWebUSB();
    this.#radio.start();

    return this.#readyPromise;
  }

  async stop() {
    this.#radio.stop();
  }

  addProcessor(processor) {
    this.#streamDispatcher.processors.add(processor);
  }

  deleteProcessor(processor) {
    this.#streamDispatcher.processors.delete(processor);
  }

  get context() {
    return this.#context;
  }

  // get hfSampleRate() {
  //   return this.#radio.getSampleRate();
  // }

  // get hardwareFrequency() {
  //   return this.#radio.getFrequency();
  // }

  // set hardwareFrequency(frequency) {
  //   this.#radio.setFrequency(frequency);
  // }

  // get frequencyCorrection() {
  //   return this.#radio.getFrequencyCorrection();
  // }

  // set frequencyCorrection(frequencyCorrection) {
  //   this.#radio.setFrequencyCorrection(frequencyCorrection);
  // }

  // get hfGain() {
  //   return this.#radio.getGain();
  // }

  // set hfGain(gain) {
  //   this.#radio.setGain(gain);
  // }

  // get frequencyOffset() {
  //   return this.#demodulator.getFrequencyOffset();
  // }

  // set frequencyOffset(frequencyOffset) {
  //   this.#demodulator.setFrequencyOffset(frequencyOffset);
  // }

  // get demodulationMode() {
  //   return this.#demodulator.getMode().scheme;
  // }

  // set demodulationMode(mode) {
  //   this.#demodulator.setMode(getMode(mode));
  // }
}

class StreamDispatcher {
  #processors = new Set();
  #bufferStartTime = -1;
  #bufferingDuration;
  #context;
  #readyResolver;
  #readyResolverTriggered = false;

  constructor(context, bufferingDuration, readyResolver) {
    this.#context = context;
    this.#bufferingDuration = bufferingDuration;
    this.#readyResolver = readyResolver;
  }

  get processors() {
    return this.#processors;
  }

  // seems to be called somewhere
  setVolume(volume) {}
  getVolume() {}

  get sampleRate() {
    return this.#context.sampleRate;
  }

  play(leftSamples, rightSamples) {
    const now = this.#context.currentTime;
    const bufferDuration = leftSamples.length / STR_LDR_STREAM_SAMPLE_RATE;

    this.#bufferStartTime = Math.max(
      this.#bufferStartTime + bufferDuration,
      now + this.#bufferingDuration
    );

    if (leftSamples.length > 0 && this.#processors.size > 0) {
      // create buffer from left / right channels
      const buffer = new AudioBuffer({
        numberOfChannels: 2,
        length: leftSamples.length,
        sampleRate: STR_LDR_STREAM_SAMPLE_RATE,
      });
      buffer.copyToChannel(leftSamples, 0);
      buffer.copyToChannel(rightSamples, 1);
      // propagate timing infos and audio buffer to `RtlSdrSourceNode`s
      this.#processors.forEach(processor => processor(this.#bufferStartTime, buffer));
    }

    // @todo - this may not behave as expected if radio is re-started after a stop
    if (!this.#readyResolverTriggered) {
      // context.currentTime can be one block ahead of time, then we add a block duration for safety
      const dt = this.#bufferStartTime - now + (128 / this.#context.sampleRate);
      setTimeout(this.#readyResolver, dt * 1000);
      this.#readyResolverTriggered = true;
    }
  }
}
