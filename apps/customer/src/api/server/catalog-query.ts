export function queryParameters(input:URLSearchParams):URLSearchParams {
  const output=new URLSearchParams();
  for(const key of ['page','size']){
    const raw=input.get(key) ?? (key==='page'?'1':'12');
    if(!/^\d+$/.test(raw))throw new Error('INVALID_QUERY');
    const value=Number(raw);
    if(value<1 || value>(key==='size'?100:100000))throw new Error('INVALID_QUERY');
    output.set(key,String(value));
  }
  const city=(input.get('search')||'seattle').trim();
  if(!city || city.length>100)throw new Error('INVALID_QUERY');
  output.set('city',city);
  output.set('open','true');
  return output;
}
