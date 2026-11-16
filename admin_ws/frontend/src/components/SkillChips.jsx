import { skillsOf } from '../utils/candidates.js';
import Pill from './ui/Pill.jsx';

/** The first few skills as chips (green when test-verified), with a "+N" for the rest. */
export default function SkillChips({ candidate, limit = 3 }) {
  const skills = skillsOf(candidate);
  if (skills.length === 0) return <span className="text-muted">No skills added</span>;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {skills.slice(0, limit).map((skill) => (
        <Pill key={skill.name} tone={skill.verifiedRating > 0 ? 'ok' : 'neutral'}>
          {skill.name}
        </Pill>
      ))}
      {skills.length > limit && <span className="text-xs font-semibold text-muted">+{skills.length - limit}</span>}
    </div>
  );
}
