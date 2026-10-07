import 'server-only';
import {backendOrigin} from '../../config/server';
import {parseRead,type ReadModels} from '../../features/catalog/model/generated/read-models.gen';
import {queryParameters} from './catalog-query';
export type CatalogPage=ReadModels['catalog'];
export async function readCatalog(query=new URLSearchParams(),language='en'):Promise<CatalogPage>{
  const response=await fetch(backendOrigin+'/v1/restaurants/?'+queryParameters(query),{cache:'no-store',headers:{'Accept-Language':language},signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('CATALOG_UNAVAILABLE');
  return parseRead('catalog',await response.json());
}
