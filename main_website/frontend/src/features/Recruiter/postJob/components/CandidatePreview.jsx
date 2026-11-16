import { CARD, MUTED } from '../../components/accountStyles';
import { opportunityMeta } from '../constants';
import { durationLine, joiningLine, payLine } from '../summary';

function Pill({ children }) {
  return <span className="rounded-full bg-[#F1F3F6] px-2.5 py-[3px] text-xs font-semibold text-[#334155]">{children}</span>;
}

/**
 * The job's headline details as candidates will read them: title, company,
 * type and pay, the skill bars and the opening lines of the description.
 * Built from the draft, no candidate data.
 */
export default function CandidatePreview({ values: v, company }) {
  const meta = opportunityMeta(v.opportunityType);
  const firstLine = v.description.trim().split('\n').find(Boolean) || '';
  const roundNames = v.rounds.map((round) => round.name);
  const questions = v.screeningQuestions.length;
  const capitalised = (text) => text.charAt(0).toUpperCase() + text.slice(1);

  return (
    <div className="flex min-w-0 grow basis-[360px] flex-col gap-3 lg:sticky lg:top-8">
      <h2 className="m-0 text-[15px] leading-[1.45] tracking-normal text-[#4B5563]">
        <span className="font-semibold">How candidates see it</span>
      </h2>
      <article className={`${CARD} flex flex-col gap-4 p-5`}>
        <div className="flex items-start gap-3">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="" className="size-12 shrink-0 rounded-[10px] border border-[#E4E6EA] bg-white object-contain p-1" />
          ) : (
            <div aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-[10px] bg-[#023836] text-xl font-bold text-white">
              {(company?.name || '?').trim().charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className={`break-words text-lg font-bold ${v.title.trim() ? '' : MUTED}`}>{v.title.trim() || 'Job title'}</span>
            <span className={`text-[13px] ${MUTED}`}>
              {company?.name}
              {company?.verified && (
                <>
                  {' · '}
                  <span className="font-semibold text-[#03443F]">Verified</span>
                </>
              )}
              {v.location.trim() && ` · ${v.location.trim()}`}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Pill>{v.hours}</Pill>
          {v.opportunityType === 'INTERNSHIP' && <Pill>{['Internship', durationLine(v)].filter(Boolean).join(' · ')}</Pill>}
          <Pill>{v.workMode}</Pill>
          <Pill>{v.showSalary ? payLine(v) : `${meta.pay} Undisclosed`}</Pill>
          <Pill>{capitalised(joiningLine(v))}</Pill>
        </div>

        <div className="flex flex-col gap-2.5">
          <span className="font-semibold">Skills this job needs</span>
          {v.requirements.length === 0 ? (
            <span className={MUTED}>No skills added yet.</span>
          ) : (
            v.requirements.map((req) => (
              <div key={req.skillName} className="flex items-center gap-2.5 text-[13px]">
                <span className="w-[104px] shrink-0 break-words font-semibold leading-tight">{req.skillName}</span>
                <div role="img" aria-label={`${req.skillName}: minimum ${req.minRating} of 10`} className="relative h-2 flex-1 rounded-[4px] bg-[#EEF0F3]">
                  <div className="absolute inset-y-0 left-0 rounded-[4px] bg-[#E3F1EE]" style={{ width: `${req.minRating * 10}%` }} />
                  <div className="absolute -inset-y-1 w-0.5 bg-[#0F172A]" style={{ left: `calc(${req.minRating * 10}% - 1px)` }} />
                </div>
                <span className="w-[52px] shrink-0 text-right tabular-nums">
                  <strong>{req.minRating}</strong> <span className={MUTED}>/ 10</span>
                </span>
              </div>
            ))
          )}
          <span className={`text-xs ${MUTED}`}>Each candidate sees their own level next to each minimum.</span>
        </div>

        <div className="flex flex-col gap-1.5 border-t border-[#EEF0F3] pt-3.5">
          <span className="font-semibold">About the job</span>
          <span className={`break-words ${firstLine ? 'text-[#334155]' : MUTED}`}>{firstLine || 'Add a description in the Hiring process step.'}</span>
          <span className={`text-[13px] ${MUTED}`}>
            {roundNames.length ? `${roundNames.length} round${roundNames.length === 1 ? '' : 's'}: ${roundNames.join(', then ')}` : 'No selection rounds'}
            {' · '}
            {questions ? `${questions} question${questions === 1 ? '' : 's'} when you apply` : 'no screening questions'}
          </span>
        </div>
      </article>
    </div>
  );
}
