import { assert } from 'chai';
import { CollectorNode } from '../src/index.js';
import {
  OfflineAudioContext,
  AudioParam,
  ConstantSourceNode,
  ChannelMergerNode
} from 'isomorphic-web-audio-api';

const audioContextOptions = { length: 256, numberOfChannels: 2, sampleRate: 48000 };

describe('# CollectorNode', () => {
  describe('## constructor(context: BaseAudioContext, options: DryWetOptions)', () => {
    it('ratio should be an 0 by default', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new CollectorNode(audioContext);
      assert.isTrue(node.ratio instanceof AudioParam);
      assert.equal(node.ratio.value, 0);
    });

    it('should configure ratio initial value from options', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new CollectorNode(audioContext, { ratio: 0.5 });
      assert.isTrue(node.ratio instanceof AudioParam);
      assert.equal(node.ratio.value, 0.5);
    });

    it('should throw if ratio is not finite', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      assert.throws(() => new CollectorNode(audioContext, { ratio: NaN }));
    });

    it('should throw if curve is an invalid sequence of numbers', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      assert.throws(() => new CollectorNode(audioContext, {
        curve: [0, 1, 2, NaN, 4],
      }));
    });
  });

  describe('## numberOfInputs: number', () => {
    it('should report correct number of outputs', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new CollectorNode(audioContext, { ratio: 0.5 });
      assert.equal(node.numberOfInputs, 2);
    });
  });

  describe('## ratio: AudioParam', () => {
    it('should route from input[0] if ratio is 0', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const src0 = new ConstantSourceNode(audioContext, { offset: 1 });
      const src1 = new ConstantSourceNode(audioContext, { offset: 2 });
      const mixer = new CollectorNode(audioContext, { ratio: 0 });

      src0.connect(mixer.inputs[0]);
      src1.connect(mixer.inputs[1]);
      mixer.connect(audioContext.destination);

      src0.start();
      src1.start();

      const buffer = await audioContext.startRendering();
      const result = buffer.getChannelData(0);
      const expected = new Float32Array(256).fill(1);

      assert.deepEqual(result, expected);
    });

    it('should route from input[1] if ratio is 1', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const src0 = new ConstantSourceNode(audioContext, { offset: 1 });
      const src1 = new ConstantSourceNode(audioContext, { offset: 2 });
      const mixer = new CollectorNode(audioContext, { ratio: 1 });

      src0.connect(mixer.inputs[0]);
      src1.connect(mixer.inputs[1]);
      mixer.connect(audioContext.destination);

      src0.start();
      src1.start();

      const buffer = await audioContext.startRendering();
      const result = buffer.getChannelData(0);
      const expected = new Float32Array(256).fill(2);

      assert.deepEqual(result, expected);
    });

    it('should use equal power curve by default to mix inputs', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const src0 = new ConstantSourceNode(audioContext, { offset: 1 });
      const src1 = new ConstantSourceNode(audioContext, { offset: 2 });
      const mixer = new CollectorNode(audioContext, { ratio: 0.5 });

      src0.connect(mixer.inputs[0]);
      src1.connect(mixer.inputs[1]);
      mixer.connect(audioContext.destination);

      src0.start();
      src1.start();

      const buffer = await audioContext.startRendering();
      const result = buffer.getChannelData(0);
      const expected = new Float32Array(256).fill(Math.cos(Math.PI / 4) + Math.cos(Math.PI / 4) * 2);

      for (let i = 0; i < result.length; i++) {
        assert.approximately(result[i], expected[i], 1e-7);
      }
    });
  });
});
