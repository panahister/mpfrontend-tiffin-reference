import 'server-only';
export const backendOrigin=process.env.BACKEND_ORIGIN ?? 'http://localhost:39080';
const parsed=new URL(backendOrigin);
if(!['http:','https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.pathname!=='/')throw new Error('INVALID_BACKEND_ORIGIN');
