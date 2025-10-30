import { assert } from 'chai';
import {
  OfflineAudioContext,
  ConstantSourceNode,
  AudioBuffer,
  AudioBufferSourceNode,
} from 'isomorphic-web-audio-api';
import { decibelToLinear } from '@ircam/sc-utils';
import { VolumeNode } from '../src/index.js';
import { DEFAULT_WAVETABLE_SIZE } from '../src/utils.js';

const audioContextOptions = { length: 256, numberOfChannels: 1, sampleRate: 48000 };

describe('# VolumeNode', () => {
  describe('## interface', () => {
    it('should expose `min` option', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new VolumeNode(audioContext, { min: -20 });
      assert.equal(node.min, -20);
    });

    it('should expose `max` option', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new VolumeNode(audioContext, { max: 20 });
      assert.equal(node.max, 20);
    });
  });

  describe('## process', () => {
    const testValues = [12, 6, 3, 0, -3, -6, -10, -20, -40, -80];

    for (let volume of testValues) {
      it(`should properly apply gain from volume value: ${volume}`, async () => {
        const audioContext = new OfflineAudioContext(audioContextOptions);
        const fader = new VolumeNode(audioContext, { volume });
        const source = new ConstantSourceNode(audioContext, { offset: 1 });
        source.connect(fader).connect(audioContext.destination);
        source.start();

        const buffer = await audioContext.startRendering();
        const result = buffer.getChannelData(0);
        const expected = new Float32Array(result.length).fill(decibelToLinear(volume));

        for (let i = 0; i < result.length; i++) {
          assert.approximately(result[i], expected[i], 1e-5);
        }
      });
    }

    it('should compute curve and apply gain according to given min and max', async () => {
      const min = -6;
      const max = 0;
      const audioContext = new OfflineAudioContext({
        ...audioContextOptions,
        length: DEFAULT_WAVETABLE_SIZE,
      });
      const volume = new VolumeNode(audioContext, { min, max });

      const source = new ConstantSourceNode(audioContext, { offset: 1 });

      const controlChannel = new Float32Array(DEFAULT_WAVETABLE_SIZE);
      // populate controlChannel with values in dB
      for (let i = 0; i < controlChannel.length; i++) {
        const db = i / (controlChannel.length - 1) * (max - min) + min;
        controlChannel[i] = db;
      }

      const controlBuffer = new AudioBuffer({
        length: DEFAULT_WAVETABLE_SIZE,
        numberOfChannels: 1,
        sampleRate: audioContext.sampleRate,
      });
      controlBuffer.copyToChannel(controlChannel, 0);
      const control = new AudioBufferSourceNode(audioContext, { buffer: controlBuffer });

      source.connect(volume).connect(audioContext.destination);
      control.connect(volume.volume);

      source.start();
      control.start();

      const buffer = await audioContext.startRendering();
      const result = buffer.getChannelData(0);

      for (let i = 0; i < controlChannel.length; i++) {
        const db = controlChannel[i];
        const sample = result[i]
        const expected = decibelToLinear(db);
        assert.approximately(sample, expected, 1e-7);
      }
    });
  });
});
