// Consumer-owned presentation only. Never transform these display values into write payloads.
const headings:Readonly<Record<string,readonly [string,string]>>={
  "personName": [
    "Person",
    "المستخدم"
  ],
  "role": [
    "Role",
    "الصلاحية"
  ],
  "kind": [
    "Decision",
    "القرار"
  ],
  "state": [
    "State",
    "الحالة"
  ],
  "decidedOnUtc": [
    "Decided at",
    "وقت القرار"
  ],
  "failure": [
    "Failure",
    "سبب التعذر"
  ],
  "name": [
    "Name",
    "الاسم"
  ],
  "city": [
    "City",
    "المدينة"
  ],
  "onDuty": [
    "On duty",
    "في العمل"
  ],
  "carryingOrderId": [
    "Current order ID",
    "معرف الطلب الحالي"
  ],
  "orderNumber": [
    "Order",
    "الطلب"
  ],
  "status": [
    "Status",
    "الحالة"
  ],
  "restaurantName": [
    "Restaurant",
    "المطعم"
  ],
  "recipient": [
    "Recipient",
    "المستلم"
  ],
  "phone": [
    "Phone",
    "الهاتف"
  ],
  "district": [
    "District",
    "الحي"
  ],
  "line": [
    "Address",
    "العنوان"
  ],
  "code": [
    "Item code",
    "رمز الصنف"
  ],
  "price": [
    "Price",
    "السعر"
  ],
  "isAvailable": [
    "Availability",
    "التوفر"
  ],
  "quantity": [
    "Quantity",
    "الكمية"
  ]
};
const arabicEnums:Readonly<Record<string,string>>={
  "Active": "نشط",
  "Discontinued": "متوقف",
  "Pending": "قيد الانتظار",
  "Accepted": "مقبول",
  "Rejected": "مرفوض",
  "Failed": "تعذر التنفيذ",
  "Succeeded": "ناجح",
  "Assigned": "تم الإسناد",
  "Completed": "مكتمل",
  "Applied": "تم التطبيق",
  "Give": "منح",
  "Take": "سحب",
  "Submitted": "تم تسجيل الطلب",
  "AwaitingPayment": "بانتظار الدفع",
  "Paid": "مدفوع",
  "Shipped": "تم الشحن",
  "Cancelled": "ملغى",
  "customer": "عميل",
  "restaurant-manager": "مدير المطعم",
  "courier": "مندوب",
  "city-admin": "مدير المدينة",
  "platform-admin": "مدير المنصة"
};
const enumFields=new Set(['status','outcome','state','kind','role']);
const dateFields=new Set(['raisedOnUtc','occurredAtUtc','decidedOnUtc','occurredOnUtc','hour']);
export function tableLabels(language:string):Record<string,string>{
  return Object.fromEntries(Object.entries(headings).map(([key,pair])=>[key,pair[language==='ar'?1:0]]));
}
export function presentRow(row:Readonly<Record<string,unknown>>,keys:readonly string[],language:string):Record<string,string>{
  return Object.fromEntries(keys.map(key=>{
    const value=row[key];let text:string;
    if(value===null||value===undefined)text='—';
    else if(typeof value==='number'&&Number.isFinite(value))text=new Intl.NumberFormat(language).format(value);
    else if(typeof value==='boolean')text=language==='ar'?(value?'نعم':'لا'):(value?'Yes':'No');
    else if(typeof value==='string'&&dateFields.has(key)&&/^\d{4}-\d{2}-\d{2}T/.test(value)&&!Number.isNaN(Date.parse(value)))
      text=new Intl.DateTimeFormat(language,{dateStyle:'medium',timeStyle:'short'}).format(new Date(value));
    else if(typeof value==='string'&&enumFields.has(key)&&language==='ar')text=arabicEnums[value]??value;
    else text=Array.isArray(value)?value.join(', '):typeof value==='object'?JSON.stringify(value):String(value);
    return [key,text];
  }));
}
