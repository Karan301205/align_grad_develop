import { useState } from 'react';
import { Briefcase, Globe, Mail, MapPin, Users } from 'lucide-react';
import { useNavigation } from '../../app/NavigationContext.jsx';
import Button from '../../components/ui/Button.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import DrawerNav from '../../components/ui/DrawerNav.jsx';
import { Panel, PanelHeader } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import { formatDate } from '../../utils/format.js';
import { verificationMeta } from '../../utils/verification.js';
import CompanyOverview from './CompanyOverview.jsx';
import VerificationPanel from './VerificationPanel.jsx';

function JobsTab({ company }) {
  const { open } = useNavigation();
  const jobs = company.jobs || [];
  return (
    <Panel>
      <PanelHeader title={`Jobs posted (${jobs.length})`} subtitle="Open a posting to see the full details and who applied" />
      {jobs.length === 0 ? (
        <EmptyState icon={Briefcase}>No jobs posted yet.</EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {jobs.map((job) => (
            <li key={job.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="break-words font-semibold">{job.title}</span>
                  <Pill tone="accent">{job.jobType}</Pill>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {job.location} · {job.salaryRange}
                </p>
                <p className="mt-1 line-clamp-2 break-words text-[13px] text-ink-2">{job.description}</p>
              </div>
              <Button size="sm" onClick={() => open('jobs', { jobId: job.id })}>
                View details
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/**
 * A company's whole review in a panel on the right: Overview (with the approve / reject decision, which
 * lives only there), Verification and Jobs. `position` (1-based) and `total` say where this company sits
 * in the list being browsed; Previous / Next move through it. `section` and `onSection` are the chosen
 * tab, kept by the page so it survives leaving for a job and coming back.
 */
export default function CompanyDrawer({ company, section, onSection, position, total, onPrev, onNext, onClose, onUpdated }) {
  const [deciding, setDeciding] = useState(false); // a rejection reason is being typed
  const meta = verificationMeta(company.verificationStatus);
  const info = company.company;
  const registered = formatDate(company.registeredAt);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'verification', label: 'Verification', count: (company.verificationDocs || []).length },
    { key: 'jobs', label: 'Jobs', count: (company.jobs || []).length }
  ];

  const facts = [
    [Mail, company.email],
    [MapPin, info?.location],
    [Users, info?.companySize],
    [Globe, info?.industry]
  ].filter(([, text]) => text);

  return (
    <Drawer
      title={company.companyName}
      scrollKey={`${company.id}:${section}`}
      closeOnBackdrop={!deciding}
      onClose={onClose}
      footer={<DrawerNav noun="company" label={company.companyName} position={position} total={total} onPrev={onPrev} onNext={onNext} />}
      subtitle={
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {facts.map(([Icon, text]) => (
            <li key={text} className="flex min-w-0 items-center gap-1.5">
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-all">{text}</span>
            </li>
          ))}
        </ul>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Pill tone={meta.tone}>{meta.label}</Pill>
        {registered && <Pill tone="info">Registered {registered}</Pill>}
      </div>

      <Panel className="mb-4">
        <Tabs dense label="Company sections" value={section} onChange={onSection} tabs={tabs} />
      </Panel>

      {/* keyed by company, so moving to another one starts its forms afresh */}
      <div key={company.id} role="tabpanel" aria-label={tabs.find((t) => t.key === section).label}>
        {section === 'overview' && <CompanyOverview company={company} onUpdated={onUpdated} onOpenTab={onSection} onDraftChange={setDeciding} />}
        {section === 'verification' && <VerificationPanel company={company} onOpenOverview={() => onSection('overview')} />}
        {section === 'jobs' && <JobsTab company={company} />}
      </div>
    </Drawer>
  );
}
