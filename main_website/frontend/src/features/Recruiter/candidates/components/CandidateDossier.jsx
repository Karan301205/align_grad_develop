import { Award, Briefcase, ExternalLink, Eye, FolderGit2, Globe, GraduationCap, Link as LinkIcon, Mail, Phone, Play, ShieldCheck, User, Video } from 'lucide-react';
import { getApplicationStage, STAGE_CONFIG } from '../../../../utils/hiringProgress';
import { CARD, LINK, MUTED, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../../components/accountStyles';
import { applicationFor, educationLine, skillName } from '../candidateData';
import { CandidateAvatar, Tag } from './bits';

const SOCIAL = [
  ['linkedin', 'showLinkedin', 'LinkedIn', LinkIcon],
  ['github', 'showGithub', 'GitHub', FolderGit2],
  ['portfolio', 'showPortfolio', 'Portfolio', Globe],
  ['hackerEarth', 'showHackerEarth', 'HackerEarth', Globe],
  ['hackerRank', 'showHackerRank', 'HackerRank', Globe],
  ['codechef', 'showCodechef', 'CodeChef', Globe],
  ['leetcode', 'showLeetcode', 'LeetCode', Globe],
  ['codeforces', 'showCodeforces', 'Codeforces', Globe],
  ['kaggle', 'showKaggle', 'Kaggle', Globe]
];

const withHttp = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

function Section({ title, icon: Icon, children }) {
  return (
    <section className="flex flex-col gap-3 border-t border-[#EEF0F3] pt-[18px]">
      <h3 className="m-0 flex items-center gap-2 text-[15px] leading-[1.45] tracking-normal text-[#023836]">
        {Icon && <Icon className="size-4 text-[#0F7A55]" aria-hidden="true" />}
        <span className="font-semibold">{title}</span>
      </h3>
      {children}
    </section>
  );
}

/** A record row (experience, project, certificate, education). */
function Item({ title, subtitle, aside, children }) {
  return (
    <div className="flex flex-col gap-1 rounded-[10px] border border-[#E4E6EA] p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <span className="break-words font-semibold">{title}</span>
          {subtitle && <span className="break-words text-[13px] text-[#0F7A55]">{subtitle}</span>}
        </div>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** "Skills vs. <job>": score bar with a tick at the job's minimum (design). */
function JobBars({ job, comparison }) {
  const firstGap = comparison.bars.find((bar) => bar.gates && bar.state === 'below');
  const untested = comparison.bars.filter((bar) => !bar.gates).map((bar) => bar.skillName);
  return (
    <div className="flex flex-col gap-3">
      <span className="font-semibold">Skills vs. {job.title}</span>
      {comparison.bars.map((bar) => {
        const fill = bar.gates && bar.state === 'below' ? 'bg-[#C2410C]' : 'bg-[#023836]';
        return (
          <div key={bar.skillName} className="flex items-center gap-3">
            <span className="w-[108px] shrink-0 break-words font-medium leading-tight">{bar.skillName}</span>
            <div role="img" aria-label={`${bar.skillName}: ${bar.score} of 10, bar ${bar.minRating}`} className="relative h-2 flex-1 rounded-[4px] bg-[#EEF0F3]">
              <div className={`absolute inset-y-0 left-0 rounded-[4px] ${fill}`} style={{ width: `${bar.score * 10}%` }} />
              <div className="absolute -inset-y-1 w-0.5 bg-[#0F172A]" style={{ left: `calc(${bar.minRating * 10}% - 1px)` }} />
            </div>
            <span className="w-16 shrink-0 text-right tabular-nums">
              <strong>{bar.score}</strong> <span className={MUTED}>/ {bar.minRating}</span>
            </span>
          </div>
        );
      })}
      {firstGap && (
        <div className="rounded-[10px] border border-[#FED7AA] bg-[#FFF7ED] px-3.5 py-3 font-semibold text-[#9A3412]">
          Below your bar on {firstGap.skillName} ({firstGap.score} / {firstGap.minRating})
          {comparison.short > 1 && ` and ${comparison.short - 1} more`}
        </div>
      )}
      {untested.length > 0 && (
        <span className={`text-[13px] ${MUTED}`}>
          {untested.join(', ')} {untested.length === 1 ? 'has' : 'have'} no skill test yet, so {untested.length === 1 ? 'it doesn’t' : 'they don’t'} count towards “meets all bars”.
        </span>
      )}
    </div>
  );
}

/** Right-hand panel: everything the old dossier showed, in the new theme. */
export default function CandidateDossier({ cand, job, onViewProfile, onPlayProjectVideo }) {
  if (!cand) {
    return (
      <section aria-label="Selected candidate" className={`${CARD} flex flex-col items-center gap-2 p-10 text-center`}>
        <User className="size-8 text-[#9CA3AF]" aria-hidden="true" />
        <span className="font-semibold">No candidate selected</span>
        <span className={MUTED}>Pick someone from the list to see their skills, experience and resume.</span>
      </section>
    );
  }

  const application = job ? applicationFor(cand, job) : null;
  const meta = educationLine(cand);
  const social = SOCIAL.filter(([key, showKey]) => typeof cand.socialLinks?.[key] === 'string' && cand.socialLinks[key].trim() && cand.socialLinks?.[showKey]);
  const prefers = [...(cand.preferredWorkTypes || []), ...(cand.preferredWorkModes || [])];
  const locations = cand.openToAnyLocation ? 'Open to relocate / any location' : (cand.preferredLocations || []).join(', ');

  return (
    <section aria-label="Selected candidate" className={`${CARD} flex flex-col gap-[18px] p-[22px]`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3.5">
          <CandidateAvatar candidate={cand} size={52} />
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="m-0 break-words text-xl leading-[1.3] tracking-normal text-[#023836]">
              <span className="font-bold">{cand.name}</span>
            </h2>
            {cand.username && <span className="text-[13px] font-medium text-[#0F7A55]">@{cand.username}</span>}
            {meta && <span className={MUTED}>{meta}</span>}
          </div>
        </div>
        <button type="button" onClick={onViewProfile} className={`${SECONDARY_BUTTON} h-11 px-4`}>
          <Eye className="size-4" aria-hidden="true" />
          View profile
        </button>
      </div>

      {job && cand.comparison && <JobBars job={job} comparison={cand.comparison} />}

      <div className="flex flex-col gap-1 rounded-[10px] bg-[#F4F8F6] p-3.5">
        <span>
          <span className={MUTED}>Prefers</span> · {prefers.length ? prefers.join(' · ') : 'Not specified'}
        </span>
        <span>
          <span className={MUTED}>Locations</span> · {locations || 'Not specified'}
        </span>
        {job && (
          <span>
            <span className={MUTED}>Status</span> ·{' '}
            {application ? `Applied to ${job.title} · ${STAGE_CONFIG[getApplicationStage(application)]?.label || application.status}` : `Hasn’t applied to ${job.title} yet`}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <button type="button" onClick={onViewProfile} className={`${PRIMARY_BUTTON} h-11 w-full`}>
          View profile
        </button>
        <span className={`text-[13px] ${MUTED}`}>Opens the full profile, where you can also download the resume.</span>
      </div>

      <Section title="Contact details" icon={User}>
        <div className="flex flex-col gap-1.5">
          {cand.email && (
            <span className="flex items-center gap-2 break-all">
              <Mail className={`size-4 shrink-0 ${MUTED}`} aria-hidden="true" />
              {cand.email}
            </span>
          )}
          {cand.phone && (
            <span className="flex items-center gap-2">
              <Phone className={`size-4 shrink-0 ${MUTED}`} aria-hidden="true" />
              {cand.phone}
            </span>
          )}
          {!cand.email && !cand.phone && <span className={MUTED}>No contact details on the profile.</span>}
        </div>
      </Section>

      {cand.introVideoUrl && (
        <Section title="Video introduction" icon={Video}>
          <div className="aspect-video max-w-xl overflow-hidden rounded-[10px] bg-black">
            <video src={cand.introVideoUrl} controls className="size-full object-cover" />
          </div>
        </Section>
      )}

      <Section title="Professional summary">
        <p className={`m-0 whitespace-pre-line break-words ${cand.bio ? '' : MUTED}`}>{cand.bio || 'No summary added yet.'}</p>
      </Section>

      <Section title="Skills and levels">
        <div className="flex flex-wrap gap-1.5">
          {(cand.skills || []).length === 0 && <span className={MUTED}>No skills listed yet.</span>}
          {(cand.skills || []).map((skill) => (
            <span key={skillName(skill)} className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#E4E6EA] px-2.5 py-1 text-[13px]">
              {skillName(skill)}
              <span className="font-semibold text-[#0F7A55]">Level {skill.rating}/10</span>
              {skill.verifiedRating > 0 && (
                <Tag tone="green">
                  <ShieldCheck className="size-3" aria-hidden="true" />
                  Verified {skill.verifiedRating}
                </Tag>
              )}
            </span>
          ))}
        </div>
      </Section>

      {(cand.experience || []).length > 0 && (
        <Section title="Work experience" icon={Briefcase}>
          {cand.experience.map((exp, index) => (
            <Item
              key={index}
              title={exp.designation || exp.title}
              subtitle={exp.companyName || exp.company}
              aside={<span className={`text-xs ${MUTED}`}>{[exp.startDate, exp.currentlyWorking ? 'Present' : exp.endDate || 'Present'].filter(Boolean).join(' – ')}</span>}
            >
              {exp.description && <p className="m-0 whitespace-pre-line text-[13px] text-[#334155]">{exp.description}</p>}
            </Item>
          ))}
        </Section>
      )}

      {(cand.projects || []).length > 0 && (
        <Section title="Projects" icon={FolderGit2}>
          {cand.projects.map((proj, index) => (
            <Item
              key={index}
              title={proj.title}
              subtitle={proj.role}
              aside={
                <span className="flex flex-wrap items-center gap-3 text-[13px]">
                  {proj.videoUrl && (
                    <button type="button" onClick={() => onPlayProjectVideo({ url: proj.videoUrl, title: proj.title })} className={`inline-flex items-center gap-1 ${LINK}`}>
                      <Play className="size-3 fill-current" aria-hidden="true" />
                      Demo video
                    </button>
                  )}
                  {(proj.hostedUrl || proj.link) && (
                    <a href={withHttp(proj.hostedUrl || proj.link)} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${LINK}`}>
                      Live demo <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  )}
                  {proj.codeUrl && (
                    <a href={withHttp(proj.codeUrl)} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 ${LINK}`}>
                      Code <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  )}
                </span>
              }
            >
              {proj.description && <p className="m-0 whitespace-pre-line text-[13px] text-[#334155]">{proj.description}</p>}
              {(proj.skills || []).length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {proj.skills.map((skill) => (
                    <Tag key={skill} tone={job?.requirements?.some((req) => req.skillName.toLowerCase() === skill.toLowerCase()) ? 'brand' : 'grey'}>
                      {skill}
                    </Tag>
                  ))}
                </div>
              )}
            </Item>
          ))}
        </Section>
      )}

      {(cand.certificates || []).length > 0 && (
        <Section title="Certifications" icon={Award}>
          {cand.certificates.map((cert, index) => (
            <Item
              key={index}
              title={cert.title || cert.name}
              subtitle={cert.org || cert.issuer}
              aside={
                cert.link && (
                  <a href={withHttp(cert.link)} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-1 text-[13px] ${LINK}`}>
                    Credential <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                )
              }
            />
          ))}
        </Section>
      )}

      {(cand.education || []).length > 0 && (
        <Section title="Education" icon={GraduationCap}>
          {cand.education.map((edu, index) => (
            <Item
              key={index}
              title={[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' · ') || edu.eduType || 'Education'}
              subtitle={edu.institute}
              aside={<span className={`text-xs ${MUTED}`}>{[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}</span>}
            >
              {edu.gradeValue && <span className={`text-[13px] ${MUTED}`}>{[edu.gradeType, edu.gradeValue].filter(Boolean).join(': ')}</span>}
            </Item>
          ))}
        </Section>
      )}

      {social.length > 0 && (
        <Section title="Social and coding profiles">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {social.map(([key, , label, Icon]) => (
              <a
                key={key}
                href={withHttp(cand.socialLinks[key])}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 rounded-[8px] border border-[#E4E6EA] px-3 py-2.5 font-semibold hover:border-[#0F7A55] hover:text-[#0F7A55]"
              >
                <span className="flex items-center gap-2">
                  <Icon className="size-4" aria-hidden="true" />
                  {label}
                </span>
                <ExternalLink className={`size-3.5 ${MUTED}`} aria-hidden="true" />
              </a>
            ))}
          </div>
        </Section>
      )}

    </section>
  );
}
