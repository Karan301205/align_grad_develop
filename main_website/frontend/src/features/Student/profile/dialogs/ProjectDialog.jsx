import { useRef, useState } from 'react';
import { CheckCircle2, Film, Play, X } from 'lucide-react';
import { ALL_SKILLS } from '../../../../constants';
import { userMessage } from '../../../../services/apiClient';
import { DATE_MAX, DATE_MIN, dateBound, toDateInputValue } from '../../../../utils/dateInput';
import { LIMITS, cleanLine, cleanMultiline, cleanRole, cleanSkill, cleanUrl, errorCount, normalizeUrl, rangeErrors, textError, urlError } from '../profileRules';
import { DANGER_OUTLINE, INK, MUTED, SECONDARY, fieldClass } from '../profileTheme';
import { Checkbox, ConfirmDialog, Dialog, DialogFooter, ErrorBanner, Field, Spinner, TextArea, TextInput } from '../ui';
import { PROJECT_VIDEO, readVideoDuration, uploadVideo } from '../uploads';

const EMPTY = { title: '', role: '', codeUrl: '', hostedUrl: '', startDate: '', endDate: '', currentlyWorking: false, description: '', skills: [], videoUrl: '' };
const PROJECT_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];

/** Skills used: tags typed with Enter or comma, with matches from the skill list and the candidate's own skills. */
function SkillTags({ value, onChange, profileSkills }) {
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const has = (name) => value.some((item) => item.toLowerCase() === name.toLowerCase());

  // Adds one or more typed skills (a paste can hold several, separated by commas).
  const add = (...raws) => {
    setText('');
    const next = [...value];
    let message = '';
    raws.forEach((raw) => {
      const name = cleanSkill(raw).trim();
      if (!name) return;
      if (!/\p{L}/u.test(name)) message = 'Enter a valid skill.';
      else if (next.some((item) => item.toLowerCase() === name.toLowerCase())) message = `${name} is already added.`;
      else if (next.length >= LIMITS.projectSkills) message = `You can tag up to ${LIMITS.projectSkills} skills.`;
      else next.push(ALL_SKILLS.find((item) => item.skill.toLowerCase() === name.toLowerCase())?.skill || name);
    });
    setNote(message);
    if (next.length !== value.length) onChange(next);
  };

  const query = text.trim().toLowerCase();
  const matches = query ? ALL_SKILLS.filter((item) => item.skill.toLowerCase().includes(query) && !has(item.skill)).slice(0, 6) : [];
  const fromProfile = (profileSkills || []).map((skill) => skill.name).filter((name) => name && !has(name)).slice(0, 8);

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor="project-skills" className={`text-[14px] font-semibold ${INK}`}>
        Skills used
      </label>
      <input
        id="project-skills"
        value={text}
        maxLength={LIMITS.skill}
        autoComplete="off"
        aria-describedby={note ? 'project-skills-note' : undefined}
        onChange={(event) => {
          const next = event.target.value;
          if (next.includes(',')) {
            const pieces = next.split(',');
            const last = pieces.pop();
            add(...pieces);
            setText(cleanSkill(last));
          } else setText(cleanSkill(next));
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            add(text);
          }
        }}
        onBlur={() => text.trim() && add(text)}
        placeholder="Type a skill and press Enter"
        className={fieldClass(note, 'h-11')}
      />
      {note && (
        <span id="project-skills-note" className="text-[13px] font-medium text-[#B42318]">
          {note}
        </span>
      )}
      {value.length > 0 && (
        <ul aria-label="Skills used on this project" className="m-0 flex list-none flex-wrap gap-2 p-0">
          {value.map((skill) => (
            <li key={skill} className="inline-flex h-[32px] items-center rounded-full bg-[#E8EEFF] pl-3 pr-0.5 text-[14px] font-semibold text-[#0B3FA8]">
              {skill}
              <button type="button" aria-label={`Remove ${skill}`} onClick={() => onChange(value.filter((item) => item !== skill))} className="flex size-7 items-center justify-center rounded-full hover:bg-[#D5E0FF]">
                <X aria-hidden="true" className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {matches.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[13px] ${MUTED}`}>Matches:</span>
          {matches.map((item) => (
            <button key={item.skill} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => add(item.skill)} className="h-8 rounded-full border border-[#C9D1E3] bg-white px-3 text-[13px] font-semibold text-[#1B2B55] hover:border-[#0167F6] hover:text-[#0167F6]">
              + {item.skill}
            </button>
          ))}
        </div>
      )}
      {fromProfile.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`text-[13px] ${MUTED}`}>From your skills:</span>
          {fromProfile.map((name) => (
            <button key={name} type="button" onClick={() => add(name)} className="h-8 rounded-full border border-dashed border-[#9AA6C8] bg-white px-3 text-[13px] font-semibold text-[#1B2B55] hover:border-[#7B3FD0] hover:text-[#7B3FD0]">
              + {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Add a project / edit a project (design: Web — add a project dialog).
 * `onSave(record)` and `onRemove()` resolve to { ok, error }.
 */
export default function ProjectDialog({ project, token, profileSkills, onSave, onRemove, onClose, onPlayVideo }) {
  const editing = Boolean(project);
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(project || {}), skills: Array.isArray(project?.skills) ? project.skills : [], videoUrl: project?.videoUrl || '' }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [video, setVideo] = useState({ uploading: false, progress: 0, error: '', name: '' });
  // True while the candidate types a video link by hand (keeps the link field on screen).
  const [linkMode, setLinkMode] = useState(false);
  const fileRef = useRef(null);

  const set = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const pickVideo = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const fail = (message) => setVideo({ uploading: false, progress: 0, error: message, name: '' });
    if (!PROJECT_VIDEO_TYPES.includes(file.type)) return fail('Upload an MP4, MOV, WebM or MKV video.');
    if (file.size > PROJECT_VIDEO.maxBytes) return fail('Upload a video under 100 MB.');
    setVideo({ uploading: true, progress: 2, error: '', name: file.name });
    try {
      const duration = await readVideoDuration(file);
      if (duration !== null && duration > PROJECT_VIDEO.maxSeconds + 0.5) {
        return fail('The video must be 90 seconds or less.');
      }
      const url = await uploadVideo(file, { token, category: 'project', onProgress: (progress) => setVideo((prev) => ({ ...prev, progress })) });
      set('videoUrl')(url);
      setLinkMode(false);
      setVideo({ uploading: false, progress: 100, error: '', name: file.name });
    } catch (err) {
      fail(userMessage(err, 'The video didn’t upload. Try again.'));
    }
  };

  const validate = () => {
    const range = rangeErrors({ start: form.startDate, end: form.endDate, ongoing: form.currentlyWorking, startLabel: 'start date', endLabel: 'finish date', endNotFuture: true });
    const next = {
      title: textError(form.title, { field: 'the project name', required: true, max: LIMITS.title }),
      role: textError(form.role, { field: 'your role', required: true, max: LIMITS.role }),
      description: textError(form.description, { field: 'what you did', name: 'description', required: true, min: 20, max: LIMITS.description }),
      startDate: range.start,
      endDate: range.end,
      codeUrl: urlError(form.codeUrl, { field: 'code link' }),
      hostedUrl: urlError(form.hostedUrl, { field: 'live link' }),
      videoUrl: urlError(form.videoUrl, { field: 'video link' })
    };
    setErrors(next);
    return errorCount(next) === 0;
  };

  const save = async () => {
    setError('');
    if (!validate()) {
      setError('Some details need fixing.');
      return;
    }
    setBusy(true);
    const record = {
      ...form,
      title: form.title.trim(),
      role: form.role.trim(),
      description: form.description.trim(),
      codeUrl: form.codeUrl ? normalizeUrl(form.codeUrl) : '',
      hostedUrl: form.hostedUrl ? normalizeUrl(form.hostedUrl) : '',
      videoUrl: form.videoUrl ? normalizeUrl(form.videoUrl) : '',
      startDate: toDateInputValue(form.startDate),
      endDate: form.currentlyWorking ? '' : toDateInputValue(form.endDate),
      skills: form.skills
    };
    const result = await onSave(record);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    const result = await onRemove();
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
      setConfirmRemove(false);
    }
  };

  return (
    <Dialog
      title={editing ? 'Edit project' : 'Add a project'}
      subtitle="College, personal or internship work you’re proud of"
      onClose={onClose}
      busy={busy || video.uploading}
      footer={<DialogFooter busy={busy} disabled={video.uploading} saveLabel="Save project" onCancel={onClose} onSave={save} onRemove={editing ? () => setConfirmRemove(true) : null} />}
    >
      <ErrorBanner message={error} />
      <Field id="project-title" label="Project name" required error={errors.title}>
        <TextInput id="project-title" data-autofocus value={form.title} onChange={set('title')} clean={cleanLine} maxLength={LIMITS.title} error={errors.title} placeholder="e.g. Ticket-sales dashboard for our college fest" />
      </Field>
      <Field id="project-role" label="Your role" required error={errors.role} hint="What you did on it, e.g. Built the dashboard">
        <TextInput id="project-role" value={form.role} onChange={set('role')} clean={cleanRole} maxLength={LIMITS.role} error={errors.role} hint="role" placeholder="e.g. Built the dashboard, cleaned the data" />
      </Field>
      <Field
        id="project-description"
        label="What you did"
        required
        error={errors.description}
        hint="One point per line. Each line becomes a bullet."
        counter={{ text: `${form.description.trim().length}/${LIMITS.description}`, over: form.description.trim().length > LIMITS.description }}
      >
        <TextArea id="project-description" value={form.description} onChange={set('description')} clean={cleanMultiline} rows={4} error={errors.description} hint="bullets" placeholder={'Combined ticket sales from 3 counters into one sheet\nBuilt a dashboard of sales by day'} />
      </Field>
      <SkillTags value={form.skills} onChange={set('skills')} profileSkills={profileSkills} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="project-start" label="Started" required error={errors.startDate}>
          <TextInput id="project-start" type="date" min={DATE_MIN} max={dateBound(form.endDate, DATE_MAX)} value={toDateInputValue(form.startDate)} onChange={set('startDate')} error={errors.startDate} />
        </Field>
        <Field id="project-end" label="Finished" error={errors.endDate}>
          <TextInput id="project-end" type="date" min={dateBound(form.startDate, DATE_MIN)} max={DATE_MAX} disabled={form.currentlyWorking} value={form.currentlyWorking ? '' : toDateInputValue(form.endDate)} onChange={set('endDate')} error={errors.endDate} />
        </Field>
      </div>
      <div className="-mt-2">
        <Checkbox id="project-ongoing" checked={form.currentlyWorking} onChange={(checked) => setForm((prev) => ({ ...prev, currentlyWorking: checked, endDate: checked ? '' : prev.endDate }))}>
          Still working on it
        </Checkbox>
      </div>
      <div className="grid gap-4 border-t border-[#EEF0F6] pt-[18px] sm:grid-cols-2">
        <Field id="project-code" label="Code link" error={errors.codeUrl}>
          <TextInput id="project-code" type="url" inputMode="url" value={form.codeUrl} onChange={set('codeUrl')} clean={cleanUrl} maxLength={LIMITS.url} error={errors.codeUrl} onBlur={() => !urlError(form.codeUrl) && form.codeUrl && set('codeUrl')(normalizeUrl(form.codeUrl))} placeholder="https://github.com/…" />
        </Field>
        <Field id="project-live" label="Live link" error={errors.hostedUrl}>
          <TextInput id="project-live" type="url" inputMode="url" value={form.hostedUrl} onChange={set('hostedUrl')} clean={cleanUrl} maxLength={LIMITS.url} error={errors.hostedUrl} onBlur={() => !urlError(form.hostedUrl) && form.hostedUrl && set('hostedUrl')(normalizeUrl(form.hostedUrl))} placeholder="https://…" />
        </Field>
      </div>

      <input ref={fileRef} type="file" accept={PROJECT_VIDEO_TYPES.join(',')} className="hidden" tabIndex={-1} onChange={pickVideo} />
      {form.videoUrl && !linkMode && !video.uploading ? (
        <div className="flex flex-wrap items-center gap-3 rounded-[12px] border border-[#D9CCFA] bg-[#FBF8FF] p-3.5">
          <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-[10px] bg-[#F1ECFF] text-[#7B3FD0]">
            <CheckCircle2 className="size-5" />
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold">Walkthrough video added</span>
            <span className={`truncate text-[13px] ${MUTED}`}>{video.name || form.videoUrl}</span>
          </span>
          <button type="button" onClick={() => onPlayVideo(form.videoUrl)} className={`${SECONDARY} h-10 px-3`}>
            <Play aria-hidden="true" className="size-4" /> Watch
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className={`${SECONDARY} h-10 px-3`}>
            Replace
          </button>
          <button type="button" onClick={() => { set('videoUrl')(''); setVideo({ uploading: false, progress: 0, error: '', name: '' }); }} className={`${DANGER_OUTLINE} h-10 px-3`}>
            Remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => !video.uploading && fileRef.current?.click()}
            disabled={video.uploading}
            className="flex items-center gap-3.5 rounded-[12px] border border-dashed border-[#9AA6C8] bg-[linear-gradient(160deg,#F4F6FE,#FBF5FF)] p-4 text-left hover:border-[#7B3FD0] disabled:cursor-wait focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]"
          >
            <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#F1ECFF] text-[#7B3FD0]">
              {video.uploading ? <Spinner className="size-5" /> : <Film className="size-5" />}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="font-semibold">
                {video.uploading ? `Uploading ${video.name}… ${video.progress}%` : 'Upload a walkthrough video'}
              </span>
              <span className={`text-[13px] ${MUTED}`}>Show what you built in up to 90 seconds · up to 100 MB</span>
            </span>
          </button>
          {video.uploading && (
            <div className="h-2 overflow-hidden rounded-full bg-[#F1ECFF]" role="progressbar" aria-label="Video upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={video.progress}>
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#7B3FD0,#B386F9)] transition-[width]" style={{ width: `${video.progress}%` }} />
            </div>
          )}
          {!video.uploading && (
            <Field id="project-video-link" label="Or paste a video link" error={errors.videoUrl || video.error}>
              <TextInput
                id="project-video-link"
                type="url"
                inputMode="url"
                value={form.videoUrl}
                onChange={(next) => {
                  setLinkMode(true);
                  set('videoUrl')(next);
                }}
                clean={cleanUrl} maxLength={LIMITS.url} error={errors.videoUrl || video.error} placeholder="https://… (Loom, YouTube or an MP4 link)" />
            </Field>
          )}
        </div>
      )}

      {confirmRemove && (
        <ConfirmDialog title="Remove this project?" tone="danger" confirmLabel="Remove project" busyLabel="Removing…" busy={busy} onConfirm={remove} onClose={() => setConfirmRemove(false)}>
          “{project?.title}” will be taken off your profile.
        </ConfirmDialog>
      )}
    </Dialog>
  );
}
