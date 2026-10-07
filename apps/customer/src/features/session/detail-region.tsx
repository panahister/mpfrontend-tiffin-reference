'use client';
import {useEffect,useRef,type MouseEvent,type ReactNode} from 'react';
import {Card} from '@mpfrontend-tiffin/dls-adapter';
let lastOpener:HTMLElement|null=null;
/** Capture the activating button before disabled/loading state removes native focus. */
export function rememberDetailOpener(event:MouseEvent<HTMLElement>){
  if(event.target instanceof Element)lastOpener=event.target.closest<HTMLElement>('button');
}
/** Consumer detail panel: focus newly opened content without stealing focus on snapshot updates. */
export function DetailRegion({identity,label,children}:{identity:string;label:string;children:ReactNode}){
  const region=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const previous=lastOpener??document.activeElement;
    region.current?.focus({preventScroll:true});
    region.current?.scrollIntoView({block:'start',behavior:'instant'});
    return ()=>{if(previous instanceof HTMLElement&&previous.isConnected)previous.focus({preventScroll:true});};
  },[identity]);
  return <div ref={region} role="region" aria-label={label} tabIndex={-1} className="customer-detail-region"><Card>{children}</Card></div>;
}
