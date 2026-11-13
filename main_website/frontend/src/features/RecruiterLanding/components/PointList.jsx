import { Icon } from '../../../components/landing/Icon';
import { CHECK_ITEM } from '../../../components/landing/portalLayout';

/** Check list with green ticks (design `.pts3`). */
export default function PointList({ items }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((item) => (
        <li key={item} className={CHECK_ITEM}>
          <Icon name="check" className="mt-[3px] size-[18px] text-(--ag-ok)" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
