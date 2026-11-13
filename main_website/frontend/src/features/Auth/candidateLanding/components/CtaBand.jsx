import { Icon } from '../../../../components/landing/Icon';
import { SectionTitle, CtaMark } from '../../../../components/landing/ui';
import { WRAP, SLAB, GRADIENT, buttonClass, BUTTON_ICON } from '../../../../components/landing/classNames';

/** Closing "Start with one test." band with the large AlignGrad mark. */
export default function CtaBand({ openAuth }) {
  const createAccount = (event) => {
    event.preventDefault();
    openAuth('signup');
  };

  return (
    <section className="pb-24 pt-2">
      <div className={WRAP}>
        <div className="relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-[32px] bg-(--ag-blue) p-[clamp(28px,5vw,56px)] text-white shadow-[0_40px_80px_-40px_rgba(1,103,246,.85)]">
          <span aria-hidden="true" className={`absolute -right-[90px] -top-[70px] h-[320px] w-[440px] opacity-55 ${SLAB} ${GRADIENT}`} />
          <span aria-hidden="true" className="absolute -bottom-10 right-[260px] size-[110px] bg-white/8" />

          <div className="relative flex items-center gap-7">
            <CtaMark squareClass="bg-white" />
            <div className="flex flex-col gap-2.5">
              <SectionTitle bold="Start with" light="one test." width="12ch" />
              <p className="max-w-[36ch] text-[17px] text-white/85">Free to join. Your first verified badge is ten questions away.</p>
            </div>
          </div>

          <a href="#auth" onClick={createAccount} className={buttonClass('whiteBlue', 'md', 'relative')}>
            Create your free account <Icon name="arrowRight" className={`size-5 ${BUTTON_ICON}`} />
          </a>
        </div>
      </div>
    </section>
  );
}
