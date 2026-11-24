import { useEffect, useState } from 'react';
import { BadgeCheck, LogIn } from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';
import { BODY, CARD, HEADING_FONT, INK, MUTED, PAGE, PRIMARY, SECONDARY } from '../profile/profileTheme';
import { closesText, companyOf, initialOf, kindText, lines, payText, placeText, tileColor } from '../jobs/jobsData';

// Signing in or registering is the next step for every action on this page.
const SIGN_UP = '/?auth_prompt=signup_required';
const goToSignUp = () => {
  window.location.href = SIGN_UP;
};

function Tile({ name, size }) {
  return (
    <span aria-hidden="true" style={{ width: size, height: size, background: tileColor(name), fontSize: Math.round(size * 0.4) }} className="flex shrink-0 items-center justify-center rounded-[14px] font-bold text-white">
      {initialOf(name)}
    </span>
  );
}

const Heading = ({ children }) => (
  <h2 className="m-0 text-[17px]">
    <span className={`${HEADING_FONT} font-bold ${INK}`}>{children}</span>
  </h2>
);

const Section = ({ title, children }) => (
  <section className={`${CARD} flex flex-col gap-3 p-5 sm:p-6`}>
    <Heading>{title}</Heading>
    {children}
  </section>
);

function JobView({ job }) {
  const company = companyOf(job);
  const pay = payText(job);
  const chips = [kindText(job), job.workMode].filter(Boolean);
  const facts = [
    ['Openings', job.openings],
    ['Experience', job.desiredExperience],
    ['Education', job.preferredEducation],
    ['Duration', job.opportunityType === 'INTERNSHIP' ? job.duration : ''],
    ['Joining', job.joiningMonth],
    ['Applications close', closesText(job)]
  ].filter(([, value]) => value);
  const tasks = lines(job.roleResponsibilities);
  const rounds = Array.isArray(job.selectionProcess) ? job.selectionProcess : [];
  const skills = Array.isArray(job.requirements) ? job.requirements.filter((req) => req?.skillName) : [];

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-5">
      <article aria-label="Job" className={`${CARD} flex flex-col gap-5 p-5 sm:p-6`}>
        <div className="flex flex-wrap items-start gap-4">
          <Tile name={company || job.title} size={64} />
          <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-1">
            <h1 className="m-0 text-[26px] leading-tight">
              <span className={`${HEADING_FONT} break-words font-bold ${INK}`}>{job.title}</span>
            </h1>
            <span className={`text-[15px] ${BODY}`}>
              {company && <span className="font-semibold">{company}</span>}
              {job.company?.verified && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 align-middle font-semibold text-[#0167F6]">
                  <BadgeCheck aria-hidden="true" className="size-4" /> Verified
                </span>
              )}
              {placeText(job) && ` · ${placeText(job)}`}
            </span>
            {chips.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {chips.map((chip) => (
                  <span key={chip} className="rounded-full bg-[#F1F3FA] px-2.5 py-1 text-[13px] font-semibold text-[#1B2B55]">
                    {chip}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {pay && (
              <div className="rounded-[12px] bg-[#E3F5EE] px-4 py-2.5 sm:text-right">
                <span className="block text-[12.5px] font-semibold text-[#0B5E41]">{job.opportunityType === 'INTERNSHIP' ? 'Stipend' : 'Pay'}</span>
                <span className={`${HEADING_FONT} block text-[20px] font-bold text-[#0B5E41]`}>{pay}</span>
              </div>
            )}
            <button type="button" onClick={goToSignUp} className={`${PRIMARY} h-11 px-6`}>
              Apply now
            </button>
          </div>
        </div>

        {facts.length > 0 && (
          <dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2 border-t border-[#EEF0F6] pt-5">
            {facts.map(([label, value]) => (
              <div key={label} className="rounded-[12px] bg-[#F4F6FE] px-3 py-2.5">
                <dt className={`text-[12.5px] ${MUTED}`}>{label}</dt>
                <dd className={`m-0 break-words font-semibold ${INK}`}>{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </article>

      <div className="flex flex-wrap items-start gap-5">
        <div className="flex min-w-0 flex-[2_1_440px] flex-col gap-5">
          {job.description && (
            <Section title="About the job">
              <p className={`m-0 whitespace-pre-line break-words ${BODY}`}>{job.description}</p>
            </Section>
          )}
          {tasks.length > 0 && (
            <Section title="What you’ll do">
              <ul className={`m-0 flex list-disc flex-col gap-1 pl-5 ${BODY}`}>
                {tasks.map((task, index) => (
                  <li key={index} className="break-words">
                    {task}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {rounds.length > 0 && (
            <Section title="How they hire">
              <ol className="m-0 flex list-none flex-col gap-2 p-0">
                {rounds.map((round, index) => (
                  <li key={index} className="flex gap-3 rounded-[12px] border border-[#E1E5F2] p-3">
                    <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#E8EEFF] text-[13px] font-bold text-[#0B3FA8]">
                      {index + 1}
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className={`break-words font-semibold ${INK}`}>{round.name}</span>
                      {round.description && <span className={`break-words text-[14px] ${MUTED}`}>{round.description}</span>}
                    </span>
                  </li>
                ))}
              </ol>
            </Section>
          )}
        </div>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5 lg:sticky lg:top-24">
          <Section title="Skills needed">
            {skills.length === 0 ? (
              <p className={`m-0 ${BODY}`}>This job lists no skills.</p>
            ) : (
              <>
                <p className={`m-0 text-[14px] ${MUTED}`}>The minimum score out of 10 the company asks for in each skill.</p>
                <ul className="m-0 flex list-none flex-col p-0">
                  {skills.map((req) => (
                    <li key={req.skillName} className="flex items-center justify-between gap-3 border-t border-[#EEF0F6] py-2.5 first:border-t-0">
                      <span className={`break-words font-semibold ${INK}`}>{req.skillName}</span>
                      <span className="shrink-0 rounded-full bg-[#E8EEFF] px-2.5 py-0.5 text-[13px] font-bold tabular-nums text-[#0B3FA8]">Min. {Number(req.minRating) || 1}/10</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button type="button" onClick={goToSignUp} className={`${PRIMARY} h-11 w-full px-5`}>
              Apply for this job
            </button>
            <span className={`text-center text-[13px] ${MUTED}`}>Sign in or create a free account to apply.</span>
          </Section>
        </div>
      </div>
    </div>
  );
}

/** The job page anyone can open from a shared link (/job_brief?id=…), no account needed. */
export default function PublicJobBriefPage() {
  const [jobId] = useState(() => new URLSearchParams(window.location.search).get('id'));
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(Boolean(jobId));
  const [error, setError] = useState(jobId ? null : 'This link has no job in it.');

  // Same fonts as the signed-in candidate app (styles/index.css body.candidate-app).
  useEffect(() => {
    document.body.classList.add('candidate-app');
    return () => document.body.classList.remove('candidate-app');
  }, []);

  useEffect(() => {
    if (!jobId) return;
    (async () => {
      try {
        const res = await apiFetch(`/student/jobs/${jobId}/public`);
        if (res.ok) setJob(await res.json());
        else setError(res.status === 404 ? 'This job has closed or is no longer available.' : 'We couldn’t load this job. Please try again.');
      } catch (err) {
        console.error('[job brief] Could not load the shared job:', err);
        setError('We couldn’t reach AlignGrad. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  return (
    <div className="flex min-h-screen flex-col bg-[#F4F6FE]">
      <header className="sticky top-0 z-40 border-b border-[#E1E5F2] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between gap-3 px-4 sm:px-6">
          <button type="button" onClick={goToSignUp} aria-label="AlignGrad home" className="rounded-[8px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]">
            <img src="/a_g_logo.webp" alt="AlignGrad" className="h-8 w-auto" />
          </button>
          <button type="button" onClick={goToSignUp} className={`${SECONDARY} h-10 px-4`}>
            <LogIn aria-hidden="true" className="size-4" /> Sign in / Register
          </button>
        </div>
      </header>

      <main className={`${PAGE} flex-1`}>
        {loading ? (
          <p role="status" className={`mx-auto max-w-[1100px] ${MUTED}`}>
            Loading the job…
          </p>
        ) : error ? (
          <div role="alert" className={`${CARD} mx-auto flex max-w-[560px] flex-col items-center gap-3 p-8 text-center`}>
            <h1 className="m-0 text-[20px]">
              <span className={`${HEADING_FONT} font-bold ${INK}`}>Job not available</span>
            </h1>
            <p className={`m-0 ${BODY}`}>{error}</p>
            <button type="button" onClick={goToSignUp} className={`${PRIMARY} h-11 px-5`}>
              Go to AlignGrad
            </button>
          </div>
        ) : (
          <JobView job={job} />
        )}
      </main>
    </div>
  );
}
