/**
 * @note - this file is used by the build system, it should not be merged in index.js
 */
const arrToObject = arr => {
  return arr.reduce((acc, value) => {
    acc[value] = value;
    return acc;
  }, {})
};

export const pages = {
  'intro': {
    'Home': 'home',
  },
  'routing': arrToObject([
    'BypassNode',
    'CollectorNode',
    'DistributorNode',
    'MuteNode',
    'PlaceholderNode',
    'VolumeNode',
    'RtlSdrSourceNode',
  ].sort()),
};
