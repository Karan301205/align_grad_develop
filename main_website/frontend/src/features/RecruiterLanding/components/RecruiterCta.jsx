import { Icon } from '../../../components/landing/Icon';
import { SectionTitle, CtaMark } from '../../../components/landing/ui';
import { WRAP, buttonClass, BUTTON_ICON } from '../../../components/landing/classNames';

/** Closing "Post your first role, free." band on the dark footer colour. */
export default function RecruiterCta({ openAuth }) {
  const register = (event) => {
    event.preventDefault();
    openAuth('signup');
  };

  return (
    <section className="bg-(--ag-pine-d) pb-[72px] pt-[120px] text-white max-[900px]:pt-[76px]">
      <div className={`${WRAP} flex flex-wrap items-center justify-between gap-8`}>
        <div className="flex items-center gap-7">
          <CtaMark squareClass="bg-(--ag-blue)" />
          <SectionTitle bold="Post your first role," light="free." width="13ch" />
        </div>
        <a href="#auth" onClick={register} className={buttonClass('blue')}>
          Register your company <Icon name="arrowRight" className={`size-5 ${BUTTON_ICON}`} />
        </a>
      </div>
    </section>
  );
}
