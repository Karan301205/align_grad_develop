import React, { useState } from 'react';
import { X, Lock, ShieldCheck, Loader2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';

export default function CreateCommunityModal({ isOpen, onClose, token, onCommunityCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [logo, setLogo] = useState('');
  const [banner, setBanner] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await apiFetch('/community', {
        token,
        method: 'POST',
        json: {
          name: name.trim(),
          description: description.trim(),
          password: password || undefined,
          logo: logo || undefined,
          banner: banner || undefined
        }
      });

      const data = await res.json();
      if (res.ok) {
        setName('');
        setDescription('');
        setPassword('');
        setLogo('');
        setBanner('');
        onClose();
        if (onCommunityCreated) onCommunityCreated(data);
      } else {
        setErrorMsg(data.error || 'Failed to create private community.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error creating community.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
      <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden space-y-0">
        <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-high/40">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-primary" />
            <h3 className="font-headline font-bold text-base text-primary">Create Private Community</h3>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-error-container/20 border border-error-container text-error rounded-xl text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-on-surface-variant">Community Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. AI & Distributed Systems Hub"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-on-surface-variant">Description</label>
            <textarea
              rows={3}
              placeholder="Describe the focus and goals of your private network..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary font-sans resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono font-bold text-on-surface-variant">Protection Password (Optional)</label>
            <input
              type="password"
              placeholder="Set a password for join requests"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-high border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
            />
            <p className="text-[10px] font-mono text-on-surface-variant">If set, passwords are hashed securely with bcrypt.</p>
          </div>

          <div className="pt-4 border-t border-outline-variant flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface rounded-xl text-xs font-bold font-mono cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || submitting}
              className="px-5 py-2 bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-40 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Create Network
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
