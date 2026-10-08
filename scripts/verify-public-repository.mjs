import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';

const root=resolve(import.meta.dirname,'..');
const ignored=new Set(['.git','node_modules','.nx','.next','dist','artifacts']);
const documents=[];
const publicVisualSources=[];
function visit(directory){
  for(const entry of readdirSync(directory)){
    if(ignored.has(entry))continue;
    const path=join(directory,entry),stat=statSync(path);
    if(stat.isDirectory())visit(path);
    else {
      const extension=extname(path).toLowerCase();
      if(extension==='.md')documents.push(path);
      if((extension==='.css'||extension==='.svg')&&!path.includes(`${join('runtime-assets','')}`))publicVisualSources.push(path);
    }
  }
}
visit(root);

const forbiddenLetters=/[پچژگکی]/u;
const forbiddenMarkers=[
  /ZarX/i,
  /IykZ1LCb9Ubu7gPPFYBhpY/,
  /xCv9hpyi1WV9zzFxS1DT71/,
  /\/Users\/mehdipanahi/,
  /Payment Git/,
];
const failures=[];
for(const relative of ['docs/FRONTEND-CONVENTIONS.md']){
  if(!existsSync(join(root,relative)))failures.push(`${relative}: required public guide is missing`);
}
for(const path of documents){
  const content=readFileSync(path,'utf8');
  if(forbiddenLetters.test(content))failures.push(`${path}: Persian-specific text is not allowed`);
  for(const marker of forbiddenMarkers)if(marker.test(content))failures.push(`${path}: private marker ${marker} is not allowed`);
  for(const match of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)){
    const target=match[1].trim();
    if(!target||target.startsWith('#')||/^(?:https?:|mailto:)/i.test(target))continue;
    const local=target.split('#',1)[0];
    if(local&&!existsSync(resolve(dirname(path),decodeURIComponent(local))))failures.push(`${path}: missing relative link ${target}`);
  }
}
const legacyWarmBrand=/(?:--tiffin-gold|#(?:f6c431|f5c94d|f4c430|f2c94c|fac928|ffd547|e6b520|c99512|e3b11d|c99612|ffda65|ddb43d|c69312|ffdf75))/i;
for(const path of publicVisualSources){
  if(legacyWarmBrand.test(readFileSync(path,'utf8')))failures.push(`${path}: legacy customer-yellow branding is not allowed`);
}
if(failures.length){
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`public repository verification passed documents=${documents.length} visualSources=${publicVisualSources.length}`);
