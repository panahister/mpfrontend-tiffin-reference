import {mkdir,open,stat,chown,chmod} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';

// Docker-only development secret initialization. No key material is printed or exported.
if(process.env.NODE_ENV==='production'||process.env.SESSION_PROFILE!=='redis-validation')throw new Error('VALIDATION_ONLY');
const directory='/run/session-key',path=directory+'/primary.key';
await mkdir(directory,{recursive:true,mode:0o750});
let file;
try{
  file=await open(path,'wx',0o600);await file.writeFile(randomBytes(32));await file.sync();
}catch(error){if(error.code!=='EEXIST')throw error;}
finally{await file?.close();}
const info=await stat(path);if(!info.isFile()||info.size!==32)throw new Error('INVALID_VALIDATION_KEY');
await chown(directory,1000,1000);await chmod(directory,0o750);
await chown(path,1000,1000);await chmod(path,0o600);
console.log('Validation secret mount initialized; material is not logged.');
