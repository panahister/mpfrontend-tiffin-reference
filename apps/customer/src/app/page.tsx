import {cookies} from 'next/headers';
import {locale} from '@mpfrontend/i18n';
import {validMode} from '@mpfrontend/tokens';
import {Delivery} from '../features/delivery/customer';
import {readCatalog} from '../api/server/catalog';
export const dynamic='force-dynamic';
export default async function Page(){
  const saved=await cookies();const language=locale(saved.get('tiffin_locale')?.value);
  const data=await readCatalog(new URLSearchParams(),language).catch(()=>undefined);
  return <Delivery initial={data} initialLocale={language} initialMode={validMode(saved.get('tiffin_mode')?.value)} />;
}
