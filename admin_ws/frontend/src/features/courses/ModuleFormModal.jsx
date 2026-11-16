import { useId, useState } from 'react';
import { adminApi } from '../../api/adminApi.js';
import Button from '../../components/ui/Button.jsx';
import Field, { inputClass } from '../../components/ui/Field.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import Notice from '../../components/ui/Notice.jsx';
import { unwrap } from './courseModel.js';

/** Add (module = null) or rename a module, in a drawer on the right. `onSaved(modules, 'added' | 'renamed')` gets the course's updated modules. */
export default function ModuleFormModal({ courseId, module, onClose, onSaved }) {
  const editing = Boolean(module);
  const formId = useId();
  const [title, setTitle] = useState(module?.title || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const response = editing
        ? await adminApi.updateModule(courseId, module.id, { title })
        : await adminApi.addModule(courseId, { title });
      onSaved(unwrap(response, 'Something went wrong. Please try again.').modules, editing ? 'renamed' : 'added');
    } catch (err) {
      setError(err.message || 'Failed to save the module.');
      setSaving(false);
    }
  };

  return (
    <Drawer
      title={editing ? 'Rename module' : 'Add a module'}
      subtitle="A module is a week or unit that groups lectures."
      onClose={onClose}
      closeOnBackdrop={false}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" form={formId} variant="primary" loading={saving}>
            {editing ? 'Save name' : 'Add module'}
          </Button>
        </div>
      }
    >
      <form id={formId} onSubmit={submit} className="space-y-4">
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Module title" required>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Week 1: Foundations" />
        </Field>
      </form>
    </Drawer>
  );
}
