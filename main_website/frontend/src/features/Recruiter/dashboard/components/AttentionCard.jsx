import { Clock, CreditCard, Plus, UserPlus } from 'lucide-react';
import { CARD, CARD_TITLE, MUTED, PRIMARY_BUTTON, SECONDARY_BUTTON } from '../../components/accountStyles';

const ICONS = { review: UserPlus, clock: Clock, card: CreditCard, post: Plus };
const TILE = { blue: 'bg-[#EEF2FE] text-[#1447E6]', orange: 'bg-[#FFF1E8] text-[#C2410C]' };
const ACTION_LABEL = { review: 'Review applicants', jobs: 'Manage job', billing: 'Plan & billing', post: 'Post a job' };

/** "Needs your attention": items derived in dashboardData.attentionItems. */
export default function AttentionCard({ items, onAction }) {
  return (
    <section aria-labelledby="attention-title" className={CARD}>
      <div className="flex items-center justify-between px-5 pb-3 pt-[18px]">
        <h2 id="attention-title" className={CARD_TITLE}>
          <span className="font-semibold">Needs your attention</span>
        </h2>
        <span className={`text-[13px] ${MUTED}`}>
          {items.length} item{items.length === 1 ? '' : 's'}
        </span>
      </div>
      {items.length === 0 ? (
        <p className={`m-0 border-t border-[#EEF0F3] px-5 py-4 ${MUTED}`}>Nothing needs you right now. New applicants and jobs about to close will show up here.</p>
      ) : (
        <ul className="m-0 list-none p-0">
          {items.map((item, index) => {
            const Icon = ICONS[item.icon];
            return (
              <li key={item.id} className="flex flex-wrap items-center gap-3.5 border-t border-[#EEF0F3] px-5 py-3.5">
                <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-[10px] ${TILE[item.tone]}`}>
                  <Icon className="size-5" />
                </span>
                <div className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5">
                  <span className="text-[15px] font-semibold">{item.title}</span>
                  <span className={MUTED}>{item.detail}</span>
                </div>
                <button type="button" onClick={() => onAction(item)} className={`${index === 0 ? PRIMARY_BUTTON : SECONDARY_BUTTON} h-10 px-4`}>
                  {ACTION_LABEL[item.action]}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
