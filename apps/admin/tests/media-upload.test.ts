import {test} from 'node:test';
import assert from 'node:assert/strict';
import {uploadMediaObject,validateMediaUploadTicket,type MediaUploadTicket} from '../src/features/operations/media-upload';

const now=Date.parse('2026-10-07T08:45:00Z');
const file=new Blob(['picture'],{type:'image/png'});
const ticket:MediaUploadTicket={
  mediaId:'b50c40a4-fb7b-4ea1-926f-fc9e3df50d25',
  uploadUrl:'http://localhost:39000/tiffin-media/object?X-Amz-Signature=secret',
  method:'PUT',contentType:'image/png',size:file.size,expiresOnUtc:'2026-10-07T08:55:00Z'
};

test('a signed upload ticket is bound to the selected file, exact PUT method, origin and live window',()=>{
  assert.equal(validateMediaUploadTicket(ticket,file,'http://localhost:39000',now).href,ticket.uploadUrl);
  for(const changed of [
    {...ticket,method:'POST'},
    {...ticket,contentType:'image/jpeg'},
    {...ticket,size:file.size+1},
    {...ticket,expiresOnUtc:'2026-10-07T08:45:00Z'},
    {...ticket,expiresOnUtc:'not-a-date'},
    {...ticket,uploadUrl:'http://user:password@localhost:39000/object'},
    {...ticket,uploadUrl:'https://uploads.invalid/object'}
  ])assert.throws(()=>validateMediaUploadTicket(changed,file,'http://localhost:39000',now),/INVALID_UPLOAD_TICKET|INVALID_UPLOAD_DESTINATION/);
});

test('the direct object-store PUT omits browser credentials, refuses redirects and carries the caller cancellation fence',async()=>{
  const controller=new AbortController();let calls=0;
  const transport:typeof fetch=async(url,init)=>{
    calls++;assert.equal(String(url),ticket.uploadUrl);assert.equal(init?.method,'PUT');
    assert.equal(new Headers(init?.headers).get('content-type'),'image/png');assert.equal(init?.body,file);
    assert.equal(init?.credentials,'omit');assert.equal(init?.redirect,'error');assert.equal(init?.cache,'no-store');
    assert.ok(init?.signal);return new Response(null,{status:200});
  };
  await uploadMediaObject(ticket,file,{allowedOrigin:'http://localhost:39000',transport,signal:controller.signal,now});
  assert.equal(calls,1);
});

test('object-store failure stays generic and never becomes a successful confirmation',async()=>{
  const transport:typeof fetch=async()=>new Response('private upstream detail',{status:503});
  await assert.rejects(uploadMediaObject(ticket,file,{allowedOrigin:'http://localhost:39000',transport,now}),/^Error: MEDIA_UPLOAD_FAILED$/);
});
