// use mocha for now
// import { describe, it } from 'node:test';
import assert from 'node:assert';

import fc from 'fast-check';

import { almostEqual } from '@ircam/sc-utils';

import {
  decibelToLinear,
  linearToDecibel,
} from '@ircam/sc-utils';

import {
  OfflineAudioContext,
  ConstantSourceNode,
  DynamicsCompressorNode as WebAudioDynamicsCompressorNode,
} from 'isomorphic-web-audio-api';
import { DynamicsCompressorNode } from '@ircam/sc-audio';

const sampleRate = 48000;
// long enough to be after compressor look ahead and stabilisation
const audioContextOptions = { length: sampleRate, numberOfChannels: 1, sampleRate };

// to test for almost equal
const epsilonDecibel = 0.1; // dB

describe('Offline context set-up', () => {
  it('should run offline context', async () => {

    const debugOptions = {};

    await fc.assert(
      fc.asyncProperty(
        fc.float({ noNaN: true, min: -10, max: 10 }),
        async (input) => {

          const audioContext = new OfflineAudioContext(audioContextOptions);
          const constantSourceNode = new ConstantSourceNode(audioContext, { offset: input });
          constantSourceNode.connect(audioContext.destination);
          constantSourceNode.start();

          const buffer = await audioContext.startRendering();
          const data = buffer.getChannelData(0);
          const output = data[audioContext.length - 1];

          assert(almostEqual(input, output, epsilonDecibel,
            `output value should be almost equal to input value: output: ${output}, input: ${input})`,
          ));
        }), {
        ...debugOptions,
      });

  });
});

// no implementation seems to comply with specification
describe.skip('Web Audio API DynamicsCompressorNode reference', () => {
  it('should properly compress input values', async () => {

    // replace with replay options, like
    // { seed: 824551551, path: "0", endOnFailure: true }
    const debugOptions = {};

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          valueInput: fc.constant(-8), // fc.float({ noNaN: true, min: -100, max: 20 }), // decibel
          threshold: fc.constant(-6), // fc.float({ noNaN: true, min: -100, max: 0 }),
          ratio: fc.constant(2), // fc.float({ noNaN: true, min: 1, max: 20 }),
          knee: fc.constant(0), // fc.float({ noNaN: true, min: 0, max: 40 }),
        }, { noNullPrototype: true }),
        async ({ valueInput, threshold, ratio, knee }) => {
          const audioContext = new OfflineAudioContext(audioContextOptions);

          const dynamicsCompressorNode = new WebAudioDynamicsCompressorNode(audioContext, {
            attack: 0, // immediate for test
            release: 0, // immediate for test
            threshold,
            ratio,
            knee,
          });
          dynamicsCompressorNode.connect(audioContext.destination);

          const inputSourceNode = new ConstantSourceNode(audioContext, {
            offset: decibelToLinear(valueInput),
          });
          inputSourceNode.connect(dynamicsCompressorNode);
          inputSourceNode.start();

          const buffer = await audioContext.startRendering();
          const data = buffer.getChannelData(0);
          const valueResult = linearToDecibel(data[audioContext.length - 1]);

          // before knee
          const valueUncompressedMax = threshold - knee * 0.5;
          // after knee
          const valueCompressedMin = threshold + knee * 0.5 / ratio;

          if (valueInput < valueUncompressedMax) {
            // no compression
            const valueExpected = valueInput;
            assert(almostEqual(valueResult, valueExpected, epsilonDecibel),
              `uncompressed value should be equal to input value: valueResult: ${valueResult}, valueExpected: ${valueExpected})`,
            );

            const reductionExpected = 0;
            const reductionResult = dynamicsCompressorNode.reduction.value;
            assert(almostEqual(reductionResult, reductionExpected, epsilonDecibel),
              `reduction value should match expected reduction: reductionResult: ${reductionResult}, reductionExpected: ${reductionExpected})`,
            );
          } else if (valueInput > valueCompressedMin) {
            // full compression
            const valueExpected = threshold + (valueInput - threshold) / ratio;
            assert(almostEqual(valueResult, valueExpected, epsilonDecibel),
              `compressed value should follow the ratio after threshold: valueResult: ${valueResult}, valueExpected: ${valueExpected})`,
            );

            const reductionExpected = valueExpected - valueInput;
            const reductionResult = dynamicsCompressorNode.reduction;
            assert(almostEqual(reductionResult, reductionExpected, epsilonDecibel),
              `reduction value should match expected reduction: reductionResult: ${reductionResult}, reductionExpected: ${reductionExpected})`,
            );
          } else {
            // in the knee
            assert((valueResult >= valueUncompressedMax - epsilonDecibel
              && valueResult <= valueCompressedMin + epsilonDecibel),
                `value in the knee should be between uncompressed max and compressed min: valueResult: ${valueResult}, valueUncompressedMax: ${valueUncompressedMax}, valueCompressedMin: ${valueCompressedMin})`,
            );
          }

        }), {
        ...debugOptions,
      });

  }); // map input values
});

//
describe('DynamicsCompressorNode', () => {
  describe('interface', () => {
    it('should throw if audioContext is missing or not an audio context', () => {
      assert.throws(() => new DynamicsCompressorNode());
      assert.throws(() => new DynamicsCompressorNode(12));
      assert.throws(() => new DynamicsCompressorNode({}));
    });

    it('should not throw if audioContext is given and valid', () => {
      const audioContext = new OfflineAudioContext(audioContextOptions);
      assert.doesNotThrow(() => new DynamicsCompressorNode(audioContext));
    });

  });

  describe.skip('process', () => {

    it('should properly compress input values', async () => {

      // replace with replay options, like
      // { seed: 824551551, path: "0", endOnFailure: true }
      const debugOptions = {};

      await fc.assert(
        fc.asyncProperty(
          fc.record({
            attack: fc.constant(0), // immediate for test
            release: fc.constant(0), // immediate for test
            valueInput: fc.constant(0), // fc.float({ noNaN: true, min: -100, max: 20 }),
            threshold: fc.constant(-6), // fc.float({ noNaN: true, min: -100, max: 0 }),
            ratio: fc.constant(2), // fc.float({ noNaN: true, min: 1, max: 20 }),
            knee: fc.constant(0), // fc.float({ noNaN: true, min: 0, max: 40 }),
          }, { noNullPrototype: true }),
          async ({ attack, release, valueInput, threshold, ratio, knee }) => {
            const audioContext = new OfflineAudioContext(audioContextOptions);

            const dynamicsCompressorNode = new DynamicsCompressorNode(audioContext, {
              attack,
              release,
              threshold,
              ratio,
              knee,
              linearTimeConstant: 0, // immediate for test
              curveTimeConstant: 0, // immediate for test
            });
            dynamicsCompressorNode.connect(audioContext.destination);

            const inputSourceNode = new ConstantSourceNode(audioContext, {
              offset: decibelToLinear(valueInput),
            });
            inputSourceNode.connect(dynamicsCompressorNode);
            inputSourceNode.start();

            const buffer = await audioContext.startRendering();
            const data = buffer.getChannelData(0);
            // be sure to be after compressor look ahead and stabilisation
            const valueResult = linearToDecibel(data[audioContext.length - 1]);

            // before knee
            const valueUncompressedMax = threshold - knee * 0.5;
            // after knee
            const valueCompressedMin = threshold + knee * 0.5 / ratio;

            if (valueInput < valueUncompressedMax) {
              // no compression
              const valueExpected = valueInput;
              assert(almostEqual(valueResult, valueExpected, epsilonDecibel),
                `uncompressed value should be equal to input value: valueResult: ${valueResult}, valueExpected: ${valueExpected})`,
              );
            } else if (valueInput > valueCompressedMin) {
              // full compression
              const valueExpected = threshold + (valueInput - threshold) / ratio;
              assert(almostEqual(valueResult, valueExpected, epsilonDecibel),
                `compressed value should follow the ratio after threshold: valueResult: ${valueResult}, valueExpected: ${valueExpected})`,
              );
            } else {
              // in the knee
              assert((valueResult >= valueUncompressedMax - epsilonDecibel
                && valueResult <= valueCompressedMin + epsilonDecibel),
                `value in the knee should be between uncompressed max and compressed min: valueResult: ${valueResult}, valueUncompressedMax: ${valueUncompressedMax}, valueCompressedMin: ${valueCompressedMin})`,
              );
            }

          }), {
          ...debugOptions,
      });

    }); // map input values

  }); // process


}); // DynamicsCompressorNode
