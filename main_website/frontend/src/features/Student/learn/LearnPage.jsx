import { useEffect, useState } from 'react';
import { Play, Search } from 'lucide-react';
import { BODY, CARD, HEADING_FONT, INK, MUTED, PAGE, PRIMARY, SECONDARY, fieldClass } from '../profile/profileTheme';
import { ErrorBanner, Spinner } from '../profile/ui';
import { skillGaps } from '../tests/testsData';
import CoursePlayer from './CoursePlayer';
import { request, teaches } from './learnData';

// Thumbnail colours for courses without an uploaded image.
const COVERS = [
  'bg-[linear-gradient(135deg,#1E3A8A,#0167F6)]',
  'bg-[linear-gradient(135deg,#3B1F8F,#7B3FD0)]',
  'bg-[linear-gradient(135deg,#0E1B3D,#6378F9)]',
  'bg-[linear-gradient(135deg,#7A1F7D,#B42FB8)]'
];
const same = (a, b) => a.toLowerCase() === b.toLowerCase();
const chip = (on) =>
  `inline-flex h-10 shrink-0 items-center rounded-full border px-3.5 text-[14px] font-semibold ${on ? 'border-transparent bg-[linear-gradient(135deg,#0E1B3D_0%,#1E3A8A_60%,#5B3FD0_100%)] text-white' : 'border-[#C9D1E3] bg-white text-[#1B2B55] hover:border-[#6378F9]'}`;

/**
 * Candidate Learn page (design: candidate_course_design/Web — learn): the skills one
 * test away from a job (pills; the chosen one's courses come first), the video courses
 * the admin publishes, and the course player. `focus` ({ skill }) is a new object each
 * time another page opens Learn.
 */
export default function LearnPage({ profile, jobs = [], token, focus, onTakeTest }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [skill, setSkill] = useState(focus?.skill || '');
  const [handledFocus, setHandledFocus] = useState(focus);
  const [openId, setOpenId] = useState(null);

  if (focus !== handledFocus) {
    setHandledFocus(focus);
    setSkill(focus?.skill || '');
    setOpenId(null);
  }

  const load = async () => {
    setLoading(true);
    const { data, error: failed } = await request('/courses', { token }, 'The courses couldn’t be loaded. Try again.');
    setError(failed || '');
    if (data) setCourses(data.courses || []);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gaps = skillGaps(jobs, profile?.skills || []);
  const pills = skill && !gaps.some((gap) => same(gap.name, skill)) ? [{ name: skill }, ...gaps] : gaps;
  const active = pills.find((pill) => same(pill.name, skill)) || pills[0] || null;
  const categories = ['All', ...new Set(courses.map((course) => course.category).filter(Boolean))];
  const query = search.trim().toLowerCase();
  const shown = courses
    .filter((course) => category === 'All' || course.category === category)
    .filter((course) => !query || [course.title, course.description, course.category].join(' ').toLowerCase().includes(query))
    .map((course) => ({ ...course, picked: Boolean(active) && teaches(course, active.name) }))
    .sort((a, b) => b.picked - a.picked);
  const noneForSkill = active && courses.length > 0 && !courses.some((course) => teaches(course, active.name));

  const openCourse = (id) => {
    setOpenId(id);
    window.scrollTo({ top: 0 });
  };

  if (openId) return <CoursePlayer courseId={openId} token={token} onBack={() => openCourse(null)} />;

  return (
    <div className={PAGE}>
      <div className="mx-auto flex w-full max-w-[1240px] flex-col gap-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="m-0 text-[28px] leading-tight">
              <span className={`${HEADING_FONT} font-bold ${INK}`}>Learn</span>
            </h1>
            <p className={`m-0 text-[15.5px] ${MUTED}`}>
              {pills.length ? 'Courses picked for the skills you need to raise. Retake the test when you’re ready.' : 'Video courses on AlignGrad. Learn at your own pace.'}
            </p>
          </div>
          {pills.length > 0 && (
            <div role="group" aria-label="Skill" className="flex flex-wrap gap-2">
              {pills.map((pill) => (
                <button key={pill.name} type="button" aria-pressed={pill === active} onClick={() => setSkill(pill.name)} className={chip(pill === active)}>
                  {pill.name}
                  {pill.need > 0 && ` · ${pill.score || '—'} → ${pill.need}`}
                </button>
              ))}
            </div>
          )}
        </header>

        {active?.need > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-[#FED7AA] bg-[#FFF1E8] px-5 py-[18px]">
            <span className="flex min-w-0 flex-col">
              <span className="text-[16px] font-bold text-[#9A3412]">
                {active.name} {active.score || '—'} → {active.need}
              </span>
              <span className={BODY}>
                Reaching {active.need} opens {active.opens}
                {active.more > 0 && ` and ${active.more} more`}.
              </span>
            </span>
            <button type="button" onClick={() => onTakeTest?.({ skillName: active.name, need: active.need, opens: active.opens })} className="inline-flex h-10 items-center rounded-[10px] border border-[#FED7AA] bg-white px-4 font-semibold text-[#9A3412] hover:border-[#9A3412]">
              Ready? {active.score > 0 ? 'Retake' : 'Take'} the {active.name} test
            </button>
          </div>
        )}

        <section aria-labelledby="videos" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col">
              <h2 id="videos" className="m-0 text-[18px]">
                <span className={`${HEADING_FONT} font-bold ${INK}`}>Video lessons</span>
              </h2>
              <span className={MUTED}>On AlignGrad, at your own pace</span>
            </div>
            {courses.length > 0 && (
              <label className="relative w-full sm:w-72">
                <span className="sr-only">Search courses</span>
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#475373]" />
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search courses" className={fieldClass(false, 'h-10 pl-9')} />
              </label>
            )}
          </div>

          {categories.length > 2 && (
            <div role="group" aria-label="Category" className="flex gap-2 overflow-x-auto pb-1">
              {categories.map((item) => (
                <button key={item} type="button" aria-pressed={category === item} onClick={() => setCategory(item)} className={`${chip(category === item)} h-9!`}>
                  {item}
                </button>
              ))}
            </div>
          )}

          {noneForSkill && <p className={`m-0 ${BODY}`}>There’s no course for {active.name} yet.</p>}

          {loading ? (
            <div className={`flex items-center gap-2 ${MUTED}`}>
              <Spinner /> Loading courses…
            </div>
          ) : error ? (
            <div className="flex flex-col items-start gap-3">
              <ErrorBanner message={error} />
              <button type="button" onClick={load} className={`${SECONDARY} h-10 px-4`}>
                Try again
              </button>
            </div>
          ) : courses.length === 0 ? (
            <p className={`m-0 ${CARD} px-5 py-4 ${BODY}`}>No courses have been published yet.</p>
          ) : shown.length === 0 ? (
            <p className={`m-0 ${BODY}`}>No courses match your search.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
              {shown.map((course, i) => (
                <article key={course.id} className={`${CARD} flex flex-col overflow-hidden`}>
                  <div aria-hidden="true" className={`relative flex h-[140px] items-end justify-between p-3 ${course.thumbnailUrl ? 'bg-[#0E1B3D]' : COVERS[i % COVERS.length]}`}>
                    {course.thumbnailUrl && <img src={course.thumbnailUrl} alt="" className="absolute inset-0 size-full object-cover" />}
                    {course.picked && <span className="absolute left-3 top-3 rounded-[6px] bg-[#FFF1E8] px-2 py-[3px] text-[12.5px] font-bold text-[#9A3412]">For {active.name}</span>}
                    <span className="relative max-w-[70%] truncate rounded-[6px] bg-white px-2 py-[3px] text-[12.5px] font-bold text-[#1E3A8A]">{course.category}</span>
                    <span className="relative flex size-10 items-center justify-center rounded-full bg-white text-[#1E3A8A] shadow-[0_4px_12px_rgba(14,27,61,0.3)]">
                      <Play className="size-4 fill-current" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-4">
                    <h3 className={`m-0 text-[16.5px] font-bold ${INK}`}>{course.title}</h3>
                    <p className={`m-0 line-clamp-2 ${BODY}`}>{course.description}</p>
                    <span className={`text-[14px] ${MUTED}`}>
                      {course.lessonCount} lesson{course.lessonCount === 1 ? '' : 's'}
                    </span>
                    <button type="button" onClick={() => openCourse(course.id)} className={`${PRIMARY} mt-2 h-10 self-start px-4`}>
                      Start learning
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
