import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {mediaPicture} from '../src/api/server/media-picture.ts';
import {resources} from '../src/features/catalog/model/generated/resources.gen.ts';

const id='01a1164e-946a-7c63-a9f0-1b376040dd40';
const base={
  availableOnUtc:'2026-10-07T12:00:00Z',city:'seattle',contentType:'image/png',
  downloadUrl:'http://localhost:39000/tiffin-media/seattle/menu-picture/object?signature=opaque',
  downloadUrlExpiresOnUtc:'2099-10-07T12:05:00Z',fileName:'dish.png',mediaId:id,
  purpose:'menu-picture',reservedOnUtc:'2026-10-07T11:59:00Z',size:1024,state:'Available'
};
const request=new Request('http://localhost:4411/api/picture/'+id,{headers:{cookie:'session=opaque'}});
const reader=(value:Record<string,unknown>=base,status=200)=>async(_request:Request,path:string)=>{
  assert.equal(path,'/v1/media/'+id);
  return Response.json(value,{status,headers:{'set-cookie':'refreshed=opaque; HttpOnly'}});
};

test('authenticated Media metadata becomes only a short-lived same-origin object-store redirect',async()=>{
  const response=await mediaPicture(request,id,reader(),Date.parse('2026-10-07T12:00:00Z'));
  assert.equal(response.status,307);
  assert.equal(response.headers.get('location'),base.downloadUrl);
  assert.equal(response.headers.get('cache-control'),'private, no-store');
  assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  assert.equal(response.headers.getSetCookie().length,1);
});

test('picture boundary rejects wrong identity, state, purpose, type, host and expiry',async()=>{
  const now=Date.parse('2026-10-07T12:00:00Z');
  const cases=[
    {...base,mediaId:'01a1164e-95a5-70ab-9540-f0cb599f28a0'},
    {...base,state:'Pending'},
    {...base,purpose:'profile-picture'},
    {...base,contentType:'text/html'},
    {...base,downloadUrl:'https://objects.example.invalid/object?signature=opaque'},
    {...base,downloadUrlExpiresOnUtc:'2026-10-07T11:59:59Z'}
  ];
  for(const value of cases)assert.notEqual((await mediaPicture(request,id,reader(value),now)).status,307);
  assert.equal((await mediaPicture(request,'not-a-uuid',reader(),now)).status,400);
});

test('customer projection and BFF explicitly select only authenticated GET Media',async()=>{
  const media=resources.find(resource=>resource.operationId==='GetMedia');
  assert.ok(media);assert.equal(media.method,'get');assert.equal(media.path,'/api/business/media/{mediaId}');
  const server=await readFile(new URL('../../../bff/server.mjs',import.meta.url),'utf8');
  assert.match(server,/app==='customer'.*mediaReadRoute\(gateway,\['customer'\]\)/);
  const routes=await readFile(new URL('../../../bff/media-routes.mjs',import.meta.url),'utf8');
  assert.match(routes,/mediaReadRoute\(origin,allowedRoles\).*method:'GET'/s);
});
