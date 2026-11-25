import {execFileSync} from 'node:child_process';
import {readFileSync, writeFileSync, copyFileSync, mkdirSync, readdirSync, statSync} from 'node:fs';
import {join, relative, dirname} from 'node:path';

execFileSync(process.execPath, ['node_modules/@angular/cli/bin/ng.js', 'build'], {stdio: 'inherit'});

const root = 'dist/angular/browser';
// Publish the independently browsable design-system explorer alongside Angular.
// The explorer consumes the exact same tokens and component primitives as the app.
mkdirSync(join(root, 'design-system'), {recursive: true});
mkdirSync(join(root, 'design-system/assets'), {recursive: true});
for (const file of ['index.html', 'studio.css', 'studio.js']) copyFileSync(join('design-system', file), join(root, 'design-system', file));
for (const file of ['tokens.css', 'components.css']) copyFileSync(join('src/design-system', file), join(root, 'design-system/assets', file));
const assets = {};
function collect(directory) {
  for (const name of readdirSync(directory)) {
    const full = join(directory, name);
    if (statSync(full).isDirectory()) collect(full);
    else assets[`/${relative(root, full).replaceAll('\\', '/')}`] = readFileSync(full).toString('base64');
  }
}
collect(root);
if (!assets['/index.html']) throw new Error('Angular build is missing index.html');
const source = readFileSync('worker/source.js', 'utf8');
if (!source.includes('__SITE_ASSETS__')) throw new Error('Missing asset placeholder');
const output = source.replace('const ASSETS = __SITE_ASSETS__;', `const ASSETS = ${JSON.stringify(assets)};`);
mkdirSync('dist/server', {recursive: true});
writeFileSync('dist/server/index.js', output);
console.log(`Bundled ${Object.keys(assets).length} Angular assets into the REST API Worker.`);
