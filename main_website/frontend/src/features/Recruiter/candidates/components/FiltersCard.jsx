import { Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { hasSkillMcq } from '../../../../constants';
import { INDIAN_STATES } from '../../../../constants/indianStates';
import { SelectControl } from '../../components/AccountControls';
import { CARD, MUTED } from '../../components/accountStyles';
import RecruiterCustomDropdown from '../../components/RecruiterCustomDropdown';
import SkillFilterDropdown from '../../components/SkillFilterDropdown';
import { SORT_LABELS } from '../useCandidateFilters';
import { ActiveSkillChip } from './bits';

const WORK_MODES = ['Remote', 'On-Site', 'Hybrid'];
const WORK_TYPES = ['Internship', 'Part-Time', 'Full-Time'];
const LOCATIONS = [
  { value: '', label: 'All locations' },
  { value: 'Any Location', label: 'Open to relocate / any' },
  ...INDIAN_STATES.map((state) => ({ value: state, label: state, group: 'States & union territories' }))
];
const CREDENTIALS = [
  { value: '', label: 'All profiles' },
  { value: 'verified_skills', label: 'Has verified skills' },
  { value: 'has_video', label: 'Has video introduction' },
  { value: 'has_resume', label: 'Has resume attached' }
];
const EXPERIENCE = [
  { value: '', label: 'All experience levels' },
  { value: 'experienced', label: 'Experienced (1+ roles)' },
  { value: 'fresher', label: 'Freshers' }
];
const MATCH = [
  { value: '', label: 'All match scores' },
  { value: '70', label: 'Top match (≥ 70%)' },
  { value: '50', label: 'Good match (≥ 50%)' },
  { value: 'any', label: 'Any match (> 0%)' }
];

const list = (all, values) => [{ value: '', label: all }, ...values.map((value) => ({ value, label: value }))];

function Labeled({ label, children }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`text-[13px] ${MUTED}`}>{label}</span>
      {children}
    </span>
  );
}

export default function FiltersCard({ filter, skillCounts, popularSkills, education, jobs, compareJobId, onCompareJob, showAdvanced, onToggleAdvanced, shownCount, totalCount }) {
  const { filters: f, set } = filter;
  const toggleSkill = (name) =>
    set('skills')((prev) =>
      prev.some((s) => s.name.toLowerCase() === name.toLowerCase())
        ? prev.filter((s) => s.name.toLowerCase() !== name.toLowerCase())
        : [...prev, { name, minRating: 0, verifiedOnly: false, hasMcq: hasSkillMcq(name) }]
    );

  return (
    <section aria-label="Search and filters" className={`${CARD} flex flex-col gap-3.5 p-4`}>
      <div className="flex flex-wrap gap-2.5">
        <label className={`flex h-11 min-w-0 flex-[1_1_280px] items-center gap-2.5 rounded-[8px] border border-[#D5D9E0] bg-white px-3.5 focus-within:border-[#1447E6] focus-within:ring-2 focus-within:ring-[#1447E6]/20 ${MUTED}`}>
          <Search className="size-[18px] shrink-0" aria-hidden="true" />
          <input
            type="search"
            aria-label="Search candidates"
            placeholder="Name, @username, college, role or skill"
            value={f.search}
            onChange={(event) => set('search')(event.target.value)}
            className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-[#0F172A] placeholder:text-[#6B7280] focus:outline-none"
          />
          {f.search && (
            <button type="button" onClick={() => set('search')('')} aria-label="Clear search" className="rounded-[4px] p-0.5 hover:text-[#0F172A]">
              <X className="size-4" />
            </button>
          )}
        </label>
        <div className="flex h-11 min-w-0 flex-[1_1_280px] items-center gap-2.5 rounded-[8px] border-2 border-[#1447E6] bg-[#EEF2FE] pl-3.5 pr-2">
          <span id="compare-label" className="whitespace-nowrap font-semibold text-[#1E3A8A]">
            Compare with job
          </span>
          <SelectControl
            bare
            className="h-full flex-1"
            aria-labelledby="compare-label"
            menuMinWidth={260}
            value={compareJobId}
            onChange={onCompareJob}
            options={[['', jobs.length ? 'No job — browse all' : 'No jobs with skill bars yet'], ...jobs.map((job) => [job.id, job.title])]}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SkillFilterDropdown selectedSkills={f.skills} onChange={set('skills')} candidateSkillCounts={skillCounts} />
        <RecruiterCustomDropdown value={f.workMode} onChange={set('workMode')} options={list('All work modes', WORK_MODES)} defaultLabel="Work mode" />
        <RecruiterCustomDropdown value={f.workType} onChange={set('workType')} options={list('All work types', WORK_TYPES)} defaultLabel="Work type" />
        <RecruiterCustomDropdown value={f.location} onChange={set('location')} options={LOCATIONS} defaultLabel="Location" searchable searchPlaceholder="Search state or territory…" />
        {education.years.length > 0 && <RecruiterCustomDropdown value={f.year} onChange={set('year')} options={list('Any year', education.years)} defaultLabel="Graduation year" />}
        {education.colleges.length > 0 && (
          <RecruiterCustomDropdown value={f.college} onChange={set('college')} options={list('Any college', education.colleges)} defaultLabel="College" searchable searchPlaceholder="Search colleges…" />
        )}
        {education.degrees.length > 0 && (
          <RecruiterCustomDropdown value={f.degree} onChange={set('degree')} options={list('Any degree', education.degrees)} defaultLabel="Degree" searchable searchPlaceholder="Search degrees…" />
        )}
        <button
          type="button"
          onClick={onToggleAdvanced}
          aria-expanded={showAdvanced}
          className={`inline-flex h-9 items-center gap-1.5 rounded-[8px] border px-2.5 font-(family-name:--font-headline) text-[13px] transition-colors ${
            showAdvanced || filter.advancedCount > 0 ? 'border-[#1447E6] bg-[#EEF2FE] font-semibold text-[#1447E6]' : 'border-[#D5D9E0] text-[#0F172A] hover:border-[#9CA3AF]'
          }`}
        >
          <SlidersHorizontal className="size-3.5" aria-hidden="true" />
          More filters
          {filter.advancedCount > 0 && <span className="min-w-4 rounded-full bg-[#1447E6] px-1 text-[10px] font-bold text-white">{filter.advancedCount}</span>}
        </button>
      </div>

      {(showAdvanced || filter.advancedCount > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed border-[#E4E6EA] pt-3">
          <Labeled label="Credentials">
            <RecruiterCustomDropdown value={f.credential} onChange={set('credential')} options={CREDENTIALS} defaultLabel="All profiles" />
          </Labeled>
          <Labeled label="Experience">
            <RecruiterCustomDropdown value={f.experience} onChange={set('experience')} options={EXPERIENCE} defaultLabel="All experience levels" />
          </Labeled>
          <Labeled label="Match score">
            <RecruiterCustomDropdown value={f.match} onChange={set('match')} options={MATCH} defaultLabel="All match scores" />
          </Labeled>
          <Labeled label="Sort by">
            <RecruiterCustomDropdown
              value={f.sort}
              onChange={set('sort')}
              options={Object.entries(SORT_LABELS).map(([value, label]) => ({ value, label }))}
              defaultLabel={SORT_LABELS.recommended}
              align="right"
            />
          </Labeled>
        </div>
      )}

      {popularSkills.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`mr-1 inline-flex items-center gap-1 text-[13px] ${MUTED}`}>
            <Sparkles className="size-3.5 text-[#1447E6]" aria-hidden="true" />
            Popular skills:
          </span>
          {popularSkills.map((name) => {
            const on = f.skills.some((s) => s.name.toLowerCase() === name.toLowerCase());
            return (
              <button
                key={name}
                type="button"
                aria-pressed={on}
                onClick={() => toggleSkill(name)}
                className={`h-8 rounded-full border px-3 font-(family-name:--font-headline) text-[13px] font-semibold transition-colors ${
                  on ? 'border-[#1447E6] bg-[#1447E6] text-white' : 'border-[#D5D9E0] bg-white text-[#334155] hover:bg-[#F8F8F6]'
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}

      <div className={`flex flex-wrap items-center justify-between gap-2 border-t border-[#EEF0F3] pt-3 text-[13px] ${MUTED}`}>
        <div className="flex flex-wrap items-center gap-1.5">
          <span>
            Active filters: <strong className="font-semibold text-[#1447E6]">{filter.activeCount}</strong>
          </span>
          {f.skills.map((skill) => (
            <ActiveSkillChip
              key={skill.name}
              skill={skill}
              onUpdateRating={(name, minRating, verifiedOnly) =>
                set('skills')((prev) => prev.map((s) => (s.name.toLowerCase() === name.toLowerCase() ? { ...s, minRating: Number(minRating) || 0, verifiedOnly: Boolean(verifiedOnly) } : s)))
              }
              onRemove={(name) => set('skills')((prev) => prev.filter((s) => s.name.toLowerCase() !== name.toLowerCase()))}
            />
          ))}
          {filter.chips.map((chip) => (
            <span key={chip.label} className="inline-flex items-center gap-1 rounded-[6px] bg-[#F1F3F6] py-0.5 pl-2 pr-1 text-xs font-medium text-[#334155]">
              {chip.label}
              <button type="button" onClick={chip.clear} aria-label={`Remove ${chip.label}`} className="rounded-[4px] p-0.5 hover:bg-white hover:text-[#B91C1C]">
                <X className="size-3" />
              </button>
            </span>
          ))}
          {filter.activeCount > 0 && (
            <button type="button" onClick={filter.resetAll} className="rounded-[4px] px-1 font-(family-name:--font-headline) text-[13px] font-semibold text-[#B91C1C] hover:underline">
              Reset all
            </button>
          )}
        </div>
        <span>
          Matching candidates: <strong className="font-semibold text-[#1447E6]">{shownCount}</strong> / {totalCount}
        </span>
      </div>
    </section>
  );
}
