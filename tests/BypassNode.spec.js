import { assert } from 'chai';
import { BypassNode } from '../src/index.js';
import { OfflineAudioContext, ConstantSourceNode, GainNode } from 'isomorphic-web-audio-api';

const audioContextOptions = { length: 256, numberOfChannels: 1, sampleRate: 48000 };

describe('# BypassNode', () => {
  describe('## constructor(context, options)', () => {
    it('active should be false by default', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new BypassNode(audioContext);
      assert.isFalse(node.active);
    });

    it('should configure active flag from options', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new BypassNode(audioContext, { active: true });
      assert.isTrue(node.active);
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
      const expected = new Float32Array(256).fill(0.5);
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
      const expected = new Float32Array(256).fill(1);
      assert.deepEqual(result, expected);
    });

    // this one crashes sometimes because suspend is not called properly
    // @todo - should be checked on Rust side
    for (let i = 0; i < 1000; i++) {
      it.only('should properly toggle', async () => {
        const audioContext = new OfflineAudioContext(audioContextOptions);
        const bypass = new BypassNode(audioContext, { active: false });
        const subGraph = new GainNode(audioContext, { gain: 0.5 });
        bypass.subGraphInput.connect(subGraph).connect(bypass.subGraphOutput);

        const src = new ConstantSourceNode(audioContext, { offset: 1 });
        src.connect(bypass).connect(audioContext.destination);
        src.start(0);

        const bypassActiveFrame = 128;
        let suspendCurrentTime = null;

        audioContext.suspend(bypassActiveFrame / audioContext.sampleRate - Number.EPSILON).then(async () => {
          suspendCurrentTime = audioContext.currentTime;
          bypass.active = true;
          audioContext.resume();
        });

        // bypass is not active, we should go into subGraph gain
        const buffer = await audioContext.startRendering();
        const result = buffer.getChannelData(0);

        console.log(suspendCurrentTime);

        for (let i = 0; i < result.length; i++) {
          if (i <= 128) {
            assert.equal(result[i], 0.5);
          } else {
            assert.isAbove(result[i], 0.5, `${result} - ${suspendCurrentTime}`);
          }
        }
      });
    }
  });

  describe('setActiveAtTime(active, when)', () => {
    it('should properly toggle at given time', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const bypass = new BypassNode(audioContext, { active: false });
      const subGraph = new GainNode(audioContext, { gain: 0.5 });
      bypass.subGraphInput.connect(subGraph).connect(bypass.subGraphOutput);

      const src = new ConstantSourceNode(audioContext, { offset: 1 });
      src.connect(bypass).connect(audioContext.destination);
      src.start(0);

      const bypassActiveFrame = 128;
      bypass.setActiveAtTime(true, bypassActiveFrame / audioContext.sampleRate);

      // bypass is not active, we should go into subGraph gain
      const buffer = await audioContext.startRendering();
      const result = buffer.getChannelData(0);

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
