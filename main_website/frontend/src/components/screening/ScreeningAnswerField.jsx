import { TEXT_LIMITS } from '../../constants/screeningQuestions';

const INPUT =
  'w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-600 shadow-2xs';

function ChoiceList({ sq, name, value, onChange, multiple }) {
  const selected = multiple ? value : [value];
  const toggle = (option) => {
    if (!multiple) return onChange(option);
    // Keep ticked options in the recruiter's order.
    const next = selected.includes(option) ? selected.filter((o) => o !== option) : [...selected, option];
    return onChange((sq.options || []).filter((o) => next.includes(o)));
  };

  return (
    <div role={multiple ? 'group' : 'radiogroup'} aria-labelledby={`${name}-label`} className="space-y-1.5 pt-1">
      {(sq.options || []).map((option) => {
        const isSelected = selected.includes(option);
        return (
          <label
            key={option}
            className={`flex items-center gap-2 p-2 rounded-none border text-xs font-sans cursor-pointer transition-colors ${
              isSelected
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 text-emerald-900 dark:text-emerald-200 font-medium'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-400'
            }`}
          >
            <input
              type={multiple ? 'checkbox' : 'radio'}
              name={name}
              value={option}
              checked={isSelected}
              onChange={() => toggle(option)}
              className="accent-emerald-700 w-3.5 h-3.5"
            />
            <span>{option}</span>
          </label>
        );
      })}
    </div>
  );
}

/**
 * One screening question as the candidate answers it, for every question type.
 * `value` is a string, or an array of ticked options for checkbox questions.
 */
export default function ScreeningAnswerField({ sq, index, value, onChange, idPrefix }) {
  const name = `${idPrefix}_${sq.id || index}`;
  const type = sq.type || 'LONG_ANSWER';
  const required = sq.required !== false;

  return (
    <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-none space-y-2">
      <label id={`${name}-label`} htmlFor={type === 'MCQ' || type === 'CHECKBOX' ? undefined : name} className="block text-xs font-headline font-bold text-slate-900 dark:text-slate-100">
        {index + 1}. {sq.question} {required && <span className="text-red-500">*</span>}
        {type === 'CHECKBOX' && <span className="ml-1 font-sans font-normal text-slate-500 dark:text-slate-400">(select all that apply)</span>}
      </label>

      {type === 'MCQ' && <ChoiceList sq={sq} name={name} value={value} onChange={onChange} />}
      {type === 'CHECKBOX' && <ChoiceList sq={sq} name={name} value={value} onChange={onChange} multiple />}
      {type === 'SHORT_ANSWER' && (
        <input id={name} type="text" required={required} maxLength={TEXT_LIMITS.SHORT_ANSWER} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Type a short answer..." className={INPUT} />
      )}
      {type === 'LONG_ANSWER' && (
        <textarea id={name} required={required} rows={3} maxLength={TEXT_LIMITS.LONG_ANSWER} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Type your response here..." className={INPUT} />
      )}
      {type === 'DATE' && (
        <input id={name} type="date" required={required} value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT} max-w-[220px]`} />
      )}
      {type === 'TIME' && (
        <input id={name} type="time" required={required} value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT} max-w-[180px]`} />
      )}
    </div>
  );
}
