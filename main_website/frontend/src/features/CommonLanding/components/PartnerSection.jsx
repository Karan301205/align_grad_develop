import { useState } from 'react';
import { PARTNER_TYPES, PARTNER_PERKS, SUPPORT_EMAIL } from '../content';
import { Icon } from '../../../components/landing/Icon';
import { Kicker } from '../../../components/landing/ui';
import { WRAP, SECTION, ANCHOR, HEADING, BOLD, LIGHT, SLAB, GRADIENT, SWAP, buttonClass, BUTTON_ICON } from '../../../components/landing/classNames';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMPTY_FORM = { org: '', name: '', email: '', phone: '', message: '' };

const FIELD = 'w-full rounded-[12px] border-0 bg-white text-[15px] text-(--ag-pine) outline-0 transition-shadow duration-200';
const FIELD_OK = 'shadow-[inset_0_0_0_1.5px_var(--ag-line)] focus:shadow-[inset_0_0_0_2px_var(--ag-blue)]';
const FIELD_BAD = 'shadow-[inset_0_0_0_2px_var(--ag-danger)]';
const INPUT = `${FIELD} min-h-[50px] px-3.5`;
const SELECT =
  `${FIELD} ${FIELD_OK} min-h-[50px] pl-3.5 pr-10 appearance-none bg-no-repeat [background-size:5px_5px] ` +
  'bg-[linear-gradient(45deg,transparent_50%,#4A5A68_50%),linear-gradient(135deg,#4A5A68_50%,transparent_50%)] ' +
  '[background-position:calc(100%-20px)_22px,calc(100%-15px)_22px]';
const TEXTAREA = `${FIELD} ${FIELD_OK} min-h-[110px] px-3.5 py-3 leading-[1.5] resize-y`;
const LABEL = 'flex flex-col gap-[7px] text-[13.5px] font-medium';
const ERROR = 'text-[12.5px] font-medium text-(--ag-danger)';

function validate(form) {
  return {
    org: !form.org.trim(),
    name: !form.name.trim(),
    email: !EMAIL_PATTERN.test(form.email.trim())
  };
}

/** There is no partnership endpoint yet, so the request goes out through the visitor's email app. */
function openPartnershipEmail(type, size, form) {
  const lines = [
    `Partnership type: ${type.label}`,
    `${type.orgLabel}: ${form.org.trim()}`,
    `Name: ${form.name.trim()}`,
    `Work email: ${form.email.trim()}`,
    form.phone.trim() && `Phone: ${form.phone.trim()}`,
    `${type.sizeLabel}: ${size}`,
    form.message.trim() && `\n${form.message.trim()}`
  ].filter(Boolean);
  const subject = `${type.label} request: ${form.org.trim()}`;
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join('\n'))}`;
}

function PartnerPitch() {
  return (
    <div className="relative flex flex-col gap-6 overflow-hidden bg-(--ag-pine) p-12 text-white max-[900px]:px-5 max-[900px]:py-[26px]">
      <span aria-hidden="true" className={`absolute -bottom-[60px] -right-20 h-[250px] w-[340px] opacity-40 ${SLAB} ${GRADIENT}`} />
      <div className="relative flex flex-col gap-[18px]">
        <Kicker tone="mint">Partner with us</Kicker>
        <h2 id="partner-title" className={`${HEADING} text-[clamp(32px,3.4vw,46px)] leading-[.98] tracking-[-.045em]`}>
          <span className={BOLD}>Build the skill-first</span> <span className={LIGHT}>pipeline with us.</span>
        </h2>
      </div>
      <p className="relative max-w-[40ch] text-[16px] text-white/78">
        Tell us a little about your organisation and our partnerships team will get back to you within two working days.
      </p>
      <ul className="relative flex flex-col gap-4">
        {PARTNER_PERKS.map((perk) => (
          <li key={perk.title} className="flex gap-3.5">
            <span className="flex size-10 flex-none items-center justify-center bg-white/10 text-(--ag-mint)">
              <Icon name={perk.icon} />
            </span>
            <span>
              <strong className="block font-semibold">{perk.title}</strong>
              <span className="text-[14.5px] text-white/72">{perk.body}</span>
            </span>
          </li>
        ))}
      </ul>
      <a href={`mailto:${SUPPORT_EMAIL}`} className="relative mt-auto inline-flex items-center gap-2 text-[14.5px] text-white">
        <Icon name="mail" className="size-[18px] text-(--ag-mint)" />
        {SUPPORT_EMAIL}
      </a>
    </div>
  );
}

function PartnerForm({ onSent }) {
  const [typeIndex, setTypeIndex] = useState(0);
  const [size, setSize] = useState(PARTNER_TYPES[0].sizeOptions[0]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const type = PARTNER_TYPES[typeIndex];

  const pickType = (index) => {
    setTypeIndex(index);
    setSize(PARTNER_TYPES[index].sizeOptions[0]);
  };

  const update = (key) => (event) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const submit = (event) => {
    event.preventDefault();
    const found = validate(form);
    if (found.org || found.name || found.email) {
      setErrors(found);
      return;
    }
    openPartnershipEmail(type, size, form);
    onSent({ typeName: type.name, org: form.org.trim(), name: form.name.trim(), email: form.email.trim() });
    setForm(EMPTY_FORM);
    setErrors({});
  };

  const inputClass = (key) => `${INPUT} ${errors[key] ? FIELD_BAD : FIELD_OK}`;

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-[18px]">
      <div className={LABEL}>
        <span>I’m interested in</span>
        <div role="group" aria-label="Partnership type" className="grid grid-cols-3 gap-1 rounded-[14px] bg-(--ag-mist) p-[5px]">
          {PARTNER_TYPES.map((option, i) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={i === typeIndex}
              onClick={() => pickType(i)}
              className={`min-h-11 cursor-pointer rounded-[10px] border-0 text-[13.5px] font-semibold leading-[normal] transition-colors duration-200 max-[900px]:text-[12.5px] ${
                i === typeIndex
                  ? 'bg-white text-(--ag-pine) shadow-[0_1px_2px_rgba(2,56,54,.12),0_0_0_1px_var(--ag-line)]'
                  : 'bg-transparent text-(--ag-mute)'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 max-[900px]:grid-cols-1">
        <div className={LABEL}>
          <label htmlFor="pf-org">{type.orgLabel} *</label>
          <input id="pf-org" type="text" autoComplete="organization" placeholder={type.orgPlaceholder} value={form.org} onChange={update('org')} aria-invalid={Boolean(errors.org)} className={inputClass('org')} />
          {errors.org && <span className={ERROR}>Please add your organisation’s name.</span>}
        </div>
        <div className={LABEL}>
          <label htmlFor="pf-name">Your name *</label>
          <input id="pf-name" type="text" autoComplete="name" placeholder="e.g. Rahul Verma" value={form.name} onChange={update('name')} aria-invalid={Boolean(errors.name)} className={inputClass('name')} />
          {errors.name && <span className={ERROR}>Please add your name.</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3.5 max-[900px]:grid-cols-1">
        <div className={LABEL}>
          <label htmlFor="pf-email">Work email *</label>
          <input id="pf-email" type="email" autoComplete="email" placeholder="you@organisation.com" value={form.email} onChange={update('email')} aria-invalid={Boolean(errors.email)} className={inputClass('email')} />
          {errors.email && <span className={ERROR}>Please enter a valid email address.</span>}
        </div>
        <div className={LABEL}>
          <label htmlFor="pf-phone">Phone <span className="font-normal text-(--ag-mute)">(optional)</span></label>
          <input id="pf-phone" type="tel" autoComplete="tel" placeholder="+91 98765 43210" value={form.phone} onChange={update('phone')} className={`${INPUT} ${FIELD_OK}`} />
        </div>
      </div>

      <div className={LABEL}>
        <label htmlFor="pf-size">{type.sizeLabel}</label>
        <select id="pf-size" value={size} onChange={(event) => setSize(event.target.value)} className={SELECT}>
          {type.sizeOptions.map((option) => <option key={option}>{option}</option>)}
        </select>
      </div>

      <div className={LABEL}>
        <label htmlFor="pf-msg">What would you like to do together? <span className="font-normal text-(--ag-mute)">(optional)</span></label>
        <textarea id="pf-msg" placeholder={type.messagePlaceholder} value={form.message} onChange={update('message')} className={TEXTAREA} />
      </div>

      <button type="submit" className={buttonClass('pine', 'md', 'w-full')}>
        Send partnership request <Icon name="arrowRight" className={`size-5 ${BUTTON_ICON}`} />
      </button>
      <p className="text-center text-[12.5px] text-(--ag-mute)">We only use these details to reply to your request.</p>
    </form>
  );
}

function SentMessage({ request, onReset }) {
  return (
    <div role="status" className={`flex flex-col items-start gap-[18px] py-6 ${SWAP}`}>
      <span className="flex size-16 items-center justify-center bg-(--ag-mint) text-(--ag-pine)">
        <Icon name="check" strokeWidth={2.2} className="size-[30px]" />
      </span>
      <h3 className={`${HEADING} text-[32px] leading-[.98] tracking-[-.045em]`}>
        <span className={BOLD}>Thanks, {request.name}.</span>
      </h3>
      <p className="max-w-[44ch] text-[16px] text-(--ag-mute)">
        Your email app should now be open with your {request.typeName} request for{' '}
        <strong className="font-semibold text-(--ag-pine)">{request.org}</strong>. Send it to {SUPPORT_EMAIL} and our partnerships team will reply to {request.email} within two working days.
      </p>
      <button type="button" onClick={onReset} className={buttonClass('line', 'sm')}>Send another request</button>
    </div>
  );
}

export default function PartnerSection() {
  const [sentRequest, setSentRequest] = useState(null);

  return (
    <section id="partner" aria-labelledby="partner-title" className={`${SECTION} ${ANCHOR}`}>
      <div className={WRAP}>
        <div className="grid grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] overflow-hidden rounded-[32px] shadow-[0_0_0_1px_var(--ag-line),0_40px_80px_-50px_rgba(2,56,54,.6)] max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:rounded-[24px]">
          <PartnerPitch />
          <div className="flex flex-col gap-[18px] bg-white p-12 max-[900px]:px-5 max-[900px]:py-[26px]">
            {sentRequest
              ? <SentMessage request={sentRequest} onReset={() => setSentRequest(null)} />
              : <PartnerForm onSent={setSentRequest} />}
          </div>
        </div>
      </div>
    </section>
  );
}
