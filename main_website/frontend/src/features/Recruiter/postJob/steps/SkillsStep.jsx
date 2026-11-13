import { useState } from 'react';
import { ALL_SKILLS } from '../../../../constants';
import AccountIcon from '../../components/AccountIcon';
import { FieldError } from '../../components/AccountControls';
import { MUTED, SECONDARY_BUTTON } from '../../components/accountStyles';
import { LEVEL_BANDS, LEVELS, MAX_SKILLS, NEW_SKILL_LEVEL, levelLabel } from '../constants';
import { RequiredMark, StepFooter, StepPanel, TextButton } from '../components/ui';

const MAX_SUGGESTIONS = 8;

/** Skill search with suggestions from ALL_SKILLS (shared with the post-a-gig page). */
export function SkillSearch({ requirements, onAdd, noun = 'job', label = 'Skills and minimum scores', placeholder = 'Add a skill, e.g. Power BI, Tableau, Statistics' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState('');
  const term = query.trim().toLowerCase();
  const taken = new Set(requirements.map((req) => req.skillName.toLowerCase()));
  // Exact match first, then names that start with the text, then the rest.
  const rank = (name) => (name === term ? 0 : name.startsWith(term) ? 1 : 2);
  const suggestions = term
    ? ALL_SKILLS.filter((s) => s.skill.toLowerCase().includes(term) && !taken.has(s.skill.toLowerCase()))
        .sort((a, b) => rank(a.skill.toLowerCase()) - rank(b.skill.toLowerCase()))
        .slice(0, MAX_SUGGESTIONS)
    : [];

  const add = (name) => {
    const match = ALL_SKILLS.find((s) => s.skill.toLowerCase() === (name || query).trim().toLowerCase());
    if (!match) return setProblem('Pick a skill from the suggestions list.');
    if (taken.has(match.skill.toLowerCase())) return setProblem(`${match.skill} is already on this ${noun}.`);
    if (requirements.length >= MAX_SKILLS) return setProblem(`A ${noun} can have at most ${MAX_SKILLS} skills.`);
    onAdd(match.skill);
    setQuery('');
    setProblem('');
    setOpen(false);
    return undefined;
  };

  return (
    <div id="field-skillSearch" className="flex flex-col gap-1.5">
      <span className="text-[13px] font-semibold">
        {label}
        <RequiredMark />
      </span>
      <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <label
            className={`flex h-11 items-center gap-2.5 rounded-[8px] border px-3.5 focus-within:border-[#1447E6] focus-within:ring-2 focus-within:ring-[#1447E6]/20 ${MUTED} ${
              problem ? 'border-[#DC2626]' : 'border-[#D5D9E0]'
            }`}
          >
            <AccountIcon name="search" />
            <input
              type="text"
              role="combobox"
              aria-label="Add a skill"
              aria-expanded={open && suggestions.length > 0}
              aria-controls="skill-suggestions"
              autoComplete="off"
              placeholder={placeholder}
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(true);
                setProblem('');
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  add(suggestions.length === 1 ? suggestions[0].skill : query);
                }
                if (event.key === 'Escape') setOpen(false);
              }}
              className="h-full min-w-0 flex-1 border-0 bg-transparent text-sm text-[#0F172A] placeholder:text-[#6B7280] focus:outline-none"
            />
          </label>
          {open && term && (
            <ul id="skill-suggestions" role="listbox" className="absolute inset-x-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-[8px] border border-[#E4E6EA] bg-white p-1 shadow-lg shadow-slate-200/60">
              {suggestions.length === 0 ? (
                <li className={`px-3 py-2 ${MUTED}`}>No matching skills.</li>
              ) : (
                suggestions.map((s) => (
                  <li key={s.skill} role="option" aria-selected="false">
                    <button
                      type="button"
                      tabIndex={-1}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => add(s.skill)}
                      className="flex w-full items-center justify-between gap-3 rounded-[6px] px-3 py-2 text-left font-(family-name:--font-headline) text-sm text-[#334155] hover:bg-[#F8F8F6]"
                    >
                      <span>{s.skill}</span>
                      <span className={`text-xs capitalize ${MUTED}`}>{s.type}</span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </div>
        <button type="button" onClick={() => add(query)} className={`${SECONDARY_BUTTON} h-11 shrink-0 px-[18px]`}>
          Add skill
        </button>
      </div>
      {problem && <FieldError id="skillSearch-error">{problem}</FieldError>}
    </div>
  );
}

/** The 1–10 minimum-score buttons (shared with the post-a-gig page). */
export function LevelBar({ skillName, value, onChange }) {
  return (
    <div role="group" aria-label={`Minimum score for ${skillName}`} className="grid grid-cols-10 gap-1">
      {LEVELS.map((level) => {
        const pressed = level === value;
        return (
          <button
            key={level}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(level)}
            className={`h-10 rounded-[6px] font-(family-name:--font-headline) text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1447E6] ${
              pressed ? 'bg-[#1447E6] text-white' : level < value ? 'bg-[#DCE5FD] text-[#1E3A8A] hover:bg-[#C9D6FB]' : 'bg-[#F1F3F6] text-[#4B5563] hover:bg-[#E4E6EA]'
            }`}
          >
            {level}
          </button>
        );
      })}
    </div>
  );
}

function SkillRow({ requirement, first, gates, onLevel, onRemove }) {
  const { skillName, minRating } = requirement;
  return (
    <div className={`flex flex-col gap-3 px-[18px] py-4 ${first ? '' : 'border-t border-[#EEF0F3]'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
          <span className="text-[15px] font-semibold">{skillName}</span>
          <span className={`text-[13px] ${MUTED}`}>
            Minimum <strong className="font-bold text-[#0F172A]">{minRating}</strong> / 10 · {levelLabel(minRating)}
          </span>
        </div>
        <TextButton tone="red" onClick={onRemove} aria-label={`Remove ${skillName}`}>
          Remove
        </TextButton>
      </div>
      <LevelBar skillName={skillName} value={minRating} onChange={onLevel} />
      {gates === false && (
        <span className={`text-[13px] ${MUTED}`}>No skill test exists for {skillName} yet, so this bar is shown to candidates but doesn’t stop anyone applying.</span>
      )}
    </div>
  );
}

export default function SkillsStep({ form, pool }) {
  const { values: v, setField, errors } = form;
  const gatesBySkill = new Map((pool.data?.requirements || []).map((req) => [req.skillName, req.gates]));
  const setRequirements = (update) => setField('requirements', update);

  return (
    <StepPanel
      id="step-title"
      title="Which skills does this job need?"
      intro="Set the minimum score out of 10 for each skill. Candidates who are below a bar can’t apply until their skill test score reaches it."
    >
      <SkillSearch requirements={v.requirements} onAdd={(skillName) => setRequirements((prev) => [...prev, { skillName, minRating: NEW_SKILL_LEVEL }])} />

      <div id="field-requirements" className="flex flex-col gap-1.5">
        {v.requirements.length === 0 ? (
          <div className={`rounded-[12px] border border-dashed ${errors.requirements ? 'border-[#DC2626]' : 'border-[#D5D9E0]'} px-4 py-6 text-center ${MUTED}`}>
            No skills yet. Search above and add the skills this job needs.
          </div>
        ) : (
          <div className="flex flex-col rounded-[12px] border border-[#E4E6EA]">
            {v.requirements.map((requirement, index) => (
              <SkillRow
                key={requirement.skillName}
                requirement={requirement}
                first={index === 0}
                gates={gatesBySkill.get(requirement.skillName)}
                onLevel={(level) => setRequirements((prev) => prev.map((req, i) => (i === index ? { ...req, minRating: level } : req)))}
                onRemove={() => setRequirements((prev) => prev.filter((_, i) => i !== index))}
              />
            ))}
          </div>
        )}
        {errors.requirements && <FieldError id="requirements-error">{errors.requirements}</FieldError>}
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(140px,100%),1fr))] gap-2 text-[13px]">
        {LEVEL_BANDS.map((band) => (
          <div key={band.label} className="rounded-[8px] bg-[#F8F8F6] px-3 py-2.5">
            <strong className="font-semibold">
              {band.range} {band.label}
            </strong>
            <br />
            <span className={MUTED}>{band.desc}</span>
          </div>
        ))}
      </div>

      <StepFooter onBack={form.back} nextLabel="Continue to pay & dates" onNext={form.next} />
    </StepPanel>
  );
}
