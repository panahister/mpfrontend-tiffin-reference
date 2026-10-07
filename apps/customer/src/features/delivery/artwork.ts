const menuRoot='/demo/menu/';

export const restaurantArtwork:Readonly<Record<string,string>>={
  'Harbor & Pine':menuRoot+'cedar-plank-salmon-bowl.png',
  'Rain City Noodle House':menuRoot+'pacific-mushroom-ramen.png',
  'Lone Star Smokehouse':menuRoot+'oak-smoked-brisket-plate.png',
  'Barton Springs Taqueria':menuRoot+'smoked-chicken-street-tacos.png'
};

export const menuArtwork:Readonly<Record<string,string>>={
  SALMON:menuRoot+'cedar-plank-salmon-bowl.png',
  'CRAB-ROLL':menuRoot+'dungeness-crab-roll.png',
  'BLACKBERRY-LEMONADE':menuRoot+'blackberry-sage-lemonade.png',
  'MUSHROOM-RAMEN':menuRoot+'pacific-mushroom-ramen.png',
  'CHICKEN-GYOZA':menuRoot+'ginger-chicken-gyoza.png',
  'YUZU-SODA':menuRoot+'yuzu-cucumber-soda.png',
  BRISKET:menuRoot+'oak-smoked-brisket-plate.png',
  'CORN-MAC':menuRoot+'street-corn-mac-and-cheese.png',
  'PEACH-COBBLER':menuRoot+'texas-peach-cobbler-jar.png',
  'CHICKEN-TACOS':menuRoot+'smoked-chicken-street-tacos.png',
  'GREEN-CHILE-QUESO':menuRoot+'green-chile-queso-and-chips.png',
  'PRICKLY-PEAR':menuRoot+'prickly-pear-agua-fresca.png'
};

export function pictureSource(authenticated:boolean,pictureId:string|null|undefined,fallback:string|undefined){
  return authenticated&&pictureId?'/api/picture/'+pictureId:fallback;
}

export function restaurantPicture(name:string,pictureId:string|null|undefined,authenticated:boolean){
  return pictureSource(authenticated,pictureId,restaurantArtwork[name]);
}

export function menuItemPicture(code:string,pictureId:string|null|undefined,authenticated:boolean){
  return pictureSource(authenticated,pictureId,menuArtwork[code]);
}
