// list of pages
export const components = [
  'BypassNode',
  'DistributorNode',
].sort();

export const pages = {
  'intro': {
    'home': 'home',
  },
  components: components.reduce((acc, value) => {
    acc[value] = value;
    return acc;
  }, {}),
};
