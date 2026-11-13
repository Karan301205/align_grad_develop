import GoogleAuthButton from '../../../components/ui/GoogleAuthButton';
import { renderFormattedMessage } from '../../../utils/errorFormatter';
import { Icon } from '../../../components/landing/Icon';
import { HEADING, BOLD, buttonClass, BUTTON_ICON } from '../../../components/landing/classNames';
import { CARD_SURFACE, RISE_AUTH, SWAP, LINK_BUTTON } from '../../../components/landing/portalLayout';

const INPUT =
  'min-h-12 min-w-0 flex-1 border-0 bg-transparent text-[15px] font-normal text-(--ag-pine) outline-0 placeholder:text-[#748391]';

/**
 * Labelled input row with a leading icon (design `.fl` + `.field`).
 * The rounded row draws the focus ring (focus-within), so the input's own
 * outline is switched off; otherwise the page-wide FOCUS_RING (AuthView /
 * RecruiterLandingPage) draws a square box inside the rounded field.
 */
function Field({ id, label, icon, children }) {
  return (
    <div className="flex flex-col gap-[7px] text-[13.5px] font-medium">
      <label htmlFor={id}>{label}</label>
      <div className="flex min-h-[52px] items-center gap-2.5 rounded-[12px] bg-white pl-3.5 pr-1.5 text-(--ag-mute) shadow-[inset_0_0_0_1.5px_var(--ag-line)] transition-shadow duration-200 focus-within:shadow-[inset_0_0_0_2px_var(--ag-accent)] [&_input:focus-visible]:outline-none">
        <Icon name={icon} />
        {children}
      </div>
    </div>
  );
}

/** Sign-up / Sign in toggle (design `.seg`). */
function ModeSwitch({ mode, tabs, onChange }) {
  const option = (value) => (
    <button
      type="button"
      aria-pressed={mode === value}
      onClick={() => onChange(value)}
      className={`min-h-11 cursor-pointer rounded-[10px] border-0 text-[14px] font-semibold leading-[normal] transition-[background-color,color,box-shadow] duration-200 ${
        mode === value
          ? 'bg-white text-(--ag-pine) shadow-[0_1px_2px_rgba(2,56,54,.12),0_0_0_1px_var(--ag-line)]'
          : 'bg-transparent text-(--ag-mute)'
      }`}
    >
      {tabs[value]}
    </button>
  );
  return (
    <div role="group" aria-label="Account" className="grid grid-cols-2 gap-1 rounded-[14px] bg-(--ag-mist) p-[5px]">
      {option('signup')}
      {option('login')}
    </div>
  );
}

/**
 * The hero's sign-up / sign-in card for the candidate and recruiter landing pages.
 * State and API calls come from useLandingAuth (`auth`); `config` carries the
 * page's wording and look:
 *   { idPrefix, tabs, copy: { signup, login }, nameField, emailPlaceholder, ctaVariant, signupNote: { icon, text } }
 */
export default function LandingAuthCard({ auth, config }) {
  const copy = config.copy[auth.mode];
  const isSignup = !auth.isLogin;
  const id = (name) => `${config.idPrefix}-${name}`;

  return (
    <div id="auth" className={`relative flex scroll-mt-24 flex-col gap-[18px] rounded-[24px] p-7 [grid-area:b] max-[900px]:p-[22px] ${CARD_SURFACE} ${RISE_AUTH}`}>
      <ModeSwitch mode={auth.mode} tabs={config.tabs} onChange={auth.switchMode} />

      <div key={auth.mode} className={`flex flex-col gap-1.5 ${SWAP}`}>
        <h2 className={`${HEADING} text-[30px] leading-[.98] tracking-[-.04em]`}>
          <span className={BOLD}>{copy.title}</span>
        </h2>
        <p className="text-[14.5px] text-(--ag-mute)">{copy.subtitle}</p>
      </div>

      <form onSubmit={auth.submit} className="flex flex-col gap-[18px]">
        {isSignup && (
          <Field id={id('name')} label={config.nameField.label} icon={config.nameField.icon}>
            <input
              id={id('name')}
              type="text"
              autoComplete={config.nameField.autoComplete}
              required
              placeholder={config.nameField.placeholder}
              value={auth.fields.name}
              onChange={auth.updateField('name')}
              className={INPUT}
            />
          </Field>
        )}
        <Field id={id('email')} label={config.emailLabel} icon="mail">
          <input id={id('email')} type="email" autoComplete="email" required placeholder={config.emailPlaceholder} value={auth.fields.email} onChange={auth.updateField('email')} className={INPUT} />
        </Field>
        <Field id={id('pw')} label="Password" icon="lock">
          <input
            id={id('pw')}
            type={auth.showPassword ? 'text' : 'password'}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            required
            placeholder="At least 8 characters"
            value={auth.fields.password}
            onChange={auth.updateField('password')}
            className={INPUT}
          />
          <button
            type="button"
            aria-label={auth.showPassword ? 'Hide password' : 'Show password'}
            onClick={auth.toggleShowPassword}
            className="flex size-10 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent text-(--ag-mute)"
          >
            <Icon name="eye" />
          </button>
        </Field>

        {auth.isLogin && (
          <div className="flex items-center justify-between text-[14px]">
            <label className="inline-flex min-h-8 cursor-pointer items-center gap-2">
              <input type="checkbox" checked={auth.rememberMe} onChange={(event) => auth.setRememberMe(event.target.checked)} className="size-[18px] accent-(--ag-accent)" />
              Remember me
            </label>
            <button type="button" onClick={auth.forgotPassword.open} className={LINK_BUTTON}>Forgot password?</button>
          </div>
        )}

        {auth.error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-[12px] bg-[#FDECEC] px-3.5 py-3 text-[13.5px] text-(--ag-danger)">
            <span className="flex-1">{renderFormattedMessage(auth.error)}</span>
            <button type="button" aria-label="Dismiss message" onClick={auth.clearError} className="flex size-6 flex-none cursor-pointer items-center justify-center rounded-[6px] border-0 bg-transparent text-(--ag-danger)">
              <Icon name="close" className="size-4" />
            </button>
          </div>
        )}

        <button type="submit" disabled={auth.loading} className={buttonClass(config.ctaVariant, 'md', 'w-full disabled:cursor-wait disabled:opacity-70')}>
          {auth.loading ? 'Please wait…' : copy.cta}
          {!auth.loading && <Icon name="arrowRight" className={`size-5 ${BUTTON_ICON}`} />}
        </button>
      </form>

      <div className="flex items-center gap-3 text-[12.5px] text-(--ag-mute)">
        <span className="h-px flex-1 bg-(--ag-line)" />
        or
        <span className="h-px flex-1 bg-(--ag-line)" />
      </div>

      {/* Google renders its own official button (an iframe that can't be restyled); the slot keeps the design's 54px height. */}
      <div className="flex min-h-[54px] items-center">
        <GoogleAuthButton role={auth.role} onSuccess={auth.google.onSuccess} onError={auth.google.onError} />
      </div>

      <p className="text-center text-[14px] text-(--ag-mute)">
        {copy.switchText}{' '}
        <button type="button" onClick={() => auth.switchMode(isSignup ? 'login' : 'signup')} className={LINK_BUTTON}>
          {copy.switchCta}
        </button>
      </p>

      {isSignup && (
        <p className="flex items-start gap-2.5 rounded-[12px] bg-(--ag-mist) px-3.5 py-3 text-[12.5px] text-(--ag-mute)">
          <Icon name={config.signupNote.icon} className="mt-px size-4 text-(--ag-accent)" />
          {config.signupNote.text}
        </p>
      )}
    </div>
  );
}
