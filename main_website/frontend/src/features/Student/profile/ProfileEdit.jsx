import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, ChevronLeft, Camera, X } from 'lucide-react';
import { INDIAN_STATES } from '../../../constants/indianStates';
import { apiFetch, userMessage } from '../../../services/apiClient';
import { DOB_MIN, toDateInputValue, todayInputValue } from '../../../utils/dateInput';
import { PLATFORM_UNLOCK_PERCENT } from '../../../utils/profileCompleteness';
import {
  COUNTRY_CODES,
  GENDERS,
  LIMITS,
  WORK_MODES,
  WORK_TYPES,
  bioError,
  cleanDigits,
  cleanMultiline,
  cleanName,
  cleanUrl,
  cleanUsername,
  dobError,
  emailError,
  initialOf,
  joinPhone,
  nameError,
  normalizeUrl,
  phoneError,
  splitName,
  splitPhone,
  urlError,
  usernameError
} from './profileRules';
import { BODY, CARD, DANGER_OUTLINE, GRADIENT, HEADING_FONT, INK, MUTED, PAGE, PRIMARY, SECONDARY, SMALL } from './profileTheme';
import SectionBar from './SectionBar';
import { LIST_LAYER, layerTarget, listHeight, placeBelow, useFollow } from './floatingList';
import { Checkbox, ConfirmDialog, Dropdown, ErrorBanner, Field, PillGroup, RequiredNote, Spinner, TextArea, TextInput } from './ui';
import { PHOTO, uploadProfilePhoto } from './uploads';

// Order used to move focus to the first field that needs fixing.
const FIELD_IDS = [
  ['firstName', 'edit-first-name'],
  ['lastName', 'edit-last-name'],
  ['username', 'edit-username'],
  ['email', 'edit-email'],
  ['bio', 'edit-bio'],
  ['phone', 'edit-phone'],
  ['dob', 'edit-dob'],
  ['gender', 'edit-gender'],
  ['linkedin', 'edit-linkedin'],
  ['github', 'edit-github'],
  ['portfolio', 'edit-portfolio']
];

function draftFrom(data) {
  const [firstName, lastName] = splitName(cleanName(data.name || ''));
  const phone = splitPhone(data.phone);
  const links = data.socialLinks || {};
  return {
    profilePic: data.profilePic || '',
    firstName,
    lastName,
    username: cleanUsername(data.username || ''),
    bio: data.bio || '',
    code: COUNTRY_CODES.some((item) => item.code === phone.code) ? phone.code : '+91',
    digits: phone.digits.slice(0, 15),
    email: data.email || '',
    dob: toDateInputValue(data.dob),
    gender: data.gender || '',
    linkedin: links.linkedin || '',
    github: links.github || '',
    portfolio: links.portfolio || '',
    workTypes: data.preferredWorkTypes || [],
    workModes: data.preferredWorkModes || [],
    cities: data.preferredLocations || [],
    openToAnyLocation: Boolean(data.openToAnyLocation)
  };
}

const PHONE_OPTIONS = COUNTRY_CODES.map((item) => ({ value: item.code, label: item.label, short: item.code }));
const GENDER_OPTIONS = GENDERS.map((gender) => ({ value: gender, label: gender }));

function Section({ id, title, subtitle, children }) {
  return (
    <section aria-labelledby={id} className={`${CARD} flex flex-col gap-[18px] p-5 sm:p-6`}>
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className="m-0 text-[17px] leading-snug">
          <span className={`${HEADING_FONT} font-bold ${INK}`}>{title}</span>
        </h2>
        {subtitle && <span className={MUTED}>{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

/** Cities: chips plus a search over the city and state list (only listed places are accepted). */
function CityPicker({ value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [note, setNote] = useState('');
  const [box, setBox] = useState(null);
  const inputRef = useRef(null);
  const text = query.trim().toLowerCase();
  const matches = INDIAN_STATES.filter((place) => !value.includes(place) && (!text || place.toLowerCase().includes(text))).slice(0, 8);
  const close = useCallback(() => setOpen(false), []);
  // The list floats above the page (it never changes the page height, so a click
  // on Save right after picking a city isn't lost to the page shifting).
  useFollow(open, inputRef, listHeight(8), setBox, close);

  const show = () => {
    const placed = inputRef.current ? placeBelow(inputRef.current, listHeight(8)) : null;
    if (placed) setBox(placed);
    setOpen(true);
  };

  const add = (place) => {
    setQuery('');
    setActive(-1);
    if (value.length >= LIMITS.cities) {
      setNote(`You can pick up to ${LIMITS.cities} places.`);
      return;
    }
    setNote('');
    onChange([...value, place]);
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="edit-city" className={`text-[14px] font-semibold ${INK}`}>
        Cities
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id="edit-city"
          role="combobox"
          aria-expanded={open && matches.length > 0}
          aria-controls="edit-city-list"
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `edit-city-option-${active}` : undefined}
          autoComplete="off"
          value={query}
          maxLength={60}
          onChange={(event) => {
            setQuery(event.target.value.replace(/[^\p{L}\s,.-]/gu, ''));
            if (!open) show();
            setActive(-1);
            setNote('');
          }}
          onFocus={show}
          onBlur={() => setOpen(false)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault();
              if (!open) show();
              setActive((index) => (event.key === 'ArrowDown' ? Math.min(matches.length - 1, index + 1) : Math.max(0, index - 1)));
            } else if (event.key === 'Enter') {
              event.preventDefault();
              const pick = matches[active >= 0 ? active : 0];
              if (pick && (text || active >= 0)) add(pick);
              else if (text) setNote('Pick a place from the list.');
            } else if (event.key === 'Escape' && open) {
              event.stopPropagation();
              setOpen(false);
            }
          }}
          placeholder="Add a city or district"
          className="h-11 w-full rounded-[10px] border border-[#C9D1E3] bg-white px-3.5 text-[15px] text-[#0E1B3D] placeholder:text-[#6B7591] hover:border-[#9AA6C8] focus:border-[#0167F6] focus:outline-none focus:ring-[3px] focus:ring-[#0167F6]/15"
        />
        {open &&
          box &&
          createPortal(
            <ul id="edit-city-list" role="listbox" style={{ top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }} className={LIST_LAYER}>
              {matches.length === 0 ? (
                <li className={`px-3 py-2.5 text-[14px] ${MUTED}`}>No matching city or state</li>
              ) : (
                matches.map((place, index) => (
                  <li
                    key={place}
                    id={`edit-city-option-${index}`}
                    role="option"
                    aria-selected={index === active}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => add(place)}
                    className={`cursor-pointer rounded-[8px] px-3 py-2.5 text-[14.5px] ${BODY} ${index === active ? 'bg-[#EEF2FF]' : ''}`}
                  >
                    {place}
                  </li>
                ))
              )}
            </ul>,
            layerTarget()
          )}
      </div>
      {note && <span className="text-[13px] font-medium text-[#B42318]">{note}</span>}
      {value.length > 0 && (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Selected cities">
          {value.map((place) => (
            <li key={place} className="inline-flex h-[34px] items-center rounded-full bg-[#E8EEFF] pl-3 pr-0.5 text-[14px] font-semibold text-[#0B3FA8]">
              {place}
              <button type="button" aria-label={`Remove ${place}`} onClick={() => onChange(value.filter((item) => item !== place))} className="flex size-[30px] items-center justify-center rounded-full hover:bg-[#D5E0FF]">
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * About you and job preferences (design: Web — edit about you and preferences).
 * Holds a draft; nothing is saved until "Save changes". `firstTime` turns it into
 * step 1 of the profile set-up.
 */
export default function ProfileEdit({ data, token, sections, onNavigate, firstTime, onSave, onCancel }) {
  const initial = useMemo(() => draftFrom(data), [data]);
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState({ uploading: false, error: '' });
  const [nameCheck, setNameCheck] = useState({ status: initial.username ? 'mine' : '', message: '' });
  // Where to go once the candidate confirms leaving with unsaved changes.
  const [pendingLeave, setPendingLeave] = useState(null);
  const photoRef = useRef(null);
  const checkRef = useRef({ timer: null, seq: 0 });
  const formRef = useRef(null);

  useEffect(() => () => clearTimeout(checkRef.current.timer), []);

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  const set = (key) => (value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key === 'digits' || key === 'code' ? 'phone' : key]: '' }));
  };

  const changeUsername = (value) => {
    set('username')(value);
    clearTimeout(checkRef.current.timer);
    const seq = ++checkRef.current.seq;
    if (value === initial.username && value) return setNameCheck({ status: 'mine', message: '' });
    if (!value) return setNameCheck({ status: '', message: '' });
    if (usernameError(value, '')) return setNameCheck({ status: 'invalid', message: '' });
    setNameCheck({ status: 'checking', message: 'Checking…' });
    checkRef.current.timer = setTimeout(async () => {
      try {
        const res = await apiFetch(`/student/check-username?username=${encodeURIComponent(value)}`, { token });
        const body = await res.json().catch(() => ({}));
        if (seq !== checkRef.current.seq) return;
        if (res.ok && body.available) setNameCheck({ status: body.isCurrent ? 'mine' : 'available', message: body.isCurrent ? '' : 'Available' });
        else if (res.ok || res.status === 400) setNameCheck({ status: 'taken', message: body.reason || '' });
        else setNameCheck({ status: 'unknown', message: '' });
      } catch (err) {
        if (seq !== checkRef.current.seq) return;
        // The server checks again on save, so a failed check doesn't block saving.
        console.warn('[profile] Username check failed:', err);
        setNameCheck({ status: 'unknown', message: '' });
      }
    }, 400);
  };

  const pickPhoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!PHOTO.types.includes(file.type)) return setPhoto({ uploading: false, error: 'Choose a JPG or PNG photo.' });
    if (file.size > PHOTO.maxBytes) return setPhoto({ uploading: false, error: 'Choose a photo under 5 MB.' });
    setPhoto({ uploading: true, error: '' });
    try {
      const url = await uploadProfilePhoto(file, token);
      set('profilePic')(url);
      setPhoto({ uploading: false, error: '' });
    } catch (err) {
      setPhoto({ uploading: false, error: userMessage(err, 'The photo didn’t upload. Try again.') });
    }
  };

  const validate = () => {
    const next = {
      firstName: nameError(draft.firstName, 'first name'),
      lastName: nameError(draft.lastName, 'last name'),
      username: usernameError(draft.username, nameCheck.status === 'invalid' ? '' : nameCheck.status),
      email: emailError(draft.email),
      bio: bioError(draft.bio),
      phone: phoneError(draft.code, draft.digits),
      dob: dobError(draft.dob),
      gender: draft.gender ? '' : 'Choose your gender.',
      linkedin: urlError(draft.linkedin, { field: 'LinkedIn link', host: 'linkedin.com' }),
      github: urlError(draft.github, { field: 'GitHub link', host: 'github.com' }),
      portfolio: urlError(draft.portfolio, { field: 'website link' })
    };
    if (`${draft.firstName.trim()} ${draft.lastName.trim()}`.length > 100) next.lastName = 'Enter a valid last name.';
    setErrors(next);
    return FIELD_IDS.find(([key]) => next[key]);
  };

  const save = async (event) => {
    event.preventDefault();
    if (saving || photo.uploading) return;
    setFormError('');
    const firstBad = validate();
    if (firstBad) {
      setFormError('Some details need fixing.');
      document.getElementById(firstBad[1])?.focus();
      return;
    }
    setSaving(true);
    const links = data.socialLinks || {};
    const linkedin = draft.linkedin ? normalizeUrl(draft.linkedin) : '';
    const github = draft.github ? normalizeUrl(draft.github) : '';
    const portfolio = draft.portfolio ? normalizeUrl(draft.portfolio) : '';
    const result = await onSave({
      name: `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim(),
      username: draft.username,
      profilePic: draft.profilePic,
      bio: draft.bio.trim(),
      email: draft.email.trim(),
      phone: joinPhone(draft.code, draft.digits),
      dob: draft.dob,
      gender: draft.gender,
      socialLinks: {
        ...links,
        linkedin,
        github,
        portfolio,
        showLinkedin: Boolean(linkedin),
        showGithub: Boolean(github),
        showPortfolio: Boolean(portfolio)
      },
      preferredWorkTypes: draft.workTypes,
      preferredWorkModes: draft.workModes,
      preferredLocations: draft.cities,
      openToAnyLocation: draft.openToAnyLocation
    });
    if (!result.ok) {
      setSaving(false);
      setFormError(result.error);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Leaving the page (Cancel, back, or another section) asks first when there are unsaved changes.
  const leave = (next = onCancel) => (dirty ? setPendingLeave(() => next) : next());
  const bioLength = draft.bio.trim().length;
  const fullName = `${draft.firstName} ${draft.lastName}`.trim();
  const usernameHint =
    nameCheck.status === 'available' ? (
      <span className="inline-flex items-center gap-1 font-semibold text-[#0F7A55]">
        <CheckCircle2 aria-hidden="true" className="size-3.5" /> Available
      </span>
    ) : nameCheck.status === 'checking' ? (
      'Checking if it’s free…'
    ) : nameCheck.status === 'taken' ? (
      <span className="font-semibold text-[#B42318]">This username is taken.</span>
    ) : (
      'Letters, numbers and underscores'
    );

  return (
    <div className={PAGE}>
      <form ref={formRef} noValidate onSubmit={save} className="mx-auto flex w-full max-w-[1240px] scroll-mt-6 flex-col gap-5">
        <header className="flex flex-col gap-1.5">
          <button type="button" onClick={() => leave()} className={`${SECONDARY} ${SMALL} self-start`}>
            <ChevronLeft aria-hidden="true" className="size-4" /> Back to profile
          </button>
          {firstTime && <span className="self-start rounded-full bg-[#F1ECFF] px-2.5 py-1 text-[12.5px] font-bold text-[#5B2AA6]">Step 1 of 2 · About you</span>}
          <h1 className="m-0 text-[26px] leading-tight sm:text-[28px]">
            <span className={`${HEADING_FONT} font-bold ${INK}`}>{firstTime ? 'Set up your profile' : 'About you and job preferences'}</span>
          </h1>
          {firstTime && <p className={`m-0 ${MUTED}`}>Fill this in, then add the rest of your profile. At {PLATFORM_UNLOCK_PERCENT}% it unlocks jobs, skill tests, courses and gigs.</p>}
        </header>

        <SectionBar items={sections} active="about" onSelect={(id) => id !== 'about' && leave(() => onNavigate(id))} />

        <div className="flex w-full max-w-[960px] flex-col gap-5">
          <ErrorBanner message={formError} />
          <RequiredNote />

          <Section id="edit-about" title="About you">
            <div className="flex flex-wrap items-center gap-4">
              <span aria-hidden="true" className={`flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-[24px] font-bold text-white ${draft.profilePic ? 'bg-[#E8EEFF]' : GRADIENT}`}>
                {draft.profilePic ? <img src={draft.profilePic} alt="" className="size-full object-cover" /> : initialOf(fullName)}
              </span>
              <input ref={photoRef} type="file" accept={PHOTO.types.join(',')} className="hidden" tabIndex={-1} onChange={pickPhoto} />
              <button type="button" onClick={() => photoRef.current?.click()} disabled={photo.uploading} className={`${SECONDARY} h-10 px-3.5`}>
                {photo.uploading ? <Spinner /> : <Camera aria-hidden="true" className="size-4" />}
                {photo.uploading ? 'Uploading…' : draft.profilePic ? 'Change photo' : 'Upload a photo'}
              </button>
              {draft.profilePic && !photo.uploading && (
                <button type="button" onClick={() => set('profilePic')('')} className={`${DANGER_OUTLINE} h-10 px-3.5`}>
                  Remove photo
                </button>
              )}
              <span className={`text-[14px] ${photo.error ? 'font-medium text-[#B42318]' : MUTED}`} role={photo.error ? 'alert' : undefined}>
                {photo.error || 'A clear face photo. JPG or PNG, up to 5 MB.'}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="edit-first-name" label="First name" required error={errors.firstName}>
                <TextInput id="edit-first-name" autoComplete="given-name" value={draft.firstName} onChange={set('firstName')} clean={cleanName} maxLength={LIMITS.name} error={errors.firstName} placeholder="e.g. Sneha" />
              </Field>
              <Field id="edit-last-name" label="Last name" required error={errors.lastName}>
                <TextInput id="edit-last-name" autoComplete="family-name" value={draft.lastName} onChange={set('lastName')} clean={cleanName} maxLength={LIMITS.name} error={errors.lastName} placeholder="e.g. Rawat" />
              </Field>
              <Field id="edit-username" label="Username" required error={errors.username} hint={usernameHint}>
                <div className="relative">
                  <span className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${MUTED}`}>@</span>
                  <TextInput id="edit-username" autoComplete="username" value={draft.username} onChange={changeUsername} clean={cleanUsername} maxLength={15} error={errors.username} hint="username" className="pl-8" placeholder="e.g. krn_rwt" />
                </div>
              </Field>
              <Field id="edit-email" label="Email" required error={errors.email}>
                <TextInput id="edit-email" type="email" inputMode="email" autoComplete="email" value={draft.email} onChange={set('email')} clean={(value) => value.replace(/\s/g, '')} maxLength={LIMITS.email} error={errors.email} placeholder="name@example.com" />
              </Field>
            </div>

            <Field
              id="edit-bio"
              label="Short intro"
              required
              error={errors.bio}
              hint="What you’re good at and the job you want"
              counter={{ text: `${bioLength}/${LIMITS.bio}`, over: bioLength > LIMITS.bio }}
            >
              <TextArea id="edit-bio" rows={3} value={draft.bio} onChange={set('bio')} clean={cleanMultiline} error={errors.bio} hint="bio" placeholder="e.g. B.Tech CSE graduate (2026) who likes turning messy data into clear reports. Looking for a data analyst role in Hyderabad." />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="edit-phone" label="Phone number" required error={errors.phone}>
                <div className="flex gap-2">
                  <Dropdown id="edit-phone-code" ariaLabel="Country code" value={draft.code} onChange={set('code')} options={PHONE_OPTIONS} columns={2} className="w-[104px] shrink-0" />
                  <div className="min-w-0 flex-1">
                  <TextInput
                    id="edit-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={draft.digits}
                    onChange={set('digits')}
                    clean={(value) => cleanDigits(value).slice(0, COUNTRY_CODES.find((item) => item.code === draft.code)?.length || 15)}
                    error={errors.phone}
                    placeholder={draft.code === '+91' ? '98765 43210' : 'Phone number'}
                  />
                  </div>
                </div>
              </Field>
              <Field id="edit-dob" label="Date of birth" required error={errors.dob} hint="You need to be at least 17">
                <TextInput id="edit-dob" type="date" min={DOB_MIN} max={todayInputValue()} value={draft.dob} onChange={set('dob')} error={errors.dob} hint="dob" />
              </Field>
              <Field id="edit-gender" label="Gender" required error={errors.gender}>
                <Dropdown id="edit-gender" value={draft.gender} onChange={set('gender')} options={GENDER_OPTIONS} placeholder="Choose" error={errors.gender} />
              </Field>
            </div>
          </Section>

          <Section id="edit-links" title="Links">
            <div className="grid gap-4 md:grid-cols-3">
              <Field id="edit-linkedin" label="LinkedIn" error={errors.linkedin}>
                <TextInput id="edit-linkedin" type="url" inputMode="url" value={draft.linkedin} onChange={set('linkedin')} clean={cleanUrl} maxLength={LIMITS.url} error={errors.linkedin} onBlur={() => draft.linkedin && !urlError(draft.linkedin, { host: 'linkedin.com' }) && set('linkedin')(normalizeUrl(draft.linkedin))} placeholder="https://linkedin.com/in/…" />
              </Field>
              <Field id="edit-github" label="GitHub" error={errors.github}>
                <TextInput id="edit-github" type="url" inputMode="url" value={draft.github} onChange={set('github')} clean={cleanUrl} maxLength={LIMITS.url} error={errors.github} onBlur={() => draft.github && !urlError(draft.github, { host: 'github.com' }) && set('github')(normalizeUrl(draft.github))} placeholder="https://github.com/…" />
              </Field>
              <Field id="edit-portfolio" label="Portfolio or website" error={errors.portfolio}>
                <TextInput id="edit-portfolio" type="url" inputMode="url" value={draft.portfolio} onChange={set('portfolio')} clean={cleanUrl} maxLength={LIMITS.url} error={errors.portfolio} onBlur={() => draft.portfolio && !urlError(draft.portfolio) && set('portfolio')(normalizeUrl(draft.portfolio))} placeholder="https://…" />
              </Field>
            </div>
          </Section>

          <Section id="edit-prefs" title="What you’re looking for" subtitle="Decides which jobs and gigs we show you first">
            <div className="grid gap-[18px] md:grid-cols-2">
              <PillGroup id="edit-types" legend="Open to" hint="Leave all off to see every type" options={WORK_TYPES} value={draft.workTypes} multiple onChange={set('workTypes')} />
              <PillGroup id="edit-modes" legend="Work mode" hint="Leave all off if any mode works" options={WORK_MODES} value={draft.workModes} multiple onChange={set('workModes')} />
              <div className="flex flex-col gap-1">
                <CityPicker value={draft.cities} onChange={set('cities')} />
                <Checkbox id="edit-anywhere" checked={draft.openToAnyLocation} onChange={set('openToAnyLocation')}>
                  Open to moving anywhere in India
                </Checkbox>
              </div>
            </div>
          </Section>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {dirty && !saving && <span className={`mr-auto text-[14px] ${MUTED}`}>You have unsaved changes.</span>}
            <button type="button" onClick={() => leave()} disabled={saving} className={`${SECONDARY} h-11 px-[18px]`}>
              Cancel
            </button>
            <button type="submit" disabled={saving || photo.uploading} className={`${PRIMARY} h-11 px-6`}>
              {saving && <Spinner />}
              {saving ? 'Saving…' : firstTime ? 'Save and continue' : 'Save changes'}
            </button>
          </div>
        </div>
      </form>

      {pendingLeave && (
        <ConfirmDialog title="Leave without saving?" tone="danger" confirmLabel="Discard changes" onConfirm={pendingLeave} onClose={() => setPendingLeave(null)}>
          Your changes on this page will be lost.
        </ConfirmDialog>
      )}
    </div>
  );
}
