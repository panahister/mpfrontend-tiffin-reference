import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

// Product-owned, versioned read projection, not a generic MP Frontend schema coercer.
const root=fileURLToPath(new URL('../',import.meta.url));
const digest=bytes=>createHash('sha256').update(bytes).digest('hex');
const revision='2026-10-07-openapi-metadata-r4';
const sources={tiffin:{ordering:6400,notifications:6900,restaurants:6300,tracking:6800,access:6100,kitchen:6600,media:6200}};
const publicBindings=[['restaurants','GetMenu','/api/menu/{id}',null]];
const bindings={tiffin:[['ordering','ListMyOrders','/api/business/orders',['customer']],['ordering','GetOrder','/api/business/orders/{orderId}',['customer']],['notifications','ListMyNotifications','/api/business/notifications/',['customer']],['tracking','GetTracking','/api/business/tracking/deliveries/{orderId}',['customer','courier']],['media','GetMedia','/api/business/media/{mediaId}',['customer']]]};
const adminBindings=[['kitchen','ListTickets','/api/business/kitchen/tickets/',['restaurant-manager']],['media','GetMedia','/api/business/media/{mediaId}',['restaurant-manager','city-admin']]];

export function projectReadSchema(raw,schemas,depth=0){
  if(depth>32)throw new Error('PROJECTION_RECURSIVE_SCHEMA');
  if(raw.$ref){
    if(!/^#\/components\/schemas\/[A-Za-z0-9_]+$/.test(raw.$ref)||Object.keys(raw).length!==1)throw new Error('PROJECTION_UNSUPPORTED_REFERENCE');
    const schema=schemas[raw.$ref.split('/').at(-1)];if(!schema)throw new Error('PROJECTION_MISSING_REFERENCE');
    return projectReadSchema(schema,schemas,depth+1);
  }
  if(raw.oneOf?.length===2&&Object.keys(raw).length===1){
    const nullBranches=raw.oneOf.filter(branch=>branch.type==='null'&&Object.keys(branch).length===1);
    if(nullBranches.length===1){
      const other=raw.oneOf.find(branch=>branch!==nullBranches[0]);
      const object=projectReadSchema(other,schemas,depth+1);
      if(object.type==='object')return {...object,type:['object','null']};
    }
  }
  if(raw.oneOf||raw.anyOf||raw.allOf)throw new Error('PROJECTION_UNSUPPORTED_COMPOSITION');
  const next={...raw};
  if(!next.type&&next.enum){
    const types=[...new Set(next.enum.map(value=>value===null?'null':typeof value))];
    if(!next.enum.length||types.some(type=>!['string','number','boolean','null'].includes(type))||types.filter(type=>type!=='null').length!==1)throw new Error('PROJECTION_UNSUPPORTED_ENUM');
    next.type=types.length===1?types[0]:types;
  }
  if(Array.isArray(next.type)&&next.type.includes('string')&&(next.type.includes('number')||next.type.includes('integer'))){
    // .NET's AllowReadingFromString input annotation also appears in output docs. The consumer
    // only accepts JSON numbers; it never converts strings or relaxes the backend's constraints.
    next.type=next.type.filter(type=>type!=='string');if(next.type.length===1)next.type=next.type[0];
    delete next.pattern;
  }
  if(next.properties){
    next.properties=Object.fromEntries(Object.entries(next.properties).map(([name,schema])=>[name,projectReadSchema(schema,schemas,depth+1)]));
    // Computed Page.hasMore/pageCount are serialized, although required metadata omits getters.
    if(next.properties.items&&next.properties.hasMore&&next.properties.pageCount)
      next.required=[...new Set([...(next.required??[]),'hasMore','pageCount'])];
  }
  if(next.items)next.items=projectReadSchema(next.items,schemas,depth+1);
  if(typeof next.additionalProperties==='object')next.additionalProperties=projectReadSchema(next.additionalProperties,schemas,depth+1);
  return next;
}

export function protectedPaths(product,documents,app='customer'){
  return Object.fromEntries([...(app==='admin'?adminBindings:bindings[product]),...publicBindings].map(([source,operationId,path,roles])=>{
    const document=documents[source];if(!document.openapi?.startsWith('3.1.'))throw new Error('PROJECTION_REQUIRES_OPENAPI_3_1');
    const matches=Object.entries(document.paths).flatMap(([upstreamPath,item])=>Object.entries(item)
      .filter(([method,operation])=>method==='get'&&operation.operationId===operationId).map(([,operation])=>({operation,upstreamPath})));
    if(matches.length!==1)throw new Error('PROJECTION_OPERATION_AMBIGUOUS');
    const {operation,upstreamPath}=matches[0],schema=operation.responses?.['200']?.content?.['application/json']?.schema;
    if(!schema)throw new Error('PROJECTION_MISSING_SUCCESS_SCHEMA');
    const parameters=(operation.parameters??[]).map(parameter=>({...parameter,...(operationId==='GetMenu'&&parameter.name==='restaurantId'?{name:'id'}:{}),schema:projectReadSchema(parameter.schema,document.components.schemas)}));
    return [path,{get:{operationId,summary:roles?'Authenticated '+app+' read; backend enforces approved roles, ownership and city/tenant scope':'Public restaurant menu advertisement; never a permission to modify it',
      ...(roles?{'x-required-roles':roles}:{}),
      'x-upstream':{source,path:upstreamPath,operationId},security:roles?[{bffSession:[]}]:[],parameters,
      responses:{'200':{description:'Versioned numeric JSON read profile (no coercion)',content:{'application/json':{schema:projectReadSchema(schema,document.components.schemas)}}},
        ...(roles?{'401':{description:'Unauthenticated'},'403':{description:'Forbidden'}}:{}),'404':{description:'Not found within the permitted scope'},'503':{description:'Upstream unavailable'}}}}];
  }));
}

const requestBindings={
  customer:[['ordering','PlaceOrder','post','202'],['notifications','MarkNotificationRead','post','200','none'],['ordering','CancelOrder','post','200','optional-json']],
  admin:[['restaurants','RegisterRestaurant','post','201'],['restaurants','SetMenuItem','put','200'],['restaurants','ShowRestaurantPicture','put','200'],['kitchen','AcceptTicket','post','200'],['kitchen','RejectTicket','post','200'],['restaurants','OpenRestaurant','post','200','none'],['restaurants','CloseRestaurant','post','200','none'],['media','ReserveUpload','post','201'],['media','ConfirmUpload','post','200','none'],['media','DeleteMedia','delete','200','none'],['tracking','ReportPosition','post','204',undefined,'none']]
};

export function projectRequestSchema(raw,schemas){
  const projected=projectReadSchema(raw,schemas);
  function close(schema){
    const next={...schema},types=Array.isArray(next.type)?next.type:[next.type];
    if(types.includes('object')){
      if(!next.properties||typeof next.additionalProperties==='object'||next.patternProperties)
        throw new Error('PROJECTION_UNSUPPORTED_REQUEST_OBJECT');
      next.additionalProperties=false;
      next.properties=Object.fromEntries(Object.entries(next.properties).map(([name,child])=>[name,close(child)]));
    }
    if(next.items)next.items=close(next.items);
    return next;
  }
  return close(projected);
}

export function requestPaths(documents,app='customer'){
  const paths={};
  for(const [source,operationId,method,status,bodyProfile,responseProfile]of requestBindings[app]){
    const document=documents[source];
    if(!document?.openapi?.startsWith('3.1.'))throw new Error('PROJECTION_REQUIRES_OPENAPI_3_1');
    const matches=Object.entries(document.paths).filter(([,item])=>item[method]?.operationId===operationId);
    if(matches.length!==1)throw new Error('PROJECTION_OPERATION_AMBIGUOUS');
    const[upstreamPath,item]=matches[0],operation=item[method];
    const body=operation.requestBody;
    if(bodyProfile==='none'&&Object.hasOwn(operation,'requestBody'))throw new Error('PROJECTION_BODY_PROFILE_MISMATCH');
    if(bodyProfile==='optional-json'&&(body?.required===true||!body?.content?.['application/json']?.schema))
      throw new Error('PROJECTION_OPTIONAL_JSON_BODY_PROFILE_MISMATCH');
    if(bodyProfile!=='none'&&bodyProfile!=='optional-json'&&(body?.required!==true||!body.content?.['application/json']?.schema))
      throw new Error('PROJECTION_REQUIRES_REQUIRED_JSON_BODY');
    const response=operation.responses?.[status],success=response?.content?.['application/json']?.schema;
    if(responseProfile==='none'){
      if(status!=='204'||!response||Object.hasOwn(response,'content'))throw new Error('PROJECTION_RESPONSE_PROFILE_MISMATCH');
    }else if(!success)throw new Error('PROJECTION_MISSING_SUCCESS_SCHEMA');
    const path=upstreamPath.replace(/^\/v1\//,'/api/business/');
    paths[path]={...(paths[path]??{}),[method]:{
      operationId,summary:'Explicit '+app+' mutation; backend remains the authorization and business-rule authority',
      'x-request-profile':bodyProfile==='none'?'bodyless-v1':bodyProfile==='optional-json'?'optional-json-v1':'closed-declared-fields-v1',
      'x-response-profile':responseProfile==='none'?'empty-v1':'json-v1',
      'x-upstream':{source,path:upstreamPath,operationId},
      security:[{bffSession:[]}],
      parameters:(operation.parameters??[]).map(parameter=>({...parameter,schema:projectReadSchema(parameter.schema,document.components.schemas)})),
      ...(bodyProfile==='none'?{}:{requestBody:{required:bodyProfile!=='optional-json',content:{'application/json':{schema:projectRequestSchema(body.content['application/json'].schema,document.components.schemas)}}}}),
      responses:{[status]:responseProfile==='none'?{description:'Upstream declared success; exact empty response profile'}:{description:'Upstream declared success; consumer numeric JSON response profile',content:{'application/json':{schema:projectReadSchema(success,document.components.schemas)}}},
        '400':{description:'Invalid declared request'},'401':{description:'Unauthenticated'},'403':{description:'Forbidden'},'409':{description:'Business or concurrency conflict'},'503':{description:'Upstream unavailable'}}
    }};
  }
  return paths;
}

async function main(){
  const capture=process.argv.includes('--capture'),check=process.argv.includes('--check');
  if(capture&&check)throw new Error('CAPTURE_CHECK_CONFLICT');
  for(const product of Object.keys(sources)){
    const contractRoot=join(root,'contracts/openapi');
    const upstream=join(contractRoot,'upstream',revision);if(capture)await mkdir(upstream,{recursive:true});
    const documents={},hashes={};
    for(const[source,port]of Object.entries(sources[product])){
      const file=join(upstream,source+'.json');
      if(capture){
        const response=await fetch('http://localhost:'+port+'/openapi/v1.json',{signal:AbortSignal.timeout(10000)});
        if(!response.ok)throw new Error('UPSTREAM_OPENAPI_UNAVAILABLE');
        const bytes=JSON.stringify(await response.json(),null,2)+'\n';
        try{await writeFile(file,bytes,{flag:'wx'});}catch(error){if(error.code!=='EEXIST'||await readFile(file,'utf8')!==bytes)throw error;}
      }
      const bytes=await readFile(file,'utf8');documents[source]=JSON.parse(bytes);hashes[source]=digest(bytes);
    }
    for(const app of ['customer','admin']){
    const file=join(contractRoot,'presentation',product,app==='admin'?'admin/openapi.json':'openapi.json');
    const current=await readFile(file,'utf8'),document=JSON.parse(current);
    const oldCatalog=product==='storefront'?'/v1/catalog/products':'/v1/restaurants/';
    if(document.paths[oldCatalog]){document.paths['/api/catalog']=document.paths[oldCatalog];delete document.paths[oldCatalog];}
    if(product==='tiffin')for(const parameter of document.paths['/api/catalog'].get.parameters)if(parameter.name==='city')parameter.name='search';
    document.info.title=product+' '+app+' presentation contracts';document.info.version=app==='admin'?'1.7.0':'1.6.0';
    document['x-read-projection']={version:1,upstreamRevision:revision,sha256:hashes,numericProfile:'JSON numbers only; never coerce numeric strings',computedPageFields:'hasMore/pageCount required by the consumer'};
    document.components.securitySchemes={...(document.components.securitySchemes??{}),bffSession:{type:'apiKey',in:'cookie',name:product+'_'+app+'_session',description:'HttpOnly '+app+' BFF session. Do not supply backend bearer tokens in the browser.'}};
    document['x-request-projection']={version:1,upstreamRevision:revision,sha256:hashes,profiles:['closed-declared-fields-v1','bodyless-v1','optional-json-v1'],restriction:'Consumer-only JSON inputs preserve required, absent and optional-null body semantics; object fields are closed and upstream remains unchanged'};
    document['x-response-projection']={version:1,upstreamRevision:revision,sha256:hashes,profiles:['json-v1','empty-v1'],restriction:'Empty success responses are explicit and never represented as null or an empty JSON object'};
    const mutations=requestPaths(documents,app);
    const selectedOperations=new Set(Object.values(mutations).flatMap(item=>Object.values(item).map(operation=>operation.operationId)));
    for(const[path,item]of Object.entries(document.paths)){
      for(const[method,operation]of Object.entries(item)){
        if(operation['x-request-profile']&&!selectedOperations.has(operation.operationId))delete item[method];
        if(app==='admin'&&operation['x-upstream']?.source==='access')delete item[method];
      }
      if(Object.keys(item).length===0)delete document.paths[path];
    }
    for(const additions of [protectedPaths(product,documents,app),mutations])
      for(const[path,item]of Object.entries(additions))document.paths[path]={...(document.paths[path]??{}),...item};
    const bytes=JSON.stringify(document,null,2)+'\n';
    if(check&&bytes!==current)throw new Error('PRESENTATION_CONTRACT_DRIFT');
    if(!check)await writeFile(file,bytes);
    console.log(JSON.stringify({product,app,check,protectedReads:app==='admin'?adminBindings.length:bindings[product].length,publicMenuReads:publicBindings.length,upstreamRevision:revision,sha256:hashes}));
    }
  }
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===process.argv[1])await main();
