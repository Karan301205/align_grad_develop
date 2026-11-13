import { useState } from 'react';
import { DATE_MAX, DATE_MIN, dateBound, toDateInputValue } from '../../../../utils/dateInput';
import {
  DEGREE_SUGGESTIONS,
  EDU_LEVELS,
  GRADE_TYPES,
  LIMITS,
  STREAMS,
  buildHighSchool,
  cleanDecimal,
  cleanLetterGrade,
  cleanLetters,
  cleanPlace,
  dateError,
  errorCount,
  gradeError,
  parseHighSchool,
  percentError,
  textError
} from '../profileRules';
import { ComboInput, ConfirmDialog, Dialog, DialogFooter, Dropdown, ErrorBanner, Field, PillGroup, TextInput } from '../ui';

const STREAM_OPTIONS = [...STREAMS, 'Other'].map((stream) => ({ value: stream, label: stream }));
const GRADE_OPTIONS = GRADE_TYPES.map((item) => ({ value: item.value, label: item.label }));

const EMPTY = { eduType: '', institute: '', degree: '', fieldOfStudy: '', startDate: '', endDate: '', gradeType: '', gradeValue: '' };

function initialSchool(edu) {
  const parsed = edu?.eduType === 'High School' ? parseHighSchool(edu) : { class10: '', class12: '', stream: '' };
  const known = STREAMS.includes(parsed.stream);
  return { class10: parsed.class10, class12: parsed.class12, stream: known ? parsed.stream : parsed.stream ? 'Other' : '', otherStream: known ? '' : parsed.stream };
}

/**
 * Add / edit education (design: Web — add education … dialog, Education form).
 * Each level is added once; Class 10 & 12 is one record holding both scores.
 */
export default function EducationDialog({ education, list, onSave, onRemove, onClose }) {
  const editing = Boolean(education);
  const [form, setForm] = useState(() => ({ ...EMPTY, ...(education || {}) }));
  const [school, setSchool] = useState(() => initialSchool(education));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const isSchool = form.eduType === 'High School';
  const level = EDU_LEVELS.find((item) => item.value === form.eduType);
  const grade = GRADE_TYPES.find((item) => item.value === form.gradeType);

  // Levels already on the profile can't be added twice. The level of the entry being
  // edited stays open (older profiles may hold two entries of one level).
  const taken = {};
  (list || []).forEach((item) => {
    if (item !== education && item?.eduType && item.eduType !== education?.eduType) taken[item.eduType] = 'Already on your profile';
  });

  const set = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };
  const setSchoolField = (key) => (value) => {
    setSchool((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const pickLevel = (value) => {
    if (value === form.eduType) return;
    // Switching level clears the fields that mean something else at the new level.
    setForm((prev) => ({
      ...prev,
      eduType: value,
      institute: value === 'High School' ? prev.institute : cleanPlace(prev.institute),
      degree: '',
      fieldOfStudy: '',
      ...(value === 'High School' ? { startDate: '', endDate: '', gradeType: '', gradeValue: '' } : {})
    }));
    setSchool({ class10: '', class12: '', stream: '', otherStream: '' });
    setErrors({});
  };

  const pickGradeType = (value) => {
    setForm((prev) => {
      const next = GRADE_TYPES.find((item) => item.value === value);
      let gradeValue = '';
      if (value === 'Grade') gradeValue = prev.gradeType === 'Grade' ? prev.gradeValue : '';
      else if (next && prev.gradeType !== 'Grade') gradeValue = cleanDecimal(prev.gradeValue, { max: next.max }) ?? '';
      return { ...prev, gradeType: value, gradeValue };
    });
    setErrors((prev) => ({ ...prev, gradeType: '', gradeValue: '' }));
  };

  const validate = () => {
    const next = { eduType: form.eduType ? '' : 'Choose the level.' };
    next.institute = textError(form.institute, { field: 'the institute name', name: 'institute name', required: true, max: LIMITS.institute });
    if (isSchool) {
      next.class10 = percentError(school.class10, 'Class 10');
      next.class12 = percentError(school.class12, 'Class 12');
      next.stream = school.stream ? '' : 'Choose your group.';
      if (school.stream === 'Other') next.otherStream = textError(school.otherStream, { field: 'your group', required: true, max: LIMITS.stream });
    } else if (form.eduType) {
      next.degree = textError(form.degree, { field: 'the degree', required: true, max: LIMITS.degree });
      next.fieldOfStudy = textError(form.fieldOfStudy, { field: 'your branch', name: 'branch', required: true, max: LIMITS.field });
      next.startDate = dateError(form.startDate, { field: 'start date', required: true, notFuture: true });
      next.endDate = dateError(form.endDate, { field: 'finish date', required: true });
      if (!next.startDate && !next.endDate && toDateInputValue(form.endDate) < toDateInputValue(form.startDate)) next.endDate = 'Must be after the start date.';
      next.gradeType = form.gradeType ? '' : 'Choose the score type.';
      next.gradeValue = form.gradeType ? gradeError(form.gradeType, form.gradeValue) : '';
    }
    if (form.eduType && taken[form.eduType]) next.eduType = 'This level is already on your profile.';
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
    const stream = school.stream === 'Other' ? school.otherStream.trim() : school.stream;
    const record = isSchool
      ? { ...form, institute: form.institute.trim(), ...buildHighSchool({ class10: school.class10, class12: school.class12, stream }), startDate: '', endDate: '', gradeType: '', gradeValue: '' }
      : {
          ...form,
          institute: form.institute.trim(),
          degree: form.degree.trim(),
          fieldOfStudy: form.fieldOfStudy.trim(),
          startDate: toDateInputValue(form.startDate),
          endDate: toDateInputValue(form.endDate),
          gradeValue: String(form.gradeValue).trim()
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
      title={editing ? 'Edit education' : 'Add education'}
      subtitle="Degree, postgraduate, diploma, or Class 10 & 12"
      onClose={onClose}
      busy={busy}
      footer={<DialogFooter busy={busy} onCancel={onClose} onSave={save} onRemove={editing ? () => setConfirmRemove(true) : null} />}
    >
      <ErrorBanner message={error} />
      <PillGroup id="edu-level" legend="Level" required options={EDU_LEVELS} value={form.eduType} onChange={pickLevel} disabled={taken} error={errors.eduType} />

      {form.eduType && (
        <>
          <Field id="edu-institute" label={level?.place || 'Institute'} required error={errors.institute}>
            <TextInput
              id="edu-institute"
              value={form.institute}
              onChange={set('institute')}
              clean={(value) => cleanPlace(value, { digits: isSchool })}
              maxLength={LIMITS.institute}
              error={errors.institute}
              placeholder={level?.placeholder}
            />
          </Field>

          {isSchool ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="edu-class10" label="Class 10 percentage" required error={errors.class10}>
                  <TextInput id="edu-class10" inputMode="decimal" value={school.class10} onChange={setSchoolField('class10')} clean={(value) => cleanDecimal(value, { max: 100 })} error={errors.class10} placeholder="e.g. 92" />
                </Field>
                <Field id="edu-class12" label="Class 12 percentage" required error={errors.class12}>
                  <TextInput id="edu-class12" inputMode="decimal" value={school.class12} onChange={setSchoolField('class12')} clean={(value) => cleanDecimal(value, { max: 100 })} error={errors.class12} placeholder="e.g. 91" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="edu-stream" label="Class 12 group" required error={errors.stream}>
                  <Dropdown id="edu-stream" value={school.stream} onChange={setSchoolField('stream')} options={STREAM_OPTIONS} columns={3} placeholder="Choose your group" error={errors.stream} />
                </Field>
                {school.stream === 'Other' && (
                  <Field id="edu-stream-other" label="Your group" required error={errors.otherStream}>
                    <TextInput id="edu-stream-other" value={school.otherStream} onChange={setSchoolField('otherStream')} clean={cleanLetters} maxLength={LIMITS.stream} error={errors.otherStream} placeholder="e.g. Vocational" />
                  </Field>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="edu-degree" label="Degree" required error={errors.degree} hint="Pick from the list or type yours">
                  <ComboInput id="edu-degree" value={form.degree} onChange={set('degree')} suggestions={DEGREE_SUGGESTIONS[form.eduType] || []} clean={(value) => cleanPlace(value)} maxLength={LIMITS.degree} error={errors.degree} hint="degree" placeholder="e.g. B.Tech" />
                </Field>
                <Field id="edu-field" label="Branch or subject" required error={errors.fieldOfStudy}>
                  <TextInput id="edu-field" value={form.fieldOfStudy} onChange={set('fieldOfStudy')} clean={(value) => cleanPlace(value)} maxLength={LIMITS.field} error={errors.fieldOfStudy} placeholder="e.g. Computer Science" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="edu-start" label="Started" required error={errors.startDate}>
                  <TextInput id="edu-start" type="date" min={DATE_MIN} max={dateBound(form.endDate, DATE_MAX)} value={toDateInputValue(form.startDate)} onChange={set('startDate')} error={errors.startDate} />
                </Field>
                <Field id="edu-end" label="Finishes" required error={errors.endDate} hint="Expected date if you’re still studying">
                  <TextInput id="edu-end" type="date" min={dateBound(form.startDate, DATE_MIN)} max={DATE_MAX} value={toDateInputValue(form.endDate)} onChange={set('endDate')} error={errors.endDate} hint="end" />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="edu-grade-type" label="Score type" required error={errors.gradeType}>
                  <Dropdown id="edu-grade-type" value={form.gradeType} onChange={pickGradeType} options={GRADE_OPTIONS} placeholder="Choose" error={errors.gradeType} />
                </Field>
                <Field id="edu-grade" label={grade ? grade.label.replace(/ \(.*\)/, '') : 'Score'} required error={errors.gradeValue} hint={grade?.max ? `Up to ${grade.max}` : undefined}>
                  <TextInput
                    id="edu-grade"
                    inputMode={form.gradeType === 'Grade' ? 'text' : 'decimal'}
                    disabled={!form.gradeType}
                    value={form.gradeValue}
                    onChange={set('gradeValue')}
                    clean={(value) => (form.gradeType === 'Grade' ? cleanLetterGrade(value) : cleanDecimal(value, { max: grade?.max || 100 }))}
                    error={errors.gradeValue}
                    hint={grade?.max ? 'max' : undefined}
                    placeholder={grade?.placeholder || 'Choose the score type first'}
                  />
                </Field>
              </div>
            </>
          )}
        </>
      )}

      {confirmRemove && (
        <ConfirmDialog title="Remove this education?" tone="danger" confirmLabel="Remove" busyLabel="Removing…" busy={busy} onConfirm={remove} onClose={() => setConfirmRemove(false)}>
          This entry will be taken off your profile.
        </ConfirmDialog>
      )}
    </Dialog>
  );
}
