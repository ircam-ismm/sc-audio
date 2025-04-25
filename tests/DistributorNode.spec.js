import { assert } from 'chai';
import { DistributorNode } from '../src/index.js';
import {
  OfflineAudioContext,
  AudioParam,
  ConstantSourceNode,
  ChannelMergerNode
} from 'isomorphic-web-audio-api';

const audioContextOptions = { length: 256, numberOfChannels: 2, sampleRate: 48000 };

describe('# DistributorNode', () => {
  describe('## constructor(context: BaseAudioContext, options: DryWetOptions)', () => {
    it('ratio should be an 0 by default', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new DistributorNode(audioContext);
      assert.isTrue(node.ratio instanceof AudioParam);
      assert.equal(node.ratio.value, 0);
    });

    it('should configure ratio initial value from options', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new DistributorNode(audioContext, { ratio: 0.5 });
      assert.isTrue(node.ratio instanceof AudioParam);
      assert.equal(node.ratio.value, 0.5);
    });

    it('should throw if ratio is no finite', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      assert.throws(() => new DistributorNode(audioContext, { ratio: NaN }));
    });

    it('should throw if ratio is no finite', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      assert.throws(() => new DistributorNode(audioContext, { ratio: NaN }));
    });

    it('should throw if curve is an invalid sequence of numbers', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      assert.throws(() => new DistributorNode(audioContext, {
        curve: [0, 1, 2, NaN, 4],
      }));
    });
  });

  describe('## numberOfOutputs: number', () => {
    it('should report correct number of outputs', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new DistributorNode(audioContext, { ratio: 0.5 });
      assert.equal(node.numberOfOutputs, 2);
    });
  });

  describe('## ratio: AudioParam', () => {
    it('should route to dry output if ratio is 0', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const src = new ConstantSourceNode(audioContext, { offset: 2 });
      const dryWet = new DistributorNode(audioContext, { ratio: 0 });
      const merger = new ChannelMergerNode(audioContext, { numberOfInputs: 2 });

      src.connect(dryWet);
      dryWet.connect(merger, 0, 0); // dry output in merger left channel
      dryWet.connect(merger, 1, 1); // wet output in merger right channel
      merger.connect(audioContext.destination);

      src.start();

      const result = await audioContext.startRendering();
      const expectedLeft = new Float32Array(256).fill(2);
      const expectedRight = new Float32Array(256).fill(0);

      assert.deepEqual(result.getChannelData(0), expectedLeft);
      assert.deepEqual(result.getChannelData(1), expectedRight);
    });

    it('should route to wet output if ratio is 1', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const src = new ConstantSourceNode(audioContext, { offset: 2 });
      const dryWet = new DistributorNode(audioContext, { ratio: 1 });
      const merger = new ChannelMergerNode(audioContext, { numberOfInputs: 2 });

      src.connect(dryWet);
      dryWet.connect(merger, 0, 0); // dry output in merger left channel
      dryWet.connect(merger, 1, 1); // wet output in merger right channel
      merger.connect(audioContext.destination);

      src.start();

      const result = await audioContext.startRendering();
      const expectedLeft = new Float32Array(256).fill(0);
      const expectedRight = new Float32Array(256).fill(2);

      assert.deepEqual(result.getChannelData(0), expectedLeft);
      assert.deepEqual(result.getChannelData(1), expectedRight);
    });

    it.only('should use equal power curve by default', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const src = new ConstantSourceNode(audioContext, { offset: 1 });
      const dryWet = new DistributorNode(audioContext, { ratio: 0.5 });
      const merger = new ChannelMergerNode(audioContext, { numberOfInputs: 2 });

      src.connect(dryWet);
      dryWet.connect(merger, 0, 0); // dry output in merger left channel
      dryWet.connect(merger, 1, 1); // wet output in merger right channel
      merger.connect(audioContext.destination);

      src.start();

      const buffer = await audioContext.startRendering();
      const expected = new Float32Array(256).fill(Math.cos(Math.PI / 4));

      [0, 1].forEach(channelIndex => {
        const result = buffer.getChannelData(channelIndex);

        for (let i = 0; i < result.length; i++) {
          assert.approximately(result[i], expected[i], 1e-7);
        }
      });
    });

    it('should be able to apply automation', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const src = new ConstantSourceNode(audioContext, { offset: 1 });
      const dryWet = new DistributorNode(audioContext);
      const merger = new ChannelMergerNode(audioContext, { numberOfInputs: 2 });

      src.connect(dryWet);
      dryWet.connect(merger, 0, 0); // dry output in merger left channel
      dryWet.connect(merger, 1, 1); // wet output in merger right channel
      merger.connect(audioContext.destination);
      dryWet.ratio.setValueAtTime(0, 0);
      dryWet.ratio.linearRampToValueAtTime(1, (256 - 1) / audioContext.sampleRate);
      src.start();

      const result = await audioContext.startRendering();
      const left = result.getChannelData(0);
      const right = result.getChannelData(1);

      for (let i = 0; i < result.length; i++) {
        assert.approximately(left[i], right[right.length - i - 1], 1e-6);
      }
    });
  });
});
