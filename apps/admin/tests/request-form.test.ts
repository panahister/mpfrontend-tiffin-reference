import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {acceptancePayload,AcceptTicketForm} from '../src/features/operations/request-form';
test('authored scalar draft validates final generated request without copying a response or coercing inputs',()=>{
  const valid={readyInMinutes:20},before=structuredClone(valid);
  assert.deepEqual(acceptancePayload(valid),valid);assert.deepEqual(valid,before);
  for(const invalid of [{readyInMinutes:4},{readyInMinutes:181},{readyInMinutes:5.5}])assert.throws(()=>acceptancePayload(invalid));
  assert.throws(()=>acceptancePayload({...valid,serverOwned:true}),/INVALID_API_REQUEST/);
});
test('actual packed ResourceForm renders generated fields with consumer English/Arabic labels and disables submission',()=>{
  for(const ar of [false,true]){
    const html=renderToStaticMarkup(createElement(AcceptTicketForm,{ar,disabled:true,onSubmit:()=>{throw new Error('MUST_NOT_SUBMIT');}}));
    assert.match(html,/class="mp-form /);assert.match(html,/disabled=""/);
    assert.match(html,/name="readyInMinutes"/);
    assert.ok(html.includes(ar?'مدة التحضير بالدقائق':'Ready in minutes'));
    assert.ok(!html.includes('serverOwned'));
  }
});
