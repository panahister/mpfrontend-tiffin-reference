import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import grpc from '@grpc/grpc-js';
import {loadSync} from '@grpc/proto-loader';

const definition=loadSync(fileURLToPath(new URL('../contracts/grpc/tiffin_dispatch.proto',import.meta.url)),{keepCase:false,longs:String,enums:String,defaults:true,oneofs:true});
const proto=grpc.loadPackageDefinition(definition);
export function dispatchRoutes(origin){
  const ca=readFileSync(new URL('./certs/gateway.crt',import.meta.url));
  const client=new proto.tiffin.dispatch.v1.Couriers(process.env.GRPC_GATEWAY_TARGET??'localhost:39443',grpc.credentials.createSsl(ca),{'grpc.ssl_target_name_override':'localhost','grpc.default_authority':'localhost','grpc.max_receive_message_length':65536});
  const routes=[];
  function add(method,path,rpc,parameters){
    routes.push({method,pattern:new RegExp('^'+path+'$'),roles:['courier'],origin,invoke:async({headers,body})=>{
      let payload={};try{payload=body?JSON.parse(Buffer.from(body).toString()):{};}catch{return {status:400,body:{status:400,title:'INVALID_JSON'}};}
      if(rpc==='completeDelivery'&&(!payload.orderId||!/^[-a-fA-F0-9]{36}$/.test(payload.orderId)))return {status:400,body:{status:400,title:'INVALID_ORDER_ID'}};
      const metadata=new grpc.Metadata();metadata.set('authorization',headers.authorization);metadata.set('accept-language',headers['Accept-Language']);
      return await new Promise(resolve=>client[rpc](parameters(payload),metadata,{deadline:new Date(Date.now()+10000)},(error,reply)=>{
        if(error){const status=({3:400,5:404,7:403,9:422,16:401})[error.code]??503;resolve({status,body:{status,title:error.details??'DISPATCH_UNAVAILABLE'}});}
        else resolve({status:200,body:reply});
      }));
    }});
  }
  add('POST','/v1/courier/duty/on','goOnDuty',()=>({}));
  add('POST','/v1/courier/duty/off','goOffDuty',()=>({}));
  add('GET','/v1/courier/delivery','getMyDelivery',()=>({}));
  add('POST','/v1/courier/delivery/complete','completeDelivery',payload=>({orderId:payload.orderId}));
  return routes;
}
