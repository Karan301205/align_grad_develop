import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, Paperclip, RotateCcw, SendHorizontal, X } from 'lucide-react';
import useGigChat, { MESSAGE_MAX } from '../../Gigs/useGigChat';
import { MUTED } from '../profile/profileTheme';
import { Spinner } from '../profile/ui';
import { fileNameOf, safeLink } from './gigsData';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0167F6]';
const NEAR_BOTTOM_PX = 96;

const dayKey = (value) => new Date(value).toDateString();
function dayLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', ...(date.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }) });
}
const timeLabel = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
};

function Attachment({ url, mine }) {
  const href = safeLink(url);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`mt-1.5 flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[14px] font-semibold underline-offset-2 hover:underline ${mine ? 'bg-white/15 text-white' : 'bg-[#F4F6FE] text-[#0B3FA8]'}`}>
      <Paperclip aria-hidden="true" className="size-3.5 shrink-0" />
      <span className="truncate">{fileNameOf(href)}</span>
    </a>
  );
}

function Bubble({ message, mine, author }) {
  return (
    <div className={`flex max-w-[80%] flex-col ${mine ? 'items-end self-end' : 'items-start self-start'}`}>
      {!mine && <span className={`mb-0.5 px-1 text-[12.5px] ${MUTED}`}>{author}</span>}
      <div className={`whitespace-pre-wrap break-words rounded-[14px] px-3.5 py-2.5 text-[15px] ${mine ? 'rounded-tr-[4px] bg-[linear-gradient(135deg,#0167F6,#4F5FE0)] text-white' : 'rounded-tl-[4px] border border-[#E1E5F2] bg-white text-[#0E1B3D]'}`}>
        {message.text}
        <Attachment url={message.fileUrl} mine={mine} />
      </div>
      <time dateTime={message.createdAt} className={`mt-0.5 px-1 text-[12px] ${MUTED}`}>
        {timeLabel(message.createdAt)}
      </time>
    </div>
  );
}

function PendingBubble({ item, onRetry, onDiscard }) {
  const failed = item.status === 'failed';
  return (
    <div className="flex max-w-[80%] flex-col items-end self-end">
      <div className={`whitespace-pre-wrap break-words rounded-[14px] rounded-tr-[4px] px-3.5 py-2.5 text-[15px] ${failed ? 'border border-[#F3C5C0] bg-[#FFF5F4] text-[#8C1D14]' : 'bg-[#0167F6]/70 text-white'}`}>
        {item.text}
        {item.file && (
          <span className="mt-1.5 flex items-center gap-1.5 text-[14px] font-semibold">
            <Paperclip aria-hidden="true" className="size-3.5" />
            {item.file.name}
          </span>
        )}
      </div>
      {failed ? (
        <div role="alert" className="mt-1 flex flex-wrap items-center justify-end gap-2 px-1 text-[13px] text-[#B42318]">
          <span>Not sent. {item.error}</span>
          <button type="button" onClick={() => onRetry(item.tempId)} className={`inline-flex items-center gap-1 rounded-[4px] font-semibold text-[#0167F6] hover:underline ${FOCUS}`}>
            <RotateCcw aria-hidden="true" className="size-3" /> Retry
          </button>
          <button type="button" onClick={() => onDiscard(item.tempId)} className={`rounded-[4px] font-semibold text-[#475373] hover:underline ${FOCUS}`}>
            Remove
          </button>
        </div>
      ) : (
        <span className={`mt-0.5 px-1 text-[12px] ${MUTED}`}>Sending…</span>
      )}
    </div>
  );
}

function Composer({ company, onSend, extra }) {
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const tooLong = text.length > MESSAGE_MAX;

  // Grow with the text up to ~6 lines.
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [text]);

  const clearFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = '';
  };
  const submit = () => {
    if (tooLong || (!text.trim() && !file)) return;
    if (onSend(text, file)) {
      setText('');
      clearFile();
      inputRef.current?.focus();
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2"
    >
      {file && (
        <span className="flex items-center gap-2 self-start rounded-[8px] bg-[#F4F6FE] px-2.5 py-1.5 text-[14px]">
          <Paperclip aria-hidden="true" className="size-3.5" />
          <span className="max-w-[240px] truncate font-semibold">{file.name}</span>
          <button type="button" onClick={clearFile} aria-label={`Remove ${file.name}`} className={`rounded-[4px] p-0.5 hover:bg-white ${FOCUS}`}>
            <X className="size-3.5" />
          </button>
        </span>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#C9D1E3] bg-white text-[#1B2B55] hover:border-[#6378F9] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#0167F6]" title="Attach a file">
          <Paperclip aria-hidden="true" className="size-[18px]" />
          <span className="sr-only">Attach a file</span>
          <input ref={fileRef} type="file" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <label className="sr-only" htmlFor="gig-chat-input">
          Message {company}
        </label>
        <textarea
          id="gig-chat-input"
          ref={inputRef}
          rows={1}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={`Message ${company}`}
          aria-invalid={tooLong}
          className={`min-h-11 min-w-[160px] flex-1 resize-none rounded-[10px] border bg-white px-3.5 py-[11px] text-[15px] leading-5 text-[#0E1B3D] placeholder:text-[#6B7591] focus:outline-none focus:ring-[3px] focus:ring-[#0167F6]/15 ${tooLong ? 'border-[#C8281C]' : 'border-[#C9D1E3] focus:border-[#0167F6]'}`}
        />
        <button type="submit" disabled={tooLong || (!text.trim() && !file)} className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] bg-[#0E1B3D] px-4 text-[15px] font-semibold text-white hover:bg-[#1E3A8A] disabled:cursor-not-allowed disabled:opacity-45 ${FOCUS}`}>
          <SendHorizontal aria-hidden="true" className="size-[18px]" /> Send
        </button>
        {extra}
      </div>
      <div className={`flex justify-between gap-2 text-[12.5px] ${MUTED}`}>
        <span>Enter to send · Shift + Enter for a new line</span>
        {text.length > MESSAGE_MAX - 200 && <span className={tooLong ? 'font-semibold text-[#B42318]' : ''}>{text.length} / {MESSAGE_MAX}</span>}
      </div>
    </form>
  );
}

/**
 * The candidate's private chat with the company on a gig they were hired for
 * (GET/POST /gigs/:id/messages through useGigChat: incremental polling, ordered
 * sends with retry). `myIds` are the ids the candidate's messages can carry.
 */
export default function GigChat({ gig, company, myIds, token, extra }) {
  const chat = useGigChat({ gigId: gig.id, token, enabled: true });
  const scrollRef = useRef(null);
  const nearBottom = useRef(true);
  const lastSeen = useRef({ key: null, count: 0, firstId: null, height: 0 });
  const [unseen, setUnseen] = useState(false);
  const items = chat.messages;
  const mine = (message) => myIds.includes(message.senderId);

  // Stay at the newest message while the reader is at the bottom; otherwise offer
  // "New messages". Loading older history keeps the reader's place.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const seen = lastSeen.current;
    const firstId = items[0]?.id || null;
    const total = items.length + chat.pending.length;
    if (seen.key !== gig.id) {
      el.scrollTop = el.scrollHeight;
    } else if (seen.firstId && firstId !== seen.firstId && items.length > seen.count && el.scrollHeight > seen.height) {
      el.scrollTop += el.scrollHeight - seen.height;
    } else if (total > seen.count) {
      const last = items[items.length - 1];
      if (nearBottom.current || chat.pending.length > 0 || (last && myIds.includes(last.senderId))) el.scrollTop = el.scrollHeight;
      else setUnseen(true);
    }
    lastSeen.current = { key: gig.id, count: total, firstId, height: el.scrollHeight };
  }, [items, chat.pending.length, gig.id, myIds]);

  return (
    <div className="flex min-h-0 flex-col">
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
            if (nearBottom.current) setUnseen(false);
          }}
          role="log"
          aria-live="polite"
          aria-label={`Messages with ${company}`}
          className="flex h-[min(56vh,460px)] min-h-[280px] flex-col gap-3 overflow-y-auto bg-[#F7F8FD] px-4 py-4 sm:px-6"
        >
          {chat.hasMore && (
            <button type="button" onClick={chat.loadOlder} disabled={chat.loadingOlder} className={`self-center rounded-full border border-[#E1E5F2] bg-white px-3 py-1 text-[13px] font-semibold text-[#1B2B55] hover:border-[#6378F9] disabled:opacity-60 ${FOCUS}`}>
              {chat.loadingOlder ? 'Loading…' : 'Load earlier messages'}
            </button>
          )}
          {chat.loading ? (
            <div className={`m-auto flex items-center gap-2 ${MUTED}`}>
              <Spinner className="size-5 text-[#0167F6]" /> Loading messages…
            </div>
          ) : chat.error && items.length === 0 ? (
            <p role="alert" className="m-auto max-w-[340px] text-center font-medium text-[#8C1D14]">
              Messages couldn’t be loaded. {chat.error}
            </p>
          ) : items.length === 0 && chat.pending.length === 0 ? (
            <div className={`m-auto max-w-[340px] text-center ${MUTED}`}>
              <b className="block text-[15px] text-[#0E1B3D]">No messages yet</b>
              Say hello to {company} to get started.
            </div>
          ) : (
            <>
              {items.map((message, index) => (
                <Fragment key={message.id}>
                  {(index === 0 || dayKey(message.createdAt) !== dayKey(items[index - 1].createdAt)) && <span className={`self-center text-[12.5px] font-semibold ${MUTED}`}>{dayLabel(message.createdAt)}</span>}
                  <Bubble message={message} mine={mine(message)} author={company} />
                </Fragment>
              ))}
              {chat.pending.map((item) => (
                <PendingBubble key={item.tempId} item={item} onRetry={chat.retry} onDiscard={chat.discard} />
              ))}
            </>
          )}
        </div>
        {unseen && (
          <button
            type="button"
            onClick={() => {
              const el = scrollRef.current;
              if (el) el.scrollTop = el.scrollHeight;
              setUnseen(false);
            }}
            className={`absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#0167F6] px-3 py-1.5 text-[13px] font-semibold text-white shadow-md ${FOCUS}`}
          >
            <ArrowDown aria-hidden="true" className="size-3.5" /> New messages
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2 border-t border-[#EEF0F6] px-4 pb-5 pt-4 sm:px-6">
        {chat.reconnecting && (
          <span role="status" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#8A3F06]">
            <Spinner /> Reconnecting…
          </span>
        )}
        {chat.error && items.length > 0 && (
          <p role="alert" className="m-0 text-[13px] font-medium text-[#B42318]">
            {chat.error}
          </p>
        )}
        <Composer company={company} onSend={chat.send} extra={extra} />
      </div>
    </div>
  );
}
