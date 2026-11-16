import { useState } from 'react';
import { Clock, FileText, FileVideo, FolderPlus, CircleHelp, Paperclip, Pencil, Plus, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import Button from '../../components/ui/Button.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Panel } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import { EmptyState } from '../../components/ui/States.jsx';
import { isPublished, lectureCount, unwrap } from './courseModel.js';
import LessonFormModal from './LessonFormModal.jsx';
import ModuleFormModal from './ModuleFormModal.jsx';

function LessonRow({ lesson, onEdit, onDelete }) {
  const questions = lesson.quiz?.questions?.length || 0;
  return (
    <li className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5">
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent-ink">
          <FileVideo className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{lesson.title}</span>
            {lesson.subTopic && <Pill tone="accent">{lesson.subTopic}</Pill>}
          </div>
          {lesson.description && <p className="text-[13px] text-ink-2">{lesson.description}</p>}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Clock className="size-3" aria-hidden="true" />
              {lesson.duration || '10:00'}
            </span>
            {lesson.notes && (
              <span className="flex items-center gap-1 font-medium text-ok">
                <FileText className="size-3" aria-hidden="true" />
                Notes
              </span>
            )}
            {lesson.documentName && (
              <span className="flex items-center gap-1 font-medium text-warn">
                <Paperclip className="size-3" aria-hidden="true" />
                {lesson.documentName}
              </span>
            )}
            {questions > 0 && (
              <span className="flex items-center gap-1 font-medium text-accent-ink">
                <CircleHelp className="size-3" aria-hidden="true" />
                Quiz ({questions} {questions === 1 ? 'question' : 'questions'})
              </span>
            )}
            <span className="max-w-xs truncate" title={lesson.videoKey}>
              S3: {lesson.videoKey}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button size="sm" icon={Pencil} aria-label={`Edit lecture ${lesson.title}`} onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="danger" aria-label={`Delete lecture ${lesson.title}`} onClick={onDelete}>
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </li>
  );
}

/**
 * One course's modules and lectures. `onModules(modules)` receives the course's new
 * module list after each change; `notify(tone, message)` shows the page banner.
 */
export default function CourseCurriculum({ course, onBack, onEditCourse, onModules, notify }) {
  const [moduleModal, setModuleModal] = useState(null); // { module: Module | null }
  const [lessonModal, setLessonModal] = useState(null); // { moduleId, lesson: Lesson | null }
  const modules = course.modules || [];

  const remove = async (confirmation, call, doneMessage, failMessage) => {
    if (!window.confirm(confirmation)) return;
    try {
      onModules(unwrap(await call(), 'Something went wrong. Please try again.').modules);
      notify('success', doneMessage);
    } catch (err) {
      notify('error', err.message || failMessage);
    }
  };

  const deleteModule = (module) =>
    remove('Delete this module and all its lectures?', () => adminApi.deleteModule(course.id, module.id), 'Module removed.', 'Failed to delete the module.');
  const deleteLesson = (module, lesson) =>
    remove('Delete this lecture?', () => adminApi.deleteLesson(course.id, module.id, lesson.id), 'Lecture deleted.', 'Failed to delete the lecture.');

  const saved = (message) => (nextModules) => {
    onModules(nextModules);
    notify('success', message);
  };

  return (
    <>
      <PageHeader
        back={{ label: 'Courses', onClick: onBack }}
        title={course.title}
        description={course.description}
        actions={
          <>
            <Button icon={Pencil} onClick={() => onEditCourse(course)}>
              Edit course info
            </Button>
            <Button variant="primary" icon={FolderPlus} onClick={() => setModuleModal({ module: null })}>
              Add module
            </Button>
          </>
        }
      >
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted">
          <Pill tone="accent">{course.category}</Pill>
          <Pill tone={isPublished(course) ? 'ok' : 'neutral'}>{isPublished(course) ? 'Published' : 'Draft'}</Pill>
          <span>
            {modules.length} {modules.length === 1 ? 'module' : 'modules'} · {lectureCount(course)} {lectureCount(course) === 1 ? 'lecture' : 'lectures'}
          </span>
        </div>
      </PageHeader>

      {modules.length === 0 ? (
        <Panel>
          <EmptyState icon={FolderPlus}>
            No modules yet. Group the course into weeks or units, then add lecture videos to each one.
          </EmptyState>
          <div className="flex justify-center pb-8">
            <Button variant="primary" icon={Plus} onClick={() => setModuleModal({ module: null })}>
              Add the first module
            </Button>
          </div>
        </Panel>
      ) : (
        <div className="space-y-4">
          {modules.map((module, index) => (
            <Panel key={module.id || index} aria-label={module.title}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-accent-soft text-xs font-bold text-accent-ink">{index + 1}</span>
                  <h2 className="truncate text-[15px] font-bold">{module.title}</h2>
                  <span className="shrink-0 text-xs text-muted">
                    ({(module.lessons || []).length} {(module.lessons || []).length === 1 ? 'lecture' : 'lectures'})
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="primary" icon={Plus} onClick={() => setLessonModal({ moduleId: module.id, lesson: null })}>
                    Add lecture
                  </Button>
                  <Button size="sm" aria-label={`Rename module ${module.title}`} onClick={() => setModuleModal({ module })}>
                    <Pencil className="size-4" aria-hidden="true" />
                  </Button>
                  <Button size="sm" variant="danger" aria-label={`Delete module ${module.title}`} onClick={() => deleteModule(module)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
              {(module.lessons || []).length === 0 ? (
                <p className="px-4 py-5 text-sm text-muted">No lectures in this module yet.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {module.lessons.map((lesson, lessonIndex) => (
                    <LessonRow
                      key={lesson.id || lessonIndex}
                      lesson={lesson}
                      onEdit={() => setLessonModal({ moduleId: module.id, lesson })}
                      onDelete={() => deleteLesson(module, lesson)}
                    />
                  ))}
                </ul>
              )}
            </Panel>
          ))}
        </div>
      )}

      {moduleModal && (
        <ModuleFormModal
          courseId={course.id}
          module={moduleModal.module}
          onClose={() => setModuleModal(null)}
          onSaved={(nextModules, mode) => {
            setModuleModal(null);
            saved(mode === 'added' ? 'Module added.' : 'Module renamed.')(nextModules);
          }}
        />
      )}
      {lessonModal && (
        <LessonFormModal
          courseId={course.id}
          moduleId={lessonModal.moduleId}
          lesson={lessonModal.lesson}
          onClose={() => setLessonModal(null)}
          onSaved={(nextModules, mode) => {
            setLessonModal(null);
            saved(mode === 'added' ? 'Lecture added.' : 'Lecture updated.')(nextModules);
          }}
        />
      )}
    </>
  );
}
