import { useState } from 'react';
import { BadgeCheck, Plus } from 'lucide-react';
import { ALL_SKILLS } from '../../../../constants';
import { LIMITS, cleanSkill, skillHasTest } from '../profileRules';
import { BODY, DANGER_OUTLINE, INK, MUTED, PRIMARY } from '../profileTheme';
import { Dialog, DialogFooter, Dropdown, ErrorBanner, Field } from '../ui';

const RATING_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => ({ value, label: `${value}/10` }));

const MAX_SKILLS = 60;

/**
 * Manage skills: add from the skill list or type your own, self-rate skills that
 * have no test (1–10), remove skills. Tested skills show their score; only a
 * passed test raises it (the server enforces this too).
 */
export default function SkillsDialog({ skills, techSkills, onSave, onClose }) {
  const [list, setList] = useState(() => (skills || []).map((skill) => ({ ...skill })));
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const has = (name) => list.some((skill) => skill.name.toLowerCase() === name.toLowerCase());

  const add = (raw) => {
    const name = cleanSkill(raw).trim();
    setQuery('');
    if (!name) return;
    if (!/\p{L}/u.test(name)) return setNote('Enter a valid skill.');
    if (has(name)) return setNote(`${name} is already added.`);
    if (list.length >= MAX_SKILLS) return setNote(`You can add up to ${MAX_SKILLS} skills.`);
    const known = ALL_SKILLS.find((item) => item.skill.toLowerCase() === name.toLowerCase());
    setNote('');
    setList((prev) => [...prev, { name: known ? known.skill : name, rating: 1 }]);
  };

  const text = query.trim().toLowerCase();
  const matches = text ? ALL_SKILLS.filter((item) => item.skill.toLowerCase().includes(text) && !has(item.skill)).slice(0, 8) : [];
  const exact = ALL_SKILLS.some((item) => item.skill.toLowerCase() === text);

  const save = async () => {
    setBusy(true);
    setError('');
    const result = await onSave(list);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
    }
  };

  return (
    <Dialog
      title="Your skills"
      subtitle="Skills with a test start at 1 and go up only when you pass it. Skills without a test can be self-rated from 1 to 10."
      onClose={onClose}
      busy={busy}
      width="max-w-[680px]"
      footer={<DialogFooter busy={busy} saveLabel="Save skills" onCancel={onClose} onSave={save} />}
    >
      <ErrorBanner message={error} />
      <Field id="skill-search" label="Add a skill" error={note} hint="Search the list or type your own and press Enter.">
        <div className="flex gap-2">
          <input
            id="skill-search"
            data-autofocus
            value={query}
            maxLength={LIMITS.skill}
            onChange={(event) => {
              setNote('');
              setQuery(cleanSkill(event.target.value));
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                add(matches.length === 1 ? matches[0].skill : query);
              }
            }}
            placeholder="e.g. SQL, Excel, Communication"
            aria-describedby={note ? 'skill-search-error' : 'skill-search-hint'}
            className="h-11 w-full min-w-0 rounded-[10px] border border-[#C9D1E3] bg-white px-3.5 text-[15px] text-[#0E1B3D] placeholder:text-[#6B7591] hover:border-[#9AA6C8] focus:border-[#0167F6] focus:outline-none focus:ring-[3px] focus:ring-[#0167F6]/15"
          />
          <button type="button" onClick={() => add(query)} disabled={!query.trim()} className={`${PRIMARY} h-11 shrink-0 px-4`}>
            <Plus aria-hidden="true" className="size-4" /> Add
          </button>
        </div>
      </Field>
      {(matches.length > 0 || (text && !exact)) && (
        <div className="-mt-2 flex flex-wrap items-center gap-1.5">
          {matches.map((item) => (
            <button key={item.skill} type="button" onClick={() => add(item.skill)} className="h-8 rounded-full border border-[#C9D1E3] bg-white px-3 text-[13px] font-semibold text-[#1B2B55] hover:border-[#0167F6] hover:text-[#0167F6]">
              + {item.skill}
              {item.type !== 'technical' && <span className={`ml-1 font-medium ${MUTED}`}>· soft</span>}
            </button>
          ))}
          {text && !exact && (
            <button type="button" onClick={() => add(query)} className="h-8 rounded-full border border-dashed border-[#7B3FD0] bg-[#FBF8FF] px-3 text-[13px] font-semibold text-[#5B2AA6]">
              + Add “{query.trim()}” as your own
            </button>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <p className={`m-0 rounded-[12px] border border-dashed border-[#C9D1E3] bg-[#F4F6FE] p-4 text-center ${BODY}`}>No skills yet. Add the skills you want jobs and gigs to match.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col divide-y divide-[#EEF0F6] rounded-[12px] border border-[#E1E5F2] p-0">
          {list.map((skill) => {
            const tested = skillHasTest(skill.name, techSkills);
            const verified = skill.verifiedRating !== null && skill.verifiedRating !== undefined;
            const soft = ALL_SKILLS.find((item) => item.skill.toLowerCase() === skill.name.toLowerCase())?.type === 'non-technical';
            return (
              <li key={skill.name} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3.5 py-2.5">
                <span className={`min-w-0 flex-1 font-semibold ${INK}`}>
                  {skill.name}
                  {soft && <span className={`ml-1.5 text-[13px] font-medium ${MUTED}`}>soft skill</span>}
                </span>
                {tested ? (
                  <span className="flex items-center gap-2">
                    <span className="rounded-[8px] bg-[#E8EEFF] px-2 py-0.5 text-[14px] font-bold text-[#0B3FA8]">{skill.rating || 1}/10</span>
                    {verified ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#E3F5EE] px-2.5 py-0.5 text-[13px] font-semibold text-[#0B5E41]">
                        <BadgeCheck aria-hidden="true" className="size-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#FFF3E0] px-2.5 py-0.5 text-[13px] font-semibold text-[#8A3F06]">Take the test to verify</span>
                    )}
                  </span>
                ) : (
                  <span className={`flex items-center gap-2 text-[14px] ${BODY}`}>
                    Self-rating
                    <Dropdown
                      id={`skill-rating-${skill.name.replace(/[^\w-]/g, '_')}`}
                      ariaLabel={`Self-rating for ${skill.name}`}
                      size="sm"
                      columns={5}
                      className="w-[88px]"
                      value={skill.rating || 1}
                      options={RATING_OPTIONS}
                      onChange={(rating) => setList((prev) => prev.map((item) => (item.name === skill.name ? { ...item, rating } : item)))}
                    />
                  </span>
                )}
                <button type="button" aria-label={`Remove ${skill.name}`} onClick={() => setList((prev) => prev.filter((item) => item.name !== skill.name))} className={`${DANGER_OUTLINE} h-9 px-3 text-[14px]!`}>
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Dialog>
  );
}
