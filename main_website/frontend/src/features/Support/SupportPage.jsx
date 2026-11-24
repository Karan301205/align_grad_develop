import { useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Loader2, Plus, RotateCcw, Send } from 'lucide-react';
import { formatShortDate } from '../../utils/format';
import useSupportTickets from './useSupportTickets';
import { STATUS_TEXT, SUPPORT_THEMES } from './supportThemes';

// Used until the server's limits arrive; the server (modules/support/supportRules.js) is the authority.
const DEFAULT_LIMITS = { subjectMin: 5, subjectMax: 120, messageMin: 10, replyMin: 2, messageMax: 5000, maxOpenTickets: 5 };

/** "18 Nov, 14:05" (with the year when it isn't this year). */
function formatWhen(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short', ...(sameYear ? {} : { year: 'numeric' }), hour: '2-digit', minute: '2-digit' });
}

function StatusPill({ status, t }) {
  const text = STATUS_TEXT[status] || STATUS_TEXT.OPEN;
  return <span className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.status[status] || t.status.OPEN}`}>{text.label}</span>;
}

function Banner({ tone = 'error', t, children }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 text-[14px] font-medium ${tone === 'error' ? t.error : t.note}`}>
      {tone === 'error' && <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />}
      <span className="min-w-0">{children}</span>
    </div>
  );
}

function TicketList({ tickets, selectedId, onSelect, onRefresh, refreshing, t }) {
  return (
    <section aria-labelledby="support-list-title" className={`${t.card} flex min-w-0 flex-col self-start`}>
      <div className={`flex items-center justify-between gap-3 border-b px-5 py-4 ${t.divider}`}>
        <h2 id="support-list-title" className={t.cardTitle}>
          <span className="font-semibold">Your tickets</span> <span className={`font-normal ${t.muted}`}>({tickets.length})</span>
        </h2>
        <button type="button" onClick={onRefresh} disabled={refreshing} className={t.smallSecondary} aria-label="Check for new replies">
          {refreshing ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <RotateCcw aria-hidden="true" className="size-4" />}
          Refresh
        </button>
      </div>
      <ul className="m-0 flex list-none flex-col gap-1 p-2">
        {tickets.map((ticket) => {
          const selected = ticket.id === selectedId;
          return (
            <li key={ticket.id}>
              <button
                type="button"
                onClick={() => onSelect(ticket.id)}
                aria-current={selected ? 'true' : undefined}
                className={`flex w-full flex-col gap-1 rounded-[10px] border px-3 py-2.5 text-left transition-colors ${t.row} ${selected ? t.rowOn : ''}`}
              >
                <span className="flex w-full items-start justify-between gap-2">
                  <span className={`min-w-0 truncate font-semibold ${t.body}`} title={ticket.subject}>{ticket.subject}</span>
                  <StatusPill status={ticket.status} t={t} />
                </span>
                <span className={`flex w-full justify-between gap-2 text-[13px] ${t.muted}`}>
                  <span className="min-w-0 truncate">{ticket.reference} · {ticket.categoryLabel}</span>
                  <span className="shrink-0">{formatShortDate(ticket.lastMessageAt)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function NewTicketForm({ categories, limits, openCount, accountEmail, canCancel, onCancel, onCreate, t }) {
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [sending, setSending] = useState(false);
  const atLimit = openCount >= limits.maxOpenTickets;

  const check = () => {
    const found = {};
    if (!category) found.category = 'Choose a topic.';
    if (subject.trim().length < limits.subjectMin) found.subject = `Give your ticket a subject of at least ${limits.subjectMin} characters.`;
    if (message.trim().length < limits.messageMin) found.message = `Describe the problem in at least ${limits.messageMin} characters.`;
    return found;
  };

  const submit = async (event) => {
    event.preventDefault();
    const found = check();
    setErrors(found);
    setServerError('');
    if (Object.keys(found).length > 0) return;
    setSending(true);
    const result = await onCreate({ category, subject: subject.trim(), message: message.trim() });
    setSending(false);
    if (result.error) setServerError(result.error);
  };

  const fieldError = (name) =>
    errors[name] ? (
      <p id={`support-${name}-error`} role="alert" className="m-0 mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-[#B91C1C]">
        <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
        {errors[name]}
      </p>
    ) : null;

  return (
    <section aria-labelledby="support-new-title" className={`${t.card} min-w-0 p-5 sm:p-6`}>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="support-new-title" className={t.cardTitle}>
            <span className="font-semibold">Raise a ticket</span>
          </h2>
          <p className={`m-0 mt-1 text-[14px] ${t.muted}`}>Tell us what went wrong or what you need. One ticket per problem helps us answer faster.</p>
        </div>
        {canCancel && (
          <button type="button" onClick={onCancel} className={t.smallSecondary}>
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to tickets
          </button>
        )}
      </div>

      {atLimit ? (
        <Banner tone="note" t={t}>
          You have {openCount} open tickets. Add to one of them, or wait until we resolve one, before raising another.
        </Banner>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <fieldset className="m-0 min-w-0 border-0 p-0" aria-describedby={errors.category ? 'support-category-error' : undefined}>
            <legend className={`mb-2 p-0 text-[14px] font-semibold ${t.body}`}>What is it about?</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((option) => (
                <label key={option.key} className={`${t.chip} ${category === option.key ? t.chipOn : ''}`}>
                  <input
                    type="radio"
                    name="support-category"
                    value={option.key}
                    checked={category === option.key}
                    onChange={() => setCategory(option.key)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
            {fieldError('category')}
          </fieldset>

          <div>
            <label htmlFor="support-subject" className={`mb-1.5 flex justify-between gap-2 text-[14px] font-semibold ${t.body}`}>
              <span>Subject</span>
              <span className={`font-normal ${t.muted}`}>{subject.length}/{limits.subjectMax}</span>
            </label>
            <input
              id="support-subject"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              maxLength={limits.subjectMax}
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={errors.subject ? 'support-subject-error' : undefined}
              className={t.field(errors.subject)}
            />
            {fieldError('subject')}
          </div>

          <div>
            <label htmlFor="support-message" className={`mb-1.5 flex justify-between gap-2 text-[14px] font-semibold ${t.body}`}>
              <span>What happened?</span>
              <span className={`font-normal ${t.muted}`}>{message.length}/{limits.messageMax}</span>
            </label>
            <p id="support-message-hint" className={`m-0 mb-2 text-[13px] ${t.muted}`}>
              Say what you were doing, what you expected, and any error message you saw.
            </p>
            <textarea
              id="support-message"
              rows={6}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={limits.messageMax}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={`support-message-hint${errors.message ? ' support-message-error' : ''}`}
              className={`${t.field(errors.message)} resize-y`}
            />
            {fieldError('message')}
          </div>

          {serverError && <Banner t={t}>{serverError}</Banner>}

          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={sending} className={t.primary}>
              {sending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
              {sending ? 'Raising ticket…' : 'Raise ticket'}
            </button>
            <span className={`text-[13px] ${t.muted}`}>
              {accountEmail ? `We’ll email a confirmation to ${accountEmail}.` : 'We’ll email a confirmation to your account email.'}
            </span>
          </div>
        </form>
      )}
    </section>
  );
}

function TicketThread({ ticket, limits, onReply, t }) {
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const status = STATUS_TEXT[ticket.status] || STATUS_TEXT.OPEN;

  const send = async (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (text.length < limits.replyMin) {
      setError('Write a reply first.');
      return;
    }
    setError('');
    setSending(true);
    const result = await onReply(ticket.id, text);
    setSending(false);
    if (result.error) setError(result.error);
    else setDraft('');
  };

  return (
    <section aria-labelledby="support-thread-title" className={`${t.card} flex min-w-0 flex-col`}>
      <header className={`flex flex-col gap-2 border-b px-5 py-4 sm:px-6 ${t.divider}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 id="support-thread-title" className={`${t.cardTitle} min-w-0 break-words`}>
            <span className="font-semibold">{ticket.subject}</span>
          </h2>
          <StatusPill status={ticket.status} t={t} />
        </div>
        <p className={`m-0 text-[13px] ${t.muted}`}>
          {ticket.reference} · {ticket.categoryLabel} · Raised {formatShortDate(ticket.createdAt)}
        </p>
        <p className={`m-0 text-[13px] ${t.body}`}>{status.hint}</p>
      </header>

      <ol aria-label="Conversation" className="m-0 flex list-none flex-col gap-3 px-5 py-5 sm:px-6">
        {ticket.messages.map((message) => {
          const mine = message.author !== 'ADMIN';
          return (
            <li key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[88%] rounded-[12px] border px-4 py-3 ${mine ? t.mine : t.theirs}`}>
                <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-4 text-[12.5px]">
                  <span className={`font-semibold ${mine ? t.body : t.accentText}`}>{mine ? 'You' : 'AlignGrad support'}</span>
                  <time dateTime={message.createdAt} className={t.muted}>{formatWhen(message.createdAt)}</time>
                </div>
                <p className={`m-0 whitespace-pre-wrap break-words text-[14.5px] ${t.body}`}>{message.body}</p>
              </div>
            </li>
          );
        })}
      </ol>

      <form onSubmit={send} noValidate className={`flex flex-col gap-3 border-t px-5 py-4 sm:px-6 ${t.divider}`}>
        <label htmlFor="support-reply" className={`flex justify-between gap-2 text-[14px] font-semibold ${t.body}`}>
          <span>{ticket.status === 'RESOLVED' ? 'Still need help? Reply to reopen this ticket' : 'Add a reply'}</span>
          <span className={`font-normal ${t.muted}`}>{draft.length}/{limits.messageMax}</span>
        </label>
        <textarea
          id="support-reply"
          rows={3}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={limits.messageMax}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'support-reply-error' : undefined}
          className={`${t.field(error)} resize-y`}
        />
        {error && (
          <p id="support-reply-error" role="alert" className="m-0 flex items-center gap-1.5 text-[13px] font-medium text-[#B91C1C]">
            <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={sending} className={t.primary}>
            {sending ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Send aria-hidden="true" className="size-4" />}
            {sending ? 'Sending…' : 'Send reply'}
          </button>
          <span className={`text-[13px] ${t.muted}`}>We’ll email you when we answer.</span>
        </div>
      </form>
    </section>
  );
}

/**
 * Help & support for candidates and recruiters: raise a ticket, follow the conversation with
 * AlignGrad support, and reply. `theme` is 'candidate' or 'recruiter'; `onNotify(message, type)`
 * shows the app's toast. Admins answer in admin_ws (Support tickets), which also emails the reply.
 */
export default function SupportPage({ token, user, theme = 'candidate', onNotify }) {
  const t = SUPPORT_THEMES[theme] || SUPPORT_THEMES.candidate;
  const { loading, error, tickets, categories, limits: serverLimits, reload, createTicket, reply } = useSupportTickets(token);
  const limits = { ...DEFAULT_LIMITS, ...(serverLimits || {}) };
  const [view, setView] = useState('thread'); // 'thread' | 'new'
  const [selectedId, setSelectedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const detailRef = useRef(null);

  const selected = tickets.find((ticket) => ticket.id === selectedId) || tickets[0] || null;
  const showForm = view === 'new' || tickets.length === 0;
  const openCount = tickets.filter((ticket) => ticket.status !== 'RESOLVED').length;

  // On a phone the list sits above the detail, so bring the detail into view.
  const revealDetail = () => {
    if (window.matchMedia?.('(max-width: 1023px)').matches) {
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const select = (id) => {
    setSelectedId(id);
    setView('thread');
    revealDetail();
  };

  const startNew = () => {
    setView('new');
    revealDetail();
  };

  const refresh = async () => {
    setRefreshing(true);
    await reload({ silent: true });
    setRefreshing(false);
  };

  const handleCreate = async (fields) => {
    const result = await createTicket(fields);
    if (result.ticket) {
      setSelectedId(result.ticket.id);
      setView('thread');
      onNotify?.(
        result.emailSent
          ? `Ticket ${result.ticket.reference} raised. We’ve emailed you a confirmation.`
          : `Ticket ${result.ticket.reference} raised. We couldn’t send the confirmation email, but your ticket is saved here.`,
        result.emailSent ? 'success' : 'warning'
      );
    }
    return result;
  };

  const handleReply = async (ticketId, message) => {
    const result = await reply(ticketId, message);
    if (result.ticket) onNotify?.(result.reopened ? 'Reply sent. Your ticket is open again.' : 'Reply sent.', 'success');
    return result;
  };

  return (
    <div className={t.page}>
      <div className={t.inner}>
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className={t.title}>
              <span className="font-bold">Help &amp; support</span>
            </h1>
            <p className={`m-0 max-w-[680px] text-[15px] ${t.muted}`}>
              Something not working, or have a question? Raise a ticket. We’ll email you when we reply, and the whole conversation stays here.
            </p>
          </div>
          {!loading && !error && tickets.length > 0 && !showForm && (
            <button type="button" onClick={startNew} className={t.primary}>
              <Plus aria-hidden="true" className="size-4" />
              New ticket
            </button>
          )}
        </header>

        {loading ? (
          <div role="status" className={`${t.card} flex items-center justify-center gap-3 p-10 ${t.body}`}>
            <Loader2 aria-hidden="true" className={`size-5 animate-spin ${t.accentText}`} />
            Loading your tickets…
          </div>
        ) : error ? (
          <div role="alert" className={`${t.card} flex flex-wrap items-center justify-between gap-3 p-6`}>
            <span>
              <span className="font-semibold text-[#B91C1C]">We couldn’t load your tickets.</span> <span className={t.muted}>{error}</span>
            </span>
            <button type="button" onClick={() => reload()} className={t.smallSecondary}>
              <RotateCcw aria-hidden="true" className="size-4" />
              Try again
            </button>
          </div>
        ) : (
          <div className={tickets.length > 0 ? 'grid items-start gap-5 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]' : 'grid'}>
            {tickets.length > 0 && (
              <TicketList
                tickets={tickets}
                selectedId={showForm ? null : selected?.id}
                onSelect={select}
                onRefresh={refresh}
                refreshing={refreshing}
                t={t}
              />
            )}
            <div ref={detailRef} className="min-w-0 scroll-mt-20">
              {showForm ? (
                <NewTicketForm
                  categories={categories}
                  limits={limits}
                  openCount={openCount}
                  accountEmail={user?.email}
                  canCancel={tickets.length > 0}
                  onCancel={() => setView('thread')}
                  onCreate={handleCreate}
                  t={t}
                />
              ) : (
                selected && <TicketThread key={selected.id} ticket={selected} limits={limits} onReply={handleReply} t={t} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
