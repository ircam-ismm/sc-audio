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
import { AudioPlayer } from "@jtarrio/signals/players/audioplayer.js";
import {
  ensureWebUSB
} from '#ensure-webusb.js'
import {
  isPlainObject,
  isBrowser,
} from '@ircam/sc-utils';
import {
  AudioBuffer,
  AudioBufferSourceNode,
  BaseAudioContext,
  GainNode,
  // AudioContext
} from 'isomorphic-web-audio-api';

let webusb

if (!isBrowser()) {
  const mod = await import('usb');
  webusb = mod.webusb;
} else {
  if (!navigator.usb) {
    throw new Error(`Your browser does not support web USB API`);
  }

  webusb = navigator.usb;
}

// à cleaner
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

// à cleaner, passer tous les attributs en privé + getters et setters
export class RtlSdrStream {
  // #radio;
  // #demodulator;

  // #readyPromise;
  #context;
  // #params;


  constructor(context, {
    hardwareFrequency = 91.7e6,
    stereo = false,
    bufferingDuration = 0.05,
  }) {
    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError(`Failed to construct 'RtlSdrStream': Argument 1 is not an instance of BaseAudioContext`);
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError(`Failed to construct 'RtlSdrStream': Argument 2 is not an object`);
    }

    this.#context = context; // getter only / readonly
    this.hardwareFrequency = hardwareFrequency; // set is used for type checking
    this.stereo = stereo; // set is used for type checking
    // this.demodOutRate = 48000;
    // this.bufferingDuration = 0.05;

    this.buffersPerSecond = 100;
    this.streamDispatcher = new StreamDispatcher(this.#context, bufferingDuration);

    this.demodulator = new Demodulator({
      modeOption: {
        deemphasizerTc: 50,
        /** Number of taps for the downsampler filter. Must be an odd number. 151 by default. */
        downsamplerTaps: 151,
        /** Number of taps for the RF filter. Must be an odd number. 151 by default. */
        rfTaps: 151,
        /** Number of taps for the audio filter. Must be an odd number. 41 by default. */
        audioTaps: 41
      },
      player: this.streamDispatcher,
    });

    this.provider = new RtlProvider(new RTL2832U_Provider({ webusb }));

    this.params = modeParameters(this.demodulator.getMode());
    this.params.setStereo(this.stereo);

    this.demodulator.setMode(this.params.mode);
    this.demodulator.setVolume(1);

    this.radio = new Radio(this.provider, this.demodulator, { buffersPerSecond: this.buffersPerSecond });
    this.radio.setFrequency(this.hardwareFrequency);
    this.radio.setGain(null);

    // this.radio.start();

  }

  async start() {
    console.log("stream started")
    const {
      promise, // Promise
      resolve, // Function
    } = Promise.withResolvers();

    this.streamDispatcher.init(resolve);
    this.radio.start();

    return promise;
  }

  async stop() {
    this.radio.stop();
  }

  addProcessor(processor) {
    this.streamDispatcher.addProcessor(processor);
  }

  deleteProcessor(processor) {
    this.streamDispatcher.deleteProcessor(processor);
  }
}

const DEMOD_OUT_RATE = 48000;

class StreamDispatcher {
  constructor(audioContext, bufferingDuration) {
    this.audioContext = audioContext;
    this.bufferingDuration = bufferingDuration;
    this.processors = new Set();
    this.readyResolver;
    this.readyResolverTriggered = false;
    this.lastPlayedAt = -Infinity;
    this.currentBuffer = null;
  }

  // ------------------------------------------
  // required method for custom player
  setVolume(volume) {}
  getVolume() {}
  get sampleRate() {
    return DEMOD_OUT_RATE;
  }
  // ------------------------------------------

  addProcessor(processor) {
    this.processors.add(processor);
    processor(this.lastPlayedAt, this.currentBuffer);
  }

  deleteProcessor(processor) {
    this.processors.delete(processor);
  }

  init(readyResolver) {
    this.lastPlayedAt = -Infinity;
    this.currentBuffer = null;
    this.readyResolverTriggered = false;
    this.bufferCounter = 0;

    this.readyResolver = readyResolver;
  }

  play(leftSamples, rightSamples) {
    try {
      const bufferSize = leftSamples.length;
      const bufferDuration = bufferSize / DEMOD_OUT_RATE;
      console.log(bufferDuration);

// @todo implémenter avec un compteur pour éviter les erreurs de float
      // this.lastPlayerAt = Math.max(this.bufferCounter * bufferDuration)
      // this.bufferCounter += 1;

      this.lastPlayedAt = Math.max(this.lastPlayedAt + bufferDuration, this.audioContext.currentTime + this.bufferingDuration);
      
      this.currentBuffer = new AudioBuffer({
        numberOfChannels: 2,
        length: bufferSize,
        sampleRate: DEMOD_OUT_RATE,
      });
      
      this.currentBuffer.copyToChannel(leftSamples, 0);
      this.currentBuffer.copyToChannel(rightSamples, 1);

      // propagate timing infos and audio buffer to `RtlSdrSourceNode`s
      this.processors.forEach(processor => processor(this.lastPlayedAt, this.currentBuffer));

      if (!this.readyResolverTriggered) {
        // context.currentTime can be one block ahead of time, then we add a block duration for safety
        const dt = this.bufferingDuration + (128 / this.audioContext.sampleRate);
        setTimeout(this.readyResolver, dt * 1000);
        this.readyResolverTriggered = true;
      }
    } catch (err) {
      console.log(err.message);
    }
  }
}
