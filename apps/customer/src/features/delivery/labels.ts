export const orderLabels:Readonly<Record<string,readonly [string,string]>>={
  Placed:['Order received','تم استلام الطلب'],Paid:['Paid','تم الدفع'],Accepted:['Preparing your order','جارٍ تحضير طلبك'],
  OutForDelivery:['Out for delivery','في الطريق إليك'],Delivered:['Delivered','تم التوصيل'],Cancelled:['Cancelled','ملغي'],
};
export function orderLabel(status:string,arabic:boolean){return orderLabels[status]?.[arabic?1:0]??status;}
