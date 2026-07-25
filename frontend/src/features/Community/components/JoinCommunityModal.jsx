import React, { useState } from 'react';
import { X, KeyRound, Link as LinkIcon, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../../../services/apiClient';

export default function JoinCommunityModal({ isOpen, onClose, token, onJoined }) {
  const [tab, setTab] = useState('invite'); // 'invite' | 'password'
  const [inviteToken, setInviteToken] = useState('');
  const [communityId, setCommunityId] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleJoinViaInvite = async (e) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const cleanToken = inviteToken.trim().split('/').pop();
      const res = await apiFetch(`/community/invite/${cleanToken}/join`, {
        token,
        method: 'POST'
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Successfully joined community!');
        setTimeout(() => {
          onClose();
          if (onJoined) onJoined(data.communityId);
        }, 1200);
      } else {
        setErrorMsg(data.error || 'Failed to join via invitation link.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error joining via invite.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinViaPassword = async (e) => {
    e.preventDefault();
    if (!communityId.trim()) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await apiFetch(`/community/${communityId.trim()}/join`, {
        token,
        method: 'POST',
        json: { password: password.trim() }
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(data.message || 'Successfully joined community!');
        setTimeout(() => {
          onClose();
          if (onJoined) onJoined(communityId.trim());
        }, 1200);
      } else {
        setErrorMsg(data.error || 'Failed to join community.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error joining community.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent animate-fade-in text-left">
      <div className="bg-surface-container border border-outline-variant rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden space-y-0">
        <div className="p-5 border-b border-outline-variant flex justify-between items-center bg-surface-container-high/40">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            <h3 className="font-headline font-bold text-base text-primary">Join Private Network</h3>
          </div>
          <button onClick={onClose} className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-outline-variant text-xs font-mono">
          <button
            onClick={() => setTab('invite')}
            className={`flex-1 py-3 font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'invite' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Invitation Token / Link
          </button>
          <button
            onClick={() => setTab('password')}
            className={`flex-1 py-3 font-bold border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              tab === 'password' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-on-surface-variant'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            Community ID & Password
          </button>
        </div>

        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-error-container/20 border border-error-container text-error rounded-xl text-xs flex items-center gap-2 font-mono">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs flex items-center gap-2 font-mono font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'invite' ? (
            <form onSubmit={handleJoinViaInvite} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-on-surface-variant">Invite Link or Token *</label>
                <input
                  type="text"
                  required
                  placeholder="Paste invitation token (e.g. 4a8b9c...)"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface rounded-xl text-xs font-bold font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inviteToken.trim() || submitting}
                  className="px-5 py-2 bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-40 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Join Network'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoinViaPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-on-surface-variant">Community ID *</label>
                <input
                  type="text"
                  required
                  placeholder="Paste Community ID"
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-on-surface-variant">Password</label>
                <input
                  type="password"
                  placeholder="Enter protection password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container-high border border-outline-variant rounded-xl p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant text-on-surface rounded-xl text-xs font-bold font-mono cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!communityId.trim() || submitting}
                  className="px-5 py-2 bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-40 rounded-xl text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit & Join'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
