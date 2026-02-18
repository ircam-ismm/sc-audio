import {
  Radio, RtlProvider
} from '@jtarrio/webrtlsdr/radio.js';
import {
  Demodulator
} from '@jtarrio/signals/demod/demodulator.js';
import {
  RTL2832U_Provider
} from '@jtarrio/webrtlsdr/rtlsdr.js';
import {
  getMode,
  modeParameters
} from "@jtarrio/signals/demod/modes.js";
import {
  ensureWebUSB
} from '#ensure-webusb.js'
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


// values picked from base class
// const DEFAULT_BUFFERING_DURATION = 0.05;
// const STR_LDR_STREAM_SAMPLE_RATE = 48000;

export class RtlSdrSourceNode extends GainNode {
  #stream;
  #detune;

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

  // set detune(value) {
  //   this.#detune = value;
  // }

  #process = (bufferStartTime, buffer) => {
    const offset =  this.startTime > bufferStartTime
      ? this.startTime - bufferStartTime
      : 0;

    // @note - buffer duration is ~50ms, any possibilities to reduce that?
    // @todo - support modifying detune and playbackRate
    const src = new AudioBufferSourceNode(this.context, { buffer });
    // src.playbackRate.value = 0.1;

    src.connect(this);
    src.start(bufferStartTime, offset);

    // console.log(bufferStartTime, offset);
  }

  start(startTime = this.context.currentTime) {
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
  #provider;
  #params;

  constructor(context, {
    hardwareFrequency = 91.7e6,
    provider = new RtlProvider(new RTL2832U_Provider({webusb: webusb})), // actual hardware?
    hfGain = null, // AGC
    stereo = false,
    downsamplerTaps = 151, /** Number of taps for the downsampler filter. Must be an odd number. 151 by default. */
    rfTaps = 151, /** Number of taps for the RF filter. Must be an odd number. 151 by default. */
    audioTaps = 41, /** Number of taps for the audio filter. Must be an odd number. 41 by default. */
    buffersPerSecond = 20 // don't change for now
  } = {}) {

    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError(`Failed to construct 'RtlSdrStream': Argument 1 is not an instance of BaseAudioContext`);
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError(`Failed to construct 'RtlSdrStream': Argument 2 is not an object`);
    }

    this.#context = context;

    const {
      promise, // Promise
      resolve, // Function
    } = Promise.withResolvers();

    this.#readyPromise = promise;
    this.#streamDispatcher = new StreamDispatcher(
      this.#context, // we need this for timing reasons
      bufferingDuration, // un truc de benjamin
      resolve, // make sure we resolve `start` when we actually have something to play
    );

    this.#demodulator = new Demodulator({
      modeOption: {
        downsamplerTaps,
        rfTaps,
        audioTaps
      },
      player: this.#streamDispatcher
    });


    const usb = await ensureWebUSB();
    if (usb) {
      this.#provider = new RtlProvider(new RTL2832U_Provider({webusb: usb}));
    } else {
      this.#provider = new RtlProvider(new RTL2832U_Provider());
    };


    this.#radio = new Radio(this.#provider, this.#demodulator, { buffersPerSecond });

    this.#radio.setFrequency(hardwareFrequency);
    this.#radio.setGain(hfGain);

    this.#params = modeParameters(this.#demodulator.getMode());
    this.#params.setStereo(stereo);
    this.#demodulator.setMode(this.#params.mode);
    this.#demodulator.setVolume(1);

    console.log("radio stream created");

  }

  async start() {
    this.#radio.start();

    return this.#readyPromise;
  }

  async stop() {
    this.#radio.stop();
  }

  addProcessor(processor) {
    this.#streamDispatcher.addProcessor(processor);
  }

  deleteProcessor(processor) {
    this.#streamDispatcher.deleteProcessor(processor);
  }

  get context() {
    return this.#context;
  }

  get hardwareFrequency() {
    return this.#radio.getFrequency();
  }

  set hardwareFrequency(frequency) {
    this.#radio.setFrequency(frequency);
  }

  set gain(gain) {
    this.#radio.setGain(gain);
  }

  get stereo() {
    return this.#params.mode.stereo;
  }

  set stereo(stereo) {
    this.#params.setStereo(stereo);
    this.#demodulator.setMode(this.#params.mode);
  }

}
// on en est là!!!
// à vérifier #process
class StreamDispatcher {
  #processors = new Set();
  // #bufferStartTime = -1;
  #bufferStartTime = null;
  #bufferCurrentTime;
  #bufferCount = 0;
  #bufferingDuration;
  #context;
  #readyResolver;
  #readyResolverTriggered = false;

  #currentBuffer;

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

  addProcessor(processor) {
    this.#processors.add(processor);
    processor(this.#bufferStartTime, this.#currentBuffer)
  }
  deleteProcessor(processor) {
    this.#processors.delete(processor);
  }

  play(leftSamples, rightSamples) {
    const now = this.#context.currentTime;
    const bufferDuration = leftSamples.length / STR_LDR_STREAM_SAMPLE_RATE;

    if (this.#bufferStartTime === null) {
      this.#bufferStartTime = now + this.#bufferingDuration;
    }

    this.#bufferCurrentTime = this.#bufferStartTime + (this.#bufferCount * bufferDuration);
    this.#bufferCount += 1;

    // this.#bufferStartTime = Math.max(
    //   this.#bufferStartTime + bufferDuration, // 
    //   now + this.#bufferingDuration
    // );

    const buffer = new AudioBuffer({
      numberOfChannels: 2,
      length: leftSamples.length,
      sampleRate: STR_LDR_STREAM_SAMPLE_RATE,
    });

    buffer.copyToChannel(leftSamples, 0);
    buffer.copyToChannel(rightSamples, 1);

    this.#currentBuffer = buffer;
    // propagate timing infos and audio buffer to `RtlSdrSourceNode`s
    this.#processors.forEach(processor => processor(this.#bufferCurrentTime, buffer));

    // @todo - this may not behave as expected if radio is re-started after a stop
    if (!this.#readyResolverTriggered) {
      // context.currentTime can be one block ahead of time, then we add a block duration for safety
      const dt = this.#bufferStartTime - now + (512 / this.#context.sampleRate);
      setTimeout(this.#readyResolver, dt * 1000);
      this.#readyResolverTriggered = true;
    }
  }

// from Suzanne computer
 // play(leftSamples, rightSamples) {
 //    const now = this.#context.currentTime;
 //    const bufferDuration = leftSamples.length / STR_LDR_STREAM_SAMPLE_RATE;

 //    if (this.#bufferStartTime === null) {
 //      this.#bufferStartTime = now + this.#bufferingDuration;
 //    }

 //    this.#bufferCurrentTime = this.#bufferStartTime + (this.#bufferCount * bufferDuration);
 //    this.#bufferCount += 1;

 //    // this.#bufferStartTime = Math.max(
 //    //   this.#bufferStartTime + bufferDuration, //
 //    //   now + this.#bufferingDuration
 //    // );

 //    const buffer = new AudioBuffer({
 //      numberOfChannels: 2,
 //      length: leftSamples.length,
 //      sampleRate: STR_LDR_STREAM_SAMPLE_RATE,
 //    });

 //    buffer.getChannelData(0).set(leftSamples);
 //    buffer.getChannelData(1).set(rightSamples);

 //    // buffer.copyToChannel(leftSamples, 0);
 //    // buffer.copyToChannel(rightSamples, 1);

 //    this.#currentBuffer = buffer;
 //    // propagate timing infos and audio buffer to `RtlSdrSourceNode`s
 //    this.#processors.forEach(processor => processor(this.#bufferCurrentTime, buffer));

 //    // @todo - this may not behave as expected if radio is re-started after a stop
 //    if (!this.#readyResolverTriggered) {
 //      // context.currentTime can be one block ahead of time, then we add a block duration for safety
 //      const dt = this.#bufferStartTime - now + (512 / this.#context.sampleRate);
 //      setTimeout(this.#readyResolver, dt * 1000);
 //      this.#readyResolverTriggered = true;
 //    }
 //  }


}
