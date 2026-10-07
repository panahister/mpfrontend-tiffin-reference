import type {Locale} from '@mpfrontend/i18n';
export type LocalizedFeedback={language:Locale;text:string};
export function feedbackText(feedback:LocalizedFeedback|null,current:Locale):string{
  return feedback?.language===current?feedback.text:'';
}
