import {createServer} from 'node:http';
import {createBff} from '@mpfrontend/security-bff';
import {runtimeState} from './runtime-state.mjs';
import {dispatchRoutes} from './dispatch.mjs';
import {mediaReadRoute,mediaRoutes} from './media-routes.mjs';

const app=process.env.APP_KIND??'customer';
if(!['customer','admin'].includes(app))throw new Error('INVALID_APP_KIND');
const gateway=process.env.GATEWAY_ORIGIN??'http://localhost:39080';
const port=Number(process.env.BFF_PORT??4511);
const publicOrigin=process.env.PUBLIC_ORIGIN??'http://localhost:'+(4411+(app==='admin'?1:0));
const routes=[];
const add=(method,pattern,roles)=>routes.push({method,pattern,roles,origin:gateway});

add('POST',/^\/v1\/orders\/?$/,['customer']);
add('GET',/^\/v1\/orders\/?$/,['customer']);
add('GET',/^\/v1\/orders\/[a-fA-F0-9-]{36}$/,['customer']);
add('POST',/^\/v1\/orders\/[a-fA-F0-9-]{36}\/cancel$/,['customer']);
add('GET',/^\/v1\/notifications\/?$/,['customer']);
add('POST',/^\/v1\/notifications\/[a-fA-F0-9-]{36}\/read$/,['customer']);
add('GET',/^\/v1\/tracking\/deliveries\/[a-fA-F0-9-]{36}$/,['customer','courier']);
if(app==='customer')routes.push(mediaReadRoute(gateway,['customer']));
if(app==='admin'){
  routes.push(...dispatchRoutes(gateway));
  add('POST',/^\/v1\/restaurants\/?$/,['restaurant-manager']);
  add('PUT',/^\/v1\/restaurants\/[a-fA-F0-9-]{36}\/menu\/[a-zA-Z0-9-]{1,32}$/,['restaurant-manager']);
  add('POST',/^\/v1\/restaurants\/[a-fA-F0-9-]{36}\/(open|close)$/,['restaurant-manager']);
  add('PUT',/^\/v1\/restaurants\/[a-fA-F0-9-]{36}\/picture$/,['restaurant-manager']);
  add('GET',/^\/v1\/kitchen\/tickets\/?$/,['restaurant-manager']);
  add('POST',/^\/v1\/kitchen\/tickets\/[a-fA-F0-9-]{36}\/(accept|reject)$/,['restaurant-manager']);
  routes.push(...mediaRoutes(gateway));
  add('POST',/^\/v1\/tracking\/deliveries\/[a-fA-F0-9-]{36}\/positions$/,['courier']);
}

const state=await runtimeState({...process.env,APP_KIND:app});
const handler=createBff({publicOrigin,issuer:process.env.OIDC_ISSUER??'http://localhost:38180/realms/tiffin',providerOrigin:process.env.OIDC_PROVIDER_ORIGIN,clientId:'tiffin-app',audience:'tiffin-ordering',cookieName:'tiffin_'+app+'_session',routes,requireTenant:true,tenantExemptRoles:['platform-admin'],supportedUiLocales:['en','ar'],uiLocaleCookie:'tiffin_locale',development:true,sessionVault:state.sessionVault,loginRateLimit:state.loginRateLimit});
const server=createServer(handler).listen(port,process.env.BFF_BIND??'127.0.0.1',()=>console.log('tiffin '+app+' BFF ready on '+port));
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{server.close(()=>void state.close().finally(()=>process.exit(0)));setTimeout(()=>process.exit(1),5000).unref();});
