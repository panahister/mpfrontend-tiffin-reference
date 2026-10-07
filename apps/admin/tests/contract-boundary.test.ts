import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {JsonSchema} from '@mpfrontend/ftg-core';
import {requests} from '../src/features/catalog/model/generated/requests.gen';
import {resources} from '../src/features/catalog/model/generated/resources.gen';
import {parseRead} from '../src/features/catalog/model/generated/read-models.gen';
import {matchesContractPath,mutationContract,validateMutationRequest,validateMutationResponse} from '../src/features/catalog/model/contract-boundary';
import {forwardBusiness} from '../src/api/server/contract-transport';
test('bodyless server requires no bytes, forwards guards, and validates the exact JSON success',async()=>{
  const bodyless=requests.filter(request=>'body' in request&&request.body==='none');assert.ok(bodyless.length);
  for(const request of bodyless){
    const path=pathFor(request.path),upstream=path.replace('/api/business/','/v1/');
    const resource=resources.find(resource=>resource.operationId===request.operationId)!;
    const headers={'content-type':'application/json',origin:'http://reference.local','x-csrf-token':'fixture-csrf','idempotency-key':'fixture-key'};
    const input=(bytes?:string)=>new Request('http://reference.local'+path,{method:request.method.toUpperCase(),headers,...(bytes!==undefined?{body:bytes}:{})});
    let calls=0;
    const transport:typeof fetch=async(_url,options)=>{
      calls++;assert.ok(options?.body===undefined||(options.body instanceof Uint8Array&&options.body.byteLength===0));
      assert.equal(new Headers(options?.headers).get('x-csrf-token'),'fixture-csrf');
      assert.equal(new Headers(options?.headers).get('idempotency-key'),'fixture-key');
      return Response.json(fixture(resource.schema),{status:200});
    };
    assert.equal((await forwardBusiness(input(),upstream,'http://fixture.local',transport)).status,200);
    for(const bytes of ['{}','null',' ','false','[]'])assert.equal((await forwardBusiness(input(bytes),upstream,'http://fixture.local',transport)).status,400,'bodyless must reject any supplied bytes');
    assert.equal(calls,1);
    const bad:typeof fetch=async()=>Response.json({},{status:200});
    assert.equal((await forwardBusiness(input(),upstream,'http://fixture.local',bad)).status,502);
    const wrong:typeof fetch=async()=>Response.json(fixture(resource.schema),{status:201});
    assert.equal((await forwardBusiness(input(),upstream,'http://fixture.local',wrong)).status,502);
  }
});
function fixture(schema:JsonSchema):unknown{
  if(schema.enum)return schema.enum[0];
  const types=Array.isArray(schema.type)?schema.type:[schema.type],type=types.find(value=>value!=='null');
  if(type==='object')return Object.fromEntries(Object.entries(schema.properties??{}).filter(([,child])=>!child.readOnly).map(([key,child])=>[key,fixture(child)]));
  if(type==='array')return [fixture(schema.items!)];
  if(type==='string')return schema.format==='uuid'?'b50c40a4-fb7b-4ea1-926f-fc9e3df50d25':schema.format==='date-time'?'2026-10-07T05:00:00Z':schema.format==='uri'?'https://example.invalid/object':'Fixture';
  if(type==='integer'||type==='number')return schema.minimum??1;
  if(type==='boolean')return true;
  throw new Error('UNSUPPORTED_FIXTURE');
}
function selected(){assert.ok(requests.length);return requests[0];}
function pathFor(path:string){return path.replace(/\{[^}]+\}/g,'fixture');}
function input(payload:unknown,contentType='application/json'){
  const request=selected();
  return new Request('http://reference.local'+pathFor(request.path),{method:request.method.toUpperCase(),headers:{'content-type':contentType,'x-csrf-token':'fixture-csrf','idempotency-key':'fixture-key','origin':'http://reference.local'},body:JSON.stringify(payload)});
}
test('all explicit requests reject missing/unknown fields and validate exact success status without changing payloads',()=>{
  for(const request of requests){
    const data='schema' in request?fixture(request.schema):undefined,before=structuredClone(data);
    const contract=mutationContract(request.method.toUpperCase(),pathFor(request.path)+'?city=fixture');
    assert.equal(contract?.operationId,request.operationId);
    validateMutationRequest(contract,data);
    assert.throws(()=>validateMutationRequest(contract,{}),/INVALID_API_REQUEST/);
    assert.throws(()=>validateMutationRequest(contract,{...(data as Record<string,unknown>),undeclared:true}),/INVALID_API_REQUEST/);
    const resource=resources.find(resource=>resource.operationId===request.operationId)!;
    const response='body' in resource&&resource.body==='none'?undefined:fixture(resource.schema);
    validateMutationResponse(contract,Number(resource.responseStatus),response);
    assert.throws(()=>validateMutationResponse(contract,Number(resource.responseStatus)===204?200:204,response),/UNEXPECTED_API_SUCCESS_STATUS/);
    assert.throws(()=>validateMutationResponse(contract,Number(resource.responseStatus),{}),/INVALID_API_RESPONSE/);
    assert.deepEqual(data,before);
  }
});
test('path matcher accounts for route casing/trailing slash but never encoded path boundaries or query authority',()=>{
  assert.equal(matchesContractPath('/api/business/items/{id}','/API/business/items/fixture/?page=1'),true);
  for(const value of ['','%2f','%5c','..','%2e%2e','%3f','%23','%zz'])
    assert.equal(matchesContractPath('/api/business/items/{id}','/api/business/items/'+value),false,value);
  assert.equal(mutationContract('GET',pathFor(selected().path)),null);
  assert.equal(mutationContract('POST','/api/business/not-selected'),null); // Explicit legacy gap, not coverage.
});
test('server rejects malformed/unknown/oversized input before any upstream request, without payload disclosure',async()=>{
  let calls=0;const transport:typeof fetch=async()=>{calls++;throw new Error('MUST_NOT_FORWARD');};
  const upstream=pathFor(selected().path).replace('/api/business/','/v1/');
  for(const [data,type,status]of [[{},'application/json',400],[{private:'not-to-be-disclosed'},'application/json',400],[fixture(selected().schema),'text/plain',415],['x'.repeat(65536),'application/json',413]]as const){
    const response=await forwardBusiness(input(data,type),upstream,'http://fixture.local',transport);
    assert.equal(response.status,status);assert.equal(response.headers.get('cache-control'),'no-store');
    assert.equal((await response.text()).includes('not-to-be-disclosed'),false);
  }
  assert.equal(calls,0);
});
test('server validates successful upstream response and status; forwards CSRF/idempotency and backend error without inventing success',async()=>{
  const request=selected(),resource=resources.find(resource=>resource.operationId===request.operationId)!;
  const upstream=pathFor(request.path).replace('/api/business/','/v1/');
  const body=fixture(request.schema),reply=fixture(resource.schema);
  const transport:typeof fetch=async(url,options)=>{
    assert.equal(String(url),'http://fixture.local'+upstream);
    const headers=new Headers(options?.headers);
    assert.equal(headers.get('x-csrf-token'),'fixture-csrf');assert.equal(headers.get('idempotency-key'),'fixture-key');
    assert.equal(options?.redirect,'manual');
    return Response.json(reply,{status:Number(resource.responseStatus)});
  };
  assert.equal((await forwardBusiness(input(body),upstream,'http://fixture.local',transport)).status,Number(resource.responseStatus));
  for(const status of [204,Number(resource.responseStatus)]) {
    const bad:typeof fetch=async()=>status===204?new Response(null,{status}):Response.json({},{status});
    assert.equal((await forwardBusiness(input(body),upstream,'http://fixture.local',bad)).status,502);
  }
  const refused:typeof fetch=async()=>Response.json({title:'BACKEND_POLICY_DENIED'},{status:403});
  const response=await forwardBusiness(input(body),upstream,'http://fixture.local',refused);
  assert.equal(response.status,403);assert.equal((await response.json()).title,'BACKEND_POLICY_DENIED');
});
test('ReportPosition owns a strict JSON request and an exact zero-byte 204 response',async()=>{
  const request=requests.find(candidate=>candidate.operationId==='ReportPosition');assert.ok(request);
  const resource=resources.find(candidate=>candidate.operationId==='ReportPosition');assert.ok(resource);
  assert.equal('body' in resource&&resource.body,'none');assert.equal(resource.responseStatus,'204');assert.equal('schema' in resource,false);
  const path=pathFor(request.path),contract=mutationContract('POST',path),payload={latitude:25.2048,longitude:55.2708};
  validateMutationRequest(contract,payload);assert.throws(()=>validateMutationRequest(contract,{...payload,altitude:1}),/INVALID_API_REQUEST/);
  assert.equal(validateMutationResponse(contract,204,undefined),undefined);
  for(const value of [null,{},'',false,0,[]])assert.throws(()=>validateMutationResponse(contract,204,value),/INVALID_API_RESPONSE/);
  const incoming=new Request('http://reference.local'+path,{method:'POST',headers:{'content-type':'application/json','x-csrf-token':'fixture-csrf'},body:JSON.stringify(payload)});
  const empty:typeof fetch=async()=>new Response(null,{status:204});
  const accepted=await forwardBusiness(incoming,path.replace('/api/business/','/v1/'),'http://fixture.local',empty);
  assert.equal(accepted.status,204);assert.equal(await accepted.text(),'');
  const bytes:typeof fetch=async()=>{
    const response=new Response('not-empty',{status:200});
    Object.defineProperties(response,{status:{value:204},ok:{value:true}});
    return response;
  };
  const repeated=new Request('http://reference.local'+path,{method:'POST',headers:{'content-type':'application/json','x-csrf-token':'fixture-csrf'},body:JSON.stringify(payload)});
  assert.equal((await forwardBusiness(repeated,path.replace('/api/business/','/v1/'),'http://fixture.local',bytes)).status,502);
});
test('Media read/delete share the declared identity path and exact generated response',()=>{
  const read=resources.find(candidate=>candidate.operationId==='GetMedia');assert.ok(read);
  const deletion=requests.find(candidate=>candidate.operationId==='DeleteMedia');assert.ok(deletion);
  const deleted=resources.find(candidate=>candidate.operationId==='DeleteMedia');assert.ok(deleted);
  assert.equal(read.path,'/api/business/media/{mediaId}');assert.equal(read.method,'get');
  assert.equal(deletion.path,read.path);assert.equal(deletion.method,'delete');
  assert.equal('body' in deletion&&deletion.body,'none');assert.equal(deleted.responseStatus,'200');
  const value=fixture(read.schema),before=structuredClone(value);
  assert.deepEqual(parseRead('get-media',value),value);
  const missing=structuredClone(value) as Record<string,unknown>;delete missing.mediaId;
  assert.throws(()=>parseRead('get-media',missing),/INVALID_API_RESPONSE/);
  const contract=mutationContract('DELETE',pathFor(deletion.path));
  validateMutationRequest(contract,undefined);assert.throws(()=>validateMutationRequest(contract,{}),/INVALID_API_REQUEST/);
  assert.deepEqual(validateMutationResponse(contract,200,value),value);assert.deepEqual(value,before);
});
