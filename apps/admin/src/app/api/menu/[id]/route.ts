import {backendOrigin} from '../../../../config/server';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params,city=new URL(request.url).searchParams.get('city')??'seattle';
  if(!/^[a-fA-F0-9-]{36}$/.test(id)||!['seattle','austin'].includes(city))return new Response(null,{status:400});
  try{const response=await fetch(backendOrigin+'/v1/restaurants/'+id+'/menu?city='+city,{cache:'no-store',headers:{'Accept-Language':request.headers.get('Accept-Language')??'en'},signal:AbortSignal.timeout(10000)});return new Response(await response.text(),{status:response.status,headers:{'content-type':'application/json','cache-control':'no-store'}});}
  catch{return Response.json({title:'MENU_UNAVAILABLE'},{status:503});}
}
