'use client';
import {useState,type ReactNode} from 'react';
import {Button} from '@mpfrontend-tiffin/dls-adapter';
import {direction,locale,type Locale} from '@mpfrontend/i18n';
import {validMode,type Mode} from '@mpfrontend/tokens';
import {logout,type Session} from './client';
export function Chrome({language,setLanguage,mode,setMode,session,ready,city,children}:{language:Locale;setLanguage:(v:Locale)=>void;mode:Mode;setMode:(v:Mode)=>void;session:Session|null;ready:boolean;city:string;children:ReactNode}){
  const ar=language==='ar';
  const [signingOut,setSigningOut]=useState(false),[logoutError,setLogoutError]=useState(false);
  async function signOut(){if(!session||signingOut)return;setSigningOut(true);setLogoutError(false);try{await logout(session);}catch{setLogoutError(true);}finally{setSigningOut(false);}}
  function preference(key:string,value:string){document.cookie='tiffin_'+key+'='+value+'; Path=/; SameSite=Lax; Max-Age=31536000'+(location.protocol==='https:'?'; Secure':'');}
  const cityName=city==='austin'?'Austin':'Seattle';
  return <header className="app-toolbar"><div className="app-toolbar-main"><nav aria-label={ar?'التنقل الرئيسي':'Main navigation'}>{children}</nav><div className="app-preferences">
    <a className="app-location" href="#catalog-start" aria-label={(ar?'موقع التوصيل: ':'Delivery location: ')+cityName}>
      <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg>
      <span><small>{ar?'التوصيل إلى':'Deliver to'}</small><strong>{cityName}</strong></span>
    </a>
    <label className="app-header-select app-header-select--language">
      <span className="app-visually-hidden">{ar?'اللغة':'Language'}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3.5 12h17M12 3c2.2 2.5 3.3 5.5 3.3 9S14.2 18.5 12 21c-2.2-2.5-3.3-5.5-3.3-9S9.8 5.5 12 3Z"/></svg>
      <select value={language} onChange={event=>{const next=locale(event.target.value);setLanguage(next);document.documentElement.lang=next;document.documentElement.dir=direction(next);preference('locale',next);}}><option value="en">EN</option><option value="ar">AR</option></select>
    </label>
    <label className="app-header-select app-header-select--appearance">
      <span className="app-visually-hidden">{ar?'المظهر':'Appearance'}</span>
      <svg aria-hidden="true" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <select value={mode} onChange={event=>{const next=validMode(event.target.value);setMode(next);document.documentElement.dataset.mode=next;preference('mode',next);}}><option value="light">{ar?'فاتح':'Light'}</option><option value="dark">{ar?'داكن':'Dark'}</option><option value="system">{ar?'النظام':'System'}</option></select>
    </label>
    {ready&&(session?<div className="app-session"><span className="app-avatar" aria-hidden="true">{session.name.trim().charAt(0).toUpperCase()}</span><span className="app-session-name">{session.name}</span><Button tone="secondary" loading={signingOut} onClick={()=>void signOut()}>{ar?'خروج':'Sign out'}</Button></div>:<a className="app-auth-link" href="/api/session/login">{ar?'تسجيل الدخول':'Sign in'}</a>)}
  </div></div>{logoutError&&<p className="reference-alert" role="alert">{ar?'لم نتمكن من تأكيد تسجيل الخروج. تحقق من اتصالك وحاول مرة أخرى.':'Sign-out could not be confirmed. Check your connection and try again.'}</p>}</header>;
}
