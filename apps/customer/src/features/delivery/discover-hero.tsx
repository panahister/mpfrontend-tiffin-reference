'use client';
import Image from 'next/image';
import {Button} from '@mpfrontend-tiffin/dls-adapter';
import food from '../../assets/food-editorial-v1.png';
export function DiscoverHero({arabic}:{arabic:boolean}){
  const t=(en:string,ar:string)=>arabic?ar:en;
  return <section className="discovery-hero" aria-labelledby="discovery-title">
    <div className="discovery-copy"><p className="reference-eyebrow">{t('Good food. Close to home.','طعام شهي من مطاعم قريبة منك')}</p>
      <h1 id="discovery-title">{t('Something delicious is waiting.','وجبتك الشهية بانتظارك.')}</h1>
      <p className="discovery-description">{t('Discover restaurants in your city, choose from their current menus and follow your order from the kitchen to your door.','اكتشف مطاعم مدينتك، واختر من قوائمها الحالية، وتابع طلبك من المطبخ إلى بابك.')}</p>
      <Button onClick={()=>document.getElementById('catalog-start')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}>{t('Find your next meal','اكتشف وجبتك القادمة')}</Button>
      <p className="discovery-note">{t('A working delivery reference · Demo payments only','مثال توصيل قابل للتجربة · مدفوعات تجريبية فقط')}</p>
    </div><figure className="discovery-figure"><Image src={food} alt={t('Illustrative freshly prepared vegetable rice and salad','صورة توضيحية لطبق أرز بالخضار وسلطة طازجة')} priority sizes="(max-width: 760px) 100vw, 600px"/><figcaption>{t('Generated editorial scene · Not a restaurant menu photograph','مشهد توضيحي مولّد · ليس صورة من قائمة مطعم')}</figcaption></figure>
  </section>;
}
