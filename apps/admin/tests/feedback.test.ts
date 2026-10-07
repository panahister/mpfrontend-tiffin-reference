import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {feedbackText} from '../src/features/operations/feedback.ts';
test('current-language feedback is preserved and old or late previous-language results are hidden without altering feedback',()=>{
  const old={language:'ar' as const,text:'Opaque server text'};
  const before=structuredClone(old);
  assert.equal(feedbackText(old,'ar'),old.text);assert.equal(feedbackText(old,'en'),'');
  assert.equal(feedbackText({language:'en',text:'Saved'},'en'),'Saved');assert.equal(feedbackText(null,'en'),'');
  assert.deepEqual(old,before);
});
test('isolated removal of the language boundary fails the actual stale-feedback assertion',async()=>{
  const root=await mkdtemp(join(tmpdir(),'mpfrontend-feedback-negative-'));
  try{
    const source=await readFile(new URL('../src/features/operations/feedback.ts',import.meta.url),'utf8');
    const marker="feedback?.language===current?feedback.text:''";assert.ok(source.includes(marker));
    const path=join(root,'feedback.ts');await writeFile(path,source.replace(marker,"feedback?.text??''"));
    const child=spawnSync(process.execPath,['--input-type=module','-e','import assert from "node:assert/strict";const {feedbackText}=await import('+JSON.stringify(pathToFileURL(path).href)+');assert.equal(feedbackText({language:"ar",text:"old locale text"},"en"),"");'],{encoding:'utf8'});
    assert.equal(child.status,1);assert.match(child.stderr,/AssertionError/);assert.doesNotMatch(child.stderr,/ERR_MODULE_NOT_FOUND|SyntaxError/);
  }finally{await rm(root,{recursive:true,force:true});}
});
