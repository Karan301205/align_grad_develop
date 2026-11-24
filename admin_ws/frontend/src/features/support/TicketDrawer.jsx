import { useEffect, useState } from 'react';
import { CircleCheck, Mail, RotateCcw, Send, Tag, UserRound } from 'lucide-react';
import { adminApi } from '../../api/adminApi.js';
import Button from '../../components/ui/Button.jsx';
import Drawer from '../../components/ui/Drawer.jsx';
import DrawerNav from '../../components/ui/DrawerNav.jsx';
import Field, { inputClass } from '../../components/ui/Field.jsx';
import Notice, { LoadError } from '../../components/ui/Notice.jsx';
import { Panel, PanelBody, PanelHeader } from '../../components/ui/Panel.jsx';
import Pill from '../../components/ui/Pill.jsx';
import { Loading } from '../../components/ui/States.jsx';
import useResource from '../../hooks/useResource.js';
import { cx } from '../../utils/cx.js';
import { formatDate, formatDateTime, isEmail } from '../../utils/format.js';
import { REPLY_MAX, replyProblem, requesterLabel, ticketStatusMeta } from '../../utils/support.js';

/** True when ISO time `a` is later than `b`. */
const isNewer = (a, b) => Boolean(a) && (!b || Date.parse(a) > Date.parse(b));

function Message({ message, requesterName }) {
  const fromAdmin = message.author === 'ADMIN';
  return (
    <li className={cx('flex', fromAdmin ? 'justify-end' : 'justify-start')}>
      <div className={cx('max-w-[88%] rounded-xl border px-3.5 py-2.5', fromAdmin ? 'border-accent/20 bg-accent-soft' : 'border-line bg-subtle')}>
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-3 text-xs">
          <span className="font-semibold text-ink-2">{fromAdmin ? 'AlignGrad support' : requesterName}</span>
          <time dateTime={message.createdAt} className="text-muted">{formatDateTime(message.createdAt)}</time>
        </div>
        <p className="whitespace-pre-wrap break-words text-[13.5px] text-ink">{message.body}</p>
      </div>
    </li>
  );
}

/** What the admin is told after an action, honest about the email. */
function outcomeNotice(action, data, email) {
  const who = email || 'the requester';
  const done = { reply: 'Reply sent', replyResolve: 'Reply sent and ticket resolved', RESOLVED: 'Ticket resolved', OPEN: 'Ticket reopened', PENDING: 'Marked as waiting on the requester' }[action];
  if (data.emailSent === true) return { tone: 'success', message: `${done}. ${action === 'RESOLVED' ? 'A short notice was' : 'Your reply was'} emailed to ${who}.` };
  if (data.emailSent === false) {
    return {
      tone: 'warning',
      message: `${done}, but the email to ${who} could not be sent (${data.emailError || 'unknown error'}). It is still shown in their Help & support page.`
    };
  }
  return { tone: 'success', message: `${done}.` };
}

/**
 * The conversation and the reply form for one ticket (keyed by ticket, so a new ticket starts with
 * an empty reply). Reloads itself when the list shows newer activity than it has.
 */
function TicketConversation({ summary, onUpdated, onDraftChange }) {
  const detail = useResource(() => adminApi.getSupportTicket(summary.id), (json) => json.ticket);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(null); // 'reply' | 'replyResolve' | 'RESOLVED' | 'OPEN' | null
  const [feedback, setFeedback] = useState(null);
  const ticket = detail.data;
  const { reload } = detail;
  const shownAt = ticket?.lastMessageAt;

  // The list (refreshed every 30 s) saw newer activity than the conversation on screen: reload it.
  // Only ever forward in time, so the two can't keep triggering each other.
  useEffect(() => {
    if (shownAt && isNewer(summary.lastMessageAt, shownAt)) reload({ silent: true });
  }, [summary.lastMessageAt, shownAt, reload]);

  // The conversation is newer than its row in the list (e.g. after a reload): bring the row up to date.
  useEffect(() => {
    if (ticket && isNewer(ticket.lastMessageAt, summary.lastMessageAt)) onUpdated(ticket);
  }, [ticket, summary.lastMessageAt, onUpdated]);

  // A typed reply keeps a stray click outside the drawer from closing it.
  const changeReply = (value) => {
    setReply(value);
    onDraftChange(value.trim().length > 0);
  };
  useEffect(() => () => onDraftChange(false), [onDraftChange]);

  const apply = (action, data) => {
    if (!data.success) {
      // e.g. the requester wrote again meanwhile (409): show the latest conversation; the reply stays in the box.
      setFeedback({ tone: data.stale ? 'warning' : 'error', message: data.error || 'That did not work. Please try again.' });
      reload({ silent: true });
      return false;
    }
    detail.setData(data.ticket);
    onUpdated(data.ticket);
    setFeedback(outcomeNotice(action, data, data.ticket.requester?.email));
    return true;
  };

  const sendReply = async (resolve) => {
    const problem = replyProblem(reply);
    if (problem) {
      setFeedback({ tone: 'error', message: problem });
      return;
    }
    const action = resolve ? 'replyResolve' : 'reply';
    setBusy(action);
    setFeedback(null);
    try {
      const data = await adminApi.replyToSupportTicket(summary.id, reply.trim(), resolve, ticket.lastMessageAt);
      if (apply(action, data)) changeReply('');
    } catch (err) {
      setFeedback({ tone: 'error', message: err.message });
    } finally {
      setBusy(null);
    }
  };

  const changeStatus = async (status) => {
    setBusy(status);
    setFeedback(null);
    try {
      const data = await adminApi.updateSupportTicketStatus(summary.id, status, ticket.lastMessageAt);
      apply(status, data);
    } catch (err) {
      setFeedback({ tone: 'error', message: err.message });
    } finally {
      setBusy(null);
    }
  };

  if (detail.loading && !ticket) return <Loading>Loading the conversation…</Loading>;
  if (detail.error && !ticket) return <LoadError what="this ticket" message={detail.error} onRetry={() => reload()} />;
  if (!ticket) return null;

  const requester = ticket.requester || {};
  const resolved = ticket.status === 'RESOLVED';
  const firstName = requester.name || requester.email || 'the requester';

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader icon={UserRound} title="Requester" />
        <PanelBody>
          <dl className="grid gap-x-6 gap-y-2 text-[13.5px] sm:grid-cols-2">
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-muted">Name</dt>
              <dd className="break-words">{requesterLabel(requester)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs font-semibold text-muted">Email</dt>
              <dd className="break-all">
                {isEmail(requester.email) ? (
                  <a href={`mailto:${requester.email.trim()}`} className="font-semibold text-accent-ink hover:underline">{requester.email}</a>
                ) : (
                  requester.email || '—'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted">Account</dt>
              <dd>{ticket.roleLabel}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-muted">Topic</dt>
              <dd>{ticket.categoryLabel}</dd>
            </div>
          </dl>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader icon={Mail} title="Conversation" subtitle={`${ticket.messages.length} ${ticket.messages.length === 1 ? 'message' : 'messages'}, oldest first`} />
        <PanelBody>
          <ol className="space-y-3" aria-label="Messages">
            {ticket.messages.map((message) => (
              <Message key={message.id} message={message} requesterName={firstName} />
            ))}
          </ol>
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHeader icon={Send} title={`Reply to ${firstName}`} subtitle="Emailed to them and shown in their Help & support page." />
        <PanelBody className="space-y-3">
          {resolved && <Notice tone="info">This ticket is resolved. “Send reply” reopens it as waiting on the requester; “Send and resolve” keeps it resolved.</Notice>}
          <Field label="Your reply" hint={`${reply.trim().length} / ${REPLY_MAX} characters`}>
            <textarea
              value={reply}
              onChange={(event) => changeReply(event.target.value)}
              rows={5}
              maxLength={REPLY_MAX}
              className={`${inputClass} resize-y`}
            />
          </Field>
          {feedback && <Notice tone={feedback.tone}>{feedback.message}</Notice>}
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={Send} loading={busy === 'reply'} disabled={Boolean(busy)} onClick={() => sendReply(false)}>
              Send reply
            </Button>
            <Button variant="good" icon={CircleCheck} loading={busy === 'replyResolve'} disabled={Boolean(busy)} onClick={() => sendReply(true)}>
              Send and resolve
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
            {resolved ? (
              <Button size="sm" icon={RotateCcw} loading={busy === 'OPEN'} disabled={Boolean(busy)} onClick={() => changeStatus('OPEN')}>
                Reopen ticket
              </Button>
            ) : (
              <Button size="sm" icon={CircleCheck} loading={busy === 'RESOLVED'} disabled={Boolean(busy)} onClick={() => changeStatus('RESOLVED')}>
                Mark resolved without replying
              </Button>
            )}
            <span className="text-xs text-muted">{resolved ? 'Moves it back to Needs reply. No email is sent.' : 'Emails them a short “resolved” notice.'}</span>
          </div>
        </PanelBody>
      </Panel>
    </div>
  );
}

/**
 * One ticket in the right-hand panel: who raised it, the whole conversation, and the reply form.
 * `position` and `total` place it in the list being browsed; Previous / Next move through it.
 * `onUpdated(ticket)` receives the ticket as the server saved it.
 */
export default function TicketDrawer({ summary, position, total, onPrev, onNext, onClose, onUpdated }) {
  const [drafting, setDrafting] = useState(false);
  const meta = ticketStatusMeta(summary.status);
  const raised = formatDate(summary.createdAt);

  return (
    <Drawer
      title={summary.subject}
      scrollKey={summary.id}
      closeOnBackdrop={!drafting}
      onClose={onClose}
      footer={<DrawerNav noun="ticket" label={`${summary.reference} ${summary.subject}`} position={position} total={total} onPrev={onPrev} onNext={onNext} />}
      subtitle={
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          <li className="flex items-center gap-1.5">
            <Tag className="size-3.5 shrink-0" aria-hidden="true" />
            {summary.reference}
          </li>
          <li className="flex min-w-0 items-center gap-1.5">
            <UserRound className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-all">{requesterLabel(summary.requester)} · {summary.roleLabel}</span>
          </li>
        </ul>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Pill tone={meta.tone}>{meta.label}</Pill>
        {raised && <Pill tone="neutral">Raised {raised}</Pill>}
        <Pill tone="info">{summary.categoryLabel}</Pill>
      </div>
      <TicketConversation key={summary.id} summary={summary} onUpdated={onUpdated} onDraftChange={setDrafting} />
    </Drawer>
  );
}
