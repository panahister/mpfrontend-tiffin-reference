import {mediaPicture} from '../../../../api/server/media-picture';
import {mediate} from '../../../../api/server/presentation';

export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  return mediaPicture(request,(await params).id,mediate);
}
