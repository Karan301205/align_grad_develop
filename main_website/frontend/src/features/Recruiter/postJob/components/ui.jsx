import AccountIcon from '../../components/AccountIcon';
import { FieldError } from '../../components/AccountControls';
import { CARD, MUTED, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../../components/accountStyles';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6]';

/** The main step card: 20px heading, intro line, then the step's fields. */
export function StepPanel({ id, title, intro, children }) {
  return (
    <section aria-labelledby={id} className={`${CARD} flex min-w-0 grow-[999] basis-[560px] flex-col gap-[22px] p-5 sm:p-[26px]`}>
      <div className="flex flex-col gap-1.5">
        <h2 id={id} className="m-0 text-xl leading-[1.3] tracking-normal text-[#0F172A]">
          <span className="font-bold">{title}</span>
        </h2>
        {intro && <p className={`m-0 max-w-[620px] ${MUTED}`}>{intro}</p>}
      </div>
      {children}
    </section>
  );
}

/** A 16px sub-heading inside a step, separated by a rule. */
export function SubSection({ id, title, note, intro, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-3 border-t border-[#EEF0F3] pt-5 ${className}`}>
      <div className="flex flex-col gap-0.5">
        <h3 id={id} className="m-0 text-base leading-[1.45] tracking-normal text-[#0F172A]">
          <span className="font-semibold">{title}</span>
          {note && <span className={`font-normal ${MUTED}`}> · {note}</span>}
        </h3>
        {intro && <span className={`text-[13px] ${MUTED}`}>{intro}</span>}
      </div>
      {children}
    </div>
  );
}

/** 13px label, control, then the error or a 12px hint. The wrapper id is used to focus errors. */
/** Red asterisk after the label of a field that must be filled in. */
export function RequiredMark() {
  return (
    <span className="text-[#B91C1C]" aria-hidden="true">
      {' '}*
    </span>
  );
}

export function Field({ id, label, required, optional, error, hint, className = '', children }) {
  return (
    <div id={`field-${id}`} className={`flex min-w-0 flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
        {required && <RequiredMark />}
        {required && <span className="sr-only"> (required)</span>}
        {optional && <span className={`font-normal ${MUTED}`}> · optional</span>}
      </label>
      {children}
      {error ? <FieldError id={`${id}-error`}>{error}</FieldError> : hint && <span className={`text-xs ${MUTED}`}>{hint}</span>}
    </div>
  );
}

/** Input with a fixed prefix or suffix box (₹ / days / months). */
export function AddonInput({ id, prefix, suffix, error, ...inputProps }) {
  const addon = `flex h-full items-center bg-[#F8F8F6] px-3 ${MUTED}`;
  return (
    <div
      className={`flex h-11 overflow-hidden rounded-[8px] border bg-white focus-within:border-[#1447E6] focus-within:ring-2 focus-within:ring-[#1447E6]/20 ${
        error ? 'border-[#DC2626]' : 'border-[#D5D9E0]'
      }`}
    >
      {prefix && <span className={`${addon} border-r border-[#D5D9E0] font-semibold text-[#0F172A]`}>{prefix}</span>}
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-[#0F172A] placeholder:text-[#6B7280] focus:outline-none"
        {...inputProps}
      />
      {suffix && <span className={`${addon} border-l border-[#D5D9E0]`}>{suffix}</span>}
    </div>
  );
}

/** Rounded pill buttons where one is pressed (Hours). */
export function PillGroup({ label, options, value, onChange, required }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="font-medium text-[#334155]">
        {label}
        {required && <RequiredMark />}
      </span>
      {options.map((option) => {
        const pressed = option === value;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(option)}
            className={`h-10 rounded-full border px-3.5 font-(family-name:--font-headline) text-sm font-semibold transition-colors ${FOCUS} ${
              pressed ? 'border-[#1447E6] bg-[#1447E6] text-white' : 'border-[#D5D9E0] bg-white text-[#334155] hover:bg-[#F8F8F6]'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

/** On/off switch (design: 48×28 track). */
export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${FOCUS} ${checked ? 'bg-[#1447E6]' : 'bg-[#D1D5DB]'}`}
    >
      <span className={`absolute top-1 size-5 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-[left] ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  );
}

/** Small grey chip ("SQL ≥ 7"). */
export function Chip({ children }) {
  return <span className="rounded-[6px] bg-[#F1F3F6] px-2 py-[3px] text-xs font-medium text-[#334155]">{children}</span>;
}

/** Back / Continue row at the bottom of a step. */
export function StepFooter({ backLabel = 'Back', onBack, nextLabel, onNext, children }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EEF0F3] pt-4">
      <button type="button" onClick={onBack} className={`${SECONDARY_BUTTON} h-11 px-[18px]`}>
        {backLabel}
      </button>
      {children || (
        <button type="button" onClick={onNext} className={`${PRIMARY_BUTTON} h-11 px-5`}>
          {nextLabel}
          <AccountIcon name="arrow-right" size={16} strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

/** Text button (Edit / Remove / + Add option). */
export function TextButton({ tone = 'blue', className = '', children, ...props }) {
  const color = tone === 'red' ? 'text-[#B91C1C] hover:text-[#7F1D1D]' : 'text-[#1447E6] hover:text-[#0F38B8]';
  return (
    <button type="button" className={`h-8 rounded-[6px] px-2 font-(family-name:--font-headline) text-[13px] font-semibold ${color} ${FOCUS} disabled:opacity-40 ${className}`} {...props}>
      {children}
    </button>
  );
}

/** Right-column card with a 15px muted heading. */
export function SideCard({ id, title, action, children, live }) {
  return (
    <section aria-labelledby={id} aria-live={live ? 'polite' : undefined} className={`${CARD} flex min-w-0 flex-col gap-2.5 p-[22px]`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={id} className="m-0 text-[15px] leading-[1.45] tracking-normal text-[#4B5563]">
          <span className="font-semibold">{title}</span>
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
