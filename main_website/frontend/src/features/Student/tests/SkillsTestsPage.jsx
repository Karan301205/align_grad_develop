import { useState } from 'react';
import { BadgeCheck, GraduationCap } from 'lucide-react';
import { cleanSkill } from '../profile/profileRules';
import { BODY, CARD, HEADING_FONT, INK, LINK, MUTED, PAGE, PRIMARY, SECONDARY } from '../profile/profileTheme';
import { ComboInput, Dropdown, Spinner } from '../profile/ui';
import TestRunner from './TestRunner';
import { PASS_MARK, SKILL_NAMES, formatShortDate, jobsLine, scoreOf, skillGaps, splitSkills, suggestedSkills, unlockFor } from './testsData';

const RATINGS = Array.from({ length: 10 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'verified', label: 'Verified' },
  { id: 'not', label: 'Not verified' }
];

const SectionTitle = ({ id, children }) => (
  <h2 id={id} className="m-0 text-[18px]">
    <span className={`${HEADING_FONT} font-bold ${INK}`}>{children}</span>
  </h2>
);

function Bar({ score, need, tone = 'bg-[linear-gradient(90deg,#0167F6,#6378F9)]', label, className = '' }) {
  return (
    <div role="img" aria-label={label} className={`relative h-2.5 shrink-0 rounded-full bg-[#E8EEFF] ${className}`}>
      <div className={`absolute inset-y-0 left-0 rounded-full ${tone}`} style={{ width: `${Math.min(100, score * 10)}%` }} />
      {need > 0 && <div aria-hidden="true" className="absolute -bottom-1 -top-1 w-0.5 rounded bg-[#0E1B3D]" style={{ left: `calc(${Math.min(100, need * 10)}% - 1px)` }} />}
    </div>
  );
}

/**
 * Candidate Skills & tests (design: candidate_test_design/Web — skills and tests):
 * skills one test away from a job, tested skills with the jobs they meet, self-rated
 * skills (no test yet), tests to take next, and the test itself (TestRunner).
 * `focus` ({ skill, need, opens }) is a new object when another page starts a test.
 */
export default function SkillsTestsPage({ profile, techSkills = [], loading, jobs = [], token, focus, sidebarExpanded, onFinished, onSaveSkills, onOpenJob, goToTab, onNotify }) {
  const [test, setTest] = useState(focus?.skill ? focus : null);
  const [handledFocus, setHandledFocus] = useState(focus);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState('');
  const [saveError, setSaveError] = useState('');

  if (focus !== handledFocus) {
    setHandledFocus(focus);
    if (focus?.skill) setTest(focus);
  }

  const skills = profile?.skills || [];
  const { testable, selfRated } = splitSkills(skills, techSkills);
  const gaps = skillGaps(jobs, skills);
  const suggestions = suggestedSkills(jobs, skills);
  const tested = testable.filter((skill) => skill.testedAt || skill.verifiedRating > 0);
  const counts = { all: testable.length, verified: testable.filter((skill) => skill.verifiedRating > 0).length };
  counts.not = counts.all - counts.verified;
  const rows = testable
    .filter((skill) => filter === 'all' || (filter === 'verified') === skill.verifiedRating > 0)
    .sort((a, b) => scoreOf(b) - scoreOf(a) || a.name.localeCompare(b.name));

  const open = (skill, extra = {}) => {
    const unlock = unlockFor(skill, jobs);
    setTest({ skill, need: extra.need ?? unlock?.need ?? 0, opens: extra.opens ?? unlock?.opens ?? '' });
  };
  const current = test ? skills.find((skill) => skill.name.toLowerCase() === test.skill.toLowerCase()) : null;
  const currentInfo = test ? techSkills.find((skill) => skill.name.toLowerCase() === test.skill.toLowerCase()) : null;

  const saveRating = async (name, value) => {
    setSaving(name);
    setSaveError('');
    const result = await onSaveSkills(skills.map((skill) => (skill.name === name ? { ...skill, rating: Number(value) } : skill)));
    setSaving('');
    if (result?.ok) onNotify?.(`${name} saved as ${value}/10.`, 'success');
    else setSaveError(result?.error || 'Your rating couldn’t be saved. Try again.');
  };

  return (
    <div className={PAGE}>
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
        <header className="flex flex-col gap-1">
          <h1 className="m-0 text-[28px] leading-tight">
            <span className={`${HEADING_FONT} font-bold ${INK}`}>Skills &amp; tests</span>
          </h1>
          <p className={`m-0 text-[15.5px] ${MUTED}`}>These scores are what recruiters see. Each test is 10 questions; your score is how many you get right.</p>
        </header>

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-6">
            {gaps.length > 0 && (
              <section aria-labelledby="raise" className="flex flex-col gap-3">
                <SectionTitle id="raise">Raise these to unlock jobs</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
                  {gaps.map((gap) => (
                    <article key={gap.name} className="flex flex-col gap-3 rounded-[16px] border border-[#FED7AA] bg-white p-[18px] shadow-[0_8px_24px_-20px_rgba(154,52,18,0.6)]">
                      <div className="flex items-start justify-between gap-2.5">
                        <span className="flex min-w-0 flex-col">
                          <span className={`text-[17px] font-bold ${INK}`}>{gap.name}</span>
                          <span className={BODY}>
                            Opens {gap.opens}
                            {gap.more > 0 && ` and ${gap.more} more`}
                          </span>
                        </span>
                        <span className="shrink-0 text-[16px] font-bold tabular-nums text-[#9A3412]">
                          {gap.score || '—'} → {gap.need}
                        </span>
                      </div>
                      <Bar score={gap.score} need={gap.need} tone="bg-[#E0782F]" label={`${gap.name}: ${gap.score} out of 10, ${gap.need} needed`} />
                      <div className="flex gap-2">
                        <button type="button" onClick={() => open(gap.name, { need: gap.need, opens: gap.opens })} className={`${PRIMARY} h-10 flex-1`}>
                          {gap.score > 0 ? 'Retake test' : 'Take test'}
                        </button>
                        <button type="button" onClick={() => goToTab?.('courses', { skill: gap.name })} className={`${SECONDARY} h-10 flex-1`}>
                          Learn first
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <section aria-labelledby="tested" className={`${CARD} overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-[18px]">
                <h2 id="tested" className="m-0 text-[16px]">
                  <span className={`${HEADING_FONT} font-bold ${INK}`}>Skills with a test</span>
                </h2>
                {testable.length > 0 && (
                  <div role="group" aria-label="Show" className="flex flex-wrap gap-1.5">
                    {FILTERS.map((item) => {
                      const on = filter === item.id;
                      return (
                        <button key={item.id} type="button" aria-pressed={on} onClick={() => setFilter(item.id)} className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13.5px] font-semibold ${on ? 'border-transparent bg-[linear-gradient(135deg,#0E1B3D_0%,#1E3A8A_60%,#5B3FD0_100%)] text-white' : 'border-[#C9D1E3] bg-white text-[#1B2B55] hover:border-[#6378F9]'}`}>
                          {item.label}
                          <span className={`rounded-full px-1.5 text-[11.5px] font-bold ${on ? 'bg-white/20' : 'bg-[#E8EEFF] text-[#0B3FA8]'}`}>{counts[item.id]}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {loading && techSkills.length === 0 ? (
                <div className={`flex items-center gap-2.5 border-t border-[#EEF0F6] px-5 py-6 ${BODY}`} role="status">
                  <Spinner className="size-5 text-[#0167F6]" /> Loading your skills…
                </div>
              ) : testable.length === 0 ? (
                <p className={`m-0 border-t border-[#EEF0F6] px-5 py-5 ${BODY}`}>None of your skills has a test yet. Pick one under “Test a new skill”.</p>
              ) : rows.length === 0 ? (
                <p className={`m-0 border-t border-[#EEF0F6] px-5 py-5 ${BODY}`}>No skills here.</p>
              ) : (
                <>
                  <div aria-hidden="true" className={`hidden grid-cols-[1.1fr_2fr_0.8fr_1.6fr_0.7fr] gap-3 border-t border-[#EEF0F6] px-5 py-2.5 text-[12px] font-bold uppercase tracking-[0.05em] md:grid ${MUTED}`}>
                    <span>Skill</span>
                    <span>Score</span>
                    <span>Tested</span>
                    <span>Jobs</span>
                    <span />
                  </div>
                  <ul className="m-0 list-none p-0">
                    {rows.map((skill) => {
                      const score = scoreOf(skill);
                      const wasTested = tested.includes(skill);
                      return (
                        <li key={skill.name} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 border-t border-[#EEF0F6] px-5 py-3.5 md:grid-cols-[1.1fr_2fr_0.8fr_1.6fr_0.7fr]">
                          <span className={`flex min-w-0 items-center gap-1.5 text-[15px] font-semibold ${INK}`}>
                            <span className="truncate">{skill.name}</span>
                            {skill.verifiedRating > 0 && <BadgeCheck aria-label="Verified" className="size-4 shrink-0 text-[#0167F6]" />}
                          </span>
                          <span className="order-last col-span-2 flex items-center gap-2.5 md:order-none md:col-span-1">
                            {wasTested ? (
                              <>
                                <Bar score={score} tone={skill.verifiedRating > 0 ? undefined : 'bg-[#E0782F]'} label={`${skill.name} ${score} out of 10`} className="flex-1" />
                                <strong className={`w-11 tabular-nums ${INK}`}>{score}/10</strong>
                              </>
                            ) : (
                              <span className={MUTED}>Not tested yet</span>
                            )}
                          </span>
                          <span className={`hidden md:block ${MUTED}`}>{skill.testedAt ? formatShortDate(skill.testedAt) : '—'}</span>
                          <span className={`order-last col-span-2 text-[14px] md:order-none md:col-span-1 md:text-[15px] ${BODY}`}>{jobsLine(skill.name, wasTested ? score : 0, jobs)}</span>
                          <button type="button" onClick={() => open(skill.name)} aria-label={`${wasTested ? 'Retake' : 'Take'} ${skill.name} test`} className={`${LINK} justify-self-end text-[15px]`}>
                            {wasTested ? 'Retake' : 'Take test'}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </section>

            {selfRated.length > 0 && (
              <section aria-labelledby="self" className={`${CARD} flex flex-col gap-3.5 p-5`}>
                <div className="flex flex-col gap-0.5">
                  <h2 id="self" className="m-0 text-[16px]">
                    <span className={`${HEADING_FONT} font-bold ${INK}`}>Self-rated</span>
                  </h2>
                  <span className={MUTED}>No test for these yet. Recruiters see them marked “self-rated”.</span>
                </div>
                {saveError && (
                  <p role="alert" className="m-0 text-[14px] font-medium text-[#B42318]">
                    {saveError}
                  </p>
                )}
                <ul className="m-0 flex list-none flex-wrap gap-2.5 p-0">
                  {selfRated.map((skill) => (
                    <li key={skill.name} className="flex items-center gap-3 rounded-[12px] border border-dashed border-[#9AA6C8] bg-[#FBFCFF] px-3.5 py-2.5">
                      <span className="flex flex-col">
                        <span className={`font-semibold ${INK}`}>{skill.name}</span>
                        <span className={`text-[12.5px] ${MUTED}`}>{skill.technical ? 'Test coming soon' : 'No test for this skill'}</span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Dropdown id={`self-${skill.name}`} ariaLabel={`Your rating for ${skill.name}`} size="sm" value={String(skill.rating || 1)} onChange={(value) => saveRating(skill.name, value)} options={RATINGS} disabled={Boolean(saving)} className="w-[68px]" />
                        <span className={MUTED}>/10</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-4">
            <section aria-labelledby="new-test" className={`${CARD} flex flex-col gap-3 p-5`}>
              <h2 id="new-test" className="m-0 text-[16px]">
                <span className={`${HEADING_FONT} font-bold ${INK}`}>Test a new skill</span>
              </h2>
              <div
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.defaultPrevented && search.trim()) {
                    event.preventDefault();
                    open(search.trim());
                    setSearch('');
                  }
                }}
              >
                <label htmlFor="new-skill" className="sr-only">
                  Search skills
                </label>
                <ComboInput
                  id="new-skill"
                  value={search}
                  onChange={setSearch}
                  onPick={(name) => {
                    open(name);
                    setSearch('');
                  }}
                  suggestions={SKILL_NAMES}
                  clean={cleanSkill}
                  placeholder="e.g. Tableau, React, Tally"
                  maxLength={60}
                />
              </div>
              {suggestions.length > 0 && (
                <>
                  <span className={MUTED}>Asked for in open jobs</span>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {suggestions.map((item) => (
                      <li key={item.name}>
                        <button type="button" onClick={() => open(item.name)} className="flex w-full items-center justify-between gap-2.5 rounded-[12px] border border-[#E1E5F2] bg-white px-3.5 py-3 text-left hover:border-[#6378F9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]">
                          <span className="flex flex-col">
                            <span className={`font-semibold ${INK}`}>{item.name}</span>
                            <span className={`text-[13.5px] ${MUTED}`}>
                              In {item.count} job{item.count === 1 ? '' : 's'}
                            </span>
                          </span>
                          <span className="font-semibold text-[#0167F6]">Take test</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </section>

            <section aria-labelledby="how" className={`${CARD} flex flex-col gap-2.5 p-5`}>
              <h2 id="how" className="m-0 text-[16px]">
                <span className={`${HEADING_FONT} font-bold ${INK}`}>How scores work</span>
              </h2>
              <ul className={`m-0 flex list-disc flex-col gap-1.5 pl-[18px] ${BODY}`}>
                <li>10 multiple-choice questions per skill, some with code</li>
                <li>Answer all 10 within 30 minutes to submit</li>
                <li>8 right answers = a score of 8/10</li>
                <li>{PASS_MARK} or more right marks the skill as verified</li>
                <li>A retake replaces your old score</li>
                <li>Each job sets the score it needs for every skill</li>
              </ul>
              <button type="button" onClick={() => goToTab?.('courses')} className={`${LINK} mt-1 inline-flex items-center gap-1.5 self-start`}>
                <GraduationCap aria-hidden="true" className="size-4" /> Learn before a test
              </button>
            </section>
          </div>
        </div>
      </div>

      {test && (
        <TestRunner
          key={test.skill}
          test={test}
          previous={currentInfo?.testedAt || currentInfo?.verifiedRating > 0 ? scoreOf(current || currentInfo) : 0}
          testedAt={currentInfo?.testedAt || null}
          token={token}
          jobs={jobs}
          sidebarExpanded={sidebarExpanded}
          onClose={() => setTest(null)}
          onFinished={onFinished}
          onOpenJob={(job) => {
            setTest(null);
            onOpenJob?.(job);
          }}
          goToTab={(tab, options) => {
            setTest(null);
            goToTab?.(tab, options);
          }}
        />
      )}
    </div>
  );
}
