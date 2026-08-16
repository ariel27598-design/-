import { useState } from 'react';
import type { Category, QuestionnaireAnswers } from '../types';
import { ALL_CATEGORIES } from '../types';
import CategoryPill from './CategoryPill';

interface Props {
  defaultName: string;
  requireName: boolean;
  submitLabel: string;
  onSubmit: (answers: QuestionnaireAnswers) => void;
}

const TIME_OPTIONS = [
  { value: 20, label: 'עד 20 דקות' },
  { value: 40, label: 'כחצי שעה' },
  { value: 60, label: 'שעה בערך' },
  { value: 100, label: 'שעה וחצי-שעתיים' },
  { value: 150, label: 'ערב שלם' },
];

export default function QuestionnaireForm({ defaultName, requireName, submitLabel, onSubmit }: Props) {
  const [personName, setPersonName] = useState(defaultName);
  const [timeAvailable, setTimeAvailable] = useState(60);
  const [complexity, setComplexity] = useState(3);
  const [luckVsStrategy, setLuckVsStrategy] = useState(3);
  const [socialMode, setSocialMode] = useState<QuestionnaireAnswers['socialMode']>('either');
  const [preferredCategories, setPreferredCategories] = useState<Category[]>([]);
  const [willingToLearnRules, setWillingToLearnRules] = useState(3);

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
        <Question label="מה השם שלך?">
          <input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="השם שלך"
            className="input"
          />
        </Question>
      )}

      <Question label="כמה זמן יש לכם למשחק?">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {TIME_OPTIONS.map((opt) => (
            <button
              type="button"
              key={opt.value}
              onClick={() => setTimeAvailable(opt.value)}
              className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                timeAvailable === opt.value
                  ? 'border-indigo-400/60 bg-indigo-500/20 text-indigo-200'
                  : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Question>

      <Question label="עד כמה אתם אוהבים משחקים מורכבים עם הרבה חוקים?">
        <SliderRow value={complexity} onChange={setComplexity} minLabel="קליל וקצר" maxLabel="עמוק ומורכב" />
      </Question>

      <Question label="מה מושך אתכם יותר - מזל או אסטרטגיה?">
        <SliderRow value={luckVsStrategy} onChange={setLuckVsStrategy} minLabel="מזל וקלילות" maxLabel="חשיבה ואסטרטגיה" />
      </Question>

      <Question label="כמה אתם פתוחים ללמוד חוקים מורכבים בהתחלה?">
        <SliderRow value={willingToLearnRules} onChange={setWillingToLearnRules} minLabel="שיהיה פשוט" maxLabel="לא בעיה ללמוד" />
      </Question>

      <Question label="איך אתם אוהבים לשחק?">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ['cooperative', '🤝 יחד נגד המשחק'],
              ['competitive', '⚔️ אחד נגד השני'],
              ['either', '🤷 לא משנה'],
            ] as [QuestionnaireAnswers['socialMode'], string][]
          ).map(([value, label]) => (
            <button
              type="button"
              key={value}
              onClick={() => setSocialMode(value)}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                socialMode === value
                  ? 'bg-indigo-500 text-white'
                  : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Question>

      <Question label="אילו סגנונות מושכים אתכם? (אופציונלי)">
        <div className="flex flex-wrap gap-1.5">
          {ALL_CATEGORIES.map((cat) => (
            <CategoryPill key={cat} label={cat} active={preferredCategories.includes(cat)} onClick={() => toggleCategory(cat)} />
          ))}
        </div>
      </Question>

      <button type="submit" className="rounded-full bg-indigo-500 py-3 text-sm font-bold text-white hover:bg-indigo-400">
        {submitLabel}
      </button>
    </form>
  );
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
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
        className="w-full accent-indigo-500"
      />
      <div className="flex justify-between text-xs text-slate-500">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
