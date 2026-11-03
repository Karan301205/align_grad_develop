import { Plus, X } from 'lucide-react';

// Confirmation popup for a required skill that has no test in the question bank:
// the skill is added to the profile as self-rated, without a skill test.
// `modal` = { skillName, rating, isSubmitting }; `context` names what asks for it ("job" / "gig").
export default function AddSkillWithoutTestModal({ modal, context = 'job', onCancel, onConfirm }) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-container border-2 border-slate-400 dark:border-slate-600 rounded-none max-w-sm w-full p-5 shadow-2xl space-y-4 text-left animate-scale-up">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-none flex items-center justify-center shrink-0 border bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-sm text-slate-900 dark:text-slate-100">
                Add {modal.skillName}
              </h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans">No skill test available yet</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={modal.isSubmitting}
            className="p-1 hover:bg-surface-container-high text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 text-xs font-sans text-slate-700 dark:text-slate-300 leading-relaxed">
          <p>
            We don't have a skill test for <strong className="text-slate-900 dark:text-slate-100">{modal.skillName}</strong> yet,
            so it will be added to your profile <strong className="text-slate-900 dark:text-slate-100">without a skill test</strong>.
          </p>
          <p className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px]">
            It will be added as a self-rated skill at <strong>Level {modal.rating}/10</strong>, the level this {context} asks for.
            You can change the rating anytime in Your Profile &rarr; Skills.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={modal.isSubmitting}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-surface-container-high font-headline font-bold text-xs rounded-none transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={modal.isSubmitting}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white font-headline font-bold text-xs rounded-none transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            {modal.isSubmitting ? 'Adding...' : 'Add Skill'}
          </button>
        </div>
      </div>
    </div>
  );
}
