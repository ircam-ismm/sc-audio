import { assert } from 'chai';
import {
  QUARTER_SIN_WAVETABLE,
  QUARTER_COS_WAVETABLE,
  computeCurve,
} from '../src/utils.js';

describe('# utils', () => {
  describe('## QUARTER_SIN_WAVETABLE', () => {
    it('should start at 0 and end at 1', () => {
      assert.approximately(QUARTER_SIN_WAVETABLE[0], 0, 1e-12);
      assert.approximately(QUARTER_SIN_WAVETABLE[QUARTER_SIN_WAVETABLE.length - 1], 1, 1e-12);
    });
  });

  describe('## QUARTER_COS_WAVETABLE', () => {
    it('should start at 1 and end at 0', () => {
      assert.approximately(QUARTER_COS_WAVETABLE[0], 1, 1e-12);
      assert.approximately(QUARTER_COS_WAVETABLE[QUARTER_COS_WAVETABLE.length - 1], 0, 1e-12);
    });
  });

  describe('## computeCurve', () => {
    it('identity', () => {
      const curve = computeCurve((val) => val, 3);
      assert.deepEqual(curve, new Float32Array([-1, 0, 1]));
    });

    it('abs', () => {
      const curve = computeCurve((val) => Math.abs(val), 3);
      assert.deepEqual(curve, new Float32Array([1, 0, 1]));
    });

    it('1 / 2', () => {
      const curve = computeCurve((val) => val / 2, 3);
      assert.deepEqual(curve, new Float32Array([-0.5, 0, 0.5]));
    });

    it('1 / x', () => {
      const curve = computeCurve((val) => val !== 0 ? 1 / val : 0, 5);
      assert.deepEqual(curve, new Float32Array([-1, -2, 0, 2, 1]));
    });
  });
});
