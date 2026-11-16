import { useMemo, useState } from 'react';
import { BookOpen, FileVideo, Layers, Pencil, Plus, RefreshCw, Trash2, FilePen } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import useNotice from '../../hooks/useNotice.js';
import useResource from '../../hooks/useResource.js';
import Button from '../../components/ui/Button.jsx';
import DataTable from '../../components/ui/DataTable.jsx';
import KpiCard from '../../components/ui/KpiCard.jsx';
import Notice, { LoadError } from '../../components/ui/Notice.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Pager from '../../components/ui/Pager.jsx';
import { Panel } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import SearchInput from '../../components/ui/SearchInput.jsx';
import { Loading } from '../../components/ui/States.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import { countBy, paginate } from '../../utils/collections.js';
import { formatDate, plural, safeUrl } from '../../utils/format.js';
import CourseCurriculum from './CourseCurriculum.jsx';
import CourseFormModal from './CourseFormModal.jsx';
import { COURSE_TABS, filterCourses, isPublished, lectureCount, unwrap } from './courseModel.js';

const PAGE_SIZE = 8;
const TAB_TESTS = Object.fromEntries(COURSE_TABS.map((tab) => [tab.key, tab.test]));

function Thumbnail({ course }) {
  const url = safeUrl(course.thumbnailUrl);
  return (
    <span className="grid h-10 w-16 shrink-0 place-items-center overflow-hidden rounded-md border border-line bg-subtle">
      {url ? <img src={url} alt="" className="size-full object-cover" /> : <BookOpen className="size-4 text-faint" aria-hidden="true" />}
    </span>
  );
}

export default function CoursesPage() {
  const courses = useResource(adminApi.getCourses, (json) => json.courses || []);
  const { notice, show, clear } = useNotice();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [openCourse, setOpenCourse] = useState(null); // the course whose curriculum is showing
  const [opening, setOpening] = useState(false);
  const [courseModal, setCourseModal] = useState(null); // { course: Course | null }

  const list = useMemo(() => courses.data || [], [courses.data]);
  const counts = useMemo(() => countBy(list, TAB_TESTS), [list]);
  const filtered = useMemo(() => filterCourses(list, { tab, query }), [list, tab, query]);
  const info = paginate(filtered, page, PAGE_SIZE);

  const openCurriculum = async (course) => {
    setOpening(true);
    try {
      setOpenCourse(unwrap(await adminApi.getCourse(course.id), 'Couldn’t open the course.').course);
      clear();
    } catch (err) {
      show('error', `Couldn’t open the course. ${err.message}`);
    } finally {
      setOpening(false);
    }
  };

  const deleteCourse = async (course) => {
    if (!window.confirm('Permanently delete this course and all its lectures?')) return;
    try {
      unwrap(await adminApi.deleteCourse(course.id), 'Something went wrong. Please try again.');
      show('success', 'Course deleted.');
      courses.reload();
    } catch (err) {
      show('error', err.message || 'Failed to delete the course.');
    }
  };

  const courseSaved = (saved, mode) => {
    setCourseModal(null);
    show('success', mode === 'created' ? 'Course created.' : 'Course updated.');
    courses.reload();
    if (openCourse && openCourse.id === saved.id) setOpenCourse((current) => ({ ...current, ...saved, modules: current.modules }));
  };

  const modal = courseModal && <CourseFormModal course={courseModal.course} onClose={() => setCourseModal(null)} onSaved={courseSaved} />;
  const banner = notice && (
    <Notice tone={notice.tone === 'error' ? 'error' : 'success'} className="mb-4">
      {notice.message}
    </Notice>
  );

  if (openCourse) {
    return (
      <>
        {banner}
        <CourseCurriculum
          course={openCourse}
          notify={show}
          onBack={() => {
            setOpenCourse(null);
            courses.reload();
          }}
          onEditCourse={(course) => setCourseModal({ course })}
          onModules={(modules) => setOpenCourse((current) => ({ ...current, modules }))}
        />
        {modal}
      </>
    );
  }

  const columns = [
    {
      header: 'Course',
      headerClassName: 'font-bold',
      render: (course) => (
        <div className="flex items-center gap-3">
          <Thumbnail course={course} />
          <div className="min-w-0">
            <div className="font-semibold">{course.title}</div>
            <div className="truncate text-xs text-muted">{[course.category, course.instructor].filter(Boolean).join(' · ')}</div>
          </div>
        </div>
      )
    },
    { header: 'Modules', align: 'right', headerClassName: 'font-bold', render: (course) => (course.modules || []).length },
    { header: 'Lectures', align: 'right', headerClassName: 'font-bold', render: (course) => lectureCount(course) },
    { header: 'Status', headerClassName: 'font-bold', render: (course) => <Pill tone={isPublished(course) ? 'ok' : 'neutral'}>{isPublished(course) ? 'Published' : 'Draft'}</Pill> },
    { header: 'Updated', headerClassName: 'font-bold', render: (course) => formatDate(course.updatedAt) || '—' },
    {
      header: 'Actions',
      hideHeader: true,
      align: 'right',
      render: (course) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" icon={Layers} loading={opening} aria-label={`Manage lectures for ${course.title}`} onClick={() => openCurriculum(course)}>
            Manage
          </Button>
          <Button size="sm" aria-label={`Edit ${course.title}`} onClick={() => setCourseModal({ course })}>
            <Pencil className="size-4" aria-hidden="true" />
          </Button>
          <Button size="sm" variant="danger" aria-label={`Delete ${course.title}`} onClick={() => deleteCourse(course)}>
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      )
    }
  ];

  const lectures = list.reduce((sum, course) => sum + lectureCount(course), 0);

  return (
    <>
      <PageHeader
        title="Course management"
        description="Create courses for students, organise them into modules, and upload lecture videos, notes and quizzes."
        actions={
          <>
            <Button icon={RefreshCw} loading={courses.loading} onClick={courses.reload}>
              Refresh
            </Button>
            <Button variant="primary" icon={Plus} onClick={() => setCourseModal({ course: null })}>
              New course
            </Button>
          </>
        }
      />

      {banner}
      {courses.error && <LoadError className="mb-4" what="the courses" message={courses.error} onRetry={courses.reload} />}

      <section aria-label="Course totals" className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total courses" value={list.length} hint="Published and drafts" icon={BookOpen} />
        <KpiCard label="Published" value={counts.published ?? 0} hint="Visible to students" icon={Layers} tone="ok" />
        <KpiCard label="Drafts" value={counts.draft ?? 0} hint="Hidden from students" icon={FilePen} tone="warn" />
        <KpiCard label="Lectures" value={lectures} hint="Across all courses" icon={FileVideo} tone="info" />
      </section>

      <Panel>
        <Tabs
          label="Course filter"
          value={tab}
          onChange={(key) => {
            setTab(key);
            setPage(1);
          }}
          tabs={COURSE_TABS.map((t) => ({ key: t.key, label: t.label, count: counts[t.key] ?? 0 }))}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
          <SearchInput
            className="w-full sm:w-80"
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="Search course, category or instructor"
          />
          <span className="text-[12.5px] text-muted">{plural(filtered.length, 'course')}</span>
        </div>
        {courses.loading && !courses.data ? (
          <Loading>Loading courses…</Loading>
        ) : (
          <>
            <DataTable
              caption="Courses"
              columns={columns}
              rows={info.rows}
              rowKey={(course) => course.id}
              empty={list.length === 0 ? 'No courses yet. Create the first one to start adding lectures.' : 'No courses match these filters.'}
            />
            <Pager info={info} onPage={setPage} />
          </>
        )}
      </Panel>

      {modal}
    </>
  );
}
