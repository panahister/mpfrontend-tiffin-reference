import {parseRead} from '../../features/catalog/model/generated/read-models.gen';

export type MediaReader=(request:Request,path:string)=>Promise<Response>;

const mediaId=/^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12}$/;
const allowedPurposes=new Set(['menu-picture','restaurant-picture']);

function empty(status:number,cookies:string[]=[]){
  const headers=new Headers({'cache-control':'no-store','x-content-type-options':'nosniff'});
  for(const cookie of cookies)headers.append('set-cookie',cookie);
  return new Response(null,{status,headers});
}

export async function mediaPicture(request:Request,id:string,read:MediaReader,now=Date.now()){
  if(!mediaId.test(id))return empty(400);
  let response:Response;
  try{response=await read(request,'/v1/media/'+id);}catch{return empty(503);}
  const cookies=response.headers.getSetCookie();
  if(!response.ok)return empty(response.status,cookies);
  let media;
  try{media=parseRead('get-media',await response.json());}catch{return empty(502,cookies);}
  if(media.mediaId.toLowerCase()!==id.toLowerCase()||media.state!=='Available'||!allowedPurposes.has(media.purpose)||!media.contentType.startsWith('image/')||!media.downloadUrl||!media.downloadUrlExpiresOnUtc)return empty(404,cookies);
  let allowed:URL,location:URL;
  try{allowed=new URL(process.env.MEDIA_PUBLIC_ORIGIN??'http://localhost:39000');location=new URL(media.downloadUrl);}
  catch{return empty(502,cookies);}
  const expiry=Date.parse(media.downloadUrlExpiresOnUtc);
  if(!['http:','https:'].includes(allowed.protocol)||allowed.username||allowed.password||allowed.pathname!=='/'||allowed.search||allowed.hash||location.origin!==allowed.origin||location.username||location.password||location.hash||!Number.isFinite(expiry)||expiry<=now)return empty(502,cookies);
  const headers=new Headers({location:location.href,'cache-control':'private, no-store','referrer-policy':'no-referrer','x-content-type-options':'nosniff'});
  for(const cookie of cookies)headers.append('set-cookie',cookie);
  return new Response(null,{status:307,headers});
}
