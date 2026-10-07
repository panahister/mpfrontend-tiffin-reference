import {test} from 'node:test';
import assert from 'node:assert/strict';
import {queryParameters} from '../src/api/server/catalog-query.ts';

test('customer catalog asks only for open restaurants with bounded paging and city',()=>{
  const query=queryParameters(new URLSearchParams({search:' austin ',page:'2',size:'24',open:'false'}));
  assert.deepEqual(Object.fromEntries(query),{page:'2',size:'24',city:'austin',open:'true'});
});

test('customer catalog rejects invalid paging instead of forwarding it',()=>{
  for(const query of [
    new URLSearchParams({page:'0'}),
    new URLSearchParams({page:'1.5'}),
    new URLSearchParams({size:'101'}),
    new URLSearchParams({search:' '}),
  ])assert.throws(()=>queryParameters(query),/INVALID_QUERY/);
});
