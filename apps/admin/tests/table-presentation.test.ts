import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {tableLabels,presentRow} from '../src/features/operations/table-presentation.ts';
test('table headings are readable in English and Arabic rather than protocol keys',()=>{
  const en=tableLabels('en'),ar=tableLabels('ar');
  const key="decidedOnUtc";
  assert.notEqual(en[key],key);assert.notEqual(ar[key],en[key]);assert.ok(ar[key]);
});
test('display projection localizes only declared statuses and dates, preserving identifiers and original payload',()=>{
  const key="decidedOnUtc";
  const row={status:'Accepted',name:'Accepted',entityId:'identifier',quantity:250000,[key]:'2026-10-07T05:00:00Z'};
  const before=structuredClone(row),shown=presentRow(row,Object.keys(row),'ar');
  assert.equal(shown.status,'مقبول');assert.equal(shown.name,'Accepted');assert.equal(shown.entityId,'identifier');
  assert.notEqual(shown[key],row[key]);assert.equal(shown.quantity,new Intl.NumberFormat('ar').format(250000));
  assert.deepEqual(row,before);
});
test('unknown protocol values remain visible and null does not become a boolean',()=>{
  assert.deepEqual(presentRow({status:'FutureState',isAvailable:false,failure:null},['status','isAvailable','failure'],'ar'),{status:'FutureState',isAvailable:'لا',failure:'—'});
});
test('isolated removal of localization fails the actual status assertion',async()=>{
  const folder=await mkdtemp(join(tmpdir(),'mpfrontend-admin-display-control-'));
  try{
    const source=await readFile(new URL('../src/features/operations/table-presentation.ts',import.meta.url),'utf8');
    const marker='text=arabicEnums[value]??value';
    assert.ok(source.includes(marker));
    const fixture=join(folder,'display.ts');
    await writeFile(fixture,source.replace(marker,'text=value'));
    const result=spawnSync(process.execPath,['--input-type=module','--eval',
      'import assert from "node:assert/strict";const {presentRow}=await import('+JSON.stringify(pathToFileURL(fixture).href)+');assert.equal(presentRow({status:"Accepted"},["status"],"ar").status,"مقبول");'],{encoding:'utf8'});
    assert.equal(result.status,1);assert.match(result.stderr,/AssertionError/);
  }finally{await rm(folder,{recursive:true,force:true});}
});
