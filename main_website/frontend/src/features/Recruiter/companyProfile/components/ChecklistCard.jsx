import AccountIcon from '../../components/AccountIcon';
import { MUTED, PRIMARY_BUTTON } from '../../components/accountStyles';
import { Spinner } from '../../components/AccountControls';

function CheckMark({ done }) {
  return done ? (
    <span aria-hidden="true" className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-[#1447E6] text-white">
      <AccountIcon name="check" size={12} strokeWidth={3.5} />
    </span>
  ) : (
    <span aria-hidden="true" className="size-[22px] shrink-0 rounded-full border-2 border-[#9CA3AF]" />
  );
}

/**
 * Profile checklist. While the profile is editable it also holds the submit button
 * (it submits the form by id, so it works from this side column).
 */
export default function ChecklistCard({ items, formId, editable, submitting, resubmit }) {
  const done = items.filter((item) => item.done).length;
  return (
    <section
      aria-labelledby="checklist-title"
      className="flex min-w-0 grow basis-[280px] flex-col gap-3.5 rounded-[12px] border border-[#E4E6EA] bg-white p-[22px] lg:sticky lg:top-8"
    >
      <h2 id="checklist-title" className="m-0 text-base leading-[1.45] tracking-normal text-[#0F172A]">
        <span className="font-semibold">Profile checklist</span>
      </h2>
      <span className={MUTED}>
        {done} of {items.length} done
      </span>
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-2.5">
            <CheckMark done={item.done} />
            <span>{item.label}</span>
            <span className="sr-only">{item.done ? '(done)' : '(not done)'}</span>
          </li>
        ))}
      </ul>

      {editable && (
        <div className="mt-1 flex flex-col gap-2 border-t border-[#EEF0F3] pt-4">
          <button type="submit" form={formId} disabled={submitting} className={`${PRIMARY_BUTTON} h-11 px-4`}>
            {submitting && <Spinner />}
            {submitting ? 'Submitting…' : resubmit ? 'Resubmit for review' : 'Submit for review'}
          </button>
          <span className={`text-[13px] ${MUTED}`}>
            Your details and documents lock while we review them. We email you the result.
          </span>
        </div>
      )}
    </section>
  );
}
