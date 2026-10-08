import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {chmod,copyFile,mkdir,open,stat} from 'node:fs/promises';
import {dirname,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
const backend=resolve(root,process.env.TIFFIN_BACKEND_SOURCE_DIR??'../mpcore-tiffin-sample');
const keyPath=resolve(root,'.runtime/session-key/primary.key');
const sourceCertificate=resolve(backend,'infrastructure/apisix/generated/localhost.crt');
const localCertificate=resolve(root,'bff/certs/gateway.crt');

async function ensureValidationKey(){
  await mkdir(dirname(keyPath),{recursive:true,mode:0o700});
  let file;
  try{
    file=await open(keyPath,'wx',0o600);
    await file.writeFile(randomBytes(32));
    await file.sync();
  }catch(error){
    if(error.code!=='EEXIST')throw error;
  }finally{
    await file?.close();
  }
  const info=await stat(keyPath);
  if(!info.isFile()||info.size!==32)throw new Error('INVALID_LOCAL_SESSION_KEY');
  await chmod(keyPath,0o600);
}

async function prepareGatewayTrust(){
  await mkdir(dirname(localCertificate),{recursive:true});
  try{
    await copyFile(sourceCertificate,localCertificate);
  }catch(error){
    if(error.code==='ENOENT'){
      throw new Error(`GATEWAY_CERTIFICATE_NOT_FOUND: start the Docker backend first with ${backend}/scripts/full-demo.sh up-backend`);
    }
    throw error;
  }
  await chmod(localCertificate,0o600);
}

await ensureValidationKey();
await prepareGatewayTrust();

const common={
  ...process.env,
  NEXT_TELEMETRY_DISABLED:'1',
  SESSION_PROFILE:'redis-validation',
  SESSION_REDIS_URL:'redis://127.0.0.1:36379',
  SESSION_NAMESPACE:'tiffin-frontend-dev',
  SESSION_KEY_FILE:keyPath,
};

const processes=[
  {
    name:'customer BFF',
    module:'bff/server.mjs',
    env:{APP_KIND:'customer',BFF_BIND:'127.0.0.1',BFF_PORT:'4511',PUBLIC_ORIGIN:'http://localhost:4411',GATEWAY_ORIGIN:'http://localhost:39080',OIDC_ISSUER:'http://localhost:38180/realms/tiffin',OIDC_PROVIDER_ORIGIN:'http://localhost:38180'},
  },
  {
    name:'operations BFF',
    module:'bff/server.mjs',
    env:{APP_KIND:'admin',BFF_BIND:'127.0.0.1',BFF_PORT:'4512',PUBLIC_ORIGIN:'http://localhost:4412',GATEWAY_ORIGIN:'http://localhost:39080',GRPC_GATEWAY_TARGET:'localhost:39443',OIDC_ISSUER:'http://localhost:38180/realms/tiffin',OIDC_PROVIDER_ORIGIN:'http://localhost:38180'},
  },
  {
    name:'customer presentation',
    module:'presentation/server.mjs',
    env:{APP_KIND:'customer',APP_PORT:'4411',PUBLIC_ORIGIN:'http://localhost:4411',BFF_ORIGIN:'http://127.0.0.1:4511',BACKEND_ORIGIN:'http://localhost:39080',MEDIA_PUBLIC_ORIGIN:'http://localhost:39000',ENABLE_API_DOCS:'true',PRESENTATION_DEV:'true'},
  },
  {
    name:'operations presentation',
    module:'presentation/server.mjs',
    env:{APP_KIND:'admin',APP_PORT:'4412',PUBLIC_ORIGIN:'http://localhost:4412',BFF_ORIGIN:'http://127.0.0.1:4512',BACKEND_ORIGIN:'http://localhost:39080',MEDIA_PUBLIC_ORIGIN:'http://localhost:39000',ENABLE_API_DOCS:'true',PRESENTATION_DEV:'true'},
  },
];

const children=[];
let stopping=false;

function stop(exitCode=0){
  if(stopping)return;
  stopping=true;
  for(const child of children)if(child.exitCode===null&&!child.killed)child.kill('SIGTERM');
  const timer=setTimeout(()=>{
    for(const child of children)if(child.exitCode===null&&!child.killed)child.kill('SIGKILL');
    process.exit(exitCode);
  },5000);
  timer.unref();
  Promise.all(children.map(child=>new Promise(resolveExit=>{
    if(child.exitCode!==null)return resolveExit();
    child.once('exit',resolveExit);
  }))).then(()=>process.exit(exitCode));
}

for(const definition of processes){
  const child=spawn(process.execPath,[definition.module],{
    cwd:root,
    env:{...common,...definition.env},
    stdio:'inherit',
  });
  children.push(child);
  child.once('error',error=>{
    console.error(`${definition.name} could not start: ${error.message}`);
    stop(1);
  });
  child.once('exit',(code,signal)=>{
    if(stopping)return;
    console.error(`${definition.name} stopped unexpectedly (${signal??`exit ${code}`})`);
    stop(code===0?1:(code??1));
  });
}

console.log('Tiffin frontend source mode is starting: Customer http://localhost:4411 · Operations http://localhost:4412');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop(0));
await new Promise(()=>{});
