import { Briefcase, GraduationCap, Send, Zap } from 'lucide-react';
import BarRow from '../../components/ui/BarRow.jsx';
import DonutChart from '../../components/charts/DonutChart.jsx';
import LineChart from '../../components/charts/LineChart.jsx';
import StackedColumns from '../../components/charts/StackedColumns.jsx';
import InfoTip from '../../components/ui/InfoTip.jsx';
import KpiCard from '../../components/ui/KpiCard.jsx';
import { LoadError } from '../../components/ui/Notice.jsx';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import { EmptyState, Loading } from '../../components/ui/States.jsx';
import useNow from '../../hooks/useNow.js';
import { cx } from '../../utils/cx.js';
import { plural } from '../../utils/format.js';
import {
  describeAge,
  formatBudgets,
  gigStatusRows,
  listedSlices,
  listedTotal,
  popularKind,
  postingSeries,
  responseSeries,
  shareRows,
  weeklyLabels,
  weeklyRanges
} from '../../utils/opportunities.js';

export const REFRESH_SECONDS = 30;

/** "Live" with the age of the data. Turns amber when the last refresh failed but old numbers are still shown. */
function LiveBadge({ updatedAt, stale }) {
  const now = useNow(5000);
  return (
    <span
      className={cx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12.5px] font-semibold',
        stale ? 'border-warn/30 bg-warn-soft text-warn' : 'border-ok/30 bg-ok-soft text-ok'
      )}
    >
      <span className="relative flex size-2" aria-hidden="true">
        <span className={cx('absolute inline-flex size-full rounded-full opacity-60 motion-safe:animate-ping', stale ? 'bg-warn' : 'bg-ok')} />
        <span className={cx('relative inline-flex size-2 rounded-full', stale ? 'bg-warn' : 'bg-ok')} />
      </span>
      {stale ? 'Reconnecting…' : 'Live'}
      {updatedAt && <span className="font-normal">· updated {describeAge(updatedAt, now)}</span>}
    </span>
  );
}

function Popular({ items }) {
  if (items.length === 0) return <EmptyState>No one has applied to a job, internship or gig yet.</EmptyState>;
  return (
    <ol>
      {items.map((item, index) => {
        const kind = popularKind(item.type);
        return (
          <li key={`${item.type}-${item.id}`} className="flex items-center gap-3 border-b border-line px-4 py-3 last:border-b-0">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-subtle text-xs font-bold text-ink-2">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-semibold">{item.title}</div>
              <div className="truncate text-xs text-muted">{item.company || 'Company not shown'}</div>
            </div>
            <Pill tone={kind.tone}>{kind.label}</Pill>
            <span className="w-24 shrink-0 text-right text-[13px] font-semibold">
              {item.count} <span className="font-normal text-muted">{item.count === 1 ? kind.unit[0] : kind.unit[1]}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The dashboard's live section. `metrics` is a useLiveResource of GET /dashboard/opportunities. */
export default function OpportunityMetrics({ metrics }) {
  const data = metrics.data;
  const listings = data?.listings || {};
  const activity = data?.activity || {};
  const weekly = data?.weekly || [];

  const workModes = shareRows(data?.workModes || []);
  const pipeline = gigStatusRows(data?.gigs?.byStatus);
  const pipelineBars = shareRows(pipeline);
  // Only the six busiest categories come back, so each share is out of ALL gigs.
  const categories = shareRows(data?.gigs?.byCategory || [], listings.gigs || 0);
  const budget = formatBudgets(data?.gigs?.openBudget);

  return (
    <section aria-labelledby="live-metrics-title" className="mt-4 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="live-metrics-title" className="text-lg font-bold">
              Jobs, internships and gigs
            </h2>
            <InfoTip label="Jobs, internships and gigs">
              A live view of everything candidates can apply to: jobs and internships posted by recruiters, and freelance gigs. The numbers refresh by themselves every {REFRESH_SECONDS} seconds while this page is open.
            </InfoTip>
          </div>
          <p className="text-[13px] text-muted">What is on the platform right now, and how candidates are responding.</p>
        </div>
        {data && <LiveBadge updatedAt={data.generatedAt} stale={Boolean(metrics.error)} />}
      </div>

      {metrics.error && <LoadError what="the live numbers" message={metrics.error} onRetry={metrics.reload} />}
      {metrics.loading && !data ? (
        <Panel>
          <Loading>Loading live numbers…</Loading>
        </Panel>
      ) : (
        data && (
          <>
            <div aria-label="Open right now" role="group" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard label="Open jobs" value={listings.openJobs} hint={`${listings.jobs} in total · ${listings.jobs - listings.openJobs} paused or closed`} icon={Briefcase} />
              <KpiCard label="Open internships" value={listings.openInternships} hint={`${listings.internships} in total · ${listings.internships - listings.openInternships} paused or closed`} icon={GraduationCap} tone="ok" />
              <KpiCard label="Open gigs" value={listings.openGigs} hint={`${listings.gigsInProgress} in progress · ${listings.gigs} in total`} icon={Zap} tone="warn" />
              <KpiCard label="Applications and pitches" value={activity.applications + activity.pitches} hint={`${activity.applications} applications · ${activity.pitches} gig pitches`} icon={Send} tone="info" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel>
                <PanelHeader
                  title="New postings per week"
                  subtitle="Published in the last 8 weeks"
                  info="How many jobs, internships and gigs recruiters published in each of the last 8 weeks. Taller columns mean a busier week. Hover a column for the exact numbers."
                />
                <PanelBody>
                  <StackedColumns
                    labels={weeklyLabels(weekly)}
                    titles={weeklyRanges(weekly)}
                    series={postingSeries(weekly)}
                    caption="New postings per week"
                    emptyMessage="Nothing was posted in the last 8 weeks."
                  />
                </PanelBody>
              </Panel>
              <Panel>
                <PanelHeader
                  title="Responses per week"
                  subtitle="Applications and gig pitches, last 8 weeks"
                  info="How many candidates applied to jobs and internships, and how many pitched on gigs, in each of the last 8 weeks. Use it to see whether interest is growing or fading."
                />
                <PanelBody>
                  <LineChart
                    labels={weeklyLabels(weekly)}
                    titles={weeklyRanges(weekly)}
                    series={responseSeries(weekly)}
                    caption="Applications and gig pitches per week"
                    emptyMessage="No one applied or pitched in the last 8 weeks."
                  />
                </PanelBody>
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Panel>
                <PanelHeader
                  title="What is listed"
                  subtitle="All postings by kind"
                  info="The split of every posting on the platform into jobs, internships and gigs, whether or not it is open right now."
                />
                <PanelBody>
                  <DonutChart slices={listedSlices(listings)} centerLabel={listedTotal(listings) === 1 ? 'posting' : 'postings'} emptyMessage="Nothing has been posted yet." />
                </PanelBody>
              </Panel>
              <Panel>
                <PanelHeader
                  title="Where the work happens"
                  subtitle="Jobs and internships by work mode"
                  info="Whether jobs and internships are done from the office, remotely or in a hybrid way. Gigs are not included because they have no work mode."
                />
                <PanelBody className="space-y-4">
                  {workModes.length === 0 ? (
                    <EmptyState>No jobs or internships yet.</EmptyState>
                  ) : (
                    workModes.map((mode) => <BarRow key={mode.name} label={mode.name} display={`${mode.count} · ${mode.percent}%`} percent={mode.bar} tone="info" />)
                  )}
                </PanelBody>
              </Panel>
              <Panel>
                <PanelHeader
                  title="Gig pipeline"
                  subtitle="Gigs by stage"
                  info="Where gigs are in their life: open for pitches, being worked on, completed or closed. The footer shows how many freelancers were hired and the combined budget of gigs that are still open."
                />
                <PanelBody className="space-y-4">
                  {pipelineBars.map((row) => (
                    <BarRow key={row.status} label={row.label} display={`${row.count}`} percent={row.bar} tone={row.tone} />
                  ))}
                  <p className="border-t border-line pt-3 text-[12.5px] text-muted">
                    {plural(data.gigs.hired, 'freelancer')} hired
                    {budget && (
                      <>
                        {' '}
                        · open budget <span className="font-semibold text-ink-2">{budget}</span>
                      </>
                    )}
                  </p>
                </PanelBody>
              </Panel>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel>
                <PanelHeader
                  title="Most popular right now"
                  subtitle="Most applicants or pitches"
                  info="The five postings that received the most applicants (jobs and internships) or pitches (gigs), so you can see where candidates are heading."
                />
                <Popular items={data.popular} />
              </Panel>
              <Panel>
                <PanelHeader title="Top gig categories" subtitle="Where recruiters post gigs most" info="The categories recruiters choose most often when they post a gig. The six busiest are shown; each percentage is the share of all gigs." />
                <PanelBody className="space-y-4">
                  {categories.length === 0 ? (
                    <EmptyState>No gigs have been posted yet.</EmptyState>
                  ) : (
                    categories.map((category) => <BarRow key={category.name} label={category.name} display={`${category.count} · ${category.percent}%`} percent={category.bar} tone="gigs" />)
                  )}
                </PanelBody>
              </Panel>
            </div>
          </>
        )
      )}
    </section>
  );
}
