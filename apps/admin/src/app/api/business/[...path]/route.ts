import {mediate} from '../../../../api/server/presentation';
async function handle(request:Request,{params}:{params:Promise<{path:string[]}>}){
  const {path}=await params;
  if(path.some(segment=>!/^[-a-zA-Z0-9_.]+$/.test(segment)||segment==='.'||segment==='..'))return new Response(null,{status:400});
  return mediate(request,'/v1/'+path.join('/')+new URL(request.url).search);
}
export {handle as GET,handle as POST,handle as PUT,handle as DELETE};
