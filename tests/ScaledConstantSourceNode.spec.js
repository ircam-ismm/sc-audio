import { assert } from 'chai';
import { OfflineAudioContext, AudioParam } from 'isomorphic-web-audio-api';
import { ScaledConstantSourceNode } from '../src/ScaledConstantSourceNode.js';

const audioContextOptions = { length: 256, numberOfChannels: 1, sampleRate: 48000 };

function floatEq(input, output, error) {

}

describe('# ScaledConstantSourceNode', () => {
  describe('## constructor(context: BaseAudioContext, options: ControllerSourceOptions)', () => {
    it('offset should default to 1', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new ScaledConstantSourceNode(audioContext);
      assert.isTrue(node.offset instanceof AudioParam);
      assert.equal(node.offset.value, 0);
    });

    it('should configure offset from options', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      const node = new ScaledConstantSourceNode(audioContext, { offset: 0.5 });
      assert.isTrue(node.offset instanceof AudioParam);
      assert.equal(node.offset.value, 0.5);
    });
  });

  describe('## process', () => {
    const tests = [
      {
        config: {
          inputStart: 0,
          inputEnd: 1,
          outputStart: -1,
          outputEnd: 1,
        },
        values: [[0, -1], [1, 1], [0.5, 0]],
      },
      {
        config: {
          inputStart: 4,
          inputEnd: -2,
          outputStart: -1,
          outputEnd: 1,
        },
        values: [[4, -1], [1, 0], [-2, 1]],
      },
      {
        config: {
          inputStart: -10,
          inputEnd: -2,
          outputStart: 1,
          outputEnd: -2,
        },
        values: [[-10, 1], [-6, -0.5], [-2, -2]],
      },
    ]
    for (let i = 0; i < tests.length; i++) {
      const { config, values } = tests[i];
      const { inputStart, inputEnd, outputStart, outputEnd } = config;

      it.only(`should scale correctly from [${inputStart, inputEnd}] to [${outputStart, outputEnd}]`, async () => {
        for (let [input, output] of values) {
          const audioContext = new OfflineAudioContext(audioContextOptions);
          const node = new ScaledConstantSourceNode(audioContext, {
            ...config,
            offset: input,
          });

          node.connect(audioContext.destination);
          node.start();

          const buffer = await audioContext.startRendering();
          const result = buffer.getChannelData(0);
          const expected = new Float32Array(result.length).fill(output);

          assert.equal(result.length, expected.length);

          for (let i = 0; i < result.length; i++) {
            assert.approximately(result[i], expected[i], 1e-9);
          }
        }
      });
    }
  });
});
