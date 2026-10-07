import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {menuArtwork,menuItemPicture,restaurantArtwork,restaurantPicture} from '../src/features/delivery/artwork.ts';

const expectedHashes:Readonly<Record<string,string>>={
  'blackberry-sage-lemonade.png':'08d480545ef7bee849f209026cb4975987dbbd3f3f2e0dddd62c8adc28252231',
  'cedar-plank-salmon-bowl.png':'f4188d7f2686963ed568f93ea15b752ffa9117f57883561e7e9f9d95225b94da',
  'dungeness-crab-roll.png':'7551392976c64bff62592054fbec19419a6ea4df62d2280697987d828d83b559',
  'ginger-chicken-gyoza.png':'ae08a5667faa10d56f5edcdadba54ae56ae26a1abb2bdac03c96d23cddc25c70',
  'green-chile-queso-and-chips.png':'7c15b1850ccaef62e457ed3fc9db9e5c3190051f47dd97866328a56557ed16c4',
  'oak-smoked-brisket-plate.png':'38e6a128177ab0a8a80e4e4428badf3f80f14be8ee0aec8e0b6e4366b956e866',
  'pacific-mushroom-ramen.png':'7a406935f12a39819f5ec52534204a6d27801d84868199c743a8f830056286ed',
  'prickly-pear-agua-fresca.png':'e4c60914905252f2be0aeb3bf9cc920da79f2add1059fe1d79de65f3e01f548a',
  'smoked-chicken-street-tacos.png':'461ea5aee2fbe2c3f9158a463bc03f6bc1a60863e467bbb3038b6e069d1ba4f2',
  'street-corn-mac-and-cheese.png':'db1fb22ce6cd35575bc29314ce84999c28be6d09194ef08062e7c03b9ff787b5',
  'texas-peach-cobbler-jar.png':'0503eed85e62fa6b4126a2b74e432c4b6c4f00be5290b74980862a245ac2da42',
  'yuzu-cucumber-soda.png':'5589de3dd00279bdbc7ddd7898bd601a2f5c1ac7aa1a8c60dd5b145d1df37187'
};

test('the final public catalog owns artwork for four restaurants and all twelve menu items',async()=>{
  assert.deepEqual(Object.keys(restaurantArtwork).sort(),[
    'Barton Springs Taqueria','Harbor & Pine','Lone Star Smokehouse','Rain City Noodle House'
  ]);
  assert.equal(Object.keys(menuArtwork).length,12);
  for(const path of new Set([...Object.values(restaurantArtwork),...Object.values(menuArtwork)])){
    assert.match(path,/^\/demo\/menu\/[a-z0-9-]+\.png$/);
    const bytes=await readFile(new URL('../public'+path,import.meta.url));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expectedHashes[path.split('/').at(-1)!]);
  }
  assert.equal(Object.keys(expectedHashes).length,12);
});

test('guests receive bundled catalog artwork while customers retain the live Media boundary',()=>{
  assert.equal(restaurantPicture('Harbor & Pine','media-id',false),'/demo/menu/cedar-plank-salmon-bowl.png');
  assert.equal(menuItemPicture('MUSHROOM-RAMEN','media-id',false),'/demo/menu/pacific-mushroom-ramen.png');
  assert.equal(restaurantPicture('Harbor & Pine','01a1164e-946a-7c63-a9f0-1b376040dd40',true),'/api/picture/01a1164e-946a-7c63-a9f0-1b376040dd40');
  assert.equal(restaurantPicture('Unknown',undefined,false),undefined);
});
