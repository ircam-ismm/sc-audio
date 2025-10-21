import { AudioPlayer } from "@jtarrio/webrtlsdr/players/audioplayer.js";
import { Demodulator } from "@jtarrio/webrtlsdr/demod/demodulator.js";
import { Radio } from "@jtarrio/webrtlsdr/radio.js";
import { RTL2832U_Provider } from "@jtarrio/webrtlsdr/rtlsdr.js";
import { BaseAudioContext, GainNode } from 'isomorphic-web-audio-api';


export class RtlSdrSourceNode extends GainNode {
  #stream;

  constructor(context, {
    stream
  } = {}) {
    super(context, { gain: 0 });

    this.#stream = stream;
  }

  start(startTime) {
    this.#stream.addOutput(this);
    super.setValueAtTime(1, startTime);
  }

  stop(stopTime) {
    super.setValueAtTime(0, stopTime);

    const dt = stopTime - audioContext.currentTime;
    setTimeout(() => {
      this.#stream.removeOutput(this);
    }, dt * 1000);
  }
}



export class createRtlSdrStream {
  #context;
  #theirPlayer;
  #demodulator;
  #readyPromise;
  #output;
  #radio;

  constructor({
    context = null,
    hfSampleRate = 1.8e6,
    hardwareFrequency = 91.7e6,
    frequencyOffset = 0,
    hfGain = null, // AGC
    frequencyCorrection = 0, // le crystal là
    filterWidth = 150e6, // change only on NBFM, AM, SSB, and CW
    demodulationMode = "WBFM"
  } = {}) {
    if (!(context instanceof BaseAudioContext)) {
      throw new TypeError(`Failed to construct 'RtlSdrSourceNode': Argument 1 is not an instance of BaseAudioContext`);
    }

    if (arguments[1] !== undefined && !isPlainObject(arguments[1])) {
      throw new TypeError(`Failed to construct 'RtlSdrSourceNode': Argument 2 is not an object`);
    }

    this.#context = context;

    this.#readyPromise = Promise.withResolvers();
    this.#theirPlayer = new TheirPlayer(this.#context, this.#output, this.#readyPromise);
    this.#demodulator = new Demodulator(this.#theirPlayer);
    this.#radio = new Radio(new RTL2832U_Provider(), this.#demodulator);

    this.#radio.setSampleRate(hfSampleRate);
    this.#radio.setFrequency(hardwareFrequency);
    this.#radio.setFrequencyCorrection(frequencyCorrection);
    this.#radio.setGain(hfGain);

    this.#demodulator.setFrequencyOffset(frequencyOffset);
    this.#demodulator.setMode(this.#demodulator.getMode(demodulationMode));
    // à faire un peu plus tard...
    // this.#demodulator.setVolume(1);

  }

  get context() {
    return this.#context;
  }

  get hfSampleRate() {
    return this.#radio.getSampleRate();
  }

  get hardwareFrequency() {
    return this.#radio.getFrequency();
  } 

  get frequencyCorrection() {
    return this.#radio.getFrequencyCorrection();
  }

  get hfGain() {
    return this.#radio.getGain();
  }

  get frequencyOffset() {
    return this.#demodulator.getFrequencyOffset();
  }

  get demodulationMode() {
    return this.#demodulator.getMode().scheme;
  }

  set hardwareFrequency(frequency) {
    this.#radio.setFrequency(frequency);
  }

  set frequencyCorrection(frequencyCorrection) {
    this.#radio.setFrequencyCorrection(frequencyCorrection);
  }

  set hfGain(gain) {
    this.#radio.setGain(gain);
  }

  set frequencyOffset(frequencyOffset) {
    this.#demodulator.setFrequencyOffset(frequencyOffset);
  }

  set demodulationMode(mode) {
    this.#demodulator.setMode(getMode(mode));
  }

  start() {
    this.#radio.start()
  }

  stop() {
    this.#radio.stop()
  }

  // set context(value) {

  // }

  addOutput(node) {
    this.#theirPlayer.outputs.add(node);
  }

  removeOutput(node) {
    this.#theirPlayer.outputs.delete(node);
  }
}

class TheirPlayer {
  #lastPlayedAt = -1;
  // hard-coded from base player...
  static OUT_RATE = 48000;
  static TIME_BUFFER = 0.05;

  constructor(context, output, readyPromise) {
    this.context = context;
    this.outputs = new Set();
    this.readyPromise = readyPromise;
    this.started = false;
  }

  play(left, right) {
    if (this.outputs.size === 0) {
      return;
    }

    const buffer = this.context.createBuffer(
      2,
      leftSamples.length,
      TheirPlayer.OUT_RATE
    );

    buffer.copyToChannel(0, leftSamples);
    buffer.copyToChannel(1, rightSamples);

    const source = new AudioBufferSourceNode(this.context, { buffer });
    this.outputs.forEach(output => source.connect(output));

    this.#lastPlayedAt = Math.max(
      this.#lastPlayedAt + buffer.duration,
      this.context.currentTime + TheirPlayer.TIME_BUFFER
    );

    source.start(this.#lastPlayedAt);

    if (!this.started) {
      const buffer = this.context.createBuffer(
        1, 1, this.context.sampleRate
      );
      
      const src = new AudioBufferSourceNode(this.context, { buffer });
      src.connect(this.context.destination);
      src.addEventListener('ended', () => {
        this.readyPromise.resolve();
      });
      src.start(this.#lastPlayedAt);

      this.started = true;
    }
  }

}
