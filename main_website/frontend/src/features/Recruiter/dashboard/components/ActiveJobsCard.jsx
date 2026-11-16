import { CARD, CARD_TITLE, LINK, MUTED } from '../../components/accountStyles';
import { CLOSING_SOON_DAYS, closingDate, daysLeft, jobCounts } from '../dashboardData';

const TH = 'border-y border-[#EEF0F3] py-2.5 font-semibold';
const NUM = 'px-3 py-3.5 text-right tabular-nums';

function typeLine(job) {
  const type = job.opportunityType === 'INTERNSHIP' ? ['Internship', job.duration].filter(Boolean).join(' · ') : 'Job';
  const openings = job.openings ? `${job.openings} opening${Number(job.openings) === 1 ? '' : 's'}` : '';
  return [type, job.workMode, openings].filter(Boolean).join(' · ');
}

/** Live jobs with their pipeline counts; a row opens that job's applicants. */
export default function ActiveJobsCard({ jobs, onOpenJob, onViewAll }) {
  return (
    <section aria-labelledby="active-jobs-title" className={CARD}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-[18px]">
        <h2 id="active-jobs-title" className={CARD_TITLE}>
          <span className="font-semibold">Live jobs</span>
        </h2>
        <button type="button" onClick={onViewAll} className={LINK}>
          View all jobs
        </button>
      </div>
      {jobs.length === 0 ? (
        <p className={`m-0 border-t border-[#EEF0F3] px-5 py-4 ${MUTED}`}>No live jobs. Paused and closed jobs are on the Jobs page.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className={`text-left text-xs uppercase tracking-[0.04em] ${MUTED}`}>
                <th scope="col" className={`${TH} px-5`}>Job</th>
                <th scope="col" className={`${TH} px-3 text-right`}>Applied</th>
                <th scope="col" className={`${TH} px-3 text-right`}>Shortlisted</th>
                <th scope="col" className={`${TH} px-3 text-right`}>Interview</th>
                <th scope="col" className={`${TH} px-3 text-right`}>Hired</th>
                <th scope="col" className={`${TH} px-5`}>Closes</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job, index) => {
                const counts = jobCounts(job);
                const left = daysLeft(job);
                const rowBorder = index < jobs.length - 1 ? 'border-b border-[#EEF0F3]' : '';
                return (
                  <tr key={job.id} className={rowBorder}>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <button type="button" onClick={() => onOpenJob(job)} className="self-start rounded-[4px] text-left font-semibold text-[#023836] hover:text-[#0F7A55] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F7A55]">
                          {job.title}
                        </button>
                        <span className={`text-[13px] ${MUTED}`}>
                          {typeLine(job)}
                          {counts.newApplicants > 0 && <span className="font-semibold text-[#0F7A55]"> · {counts.newApplicants} new this week</span>}
                        </span>
                      </div>
                    </td>
                    <td className={NUM}>{counts.applied}</td>
                    <td className={NUM}>{counts.shortlisted}</td>
                    <td className={NUM}>{counts.interviews}</td>
                    <td className={NUM}>{counts.hires}</td>
                    <td className="px-5 py-3.5">
                      {left <= CLOSING_SOON_DAYS ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#FFF1E8] px-2.5 py-[3px] text-[13px] font-semibold text-[#9A3412]">
                          {closingDate(job)} · {left} day{left === 1 ? '' : 's'}
                        </span>
                      ) : (
                        <span className={`whitespace-nowrap ${MUTED}`}>{closingDate(job)}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
