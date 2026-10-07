'use client';
import {useRef,useState} from 'react';
import {Button,Card,ResourceTable,Select,Field} from '@mpfrontend-tiffin/dls-adapter';
import {validMode,type Mode} from '@mpfrontend/tokens';
import {brands,validBrand,type Brand} from '../../../theme/config';
import {direction,locale,translator,formatValue,type Locale} from '@mpfrontend/i18n';
import type {CatalogPage} from '../../../api/server/catalog';
import {resources} from '../model/generated/resources.gen';
import {copy,defaultQuery,labels} from '../model/overrides';

function persist(key:string,value:string){document.cookie='tiffin_'+key+'='+encodeURIComponent(value)+'; Path=/; SameSite=Lax; Max-Age=31536000'+(location.protocol==='https:'?'; Secure':'');}

export function Catalog({initial,initialLocale,initialBrand,initialMode}:{initial:CatalogPage|undefined;initialLocale:Locale;initialBrand:Brand;initialMode:Mode}){
  const [data,setData]=useState(initial),[language,setLanguage]=useState(initialLocale),[brand,setBrand]=useState(initialBrand),[mode,setMode]=useState(initialMode),[loading,setLoading]=useState(false),[error,setError]=useState(!initial),[search,setSearch]=useState(defaultQuery);
  const generation=useRef(0),active=useRef<AbortController|null>(null);const t=translator(language),pageCopy=copy[language];
  async function refresh(page=1){active.current?.abort();const controller=new AbortController();active.current=controller;const current=++generation.current;setLoading(true);setError(false);
    try{const response=await fetch('/api/catalog?'+new URLSearchParams({page:String(page),size:'12',search}),{signal:controller.signal,headers:{'Accept-Language':language},cache:'no-store'});if(!response.ok)throw new Error();const next=await response.json() as CatalogPage;if(current===generation.current)setData(next);}
    catch{if(current===generation.current&&!controller.signal.aborted)setError(true);}finally{if(current===generation.current)setLoading(false);}
  }
  function changeLocale(value:string){const next=locale(value);active.current?.abort();generation.current++;setLoading(false);setLanguage(next);document.documentElement.lang=next;document.documentElement.dir=direction(next);persist('locale',next);}
  function changeBrand(value:string){const next=validBrand(value);setBrand(next);document.documentElement.dataset.brand=next;persist('brand',next);}
  function changeMode(value:string){const next=validMode(value);setMode(next);document.documentElement.dataset.mode=next;persist('mode',next);}
  return <main className="reference-shell">
    <header className="reference-hero"><div><p className="reference-eyebrow">{pageCopy.eyebrow}</p><h1>{pageCopy.title}</h1><p className="reference-subtitle">{pageCopy.subtitle}</p></div><div className="reference-live"><span aria-hidden="true"/>{t('source')}</div></header>
    <nav className="reference-nav"><a href="/api/docs">{t('docs')}</a><a href="/components">{pageCopy.components}</a></nav>
    <Card><div className="reference-controls">
      <Select label={t('language')} value={language} onChange={e=>changeLocale(e.target.value)}><option value="en">English</option><option value="ar">العربية</option></Select>
      <Select label={t('brand')} value={brand} onChange={e=>changeBrand(e.target.value)}>{brands.map(value=><option key={value} value={value}>{value}</option>)}</Select>
      <Select label={t('mode')} value={mode} onChange={e=>changeMode(e.target.value)}>{(['light','dark','system'] as const).map(value=><option key={value} value={value}>{t(value)}</option>)}</Select>
      <Field label={pageCopy.query} value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void refresh();}}/>
      <Button onClick={()=>void refresh()} loading={loading}>{t('apply')}</Button>
    </div></Card>
    {error&&<p role="alert" className="reference-alert">{t('unavailable')}</p>}
    <Card><div className="reference-section-title"><div><p className="reference-eyebrow">{t('readOnly')}</p><h2>{t('catalog')}</h2></div><strong>{data?.total??0}</strong></div>
      {data&&<><ResourceTable fields={resources[0]!.fields} rows={data.items} caption={t('catalog')} format={value=>formatValue(value,language)} labels={labels[language]}/>{data.items.length===0&&<p className="reference-empty">{t('empty')}</p>}<div className="reference-pagination"><Button tone="secondary" disabled={loading||data.number<=1} onClick={()=>void refresh(data.number-1)}>{t('previous')}</Button><span>{t('page')} {data.number} / {Math.max(data.pageCount,1)}</span><Button tone="secondary" disabled={loading||!data.hasMore} onClick={()=>void refresh(data.number+1)}>{t('next')}</Button></div></>}
    </Card>
  </main>;
}
