import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FilePlus, FileText, ImagePlus, Lock, Search, X } from 'lucide-react';
import { SERVER_MESSAGE, apiFetch, userMessage } from '../../../services/apiClient';
import { putFileToS3 } from '../../../services/uploadService';
import { validateScreeningQuestions } from '../../../constants/screeningQuestions';
import { GIG_CATEGORIES, SUPPORTED_CURRENCIES, getCurrencySymbol } from '../../Gigs/gigConstants';
import { FieldError, SelectControl, Spinner } from '../components/AccountControls';
import { ACCOUNT_PAGE, CARD, MUTED, PAGE_TITLE, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../components/accountStyles';
import { controlClass } from '../components/formControls';
import { LevelBar, SkillSearch } from '../postJob/steps/SkillsStep';
import ScreeningEditor from '../postJob/components/ScreeningEditor';
import { RequiredMark, TextButton } from '../postJob/components/ui';
import { NEW_SKILL_LEVEL, levelLabel } from '../postJob/constants';
import useEligiblePool from '../postJob/useEligiblePool';
import { deliveryDays, fileNameOf } from './gigsData';

const MAX_CATEGORIES = 3;
const MAX_FILES = 5;
const DELIVERY_PRESETS = [3, 7, 14, 21];
// Upload rules from backend config/upload.config.js.
const DOC_ACCEPT = '.pdf,.doc,.docx,.zip,.txt,.png,.jpg,.jpeg,.webp,.gif';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const DOC_LIMIT = 10 * 1024 * 1024;
const IMAGE_LIMIT = 2 * 1024 * 1024;
const GIG_QUESTION_TYPES = ['MCQ', 'LONG_ANSWER']; // what the gig API accepts

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6]';
const PILL = `inline-flex h-10 items-center rounded-full border px-3.5 font-(family-name:--font-headline) text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`;
const pillClass = (on) => `${PILL} ${on ? 'border-[#1447E6] bg-[#1447E6] text-white' : 'border-[#D5D9E0] bg-white text-[#334155] hover:bg-[#F8F8F6]'}`;
const kb = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

function initialValues(gig) {
  if (!gig) {
    return { title: '', description: '', categories: [], files: [], logo: null, budget: '', currency: 'INR', days: 7, customDays: '', requirements: [], questions: [] };
  }
  const days = deliveryDays(gig.deliveryTime);
  const requirements = gig.requirements?.length
    ? gig.requirements.map(({ skillName, minRating }) => ({ skillName, minRating: Math.min(10, Math.max(1, Number(minRating) || 1)) }))
    : (gig.skills || []).map((skillName) => ({ skillName, minRating: Math.min(10, Math.max(1, gig.minRating || 1)) }));
  return {
    title: gig.title || '',
    description: gig.description || '',
    categories: gig.categories?.length ? gig.categories : [gig.category].filter(Boolean),
    files: (gig.attachments || []).map((url) => ({ url, name: fileNameOf(url) })),
    logo: gig.logo ? { url: gig.logo } : null,
    budget: gig.budget ? String(Math.round(Number(gig.budget))) : '',
    currency: gig.currency || 'INR',
    days: DELIVERY_PRESETS.includes(days) ? days : 'custom',
    customDays: DELIVERY_PRESETS.includes(days) || !days ? '' : String(days),
    requirements,
    questions: (gig.screeningQuestions || []).map((q) => ({ ...q, options: q.options || [], correctAnswer: q.correctAnswer || '', required: q.required !== false }))
  };
}

const deliveryOf = (v) => (v.days === 'custom' ? Number(v.customDays) : v.days);

function validate(v, editing) {
  const errors = {};
  if (!editing) {
    const title = v.title.trim();
    if (title.length < 5) errors.title = 'Write a title of at least 5 characters.';
    else if (title.length > 100) errors.title = 'Keep the title to 100 characters.';
    if (v.categories.length === 0) errors.categories = 'Pick at least one category.';
  }
  const description = v.description.trim();
  if (description.length < 10) errors.description = 'Describe the work in at least 10 characters.';
  else if (description.length > 2000) errors.description = 'Keep the description to 2,000 characters.';
  const budget = Number(v.budget);
  if (!v.budget || !Number.isFinite(budget) || budget <= 0) errors.budget = 'Enter the budget.';
  const days = deliveryOf(v);
  if (!Number.isInteger(days) || days < 1 || days > 365) errors.days = 'Choose how many days, from 1 to 365.';
  if (v.requirements.length === 0) errors.requirements = 'Add at least one skill.';
  const questionProblem = validateScreeningQuestions(v.questions);
  if (questionProblem) errors.questions = questionProblem;
  return errors;
}

async function upload(file, fileType, token) {
  const res = await apiFetch('/upload/request-url', { token, method: 'POST', json: { fileType, fileName: file.name, contentType: file.type || 'application/octet-stream' } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
  const put = await putFileToS3(body.uploadUrl, file, file.type || 'application/octet-stream', token);
  if (!put.ok) throw new Error(`Couldn’t upload ${file.name}. Please try again.`);
  return body.publicUrl;
}

function Section({ id, title, step, intro, optional, children }) {
  return (
    <section aria-labelledby={id} className={`${CARD} flex flex-col gap-5 p-5 sm:p-[26px]`}>
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <h2 id={id} className="m-0 text-lg">
            <span className="font-bold">{title}</span>
            {optional && <span className={`text-sm font-normal ${MUTED}`}> · optional</span>}
          </h2>
          <span className={`text-[13px] ${MUTED}`}>{step} of 4</span>
        </div>
        {intro && <p className={`m-0 ${MUTED}`}>{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function Label({ htmlFor, children, required, optional }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-semibold">
      {children}
      {required && <RequiredMark />}
      {optional && <span className={`font-normal ${MUTED}`}> · optional</span>}
    </label>
  );
}

function CategoryPicker({ value, onChange, error }) {
  const [query, setQuery] = useState('');
  const term = query.trim().toLowerCase();
  const full = value.length >= MAX_CATEGORIES;
  const matches = GIG_CATEGORIES.filter((cat) => !value.includes(cat) && (!term || cat.toLowerCase().includes(term)));
  const custom = term && !GIG_CATEGORIES.some((cat) => cat.toLowerCase() === term) && !value.some((cat) => cat.toLowerCase() === term) ? query.trim() : null;
  const toggle = (cat) => onChange(value.includes(cat) ? value.filter((c) => c !== cat) : full ? value : [...value, cat]);

  return (
    <div id="field-categories" className="flex flex-col gap-2.5">
      <span className="text-sm font-semibold">
        Category<RequiredMark /> <span className={`font-normal ${MUTED}`}>· pick up to {MAX_CATEGORIES}</span>
      </span>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Chosen categories">
          {value.map((cat) => (
            <button key={cat} type="button" aria-pressed="true" onClick={() => toggle(cat)} className={`${pillClass(true)} gap-1.5`} aria-label={`Remove ${cat}`}>
              {cat}
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ))}
        </div>
      )}
      <label className={`flex h-10 items-center gap-2 rounded-[8px] border px-3 focus-within:border-[#1447E6] focus-within:ring-2 focus-within:ring-[#1447E6]/20 ${error ? 'border-[#DC2626]' : 'border-[#D5D9E0]'} ${MUTED}`}>
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <input
          type="search"
          aria-label="Search categories"
          placeholder={full ? `You’ve picked ${MAX_CATEGORIES}. Remove one to change.` : 'Search categories, or type your own'}
          value={query}
          disabled={full}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              const pick = matches.find((cat) => cat.toLowerCase() === term) || matches[0] || custom;
              if (pick && !full) {
                toggle(pick);
                setQuery('');
              }
            }
          }}
          className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-[#0F172A] placeholder:text-[#6B7280] focus:outline-none disabled:cursor-not-allowed"
        />
      </label>
      {!full && (
        <div className="flex max-h-[148px] flex-wrap gap-2 overflow-y-auto pr-1">
          {custom && (
            <button type="button" onClick={() => { toggle(custom); setQuery(''); }} className={`${PILL} border-dashed border-[#1447E6] bg-[#EEF2FE] text-[#1447E6]`}>
              + Use “{custom}”
            </button>
          )}
          {matches.map((cat) => (
            <button key={cat} type="button" aria-pressed="false" onClick={() => { toggle(cat); setQuery(''); }} className={pillClass(false)}>
              {cat}
            </button>
          ))}
          {matches.length === 0 && !custom && <span className={MUTED}>No categories match.</span>}
        </div>
      )}
      {error && <FieldError id="categories-error">{error}</FieldError>}
    </div>
  );
}

function SkillsEditor({ requirements, gatesBySkill, onChange, error }) {
  return (
    <div className="flex flex-col gap-3">
      <SkillSearch
        noun="gig"
        label="Skills"
        placeholder="Add a skill, e.g. Power BI"
        requirements={requirements}
        onAdd={(skillName) => onChange([...requirements, { skillName, minRating: NEW_SKILL_LEVEL }])}
      />
      <div id="field-requirements" className="flex flex-col gap-1.5">
        {requirements.length === 0 ? (
          <div className={`rounded-[12px] border border-dashed px-4 py-6 text-center ${error ? 'border-[#DC2626]' : 'border-[#D5D9E0]'} ${MUTED}`}>No skills yet. Search above and add what the work needs.</div>
        ) : (
          <div className="flex flex-col rounded-[12px] border border-[#E4E6EA]">
            {requirements.map((req, index) => {
              const selfDeclared = gatesBySkill.get(req.skillName) === false;
              const remove = () => onChange(requirements.filter((_, i) => i !== index));
              return (
                <div key={req.skillName} className={`flex flex-col gap-3 px-[18px] py-4 ${index ? 'border-t border-[#EEF0F3]' : ''}`}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex flex-wrap items-baseline gap-x-2.5">
                        <span className="text-[15px] font-semibold">{req.skillName}</span>
                        {!selfDeclared && (
                          <span className={`text-[13px] ${MUTED}`}>
                            Minimum <strong className="font-bold text-[#0F172A]">{req.minRating}</strong> / 10 · {levelLabel(req.minRating)}
                          </span>
                        )}
                      </div>
                      {selfDeclared && <span className={`text-[13px] ${MUTED}`}>No AlignGrad test for this yet — shown as a preference, candidates self-declare it.</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      {selfDeclared && <span className="rounded-full bg-[#F1F3F6] px-2.5 py-0.5 text-xs font-semibold text-[#334155]">Self-declared</span>}
                      <TextButton tone="red" onClick={remove} aria-label={`Remove ${req.skillName}`}>
                        Remove
                      </TextButton>
                    </div>
                  </div>
                  {!selfDeclared && <LevelBar skillName={req.skillName} value={req.minRating} onChange={(level) => onChange(requirements.map((r, i) => (i === index ? { ...r, minRating: level } : r)))} />}
                </div>
              );
            })}
          </div>
        )}
        {error && <FieldError id="requirements-error">{error}</FieldError>}
      </div>
    </div>
  );
}

function Preview({ v, company, gatesBySkill }) {
  const name = company?.name || 'Your company';
  const days = deliveryOf(v);
  const logo = v.logo?.preview || v.logo?.url || company?.logoUrl;
  return (
    <section aria-labelledby="gig-preview" className={`${CARD} flex flex-col gap-3 p-[22px]`}>
      <h2 id="gig-preview" className={`m-0 text-[15px] ${MUTED}`}>
        <span className="font-semibold">How candidates will see it</span>
      </h2>
      <div className="flex flex-col gap-3 rounded-[12px] border border-[#E4E6EA] p-4">
        <div className="flex items-start gap-3">
          <div aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#1447E6] text-lg font-bold text-white">
            {logo ? <img src={logo} alt="" className="size-full object-cover" /> : name.charAt(0).toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="break-words text-[15px] font-bold">{v.title.trim() || 'Your gig title'}</span>
            <span className={`text-[13px] ${MUTED}`}>
              {name}
              {company?.verificationStatus === 'APPROVED' && <span className="font-semibold text-[#1E3A8A]"> · Verified</span>}
              {company?.location && ` · ${company.location}`}
            </span>
          </div>
        </div>
        {v.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {v.categories.map((cat) => (
              <span key={cat} className="rounded-full bg-[#EEF2FE] px-2.5 py-0.5 text-xs font-semibold text-[#1E3A8A]">
                {cat}
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className={`text-xs ${MUTED}`}>Budget</span>
            <span className="font-bold">{v.budget ? `${getCurrencySymbol(v.currency)}${Number(v.budget).toLocaleString('en-IN')}` : '—'}</span>
          </div>
          <div className="flex flex-col">
            <span className={`text-xs ${MUTED}`}>Deliver in</span>
            <span className="font-bold">{Number.isInteger(days) && days > 0 ? `${days} day${days === 1 ? '' : 's'}` : '—'}</span>
          </div>
        </div>
        {v.requirements.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {v.requirements.map((req) => (
              <span key={req.skillName} className="rounded-[6px] bg-[#F1F3F6] px-2 py-0.5 text-xs font-medium text-[#334155]">
                {gatesBySkill.get(req.skillName) === false ? req.skillName : `${req.skillName} ≥ ${req.minRating}`}
              </span>
            ))}
          </div>
        )}
        <span aria-hidden="true" className="flex h-10 items-center justify-center rounded-[8px] bg-[#1447E6] font-semibold text-white opacity-85">
          Pitch for this gig
        </span>
      </div>
    </section>
  );
}

/**
 * Post a gig (design: design/gigs_recruiter/Post a gig-html), also used to edit an
 * open or paused gig (title and categories are locked after publishing, as the
 * server enforces). Publishes with POST /gigs or PUT /gigs/:id; files go through
 * the usual upload flow first.
 */
export default function PostGigPage({ gig = null, company, token, onCancel, onSaved, setAlertConfig }) {
  const editing = Boolean(gig);
  const [v, setV] = useState(() => initialValues(gig));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const set = (field) => (value) => {
    setV((prev) => ({ ...prev, [field]: typeof value === 'function' ? value(prev[field]) : value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const poolBars = useMemo(() => v.requirements.map(({ skillName, minRating }) => ({ skillName, minRating })), [v.requirements]);
  const pool = useEligiblePool(token, poolBars);
  const gatesBySkill = useMemo(() => new Map((pool.data?.requirements || []).map((req) => [req.skillName, req.gates])), [pool.data]);

  // Cover image previews are object URLs: release them when replaced or on leaving.
  const logoPreview = v.logo?.preview;
  useEffect(() => () => logoPreview && URL.revokeObjectURL(logoPreview), [logoPreview]);

  const addFiles = (list) => {
    const incoming = Array.from(list || []);
    const room = MAX_FILES - v.files.length;
    const tooBig = incoming.find((file) => file.size > DOC_LIMIT);
    if (tooBig) return setErrors((prev) => ({ ...prev, files: `${tooBig.name} is larger than 10 MB.` }));
    if (incoming.length > room) return setErrors((prev) => ({ ...prev, files: `You can attach up to ${MAX_FILES} files.` }));
    set('files')((prev) => [...prev, ...incoming.map((file) => ({ file, name: file.name, size: file.size }))]);
    return undefined;
  };

  const pickLogo = (file) => {
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) return setErrors((prev) => ({ ...prev, logo: 'Use a JPG, PNG, WEBP or GIF image.' }));
    if (file.size > IMAGE_LIMIT) return setErrors((prev) => ({ ...prev, logo: 'The image must be 2 MB or smaller.' }));
    set('logo')({ file, preview: URL.createObjectURL(file) });
    return undefined;
  };

  const publish = async () => {
    const found = validate(v, editing);
    setErrors(found);
    setSaveError('');
    const first = Object.keys(found)[0];
    if (first) {
      document.getElementById(`field-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSaving(true);
    try {
      const attachments = [];
      for (const item of v.files) attachments.push(item.url || (await upload(item.file, 'doc', token)));
      const logo = v.logo ? v.logo.url || (await upload(v.logo.file, 'image', token)) : null;
      // Skills without a test can't be checked, so they're sent as preferences (no bar).
      const requirements = v.requirements.map(({ skillName, minRating }) => ({ skillName, minRating: gatesBySkill.get(skillName) === false ? 1 : minRating }));
      const days = deliveryOf(v);
      const payload = {
        description: v.description.trim(),
        skills: requirements.map((req) => req.skillName),
        requirements,
        minRating: Math.max(1, ...requirements.map((req) => req.minRating)),
        budget: Number(v.budget),
        currency: v.currency,
        deliveryTime: `${days} day${days === 1 ? '' : 's'}`,
        screeningQuestions: v.questions.map((q) => ({
          ...q,
          question: q.question.trim(),
          options: q.type === 'MCQ' ? q.options.map((o) => o.trim()).filter(Boolean) : [],
          correctAnswer: q.type === 'MCQ' ? String(q.correctAnswer || '').trim() : null
        })),
        attachments,
        logo,
        ...(editing ? {} : { title: v.title.trim(), category: v.categories[0], categories: v.categories })
      };
      const res = await apiFetch(editing ? `/gigs/${gig.id}` : '/gigs', { token, method: editing ? 'PUT' : 'POST', json: payload });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || SERVER_MESSAGE);
      setAlertConfig({ message: editing ? 'Gig updated.' : 'Gig published. Candidates who meet your bars can pitch now.', type: 'success' });
      onSaved(body);
    } catch (err) {
      setSaveError(userMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const descLength = v.description.trim().length;

  return (
    <div className={ACCOUNT_PAGE}>
      <div className="mx-auto flex max-w-[1240px] flex-col gap-[22px]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <button type="button" onClick={onCancel} className={`inline-flex items-center gap-1.5 self-start rounded-[4px] font-medium ${MUTED} hover:text-[#0F172A] ${FOCUS}`}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Gigs
            </button>
            <h1 className={PAGE_TITLE}>
              <span className="font-bold">{editing ? 'Edit gig' : 'Post a gig'}</span>
            </h1>
            <p className={`m-0 text-[15px] ${MUTED}`}>A short paid task. Only candidates who meet your skill bars can pitch for it.</p>
          </div>
          <button type="button" onClick={onCancel} disabled={saving} className={`${SECONDARY_BUTTON} h-11 px-4`}>
            Cancel
          </button>
        </header>

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
            <Section id="gig-brief" title="The brief" step={1}>
              <div id="field-title" className="flex flex-col gap-1.5">
                <Label htmlFor="gig-title" required={!editing}>
                  Gig title
                </Label>
                <input
                  id="gig-title"
                  type="text"
                  maxLength={100}
                  value={v.title}
                  disabled={editing}
                  onChange={(event) => set('title')(event.target.value)}
                  className={controlClass(errors.title, `h-11 px-3 ${editing ? 'cursor-not-allowed bg-[#F8F8F6] text-[#4B5563]' : ''}`)}
                />
                {errors.title ? <FieldError id="title-error">{errors.title}</FieldError> : <span className={`text-[13px] ${MUTED}`}>Say what you’ll receive, e.g. “Excel dashboard”, not “Need help with data”.</span>}
              </div>

              <div id="field-description" className="flex flex-col gap-1.5">
                <Label htmlFor="gig-description" required>
                  What needs to be done
                </Label>
                <textarea
                  id="gig-description"
                  rows={5}
                  maxLength={2000}
                  value={v.description}
                  onChange={(event) => set('description')(event.target.value)}
                  className={controlClass(errors.description, 'h-auto resize-y px-3 py-2.5 leading-[1.5]')}
                />
                {errors.description ? <FieldError id="description-error">{errors.description}</FieldError> : <span className={`text-[13px] ${MUTED}`}>{descLength} / 2,000</span>}
              </div>

              {editing ? (
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">Category</span>
                  <div className="flex flex-wrap gap-2">
                    {v.categories.map((cat) => (
                      <span key={cat} className={`${pillClass(true)} cursor-default opacity-70`}>
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <CategoryPicker value={v.categories} onChange={set('categories')} error={errors.categories} />
              )}
              <span className={`inline-flex items-center gap-1.5 text-[13px] ${MUTED}`}>
                <Lock className="size-3.5" aria-hidden="true" />
                Title and category can’t be changed after you publish.
              </span>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-3">
                <div id="field-files" className="flex flex-col gap-2">
                  <Label optional>Files for the candidate</Label>
                  {v.files.map((item, index) => (
                    <div key={`${item.url || item.name}-${index}`} className="flex items-center gap-2.5 rounded-[8px] border border-[#E4E6EA] px-3 py-2.5">
                      <FileText className={`size-[18px] shrink-0 ${MUTED}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">{item.name}</span>
                        {item.size ? <span className={MUTED}> · {kb(item.size)}</span> : null}
                      </span>
                      <button type="button" onClick={() => set('files')((prev) => prev.filter((_, i) => i !== index))} aria-label={`Remove ${item.name}`} className={`flex size-8 items-center justify-center rounded-[6px] hover:bg-[#F8F8F6] ${MUTED} ${FOCUS}`}>
                        <X className="size-4" />
                      </button>
                    </div>
                  ))}
                  {v.files.length < MAX_FILES && (
                    // Same drop zone as the cover image while empty; a slim button once files are added.
                    <label
                      className={`relative flex cursor-pointer items-center justify-center gap-1 rounded-[8px] border border-dashed border-[#9CA3AF] bg-[#F8F8F6] font-semibold text-[#334155] hover:bg-[#F1F3F6] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1447E6] ${
                        v.files.length ? 'h-10' : 'h-[98px] flex-col'
                      }`}
                    >
                      {!v.files.length && <FilePlus className="size-5" aria-hidden="true" />}
                      {v.files.length ? '+ Add another file' : 'Add a file'}
                      <input type="file" multiple accept={DOC_ACCEPT} className="sr-only" onChange={(event) => { addFiles(event.target.files); event.target.value = ''; }} />
                    </label>
                  )}
                  {errors.files ? <FieldError id="files-error">{errors.files}</FieldError> : <span className={`text-xs ${MUTED}`}>Candidates can open these from the gig page. PDF, Word, ZIP, text or images, up to 10 MB each.</span>}
                </div>
                <div id="field-logo" className="flex flex-col gap-2">
                  <Label optional>Cover image</Label>
                  {v.logo ? (
                    <div className="relative flex h-[98px] items-center justify-center overflow-hidden rounded-[8px] border border-[#E4E6EA] bg-[#F8F8F6]">
                      <img src={v.logo.preview || v.logo.url} alt="Cover" className="size-full object-cover" />
                      <button type="button" onClick={() => set('logo')(null)} aria-label="Remove cover image" className={`absolute right-2 top-2 flex size-8 items-center justify-center rounded-full bg-white/90 text-[#0F172A] shadow ${FOCUS}`}>
                        <X className="size-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="relative flex h-[98px] cursor-pointer flex-col items-center justify-center gap-1 rounded-[8px] border border-dashed border-[#9CA3AF] bg-[#F8F8F6] font-semibold text-[#334155] hover:bg-[#F1F3F6] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1447E6]">
                      <ImagePlus className="size-5" aria-hidden="true" />
                      Upload image
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => { pickLogo(event.target.files?.[0]); event.target.value = ''; }} />
                    </label>
                  )}
                  {errors.logo ? <FieldError id="logo-error">{errors.logo}</FieldError> : <span className={`text-xs ${MUTED}`}>Shown on the gig card. Your company logo is used if empty. Up to 2 MB.</span>}
                </div>
              </div>
            </Section>

            <Section id="gig-money" title="Budget and timeline" step={2}>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(min(220px,100%),1fr))] gap-4">
                <div id="field-budget" className="flex flex-col gap-1.5">
                  <Label htmlFor="gig-budget" required>
                    Fixed budget
                  </Label>
                  <div className={`flex h-11 items-stretch overflow-hidden rounded-[8px] border focus-within:border-[#1447E6] focus-within:ring-2 focus-within:ring-[#1447E6]/20 ${errors.budget ? 'border-[#DC2626]' : 'border-[#D5D9E0]'}`}>
                    <div className="w-[104px] shrink-0 border-r border-[#D5D9E0] bg-[#F8F8F6] px-2.5">
                      <SelectControl bare className="h-full" aria-label="Currency" value={v.currency} onChange={set('currency')} options={SUPPORTED_CURRENCIES.map((c) => [c.code, `${c.symbol} ${c.code}`])} menuMinWidth={140} />
                    </div>
                    <input
                      id="gig-budget"
                      type="text"
                      inputMode="numeric"
                      value={v.budget ? Number(v.budget).toLocaleString('en-IN') : ''}
                      onChange={(event) => set('budget')(event.target.value.replace(/\D/g, '').slice(0, 9))}
                      className="h-full min-w-0 flex-1 border-0 bg-white px-3 text-sm text-[#0F172A] focus:outline-none"
                    />
                  </div>
                  {errors.budget ? <FieldError id="budget-error">{errors.budget}</FieldError> : <span className={`text-[13px] ${MUTED}`}>Candidates see the full amount.</span>}
                </div>
                <div id="field-days" className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold">
                    Deliver within
                    <RequiredMark />
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {DELIVERY_PRESETS.map((d) => (
                      <button key={d} type="button" aria-pressed={v.days === d} onClick={() => set('days')(d)} className={pillClass(v.days === d)}>
                        {d} days
                      </button>
                    ))}
                    <button type="button" aria-pressed={v.days === 'custom'} onClick={() => set('days')('custom')} className={pillClass(v.days === 'custom')}>
                      Other
                    </button>
                  </div>
                  {v.days === 'custom' && (
                    <label className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        aria-label="Number of days"
                        value={v.customDays}
                        onChange={(event) => set('customDays')(event.target.value.replace(/\D/g, '').slice(0, 3))}
                        className={controlClass(errors.days, 'h-11 w-24 px-3')}
                      />
                      <span className={MUTED}>days</span>
                    </label>
                  )}
                  {errors.days ? <FieldError id="days-error">{errors.days}</FieldError> : <span className={`text-[13px] ${MUTED}`}>Counted from the day you hire someone.</span>}
                </div>
              </div>
            </Section>

            <Section id="gig-skills" title="Skills needed" step={3} intro="Set a minimum score for skills AlignGrad tests. Candidates below a bar can’t pitch.">
              <SkillsEditor requirements={v.requirements} gatesBySkill={gatesBySkill} onChange={set('requirements')} error={errors.requirements} />
            </Section>

            <Section id="gig-questions" title="Questions with each pitch" step={4} optional intro="Candidates answer these when they pitch. Leave empty to let them pitch directly.">
              <div id="field-questions" className="flex flex-col gap-2">
                <ScreeningEditor questions={v.questions} onChange={set('questions')} types={GIG_QUESTION_TYPES} />
                {errors.questions && <FieldError id="questions-error">{errors.questions}</FieldError>}
              </div>
            </Section>

            <div className={`${CARD} flex flex-wrap items-center justify-between gap-3 px-[22px] py-[18px]`}>
              <span className={MUTED}>{editing ? 'Changes show on the gig page as soon as you save.' : 'Candidates who meet your bars can pitch right away.'}</span>
              <div className="flex gap-2">
                <button type="button" onClick={onCancel} disabled={saving} className={`${SECONDARY_BUTTON} h-11 px-[18px]`}>
                  Cancel
                </button>
                <button type="button" onClick={publish} disabled={saving} className={`${PRIMARY_BUTTON} h-11 px-5`}>
                  {saving && <Spinner />}
                  {saving ? (editing ? 'Saving…' : 'Publishing…') : editing ? 'Save changes' : 'Publish gig'}
                </button>
              </div>
              {saveError && (
                <p role="alert" className="m-0 w-full rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[#991B1B]">
                  {saveError}
                </p>
              )}
            </div>
          </div>

          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
            <section aria-labelledby="gig-reach" aria-live="polite" className={`${CARD} flex flex-col gap-2.5 p-[22px]`}>
              <h2 id="gig-reach" className={`m-0 text-[15px] ${MUTED}`}>
                <span className="font-semibold">Candidates who can pitch</span>
              </h2>
              {pool.status === 'idle' ? (
                <span className={MUTED}>Add skills to see how many candidates meet your bars.</span>
              ) : pool.status === 'error' ? (
                <span className="text-[#B91C1C]">
                  Couldn’t count candidates. {pool.error}{' '}
                  <button type="button" onClick={pool.retry} className="font-semibold text-[#1447E6] hover:underline">
                    Try again
                  </button>
                </span>
              ) : (
                <>
                  <div className="flex items-baseline gap-2.5">
                    <span className={`text-[40px] font-bold leading-none tabular-nums ${pool.status === 'loading' ? 'opacity-50' : ''}`}>{pool.data ? pool.data.eligible.toLocaleString('en-IN') : '…'}</span>
                    <span className={MUTED}>meet your bars today</span>
                  </div>
                  {pool.data && <span className="text-[#334155]">Out of {pool.data.total.toLocaleString('en-IN')} candidates on AlignGrad.</span>}
                </>
              )}
            </section>

            <Preview v={v} company={company} gatesBySkill={gatesBySkill} />

            <section aria-labelledby="gig-tips" className={`${CARD} flex flex-col gap-2.5 p-[22px]`}>
              <h2 id="gig-tips" className={`m-0 text-[15px] ${MUTED}`}>
                <span className="font-semibold">Good briefs get better pitches</span>
              </h2>
              <ul className="m-0 flex flex-col gap-1.5 pl-[18px] text-[#334155]">
                <li>Say exactly what file or result you’ll receive</li>
                <li>Attach a sample of the data, with personal details removed</li>
                <li>Keep it small enough to finish in the time you set</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
