import { useState } from 'react';
import { Plus, Trash2, HelpCircle, AlertCircle, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { ALL_SCREENING_TYPE_VALUES, OPTION_LIMITS, OPTION_TYPES, SCREENING_TYPES, typeLabel } from '../../../constants/screeningQuestions';
import { SelectControl } from './AccountControls';

const PLACEHOLDERS = {
  MCQ: "e.g. Which HTTP status code indicates 'Created'?",
  SHORT_ANSWER: 'e.g. Which city are you currently based in?',
  LONG_ANSWER: 'e.g. Describe your experience scaling Node.js services under heavy load.',
  CHECKBOX: 'e.g. Which of these tools have you used in production?',
  DATE: 'e.g. What is your earliest possible joining date?',
  TIME: 'e.g. What time suits you best for a 30-minute call?'
};

function TypeSelect({ id, value, types, onChange, disabled, label }) {
  return (
    <SelectControl
      id={id}
      size="sm"
      className="w-[170px]"
      aria-label={label}
      value={value}
      disabled={disabled}
      onChange={onChange}
      options={SCREENING_TYPES.filter((type) => types.includes(type.value)).map((type) => [type.value, type.label])}
    />
  );
}

/** What the candidate will see for answer types without options. */
function AnswerPreview({ type }) {
  const preview = 'w-full bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs font-sans text-slate-400 cursor-not-allowed';
  return (
    <div className="bg-slate-50/70 dark:bg-slate-950/50 p-3 border border-slate-200 dark:border-slate-800 rounded-none space-y-2">
      <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400">
        {SCREENING_TYPES.find((t) => t.value === type)?.hint}
      </p>
      {type === 'SHORT_ANSWER' && <input type="text" disabled placeholder="Candidate's one-line answer" className={preview} aria-label="Preview" />}
      {type === 'LONG_ANSWER' && <textarea disabled rows={2} placeholder="Candidate's written answer" className={preview} aria-label="Preview" />}
      {type === 'DATE' && <input type="date" disabled className={`${preview} max-w-[200px]`} aria-label="Preview" />}
      {type === 'TIME' && <input type="time" disabled className={`${preview} max-w-[160px]`} aria-label="Preview" />}
    </div>
  );
}

/**
 * Builds screening questions for job and gig posts.
 * `types` limits the offered question types (gigs only support MCQ and long answer).
 */
export default function ScreeningQuestionBuilder({ questions = [], onChange, disabled = false, types = ALL_SCREENING_TYPE_VALUES }) {
  const [newType, setNewType] = useState(types[0]);

  const update = (idx, patch) => onChange(questions.map((q, i) => (i === idx ? { ...q, ...patch } : q)));

  const addQuestion = () => {
    const isOptionType = OPTION_TYPES.includes(newType);
    onChange([
      ...questions,
      {
        id: `sq_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type: newType,
        question: '',
        options: isOptionType ? ['', ''] : [],
        correctAnswer: '',
        required: true
      }
    ]);
  };

  const changeType = (idx, type) => {
    const q = questions[idx];
    if (!OPTION_TYPES.includes(type)) {
      update(idx, { type, options: [], correctAnswer: '' });
      return;
    }
    const { max } = OPTION_LIMITS[type];
    const kept = (q.options || []).slice(0, max);
    const options = kept.length >= 2 ? kept : [...kept, '', ''].slice(0, Math.max(2, kept.length));
    // A correct answer only exists for multiple choice, and only if it is still an option.
    const correctAnswer = type === 'MCQ' && options.includes(q.correctAnswer) ? q.correctAnswer : '';
    update(idx, { type, options, correctAnswer });
  };

  const changeOption = (idx, optIdx, value) => {
    const q = questions[idx];
    const options = q.options.map((opt, i) => (i === optIdx ? value : opt));
    // Renaming the option that is marked correct keeps it marked; nothing is picked automatically.
    const correctAnswer = q.correctAnswer && q.correctAnswer === q.options[optIdx] ? value : q.correctAnswer;
    update(idx, { options, correctAnswer });
  };

  const addOption = (idx) => {
    const q = questions[idx];
    if (q.options.length < OPTION_LIMITS[q.type].max) update(idx, { options: [...q.options, ''] });
  };

  const removeOption = (idx, optIdx) => {
    const q = questions[idx];
    if (q.options.length <= OPTION_LIMITS[q.type].min) return;
    const removed = q.options[optIdx];
    update(idx, {
      options: q.options.filter((_, i) => i !== optIdx),
      correctAnswer: q.correctAnswer === removed ? '' : q.correctAnswer
    });
  };

  const move = (idx, direction) => {
    const target = direction === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const remove = (idx) => onChange(questions.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="min-w-0">
          <h4 className="text-sm font-headline font-bold text-[#023836] dark:text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Candidate Screening Questions</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            Require candidates to answer your custom questions before applying.
            {questions.length > 0 && (
              <span className="font-semibold text-emerald-800 dark:text-emerald-300 ml-1">
                ({questions.length} question{questions.length === 1 ? '' : 's'} added)
              </span>
            )}
          </p>
        </div>

        {!disabled && (
          <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
            <TypeSelect id="new-question-type" label="Type of question to add" value={newType} types={types} onChange={setNewType} />
            <button
              type="button"
              onClick={addQuestion}
              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 border border-emerald-700 text-xs font-headline font-bold text-white rounded-none flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add question</span>
            </button>
          </div>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-none bg-slate-50/50 dark:bg-slate-900/40">
          <HelpCircle className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-sans text-slate-600 dark:text-slate-400">
            No screening questions added. Candidates meeting your skill requirements will apply directly.
          </p>
          {!disabled && (
            <button
              type="button"
              onClick={addQuestion}
              className="mt-3 text-xs font-headline font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add a {typeLabel(newType).toLowerCase()} question
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const isOptionType = OPTION_TYPES.includes(q.type);
            const limits = OPTION_LIMITS[q.type];
            return (
              <div key={q.id || idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-6 h-6 rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#023836] dark:text-slate-100 font-headline font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <TypeSelect id={`question-type-${idx}`} label={`Type of question ${idx + 1}`} value={q.type} types={types} disabled={disabled} onChange={(type) => changeType(idx, type)} />
                    <label className="flex items-center gap-1.5 ml-1 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={q.required !== false}
                        onChange={(e) => update(idx, { required: e.target.checked })}
                        className="accent-emerald-700 w-3.5 h-3.5 rounded-none"
                      />
                      <span className="font-sans font-medium text-[11px]">Mandatory</span>
                    </label>
                  </div>

                  {!disabled && (
                    <div className="flex items-center gap-1">
                      <button type="button" disabled={idx === 0} onClick={() => move(idx, 'up')} className="p-1 text-slate-500 hover:text-[#023836] dark:hover:text-slate-100 disabled:opacity-20 cursor-pointer" title="Move up" aria-label={`Move question ${idx + 1} up`}>
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button type="button" disabled={idx === questions.length - 1} onClick={() => move(idx, 'down')} className="p-1 text-slate-500 hover:text-[#023836] dark:hover:text-slate-100 disabled:opacity-20 cursor-pointer" title="Move down" aria-label={`Move question ${idx + 1} down`}>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => remove(idx)} className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-1 cursor-pointer" title="Delete question" aria-label={`Delete question ${idx + 1}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor={`question-text-${idx}`} className="block text-[11px] font-headline font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Question Prompt <span className="text-red-500">*</span>
                  </label>
                  <input
                    id={`question-text-${idx}`}
                    type="text"
                    disabled={disabled}
                    maxLength={500}
                    value={q.question || ''}
                    onChange={(e) => update(idx, { question: e.target.value })}
                    placeholder={PLACEHOLDERS[q.type] || PLACEHOLDERS.LONG_ANSWER}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs font-sans text-[#023836] dark:text-slate-100 focus:outline-none focus:border-emerald-700 dark:focus:border-emerald-500 shadow-2xs"
                  />
                </div>

                {isOptionType ? (
                  <div className="space-y-2 bg-slate-50/70 dark:bg-slate-950/50 p-3 border border-slate-200 dark:border-slate-800 rounded-none">
                    <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
                      <span className="font-headline font-bold text-slate-700 dark:text-slate-300">
                        {q.type === 'MCQ' ? 'Options & Correct Answer' : 'Options'}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans italic">
                        {q.type === 'MCQ' ? 'Click a letter to mark the correct answer' : 'Candidates can tick more than one'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const letter = String.fromCharCode(65 + optIdx);
                        const isCorrect = q.type === 'MCQ' && opt.trim() !== '' && q.correctAnswer === opt;
                        return (
                          <div key={optIdx} className="flex items-center gap-2">
                            {q.type === 'MCQ' ? (
                              <button
                                type="button"
                                disabled={disabled || !opt.trim()}
                                onClick={() => update(idx, { correctAnswer: opt })}
                                title={opt.trim() ? 'Mark as correct answer' : 'Enter option text first'}
                                aria-label={`Mark option ${letter} as the correct answer`}
                                aria-pressed={isCorrect}
                                className={`w-6 h-6 shrink-0 rounded-none border text-xs font-headline font-bold flex items-center justify-center transition-all cursor-pointer ${
                                  isCorrect
                                    ? 'bg-emerald-700 border-emerald-700 text-white shadow-2xs'
                                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-600'
                                }`}
                              >
                                {isCorrect ? <Check className="w-3.5 h-3.5" /> : letter}
                              </button>
                            ) : (
                              <span aria-hidden="true" className="w-4 h-4 shrink-0 mx-1 border-2 border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900" />
                            )}

                            <div className="relative flex-1">
                              <input
                                type="text"
                                disabled={disabled}
                                maxLength={200}
                                value={opt}
                                onChange={(e) => changeOption(idx, optIdx, e.target.value)}
                                placeholder={`Option ${letter}`}
                                aria-label={`Question ${idx + 1} option ${letter}`}
                                className={`w-full bg-white dark:bg-slate-900 border rounded-none px-3 py-1.5 text-xs font-sans text-[#023836] dark:text-slate-100 focus:outline-none shadow-2xs ${
                                  isCorrect ? 'border-emerald-600 ring-1 ring-emerald-600/30' : 'border-slate-300 dark:border-slate-700 focus:border-emerald-700'
                                }`}
                              />
                              {isCorrect && (
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-headline font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 border border-emerald-200 dark:border-emerald-800">
                                  Correct Key
                                </span>
                              )}
                            </div>

                            {!disabled && q.options.length > limits.min && (
                              <button type="button" onClick={() => removeOption(idx, optIdx)} className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer" title="Remove option" aria-label={`Remove option ${letter}`}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {!disabled && q.options.length < limits.max && (
                      <button type="button" onClick={() => addOption(idx)} className="mt-1 text-xs font-headline font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer">
                        <Plus className="w-3.5 h-3.5" /> Add option
                      </button>
                    )}

                    {q.type === 'MCQ' && !q.correctAnswer && (
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-sans flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Mark the correct option so candidate answers can be scored automatically.
                      </p>
                    )}
                  </div>
                ) : (
                  <AnswerPreview type={q.type} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
