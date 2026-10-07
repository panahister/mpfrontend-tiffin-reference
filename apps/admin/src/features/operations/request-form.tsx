import * as React from 'react';
import {ResourceForm} from '@mpfrontend-tiffin/dls-adapter';
import {requests} from '../catalog/model/generated/requests.gen';
import {parseRequest,type RequestModels} from '../catalog/model/generated/request-models.gen';
const contract=requests.find(request=>request.name==='accept-ticket');
if(!contract)throw new Error('MISSING_ACCEPT_TICKET_REQUEST');
const fields=contract.fields;
export function acceptancePayload(values:Readonly<Record<string,unknown>>):RequestModels['accept-ticket']{
  const payload=parseRequest('accept-ticket',values);
  if(!Number.isSafeInteger(payload.readyInMinutes)||payload.readyInMinutes<5||payload.readyInMinutes>180)throw new Error('INVALID_ACCEPTANCE_DRAFT');
  return payload;
}
export function AcceptTicketForm({ar,disabled,onSubmit}:{ar:boolean;disabled:boolean;onSubmit:(payload:RequestModels['accept-ticket'])=>void}){
  const [values,setValues]=React.useState<Record<string,unknown>>({readyInMinutes:20});
  const [invalid,setInvalid]=React.useState(false);
  return <section aria-label={ar?'قبول الطلب':'Accept order'}>
    {invalid&&<p role="alert" className="reference-alert">{ar?'أدخل مدة تحضير صحيحة بين 5 و180 دقيقة.':'Enter a whole preparation time between 5 and 180 minutes.'}</p>}
    <ResourceForm fields={fields} values={values} disabled={disabled}
      labels={{readyInMinutes:ar?'مدة التحضير بالدقائق':'Ready in minutes'}}
      saveLabel={ar?'قبول الطلب':'Accept order'} onChange={(key,value)=>{setInvalid(false);setValues(current=>({...current,[key]:value}));}}
      onSubmit={()=>{let payload:RequestModels['accept-ticket'];try{payload=acceptancePayload(values);}catch{setInvalid(true);return;}setInvalid(false);onSubmit(payload);}}/>
  </section>;
}
