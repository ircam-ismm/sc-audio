const arrToObject = arr => {
  return arr.reduce((acc, value) => {
    acc[value] = value;
    return acc;
  }, {})
};

// this is used by the
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
  ].sort()),
};
