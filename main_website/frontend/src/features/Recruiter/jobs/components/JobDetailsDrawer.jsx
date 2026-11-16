import { useEffect, useRef, useState } from 'react';
import { Building2, Calendar, Check, Clock, Download, Globe, MapPin, Share2, Users } from 'lucide-react';
import { ALL_SKILLS } from '../../../../constants';
import { CARD, MUTED, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../../components/accountStyles';
import SideDrawer from '../../components/SideDrawer';
import downloadJobDescriptionPdf from '../jobDescriptionPdf';
import { copyText, jobLink } from '../jobsData';

const isTechnical = (skillName) => {
  const skill = ALL_SKILLS.find((s) => s.skill.toLowerCase() === String(skillName).toLowerCase());
  return skill ? skill.type === 'technical' : true;
};

function Section({ title, aside, children }) {
  return (
    <section className={`${CARD} flex flex-col gap-3 p-4 sm:p-5`}>
      <div className="flex items-center justify-between gap-3 border-b border-[#EEF0F3] pb-2">
        <h4 className="m-0 text-[15px] leading-[1.45]">
          <span className="font-semibold">{title}</span>
        </h4>
        {aside && <span className={`text-xs ${MUTED}`}>{aside}</span>}
      </div>
      {children}
    </section>
  );
}

function Fact({ icon: Icon, label, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className={`text-xs ${MUTED}`}>{label}</span>
      <span className="flex items-center gap-1.5 font-semibold">
        <Icon className="size-3.5 shrink-0 text-[#0F7A55]" aria-hidden="true" />
        <span className="min-w-0 break-words">{children}</span>
      </span>
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-3 text-[13px]">
    <span className={MUTED}>{label}</span>
    <span className="text-right font-semibold">{value}</span>
  </div>
);

/**
 * Full details of one of the recruiter's jobs, in the right-hand drawer (opened from the Jobs page).
 * Download Description saves a PDF; Share copies the public job link.
 */
export default function JobDetailsDrawer({ job, onClose }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const title = job.title || job.designation;
  const company = job.company || {};
  const companyName = String(company.name || job.companyName || '').replace(/^c_/i, '');
  const logo = company.logoUrl || job.logoUrl || job.companyLogo;
  const salaryLabel = job.opportunityType === 'INTERNSHIP' ? 'Stipend' : 'Salary';
  const money = (value) => (job.showSalary === false ? 'Undisclosed' : value || 'N/A');

  const share = async () => {
    if (!(await copyText(jobLink(job)))) return;
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SideDrawer
      label={`${title} details`}
      onClose={onClose}
      widthClass="sm:w-[min(760px,92vw)]"
      header={
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[#E4E6EA] bg-[#E3F1EE] text-lg font-bold text-[#023836]">
            {logo ? <img src={logo} alt="" className="size-full object-cover" /> : <span>{(companyName || title || 'J').charAt(0).toUpperCase()}</span>}
          </div>
          <div className="min-w-0">
            <h3 className="m-0 truncate text-xl leading-tight">
              <span className="font-bold">{title}</span>
            </h3>
            <div className={`mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] ${MUTED}`}>
              {companyName && (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#023836]">
                  <Building2 className="size-3.5 shrink-0" aria-hidden="true" />
                  {companyName}
                  {company.verified && <span className="rounded-[6px] bg-[#E3F1EE] px-1.5 py-px text-[11px] font-semibold text-[#0F7A55]">Verified</span>}
                </span>
              )}
              {job.officialWebsite && (
                <a href={job.officialWebsite} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#0F7A55] hover:underline">
                  <Globe className="size-3.5" aria-hidden="true" />
                  Visit website
                </a>
              )}
            </div>
          </div>
        </div>
      }
      footer={
        <>
          <div className="flex flex-wrap items-center gap-2.5">
            <button type="button" onClick={() => downloadJobDescriptionPdf(job)} className={`${PRIMARY_BUTTON} h-10 px-4`}>
              <Download className="size-4" aria-hidden="true" />
              Download Description
            </button>
            <button type="button" onClick={share} className={`${SECONDARY_BUTTON} h-10 px-4`}>
              {copied ? <Check className="size-4 text-[#0F7A55]" aria-hidden="true" /> : <Share2 className="size-4" aria-hidden="true" />}
              {copied ? 'Link copied' : 'Share'}
            </button>
          </div>
          <button type="button" onClick={onClose} className={`${SECONDARY_BUTTON} h-10 px-4`}>
            Close Details
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5 text-sm">
        <div className={`${CARD} grid grid-cols-2 gap-4 p-4 sm:grid-cols-4 sm:p-5`}>
          <Fact icon={MapPin} label="Location">
            {job.locationUrl ? (
              <a href={job.locationUrl} target="_blank" rel="noopener noreferrer" className="text-[#0F7A55] hover:underline">
                {job.location || 'Map link'}
              </a>
            ) : (
              job.location || 'Not specified'
            )}
          </Fact>
          <Fact icon={Clock} label="Desired experience">
            {job.desiredExperience || 'Fresher'}
          </Fact>
          <Fact icon={Users} label="Openings">
            {job.openings ? `${job.openings} position${Number(job.openings) === 1 ? '' : 's'}` : 'N/A'}
          </Fact>
          <Fact icon={Calendar} label="Joining month">
            {job.joiningMonth || 'Immediate'}
          </Fact>
        </div>

        <Section title="Opportunity summary">
          <p className="m-0 whitespace-pre-line leading-relaxed text-[#334155]">{job.description || 'No summary provided.'}</p>
        </Section>

        {job.roleResponsibilities && (
          <Section title="Role & responsibilities">
            <p className="m-0 whitespace-pre-line leading-relaxed text-[#334155]">{job.roleResponsibilities}</p>
          </Section>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Section title="Employment parameters">
            <div className="flex flex-col gap-2.5">
              <Row label="Preferred education" value={job.preferredEducation || 'Any graduate'} />
              <Row label={`${salaryLabel} (part-time)`} value={money(job.stipendPartTime)} />
              <Row label={`${salaryLabel} (full-time)`} value={money(job.stipendFullTime)} />
              {job.duration && <Row label="Duration" value={job.duration} />}
              <Row label="Listing duration" value={`${job.activeDays || 30} days`} />
            </div>
          </Section>

          <Section title="Skill bars" aside="Test verified">
            {job.requirements?.length > 0 ? (
              <ul className="m-0 flex max-h-56 list-none flex-col gap-2 overflow-y-auto p-0">
                {job.requirements.map((req) => (
                  <li key={req.skillName} className="flex items-center justify-between gap-2 rounded-[8px] border border-[#EEF0F3] bg-[#F8FBFA] px-3 py-2">
                    <span className="min-w-0 truncate font-semibold">{req.skillName}</span>
                    {isTechnical(req.skillName) ? (
                      <span className="shrink-0 text-[13px] font-semibold text-[#0F7A55]">Lvl {req.minRating}/10</span>
                    ) : (
                      <span className="shrink-0 rounded-[6px] bg-[#F1F3F6] px-1.5 py-px text-[11px] font-medium text-[#334155]">Non-Technical</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`m-0 text-[13px] ${MUTED}`}>No skill bars on this job.</p>
            )}
          </Section>
        </div>

        {job.selectionProcess?.length > 0 && (
          <Section title="Selection process" aside={`${job.selectionProcess.length} round${job.selectionProcess.length === 1 ? '' : 's'}`}>
            <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
              {job.selectionProcess.map((round, index) => (
                <li key={round.roundNumber ?? index} className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-[#E3F1EE] text-xs font-bold text-[#0F7A55]">{round.roundNumber ?? index + 1}</span>
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-semibold">{round.name}</span>
                    {round.description && <span className={`text-[13px] leading-relaxed ${MUTED}`}>{round.description}</span>}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}
      </div>
    </SideDrawer>
  );
}
