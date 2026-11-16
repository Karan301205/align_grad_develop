import { Code, GraduationCap } from 'lucide-react';
import DataTable from '../../components/ui/DataTable.jsx';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import SafeLink from '../../components/SafeLink.jsx';
import { gradeLabel, periodLabel, skillRatings } from '../../utils/candidates.js';

export const list = (value) => (Array.isArray(value) ? value : []);

function CardList({ items, empty, icon, children }) {
  if (items.length === 0) return <EmptyState icon={icon}>{empty}</EmptyState>;
  return (
    <ul className="divide-y divide-line">
      {items.map((item, index) => (
        <li key={index} className="space-y-1 px-4 py-3.5">
          {children(item)}
        </li>
      ))}
    </ul>
  );
}

export function SkillsSection({ skills }) {
  const columns = [
    { header: 'Skill', render: (s) => <span className="font-semibold">{s.name}</span> },
    { header: 'Self-rated', render: (s) => (skillRatings(s).self ? `${skillRatings(s).self} / 10` : '—') },
    {
      header: 'Verified by test',
      render: (s) => (skillRatings(s).verified ? <Pill tone="ok">{skillRatings(s).verified} / 10</Pill> : <Pill>Not verified</Pill>)
    }
  ];
  return (
    <Panel>
      <PanelHeader title="Skills" subtitle="Self-rated skills, and the rating earned by passing a skill test" />
      <DataTable caption="Skills" columns={columns} rows={skills} rowKey={(s) => s.name} empty="This candidate has not added any skills." />
    </Panel>
  );
}

export function BackgroundSection({ education, experience, stacked = false }) {
  return (
    <div className={stacked ? 'space-y-4' : 'grid gap-4 lg:grid-cols-2'}>
      <Panel>
        <PanelHeader title="Education" />
        <CardList items={education} icon={GraduationCap} empty="No education history added.">
          {(edu) => (
            <>
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">{edu.institute || 'Institute not given'}</span>
                {edu.eduType && <Pill tone="accent">{edu.eduType}</Pill>}
              </div>
              <p className="text-[13px] text-ink-2">{[edu.degree, edu.fieldOfStudy && `in ${edu.fieldOfStudy}`].filter(Boolean).join(' ')}</p>
              <p className="text-xs text-muted">{[periodLabel(edu), gradeLabel(edu)].filter(Boolean).join(' · ')}</p>
            </>
          )}
        </CardList>
      </Panel>
      <Panel>
        <PanelHeader title="Work experience" />
        <CardList items={experience} empty="No work experience added.">
          {(exp) => (
            <>
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">{exp.companyName || 'Company not given'}</span>
                {exp.expType && <Pill tone="accent">{exp.expType}</Pill>}
              </div>
              <p className="text-[13px] font-medium text-accent-ink">{exp.designation}</p>
              <p className="text-xs text-muted">{[periodLabel(exp), exp.location].filter(Boolean).join(' · ')}</p>
              {exp.description && <p className="whitespace-pre-line text-[13px] text-ink-2">{exp.description}</p>}
            </>
          )}
        </CardList>
      </Panel>
    </div>
  );
}

export function ProjectsSection({ projects }) {
  return (
    <Panel>
      <PanelHeader title="Projects" subtitle="Academic and personal projects" />
      <CardList items={projects} icon={Code} empty="No projects added.">
        {(project) => (
          <>
            <div className="flex items-start justify-between gap-2">
              <span className="font-semibold">{project.title || 'Untitled project'}</span>
              {project.role && <Pill tone="accent">{project.role}</Pill>}
            </div>
            {project.description && <p className="whitespace-pre-line text-[13px] text-ink-2">{project.description}</p>}
            {list(project.skills).length > 0 && (
              <div className="flex flex-wrap gap-1 pt-1">
                {list(project.skills).map((skill) => (
                  <Pill key={skill}>{skill}</Pill>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[13px]">
              <SafeLink href={project.codeUrl}>Code</SafeLink>
              <SafeLink href={project.hostedUrl}>Live site</SafeLink>
              <SafeLink href={project.videoUrl}>Video demo</SafeLink>
            </div>
          </>
        )}
      </CardList>
    </Panel>
  );
}

export function CredentialsSection({ certificates, activities, activitiesLink, stacked = false }) {
  return (
    <div className={stacked ? 'space-y-4' : 'grid gap-4 lg:grid-cols-2'}>
      <Panel>
        <PanelHeader title="Certificates" subtitle="Listed by the candidate; not checked by the platform" />
        <CardList items={certificates} empty="No certificates added.">
          {(cert) => (
            <>
              <span className="block font-semibold">{cert.title || 'Untitled certificate'}</span>
              {cert.org && <span className="block text-[13px] text-ink-2">{cert.org}</span>}
              {cert.certNumber && <span className="block text-xs text-muted">ID: {cert.certNumber}</span>}
              <div className="pt-1 text-[13px]">
                <SafeLink href={cert.link}>Verification link</SafeLink>
              </div>
            </>
          )}
        </CardList>
      </Panel>
      <Panel>
        <PanelHeader title="Co-curricular activities" />
        {activities.length === 0 && !activitiesLink ? (
          <EmptyState>No co-curricular activities added.</EmptyState>
        ) : (
          <>
            <CardList items={activities} empty="">
              {(activity) => (
                <>
                  <span className="block font-semibold">{activity.activity || 'Activity'}</span>
                  {activity.description && <p className="whitespace-pre-line text-[13px] text-ink-2">{activity.description}</p>}
                  <div className="pt-1 text-[13px]">
                    <SafeLink href={activity.link}>Activity link</SafeLink>
                  </div>
                </>
              )}
            </CardList>
            {activitiesLink && (
              <PanelBody>
                <SafeLink href={activitiesLink}>Certificate portfolio link</SafeLink>
              </PanelBody>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
