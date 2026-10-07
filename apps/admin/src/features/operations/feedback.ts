import type {Locale} from '@mpfrontend/i18n';
// Server text is opaque: never machine-translate it or show a previous-language result as current.
export type LocalizedFeedback={language:Locale;text:string};
export function feedbackText(feedback:LocalizedFeedback|null,current:Locale):string{
  return feedback?.language===current?feedback.text:'';
}
