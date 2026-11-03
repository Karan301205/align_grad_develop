import React from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  HelpCircle, 
  ListOrdered, 
  AlignLeft, 
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export default function ScreeningQuestionBuilder({ 
  questions = [], 
  onChange,
  disabled = false 
}) {
  const handleAddQuestion = (type = 'MCQ') => {
    const newQuestion = {
      id: 'sq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      type, // 'MCQ' | 'LONG_ANSWER'
      question: '',
      options: type === 'MCQ' ? ['', ''] : [],
      correctAnswer: '',
      required: true
    };
    onChange([...questions, newQuestion]);
  };

  const handleRemoveQuestion = (idx) => {
    const updated = questions.filter((_, i) => i !== idx);
    onChange(updated);
  };

  const handleUpdateQuestion = (idx, field, value) => {
    const updated = [...questions];
    const q = { ...updated[idx], [field]: value };

    // If changing type to MCQ, ensure at least 2 options
    if (field === 'type') {
      if (value === 'MCQ') {
        if (!q.options || q.options.length < 2) {
          q.options = ['', ''];
        }
        q.correctAnswer = q.options[0] || '';
      } else {
        q.options = [];
        q.correctAnswer = '';
      }
    }

    updated[idx] = q;
    onChange(updated);
  };

  const handleOptionChange = (qIdx, optIdx, val) => {
    const updated = [...questions];
    const q = { ...updated[qIdx] };
    const prevOptionVal = q.options[optIdx];
    const newOptions = [...q.options];
    newOptions[optIdx] = val;
    q.options = newOptions;

    // If this option was selected as the correct answer, update correctAnswer value too
    if (q.correctAnswer === prevOptionVal || !q.correctAnswer) {
      q.correctAnswer = val;
    }

    updated[qIdx] = q;
    onChange(updated);
  };

  const handleAddOption = (qIdx) => {
    const updated = [...questions];
    const q = { ...updated[qIdx] };
    if (q.options.length >= 6) return; // Limit up to 6 choices
    q.options = [...q.options, ''];
    updated[qIdx] = q;
    onChange(updated);
  };

  const handleRemoveOption = (qIdx, optIdx) => {
    const updated = [...questions];
    const q = { ...updated[qIdx] };
    if (q.options.length <= 2) return; // Maintain minimum 2 options

    const removedVal = q.options[optIdx];
    const newOptions = q.options.filter((_, i) => i !== optIdx);
    q.options = newOptions;

    if (q.correctAnswer === removedVal) {
      q.correctAnswer = newOptions[0] || '';
    }

    updated[qIdx] = q;
    onChange(updated);
  };

  const handleMove = (idx, direction) => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === questions.length - 1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const updated = [...questions];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    onChange(updated);
  };

  const mcqCount = questions.filter(q => q.type === 'MCQ').length;
  const longCount = questions.filter(q => q.type === 'LONG_ANSWER').length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div>
          <h4 className="text-sm font-headline font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
            <span>Candidate Screening Questions</span>
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
            Require candidates to answer your custom questions before applying.
            {questions.length > 0 && (
              <span className="font-semibold text-emerald-800 dark:text-emerald-300 ml-1">
                ({questions.length} configured: {mcqCount} MCQ, {longCount} Written)
              </span>
            )}
          </p>
        </div>

        {!disabled && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleAddQuestion('MCQ')}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-emerald-700 dark:hover:border-emerald-500 text-xs font-headline font-bold text-slate-800 dark:text-slate-200 rounded-none flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs hover:text-emerald-700 dark:hover:text-emerald-400"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
              <span>+ Add MCQ</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddQuestion('LONG_ANSWER')}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:border-blue-700 dark:hover:border-blue-500 text-xs font-headline font-bold text-slate-800 dark:text-slate-200 rounded-none flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs hover:text-blue-700 dark:hover:text-blue-400"
            >
              <Plus className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
              <span>+ Add Written Q</span>
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
          <div className="flex items-center justify-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => handleAddQuestion('MCQ')}
              className="text-xs font-headline font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Multiple Choice (MCQ)
            </button>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <button
              type="button"
              onClick={() => handleAddQuestion('LONG_ANSWER')}
              className="text-xs font-headline font-bold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Add Long Answer Question
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-none shadow-2xs space-y-3 relative transition-all"
            >
              {/* Question Header & Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-none bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-headline font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>

                  {/* Question Type Selector */}
                  <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-none overflow-hidden text-xs">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleUpdateQuestion(idx, 'type', 'MCQ')}
                      className={`px-2.5 py-1 font-headline font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        q.type === 'MCQ'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                      <span>MCQ</span>
                    </button>
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleUpdateQuestion(idx, 'type', 'LONG_ANSWER')}
                      className={`px-2.5 py-1 font-headline font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        q.type === 'LONG_ANSWER'
                          ? 'bg-blue-700 text-white'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <AlignLeft className="w-3.5 h-3.5" />
                      <span>Long Answer</span>
                    </button>
                  </div>

                  {/* Required Switch */}
                  <label className="flex items-center gap-1.5 ml-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      disabled={disabled}
                      checked={q.required !== false}
                      onChange={(e) => handleUpdateQuestion(idx, 'required', e.target.checked)}
                      className="accent-emerald-700 w-3.5 h-3.5 rounded-none"
                    />
                    <span className="font-sans font-medium text-[11px]">Mandatory</span>
                  </label>
                </div>

                {!disabled && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMove(idx, 'up')}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-20 cursor-pointer"
                      title="Move Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === questions.length - 1}
                      onClick={() => handleMove(idx, 'down')}
                      className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-20 cursor-pointer"
                      title="Move Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors ml-1 cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Question Text */}
              <div>
                <label className="block text-[11px] font-headline font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Question Prompt <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={disabled}
                  value={q.question || ''}
                  onChange={(e) => handleUpdateQuestion(idx, 'question', e.target.value)}
                  placeholder={
                    q.type === 'MCQ'
                      ? "e.g. Which HTTP status code indicates 'Created'?"
                      : "e.g. Describe your experience scaling Node.js microservices under heavy load."
                  }
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-none px-3 py-2 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-700 dark:focus:border-emerald-500 shadow-2xs"
                />
              </div>

              {/* MCQ Options Configuration */}
              {q.type === 'MCQ' ? (
                <div className="space-y-2 pt-1 bg-slate-50/70 dark:bg-slate-950/50 p-3 border border-slate-200 dark:border-slate-800 rounded-none">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-headline font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <ListOrdered className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      Options & Correct Answer
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans italic">
                      Click the radio button to select the correct answer
                    </span>
                  </div>

                  <div className="space-y-2">
                    {(q.options || []).map((opt, optIdx) => {
                      const isCorrect = q.correctAnswer && q.correctAnswer === opt && opt.trim() !== '';
                      const optionLabel = String.fromCharCode(65 + optIdx); // A, B, C, D...

                      return (
                        <div key={optIdx} className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={disabled || !opt.trim()}
                            onClick={() => handleUpdateQuestion(idx, 'correctAnswer', opt)}
                            title={opt.trim() ? "Mark as correct answer" : "Enter option text first"}
                            className={`w-6 h-6 shrink-0 rounded-none border text-xs font-headline font-bold flex items-center justify-center transition-all cursor-pointer ${
                              isCorrect
                                ? 'bg-emerald-700 border-emerald-700 text-white shadow-2xs'
                                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-600'
                            }`}
                          >
                            {isCorrect ? <Check className="w-3.5 h-3.5" /> : optionLabel}
                          </button>

                          <div className="relative flex-1">
                            <input
                              type="text"
                              disabled={disabled}
                              value={opt}
                              onChange={(e) => handleOptionChange(idx, optIdx, e.target.value)}
                              placeholder={`Option ${optionLabel}`}
                              className={`w-full bg-white dark:bg-slate-900 border rounded-none px-3 py-1.5 text-xs font-sans text-slate-900 dark:text-slate-100 focus:outline-none shadow-2xs ${
                                isCorrect 
                                  ? 'border-emerald-600 dark:border-emerald-500 ring-1 ring-emerald-600/30' 
                                  : 'border-slate-300 dark:border-slate-700 focus:border-emerald-700'
                              }`}
                            />
                            {isCorrect && (
                              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-headline font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 border border-emerald-200 dark:border-emerald-800">
                                Correct Key
                              </span>
                            )}
                          </div>

                          {!disabled && (q.options || []).length > 2 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx, optIdx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                              title="Remove option"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!disabled && (q.options || []).length < 6 && (
                    <button
                      type="button"
                      onClick={() => handleAddOption(idx)}
                      className="mt-2 text-xs font-headline font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Choice
                    </button>
                  )}

                  {!q.correctAnswer && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 font-sans flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Please select the correct answer choice above for automated candidate scoring.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-slate-50/70 dark:bg-slate-950/50 p-3 border border-slate-200 dark:border-slate-800 rounded-none text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 font-sans">
                    <AlignLeft className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    <span>Candidate will be provided a multi-line response area to write their answer.</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

