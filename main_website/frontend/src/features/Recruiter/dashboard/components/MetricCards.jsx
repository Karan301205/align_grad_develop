import { Award, Briefcase, Calendar, UserCheck, Users } from 'lucide-react';
import { CARD, MUTED } from '../../components/accountStyles';

// Same colour per stage as the cards that used to sit on the Jobs page.
const TONES = {
  blue: { bar: 'bg-[#1447E6]', tile: 'bg-[#EEF2FE] text-[#1447E6]', note: 'text-[#1447E6]' },
  sky: { bar: 'bg-[#0284C7]', tile: 'bg-[#E0F2FE] text-[#0369A1]', note: 'text-[#0369A1]' },
  indigo: { bar: 'bg-[#4F46E5]', tile: 'bg-[#EEF2FF] text-[#4338CA]', note: 'text-[#4338CA]' },
  amber: { bar: 'bg-[#D97706]', tile: 'bg-[#FEF3C7] text-[#B45309]', note: 'text-[#B45309]' },
  green: { bar: 'bg-[#15803D]', tile: 'bg-[#DCFCE7] text-[#15803D]', note: 'text-[#15803D]' }
};

function Metric({ tone, icon: Icon, label, value, unit, note }) {
  const t = TONES[tone];
  return (
    <div className={`${CARD} relative flex min-w-0 flex-col gap-3 overflow-hidden px-[18px] pb-4 pt-5`}>
      <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${t.bar}`} />
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[13px] font-medium ${MUTED}`}>{label}</span>
        <span aria-hidden="true" className={`flex size-9 items-center justify-center rounded-[10px] ${t.tile}`}>
          <Icon className="size-[18px]" />
        </span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[30px] font-bold leading-none tabular-nums">{value.toLocaleString('en-IN')}</span>
        <span className={MUTED}>{unit}</span>
      </div>
      <span className={`text-xs font-semibold ${note.highlight ? t.note : MUTED}`}>{note.text}</span>
    </div>
  );
}

/** Hiring overview across all job posts (moved here from the Jobs page). */
export default function MetricCards({ metrics: m }) {
  const pct = m.applicants ? Math.round((m.shortlisted / m.applicants) * 100) : 0;
  return (
    <section aria-label="Hiring overview" className="grid grid-cols-[repeat(auto-fit,minmax(min(190px,100%),1fr))] gap-3">
      <Metric
        tone="blue"
        icon={Briefcase}
        label="Live jobs"
        value={m.liveRoles}
        unit="open"
        note={{ text: m.pausedRoles ? `${m.pausedRoles} paused` : 'Visible to candidates now' }}
      />
      <Metric
        tone="sky"
        icon={Users}
        label="Applicants"
        value={m.applicants}
        unit="total"
        note={m.newApplicants ? { text: `${m.newApplicants} new in the last 7 days`, highlight: true } : { text: 'Across all your jobs' }}
      />
      <Metric tone="indigo" icon={UserCheck} label="Shortlisted" value={m.shortlisted} unit="screened" note={{ text: m.applicants ? `${pct}% of applicants` : 'Passed screening' }} />
      <Metric tone="amber" icon={Calendar} label="Interviews" value={m.interviews} unit="active" note={{ text: 'In or past interview rounds' }} />
      <Metric
        tone="green"
        icon={Award}
        label="Hired"
        value={m.hires}
        unit="selected"
        note={m.openings ? { text: `of ${m.openings.toLocaleString('en-IN')} openings in live jobs`, highlight: true } : { text: 'Final rounds cleared' }}
      />
    </section>
  );
}
