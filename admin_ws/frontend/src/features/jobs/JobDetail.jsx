import { useMemo, useState } from 'react';
import { Briefcase, MapPin, Wallet } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import { useAdminData } from '../../app/AdminDataContext.jsx';
import useResource from '../../hooks/useResource.js';
import Button from '../../components/ui/Button.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import DetailList from '../../components/ui/DetailList.jsx';
import { LoadError } from '../../components/ui/Notice.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import { Loading } from '../../components/ui/States.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import SkillChips from '../../components/SkillChips.jsx';
import CandidateDrawer from '../candidates/CandidateDrawer.jsx';
import { skillsOf, verifiedSkillCount } from '../../utils/candidates.js';
import { requirementsOf } from '../../utils/jobs.js';

function Applicants({ applicants }) {
  const { students } = useAdminData();
  const [openId, setOpenId] = useState(null);

  // The applicants endpoint returns a slim profile; the full record (join date, application counts) is in the shared list.
  const rows = useMemo(() => {
    const full = new Map((students.data || []).map((s) => [s.id, s]));
    return (applicants.data || []).map((a) => full.get(a.id) || a);
  }, [applicants.data, students.data]);

  const openIndex = openId ? rows.findIndex((a) => a.id === openId) : -1;

  const columns = [
    {
      header: 'Candidate',
      render: (a) => (
        <div className="min-w-0 max-w-[13rem]">
          <div className="truncate font-semibold" title={a.name}>{a.name}</div>
          <div className="truncate text-xs text-muted" title={a.email}>{a.email}</div>
        </div>
      )
    },
    { header: 'Skills', render: (a) => <SkillChips candidate={a} /> },
    { header: 'Verified skills', align: 'right', render: (a) => `${verifiedSkillCount(a)} / ${skillsOf(a).length}` },
    {
      header: 'Actions',
      hideHeader: true,
      align: 'right',
      render: (a) => (
        <Button size="sm" aria-label={`View profile of ${a.name}`} onClick={() => setOpenId(a.id)}>
          View profile
        </Button>
      )
    }
  ];

  return (
    <Panel>
      <PanelHeader title="Candidates who applied" subtitle="Open a profile to see their skills, education and projects" />
      {applicants.error && <LoadError className="m-4" what="the applicants" message={applicants.error} onRetry={applicants.reload} />}
      {applicants.loading && !applicants.data ? (
        <Loading>Loading applicants…</Loading>
      ) : (
        <DataTable
          caption="Applicants"
          columns={columns}
          rows={rows}
          rowKey={(a) => a.id}
          onRowClick={(a) => setOpenId(a.id)}
          empty="No candidates have applied to this job yet."
        />
      )}
      {openIndex >= 0 && (
        <CandidateDrawer
          candidate={rows[openIndex]}
          position={openIndex + 1}
          total={rows.length}
          onPrev={() => setOpenId(rows[openIndex - 1].id)}
          onNext={() => setOpenId(rows[openIndex + 1].id)}
          onClose={() => setOpenId(null)}
        />
      )}
    </Panel>
  );
}

export default function JobDetail({ job, onBack, backLabel }) {
  const [tab, setTab] = useState('overview');
  const requirements = requirementsOf(job);
  // Fetched on arrival so the Applicants tab can show its count before it is opened.
  const applicants = useResource(() => adminApi.getJobApplicants(job.id), (json) => json.applicants);

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'skills', label: 'Skill requirements', count: requirements.length },
    { key: 'applicants', label: 'Applicants', count: applicants.data?.length }
  ];

  const facts = [
    [Briefcase, job.companyName],
    [MapPin, job.location],
    [Wallet, job.salaryRange]
  ].filter(([, text]) => text);

  return (
    <>
      <PageHeader back={{ label: backLabel, onClick: onBack }} title={job.title}>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Pill tone="accent">{job.jobType}</Pill>
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
            {facts.map(([Icon, text]) => (
              <li key={text} className="flex items-center gap-1.5">
                <Icon className="size-3.5" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </PageHeader>

      <Panel className="mb-4">
        <Tabs label="Job sections" value={tab} onChange={setTab} tabs={tabs} />
      </Panel>

      <div role="tabpanel" aria-label={tabs.find((t) => t.key === tab).label}>
        {tab === 'overview' && (
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel className="lg:col-span-2">
              <PanelHeader title="Job description" />
              <PanelBody>
                <p className="whitespace-pre-line text-sm text-ink-2">{job.description || 'No description given.'}</p>
              </PanelBody>
            </Panel>
            <Panel>
              <PanelHeader title="Details" />
              <PanelBody>
                <DetailList
                  columns={1}
                  items={[
                    ['Company', job.companyName],
                    ['Type', job.jobType],
                    ['Location', job.location],
                    ['Pay', job.salaryRange]
                  ]}
                />
              </PanelBody>
            </Panel>
          </div>
        )}

        {tab === 'skills' && (
          <Panel>
            <PanelHeader title="Skill requirements" subtitle="The minimum rating (out of 10) a candidate needs to apply" />
            <DataTable
              caption="Skill requirements"
              rows={requirements}
              rowKey={(r) => r.name}
              empty="This job has no skill requirements."
              columns={[
                { header: 'Skill', render: (r) => <span className="font-semibold">{r.name}</span> },
                { header: 'Minimum rating', render: (r) => (r.minRating ? `${r.minRating} / 10` : '—') }
              ]}
            />
          </Panel>
        )}

        {tab === 'applicants' && <Applicants applicants={applicants} />}
      </div>
    </>
  );
}
