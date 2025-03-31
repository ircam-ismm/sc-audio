import { assert } from 'chai';
import { BypassNode } from '../src/index.js';
import { OfflineAudioContext, ConstantSourceNode, GainNode } from 'isomorphic-web-audio-api';

const audioContextOptions = { length: 100, numberOfChannels: 1, sampleRate: 48000 };

describe('# Bypass', () => {
  describe('## constructor(audioContext: AudioContext, options: BypassOptions)', () => {
    it('should throw if argument 1 is not an AudioContext', () => {
      assert.throws(() => new BypassNode({}));
      assert.throws(() => new BypassNode(null));
      assert.throws(() => new BypassNode('string'));
      assert.throws(() => new BypassNode(1));
      assert.throws(() => new BypassNode(NaN));
    });

    it('should succeed if only argument 1 is given', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const bypass = new BypassNode(audioContext);
      assert.isTrue(bypass instanceof BypassNode);
      assert.isFalse(bypass.active);
    });

    it('should throw if argument 2 is not an Object', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      assert.throws(() => new BypassNode(audioContext, null));
      assert.throws(() => new BypassNode(audioContext, 'string'));
      assert.throws(() => new BypassNode(audioContext, 1));
      assert.throws(() => new BypassNode(audioContext, NaN));
    });

    it('should succeed if only argument 1 is given', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const bypass = new BypassNode(audioContext, { active: true });
      assert.isTrue(bypass instanceof BypassNode);
      assert.isTrue(bypass.active);
    });
  });

  describe('## .active: boolean', () => {
    it('should go into subgraph when set to false', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const bypass = new BypassNode(audioContext, { active: false });
      const src = new ConstantSourceNode(audioContext, { offset: 1 });
      const subGraph = new GainNode(audioContext, { gain: 0.5 });

      src.connect(bypass).connect(audioContext.destination);
      bypass.subGraphInput.connect(subGraph).connect(bypass.subGraphOutput);

      src.start(0);

      // bypass is not active, we should go into subGraph gain
      const buffer = await audioContext.startRendering();
      const result = buffer.getChannelData(0);
      const expected = new Float32Array(100).fill(0.5);
      assert.deepEqual(result, expected);
    });

    it('should not go into subgraph when set to true', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const bypass = new BypassNode(audioContext, { active: true });
      const src = new ConstantSourceNode(audioContext, { offset: 1 });
      const subGraph = new GainNode(audioContext, { gain: 0.5 });

      src.connect(bypass).connect(audioContext.destination);
      bypass.subGraphInput.connect(subGraph).connect(bypass.subGraphOutput);

      src.start(0);

      // bypass is not active, we should go into subGraph gain
      const buffer = await audioContext.startRendering();
      const result = buffer.getChannelData(0);
      const expected = new Float32Array(100).fill(1);
      assert.deepEqual(result, expected);
    });

    it('should properly toggle', async () => {
      const audioContext = new OfflineAudioContext({
        ...audioContextOptions,
        length: 256,
      });
      const bypass = new BypassNode(audioContext, { active: false });
      const subGraph = new GainNode(audioContext, { gain: 0.5 });
      bypass.subGraphInput.connect(subGraph).connect(bypass.subGraphOutput);

      const src = new ConstantSourceNode(audioContext, { offset: 1 });
      src.connect(bypass).connect(audioContext.destination);
      src.start(0);

      const bypassActiveFrame = 128;

      audioContext.suspend(bypassActiveFrame / audioContext.sampleRate).then(async () => {
        bypass.active = true;
        audioContext.resume();
      });

      // bypass is not active, we should go into subGraph gain
      const buffer = await audioContext.startRendering();
      const result = buffer.getChannelData(0);
      // const expected = new Float32Array(audioContext.length).fill(0.5);
      for (let i = 0; i < result.length; i++) {
        if (i <= 128) {
          assert.equal(result[i], 0.5);
        } else {
          assert.isAbove(result[i], 0.5);
        }
      }
    });
  });
});
