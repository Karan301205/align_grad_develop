import { Award, Briefcase, Building2, HardDrive, RefreshCw, Users } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import { useAdminData } from '../../app/AdminDataContext.jsx';
import { useNavigation } from '../../app/NavigationContext.jsx';
import useLiveResource from '../../hooks/useLiveResource.js';
import BarRow from '../../components/ui/BarRow.jsx';
import Button from '../../components/ui/Button.jsx';
import KpiCard from '../../components/ui/KpiCard.jsx';
import { LoadError } from '../../components/ui/Notice.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import { hasSkills, hasVideo, verifiedSkillCount } from '../../utils/candidates.js';
import { percentOf } from '../../utils/chart.js';
import { formatDate } from '../../utils/format.js';
import OpportunityMetrics, { REFRESH_SECONDS } from './OpportunityMetrics.jsx';

export default function DashboardPage() {
  const { stats, students, recruiters } = useAdminData();
  const metrics = useLiveResource(adminApi.getOpportunityMetrics, (json) => json, { intervalMs: REFRESH_SECONDS * 1000 });
  const { open } = useNavigation();

  const candidates = students.data || [];
  const companies = recruiters.data || [];
  const pending = companies.filter((c) => c.verificationStatus === 'PENDING');
  const approved = companies.filter((c) => c.verificationStatus === 'APPROVED').length;

  const withSkills = candidates.filter(hasSkills).length;
  const verified = candidates.filter((c) => verifiedSkillCount(c) > 0).length;
  const withVideo = candidates.filter(hasVideo).length;

  const busy = stats.loading || students.loading || recruiters.loading || metrics.loading;
  const reloadAll = () => Promise.all([stats.reload(), students.reload(), recruiters.reload(), metrics.reload()]);

  const total = (resource, value) => (resource.data ? value : resource.error ? '—' : '…');
  const totals = stats.data;
  const mixTotal = (totals?.totalStudents || 0) + (totals?.totalRecruiters || 0);
  const candidatePercent = percentOf(totals?.totalStudents || 0, mixTotal);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Candidates, companies, and the jobs, internships and gigs on the platform."
        actions={
          <Button icon={RefreshCw} loading={busy} onClick={reloadAll}>
            Refresh
          </Button>
        }
      />

      <div className="mb-4 space-y-2">
        {stats.error && <LoadError what="the platform totals" message={stats.error} onRetry={stats.reload} />}
        {students.error && <LoadError what="the candidate list" message={students.error} onRetry={students.reload} />}
        {recruiters.error && <LoadError what="the company list" message={recruiters.error} onRetry={recruiters.reload} />}
      </div>

      <section aria-label="Key numbers" className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Candidates"
          value={total(stats, totals?.totalStudents)}
          hint={students.data ? `${withSkills} with skills added` : undefined}
          icon={Users}
        />
        <KpiCard
          label="Companies"
          value={total(stats, totals?.totalRecruiters)}
          hint={recruiters.data ? `${approved} approved · ${pending.length} pending` : undefined}
          icon={Building2}
          tone="info"
        />
        <KpiCard label="Job postings" value={total(stats, totals?.activeJobs)} hint="Listed on the platform" icon={Briefcase} tone="ok" />
        <KpiCard label="Certificates listed" value={total(stats, totals?.verifiedCerts)} hint="Added to candidate profiles" icon={Award} tone="warn" />
        <KpiCard label="File storage" value={total(stats, totals?.storageSize ?? 'Unavailable')} hint="AWS S3 bucket" icon={HardDrive} />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="grid min-w-0 gap-4 md:grid-cols-2 lg:col-span-2">
          <Panel>
            <PanelHeader
              title="Candidate readiness"
              subtitle="Share of registered candidates"
              info="How many registered candidates have added skills, passed a skill test (verified skills) and uploaded a video résumé. Companies see verified skills first."
            />
            <PanelBody className="space-y-4">
              {candidates.length === 0 ? (
                <EmptyState icon={Users}>{students.loading ? 'Loading candidates…' : 'No candidates have registered yet.'}</EmptyState>
              ) : (
                <>
                  <BarRow label="Skills added" display={`${withSkills} of ${candidates.length}`} percent={percentOf(withSkills, candidates.length)} />
                  <BarRow label="Verified skills (passed a test)" display={`${verified} of ${candidates.length}`} percent={percentOf(verified, candidates.length)} tone="ok" />
                  <BarRow label="Video résumé uploaded" display={`${withVideo} of ${candidates.length}`} percent={percentOf(withVideo, candidates.length)} tone="info" />
                </>
              )}
            </PanelBody>
          </Panel>

          <Panel>
            <PanelHeader
              title="Who is on the platform"
              subtitle="Candidates and recruiting companies"
              info="Splits every account on the platform into candidates and recruiting companies."
            />
            <PanelBody>
              {mixTotal === 0 ? (
                <EmptyState icon={Users}>{stats.loading ? 'Loading…' : 'No accounts yet.'}</EmptyState>
              ) : (
                <>
                  <div role="img" aria-label={`${candidatePercent}% candidates, ${100 - candidatePercent}% companies`} className="mb-4 flex h-3 overflow-hidden rounded-full bg-subtle">
                    <div className="bg-accent" style={{ width: `${candidatePercent}%` }} />
                    <div className="bg-info" style={{ width: `${100 - candidatePercent}%` }} />
                  </div>
                  <dl className="space-y-2 text-[13px]">
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-2 text-ink-2">
                        <span className="size-2.5 rounded-sm bg-accent" aria-hidden="true" />
                        Candidates
                      </dt>
                      <dd className="font-semibold">
                        {totals.totalStudents} ({candidatePercent}%)
                      </dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="flex items-center gap-2 text-ink-2">
                        <span className="size-2.5 rounded-sm bg-info" aria-hidden="true" />
                        Companies
                      </dt>
                      <dd className="font-semibold">
                        {totals.totalRecruiters} ({100 - candidatePercent}%)
                      </dd>
                    </div>
                  </dl>
                </>
              )}
            </PanelBody>
          </Panel>
        </div>

        <Panel className="min-w-0">
          <PanelHeader
            title="Companies to review"
            subtitle="Waiting for an approval decision"
            info="Companies that sent their documents and are waiting for you to approve or reject them. Review opens that company's review panel; View all opens the Pending review list."
            action={
              pending.length > 0 && (
                <Button size="sm" variant="ghost" onClick={() => open('companies', { tab: 'PENDING' })}>
                  View all
                </Button>
              )
            }
          />
          {pending.length === 0 ? (
            <EmptyState icon={Building2}>{recruiters.loading ? 'Loading…' : 'No companies are waiting for review.'}</EmptyState>
          ) : (
            <ul>
              {pending.slice(0, 5).map((company) => (
                <li key={company.id} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold">{company.companyName}</div>
                    <div className="truncate text-xs text-muted">
                      {company.email}
                      {company.verificationSubmittedAt && ` · submitted ${formatDate(company.verificationSubmittedAt)}`}
                    </div>
                  </div>
                  <Button size="sm" variant="primary" onClick={() => open('companies', { id: company.id })}>
                    Review
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <OpportunityMetrics metrics={metrics} />
    </>
  );
}
