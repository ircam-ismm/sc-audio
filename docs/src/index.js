import { html, render } from 'lit/html.js';
import { map } from 'lit/directives/map.js';
import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from 'highlight.js/lib/core';
import javascriptLang from 'highlight.js/lib/languages/javascript';
import typescriptLang from 'highlight.js/lib/languages/typescript';
import htmlLang from 'highlight.js/lib/languages/xml';
import cssLang from 'highlight.js/lib/languages/css';
import jsonLang from 'highlight.js/lib/languages/json';
import markdownLang from 'highlight.js/lib/languages/markdown';
import yamlLang from 'highlight.js/lib/languages/yaml';
import rustLang from 'highlight.js/lib/languages/rust';
import shellLang from 'highlight.js/lib/languages/shell';
import bashLang from 'highlight.js/lib/languages/bash';
import textLang from 'highlight.js/lib/languages/plaintext';

import { isFunction } from '@ircam/sc-utils';
import '@ircam/sc-components';
import { AudioContext } from 'isomorphic-web-audio-api';
import { AudioBufferLoader } from '@ircam/sc-loader';

// for display in title and generating url
const libName = 'sc-audio';
const audioContext = new AudioContext();
const loader = new AudioBufferLoader(audioContext);

// list of pages
// list of pages
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
    'DistributorNode',
    'MuteNode',
    'PlaceholderNode',
    'VolumeNode',
  ].sort()),
};

hljs.registerLanguage('javascript', javascriptLang);
hljs.registerLanguage('js', javascriptLang);
hljs.registerLanguage('typescript', typescriptLang);
hljs.registerLanguage('ts', typescriptLang);
hljs.registerLanguage('rust', rustLang);
hljs.registerLanguage('rs', rustLang);
hljs.registerLanguage('html', htmlLang);
hljs.registerLanguage('css', cssLang);
hljs.registerLanguage('json', jsonLang);
hljs.registerLanguage('markdown', markdownLang);
hljs.registerLanguage('md', markdownLang);
hljs.registerLanguage('plaintext', textLang);
hljs.registerLanguage('text', textLang);
hljs.registerLanguage('txt', textLang);
hljs.registerLanguage('yaml', yamlLang);
hljs.registerLanguage('yml', yamlLang);
hljs.registerLanguage('shell', shellLang);
hljs.registerLanguage('sh', shellLang);
hljs.registerLanguage('bash', bashLang);

const marked = new Marked(
  markedHighlight({
	emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang, info) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    }
  })
);

function setTheme(name) {
  switch (name) {
    case 'light':
      document.body.classList.remove('dark');
      document.body.classList.add('light');
      break;
    case 'dark':
      document.body.classList.remove('light');
      document.body.classList.add('dark');
      break;
  }
}

setTheme('dark');

// current page module
let current = null;
let prefix = null;

async function fetchExample(page) {
  const res = await fetch(`./examples/${page}.js`);
  const rawExample = await res.text();
  const localImport = new RegExp('../../src/index.js', 'g');
  const example = rawExample.replace(localImport, `@ircam/${libName}`);

  return example;
}

async function fetchAPI(page) {
  const res = await fetch(`./api/${page}.js`);
  const rawMd = await res.text();
  // replace the title from documentation.js to `## API`
  const title =new RegExp(`## ${page}`, 'm');
  const md = rawMd.replace(title, '## API')
  const html = marked.parse(md);

  return html;
}

async function setContent(pages, page) {
  // fallback to homepage if page is not found
  let pageFound = false;

  for (let name in pages) {
    const pageList = pages[name];
    for (let [key, value] of Object.entries(pageList)) {
      if (value === page) {
        pageFound = true;
      }
    }
  }

  if (!pageFound) {
    page = 'home';
  }

  let pageName = null;

  for (let subNav in pages) {
    for (let name in pages[subNav]) {
      if (pages[subNav][name] === page) {
        pageName = name;
      }
    }
  }
  // document title
  document.title = (page === 'home')
    ? `${libName} | documentation`
    : `${pageName} | ${libName}`;

  // render nav bar
  const $nav = document.querySelector('#main > nav');
  // close navbar on small screens
  $nav.classList.remove('active');

  const nav = [];

  for (let name in pages) {
    const pageList = pages[name];

    // nav section title
    if (name !== 'intro') {
      const navTitle = html`<p>${name}</p>`;
      nav.push(navTitle);
    }

    // link list
    const links = map(Object.entries(pageList), ([value, key]) => {
      return html`<a
        href="./${key}"
        class="${page === key ? 'selected' : ''}"
        @click=${e => {
          e.preventDefault();

          if (page === key) {
            return;
          }

          const url = key === 'home' ? `${prefix}/` : `${prefix}/${key}`;
          history.pushState({ page: key }, '', url);
          if (window._paq) {
            _paq.push(['trackPageView']);
          }
          setContent(pages, key);
        }}
      >${value}</a>`;
    });

    nav.push(links);
  }

  render(nav, $nav);

  // exit current page
  if (current && current.exit) {
    await current.exit();
  }
  // grab new page
  current = await import(`./${page}.js`);

  // enter first then render the page
  if (current.enter) {
    await current.enter(audioContext, loader);
  }

  const [example, api] = await Promise.all([fetchExample(page), fetchAPI(page)]);

  const template = isFunction(current.template) ? current.template(example, api) : current.template;
  render(template, document.querySelector('#main > section'));

  hljs.highlightAll();
}

(async function main() {
  // init on right page
  const pathname = window.location.pathname;
  const isProd = pathname.startsWith(`/${libName}`);
  prefix = isProd ? `/${libName}` : '';

  const page = pathname.replace(new RegExp(`^${prefix}/`), '');

  // history stuff
  history.pushState({ page }, '', `${prefix}/${page}`);

  window.addEventListener('popstate', e => {
    setContent(pages, e.state.page);
  });

  setContent(pages, page);

  // ligh / dark mode
  document.querySelector('#switch-mode').addEventListener('change', () => {
    const $content = document.querySelector('#main > section');
    $content.classList.toggle('dark');
    $content.classList.toggle('light');
  });

  // show / hide nav bar on small screens
  document.querySelector('#toggle-menu').addEventListener('input', () => {
    const $nav = document.querySelector('#main > nav');
    $nav.classList.toggle('active');
  });
}());
