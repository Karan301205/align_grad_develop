import { useState } from 'react';
import Button from '../../components/ui/Button.jsx';
import Field, { inputClass } from '../../components/ui/Field.jsx';
import Notice from '../../components/ui/Notice.jsx';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message || 'Server error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-canvas p-4">
      <div className="w-full max-w-sm rounded-xl border border-line bg-panel p-7 shadow-sm">
        <div className="mb-6">
          <img src="/aligngrad-logo.png" alt="AlignGrad" width="156" height="33" className="h-8 w-auto" />
          <h1 className="mt-4 text-lg font-bold leading-tight">Admin Workspace</h1>
          <p className="text-[13px] text-muted">Sign in to manage the platform.</p>
        </div>

        {error && <Notice tone="error" className="mb-4">{error}</Notice>}

        <form onSubmit={submit} className="space-y-4">
          <Field label="Admin email">
            <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Password">
            <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          </Field>
          <Button type="submit" variant="primary" loading={submitting} className="w-full">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  );
}
