import { useMemo } from 'react';
import { ArrowRight, Award, BadgeCheck, Briefcase, CalendarClock, Check, Clock, Flame, GraduationCap, Layers, Sparkles, UserCheck, XCircle } from 'lucide-react';
import { formatShortDate } from '../../../utils/format';
import { getApplicationStage } from '../../../utils/hiringProgress';
import { getProfileCompletionDetails } from '../../../utils/profileCompleteness';
import { skillHasTest } from '../profile/profileRules';
import { BODY, CARD, GRADIENT, GRADIENT_X, HEADING_FONT, INK, MUTED, PAGE, PRIMARY, SECONDARY, SMALL, SOFT } from '../profile/profileTheme';
import {
  STAGES,
  applyNowJobs,
  barsText,
  companyOf,
  currentRound,
  funnelSteps,
  gapText,
  greeting,
  initialOf,
  marketDemand,
  oneSkillAwayJobs,
  openJobs,
  payText,
  pipelineCounts,
  placeText,
  plural,
  roundText,
  tileColor,
  todayText
} from './homeData';

const LINK_BUTTON = 'inline-flex items-center gap-1 rounded-[6px] font-semibold text-[#0167F6] hover:text-[#0052C8] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]';

function Tile({ name, size = 40 }) {
  return (
    <span aria-hidden="true" style={{ width: size, height: size, background: tileColor(name) }} className="flex shrink-0 items-center justify-center rounded-[10px] text-[16px] font-bold text-white">
      {initialOf(name)}
    </span>
  );
}

function SectionTitle({ id, children, action }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-3">
      <h2 id={id} className="m-0 text-[18px] leading-snug">
        <span className={`${HEADING_FONT} font-bold ${INK}`}>{children}</span>
      </h2>
      {action}
    </div>
  );
}

function Card({ id, title, aside, children, className = '' }) {
  return (
    <section aria-labelledby={id} className={`${CARD} flex flex-col overflow-hidden ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-[18px]">
        <h2 id={id} className="m-0 text-[16.5px] leading-snug">
          <span className={`${HEADING_FONT} font-bold ${INK}`}>{title}</span>
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

// Pipeline metrics from the previous dashboard, each opening the matching view.
const METRICS = [
  { key: 'matching', label: 'Matching jobs', note: 'Fit your skills and preferences', icon: Sparkles, color: '#0F7A55', bg: '#E3F5EE', go: ['opportunities', { subTab: 'recommended' }] },
  { key: 'APPLIED', label: 'Applied', note: 'Waiting for screening', icon: Briefcase, color: '#0167F6', bg: '#E8EEFF', go: ['opportunities', { subTab: 'applied' }] },
  { key: 'SHORTLISTED', label: 'Shortlisted', note: 'Cleared first screening', icon: UserCheck, color: '#7B3FD0', bg: '#F1ECFF', go: ['progress', { stage: 'SHORTLISTED' }] },
  { key: 'INTERVIEW', label: 'Interviews', note: 'In interview rounds', icon: Clock, color: '#B45309', bg: '#FFF3E0', go: ['progress', { stage: 'INTERVIEW' }] },
  { key: 'HIRED', label: 'Selected', note: 'Offers and selections', icon: Award, color: '#0F7A55', bg: '#E3F5EE', go: ['progress', { stage: 'HIRED' }] },
  { key: 'REJECTED', label: 'Not progressed', note: 'Closed applications', icon: XCircle, color: '#C8281C', bg: '#FDECEA', go: ['progress', { stage: 'REJECTED' }] }
];

/**
 * Candidate Home (design: candidate_side_design/candidate_dashboard_design/Web — home)
 * with the previous dashboard's metrics: pipeline counts, skills in demand and the
 * application funnel. Every number comes from the candidate's jobs, applications
 * and profile.
 */
export default function CandidateHome({ profile, user, jobs = [], applications = [], techSkills = [], goToTab, onSelectJob, onTakeTest }) {
  const firstName = String(profile?.name || user?.name || '').trim().split(/\s+/)[0];

  const data = useMemo(() => {
    const open = openJobs(jobs);
    const counts = pipelineCounts(applications);
    return {
      openOrder: open.map((job) => job.id),
      applyNow: applyNowJobs(jobs),
      away: oneSkillAwayJobs(jobs),
      counts,
      funnel: funnelSteps(counts),
      matching: jobs.filter((job) => job.matched || (job.recommendationScore ?? 0) >= 50).length,
      demand: marketDemand(jobs, profile?.skills),
      interviews: applications.filter((app) => getApplicationStage(app) === 'INTERVIEW'),
      recent: [...applications].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)).slice(0, 4),
      completion: getProfileCompletionDetails(profile || {})
    };
  }, [jobs, applications, profile]);

  const skills = [...(profile?.skills || [])].sort((a, b) => (b.verifiedRating || b.rating || 0) - (a.verifiedRating || a.rating || 0)).slice(0, 6);
  const openBrief = (job) => onSelectJob?.(job, data.openOrder);
  const raiseSkill = (job, missing) => onTakeTest?.({ skillName: missing.skillName, need: missing.requiredRating, opens: [job.title, companyOf(job)].filter(Boolean).join(' · ') });

  const summary = [todayText(), `${plural(data.applyNow.length, 'job')} ${data.applyNow.length === 1 ? 'is' : 'are'} open to you`, data.interviews.length ? `${plural(data.interviews.length, 'application')} in interviews` : ''].filter(Boolean).join(' · ');

  // The single most useful next step, from the candidate's own data.
  const step = (() => {
    const target = data.away[0];
    if (target) {
      const missing = target.missingRequirements[0];
      const current = Number(missing.currentRating) || 0;
      const company = companyOf(target);
      const pay = payText(target);
      return {
        title: current > 0 ? `Raise ${missing.skillName} from ${current} to ${missing.requiredRating}` : `Add ${missing.skillName} and score ${missing.requiredRating}`,
        text: (
          <>
            That opens <strong className="text-white">{target.title}</strong>
            {company && ` at ${company}`}
            {pay && pay !== 'Pay not shown' && ` (${pay})`}. It’s the only bar you’re short of.
          </>
        ),
        primary: { label: `Take ${missing.skillName} test`, onClick: () => raiseSkill(target, missing) },
        secondary: { label: `Learn ${missing.skillName} first`, onClick: () => goToTab?.('courses', { skill: missing.skillName }) }
      };
    }
    if (data.applyNow.length) {
      return {
        title: `You can apply to ${plural(data.applyNow.length, 'job')} now`,
        text: 'You meet every skill bar for these.',
        primary: { label: 'See the jobs', onClick: () => goToTab?.('opportunities') },
        secondary: { label: 'Take a skill test', onClick: () => goToTab?.('tests') }
      };
    }
    return {
      title: 'Take a skill test',
      text: 'Your test scores decide which jobs open up for you.',
      primary: { label: 'Go to skill tests', onClick: () => goToTab?.('tests') },
      secondary: { label: 'Browse jobs', onClick: () => goToTab?.('opportunities') }
    };
  })();

  const interview = data.interviews[0];
  const ring = data.completion.percentage;

  return (
    <div className={PAGE}>
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] leading-tight">
            <span className={`${HEADING_FONT} font-bold ${INK}`}>
              {greeting()}
              {firstName && `, ${firstName}`}
            </span>
          </h1>
          <p className={`m-0 text-[15.5px] ${MUTED}`}>{summary}</p>
        </header>

        <section aria-label="Your numbers" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {METRICS.map((metric) => {
            const Icon = metric.icon;
            const value = metric.key === 'matching' ? data.matching : data.counts[metric.key];
            return (
              <button
                key={metric.key}
                type="button"
                onClick={() => goToTab?.(...metric.go)}
                className={`${CARD} group relative flex flex-col items-start gap-1 overflow-hidden p-4 text-left transition-shadow hover:shadow-[0_14px_30px_-18px_rgba(14,27,61,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]`}
              >
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1" style={{ background: metric.color }} />
                <span className="flex w-full items-center justify-between gap-2">
                  <span className={`text-[13px] font-semibold ${BODY}`}>{metric.label}</span>
                  <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-[9px]" style={{ background: metric.bg, color: metric.color }}>
                    <Icon className="size-4" />
                  </span>
                </span>
                <span className={`${HEADING_FONT} text-[28px] font-bold leading-none ${INK}`}>{value}</span>
                <span className={`text-[13px] ${MUTED}`}>{metric.note}</span>
              </button>
            );
          })}
        </section>

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-6">
            <section aria-labelledby="next-step" className="relative flex flex-wrap items-center gap-5 overflow-hidden rounded-[16px] bg-[linear-gradient(120deg,#0E1B3D_0%,#1E3A8A_48%,#5B3FD0_100%)] p-6 text-white shadow-[0_20px_40px_-24px_rgba(30,58,138,0.9)]">
              <span aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-[#FA91FD]/25 blur-3xl" />
              <div className="relative flex min-w-0 flex-[1_1_320px] flex-col gap-1.5">
                <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-[#C7D3FB]">Your next step</span>
                <h2 id="next-step" className="m-0 text-[22px] leading-tight">
                  <span className={`${HEADING_FONT} font-bold text-white`}>{step.title}</span>
                </h2>
                <p className="m-0 text-[15px] text-[#E2E8FF]">{step.text}</p>
              </div>
              <div className="relative flex flex-wrap gap-2.5">
                <button type="button" onClick={step.primary.onClick} className="inline-flex h-11 items-center rounded-[10px] bg-white px-[18px] text-[15px] font-semibold text-[#1E3A8A] hover:bg-[#EEF2FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  {step.primary.label}
                </button>
                <button type="button" onClick={step.secondary.onClick} className="inline-flex h-11 items-center rounded-[10px] border border-[#C7D3FB] px-[18px] text-[15px] font-semibold text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                  {step.secondary.label}
                </button>
              </div>
            </section>

            <section aria-labelledby="apply-now" className="flex flex-col gap-3">
              <SectionTitle
                id="apply-now"
                action={
                  <button type="button" onClick={() => goToTab?.('opportunities')} className={LINK_BUTTON}>
                    See all jobs <ArrowRight aria-hidden="true" className="size-4" />
                  </button>
                }
              >
                You can apply now
              </SectionTitle>
              {data.applyNow.length === 0 ? (
                <p className={`m-0 rounded-[14px] border border-dashed border-[#C9D1E3] bg-white px-4 py-5 ${BODY}`}>No job matches all your skill bars yet. Raise a score below to open one up.</p>
              ) : (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3">
                  {data.applyNow.slice(0, 3).map((job) => {
                    const company = companyOf(job);
                    const where = [placeText(job), payText(job)].filter(Boolean).join(' · ');
                    return (
                      <button key={job.id} type="button" onClick={() => openBrief(job)} className={`${CARD} flex flex-col gap-2.5 p-[18px] text-left transition-shadow hover:border-[#6378F9] hover:shadow-[0_14px_30px_-18px_rgba(14,27,61,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]`}>
                        <span className="flex items-center gap-3">
                          <Tile name={company || job.title} />
                          <span className="flex min-w-0 flex-col">
                            <span className={`truncate text-[15px] font-bold ${INK}`}>{job.title}</span>
                            {company && <span className={`truncate text-[13.5px] ${MUTED}`}>{company}</span>}
                          </span>
                        </span>
                        {where && <span className={`text-[13.5px] ${BODY}`}>{where}</span>}
                        <span className="mt-auto flex flex-wrap items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-[#0B5E41]">
                            <Check aria-hidden="true" className="size-4" strokeWidth={2.6} />
                            {barsText(job)}
                          </span>
                          {job.recommendationScore != null && <span className="rounded-full bg-[#F1ECFF] px-2 py-0.5 text-[12px] font-bold text-[#5B2AA6]">{job.recommendationScore}% match</span>}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {data.away.length > 0 && (
              <Card id="one-away" title="1 skill away" aside={<span className={`text-[13.5px] ${MUTED}`}>Raise one score to unlock these</span>}>
                {data.away.slice(0, 5).map((job) => {
                  const missing = job.missingRequirements[0];
                  const company = companyOf(job);
                  return (
                    <div key={job.id} className="flex flex-wrap items-center gap-3.5 border-t border-[#EEF0F6] px-5 py-3.5">
                      <Tile name={company || job.title} />
                      <button type="button" onClick={() => openBrief(job)} className="flex min-w-0 flex-[1_1_220px] flex-col text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]">
                        <span className={`text-[15px] font-semibold ${INK} hover:text-[#0167F6]`}>{[job.title, company].filter(Boolean).join(' · ')}</span>
                        <span className="font-semibold text-[#9A3412]">{gapText(missing)}</span>
                      </button>
                      <button type="button" onClick={() => raiseSkill(job, missing)} className={`${SECONDARY} ${SMALL}`}>
                        {(Number(missing.currentRating) || 0) > 0 ? 'Retake' : 'Take'} {missing.skillName} test
                      </button>
                      <button type="button" onClick={() => goToTab?.('courses', { skill: missing.skillName })} className={`${SOFT} ${SMALL}`}>
                        <GraduationCap aria-hidden="true" className="size-4" /> Courses
                      </button>
                    </div>
                  );
                })}
              </Card>
            )}

            <Card
              id="demand"
              title={
                <span className="inline-flex items-center gap-2">
                  <Flame aria-hidden="true" className="size-5 text-[#C2410C]" /> Skills in demand
                </span>
              }
              aside={
                <span className="rounded-full bg-[#E8EEFF] px-3 py-1 text-[13.5px] font-semibold text-[#0B3FA8]">
                  You have {data.demand.alignment}% of these
                </span>
              }
            >
              <p className={`m-0 px-5 pb-3 text-[14px] ${MUTED}`}>Most asked for across {plural(jobs.length, 'open job')} on AlignGrad.</p>
              {data.demand.top.length === 0 ? (
                <p className={`m-0 border-t border-[#EEF0F6] px-5 py-5 ${BODY}`}>No skill bars in the open jobs right now.</p>
              ) : (
                <ul className="m-0 grid list-none gap-3 border-t border-[#EEF0F6] p-5 sm:grid-cols-2 lg:grid-cols-3">
                  {data.demand.top.map((skill) => (
                    <li key={skill.key} className="flex flex-col gap-2 rounded-[12px] border border-[#E1E5F2] bg-[#FBFCFF] p-3.5">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`truncate font-semibold ${INK}`}>{skill.name}</span>
                        <span className="shrink-0 rounded-full bg-[#E8EEFF] px-2 py-0.5 text-[12px] font-bold text-[#0B3FA8]">{plural(skill.jobCount, 'job')}</span>
                      </span>
                      <span className={`flex items-center justify-between text-[13px] ${MUTED}`}>
                        <span>Asked for in</span>
                        <span className={`font-semibold ${INK}`}>{skill.percent}% of jobs</span>
                      </span>
                      <span className="h-2 overflow-hidden rounded-full bg-[#E8EEFF]" aria-hidden="true">
                        <span className={`block h-full rounded-full ${GRADIENT_X}`} style={{ width: `${Math.max(6, skill.percent)}%` }} />
                      </span>
                      <span className="flex items-center justify-between gap-2 pt-0.5">
                        {skill.has ? (
                          <span className={`inline-flex items-center gap-1 text-[13px] font-semibold ${skill.verified ? 'text-[#0B5E41]' : 'text-[#0B3FA8]'}`}>
                            {skill.verified && <BadgeCheck aria-hidden="true" className="size-4" />}
                            Your score {skill.rating}/10{skill.verified ? ' · verified' : ''}
                          </span>
                        ) : (
                          <span className="text-[13px] font-semibold text-[#9A3412]">Not on your profile</span>
                        )}
                        {!skill.has && (
                          <button type="button" onClick={() => onTakeTest?.({ skillName: skill.name })} className={`${SOFT} h-8 px-2.5 text-[13px]!`}>
                            Take test
                          </button>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              id="applications"
              title="Your applications"
              aside={
                applications.length > 0 && (
                  <button type="button" onClick={() => goToTab?.('progress')} className={LINK_BUTTON}>
                    See all <ArrowRight aria-hidden="true" className="size-4" />
                  </button>
                )
              }
            >
              {data.recent.length === 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F6] px-5 py-5">
                  <p className={`m-0 ${BODY}`}>You haven’t applied to any jobs yet.</p>
                  <button type="button" onClick={() => goToTab?.('opportunities')} className={`${PRIMARY} ${SMALL}`}>
                    Find a job
                  </button>
                </div>
              ) : (
                data.recent.map((app) => {
                  const stage = getApplicationStage(app);
                  const company = app.job?.companyName || companyOf(app.job);
                  const round = stage === 'INTERVIEW' ? roundText(currentRound(app)) : '';
                  const note = { APPLIED: 'waiting for review', SHORTLISTED: 'shortlisted', INTERVIEW: round || 'in interviews', HIRED: 'selected', REJECTED: 'not progressed' }[stage];
                  return (
                    <button key={app.id} type="button" onClick={() => goToTab?.('progress', { stage, applicationId: app.id })} className="flex flex-wrap items-center gap-3.5 border-t border-[#EEF0F6] px-5 py-3.5 text-left hover:bg-[#FBFCFF] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0167F6]">
                      <Tile name={company || app.job?.title} />
                      <span className="flex min-w-0 flex-[1_1_220px] flex-col">
                        <span className={`text-[15px] font-semibold ${INK}`}>{[app.job?.title, company].filter(Boolean).join(' · ')}</span>
                        <span className={MUTED}>{[app.createdAt && `Applied ${formatShortDate(app.createdAt)}`, note].filter(Boolean).join(' · ')}</span>
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[12.5px] font-bold ${STAGES[stage].tone}`}>{STAGES[stage].label}</span>
                    </button>
                  );
                })
              )}
            </Card>
          </div>

          <aside aria-label="Your progress" className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
            {interview && (
              <section aria-labelledby="interview" className="relative flex flex-col gap-3.5 overflow-hidden rounded-[16px] bg-white p-5 shadow-[0_14px_30px_-20px_rgba(1,103,246,0.6)] ring-2 ring-[#0167F6]">
                <div className="flex items-start gap-3">
                  <span aria-hidden="true" className="flex size-[52px] shrink-0 items-center justify-center rounded-[12px] bg-[#E8EEFF] text-[#0167F6]">
                    <CalendarClock className="size-6" />
                  </span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <h2 id="interview" className="m-0 text-[16px]">
                      <span className={`${HEADING_FONT} font-bold ${INK}`}>{roundText(currentRound(interview)) ? `Interview · ${roundText(currentRound(interview))}` : 'You’re in interviews'}</span>
                    </h2>
                    <span className={BODY}>{[interview.job?.title, interview.job?.companyName || companyOf(interview.job)].filter(Boolean).join(' · ')}</span>
                    {data.interviews.length > 1 && <span className={`text-[14px] ${MUTED}`}>+{plural(data.interviews.length - 1, 'more application')} in interviews</span>}
                  </div>
                </div>
                <button type="button" onClick={() => goToTab?.('progress', { stage: 'INTERVIEW', applicationId: interview.id })} className={`${PRIMARY} h-10 px-4`}>
                  See interview details
                </button>
              </section>
            )}

            <Card
              id="skill-scores"
              title="Your skill scores"
              aside={
                <button type="button" onClick={() => goToTab?.('tests')} className={LINK_BUTTON}>
                  Improve
                </button>
              }
            >
              {skills.length === 0 ? (
                <div className="flex flex-col items-start gap-3 px-5 pb-5">
                  <p className={`m-0 ${BODY}`}>No skills yet. Add them so jobs can match you.</p>
                  <button type="button" onClick={() => goToTab?.('profile')} className={`${SECONDARY} ${SMALL}`}>
                    Add skills
                  </button>
                </div>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-3.5 px-5 pb-5 pt-1">
                  {skills.map((skill) => {
                    const verified = skill.verifiedRating != null && skill.verifiedRating > 0;
                    const score = verified ? skill.verifiedRating : skill.rating || 1;
                    const tested = skillHasTest(skill.name, techSkills);
                    const how = verified ? 'Verified by a test' : tested ? 'Not tested yet' : 'Self-rated';
                    return (
                      <li key={skill.name} className="flex items-center gap-3">
                        <span className="flex w-[118px] shrink-0 flex-col">
                          <span className={`truncate font-semibold ${INK}`}>{skill.name}</span>
                          <span className={`text-[12.5px] ${MUTED}`}>{how}</span>
                        </span>
                        <span role="img" aria-label={`${skill.name} ${score} out of 10, ${how.toLowerCase()}`} className="relative h-2 flex-1 overflow-hidden rounded-full bg-[#E8EEFF]">
                          <span className={`absolute inset-y-0 left-0 rounded-full ${verified ? GRADIENT_X : tested ? 'bg-[#F5A524]' : 'bg-[#9AA6C8]'}`} style={{ width: `${score * 10}%` }} />
                        </span>
                        <span className="w-11 shrink-0 text-right tabular-nums">
                          <strong className={INK}>{score}</strong>
                          <span className={MUTED}>/10</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card
              id="funnel"
              title={
                <span className="inline-flex items-center gap-2">
                  <Layers aria-hidden="true" className="size-5 text-[#7B3FD0]" /> Application funnel
                </span>
              }
              aside={<span className={`text-[13.5px] ${MUTED}`}>{plural(data.counts.total, 'application')}</span>}
            >
              {data.counts.total === 0 ? (
                <p className={`m-0 px-5 pb-5 ${BODY}`}>Apply to a job to see how far your applications get.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-3 px-5 pb-5 pt-1">
                  {data.funnel.map((item, index) => (
                    <li key={item.label} className="flex flex-col gap-1.5">
                      <span className="flex items-center justify-between text-[14px]">
                        <span className={`font-semibold ${INK}`}>
                          {index + 1}. {item.label}
                        </span>
                        <span className={`tabular-nums ${BODY}`}>
                          {item.count} · {item.percent}%
                        </span>
                      </span>
                      <span className="h-2.5 overflow-hidden rounded-full bg-[#E8EEFF]" aria-hidden="true">
                        <span className="block h-full rounded-full" style={{ width: `${Math.max(item.count ? 4 : 0, item.percent)}%`, background: ['#0167F6', '#7B3FD0', '#B45309', '#0F7A55'][index] }} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {ring < 100 && (
              <button type="button" onClick={() => goToTab?.('profile')} className={`${CARD} flex items-center gap-3.5 px-5 py-[18px] text-left hover:border-[#6378F9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]`}>
                <span role="img" aria-label={`Profile ${ring}% complete`} className="flex size-[52px] shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#6378F9 0 ${ring}%, #E8EEFF ${ring}% 100%)` }}>
                  <span className={`flex size-10 items-center justify-center rounded-full bg-white text-[13px] font-bold ${INK}`}>{ring}%</span>
                </span>
                <span className="flex flex-1 flex-col">
                  <span className={`text-[15px] font-bold ${INK}`}>Finish your profile</span>
                  <span className={MUTED}>{plural(data.completion.missingItems.length, 'thing')} left to add.</span>
                </span>
                <span aria-hidden="true" className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white ${GRADIENT}`}>
                  <ArrowRight className="size-4" />
                </span>
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
