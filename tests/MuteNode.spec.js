import { assert } from 'chai';
import { MuteNode } from '../src/index.js';
import { OfflineAudioContext, ConstantSourceNode } from 'isomorphic-web-audio-api';

const audioContextOptions = { length: 256, numberOfChannels: 1, sampleRate: 48000 };

describe('# MuteNode', () => {
  describe('## process', () => {
    it('setActiveATime(active, when) [1]', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const mute = new MuteNode(audioContext, { active: false });

      const src = new ConstantSourceNode(audioContext, { offset: 1 });
      src.connect(mute).connect(audioContext.destination);
      src.start(0);

      mute.setActiveAtTime(true, 128 / audioContext.sampleRate);

      const buffer = await audioContext.startRendering();
      const result = buffer.getChannelData(0);

      for (let i = 0; i < result.length; i++) {
        if (i <= 128) {
          assert.equal(result[i], 1);
        } else {
          assert.isBelow(result[i], 1); // fadeOut
        }
      }
    });

    it('setActiveATime(active, when) [2]', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const mute = new MuteNode(audioContext, { active: true });

      const src = new ConstantSourceNode(audioContext, { offset: 1 });
      src.connect(mute).connect(audioContext.destination);
      src.start(0);

      mute.setActiveAtTime(false, 128 / audioContext.sampleRate);

      const buffer = await audioContext.startRendering();
      const result = buffer.getChannelData(0);

      for (let i = 0; i < result.length; i++) {
        if (i <= 128) {
          assert.equal(result[i], 0);
        } else {
          assert.isAbove(result[i], 0); // fadeIn
        }
      }
    });


    it('should properly toggle active', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const mute = new MuteNode(audioContext, { active: false });

      const src = new ConstantSourceNode(audioContext, { offset: 1 });
      src.connect(mute).connect(audioContext.destination);
      src.start(0);

      const activeFrame = 128;

      audioContext.suspend(activeFrame / audioContext.sampleRate).then(async () => {
        mute.active = true;
        audioContext.resume();
      });

      const buffer = await audioContext.startRendering();
      const result = buffer.getChannelData(0);

      for (let i = 0; i < result.length; i++) {
        if (i <= 128) {
          assert.equal(result[i], 1);
        } else {
          assert.isBelow(result[i], 1); // fadeOut
        }
      }
    });
  });
});
