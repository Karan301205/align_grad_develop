import { useId, useState } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import Button from '../../components/ui/Button.jsx';
import Field, { inputClass } from '../../components/ui/Field.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import Notice from '../../components/ui/Notice.jsx';
import { safeUrl } from '../../utils/format.js';
import { courseToForm, emptyCourseForm, unwrap } from './courseModel.js';
import useFileUpload from './useFileUpload.js';

/** Create (course = null) or edit a course, in a drawer on the right. `onSaved(course, 'created' | 'updated')`. */
export default function CourseFormModal({ course, onClose, onSaved }) {
  const editing = Boolean(course);
  const formId = useId();
  const [form, setForm] = useState(() => (course ? courseToForm(course) : emptyCourseForm()));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const thumbnail = useFileUpload({ folder: 'course-thumbnails', fallbackType: 'image/jpeg' });
  const set = (patch) => setForm((current) => ({ ...current, ...patch }));

  const pickThumbnail = async (event) => {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const uploaded = await thumbnail.upload(file);
    if (uploaded) set({ thumbnailUrl: uploaded.url, thumbnailKey: uploaded.key });
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = editing ? await adminApi.updateCourse(course.id, form) : await adminApi.createCourse(form);
      onSaved(unwrap(response, 'Something went wrong. Please try again.').course, editing ? 'updated' : 'created');
    } catch (err) {
      setError(err.message || 'Failed to save the course.');
      setSaving(false);
    }
  };

  const preview = safeUrl(form.thumbnailUrl);

  return (
    <Drawer
      title={editing ? 'Edit course' : 'Create a course'}
      subtitle="The details students see in the course catalogue."
      onClose={onClose}
      closeOnBackdrop={false}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form={formId} variant="primary" loading={saving} disabled={thumbnail.uploading}>
            {editing ? 'Save changes' : 'Create course'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}

        <Field label="Course name" required>
          <input required value={form.title} onChange={(e) => set({ title: e.target.value })} className={inputClass} placeholder="e.g. Advanced Backend Architecture" />
        </Field>
        <Field label="Description" required>
          <textarea required rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} className={inputClass} placeholder="What students will learn in this course" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <input value={form.category} onChange={(e) => set({ category: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Instructor">
            <input value={form.instructor} onChange={(e) => set({ instructor: e.target.value })} className={inputClass} />
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-ink-2">Thumbnail image</span>
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-subtle">
              {preview ? <img src={preview} alt="Thumbnail preview" className="size-full object-cover" /> : <ImageIcon className="size-6 text-faint" aria-hidden="true" />}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-panel px-3.5 text-sm font-semibold hover:bg-subtle focus-within:ring-2 focus-within:ring-accent/40">
                <Upload className="size-4" aria-hidden="true" />
                {thumbnail.uploading ? 'Uploading…' : preview ? 'Replace image' : 'Upload image'}
                <input type="file" accept="image/*" className="sr-only" onChange={pickThumbnail} disabled={thumbnail.uploading} />
              </label>
              {form.thumbnailUrl && (
                <Button variant="ghost" onClick={() => set({ thumbnailUrl: '', thumbnailKey: '' })}>
                  Remove
                </Button>
              )}
            </div>
          </div>
          {thumbnail.error && <p role="alert" className="mt-1.5 text-xs font-medium text-bad">Thumbnail upload failed. {thumbnail.error}</p>}
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => set({ isPublished: e.target.checked })} className="size-4 accent-accent" />
          Published: visible in the student course catalogue
        </label>
      </form>
    </Drawer>
  );
}
