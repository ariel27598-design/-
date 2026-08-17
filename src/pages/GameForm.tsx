import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { ALL_CATEGORIES, type Category, type NewGame } from '../types';
import { placeholderCover } from '../lib/placeholder';
import { recognizeText } from '../lib/ocr';
import { useT } from '../i18n/useT';
import CategoryPill from '../components/CategoryPill';
import NumberField from '../components/NumberField';

type OcrStatus = 'idle' | 'recognizing' | 'done' | 'no-text';

interface Props {
  mode: 'create' | 'edit';
}

function emptyForm(): NewGame {
  return {
    name: '',
    imageUrl: '',
    description: '',
    videoUrl: '',
    minPlayers: 2,
    maxPlayers: 4,
    minPlaytime: 30,
    maxPlaytime: 60,
    minAge: 8,
    weight: 3,
    luckVsStrategy: 3,
    cooperative: false,
    categories: [],
    owned: true,
  };
}

interface ExtractedFacts {
  minPlayers?: number;
  maxPlayers?: number;
  minAge?: number;
  playtime?: number;
}

function extractGameFacts(text: string): ExtractedFacts {
  const playerMatch = text.match(/(\d{1,2})\s*[-–]\s*(\d{1,2})\s*(?:שחקנים|players)/i);
  const ageMatch = text.match(/(?:גיל|גילאי|age)s?\D{0,4}(\d{1,2})\s*\+?/i);
  const timeMatch = text.match(/(\d{2,3})\s*(?:דקות|min)/i);
  return {
    minPlayers: playerMatch ? Number(playerMatch[1]) : undefined,
    maxPlayers: playerMatch ? Number(playerMatch[2]) : undefined,
    minAge: ageMatch ? Number(ageMatch[1]) : undefined,
    playtime: timeMatch ? Number(timeMatch[1]) : undefined,
  };
}

export default function GameForm({ mode }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, tCategory, tText } = useT();
  const games = useGameStore((s) => s.games);
  const addGame = useGameStore((s) => s.addGame);
  const updateGame = useGameStore((s) => s.updateGame);
  const deleteGame = useGameStore((s) => s.deleteGame);

  const existing = mode === 'edit' ? games.find((g) => g.id === id) : undefined;

  function buildFormFromExisting(): NewGame {
    if (!existing) return emptyForm();
    return { ...existing, name: tText(existing.name), description: tText(existing.description) };
  }

  const [form, setForm] = useState<NewGame>(buildFormFromExisting);
  const [imagePreview, setImagePreview] = useState(existing?.imageUrl ?? '');
  const [coverOcrStatus, setCoverOcrStatus] = useState<OcrStatus>('idle');
  const [instructionsOcrStatus, setInstructionsOcrStatus] = useState<OcrStatus>('idle');

  useEffect(() => {
    if (existing) {
      setForm(buildFormFromExisting());
      setImagePreview(existing.imageUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  if (mode === 'edit' && !existing) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center text-slate-400">
        {t('gameNotFound')}
      </div>
    );
  }

  function set<K extends keyof NewGame>(key: K, value: NewGame[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleCategory(cat: Category) {
    setForm((f) => ({
      ...f,
      categories: f.categories.includes(cat) ? f.categories.filter((c) => c !== cat) : [...f.categories, cat],
    }));
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      set('imageUrl', dataUrl);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function handleBoxPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      set('imageUrl', dataUrl);
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);

    setCoverOcrStatus('recognizing');
    const text = await recognizeText(file);
    if (!text) {
      setCoverOcrStatus('no-text');
      return;
    }
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    setForm((f) => {
      const currentName = typeof f.name === 'string' ? f.name.trim() : '';
      const currentDesc = typeof f.description === 'string' ? f.description.trim() : '';
      const name = currentName || lines[0] || currentName;
      const remainder = (currentName ? lines : lines.slice(1)).join('\n');
      const description = currentDesc || remainder || text;
      return { ...f, name, description };
    });
    setCoverOcrStatus('done');
  }

  async function handleInstructionsPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setInstructionsOcrStatus('recognizing');
    const text = await recognizeText(file);
    if (!text) {
      setInstructionsOcrStatus('no-text');
      return;
    }
    const facts = extractGameFacts(text);
    const defaults = emptyForm();
    setForm((f) => {
      const currentDesc = typeof f.description === 'string' ? f.description.trim() : '';
      const description = currentDesc ? `${currentDesc}\n\n${text}` : text;
      const next: NewGame = { ...f, description };
      if (mode === 'create') {
        if (facts.minPlayers && f.minPlayers === defaults.minPlayers) next.minPlayers = facts.minPlayers;
        if (facts.maxPlayers && f.maxPlayers === defaults.maxPlayers) next.maxPlayers = facts.maxPlayers;
        if (facts.minAge && f.minAge === defaults.minAge) next.minAge = facts.minAge;
        if (facts.playtime && f.maxPlaytime === defaults.maxPlaytime) next.maxPlaytime = facts.playtime;
      }
      return next;
    });
    setInstructionsOcrStatus('done');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = typeof form.name === 'string' ? form.name.trim() : '';
    if (!name) return;

    const payload: NewGame = {
      ...form,
      name,
      imageUrl: form.imageUrl.trim() || placeholderCover(name),
      minPlayers: Math.min(form.minPlayers, form.maxPlayers),
      maxPlayers: Math.max(form.minPlayers, form.maxPlayers),
      minPlaytime: Math.min(form.minPlaytime, form.maxPlaytime),
      maxPlaytime: Math.max(form.minPlaytime, form.maxPlaytime),
    };

    if (mode === 'edit' && existing) {
      updateGame(existing.id, payload);
      navigate(`/games/${existing.id}`);
    } else {
      const created = addGame(payload);
      navigate(`/games/${created.id}`);
    }
  }

  function handleDelete() {
    if (!existing) return;
    if (!confirm(t('confirmDelete', { name: tText(existing.name) }))) return;
    deleteGame(existing.id);
    navigate('/library');
  }

  const nameValue = typeof form.name === 'string' ? form.name : '';

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-2xl flex-col gap-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-white">{mode === 'edit' ? t('editGameTitle') : t('addGameTitle')}</h1>
        <p className="text-sm text-slate-400">{t('addGameSubtitle')}</p>
      </div>

      <Section title={t('basicDetails')}>
        <Field label={t('gameNameLabel')}>
          <input
            required
            value={nameValue}
            onChange={(e) => set('name', e.target.value)}
            className="input"
            placeholder={t('gameNamePlaceholder')}
          />
        </Field>

        <Field label={t('scanBoxPhotoLabel')}>
          <div className="flex items-center gap-3">
            <img
              src={imagePreview || placeholderCover(nameValue || '?')}
              alt=""
              className="h-16 w-16 rounded-xl object-cover"
            />
            <div className="flex flex-1 flex-col gap-2">
              <label className="btn-secondary cursor-pointer self-start text-sm">
                {t('scanBoxPhotoBtn')}
                <input type="file" accept="image/*" capture="environment" onChange={handleBoxPhoto} className="hidden" />
              </label>
              {coverOcrStatus === 'recognizing' && <span className="text-xs text-slate-400">{t('ocrRecognizing')}</span>}
              {coverOcrStatus === 'done' && <span className="text-xs text-emerald-300">{t('ocrDone')}</span>}
              {coverOcrStatus === 'no-text' && <span className="text-xs text-amber-300">{t('ocrNoText')}</span>}
            </div>
          </div>
        </Field>

        <Field label={t('instructionsPhotoLabel')}>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-slate-500">{t('instructionsPhotoHint')}</p>
            <label className="btn-secondary cursor-pointer self-start text-sm">
              {t('instructionsPhotoBtn')}
              <input type="file" accept="image/*" capture="environment" onChange={handleInstructionsPhoto} className="hidden" />
            </label>
            {instructionsOcrStatus === 'recognizing' && <span className="text-xs text-slate-400">{t('ocrRecognizing')}</span>}
            {instructionsOcrStatus === 'done' && <span className="text-xs text-emerald-300">{t('ocrDone')}</span>}
            {instructionsOcrStatus === 'no-text' && <span className="text-xs text-amber-300">{t('ocrNoText')}</span>}
          </div>
        </Field>

        <Field label={t('coverImageLabel')}>
          <div className="flex items-center gap-3">
            <div className="flex flex-1 flex-col gap-2">
              <input
                value={form.imageUrl}
                onChange={(e) => {
                  set('imageUrl', e.target.value);
                  setImagePreview(e.target.value);
                }}
                placeholder={t('imageUrlPlaceholder')}
                className="input"
              />
              <input type="file" accept="image/*" onChange={handleImageFile} className="text-xs text-slate-400" />
              <span className="text-xs text-indigo-300/80">📷 {t('imageUploadHint')}</span>
            </div>
          </div>
        </Field>

        <Field label={t('descriptionLabel')}>
          <textarea
            value={typeof form.description === 'string' ? form.description : ''}
            onChange={(e) => set('description', e.target.value)}
            rows={4}
            className="input resize-none"
            placeholder={t('descriptionPlaceholder')}
          />
        </Field>

        <Field label={t('videoLabel')}>
          <input
            value={form.videoUrl ?? ''}
            onChange={(e) => set('videoUrl', e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="input"
          />
        </Field>

        <Field label="">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={form.owned}
              onChange={(e) => set('owned', e.target.checked)}
              className="h-4 w-4 accent-indigo-500"
            />
            {t('onShelfCheckbox')}
          </label>
        </Field>
      </Section>

      <Section title={t('gameplayAttributes')}>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('minPlayersLabel')}>
            <NumberField min={1} value={form.minPlayers} onChange={(n) => set('minPlayers', n)} />
          </Field>
          <Field label={t('maxPlayersLabel')}>
            <NumberField min={1} value={form.maxPlayers} onChange={(n) => set('maxPlayers', n)} />
          </Field>
          <Field label={t('minPlaytimeLabel')}>
            <NumberField min={5} step={5} value={form.minPlaytime} onChange={(n) => set('minPlaytime', n)} />
          </Field>
          <Field label={t('maxPlaytimeLabel')}>
            <NumberField min={5} step={5} value={form.maxPlaytime} onChange={(n) => set('maxPlaytime', n)} />
          </Field>
          <Field label={t('minAgeLabel')}>
            <NumberField min={0} value={form.minAge} onChange={(n) => set('minAge', n)} />
          </Field>
        </div>

        <Field label={t('complexityRangeLabel', { value: form.weight })}>
          <input
            type="range"
            min={1}
            max={5}
            value={form.weight}
            onChange={(e) => set('weight', Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{t('complexityLightShort')}</span>
            <span>{t('complexityHeavyShort')}</span>
          </div>
        </Field>

        <Field label={t('luckRangeLabel', { value: form.luckVsStrategy })}>
          <input
            type="range"
            min={1}
            max={5}
            value={form.luckVsStrategy}
            onChange={(e) => set('luckVsStrategy', Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{t('luckShort')}</span>
            <span>{t('strategyShort')}</span>
          </div>
        </Field>

        <Field label="">
          <label className="flex items-center gap-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={form.cooperative}
              onChange={(e) => set('cooperative', e.target.checked)}
              className="h-4 w-4 accent-indigo-500"
            />
            {t('cooperativeCheckbox')}
          </label>
        </Field>

        <Field label={t('categoriesLabel')}>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CATEGORIES.map((cat) => (
              <CategoryPill key={cat} label={tCategory(cat)} active={form.categories.includes(cat)} onClick={() => toggleCategory(cat)} />
            ))}
          </div>
        </Field>
      </Section>

      <div className="flex gap-3">
        <button type="submit" className="flex-1 rounded-full bg-indigo-500 py-3 text-sm font-bold text-white hover:bg-indigo-400">
          {mode === 'edit' ? t('saveChanges') : t('addToLibrary')}
        </button>
        {mode === 'edit' && (
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-full border border-rose-500/30 px-4 py-3 text-sm font-semibold text-rose-300 hover:bg-rose-500/10"
          >
            {t('deleteBtn')}
          </button>
        )}
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-indigo-300">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-slate-300">{label}</span>}
      {children}
    </label>
  );
}
