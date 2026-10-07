import {mediate} from '../../../../api/server/presentation';
async function handle(request:Request,{params}:{params:Promise<{path:string[]}>}){
  const {path}=await params;
  if(path.length!==1||!['login','callback','context','logout'].includes(path[0]!))return new Response(null,{status:404});
  return mediate(request,'/'+path[0]+new URL(request.url).search);
}
export {handle as GET,handle as POST};
