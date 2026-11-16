import { Award, Briefcase, Calendar, UserCheck, Users } from 'lucide-react';
import { CARD, MUTED } from '../../components/accountStyles';

// One accent per stage, taken from the landing-page palette (mint, blue, violet, green) plus amber for interviews.
const TONES = {
  mint: { bar: 'bg-[#2FB594]', tile: 'bg-[#DDF4EE] text-[#0B6B55]', note: 'text-[#0B6B55]' },
  blue: { bar: 'bg-[#0167F6]', tile: 'bg-[#E7EDFF] text-[#0052C8]', note: 'text-[#0052C8]' },
  violet: { bar: 'bg-[#7B3FD0]', tile: 'bg-[#EFE8FB] text-[#5B3FB0]', note: 'text-[#5B3FB0]' },
  amber: { bar: 'bg-[#D97706]', tile: 'bg-[#FEF3C7] text-[#B45309]', note: 'text-[#B45309]' },
  green: { bar: 'bg-[#0F7A55]', tile: 'bg-[#E3F5EE] text-[#0F7A55]', note: 'text-[#0F7A55]' }
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
        tone="mint"
        icon={Briefcase}
        label="Live jobs"
        value={m.liveRoles}
        unit="open"
        note={{ text: m.pausedRoles ? `${m.pausedRoles} paused` : 'Visible to candidates now' }}
      />
      <Metric
        tone="blue"
        icon={Users}
        label="Applicants"
        value={m.applicants}
        unit="total"
        note={m.newApplicants ? { text: `${m.newApplicants} new in the last 7 days`, highlight: true } : { text: 'Across all your jobs' }}
      />
      <Metric tone="violet" icon={UserCheck} label="Shortlisted" value={m.shortlisted} unit="screened" note={{ text: m.applicants ? `${pct}% of applicants` : 'Passed screening' }} />
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
