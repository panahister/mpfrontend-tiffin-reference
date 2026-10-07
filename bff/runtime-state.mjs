import {readFile} from 'node:fs/promises';
import {createRedisSessionVault} from '@mpfrontend/security-bff/session-store';

// Both the BFF and presentation replica use this consumer-owned deployment binding.
// Redis is opt-in validation, not a production bypass. Never fall back on connection/key errors.
export async function runtimeState(env=process.env){
  const profile=env.SESSION_PROFILE??'memory';
  if(profile==='memory')return {sessionVault:undefined,ticketStore:undefined,close:async()=>{}};
  if(profile!=='redis-validation')throw new Error('INVALID_SESSION_PROFILE');
  if(env.NODE_ENV==='production')throw new Error('PRODUCTION_RUNTIME_NOT_ACCEPTED');
  if(!env.SESSION_REDIS_URL||!env.SESSION_KEY_FILE||!env.SESSION_NAMESPACE)throw new Error('SESSION_CONFIGURATION_REQUIRED');
  if(!['customer','admin'].includes(env.APP_KIND))throw new Error('INVALID_APP_KIND');
  const key=await readFile(env.SESSION_KEY_FILE);
  const sessionVault=await createRedisSessionVault({url:env.SESSION_REDIS_URL,
    namespace:env.SESSION_NAMESPACE+'-tiffin-'+env.APP_KIND,activeKeyId:'primary',keys:{primary:key}});
  const ticketStore={
    async issue(id,ticket){if(!await sessionVault.limits.take('ticket',ticket.cookieHash))throw Object.assign(new Error('TICKET_LIMIT'),{status:429});await sessionVault.create('transaction','realtime:'+id,ticket,ticket.expires);},
    async consume(id){return (await sessionVault.consume('transaction','realtime:'+id))?.value;}
  };
  return {sessionVault,ticketStore,connectionBudget:sessionVault.limits.connections,
    loginRateLimit:peer=>sessionVault.limits.take('login',peer),close:()=>sessionVault.close()};
}
