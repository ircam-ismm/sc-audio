import { assert } from 'chai';
import { OfflineAudioContext, ConstantSourceNode } from 'isomorphic-web-audio-api';
import { decibelToLinear } from '@ircam/sc-utils';
import { VolumeNode } from '../src/index.js';

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

    // it('should expose `curve` option', () => {
    //   const audioContext = new OfflineAudioContext(audioContextOptions);
    //   const node = new VolumeNode(audioContext, { curve: [1, 2, 3, 4, 5] });
    //   assert.deepEqual(node.curve, new Float32Array([1, 2, 3, 4, 5]));
    // });

    it('should compute curve according to given min and max', () => {
      const min = -6;
      const max = 0;
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new VolumeNode(audioContext, { min, max });
      const curve = node.curve;

      for (let i = 0; i < curve.length; i++) {
        const db = i / (curve.length - 1) * (max - min) + min;
        const lin = decibelToLinear(db);
        assert.approximately(lin, curve[i], 1e-7);
      }
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

    // const curve = [-20, 0, 6];
    // const curveTestValues = [-20, -10, 0, 3, 6];

    // for (let volume of curveTestValues) {
    //   it.only('should work with curve', async () => {
    //     const audioContext = new OfflineAudioContext(audioContextOptions);
    //     const fader = new VolumeNode(audioContext, { curve, volume });
    //     const source = new ConstantSourceNode(audioContext, { offset: 1 });
    //     source.connect(fader).connect(audioContext.destination);
    //     source.start();

    //     const buffer = await audioContext.startRendering();
    //     const result = buffer.getChannelData(0);
    //     const expected = new Float32Array(result.length).fill(decibelToLinear(volume));
    //   });
    // }
  });
});
