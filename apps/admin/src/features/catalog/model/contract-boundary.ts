import {requests} from './generated/requests.gen';
import {resources} from './generated/resources.gen';
import {parseRequest,type RequestModels} from './generated/request-models.gen';
import {parseRead,type ReadModels} from './generated/read-models.gen';

export function matchesContractPath(template:string,path:string){
  const actual=path.split('?')[0].replace(/\/$/,'').split('/'),expected=template.replace(/\/$/,'').split('/');
  if(actual.length!==expected.length)return false;
  return expected.every((segment,index)=>{
    if(!/^\{[A-Za-z][A-Za-z0-9]*\}$/.test(segment))return segment.toLowerCase()===actual[index].toLowerCase();
    try{const value=decodeURIComponent(actual[index]);return Boolean(value)&&!['.','..'].includes(value)&&!/[\/\\?#]/.test(value);}
    catch{return false;}
  });
}
export function mutationContract(method:string,path:string){
  const candidates=requests.filter(request=>request.method===method.toLowerCase()&&matchesContractPath(request.path,path));
  if(candidates.length>1)throw new Error('AMBIGUOUS_REQUEST_CONTRACT');
  return candidates[0]??null;
}
export type MutationContract=NonNullable<ReturnType<typeof mutationContract>>;
export function validateMutationRequest(contract:MutationContract|null,payload:unknown){
  if(contract)parseRequest(contract.name as keyof RequestModels,payload);
}
export function validateMutationResponse(contract:MutationContract|null,status:number,value:unknown){
  if(!contract)return value;
  const models=resources.filter(resource=>resource.operationId===contract.operationId&&resource.method===contract.method&&resource.path===contract.path);
  if(models.length!==1||String(status)!==(models[0].responseStatus??'200'))throw new Error('UNEXPECTED_API_SUCCESS_STATUS');
  return parseRead(models[0].name as keyof ReadModels,value);
}
