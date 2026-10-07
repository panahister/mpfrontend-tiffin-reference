import type {ReactNode} from 'react';
import {cookies} from 'next/headers';
import {locale,direction} from '@mpfrontend/i18n';
import {validMode} from '@mpfrontend/tokens';
import {validBrand} from '../theme/config';
import '@mpfrontend/tokens/styles.css';
import '@mpfrontend/ui/styles.css';
import '@mpfrontend-tiffin/dls-adapter/styles.css';
import '@mpfrontend-tiffin/theme/styles.css';
import './globals.css';
export const metadata={title:'Tiffin Admin | MP Frontend',description:'Administration application for the food-delivery reference'};
export default async function RootLayout({children}:{children:ReactNode}){
  const saved=await cookies();const language=locale(saved.get('tiffin_locale')?.value);
  return <html lang={language} dir={direction(language)} data-brand={validBrand(saved.get('tiffin_brand')?.value)} data-mode={validMode(saved.get('tiffin_mode')?.value)}><body>{children}</body></html>;
}
