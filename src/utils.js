/** @private */
export const DEFAULT_WAVETABLE_SIZE = 2048;
/** @private */
export const QUARTER_SIN_WAVETABLE = new Float32Array(DEFAULT_WAVETABLE_SIZE);
/** @private */
export const QUARTER_COS_WAVETABLE = new Float32Array(DEFAULT_WAVETABLE_SIZE);

for (let i = 0; i < DEFAULT_WAVETABLE_SIZE; i++) {
  const phase = i / (DEFAULT_WAVETABLE_SIZE - 1) * (Math.PI / 2);
  QUARTER_SIN_WAVETABLE[i] = Math.sin(phase);
  QUARTER_COS_WAVETABLE[i] = Math.cos(phase);
}

/** @private */
export const SET_TARGET_DEFAULT_TIME_CONSTANT = 0.003;

export function computeCurve(func, length) {
  const curve = new Float32Array(length);

  for (let index = 0; index < length; index++) {
    const inputValue = index / (length - 1) * 2 - 1;
    curve[index] = func(inputValue, index);
  }

  return curve;
}
