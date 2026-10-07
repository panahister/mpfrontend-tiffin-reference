'use client';
import {Button as CoreButton,Field as CoreField,Select as CoreSelect,type ButtonProps,type FieldProps,type SelectProps} from '@mpfrontend/ui';

// Reference-only visual composition; no product assets are shipped by the public core.
export function Button(props:ButtonProps) { return <span className="reference-ui"><CoreButton {...props}/></span>; }
export function Field(props:FieldProps) { return <span className="reference-ui"><CoreField {...props}/></span>; }
export function Select(props:SelectProps) {
  return <span className="reference-ui"><CoreSelect {...props} icon={<img src={new URL('../assets/chevron-down.svg',import.meta.url).href} alt=""/>}/></span>;
}
export {Card,ResourceTable,ResourceForm} from '@mpfrontend/ui';
