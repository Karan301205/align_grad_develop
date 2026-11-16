import { useId, useState } from 'react';
import { CircleCheck, FileVideo, LoaderCircle, Paperclip, Trash2 } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import Button from '../../components/ui/Button.jsx';
import Field, { inputClass } from '../../components/ui/Field.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import Notice from '../../components/ui/Notice.jsx';
import QuizBuilder from './QuizBuilder.jsx';
import { buildQuiz, emptyLessonForm, emptyQuizForm, lessonToForm, quizToForm, unwrap } from './courseModel.js';
import useFileUpload from './useFileUpload.js';
import { formatDuration, readVideoDuration } from './videoDuration.js';

const pickerClass =
  'inline-flex h-9 cursor-pointer items-center rounded-lg border border-line-strong bg-panel px-3.5 text-sm font-semibold hover:bg-subtle focus-within:ring-2 focus-within:ring-accent/40';

/** Add (lesson = null) or edit a lecture, in a drawer on the right. `onSaved(modules, 'added' | 'updated')`. */
export default function LessonFormModal({ courseId, moduleId, lesson, onClose, onSaved }) {
  const editing = Boolean(lesson);
  const formId = useId();
  const [form, setForm] = useState(() => (lesson ? lessonToForm(lesson) : emptyLessonForm()));
  const [quiz, setQuiz] = useState(() => (lesson ? quizToForm(lesson.quiz) : emptyQuizForm()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [durationFromVideo, setDurationFromVideo] = useState(false); // the Duration field was filled from the uploaded video
  const video = useFileUpload({ folder: 'course-videos', fallbackType: 'video/mp4' });
  const document = useFileUpload({ folder: 'course-documents', fallbackType: 'application/pdf' });
  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const pickVideo = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const uploaded = await video.upload(file);
    if (!uploaded) return;
    // Once it is uploaded, the video's own length fills the Duration field (left as it was when the browser can't read it).
    const duration = formatDuration(await readVideoDuration(file));
    set({ videoKey: uploaded.key, videoUrl: uploaded.url, ...(duration ? { duration } : {}) });
    setDurationFromVideo(Boolean(duration));
  };

  const pickDocument = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const uploaded = await document.upload(file);
    if (uploaded) set({ documentKey: uploaded.key, documentUrl: uploaded.url, documentName: file.name });
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const built = buildQuiz(quiz, form.title);
    if (built.error) {
      setError(built.error);
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form, quiz: built.quiz };
      const response = editing
        ? await adminApi.updateLesson(courseId, moduleId, lesson.id, payload)
        : await adminApi.addLesson(courseId, moduleId, payload);
      onSaved(unwrap(response, 'Something went wrong. Please try again.').modules, editing ? 'updated' : 'added');
    } catch (err) {
      setError(err.message || 'Failed to save the lecture.');
      setSaving(false);
    }
  };

  const busy = video.uploading || document.uploading;

  return (
    <Drawer
      title={editing ? 'Edit lecture' : 'Add a lecture'}
      subtitle="The video, a sub-topic, notes, a reference document and an optional quiz."
      onClose={onClose}
      closeOnBackdrop={false}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form={formId} variant="primary" loading={saving} disabled={busy}>
            {editing ? 'Save lecture' : 'Add lecture'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}

        <Field label="Lecture title" required>
          <input required value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} placeholder="e.g. Entrepreneurship: an overview (1)" />
        </Field>
        <Field label="Sub-topic" hint="Groups lectures inside a module, e.g. “Steps to start a small business”.">
          <input value={form.subTopic} onChange={(e) => set({ subTopic: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Description">
          <textarea rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} className={inputClass} placeholder="A short summary of what this lecture covers" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Duration" hint={durationFromVideo ? 'Read from the uploaded video. You can still change it.' : 'Minutes and seconds, e.g. 18:45'}>
            <input
              value={form.duration}
              onChange={(e) => {
                set({ duration: e.target.value });
                setDurationFromVideo(false);
              }}
              className={inputClass}
              placeholder="18:45"
            />
          </Field>
          <Field label="Video file key in S3" required hint="Filled in by the upload below, or type the key of a file already in the bucket.">
            <input required value={form.videoKey} onChange={(e) => set({ videoKey: e.target.value })} className={inputClass} placeholder="course-videos/lecture-1.mp4" />
          </Field>
        </div>

        <div className="rounded-xl border border-dashed border-line-strong bg-canvas p-4 text-center">
          {video.uploading ? (
            <LoaderCircle className="mx-auto size-7 animate-spin text-accent-ink" aria-hidden="true" />
          ) : (
            <FileVideo className="mx-auto size-7 text-accent-ink" aria-hidden="true" />
          )}
          <label className={`${pickerClass} mt-2`}>
            {video.uploading ? 'Uploading video…' : form.videoKey ? 'Replace video' : 'Choose a video file'}
            <input type="file" accept="video/*" className="sr-only" onChange={pickVideo} disabled={video.uploading} />
          </label>
          {video.uploading ? (
            <p role="status" className="mt-1.5 text-xs font-semibold text-ink-2">
              Your video is uploading. A large video can take a few minutes, so keep this panel open until it finishes.
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-muted">MP4, WebM or MOV</p>
          )}
          {video.error && <p role="alert" className="mt-1.5 text-xs font-medium text-bad">Video upload failed. {video.error}</p>}
          {!video.uploading && form.videoKey && (
            <p className="mt-1.5 flex items-center justify-center gap-1.5 text-xs font-semibold text-ok">
              <CircleCheck className="size-3.5" aria-hidden="true" />
              Video ready: {form.videoKey}
            </p>
          )}
        </div>

        <Field label="Lecture notes" hint="Shown to students with the lecture, and available to download.">
          <textarea rows={3} value={form.notes} onChange={(e) => set({ notes: e.target.value })} className={inputClass} placeholder="Key points, formulas, tips" />
        </Field>

        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Reference document</span>
          {form.documentName ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-canvas p-3">
              <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                <Paperclip className="size-4 shrink-0 text-accent-ink" aria-hidden="true" />
                <span className="truncate">{form.documentName}</span>
              </span>
              <button
                type="button"
                aria-label="Remove the attached document"
                onClick={() => set({ documentUrl: '', documentKey: '', documentName: '' })}
                className="rounded-md p-1 text-bad hover:bg-bad-soft"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label className={pickerClass}>
              <Paperclip className="mr-2 size-4" aria-hidden="true" />
              {document.uploading ? 'Uploading document…' : 'Attach a PDF, Word, PowerPoint or text file'}
              <input type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt" className="sr-only" onChange={pickDocument} disabled={document.uploading} />
            </label>
          )}
          {document.error && <p role="alert" className="mt-1.5 text-xs font-medium text-bad">Document upload failed. {document.error}</p>}
        </div>

        <QuizBuilder quiz={quiz} onChange={setQuiz} />
      </form>
    </Drawer>
  );
}
