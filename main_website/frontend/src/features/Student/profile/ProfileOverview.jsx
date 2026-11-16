import { useEffect, useRef, useState } from 'react';
import { Award, BadgeCheck, Briefcase, CheckCircle2, Code2, Download, ExternalLink, FileText, FolderGit2, GraduationCap, Lock, Pencil, Play, Plus, Sparkles, Star, Trophy, Video } from 'lucide-react';
import { cityName, eduLevelLabel, experienceTypeLabel, fullDate, initialOf, lines, monthRange, monthYear, parseHighSchool, skillHasTest, workModeLabel, workTypeLabel, yearRange } from './profileRules';
import { PLATFORM_UNLOCK_PERCENT } from '../../../utils/profileCompleteness';
import { BODY, CARD, GRADIENT, GRADIENT_X, HEADING_FONT, INK, MUTED, PAGE, PRIMARY, SECONDARY, SMALL, SOFT, TONES } from './profileTheme';
import SectionBar from './SectionBar';
import { Spinner } from './ui';

// What each missing item from getProfileCompletionDetails asks the candidate to do.
const TODO = {
  'Full Name': ['Add your name', 'edit'],
  Username: ['Choose a username', 'edit'],
  'Describe Yourself': ['Write a short intro', 'edit'],
  Email: ['Add your email', 'edit'],
  'Phone Number': ['Add your phone number', 'edit'],
  'Date of Birth': ['Add your date of birth', 'edit'],
  Gender: ['Add your gender', 'edit'],
  Skills: ['Add your skills', 'skills'],
  Education: ['Add your education', 'education'],
  Projects: ['Add a project', 'project'],
  'Profile Photo': ['Add a profile photo', 'edit'],
  'Work Preferences': ['Say what work you want', 'edit'],
  'LinkedIn Link': ['Add your LinkedIn link', 'edit'],
  'Portfolio Link': ['Add a portfolio or website', 'edit'],
  Experience: ['Add experience', 'experience'],
  Certifications: ['Add a certificate', 'certificate'],
  'Resume URL': ['Add your own resume link', 'resume'],
  'Introduction Video': ['Add an intro video', 'video']
};
const TODO_ORDER = Object.keys(TODO);

const safeHref = (url) => (/^https?:\/\//i.test(String(url || '').trim()) ? String(url).trim() : null);

function SectionCard({ title, subtitle, icon: Icon, tone, action, children }) {
  const colors = TONES[tone];
  return (
    <section className={`${CARD} flex flex-col overflow-hidden`}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-[12px] ${colors.icon}`}>
            <Icon className="size-5" />
          </span>
          <div className="flex min-w-0 flex-col">
            <h2 className="m-0 text-[17px] leading-snug">
              <span className={`${HEADING_FONT} font-bold ${INK}`}>{title}</span>
            </h2>
            {subtitle && <span className={`text-[14px] ${MUTED}`}>{subtitle}</span>}
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

const AddButton = ({ onClick, label }) => (
  <button type="button" onClick={onClick} className={`${PRIMARY} ${SMALL} shrink-0`}>
    <Plus aria-hidden="true" className="size-4" /> {label}
  </button>
);

function Empty({ text, onAdd, label }) {
  return (
    <div className="flex flex-col items-start gap-3 border-t border-[#EEF0F6] px-5 py-5 sm:px-6">
      <p className={`m-0 ${BODY}`}>{text}</p>
      <button type="button" onClick={onAdd} className={`${SECONDARY} ${SMALL}`}>
        <Plus aria-hidden="true" className="size-4" /> {label}
      </button>
    </div>
  );
}

function Item({ title, meta, onEdit, editLabel, badge, children }) {
  return (
    <div className="flex items-start gap-3.5 border-t border-[#EEF0F6] px-5 py-4 sm:px-6">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={`break-words text-[15.5px] font-semibold ${INK}`}>
          {title}
          {badge}
        </span>
        {meta && <span className={`break-words ${MUTED}`}>{meta}</span>}
        {children}
      </div>
      {onEdit && (
        <button type="button" onClick={onEdit} aria-label={editLabel} className={`${SECONDARY} ${SMALL} shrink-0`}>
          <Pencil aria-hidden="true" className="size-3.5" /> Edit
        </button>
      )}
    </div>
  );
}

const ActionLink = ({ href, icon: Icon, children, download }) => (
  <a href={href} {...(download ? { download } : { target: '_blank', rel: 'noopener noreferrer' })} className={`${SOFT} h-8 px-2.5 text-[13.5px]!`}>
    <Icon aria-hidden="true" className="size-4" /> {children}
  </a>
);

function Bullets({ text }) {
  const list = lines(text);
  if (list.length === 0) return null;
  if (list.length === 1) return <span className={`whitespace-pre-line break-words ${BODY}`}>{list[0]}</span>;
  return (
    <ul className={`m-0 flex list-disc flex-col gap-0.5 pl-5 ${BODY}`}>
      {list.map((line, index) => (
        <li key={index} className="break-words">
          {line}
        </li>
      ))}
    </ul>
  );
}

function scoreText(edu) {
  const value = String(edu.gradeValue || '').trim();
  if (!value) return '';
  if (edu.gradeType === 'Percentage') return `${value}%`;
  if (edu.gradeType === 'Grade') return `Grade ${value}`;
  return `${edu.gradeType || 'Score'} ${value}`;
}

function educationView(edu) {
  if (edu.eduType === 'High School') {
    const school = parseHighSchool(edu);
    return {
      title: ['Class 10 & 12', edu.institute].filter(Boolean).join(' · '),
      meta: [school.class10 && `Class 10: ${school.class10}%`, school.class12 && `Class 12: ${school.class12}%`, school.stream].filter(Boolean).join(' · ')
    };
  }
  const course = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(', ') || eduLevelLabel(edu.eduType);
  return { title: [course, edu.institute].filter(Boolean).join(' · '), meta: [yearRange(edu.startDate, edu.endDate), scoreText(edu)].filter(Boolean).join(' · ') };
}

const attachmentName = (cert) => {
  const type = /^data:([^;]+);/.exec(cert.attachment || '')?.[1] || '';
  const extension = type.includes('pdf') ? 'pdf' : type.includes('png') ? 'png' : 'jpg';
  return `${(cert.title || 'certificate').replace(/[^\w-]+/g, '_').slice(0, 40)}.${extension}`;
};

// Order of the sections on the page (and in the section bar).
const ORDER = ['about', 'skills', 'projects', 'education', 'experience', 'certificates', 'activities', 'resume', 'video'];

/**
 * The candidate's profile (design: Web — profile) as one scrolling page. The
 * sticky section bar follows the scroll position; clicking a name scrolls there.
 * Read-only; edits open the About-you page or a dialog. `scrollTarget`
 * ({ id }) scrolls to a section when it changes (e.g. back from the edit page).
 */
export default function ProfileOverview({ data, sectionItems, scrollTarget, completion, generalDone, videoDone, unlocked, isPremium, techSkills, generatingPdf, onAction, onEditItem, onPlayVideo, onDownloadResume }) {
  const [showAllTodo, setShowAllTodo] = useState(false);
  const [active, setActive] = useState('about');
  const barRef = useRef(null);
  const sectionRefs = useRef({});
  // After a click, keep that name highlighted until the smooth scroll has finished
  // and the candidate scrolls again (the last sections can't reach the top).
  const lockRef = useRef({ id: null, settled: true, timer: null });

  useEffect(() => {
    let frame = 0;
    const lock = lockRef.current;
    const compute = () => {
      frame = 0;
      const bar = barRef.current;
      if (!bar) return;
      // A section is current once its top passes a line just under the bar. Over
      // the last screen of scrolling that line slides down to the bottom of the
      // window, so short sections near the end (which can never reach the bar)
      // still each get their turn instead of being skipped.
      const page = document.scrollingElement || document.documentElement;
      const baseLine = bar.getBoundingClientRect().bottom + 24;
      const sweep = Math.max(0, window.innerHeight - baseLine - 40);
      const maxScroll = Math.max(0, page.scrollHeight - window.innerHeight);
      const span = Math.min(sweep, maxScroll);
      const progress = span > 0 ? Math.min(1, Math.max(0, (page.scrollTop - (maxScroll - span)) / span)) : 0;
      const line = baseLine + progress * sweep;
      let current = ORDER[0];
      ORDER.forEach((id) => {
        const element = sectionRefs.current[id];
        if (element && element.getBoundingClientRect().top <= line) current = id;
      });
      setActive(current);
    };
    const onScroll = () => {
      if (lock.id) {
        if (!lock.settled) {
          clearTimeout(lock.timer);
          lock.timer = setTimeout(() => {
            lock.settled = true;
          }, 150);
          return;
        }
        lock.id = null;
      }
      if (!frame) frame = requestAnimationFrame(compute);
    };
    frame = requestAnimationFrame(compute);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(lock.timer);
      window.removeEventListener('scroll', onScroll, { capture: true });
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const goTo = (id, smooth = true) => {
    const element = sectionRefs.current[id];
    if (!element) return;
    const lock = lockRef.current;
    clearTimeout(lock.timer);
    lock.id = id;
    lock.settled = false;
    lock.timer = setTimeout(() => {
      lock.settled = true;
    }, 150);
    setActive(id);
    // The first section starts the page, so go right to the top (header and set-up card).
    if (id === ORDER[0]) (document.scrollingElement || document.documentElement).scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    else element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  };

  useEffect(() => {
    if (!scrollTarget?.id) return undefined;
    const frame = requestAnimationFrame(() => goTo(scrollTarget.id, scrollTarget.smooth !== false));
    return () => cancelAnimationFrame(frame);
  }, [scrollTarget]);
  const education = data.education || [];
  const projects = data.projects || [];
  const experience = data.experience || [];
  const certificates = data.certificates || [];
  const activities = data.cocurricular || [];
  const skills = data.skills || [];
  const links = data.socialLinks || {};

  const topEducation = education.find((edu) => edu.eduType && edu.eduType !== 'High School') || education[0];
  const educationLine = topEducation ? [topEducation.eduType === 'High School' ? 'Class 12' : [topEducation.degree, topEducation.fieldOfStudy].filter(Boolean).join(' '), topEducation.institute, yearRange(null, topEducation.endDate)].filter(Boolean).join(' · ') : '';

  const gigs = experience.filter((exp) => exp.expType === 'Gig');
  const ratings = gigs.map((exp) => Number(/Rating:\s*(\d+)\/5/.exec(exp.description || '')?.[1])).filter((value) => value > 0);
  const averageRating = ratings.length ? (ratings.reduce((sum, value) => sum + value, 0) / ratings.length).toFixed(1) : null;

  const todo = [...completion.missingItems].filter((item) => TODO[item]).sort((a, b) => TODO_ORDER.indexOf(a) - TODO_ORDER.indexOf(b));
  const visibleTodo = showAllTodo ? todo : todo.slice(0, 4);

  const details = [
    ['Username', data.username ? `@${data.username}` : ''],
    ['Email', data.email],
    ['Phone', data.phone],
    ['Date of birth', fullDate(data.dob)],
    ['Gender', data.gender],
    ['Open to', (data.preferredWorkTypes || []).map(workTypeLabel).join(', ')],
    ['Work mode', (data.preferredWorkModes || []).map(workModeLabel).join(', ')],
    ['Cities', [...(data.preferredLocations || []).map(cityName), data.openToAnyLocation ? 'Open to moving anywhere in India' : ''].filter(Boolean).join(', ')]
  ];
  const linkList = [
    ['LinkedIn', links.linkedin],
    ['GitHub', links.github],
    ['Portfolio', links.portfolio]
  ];

  const sections = {
    about: (
      <section className={`${CARD} relative flex flex-col gap-4 overflow-hidden p-5 sm:p-6`}>
        <div className={`absolute inset-x-0 top-0 h-1 ${GRADIENT_X}`} aria-hidden="true" />
        <div className="flex flex-wrap items-center gap-[18px]">
          <span aria-hidden="true" className={`flex size-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full text-[28px] font-bold text-white ring-4 ring-[#E8EEFF] ${data.profilePic ? 'bg-[#E8EEFF]' : GRADIENT}`}>
            {data.profilePic ? <img src={data.profilePic} alt="" className="size-full object-cover" /> : initialOf(data.name)}
          </span>
          <div className="flex min-w-0 flex-[1_1_260px] flex-col">
            <span className={`${HEADING_FONT} break-words text-[22px] font-bold ${INK}`}>{data.name || 'Add your name'}</span>
            {educationLine && <span className={`text-[15px] ${BODY}`}>{educationLine}</span>}
          </div>
          <button type="button" onClick={() => onAction('edit')} className={`${PRIMARY} h-10 px-4`}>
            <Pencil aria-hidden="true" className="size-4" /> Edit
          </button>
        </div>
        {data.bio ? <p className={`m-0 whitespace-pre-line break-words text-[15px] ${BODY}`}>{data.bio}</p> : <p className={`m-0 ${MUTED}`}>Add a short intro so recruiters know what you’re good at and the job you want.</p>}
        <dl className="m-0 grid gap-x-6 gap-y-3 border-t border-[#EEF0F6] pt-4 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="flex min-w-0 flex-col">
              <dt className={`text-[13px] font-semibold uppercase tracking-[0.04em] ${MUTED}`}>{label}</dt>
              <dd className={`m-0 break-words ${value ? INK : MUTED}`}>{value || 'Not added'}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2 border-t border-[#EEF0F6] pt-4">
          {linkList.map(([label, url]) =>
            safeHref(url) ? (
              <ActionLink key={label} href={safeHref(url)} icon={ExternalLink}>
                {label}
              </ActionLink>
            ) : (
              <button key={label} type="button" onClick={() => onAction('edit')} className={`${SECONDARY} h-8 px-2.5 text-[13.5px]!`}>
                <Plus aria-hidden="true" className="size-3.5" /> {label} link
              </button>
            )
          )}
        </div>
      </section>
    ),

    video: videoDone ? (
      <SectionCard title="Intro video" subtitle="Recruiters watch it when they open your application." icon={Video} tone="peri" action={<button type="button" onClick={() => onAction('video')} className={`${SECONDARY} ${SMALL}`}>Change video</button>}>
        <div className="border-t border-[#EEF0F6] p-5 sm:p-6">
          <video src={data.introVideoUrl} controls playsInline preload="metadata" className="aspect-video w-full max-w-[720px] rounded-[14px] bg-[#0E1B3D] object-contain" aria-label="Your intro video" />
        </div>
      </SectionCard>
    ) : (
      <section className="flex flex-wrap items-center gap-4 rounded-[16px] border border-dashed border-[#E0782F] bg-[linear-gradient(120deg,#FFF6EE_0%,#FFFFFF_60%)] p-5 sm:px-6">
        <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-[12px] bg-[#FFE7D4] text-[#C2410C]">
          <Video className="size-6" />
        </span>
        <div className="flex min-w-[200px] flex-1 flex-col">
          <h2 className="m-0 text-[16px]">
            <span className={`font-bold ${INK}`}>Intro video · not added</span>
          </h2>
          <span className={BODY}>40 to 60 seconds about you. You need it to apply to jobs and gigs; recruiters watch it when they open your application.</span>
        </div>
        <button type="button" onClick={() => onAction('video')} className={`${PRIMARY} h-10 px-4`}>
          Add video
        </button>
      </section>
    ),

    education: (
      <SectionCard title="Education" icon={GraduationCap} tone="blue" action={<AddButton onClick={() => onAction('education')} label="Add education" />}>
        {education.length === 0 ? (
          <Empty text="Add your degree, diploma, or Class 10 & 12." onAdd={() => onAction('education')} label="Add education" />
        ) : (
          education.map((edu, index) => {
            const view = educationView(edu);
            return <Item key={index} title={view.title} meta={view.meta} onEdit={() => onEditItem('education', index)} editLabel={`Edit ${view.title}`} />;
          })
        )}
      </SectionCard>
    ),

    projects: (
      <SectionCard title="Projects" icon={FolderGit2} tone="violet" action={<AddButton onClick={() => onAction('project')} label="Add a project" />}>
        {projects.length === 0 ? (
          <Empty text="Add college, personal or internship work you’re proud of." onAdd={() => onAction('project')} label="Add a project" />
        ) : (
          projects.map((project, index) => (
            <Item key={index} title={project.title} meta={[project.role, monthRange(project.startDate, project.endDate, project.currentlyWorking)].filter(Boolean).join(' · ')} onEdit={() => onEditItem('project', index)} editLabel={`Edit ${project.title}`}>
              <Bullets text={project.description} />
              {project.skills?.length > 0 && (
                <span className="mt-0.5 flex flex-wrap gap-1.5">
                  {project.skills.map((skill) => (
                    <span key={skill} className={`rounded-[6px] px-2 py-0.5 text-[12.5px] font-semibold ${TONES.violet.chip}`}>
                      {skill}
                    </span>
                  ))}
                </span>
              )}
              {(safeHref(project.codeUrl) || safeHref(project.hostedUrl) || safeHref(project.videoUrl)) && (
                <span className="mt-1.5 flex flex-wrap gap-2">
                  {safeHref(project.codeUrl) && (
                    <ActionLink href={safeHref(project.codeUrl)} icon={Code2}>
                      Code
                    </ActionLink>
                  )}
                  {safeHref(project.hostedUrl) && (
                    <ActionLink href={safeHref(project.hostedUrl)} icon={ExternalLink}>
                      Live
                    </ActionLink>
                  )}
                  {safeHref(project.videoUrl) && (
                    <button type="button" onClick={() => onPlayVideo(project.videoUrl, `${project.title}: walkthrough`)} className={`${SOFT} h-8 px-2.5 text-[13.5px]!`}>
                      <Play aria-hidden="true" className="size-4" /> Watch demo
                    </button>
                  )}
                </span>
              )}
            </Item>
          ))
        )}
      </SectionCard>
    ),

    experience: (
      <SectionCard
        title="Experience"
        subtitle={gigs.length > 0 ? `${gigs.length} verified gig${gigs.length === 1 ? '' : 's'}${averageRating ? ` · ${averageRating}/5 average rating` : ''}` : 'Optional for freshers'}
        icon={Briefcase}
        tone="plum"
        action={<AddButton onClick={() => onAction('experience')} label="Add experience" />}
      >
        {experience.length === 0 ? (
          <Empty text="Add internships, part-time work or freelancing if you have any." onAdd={() => onAction('experience')} label="Add experience" />
        ) : (
          experience.map((exp, index) => {
            const gig = exp.expType === 'Gig';
            const title = [exp.designation, exp.companyName].filter(Boolean).join(' · ');
            return (
              <Item
                key={index}
                title={title}
                meta={[experienceTypeLabel(exp.expType), monthRange(exp.startDate, exp.endDate, exp.currentlyWorking), exp.location, exp.domain].filter(Boolean).join(' · ')}
                onEdit={gig ? null : () => onEditItem('experience', index)}
                editLabel={`Edit ${title}`}
                badge={
                  gig && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#E3F5EE] px-2 py-0.5 align-middle text-[12px] font-bold text-[#0B5E41]">
                      <Star aria-hidden="true" className="size-3 fill-current" /> Verified gig
                    </span>
                  )
                }
              >
                <Bullets text={exp.description} />
              </Item>
            );
          })
        )}
      </SectionCard>
    ),

    certificates: (
      <SectionCard title="Certificates" icon={Award} tone="green" action={<AddButton onClick={() => onAction('certificate')} label="Add a certificate" />}>
        {certificates.length === 0 ? (
          <Empty text="Add courses and credentials you’ve completed." onAdd={() => onAction('certificate')} label="Add a certificate" />
        ) : (
          certificates.map((cert, index) => (
            <Item key={index} title={cert.title} meta={[cert.org, monthYear(cert.startDate), cert.certNumber && `ID ${cert.certNumber}`].filter(Boolean).join(' · ')} onEdit={() => onEditItem('certificate', index)} editLabel={`Edit ${cert.title}`}>
              {cert.description && <span className={`break-words ${BODY}`}>{cert.description}</span>}
              {(safeHref(cert.link) || cert.attachment) && (
                <span className="mt-1.5 flex flex-wrap gap-2">
                  {safeHref(cert.link) && (
                    <ActionLink href={safeHref(cert.link)} icon={ExternalLink}>
                      View certificate
                    </ActionLink>
                  )}
                  {/^data:(application\/pdf|image\/(png|jpeg|jpg|webp));base64,/.test(cert.attachment || '') && (
                    <ActionLink href={cert.attachment} icon={FileText} download={attachmentName(cert)}>
                      Download file
                    </ActionLink>
                  )}
                </span>
              )}
            </Item>
          ))
        )}
      </SectionCard>
    ),

    activities: (
      <SectionCard title="Activities" icon={Trophy} tone="amber" action={<AddButton onClick={() => onAction('activity')} label="Add an activity" />}>
        {activities.length === 0 ? (
          <Empty text="Add clubs, sports, volunteering, events or leadership." onAdd={() => onAction('activity')} label="Add an activity" />
        ) : (
          activities.map((act, index) => (
            <Item key={index} title={act.activity || 'Activity'} meta={act.description} onEdit={() => onEditItem('activity', index)} editLabel={`Edit ${act.activity || 'activity'}`}>
              {safeHref(act.link) && (
                <span className="mt-1.5 flex">
                  <ActionLink href={safeHref(act.link)} icon={ExternalLink}>
                    Open link
                  </ActionLink>
                </span>
              )}
            </Item>
          ))
        )}
      </SectionCard>
    ),

    skills: (
      <SectionCard title="Skills" subtitle="Tested skills go up only when you pass the test" icon={BadgeCheck} tone="blue" action={<button type="button" onClick={() => onAction('skills')} className={`${PRIMARY} ${SMALL}`}>Manage skills</button>}>
        {skills.length === 0 ? (
          <Empty text="No skills yet. Add them so jobs and gigs can match you." onAdd={() => onAction('skills')} label="Add skills" />
        ) : (
          <ul className="m-0 flex list-none flex-wrap gap-2 border-t border-[#EEF0F6] px-5 py-5 sm:px-6">
            {skills.map((skill) => {
              const verified = skill.verifiedRating !== null && skill.verifiedRating !== undefined;
              const tested = skillHasTest(skill.name, techSkills);
              return (
                <li key={skill.name} className={`rounded-[8px] px-2.5 py-1 text-[14px] font-semibold ${verified ? 'bg-[#E8EEFF] text-[#0B3FA8]' : 'border border-dashed border-[#9AA6C8] bg-white text-[#1B2B55]'}`}>
                  {skill.name} {skill.rating || 1}/10
                  {verified ? <BadgeCheck aria-label="verified" className="ml-1 inline size-4 align-[-3px]" /> : <span className="font-medium text-[#475373]"> · {tested ? 'not tested' : 'self-rated'}</span>}
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>
    ),

    resume: (
      <SectionCard title="Resume" subtitle="Sent with your applications" icon={FileText} tone="green">
        <div className="flex flex-col divide-y divide-[#EEF0F6] border-t border-[#EEF0F6]">
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
            <span aria-hidden="true" className="flex h-11 w-9 shrink-0 items-center justify-center rounded-[6px] border border-[#E1E5F2] bg-[#F4F6FE] text-[10px] font-bold text-[#0B3FA8]">
              PDF
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={`font-semibold ${INK}`}>AlignGrad resume</span>
              <span className={`text-[14px] ${MUTED}`}>Built from this profile</span>
            </span>
            <button type="button" onClick={onDownloadResume} disabled={generatingPdf} className={`${SECONDARY} ${SMALL}`}>
              {generatingPdf ? <Spinner /> : <Download aria-hidden="true" className="size-4" />}
              {generatingPdf ? 'Preparing…' : 'Download PDF'}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-3 px-5 py-4 sm:px-6">
            <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#E3F5EE] text-[#0F7A55]">
              <FileText className="size-5" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className={`font-semibold ${INK}`}>Your own resume</span>
              <span className={`text-[14px] ${MUTED}`}>{safeHref(data.resumeUrl) ? 'Google Drive link' : 'Add a Google Drive link to your resume'}</span>
            </span>
            {safeHref(data.resumeUrl) && <ActionLink href={safeHref(data.resumeUrl)} icon={ExternalLink}>Open</ActionLink>}
            <button type="button" onClick={() => onAction('resume')} className={`${SECONDARY} ${SMALL}`}>
              {data.resumeUrl ? 'Change link' : 'Use my own'}
            </button>
          </div>
        </div>
      </SectionCard>
    )
  };

  return (
    <div className={PAGE}>
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-5">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[28px] leading-tight">
              <span className={`${HEADING_FONT} font-bold ${INK}`}>Profile</span>
            </h1>
            <p className={`m-0 text-[15.5px] ${MUTED}`}>Recruiters see this, with your skill scores, when you apply.</p>
          </div>
          <button type="button" onClick={onDownloadResume} disabled={generatingPdf} className={`${SECONDARY} h-11 px-4`}>
            {generatingPdf ? <Spinner /> : <Download aria-hidden="true" className="size-[18px]" />}
            {generatingPdf ? 'Preparing PDF…' : 'Download resume'}
          </button>
        </header>

        {!unlocked && (
          <section aria-labelledby="setup-title" className="relative overflow-hidden rounded-[18px] bg-white p-[1.5px] shadow-[0_14px_40px_-24px_rgba(99,120,249,0.7)]">
            <div className={`absolute inset-0 ${GRADIENT}`} aria-hidden="true" />
            <div className="relative flex flex-col gap-4 rounded-[16.5px] bg-white p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-[12px] text-white ${GRADIENT}`}>
                  <Lock className="size-5" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <h2 id="setup-title" className="m-0 text-[18px] leading-snug">
                    <span className={`${HEADING_FONT} font-bold ${INK}`}>Finish setting up your profile</span>
                  </h2>
                  <p className={`m-0 ${BODY}`}>Jobs, skill tests, courses and gigs unlock once both steps are done. The intro video can wait until you apply.</p>
                </div>
              </div>
              <ol className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2">
                {[
                  { done: generalDone, step: 1, title: 'About you', text: 'Name, username, intro, phone, email, date of birth, gender', action: 'edit', cta: 'Fill in' },
                  { done: completion.percentage >= PLATFORM_UNLOCK_PERCENT, step: 2, title: `Reach ${PLATFORM_UNLOCK_PERCENT}%`, text: `You’re at ${completion.percentage}%. Add skills, education, projects and more.`, action: 'skills', cta: 'Add skills' }
                ].map((item) => (
                  <li key={item.step} className={`flex items-center gap-3 rounded-[14px] border p-3.5 ${item.done ? 'border-[#BFE5D3] bg-[#F3FBF7]' : 'border-[#D9DEF5] bg-[#F7F8FF]'}`}>
                    <span aria-hidden="true" className={`flex size-9 shrink-0 items-center justify-center rounded-full text-[15px] font-bold ${item.done ? 'bg-[#0F7A55] text-white' : 'bg-white text-[#0167F6] ring-2 ring-[#0167F6]'}`}>
                      {item.done ? <CheckCircle2 className="size-5" /> : item.step}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={`font-semibold ${INK}`}>
                        {item.title}
                        <span className="sr-only">{item.done ? ' (done)' : ' (to do)'}</span>
                      </span>
                      <span className={`text-[13.5px] ${MUTED}`}>{item.done ? 'Done' : item.text}</span>
                    </span>
                    {!item.done && (
                      <button type="button" onClick={() => onAction(item.action)} className={`${PRIMARY} ${SMALL} shrink-0`}>
                        {item.cta}
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}

        <div ref={barRef} className="sticky top-16 z-20 -mx-4 bg-[#F4F6FE]/95 px-4 py-2 backdrop-blur-sm sm:-mx-6 sm:px-6 md:top-0 lg:-mx-10 lg:px-10">
          <SectionBar items={sectionItems} active={active} onSelect={(id) => goTo(id)} />
        </div>

        <div className="flex flex-wrap items-start gap-6">
          <div className="flex min-w-0 flex-[999_1_600px] flex-col gap-5">
            {ORDER.map((id) => (
              <div
                key={id}
                id={`profile-section-${id}`}
                ref={(node) => {
                  sectionRefs.current[id] = node;
                }}
                className="scroll-mt-[150px] md:scroll-mt-[96px]"
              >
                {sections[id]}
              </div>
            ))}
          </div>

          <aside className={`flex min-w-0 flex-[1_1_300px] flex-col gap-4 ${showAllTodo ? '' : 'xl:sticky xl:top-[92px]'}`} aria-label="Profile summary">
            <section aria-labelledby="strength-title" className={`${CARD} flex flex-col gap-3 p-5`}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 id="strength-title" className="m-0 text-[16px]">
                  <span className={`${HEADING_FONT} font-bold ${INK}`}>Profile {completion.percentage}% complete</span>
                </h2>
                {todo.length > 0 && <span className={`shrink-0 ${MUTED}`}>{todo.length} left</span>}
              </div>
              <div role="progressbar" aria-label="Profile complete" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.percentage} className="h-2.5 overflow-hidden rounded-full bg-[#E8EEFF]">
                <div className={`h-full rounded-full ${GRADIENT_X} transition-[width] duration-500`} style={{ width: `${completion.percentage}%` }} />
              </div>
              {todo.length === 0 ? (
                <p className="m-0 inline-flex items-center gap-1.5 font-semibold text-[#0F7A55]">
                  <CheckCircle2 aria-hidden="true" className="size-4" /> Everything’s filled in.
                </p>
              ) : (
                <>
                  <ul className="m-0 flex list-none flex-col gap-2 p-0">
                    {visibleTodo.map((item) => (
                      <li key={item} className="flex items-center justify-between gap-3 rounded-[10px] bg-[#F4F6FE] py-1.5 pl-3 pr-1.5">
                        <span className={INK}>{TODO[item][0]}</span>
                        <button type="button" onClick={() => onAction(TODO[item][1])} className={`${SECONDARY} h-8 shrink-0 px-3 text-[13.5px]!`}>
                          Add
                        </button>
                      </li>
                    ))}
                  </ul>
                  {todo.length > 4 && (
                    <button type="button" onClick={() => setShowAllTodo((value) => !value)} aria-expanded={showAllTodo} className={`${SECONDARY} ${SMALL} self-start`}>
                      {showAllTodo ? 'Show fewer' : `Show all ${todo.length}`}
                    </button>
                  )}
                </>
              )}
            </section>

            <section className={`${CARD} flex items-center justify-between gap-3 px-5 py-[18px]`}>
              <span className="flex items-center gap-3">
                <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-[12px] text-white ${GRADIENT}`}>
                  <Sparkles className="size-5" />
                </span>
                <span className="flex flex-col">
                  <span className={`font-bold ${INK}`}>Plan: {isPremium ? 'Student Pro' : 'Free'}</span>
                  <span className={MUTED}>{isPremium ? 'Every job and gig is open to you' : 'See what Student Pro adds'}</span>
                </span>
              </span>
              <button type="button" onClick={() => onAction('pro')} className={`${isPremium ? SECONDARY : PRIMARY} ${SMALL} shrink-0`}>
                {isPremium ? 'Details' : 'Upgrade'}
              </button>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
