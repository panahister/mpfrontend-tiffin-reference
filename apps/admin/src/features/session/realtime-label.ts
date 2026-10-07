import type {ConnectionState} from '@mpfrontend/realtime-core';
const labels:Record<ConnectionState,readonly [string,string]>={
  idle:['Not connected','غير متصل'],connecting:['Connecting','جارٍ الاتصال'],
  authenticating:['Verifying access','جارٍ التحقق من الوصول'],live:['Connected','متصل'],
  backoff:['Reconnecting','جارٍ إعادة الاتصال'],resyncing:['Updating data','جارٍ تحديث البيانات'],
  closed:['Connection closed','تم إغلاق الاتصال'],
};
export function realtimeLabel(state:ConnectionState,arabic:boolean){return labels[state][arabic?1:0];}
