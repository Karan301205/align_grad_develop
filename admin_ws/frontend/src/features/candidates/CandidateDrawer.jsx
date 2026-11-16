import { useState } from 'react';
import { Mail, MapPin, Phone, UserRound, Video } from 'lucide-react';
import DetailList from '../../components/ui/DetailList.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import DrawerNav from '../../components/ui/DrawerNav.jsx';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import SafeLink from '../../components/SafeLink.jsx';
import { applicationsOf, skillsOf, verifiedSkillCount } from '../../utils/candidates.js';
import { formatDate, safeUrl } from '../../utils/format.js';
import { BackgroundSection, CredentialsSection, ProjectsSection, SkillsSection, list } from './CandidateSections.jsx';

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-3">
      <div className="text-xs font-semibold text-muted">{label}</div>
      <div className="text-2xl font-bold leading-tight">{value}</div>
      {hint && <div className="text-xs text-muted">{hint}</div>}
    </div>
  );
}

function Overview({ candidate: c, skills, projects, certificates }) {
  const applications = applicationsOf(c);
  const count = (key) => (applications ? applications[key] : '—');
  const video = safeUrl(c.introVideoUrl);

  return (
    <div className="space-y-5">
      <section aria-label="Applications">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Applications</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Total" value={count('total')} hint="All kinds" />
          <Stat label="Jobs" value={count('jobs')} />
          <Stat label="Internships" value={count('internships')} />
          <Stat label="Gigs" value={count('gigs')} hint="Pitches sent" />
        </div>
      </section>

      <section aria-label="Profile metrics">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Profile</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Skills" value={skills.length} />
          <Stat label="Verified skills" value={verifiedSkillCount(c)} hint="Passed a skill test" />
          <Stat label="Projects" value={projects.length} />
          <Stat label="Certificates" value={certificates.length} />
        </div>
      </section>

      <Panel>
        <PanelHeader title="Video résumé" subtitle="The one-minute introduction the candidate recorded" />
        <PanelBody>
          {video ? (
            <video src={video} controls preload="metadata" className="aspect-video w-full rounded-lg border border-line bg-ink object-contain" />
          ) : (
            <div className="grid aspect-video place-items-center rounded-lg border border-dashed border-line-strong bg-canvas text-sm text-muted">
              <span className="flex items-center gap-2">
                <Video className="size-4" aria-hidden="true" />
                No video résumé uploaded
              </span>
            </div>
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader title="General details" />
        <PanelBody className="space-y-4">
          <DetailList
            items={[
              ['Username', c.username && c.username !== 'N/A' ? `@${c.username}` : ''],
              ['Nationality', c.nationality],
              ['Gender', c.gender],
              ['Date of birth', c.dob],
              ['Phone', c.phone],
              ['Email', c.email],
              ['Résumé', safeUrl(c.resumeUrl) ? <SafeLink key="resume" href={c.resumeUrl}>Open résumé</SafeLink> : '']
            ]}
          />
          {c.bio && (
            <div>
              <h3 className="text-xs font-semibold text-muted">Biography</h3>
              <p className="mt-0.5 whitespace-pre-line break-words text-sm text-ink-2">{c.bio}</p>
            </div>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}

/**
 * A candidate's whole profile in a panel on the right. `position` (1-based) and `total` describe where this
 * candidate sits in the list being browsed; Previous / Next move through that list. The chosen tab is kept
 * while moving between candidates, so you can compare one tab across people.
 */
export default function CandidateDrawer({ candidate, position, total, onPrev, onNext, onClose }) {
  const [tab, setTab] = useState('overview');

  const skills = skillsOf(candidate);
  const education = list(candidate.education);
  const experience = list(candidate.experience);
  const projects = list(candidate.projects);
  const certificates = list(candidate.certificates);
  // `cocurricular` is a list of activities; older profiles stored a single portfolio link.
  const activities = list(candidate.cocurricular);
  const activitiesLink = typeof candidate.cocurricular === 'string' ? candidate.cocurricular : '';

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'skills', label: 'Skills', count: skills.length },
    { key: 'background', label: 'Education & work', count: education.length + experience.length },
    { key: 'projects', label: 'Projects', count: projects.length },
    { key: 'credentials', label: 'Certificates & activities', count: certificates.length + activities.length + (activitiesLink ? 1 : 0) }
  ];

  const meta = [
    [Mail, candidate.email],
    [Phone, candidate.phone],
    [UserRound, candidate.username && candidate.username !== 'N/A' ? `@${candidate.username}` : ''],
    [MapPin, candidate.nationality]
  ].filter(([, text]) => text);

  const joined = formatDate(candidate.createdAt);
  const verified = verifiedSkillCount(candidate);

  const footer = position && total ? <DrawerNav noun="candidate" label={candidate.name} position={position} total={total} onPrev={onPrev} onNext={onNext} /> : null;

  return (
    <Drawer
      title={candidate.name}
      scrollKey={candidate.id}
      footer={footer}
      onClose={onClose}
      subtitle={
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {meta.map(([Icon, text]) => (
            <li key={text} className="flex min-w-0 items-center gap-1.5">
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-all">{text}</span>
            </li>
          ))}
        </ul>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {joined && <Pill tone="info">Joined {joined}</Pill>}
        <Pill tone={verified > 0 ? 'ok' : 'neutral'}>{verified > 0 ? `${verified} verified ${verified === 1 ? 'skill' : 'skills'}` : 'No verified skills'}</Pill>
        <Pill tone={candidate.introVideoUrl ? 'ok' : 'neutral'}>{candidate.introVideoUrl ? 'Video résumé' : 'No video résumé'}</Pill>
      </div>

      <Panel className="mb-4">
        <Tabs dense label="Candidate sections" value={tab} onChange={setTab} tabs={tabs} />
      </Panel>

      <div role="tabpanel" aria-label={tabs.find((t) => t.key === tab).label}>
        {tab === 'overview' && <Overview candidate={candidate} skills={skills} projects={projects} certificates={certificates} />}
        {tab === 'skills' && <SkillsSection skills={skills} />}
        {tab === 'background' && <BackgroundSection education={education} experience={experience} stacked />}
        {tab === 'projects' && <ProjectsSection projects={projects} />}
        {tab === 'credentials' && <CredentialsSection certificates={certificates} activities={activities} activitiesLink={activitiesLink} stacked />}
      </div>
    </Drawer>
  );
}
