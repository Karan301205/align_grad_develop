import { percentOf } from '../../utils/chart.js';
import { toneOf } from './chartTones.js';

const SIZE = 150;
const RADIUS = 56;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** A donut of `slices` ([{ key, label, value, tone }]) with a legend. Zero-value slices stay in the legend. */
export default function DonutChart({ slices, centerLabel, emptyMessage }) {
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  let offset = 0;

  if (total === 0) return <p className="py-10 text-center text-sm text-muted">{emptyMessage}</p>;

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label={slices.map((s) => `${s.label}: ${s.value}`).join(', ')}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" strokeWidth={STROKE} className="stroke-subtle" />
        {slices
          .filter((slice) => slice.value > 0)
          .map((slice) => {
            const length = (slice.value / total) * CIRCUMFERENCE;
            const circle = (
              <circle
                key={slice.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={STROKE}
                strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                className={toneOf(slice.tone).stroke}
              >
                <title>{`${slice.label}: ${slice.value} (${percentOf(slice.value, total)}%)`}</title>
              </circle>
            );
            offset += length;
            return circle;
          })}
        <text x={SIZE / 2} y={SIZE / 2 + 2} textAnchor="middle" className="fill-ink text-[26px] font-bold">
          {total}
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 20} textAnchor="middle" className="fill-muted text-[11px]">
          {centerLabel}
        </text>
      </svg>
      <ul className="min-w-40 space-y-2 text-[13px]">
        {slices.map((slice) => (
          <li key={slice.key} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-ink-2">
              <span className={`size-2.5 rounded-sm ${toneOf(slice.tone).bg}`} aria-hidden="true" />
              {slice.label}
            </span>
            <span className="font-semibold">
              {slice.value} <span className="font-normal text-muted">({percentOf(slice.value, total)}%)</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
