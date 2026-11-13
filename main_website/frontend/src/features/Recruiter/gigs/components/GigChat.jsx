import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowDown, MessageSquare, Paperclip, RotateCcw, SendHorizontal, X } from 'lucide-react';
import { Spinner } from '../../components/AccountControls';
import { MUTED } from '../../components/accountStyles';
import { fileNameOf, personFor, safeLink } from '../gigsData';
import useGigChat, { MESSAGE_MAX } from '../../../Gigs/useGigChat';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6]';
const NEAR_BOTTOM_PX = 96;

function timeLabel(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return date.toDateString() === new Date().toDateString() ? time : `${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}`;
}

function Attachment({ url, mine }) {
  const href = safeLink(url);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={`mt-1.5 flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[13px] font-semibold underline-offset-2 hover:underline ${mine ? 'bg-white/15 text-white' : 'bg-[#F1F3F6] text-[#1447E6]'}`}>
      <Paperclip className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="truncate">{fileNameOf(href)}</span>
    </a>
  );
}

function Bubble({ message, mine, author }) {
  if (message.text?.startsWith('[SYSTEM:')) {
    return <div className="self-center rounded-full bg-[#EEF2FE] px-3 py-1 text-center text-xs text-[#334155]">{message.text}</div>;
  }
  return (
    <div className={`flex max-w-[78%] flex-col ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
      {!mine && <span className={`mb-0.5 px-1 text-xs ${MUTED}`}>{author}</span>}
      <div
        className={`whitespace-pre-wrap break-words rounded-[14px] px-3.5 py-2.5 text-sm ${
          mine ? 'rounded-br-[4px] bg-[#1447E6] text-white' : 'rounded-bl-[4px] border border-[#E4E6EA] bg-white text-[#0F172A]'
        }`}
      >
        {message.text}
        <Attachment url={message.fileUrl} mine={mine} />
      </div>
      <time dateTime={message.createdAt} className={`mt-0.5 px-1 text-[11px] ${MUTED}`}>
        {timeLabel(message.createdAt)}
      </time>
    </div>
  );
}

function PendingBubble({ item, onRetry, onDiscard }) {
  const failed = item.status === 'failed';
  return (
    <div className="flex max-w-[78%] flex-col items-end self-end">
      <div className={`whitespace-pre-wrap break-words rounded-[14px] rounded-br-[4px] px-3.5 py-2.5 text-sm ${failed ? 'border border-[#FECACA] bg-[#FEF2F2] text-[#7F1D1D]' : 'bg-[#1447E6]/70 text-white'}`}>
        {item.text}
        {item.file && (
          <span className="mt-1.5 flex items-center gap-1.5 text-[13px] font-semibold">
            <Paperclip className="size-3.5" aria-hidden="true" />
            {item.file.name}
          </span>
        )}
      </div>
      {failed ? (
        <div role="alert" className="mt-1 flex flex-wrap items-center justify-end gap-2 px-1 text-xs text-[#B91C1C]">
          <span>Not sent. {item.error}</span>
          <button type="button" onClick={() => onRetry(item.tempId)} className={`inline-flex items-center gap-1 rounded-[4px] font-semibold text-[#1447E6] hover:underline ${FOCUS}`}>
            <RotateCcw className="size-3" aria-hidden="true" />
            Retry
          </button>
          <button type="button" onClick={() => onDiscard(item.tempId)} className={`rounded-[4px] font-semibold text-[#4B5563] hover:underline ${FOCUS}`}>
            Remove
          </button>
        </div>
      ) : (
        <span className={`mt-0.5 px-1 text-[11px] ${MUTED}`}>Sending…</span>
      )}
    </div>
  );
}

function Composer({ partnerName, onSend }) {
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

  const submit = () => {
    if (tooLong || (!text.trim() && !file)) return;
    if (onSend(text, file)) {
      setText('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      inputRef.current?.focus();
    }
  };

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex shrink-0 flex-col gap-2 border-t border-[#EEF0F3] pt-3"
    >
      {file && (
        <div className="flex items-center gap-2 self-start rounded-[8px] bg-[#F1F3F6] px-2.5 py-1.5 text-[13px]">
          <Paperclip className="size-3.5" aria-hidden="true" />
          <span className="max-w-[240px] truncate">{file.name}</span>
          <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }} aria-label={`Remove ${file.name}`} className={`rounded-[4px] p-0.5 hover:bg-white ${FOCUS}`}>
            <X className="size-3.5" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <label className={`relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-[10px] border border-[#D5D9E0] bg-white text-[#334155] hover:bg-[#F8F8F6] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#1447E6]`} title="Attach a file">
          <Paperclip className="size-[18px]" aria-hidden="true" />
          <span className="sr-only">Attach a file</span>
          <input ref={fileRef} type="file" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        </label>
        <label className="sr-only" htmlFor="gig-chat-input">
          Message {partnerName}
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
          placeholder={`Message ${partnerName}…`}
          aria-invalid={tooLong}
          className={`min-h-11 flex-1 resize-none rounded-[10px] border bg-white px-3.5 py-[11px] text-sm leading-5 text-[#0F172A] placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#1447E6]/20 ${tooLong ? 'border-[#DC2626]' : 'border-[#D5D9E0] focus:border-[#1447E6]'}`}
        />
        <button
          type="submit"
          disabled={tooLong || (!text.trim() && !file)}
          aria-label="Send message"
          className={`flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#1447E6] text-white hover:bg-[#0F38B8] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
        >
          <SendHorizontal className="size-[18px]" aria-hidden="true" />
        </button>
      </div>
      <div className={`flex justify-between gap-2 text-xs ${MUTED}`}>
        <span>Enter to send · Shift + Enter for a new line</span>
        {text.length > MESSAGE_MAX - 200 && <span className={tooLong ? 'font-semibold text-[#B91C1C]' : ''}>{text.length} / {MESSAGE_MAX}</span>}
      </div>
    </form>
  );
}

/**
 * Messages tab of the gig workspace: a private thread with one hired freelancer
 * (chips switch between them), backed by useGigChat.
 */
export default function GigChat({ gig, hired, partnerId, onPartner, currentUserId, token }) {
  const chat = useGigChat({ gigId: gig.id, partnerId, token, enabled: Boolean(partnerId) });
  const scrollRef = useRef(null);
  const nearBottom = useRef(true);
  const lastSeen = useRef({ key: null, count: 0, firstId: null, height: 0 });
  // Conversation with messages below the fold (scoped by key, so switching freelancer clears it).
  const [unseenFor, setUnseenFor] = useState(null);
  const partner = partnerId ? personFor(gig, partnerId) : null;
  const items = chat.messages;
  const key = `${gig.id}:${partnerId}`;
  const unseen = unseenFor === key;

  // Keep the view pinned to the newest message while the reader is at the bottom;
  // otherwise offer "New messages". Loading older history keeps the reader's place.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const seen = lastSeen.current;
    const firstId = items[0]?.id || null;
    const total = items.length + chat.pending.length;
    if (seen.key !== key) {
      el.scrollTop = el.scrollHeight;
    } else if (seen.firstId && firstId !== seen.firstId && items.length > seen.count && el.scrollHeight > seen.height) {
      el.scrollTop += el.scrollHeight - seen.height; // older messages were added above
    } else if (total > seen.count) {
      const lastMine = chat.pending.length > 0 || items[items.length - 1]?.senderId === currentUserId;
      if (nearBottom.current || lastMine) el.scrollTop = el.scrollHeight;
      else setUnseenFor(key);
    }
    lastSeen.current = { key, count: total, firstId, height: el.scrollHeight };
  }, [items, chat.pending.length, key, currentUserId]);

  if (hired.length === 0) {
    return (
      <div className="m-auto flex max-w-[360px] flex-col items-center gap-2 px-6 py-12 text-center">
        <span className="flex size-14 items-center justify-center rounded-[16px] bg-[#EEF2FE] text-[#1447E6]">
          <MessageSquare className="size-6" aria-hidden="true" />
        </span>
        <h3 className="m-0 text-base">
          <span className="font-bold">Chat opens after you hire a freelancer</span>
        </h3>
        <p className={`m-0 ${MUTED}`}>Only freelancers you hire for this gig can be messaged. Hire someone from the pitches on the right.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Choose a freelancer to chat with" className="flex flex-wrap gap-1.5">
          {hired.map((id) => {
            const on = id === partnerId;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => onPartner(id)}
                className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 font-(family-name:--font-headline) text-[13px] font-semibold ${FOCUS} ${
                  on ? 'border-[#1447E6] bg-[#1447E6] text-white' : 'border-[#E4E6EA] bg-white text-[#0F172A] hover:bg-[#F8F8F6]'
                }`}
              >
                {personFor(gig, id).name}
              </button>
            );
          })}
        </div>
        {chat.reconnecting && (
          <span role="status" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#9A6312]">
            <Spinner className="border-[#9A6312]" />
            Reconnecting…
          </span>
        )}
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
            if (nearBottom.current) setUnseenFor(null);
          }}
          role="log"
          aria-live="polite"
          aria-label={`Conversation with ${partner?.name || 'freelancer'}`}
          className="flex min-h-[220px] flex-1 flex-col gap-2.5 overflow-y-auto rounded-[10px] bg-[#FAFAF9] p-3"
        >
          {chat.hasMore && (
            <button type="button" onClick={chat.loadOlder} disabled={chat.loadingOlder} className={`self-center rounded-full border border-[#E4E6EA] bg-white px-3 py-1 text-xs font-semibold text-[#334155] hover:bg-[#F8F8F6] disabled:opacity-60 ${FOCUS}`}>
              {chat.loadingOlder ? 'Loading…' : 'Load earlier messages'}
            </button>
          )}
          {chat.loading ? (
            <div className={`m-auto flex items-center gap-2 ${MUTED}`}>
              <Spinner className="border-[#1447E6]" />
              Loading messages…
            </div>
          ) : chat.error && items.length === 0 ? (
            <p role="alert" className="m-auto max-w-[320px] text-center text-[#B91C1C]">
              Couldn’t load this conversation. {chat.error}
            </p>
          ) : items.length === 0 && chat.pending.length === 0 ? (
            <div className={`m-auto max-w-[320px] text-center ${MUTED}`}>
              <b className="block text-[15px] text-[#0F172A]">No messages yet</b>
              Say hello to {partner?.name} to start the conversation.
            </div>
          ) : (
            <>
              {items.map((message) => (
                <Bubble key={message.id} message={message} mine={message.senderId === currentUserId} author={personFor(gig, message.senderId).name} />
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
              setUnseenFor(null);
            }}
            className={`absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#1447E6] px-3 py-1.5 text-xs font-semibold text-white shadow-md ${FOCUS}`}
          >
            <ArrowDown className="size-3.5" aria-hidden="true" />
            New messages
          </button>
        )}
      </div>

      {chat.error && items.length > 0 && (
        <p role="alert" className="m-0 text-[13px] text-[#B91C1C]">
          {chat.error}
        </p>
      )}

      <Composer key={key} partnerName={partner?.name || 'freelancer'} onSend={chat.send} />
    </div>
  );
}

