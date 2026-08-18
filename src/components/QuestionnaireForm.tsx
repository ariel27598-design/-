import { useState } from 'react';
import type { Category, QuestionnaireAnswers } from '../types';
import { ALL_CATEGORIES } from '../types';
import { useT } from '../i18n/useT';
import CategoryPill from './CategoryPill';

interface Props {
  defaultName: string;
  requireName: boolean;
  submitLabel: string;
  defaultAnswers?: QuestionnaireAnswers;
  onBack?: () => void;
  backLabel?: string;
  onSubmit: (answers: QuestionnaireAnswers) => void;
}

export default function QuestionnaireForm({
  defaultName,
  requireName,
  submitLabel,
  defaultAnswers,
  onBack,
  backLabel,
  onSubmit,
}: Props) {
  const { t, tCategory } = useT();
  const [personName, setPersonName] = useState(defaultAnswers?.personName ?? defaultName);
  const [timeAvailable, setTimeAvailable] = useState(defaultAnswers?.timeAvailable ?? 60);
  const [complexity, setComplexity] = useState(defaultAnswers?.complexity ?? 3);
  const [luckVsStrategy, setLuckVsStrategy] = useState(defaultAnswers?.luckVsStrategy ?? 3);
  const [socialMode, setSocialMode] = useState<QuestionnaireAnswers['socialMode']>(defaultAnswers?.socialMode ?? 'either');
  const [preferredCategories, setPreferredCategories] = useState<Category[]>(defaultAnswers?.preferredCategories ?? []);
  const [willingToLearnRules, setWillingToLearnRules] = useState(defaultAnswers?.willingToLearnRules ?? 3);

  const TIME_OPTIONS = [
    { value: 20, label: t('time20') },
    { value: 40, label: t('time40') },
    { value: 60, label: t('time60') },
    { value: 100, label: t('time100') },
    { value: 150, label: t('time150') },
  ];

  function toggleCategory(cat: Category) {
    setPreferredCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      personName: personName.trim() || defaultName,
      timeAvailable,
      complexity,
      luckVsStrategy,
      socialMode,
      preferredCategories,
      willingToLearnRules,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {requireName && (
        <Question label={t('yourName')}>
          <input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder={t('yourNamePlaceholder')}
            className="input"
          />
        </Question>
      )}

      <Question label={t('timeQuestion')}>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {TIME_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setTimeAvailable(opt.value)}
              className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                timeAvailable === opt.value
                  ? 'border-primary-400/60 bg-primary-500/20 text-primary-200'
                  : 'border-white/10 bg-white/5 text-ink-300 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Question>

      <Question label={t('complexityQuestion')}>
        <SliderRow value={complexity} onChange={setComplexity} minLabel={t('complexityLight')} maxLabel={t('complexityHeavy')} />
      </Question>

      <Question label={t('luckQuestion')}>
        <SliderRow value={luckVsStrategy} onChange={setLuckVsStrategy} minLabel={t('luckLight')} maxLabel={t('luckStrategy')} />
      </Question>

      <Question label={t('rulesQuestion')}>
        <SliderRow value={willingToLearnRules} onChange={setWillingToLearnRules} minLabel={t('rulesSimple')} maxLabel={t('rulesFine')} />
      </Question>

      <Question label={t('socialQuestion')}>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['cooperative', t('socialCooperative')],
              ['competitive', t('socialCompetitive')],
              ['either', t('socialEither')],
            ] as [QuestionnaireAnswers['socialMode'], string][]
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => setSocialMode(value)}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                socialMode === value
                  ? 'bg-primary-500 text-white'
                  : 'border border-white/10 bg-white/5 text-ink-300 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Question>

      <Question label={t('categoriesQuestion')}>
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={tCategory(cat)}
              active={preferredCategories.includes(cat)}
              onClick={() => toggleCategory(cat)}
            />
          ))}
        </div>
      </Question>

      <div className="flex gap-3">
        {onBack && (
          <button type="button" onClick={onBack} className="btn-secondary shrink-0">
            {backLabel}
          </button>
        )}
        <button type="submit" className="flex-1 rounded-full bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-400">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink-200">{label}</span>
      {children}
    </div>
  );
}

function SliderRow({
  value,
  onChange,
  minLabel,
  maxLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <div>
      <input
        type="range"
        min={1}
        max={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-primary-500"
      />
      <div className="flex justify-between text-xs text-ink-500">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
