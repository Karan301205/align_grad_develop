import { CARD, CARD_TITLE, LINK, MUTED } from '../../components/accountStyles';
import { candidateId, educationLine } from '../../candidates/candidateData';
import { CandidateAvatar } from '../../candidates/components/bits';

/**
 * A short list of candidates with a "View profile" button each (used for top
 * matches and recently viewed). `aside(person)` renders the small note under the name.
 */
export default function PeopleCard({ id, title, subtitle, people, aside, empty, error, footer, onViewProfile }) {
  return (
    <section aria-labelledby={id} className={`${CARD} flex flex-col gap-3.5 px-5 py-[18px]`}>
      <div className="flex flex-col gap-0.5">
        <h2 id={id} className={CARD_TITLE}>
          <span className="font-semibold">{title}</span>
        </h2>
        {subtitle && <span className={`text-[13px] ${MUTED}`}>{subtitle}</span>}
      </div>
      {error ? (
        <span role="alert" className="text-[#B91C1C]">
          {error}
        </span>
      ) : people.length === 0 ? (
        <span className={MUTED}>{empty}</span>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {people.map((person) => (
            <li key={candidateId(person)} className="flex items-center gap-3">
              <CandidateAvatar candidate={person} size={36} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="break-words font-semibold leading-snug">{person.name}</span>
                <span className={`truncate text-[13px] ${MUTED}`}>{educationLine(person) || (person.username ? `@${person.username}` : '')}</span>
                {aside && <span className="text-xs">{aside(person)}</span>}
              </div>
              <button
                type="button"
                onClick={() => onViewProfile(person)}
                className="h-9 shrink-0 rounded-[8px] border border-[#BFE0D8] bg-[#E3F1EE] px-3 font-(family-name:--font-headline) text-[13px] font-semibold text-[#0F7A55] hover:bg-[#D3E8E3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7A55]"
              >
                View profile
              </button>
            </li>
          ))}
        </ul>
      )}
      {footer && (
        <button type="button" onClick={footer.onClick} className={`self-start ${LINK}`}>
          {footer.label}
        </button>
      )}
    </section>
  );
}
