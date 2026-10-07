import {mutationContract,validateMutationRequest,validateMutationResponse} from '../../features/catalog/model/contract-boundary';
const maxBody=65536,maxReply=2*1024*1024;
async function boundedBytes(body:ReadableStream<Uint8Array>,limit:number){
  const reader=body.getReader(),chunks:Uint8Array[]=[];let size=0;
  try{
    while(true){const part=await reader.read();if(part.done)break;size+=part.value.byteLength;
      if(size>limit){await reader.cancel();throw new Error('BODY_TOO_LARGE');}chunks.push(part.value);}
  }finally{reader.releaseLock();}
  const bytes=new Uint8Array(size);let offset=0;
  for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return bytes;
}
function problem(status:number,title:string){
  return Response.json({status,title},{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
}
// Product-owned contract boundary; not an authentication/authorization replacement.
export async function forwardBusiness(request:Request,path:string,bff:string,transport:typeof fetch=fetch){
  const contract=mutationContract(request.method,path.replace(/^\/v1\//,'/api/business/'));
  const headers=new Headers();
  for(const name of ['cookie','origin','content-type','accept-language','x-csrf-token','idempotency-key']){
    const value=request.headers.get(name);if(value)headers.set(name,value);
  }
  let bytes:Uint8Array<ArrayBuffer>|undefined;
  try{
    if(request.body&&request.method!=='GET'){
      if(Number(request.headers.get('content-length'))>maxBody)return problem(413,'BODY_TOO_LARGE');
      try{bytes=await boundedBytes(request.body,maxBody);}catch{return problem(413,'BODY_TOO_LARGE');}
    }
    if(contract){
      if(!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type')??''))return problem(415,'JSON_REQUIRED');
      if('body' in contract&&contract.body==='none'){
        try{if(bytes?.byteLength)throw new Error('BODY_NOT_ALLOWED');validateMutationRequest(contract,undefined);}
        catch{return problem(400,'INVALID_API_REQUEST');}
      }else{
        try{validateMutationRequest(contract,JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes)));}
        catch{return problem(400,'INVALID_API_REQUEST');}
      }
    }
    const response=await transport(bff+path,{method:request.method,headers,...(bytes?{body:bytes}:{}),redirect:'manual',cache:'no-store',signal:AbortSignal.any([request.signal,AbortSignal.timeout(20000)])});
    const safe=new Headers({'cache-control':'no-store','x-content-type-options':'nosniff'});
    for(const name of ['content-type','location','x-correlation-id','idempotency-replayed']){
      const value=response.headers.get(name);if(value)safe.set(name,value);
    }
    for(const value of response.headers.getSetCookie())safe.append('set-cookie',value);
    if(response.status===204){
      const result=response.body?await boundedBytes(response.body,maxReply):new Uint8Array();
      if(contract&&response.ok){
        try{if(result.byteLength)throw new Error('BODY_NOT_ALLOWED');validateMutationResponse(contract,response.status,undefined);}
        catch{return problem(502,'INVALID_API_RESPONSE');}
      }
      return new Response(null,{status:response.status,headers:safe});
    }
    if([205,304].includes(response.status)){
      if(contract&&response.ok)return problem(502,'INVALID_API_RESPONSE');
      return new Response(null,{status:response.status,headers:safe});
    }
    const result=response.body?await boundedBytes(response.body,maxReply):new Uint8Array();
    if(contract&&response.ok){
      if(!/^application\/json(?:\s*;|$)/i.test(response.headers.get('content-type')??''))return problem(502,'INVALID_API_RESPONSE');
      try{validateMutationResponse(contract,response.status,JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(result)));}
      catch{return problem(502,'INVALID_API_RESPONSE');}
    }
    return new Response(result,{status:response.status,headers:safe});
  }catch{return problem(503,'SERVICE_UNAVAILABLE');}
}
