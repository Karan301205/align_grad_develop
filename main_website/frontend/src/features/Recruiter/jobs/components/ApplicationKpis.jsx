import { Award, Star, Target, UserX, Users, Video } from 'lucide-react';
import { CARD, MUTED } from '../../components/accountStyles';

// Accent per card, from design/jobs_recruiter/candidate-applications.html
// (the first card uses the recruiter blue instead of the design's green).
const TONES = {
  blue: { bar: 'bg-[#1447E6]', tile: 'bg-[#EEF2FE] text-[#1447E6]' },
  purple: { bar: 'bg-[#5B3FB0]', tile: 'bg-[#EFEAFC] text-[#5B3FB0]' },
  amber: { bar: 'bg-[#B26A00]', tile: 'bg-[#FBF1DC] text-[#B26A00]' },
  green: { bar: 'bg-[#17794F]', tile: 'bg-[#E4F4EC] text-[#17794F]' },
  red: { bar: 'bg-[#B3261E]', tile: 'bg-[#FDECEA] text-[#B3261E]' },
  teal: { bar: 'bg-[#0F6B52]', tile: 'bg-[#E0F2EC] text-[#0F6B52]' }
};

function Kpi({ tone, icon: Icon, label, value, note }) {
  const t = TONES[tone];
  return (
    <div className={`${CARD} relative flex min-w-0 flex-col gap-2.5 overflow-hidden px-[18px] py-4`}>
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-[3px] ${t.bar}`} />
      <div className="flex items-center justify-between gap-2">
        <span className={`text-xs font-semibold tracking-[0.02em] ${MUTED}`}>{label}</span>
        <span aria-hidden="true" className={`flex size-[34px] shrink-0 items-center justify-center rounded-[10px] ${t.tile}`}>
          <Icon className="size-[17px]" />
        </span>
      </div>
      <span className="text-[26px] font-bold leading-[1.1] tracking-[-0.02em] tabular-nums">{value}</span>
      <span className={`text-xs ${MUTED}`}>{note}</span>
    </div>
  );
}

/** Six summary cards above the applicant table. Counts are per stage (same as the tabs). */
export default function ApplicationKpis({ counts, average, allJobs, hasBars }) {
  return (
    <section aria-label="Application summary" className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 xl:grid-cols-6">
      <Kpi tone="blue" icon={Users} label="Total applicants" value={counts.ALL} note={allJobs ? 'Across all your jobs' : 'Applied to this job'} />
      <Kpi tone="purple" icon={Star} label="Shortlisted" value={counts.SHORTLISTED} note="Moved forward" />
      <Kpi tone="amber" icon={Video} label="In interviews" value={counts.INTERVIEW} note="Scheduled or in progress" />
      <Kpi tone="green" icon={Award} label="Hires" value={counts.HIRED} note="Hired or selected" />
      <Kpi tone="red" icon={UserX} label="Rejected" value={counts.REJECTED} note="Not moving forward" />
      <Kpi
        tone="teal"
        icon={Target}
        label="Avg. match"
        value={average == null ? '—' : `${average}%`}
        note={average != null ? 'Against the skill bars' : hasBars ? 'No applicants yet' : 'This job has no skill bars'}
      />
    </section>
  );
}
