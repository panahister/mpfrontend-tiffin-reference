// Product language and presentation belong here; FTG never overwrites this file.
export const defaultQuery='seattle';
export const copy={
  en:{title:'Tiffin',eyebrow:'MP Core food-delivery microservices',subtitle:'Discover restaurants by city through the live Restaurants service.',query:'City',components:'Component lab'},
  ar:{title:'تيفن',eyebrow:'خدمات توصيل طعام مصغّرة مبنية على MP Core',subtitle:'اكتشف المطاعم حسب المدينة من خلال خدمة المطاعم المباشرة.',query:'المدينة',components:'مختبر المكوّنات'}
} as const;
export const labels={
  en:{restaurantId:'ID',name:'Restaurant',city:'City',currency:'Currency',isOpen:'Open',pictureId:'Picture'},
  ar:{restaurantId:'المعرّف',name:'المطعم',city:'المدينة',currency:'العملة',isOpen:'مفتوح',pictureId:'الصورة'}
} as const;
