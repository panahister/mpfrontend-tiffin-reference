import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mediaPicture} from '../src/api/server/media-picture.ts';

test('admin picture route preserves the same strict Media redirect boundary',async()=>{
  const id='01a1164e-946a-7c63-a9f0-1b376040dd40';
  const view={availableOnUtc:'2026-10-07T12:00:00Z',city:'seattle',contentType:'image/png',downloadUrl:'http://localhost:39000/tiffin-media/object?signature=opaque',downloadUrlExpiresOnUtc:'2099-10-07T12:05:00Z',fileName:'dish.png',mediaId:id,purpose:'menu-picture',reservedOnUtc:'2026-10-07T11:59:00Z',size:1024,state:'Available'};
  const response=await mediaPicture(new Request('http://localhost:4412/api/picture/'+id),id,async()=>Response.json(view),Date.parse('2026-10-07T12:00:00Z'));
  assert.equal(response.status,307);assert.equal(response.headers.get('location'),view.downloadUrl);
});
