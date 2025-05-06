import path from 'path';
import fs from 'fs';
import * as documentation from 'documentation';

// list all files in src
const srcDirname = path.join(process.cwd(), 'src');
const srcFiles = fs.readdirSync(srcDirname);
const outputDirname = path.join(process.cwd(), 'docs', 'api');
// clean api directory
fs.rmSync(outputDirname, { recursive: true, force: true });
fs.mkdirSync(outputDirname, { recursive: true });

for (let filename of srcFiles) {
  const srcPathname = path.join(srcDirname, filename);
  const outputPathname = path.join(outputDirname, filename);
  const build = await documentation.build(srcPathname);
  const md = await documentation.formats.md(build);
  fs.writeFileSync(outputPathname, md);
}

// var documentation = require('documentation');
// var fs = require('fs');

// documentation.build(['index.js'])
//   .then(documentation.formats.md)
//   .then(output => {
//     // output is a string of Markdown data
//     fs.writeFileSync('./output.md', output);
//   });
