import type { MatchReason } from '../types';
import type { Category } from '../i18n/categories';
import type { TranslationKey } from '../i18n/translations';

interface Translators {
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  tCategory: (cat: Category) => string;
}

export function renderReason(reason: MatchReason, { t, tCategory }: Translators): string {
  const { __consensus, categories, ...rest } = reason.params ?? ({} as Record<string, string | number>);
  const vars: Record<string, string | number> = { ...rest };

  if (typeof categories === 'string' && categories) {
    vars.categories = categories
      .split(',')
      .map((id) => tCategory(id as Category))
      .join(', ');
  }

  const base = t(reason.key, vars);
  return __consensus ? `${base} (${__consensus})` : base;
}
