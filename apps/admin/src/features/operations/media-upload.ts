import type {ReadModels} from '../catalog/model/generated/read-models.gen';

export type MediaUploadTicket=ReadModels['reserve-media-upload'];

export function validateMediaUploadTicket(ticket:MediaUploadTicket,file:Blob,allowedOrigin:string,now=Date.now()){
  const target=new URL(ticket.uploadUrl);
  if(!['http:','https:'].includes(target.protocol)||target.username||target.password||target.origin!==allowedOrigin)
    throw new Error('INVALID_UPLOAD_DESTINATION');
  const expires=Date.parse(ticket.expiresOnUtc);
  if(ticket.method!=='PUT'||ticket.contentType!==file.type||ticket.size!==file.size||!Number.isFinite(expires)||expires<=now)
    throw new Error('INVALID_UPLOAD_TICKET');
  return target;
}

export async function uploadMediaObject(ticket:MediaUploadTicket,file:Blob,options:{allowedOrigin:string;transport?:typeof fetch;signal?:AbortSignal;now?:number}){
  const target=validateMediaUploadTicket(ticket,file,options.allowedOrigin,options.now);
  const signal=AbortSignal.any([AbortSignal.timeout(20000),...(options.signal?[options.signal]:[])]);
  let response:Response;
  try{response=await (options.transport??fetch)(target,{method:'PUT',headers:{'Content-Type':ticket.contentType},body:file,
    credentials:'omit',redirect:'error',cache:'no-store',referrerPolicy:'no-referrer',signal});}
  catch(error){if(error instanceof DOMException&&error.name==='AbortError')throw error;throw new Error('MEDIA_UPLOAD_FAILED');}
  if(!response.ok)throw new Error('MEDIA_UPLOAD_FAILED');
}
