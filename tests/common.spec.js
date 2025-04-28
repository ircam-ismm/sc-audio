import { assert } from 'chai';
import { OfflineAudioContext, GainNode } from 'isomorphic-web-audio-api';
import * as root from '../src/index.js';

const audioContextOptions = { length: 100, numberOfChannels: 1, sampleRate: 48000 };

[
  'BypassNode',
  'DistributorNode',
  'MuteNode',
  'ScaledConstantSourceNode',
  'VolumeNode',
].forEach(name => {
  const ctor = root[name];

  describe(`# ${name}`, () => {
    describe(`# constructor(context, options)`, () => {
      it('should throw if argument 1 is not a BaseAudioContext instance', () => {
        assert.throws(() => new ctor({}));
        assert.throws(() => new ctor(null));
        assert.throws(() => new ctor('string'));
        assert.throws(() => new ctor(1));
        assert.throws(() => new ctor(NaN));
      });

      it('should throw if argument 2 is given and not an Object', () => {
        const audioContext = new OfflineAudioContext(audioContextOptions);
        assert.throws(() => new ctor(audioContext, null));
        assert.throws(() => new ctor(audioContext, 'string'));
        assert.throws(() => new ctor(audioContext, 1));
        assert.throws(() => new ctor(audioContext, NaN));
      });

      it('should succeed if only argument 1 is given', () => {
        const audioContext = new OfflineAudioContext(audioContextOptions);
        const node = new ctor(audioContext);
        assert.isTrue(node instanceof ctor);
      });

      it('should succeed if two arguments are given', () => {
        const audioContext = new OfflineAudioContext(audioContextOptions);
        const node = new ctor(audioContext, {});
        assert.isTrue(node instanceof ctor);
      });


      it('should not expose a gain property if extends GainNode', () => {
        const audioContext = new OfflineAudioContext(audioContextOptions);
        const node = new ctor(audioContext);
        assert.isTrue(node instanceof ctor);

        if (node instanceof GainNode) {
          assert.isUndefined(node.gain);
        } else {
          console.log('...abort, given node does not inherit GainNode');
        }
      });
    });

    describe('# connect(...args)', () => {
      it('should be able to chain connect calls', () => {
        const audioContext = new OfflineAudioContext(audioContextOptions);
        const node = new ctor(audioContext);

        if (node.numberOfOutputs > 1) {
          console.log('...abort, given node has multiple outputs');
        } else {
          const a = new GainNode(audioContext);
          node.connect(a).connect(audioContext.destination);
        }
      });
    });
  });
})
