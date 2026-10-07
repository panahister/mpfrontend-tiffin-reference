import {readFile,lstat,realpath,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {join,resolve,relative,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

// Finite local-cohort gate, not a general YAML parser, signature verifier or advisory audit.
// Only pnpm v9 lockfile stanzas emitted by this pinned consumer are accepted.
const packageNames=['access-core','ai-skills','ftg-cli','ftg-core','i18n','nx-plugin',
  'presentation-server','primitives','realtime-core','security-bff','tokens','ui'];
const digest=(algorithm,bytes)=>createHash(algorithm).update(bytes).digest(algorithm==='sha512'?'base64':'hex');
export function verifyArchiveDigest(entry,bytes){
  if(digest('sha256',bytes)!==entry.sha256)throw new Error('CORE_ARTIFACT_DIGEST_MISMATCH');
}
async function safePath(root,path){
  const target=resolve(root,path),parts=relative(root,target).split(sep);
  if(parts.some(part=>part==='..')||target===root)throw new Error('CORE_ARTIFACT_PATH_ESCAPE');
  let current=root;
  for(const part of parts){
    current=join(current,part);
    if((await lstat(current)).isSymbolicLink())throw new Error('CORE_ARTIFACT_SYMLINK');
  }
  return target;
}
async function safeRead(root,path){const file=await safePath(root,path);
  if(!(await lstat(file)).isFile())throw new Error('CORE_ARTIFACT_NOT_FILE');return readFile(file);}
function exactKeys(value,keys){return value&&typeof value==='object'&&!Array.isArray(value)&&
  Object.keys(value).sort().join(',')===[...keys].sort().join(',');}
function section(text,name,next){
  const start='\n'+name+':\n',end='\n'+next+':\n';
  if(text.split(start).length!==2||text.split(end).length!==2)throw new Error('UNSUPPORTED_CORE_LOCKFILE_PROFILE');
  return text.split(start)[1].split(end)[0];
}
export async function verifyCoreArtifacts({root=fileURLToPath(new URL('../',import.meta.url))}={}){
  root=await realpath(root);
  const inventory=JSON.parse(await safeRead(root,'core-artifacts.lock.json'));
  if(!exactKeys(inventory,['schemaVersion','packages'])||inventory.schemaVersion!==1||
    !Array.isArray(inventory.packages)||inventory.packages.length!==packageNames.length)throw new Error('INVALID_CORE_COHORT');
  const entries=new Map();
  for(const entry of inventory.packages){
    if(!exactKeys(entry,['name','version','file','sha256','exports'])||
      typeof entry.name!=='string'||!packageNames.some(name=>entry.name==='@mpfrontend/'+name)||
      typeof entry.version!=='string'||!/^\d+\.\d+\.\d+-dev\.\d+$/.test(entry.version)||
      entry.file!==entry.name.replace('@','').replace('/','-')+'-'+entry.version+'.tgz'||
      !/^[a-f0-9]{64}$/.test(entry.sha256)||!Number.isSafeInteger(entry.exports)||entry.exports<1||
      entries.has(entry.name))throw new Error('INVALID_CORE_COHORT_ENTRY');
    entries.set(entry.name,entry);
  }
  const manifestPaths=['package.json'];
  for(const folder of ['apps','packages','themes']){
    const directory=await safePath(root,folder);
    for(const item of await readdir(directory,{withFileTypes:true})){
      if(item.isSymbolicLink())throw new Error('CORE_ARTIFACT_SYMLINK');
      if(item.isDirectory())manifestPaths.push(folder+'/'+item.name+'/package.json');
    }
  }
  let declarations=0;
  for(const path of manifestPaths){
    const manifest=JSON.parse(await safeRead(root,path)),directory=join(root,path,'..');
    for(const section of ['dependencies','devDependencies','optionalDependencies'])
      for(const [name,spec] of Object.entries(manifest[section]??{})){
        if(!name.startsWith('@mpfrontend/'))continue;
        const entry=entries.get(name);
        if(!entry||typeof spec!=='string'||!spec.startsWith('file:')||
          resolve(directory,spec.slice(5))!==join(root,'artifacts/packages',entry.file))throw new Error('CORE_MANIFEST_COHORT_MISMATCH');
        declarations++;
      }
  }
  if(!declarations)throw new Error('CORE_MANIFEST_COHORT_MISMATCH');
  const workspace=(await safeRead(root,'pnpm-workspace.yaml')).toString();
  const overrideSection=section('\n'+workspace,'overrides','allowBuilds');
  for(const line of overrideSection.split('\n').filter(line=>line.includes('@mpfrontend/'))){
    const match=/^  '(@mpfrontend\/[a-z0-9-]+)': file:artifacts\/packages\/([^\s]+)$/.exec(line);
    if(!match||entries.get(match[1])?.file!==match[2])throw new Error('CORE_OVERRIDE_COHORT_MISMATCH');
  }
  const lockBytes=await safeRead(root,'pnpm-lock.yaml'),lock=lockBytes.toString();
  if(!lock.startsWith("lockfileVersion: '9.0'\n"))throw new Error('UNSUPPORTED_CORE_LOCKFILE_PROFILE');
  const packages=section(lock,'packages','snapshots');
  const headers=[...packages.matchAll(/^  '(@mpfrontend\/[a-z0-9-]+)@file:artifacts\/packages\/([^']+)':$/gm)];
  if(headers.length!==entries.size||new Set(headers.map(match=>match[1])).size!==entries.size)throw new Error('CORE_LOCKFILE_COHORT_MISMATCH');
  for(const header of headers){
    const entry=entries.get(header[1]);
    if(!entry||entry.file!==header[2])throw new Error('CORE_LOCKFILE_COHORT_MISMATCH');
    const bytes=await safeRead(root,'artifacts/packages/'+entry.file);verifyArchiveDigest(entry,bytes);
    const block=packages.slice(header.index+header[0].length).split(/\n  \S/)[0];
    const expected='    resolution: {integrity: sha512-'+digest('sha512',bytes)+', tarball: file:artifacts/packages/'+entry.file+'}';
    if(block.split('\n').filter(line=>line.trim().startsWith('resolution:')).length!==1||
      !block.split('\n').includes(expected)||!block.split('\n').includes('    version: '+entry.version))
      throw new Error('CORE_LOCKFILE_INTEGRITY_MISMATCH');
  }
  return {ok:true,profile:'local-packed-cohort-pnpm9',packages:entries.size,manifests:manifestPaths.length,
    declarations,lockfileSha256:digest('sha256',lockBytes),audit:'not-run'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==2)throw new Error('UNSUPPORTED_CORE_ARTIFACT_ARGUMENT');
  console.log(JSON.stringify(await verifyCoreArtifacts()));
}
