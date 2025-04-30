import { assert } from 'chai';
import { PlaceholderNode } from '../src/index.js';
import { OfflineAudioContext, ConstantSourceNode, GainNode } from 'isomorphic-web-audio-api';

const audioContextOptions = { length: 256, numberOfChannels: 1, sampleRate: 48000 };

describe('# PlaceholderNode', () => {
  describe('## process', () => {
    it('setActiveATime(active, when) [1]', async () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);

      const gain1 = new GainNode(audioContext, { gain: 1 });
      const gain2 = new GainNode(audioContext, { gain: 0 });

      const placeholder = new PlaceholderNode(audioContext, { active: false });
      const src = new ConstantSourceNode(audioContext, { offset: 1 });
      src.connect(placeholder).connect(audioContext.destination);
      src.start(0);

      placeholder.node = gain1;
      placeholder.setNodeAtTime(gain2, 128 / audioContext.sampleRate);

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
