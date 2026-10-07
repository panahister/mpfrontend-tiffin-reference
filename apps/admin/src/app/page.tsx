import {cookies} from 'next/headers';
import {locale} from '@mpfrontend/i18n';
import {validMode} from '@mpfrontend/tokens';
import {Dashboard} from '../features/operations/dashboard';
export const dynamic='force-dynamic';
export default async function Page(){
  const saved=await cookies();const language=locale(saved.get('tiffin_locale')?.value);
  return <Dashboard initialLocale={language} initialMode={validMode(saved.get('tiffin_mode')?.value)} />;
}
