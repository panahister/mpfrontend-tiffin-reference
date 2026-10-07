import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const files=new Set(['swagger-ui.css','swagger-ui-bundle.js','swagger-ui-standalone-preset.js']);
export async function GET(_request:Request,{params}:{params:Promise<{file:string}>}){
  if(process.env.NODE_ENV==='production' && process.env.ENABLE_API_DOCS!=='true')return new Response(null,{status:404});
  const {file}=await params;if(!files.has(file))return new Response(null,{status:404});
  const path=resolve(process.cwd(),'runtime-assets/swagger',file);
  const content=await readFile(path);return new Response(content,{headers:{'Content-Type':file.endsWith('.css')?'text/css; charset=utf-8':'application/javascript; charset=utf-8','Cache-Control':'no-store'}});
}
