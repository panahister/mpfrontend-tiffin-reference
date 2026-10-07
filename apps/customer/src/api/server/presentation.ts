import 'server-only';
import {forwardBusiness} from './contract-transport';
const bff=process.env.BFF_ORIGIN??'http://127.0.0.1:4511';
const origin=new URL(bff);
if(!['http:','https:'].includes(origin.protocol)||origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash)throw new Error('INVALID_BFF_ORIGIN');
export async function mediate(request:Request,path:string){return forwardBusiness(request,path,bff);}
