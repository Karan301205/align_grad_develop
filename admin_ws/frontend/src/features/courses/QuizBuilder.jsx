import { CircleHelp, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/ui/Button.jsx';
import { inputClass } from '../../components/ui/Field.jsx';
import { emptyQuestion, optionLabel } from './courseModel.js';

/** The optional end-of-lecture quiz. `quiz` is the form state from courseModel; `onChange` gets the next state. */
export default function QuizBuilder({ quiz, onChange }) {
  const set = (patch) => onChange({ ...quiz, ...patch });
  const setQuestion = (index, patch) => set({ questions: quiz.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)) });
  const setOption = (qIndex, oIndex, value) =>
    setQuestion(qIndex, { options: quiz.questions[qIndex].options.map((o, i) => (i === oIndex ? value : o)) });

  return (
    <div className="space-y-3 rounded-xl border border-line p-4">
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" checked={quiz.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="mt-1 size-4 accent-accent" />
        <span>
          <span className="flex items-center gap-1.5 text-sm font-semibold">
            <CircleHelp className="size-4 text-accent-ink" aria-hidden="true" />
            Add an end-of-lecture quiz
          </span>
          <span className="block text-xs text-muted">Students answer multiple-choice questions after watching. Optional.</span>
        </span>
      </label>

      {quiz.enabled && (
        <div className="space-y-3 border-t border-line pt-3">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Quiz title</span>
            <input value={quiz.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} placeholder="Leave empty to use “Quiz: <lecture title>”" />
          </label>

          {quiz.questions.map((q, qIndex) => (
            <fieldset key={qIndex} className="space-y-3 rounded-lg border border-line bg-canvas p-3.5">
              <div className="flex items-center justify-between">
                <legend className="text-[13px] font-bold text-accent-ink">Question {qIndex + 1}</legend>
                {quiz.questions.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Delete question ${qIndex + 1}`}
                    onClick={() => set({ questions: quiz.questions.filter((_, i) => i !== qIndex) })}
                    className="rounded-md p-1 text-bad hover:bg-bad-soft"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                )}
              </div>
              <input aria-label={`Question ${qIndex + 1} text`} value={q.question} onChange={(e) => setQuestion(qIndex, { question: e.target.value })} className={inputClass} placeholder="Type the question" />

              <div className="space-y-2">
                <p className="text-xs text-muted">Fill in every option and select the correct one.</p>
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIndex}`}
                      checked={Number(q.correctAnswer) === oIndex}
                      onChange={() => setQuestion(qIndex, { correctAnswer: oIndex })}
                      aria-label={`Option ${optionLabel(oIndex)} is the correct answer`}
                      className="size-4 accent-accent"
                    />
                    <span className="w-5 text-center text-xs font-bold text-muted" aria-hidden="true">
                      {optionLabel(oIndex)}
                    </span>
                    <input
                      aria-label={`Question ${qIndex + 1} option ${optionLabel(oIndex)}`}
                      value={option}
                      onChange={(e) => setOption(qIndex, oIndex, e.target.value)}
                      className={inputClass}
                      placeholder={`Option ${optionLabel(oIndex)}`}
                    />
                  </div>
                ))}
              </div>
              <input aria-label={`Question ${qIndex + 1} explanation`} value={q.explanation} onChange={(e) => setQuestion(qIndex, { explanation: e.target.value })} className={inputClass} placeholder="Why this answer is correct (optional)" />
            </fieldset>
          ))}

          <Button icon={Plus} onClick={() => set({ questions: [...quiz.questions, emptyQuestion()] })} className="w-full">
            Add another question
          </Button>
        </div>
      )}
    </div>
  );
}
