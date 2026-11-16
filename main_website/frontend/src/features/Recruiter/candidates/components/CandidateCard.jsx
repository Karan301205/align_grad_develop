import { FileText, Loader2, MapPin, ShieldCheck, Video } from 'lucide-react';
import { MUTED } from '../../components/accountStyles';
import { educationLine, skillName } from '../candidateData';
import { BarChip, CandidateAvatar, Tag } from './bits';

const PILL = 'rounded-full px-[9px] py-0.5 text-xs font-semibold';

/** Up to 3 skills, the filtered ones first: "Python 8" (+ shield when test-verified). */
function SkillPreview({ cand, filteredSkills }) {
  const wanted = new Set(filteredSkills.map((s) => s.name.toLowerCase()));
  const skills = [...(cand.skills || [])].sort((a, b) => Number(wanted.has(skillName(b).toLowerCase())) - Number(wanted.has(skillName(a).toLowerCase())));
  const shown = skills.slice(0, 3);
  return (
    <>
      {shown.map((skill) => (
        <Tag key={skillName(skill)} tone={wanted.has(skillName(skill).toLowerCase()) ? 'brand' : 'grey'} title={skill.verifiedRating > 0 ? `Test-verified level ${skill.verifiedRating}` : undefined}>
          {skillName(skill)} {skill.verifiedRating > 0 ? skill.verifiedRating : skill.rating}
          {skill.verifiedRating > 0 && <ShieldCheck className="size-3 text-[#166534]" aria-label="verified" />}
        </Tag>
      ))}
      {skills.length > shown.length && <span className={`self-center text-xs ${MUTED}`}>+{skills.length - shown.length} more</span>}
    </>
  );
}

/**
 * One candidate in the list (design: talent-search card). With a job picked, the
 * chips are the job's bars; otherwise preferences and top skills, as before.
 * The whole card selects the candidate; the Resume button works on its own.
 */
export default function CandidateCard({ cand, selected, onSelect, onResume, generating, filteredSkills }) {
  const comparison = cand.comparison;
  const meta = educationLine(cand);
  const gating = comparison ? comparison.bars.filter((bar) => bar.gates).length : 0;

  return (
    <li className={`relative rounded-[12px] bg-white ${selected ? 'border-2 border-[#0F7A55]' : 'border border-[#E4E6EA] hover:border-[#C9CED6]'}`}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`Show ${cand.name}`}
        className="absolute inset-0 rounded-[12px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7A55]"
      />
      <div className={`pointer-events-none relative flex gap-3 ${selected ? 'px-[15px] py-[13px]' : 'px-4 py-3.5'}`}>
        <CandidateAvatar candidate={cand} />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[15px] font-semibold">{cand.name}</span>
              {cand.username && <span className="truncate text-[13px] font-medium text-[#0F7A55]">@{cand.username}</span>}
            </div>
            <button
              type="button"
              onClick={onResume}
              disabled={generating}
              className="pointer-events-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] border border-[#D5D9E0] bg-white px-2.5 font-(family-name:--font-headline) text-[13px] font-semibold text-[#023836] hover:bg-[#F4F8F6] disabled:opacity-60"
            >
              {generating ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
              {generating ? 'Opening…' : 'Resume'}
            </button>
          </div>
          {meta && <span className={`text-[13px] ${MUTED}`}>{meta}</span>}

          <div className="flex flex-wrap gap-1">
            {cand.matchScore != null && (
              <span title="Match with your active jobs (recommended order)" className={`${PILL} bg-[#E3F1EE] text-[#03443F]`}>
                {cand.matchScore}% match
              </span>
            )}
            {comparison ? (
              <>
                <span className={`${PILL} ${comparison.meetsAll ? 'bg-[#E3F1EE] text-[#03443F]' : 'bg-[#FFF1E8] text-[#9A3412]'}`}>
                  {!comparison.meetsAll
                    ? `${comparison.short} skill${comparison.short === 1 ? '' : 's'} short`
                    : gating === 0
                      ? 'No tested bars'
                      : gating === 1
                        ? 'Meets the bar'
                        : `Meets all ${gating}${gating < comparison.bars.length ? ' tested' : ''}`}
                </span>
                {comparison.bars.map((bar) => (
                  <BarChip key={bar.skillName} bar={bar} />
                ))}
              </>
            ) : (
              <>
                {cand.introVideoUrl && (
                  <Tag tone="brand">
                    <Video className="size-3" aria-hidden="true" />
                    Video
                  </Tag>
                )}
                {(cand.preferredWorkModes || []).slice(0, 2).map((mode) => (
                  <Tag key={mode}>{mode}</Tag>
                ))}
                {cand.openToAnyLocation ? (
                  <Tag tone="green">
                    <MapPin className="size-3" aria-hidden="true" />
                    Relocate
                  </Tag>
                ) : (
                  cand.preferredLocations?.[0] && (
                    <Tag>
                      <MapPin className="size-3" aria-hidden="true" />
                      {cand.preferredLocations[0]}
                    </Tag>
                  )
                )}
              </>
            )}
          </div>
          {!comparison && (cand.skills || []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              <SkillPreview cand={cand} filteredSkills={filteredSkills} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
