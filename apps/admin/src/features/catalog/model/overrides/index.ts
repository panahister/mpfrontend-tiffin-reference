// Product language and presentation belong here; FTG never overwrites this file.
export const defaultQuery='seattle';
export const copy={
  en:{title:'Tiffin Admin',eyebrow:'MP Core food-delivery administration',subtitle:'An independent administration panel using the live Restaurants service.',query:'City',components:'Component lab'},
  ar:{title:'إدارة تيفن',eyebrow:'إدارة خدمات توصيل الطعام المبنية على MP Core',subtitle:'لوحة إدارة مستقلة تستخدم خدمة المطاعم المباشرة.',query:'المدينة',components:'مختبر المكوّنات'}
} as const;
export const labels={
  en:{restaurantId:'ID',name:'Restaurant',city:'City',currency:'Currency',isOpen:'Open',pictureId:'Picture'},
  ar:{restaurantId:'المعرّف',name:'المطعم',city:'المدينة',currency:'العملة',isOpen:'مفتوح',pictureId:'الصورة'}
} as const;
