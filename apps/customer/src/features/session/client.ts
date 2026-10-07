'use client';
import {useCallback,useEffect,useState,useRef} from 'react';
import {parseRead,type ReadModels} from '../catalog/model/generated/read-models.gen';
import {AuthorityFence} from '@mpfrontend/access-core';
import {mutationContract,validateMutationRequest,validateMutationResponse} from '../catalog/model/contract-boundary';
export type Session={authenticated:true;subject:string;name:string;roles:string[];tenant:string|null;csrf:string;expiresAt:number};
const authority=new AuthorityFence();
const identity=(session:Session)=>JSON.stringify([session.subject,session.tenant,[...session.roles].sort(),session.csrf]);
export function useSession(){
  const [session,setSession]=useState<Session|null>(null),[ready,setReady]=useState(false);
  const generation=useRef(0);
  const refresh=useCallback(async(invalidateCurrent=false)=>{
    if(invalidateCurrent){authority.update(null);setSession(null);}
    const request=++generation.current;
    try{
      const response=await fetch('/api/session/context',{cache:'no-store',signal:AbortSignal.timeout(8000)});
      const next=response.ok?await response.json() as Session:null;
      if(request!==generation.current)return;
      authority.update(next?identity(next):null);setSession(next);setReady(true);
    }catch{if(request===generation.current){authority.update(null);setSession(null);setReady(true);}}
  },[]);
  useEffect(()=>{
    void refresh();
    const onFocus=()=>{void refresh();};
    const timer=setInterval(onFocus,30000);
    const onEnding=()=>{generation.current++;authority.update(null);setSession(null);setReady(true);};
    window.addEventListener('focus',onFocus);
    window.addEventListener('mpfrontend:session-ending',onEnding);
    window.addEventListener('mpfrontend:session-refresh',onFocus);
    return ()=>{generation.current++;clearInterval(timer);window.removeEventListener('focus',onFocus);window.removeEventListener('mpfrontend:session-ending',onEnding);window.removeEventListener('mpfrontend:session-refresh',onFocus);};
  },[refresh]);return {session,ready,refresh};
}
export class BusinessError extends Error{constructor(readonly status:number,readonly problem:Record<string,unknown>){super(String(problem.detail??problem.title??'Request failed'));}}
export async function business<T>(path:string,session:Session|null,language='en',method='GET',payload?:unknown,key?:string,signal?:AbortSignal):Promise<T>{
  if(!session)throw new BusinessError(401,{title:'AUTHENTICATION_REQUIRED'});
  const contract=mutationContract(method,'/api/business/'+path);
  validateMutationRequest(contract,payload);
  const scope=authority.capture(identity(session));
  const requestSignal=AbortSignal.any([scope.signal,AbortSignal.timeout(15000),...(signal?[signal]:[])]);
  const headers:Record<string,string>={'Accept-Language':language};
  if(method!=='GET'){headers['Content-Type']='application/json';headers['X-CSRF-Token']=session?.csrf??'';if(key)headers['Idempotency-Key']=key;}
  const response=await fetch('/api/business/'+path,{method,headers,...(payload!==undefined?{body:JSON.stringify(payload)}:{}),cache:'no-store',signal:requestSignal});
  const raw=await response.text();requestSignal.throwIfAborted();scope.assertCurrent();let result:unknown;
  try{result=raw?JSON.parse(raw):null;}catch{result={title:'SERVICE_UNAVAILABLE'};}
  if(!response.ok)throw new BusinessError(response.status,result as Record<string,unknown>);
  return validateMutationResponse(contract,response.status,result) as T;
}
export async function readBusiness<K extends keyof ReadModels>(resource:K,path:string,session:Session|null,language='en',signal?:AbortSignal):Promise<ReadModels[K]>{
  return parseRead(resource,await business<unknown>(path,session,language,'GET',undefined,undefined,signal));
}
export async function readMenu(id:string,city:string,session:Session|null,language='en'):Promise<ReadModels['menu']>{
  const scope=session?authority.capture(identity(session)):null;
  const signal=AbortSignal.any([AbortSignal.timeout(15000),...(scope?[scope.signal]:[])]);
  const response=await fetch('/api/menu/'+encodeURIComponent(id)+'?'+new URLSearchParams({city}),{cache:'no-store',headers:{'Accept-Language':language},signal});
  const value:unknown=await response.json();signal.throwIfAborted();scope?.assertCurrent();
  if(!response.ok)throw new BusinessError(response.status,{title:'MENU_UNAVAILABLE'});
  return parseRead('menu',value);
}
export async function logout(session:Session){
  window.dispatchEvent(new Event('mpfrontend:session-ending'));
  try{
    const response=await fetch('/api/session/logout',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':session.csrf},body:'{}',signal:AbortSignal.timeout(8000)});
    if(!response.ok)throw new BusinessError(response.status,{title:'LOGOUT_NOT_CONFIRMED'});
    location.assign('/');
  }catch(error){window.dispatchEvent(new Event('mpfrontend:session-refresh'));throw error;}
}
