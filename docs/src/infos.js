// list of pages
const arrToObject = arr => {
  return arr.reduce((acc, value) => {
    acc[value] = value;
    return acc;
  }, {})
};
// export const routing = ;

export const pages = {
  'intro': {
    'Home': 'home',
  },
  'routing': arrToObject([
    'BypassNode',
    'DistributorNode',
    'MuteNode',
    'VolumeNode',
  ].sort()),
};
