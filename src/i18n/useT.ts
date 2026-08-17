import { useCallback } from 'react';
import { useLanguageStore } from '../store/useLanguageStore';
import { dict, type TranslationKey } from './translations';
import { CATEGORY_LABELS, type Category } from './categories';

export type LocalizedText = string | { he: string; en: string };

export function localize(value: LocalizedText, lang: 'he' | 'en'): string {
  return typeof value === 'string' ? value : value[lang];
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''));
}

export function useT() {
  const lang = useLanguageStore((s) => s.lang);

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => interpolate(dict[key][lang], vars),
    [lang],
  );

  const tCategory = useCallback((cat: Category) => CATEGORY_LABELS[cat][lang], [lang]);
  const tText = useCallback((value: LocalizedText) => localize(value, lang), [lang]);

  return { t, tCategory, tText, lang };
}
