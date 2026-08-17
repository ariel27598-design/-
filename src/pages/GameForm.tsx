import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useGameStore } from '../store/useGameStore';
import { ALL_CATEGORIES, type Category, type NewGame } from '../types';
import { placeholderCover } from '../lib/placeholder';
import { lookupProductByBarcode } from '../lib/barcodeLookup';
import { useT } from '../i18n/useT';
import CategoryPill from '../components/CategoryPill';

type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found';

interface Props {
  mode: 'create' | 'edit';
}

function emptyForm(): NewGame {
  return {
    name: '',
    barcodes: [],
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

export default function GameForm({ mode }: Props) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, tCategory, tText } = useT();
  const games = useGameStore((s) => s.games);
  const addGame = useGameStore((s) => s.addGame);
  const updateGame = useGameStore((s) => s.updateGame);
  const deleteGame = useGameStore((s) => s.deleteGame);

  const existing = mode === 'edit' ? games.find((g) => g.id === id) : undefined;

  function buildFormFromExisting(): NewGame {
    if (!existing) {
      const prefillBarcode = searchParams.get('barcode');
      return { ...emptyForm(), barcodes: prefillBarcode ? [prefillBarcode] : [] };
    }
    return { ...existing, name: tText(existing.name), description: tText(existing.description) };
  }

  const [form, setForm] = useState<NewGame>(buildFormFromExisting);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [imagePreview, setImagePreview] = useState(existing?.imageUrl ?? '');
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');

  useEffect(() => {
    if (existing) {
      setForm(buildFormFromExisting());
      setImagePreview(existing.imageUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  async function lookupBarcode(code: string) {
    if (!code) return;
    setLookupStatus('loading');
    const result = await lookupProductByBarcode(code);
    if (!result) {
      setLookupStatus('not-found');
      return;
    }
    setForm((f) => ({
      ...f,
      name: typeof f.name === 'string' && f.name ? f.name : result.name ?? f.name,
      imageUrl: f.imageUrl || result.imageUrl || f.imageUrl,
    }));
    if (result.imageUrl && !form.imageUrl) setImagePreview(result.imageUrl);
    setLookupStatus('found');
  }

  // Auto-lookup once when arriving from a barcode scan with an empty form.
  useEffect(() => {
    const prefillBarcode = searchParams.get('barcode');
    if (mode === 'create' && prefillBarcode) {
      lookupBarcode(prefillBarcode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function addBarcode() {
    const code = barcodeInput.trim();
    if (!code || form.barcodes.includes(code)) return;
    set('barcodes', [...form.barcodes, code]);
    setBarcodeInput('');
  }

  function removeBarcode(code: string) {
    set('barcodes', form.barcodes.filter((b) => b !== code));
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

        <Field label={t('coverImageLabel')}>
          <div className="flex items-center gap-3">
            <img
              src={imagePreview || placeholderCover(nameValue || '?')}
              alt=""
              className="h-16 w-16 rounded-xl object-cover"
            />
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

        <Field label={t('barcodesFieldLabel')}>
          <div className="flex gap-2">
            <input
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addBarcode();
                }
              }}
              placeholder={t('barcodePlaceholder')}
              className="input flex-1"
            />
            <button type="button" onClick={addBarcode} className="btn-secondary shrink-0">
              {t('addBarcodeBtn')}
            </button>
          </div>
          {form.barcodes.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {form.barcodes.map((code) => (
                <span
                  key={code}
                  className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200"
                  dir="ltr"
                >
                  {code}
                  <button
                    type="button"
                    onClick={() => removeBarcode(code)}
                    className="text-slate-400 hover:text-rose-300"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => lookupBarcode(barcodeInput.trim() || form.barcodes[0])}
            disabled={lookupStatus === 'loading' || (!barcodeInput.trim() && form.barcodes.length === 0)}
            className="mt-1 self-start text-xs font-semibold text-indigo-300 hover:text-indigo-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('lookupBarcodeBtn')}
          </button>
          {lookupStatus === 'loading' && <p className="text-xs text-slate-400">{t('lookingUpProduct')}</p>}
          {lookupStatus === 'found' && <p className="text-xs text-emerald-300">{t('productFoundHint')}</p>}
          {lookupStatus === 'not-found' && <p className="text-xs text-amber-300">{t('productNotFoundHint')}</p>}
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
            <input
              type="number"
              min={1}
              value={form.minPlayers}
              onChange={(e) => set('minPlayers', Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label={t('maxPlayersLabel')}>
            <input
              type="number"
              min={1}
              value={form.maxPlayers}
              onChange={(e) => set('maxPlayers', Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label={t('minPlaytimeLabel')}>
            <input
              type="number"
              min={5}
              step={5}
              value={form.minPlaytime}
              onChange={(e) => set('minPlaytime', Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label={t('maxPlaytimeLabel')}>
            <input
              type="number"
              min={5}
              step={5}
              value={form.maxPlaytime}
              onChange={(e) => set('maxPlaytime', Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label={t('minAgeLabel')}>
            <input
              type="number"
              min={0}
              value={form.minAge}
              onChange={(e) => set('minAge', Number(e.target.value))}
              className="input"
            />
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
