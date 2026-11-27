import {copyFile,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const version=createHash('sha256').update(await readFile('dist/app.js')).update(await readFile('dist/app.css')).digest('hex').slice(0,12);
for(const name of ['app.js','app.css','.nojekyll'])await copyFile('dist/'+name,name);
const html=(await readFile('dist/index.html','utf8')).replace(/\.\/app\.js(?:\?v=[^"]*)?/g,'./app.js?v='+version).replace(/\.\/app\.css(?:\?v=[^"]*)?/g,'./app.css?v='+version);
await writeFile('index.html',html);
console.log('Prepared GitHub Pages root files, release '+version);
