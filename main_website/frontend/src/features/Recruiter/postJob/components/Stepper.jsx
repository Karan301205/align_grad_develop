import AccountIcon from '../../components/AccountIcon';
import { STEPS } from '../constants';

/**
 * The 5 step tiles. Done steps (already passed) and the current one are plain;
 * any tile can be clicked: earlier steps open directly, later ones only once the
 * steps before them are valid.
 */
export default function Stepper({ step, furthest, onSelect }) {
  return (
    <ol aria-label="Steps" className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(170px,100%),1fr))] gap-2 p-0">
      {STEPS.map((item, index) => {
        const current = index === step;
        const done = !current && index < furthest;
        return (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => onSelect(index)}
              aria-current={current ? 'step' : undefined}
              className={`flex w-full items-center gap-2.5 rounded-[10px] text-left font-(family-name:--font-headline) text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1447E6] ${
                current ? 'border-2 border-[#1447E6] bg-[#EEF2FE] px-[13px] py-[11px]' : 'border border-[#E4E6EA] bg-white px-3.5 py-3 hover:bg-[#F8F8F6]'
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex size-[26px] shrink-0 items-center justify-center rounded-full text-[13px] ${
                  current || done ? 'bg-[#1447E6] font-bold text-white' : 'border-[1.5px] border-[#9CA3AF] font-semibold text-[#4B5563]'
                }`}
              >
                {done ? <AccountIcon name="check" size={13} strokeWidth={3} /> : index + 1}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className={`truncate font-semibold ${current ? 'text-[#1447E6]' : 'text-[#0F172A]'}`}>{item.title}</span>
                <span className={`truncate text-xs font-normal ${current ? 'text-[#334155]' : 'text-[#4B5563]'}`}>
                  {current ? 'In progress' : done ? 'Done' : item.hint}
                </span>
              </span>
              <span className="sr-only">{current ? '(current step)' : done ? '(done)' : ''}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
