import {createServer} from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createPresentationRealtime} from '@mpfrontend/presentation-server';
import {runtimeState} from '../bff/runtime-state.mjs';
const kind=process.env.APP_KIND??'customer';
if(!['customer','admin'].includes(kind))throw new Error('INVALID_APP_KIND');
const dir=fileURLToPath(new URL('../apps/'+kind,import.meta.url));
const next=createRequire(new URL('../apps/'+kind+'/package.json',import.meta.url))('next');
const port=Number(process.env.APP_PORT??(kind==='customer'?4411:4412));
const bff=process.env.BFF_ORIGIN??'http://127.0.0.1:'+(kind==='customer'?4511:4512);
const state=await runtimeState({...process.env,APP_KIND:kind});
const realtime=createPresentationRealtime({development:true,ticketStore:state.ticketStore,connectionBudget:state.connectionBudget,publicOrigin:process.env.PUBLIC_ORIGIN??'http://localhost:'+port,bffOrigin:bff,resolve:(resource,c)=>{
  if(kind==='customer'&&c.roles.includes('customer')){
    if(resource==='orders')return '/v1/orders?page=1&size=10';
    if(resource==='notifications')return '/v1/notifications/?page=1&size=10';
    if(/^tracking:[a-fA-F0-9-]{36}$/.test(resource))return '/v1/tracking/deliveries/'+resource.slice(9);
  }
  if(kind==='admin'&&resource==='kitchen'&&c.roles.includes('restaurant-manager'))return '/v1/kitchen/tickets/?status=Pending&page=1&size=20';
  if(kind==='admin'&&resource==='courier'&&c.roles.includes('courier'))return '/v1/courier/delivery';
  return undefined;
}});
// Validate the deployment profile before Next selects NODE_ENV for its optimized build.
const app=next({dev:false,dir,hostname:'0.0.0.0',port});await app.prepare();
const handler=app.getRequestHandler();
const server=createServer((req,res)=>{void realtime.handleHttp(req,res).then(handled=>{if(!handled)return handler(req,res);}).catch(()=>{res.writeHead(503);res.end();});});
realtime.attach(server);server.listen(port,'0.0.0.0',()=>console.log('Tiffin '+kind+' presentation ready on '+port));
const stop=()=>{realtime.close();server.close(()=>void state.close().finally(()=>process.exit(0)));setTimeout(()=>process.exit(1),5000).unref();};process.on('SIGTERM',stop);process.on('SIGINT',stop);
