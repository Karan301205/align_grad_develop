import AccountIcon from '../../components/AccountIcon';
import { CARD, CARD_TITLE, LINK, MUTED } from '../../components/accountStyles';
import { FieldError } from '../../components/AccountControls';

/** White card section from the design (12px radius, #E4E6EA border). */
export function Card({ labelledBy, className = '', children }) {
  return (
    <section aria-labelledby={labelledBy} className={`${CARD} flex min-w-0 flex-col px-5 py-[22px] sm:px-6 ${className}`}>
      {children}
    </section>
  );
}

export function CardTitle({ id, children }) {
  return (
    <h2 id={id} className={CARD_TITLE}>
      <span className="font-semibold">{children}</span>
    </h2>
  );
}

/** "Locked during review" note in a card header. */
export function LockedNote({ children }) {
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13px] ${MUTED}`}>
      <AccountIcon name="lock" size={14} />
      {children}
    </span>
  );
}

/**
 * Read-only fields for a locked profile: the same labels and 44px bordered boxes as
 * the form, on a grey fill, so locked details still read as fields.
 * `items`: [{ label, value, href?, multiline?, wide? }]. Empty values show "Not added".
 */
export function Details({ items }) {
  return (
    <dl className="m-0 grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
      {items.map(({ label, value, href, multiline, wide }) => (
        <div key={label} className={`flex min-w-0 flex-col gap-1.5 ${wide ? 'md:col-span-2' : ''}`}>
          <dt className="font-semibold">{label}</dt>
          <dd
            className={`m-0 flex min-w-0 rounded-[8px] border border-[#D5D9E0] bg-[#F8F8F6] px-3 break-words ${
              multiline ? 'min-h-[92px] items-start whitespace-pre-line py-2.5 leading-relaxed' : 'min-h-11 items-center py-2'
            } ${value ? 'text-[#0F172A]' : 'text-[#6B7280]'}`}
          >
            {!value ? 'Not added' : href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className={`${LINK} min-w-0 break-all`}>
                {value}
              </a>
            ) : (
              value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Label + control + error/hint. The wrapper id lets the form scroll to the first error. */
export function Field({ id, label, required, error, hint, className = '', children }) {
  return (
    <div id={`field-${id}`} className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="font-semibold">
        {label}
        {required && <span className="text-[#B91C1C]"> *</span>}
      </label>
      {children}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : hint}
    </div>
  );
}
