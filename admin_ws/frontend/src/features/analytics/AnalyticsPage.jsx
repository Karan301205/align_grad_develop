import { Layers, RefreshCw, Sparkles, Users } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import useResource from '../../hooks/useResource.js';
import Button from '../../components/ui/Button.jsx';
import KpiCard from '../../components/ui/KpiCard.jsx';
import { LoadError } from '../../components/ui/Notice.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Loading } from '../../components/ui/States.jsx';
import SkillRanking from './SkillRanking.jsx';

export default function AnalyticsPage() {
  const analytics = useResource(adminApi.getAnalytics);
  const demand = analytics.data?.recruiterSkills || [];
  const supply = analytics.data?.studentSkills || [];

  const listedByCandidates = new Set(supply.map((skill) => skill.name.toLowerCase()));
  const inBoth = demand.filter((skill) => listedByCandidates.has(skill.name.toLowerCase())).length;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="The skills employers ask for, next to the skills candidates list on their profiles."
        actions={
          <Button icon={RefreshCw} loading={analytics.loading} onClick={analytics.reload}>
            Refresh
          </Button>
        }
      />

      {analytics.error && <LoadError className="mb-4" what="the analytics" message={analytics.error} onRetry={analytics.reload} />}

      {analytics.loading && !analytics.data ? (
        <Loading>Loading skill numbers…</Loading>
      ) : (
        analytics.data && (
          <>
            <section aria-label="Skill totals" className="mb-4 grid gap-3 sm:grid-cols-3">
              <KpiCard label="Skills employers ask for" value={demand.length} hint="Across all job postings" icon={Layers} tone="info" />
              <KpiCard label="Skills candidates list" value={supply.length} hint="Across all profiles" icon={Users} />
              <KpiCard label="Skills on both sides" value={inBoth} hint="Asked for and listed" icon={Sparkles} tone="ok" />
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <SkillRanking
                title="Most in-demand skills"
                subtitle="Ranked by how many job postings require the skill. The % is its share of all skill requirements."
                items={demand}
                unit={{ one: 'job', many: 'jobs' }}
                tone="info"
                empty="No skill requirements have been recorded on any job yet."
              />
              <SkillRanking
                title="Most listed skills"
                subtitle="Ranked by how many candidates list the skill. The % is its share of all skills listed."
                items={supply}
                unit={{ one: 'candidate', many: 'candidates' }}
                tone="accent"
                empty="No candidate has added a skill yet."
              />
            </div>
          </>
        )
      )}
    </>
  );
}
