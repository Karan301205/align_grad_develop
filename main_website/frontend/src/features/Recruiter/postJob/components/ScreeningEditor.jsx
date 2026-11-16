import { OPTION_LIMITS, OPTION_TYPES, SCREENING_TYPES, typeLabel } from '../../../../constants/screeningQuestions';
import AccountIcon from '../../components/AccountIcon';
import { MUTED, SECONDARY_BUTTON } from '../../components/accountStyles';
import { controlClass } from '../../components/formControls';
import { RequiredMark, TextButton } from './ui';

const PLACEHOLDERS = {
  MCQ: 'e.g. Which SQL clause filters groups after aggregation?',
  SHORT_ANSWER: 'e.g. Which city are you based in?',
  LONG_ANSWER: 'e.g. Tell us about a project where you worked with data.',
  CHECKBOX: 'e.g. Which of these tools have you used?',
  DATE: 'e.g. What is your earliest joining date?',
  TIME: 'e.g. What time suits you for a 30-minute call?'
};

const newQuestion = (type) => ({
  id: `sq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  type,
  question: '',
  options: OPTION_TYPES.includes(type) ? ['', ''] : [],
  correctAnswer: '',
  required: true
});

function Options({ q, index, update }) {
  const { min, max } = OPTION_LIMITS[q.type];
  const isMcq = q.type === 'MCQ';
  const changeOption = (optIndex, value) => {
    // Renaming the option marked correct keeps it marked; nothing is picked automatically.
    const correctAnswer = q.correctAnswer && q.correctAnswer === q.options[optIndex] ? value : q.correctAnswer;
    update({ options: q.options.map((opt, i) => (i === optIndex ? value : opt)), correctAnswer });
  };
  const removeOption = (optIndex) => {
    const removed = q.options[optIndex];
    update({ options: q.options.filter((_, i) => i !== optIndex), correctAnswer: q.correctAnswer === removed ? '' : q.correctAnswer });
  };

  return (
    <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 p-0 text-[13px] font-semibold">
        {isMcq ? 'Options · select the correct one' : 'Options · candidates can tick more than one'}
        <RequiredMark />
      </legend>
      {q.options.map((option, optIndex) => {
        const correct = isMcq && option.trim() !== '' && q.correctAnswer === option;
        return (
          <div key={optIndex} className="flex items-center gap-2.5">
            {isMcq ? (
              <input
                type="radio"
                name={`correct-${q.id || index}`}
                checked={correct}
                disabled={!option.trim()}
                onChange={() => update({ correctAnswer: option })}
                aria-label={`Mark option ${optIndex + 1} as correct`}
                title={option.trim() ? 'Mark as the correct answer' : 'Type the option first'}
                className="size-[18px] shrink-0 accent-[#0F7A55]"
              />
            ) : (
              <span aria-hidden="true" className="size-4 shrink-0 rounded-[3px] border-2 border-[#9CA3AF]" />
            )}
            <input
              type="text"
              maxLength={200}
              value={option}
              placeholder={`Option ${optIndex + 1}`}
              aria-label={`Question ${index + 1}, option ${optIndex + 1}`}
              onChange={(event) => changeOption(optIndex, event.target.value)}
              className={controlClass(false, 'h-10 min-w-0 flex-1 px-3')}
            />
            <span className={`w-[64px] shrink-0 text-center text-xs font-semibold ${correct ? 'rounded-full bg-[#DCFCE7] py-0.5 text-[#166534]' : 'invisible'}`}>Correct</span>
            {q.options.length > min && (
              <button
                type="button"
                onClick={() => removeOption(optIndex)}
                aria-label={`Remove option ${optIndex + 1}`}
                className={`flex size-8 shrink-0 items-center justify-center rounded-[6px] hover:bg-[#F4F8F6] hover:text-[#B91C1C] ${MUTED}`}
              >
                <AccountIcon name="close" size={14} strokeWidth={2} />
              </button>
            )}
          </div>
        );
      })}
      {q.options.length < max && (
        <TextButton onClick={() => update({ options: [...q.options, ''] })} className="self-start">
          + Add option
        </TextButton>
      )}
      {isMcq && !q.correctAnswer && <span className="text-xs text-[#9A3412]">Select the correct option so answers are scored automatically.</span>}
    </fieldset>
  );
}

/**
 * Screening questions in the new design. Same data and rules as the old builder
 * (constants/screeningQuestions.js; checked again on the server): every type, the
 * correct answer kept by option text, "Must answer" = `required`.
 */
export default function ScreeningEditor({ questions, onChange, types }) {
  // `types` limits the question kinds offered (gigs accept only MCQ and long answers).
  const offered = types ? SCREENING_TYPES.filter((type) => types.includes(type.value)) : SCREENING_TYPES;
  const update = (index, patch) => onChange(questions.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  const move = (index, target) => {
    const next = [...questions];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {offered.map((type) => (
          <button key={type.value} type="button" onClick={() => onChange([...questions, newQuestion(type.value)])} className={`${SECONDARY_BUTTON} h-9 px-3 text-[13px]`}>
            + {type.label}
          </button>
        ))}
      </div>

      {questions.map((q, index) => (
        <div key={q.id || index} className="flex flex-col gap-3 rounded-[10px] border border-[#E4E6EA] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className={`text-[13px] font-semibold ${MUTED}`}>
              Q{index + 1} · {typeLabel(q.type)}
            </span>
            <div className="flex flex-wrap items-center gap-1">
              <label className="mr-2 inline-flex cursor-pointer items-center gap-1.5 text-[13px] font-medium">
                <input type="checkbox" checked={q.required !== false} onChange={(event) => update(index, { required: event.target.checked })} className="size-4 accent-[#0F7A55]" />
                Must answer
              </label>
              <button type="button" disabled={index === 0} onClick={() => move(index, index - 1)} aria-label={`Move question ${index + 1} up`} className={`flex size-8 items-center justify-center rounded-[6px] hover:bg-[#F4F8F6] disabled:opacity-30 ${MUTED}`}>
                <AccountIcon name="chevron-up" size={16} />
              </button>
              <button type="button" disabled={index === questions.length - 1} onClick={() => move(index, index + 1)} aria-label={`Move question ${index + 1} down`} className={`flex size-8 items-center justify-center rounded-[6px] hover:bg-[#F4F8F6] disabled:opacity-30 ${MUTED}`}>
                <AccountIcon name="chevron-down" size={16} />
              </button>
              <TextButton tone="red" onClick={() => onChange(questions.filter((_, i) => i !== index))} aria-label={`Remove question ${index + 1}`}>
                Remove
              </TextButton>
            </div>
          </div>
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold">
              Question
              <RequiredMark />
            </span>
            <input
              type="text"
              maxLength={500}
              value={q.question || ''}
              placeholder={PLACEHOLDERS[q.type]}
              onChange={(event) => update(index, { question: event.target.value })}
              className={controlClass(false)}
            />
          </label>
          {OPTION_TYPES.includes(q.type) ? (
            <Options q={q} index={index} update={(patch) => update(index, patch)} />
          ) : (
            <span className={`text-[13px] ${MUTED}`}>{SCREENING_TYPES.find((type) => type.value === q.type)?.hint}</span>
          )}
        </div>
      ))}
    </div>
  );
}
