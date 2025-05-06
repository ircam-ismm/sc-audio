// copy `index.html` to every pages to avoid 404 errors when deploying on github
import fs from 'node:fs';
import { pages } from '../src/pages.js';

// flatten pages
const list = [];

for (let cat in pages) {
  const subpages = pages[cat];

  for (let title in subpages) {
    if (subpages[title] === 'home') {
      continue;
    }

    list.push(subpages[title]);
  }
}

list.forEach(page => {
  if (page === 'home') {
    return;
  }

  fs.cpSync('index.html', `${page}.html`);
});

