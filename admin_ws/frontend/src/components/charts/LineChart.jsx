import { useState } from 'react';
import { hasAny, niceScale } from '../../utils/chart.js';
import { ChartEmpty, ChartLegend, ChartTable, ChartTooltip } from './ChartParts.jsx';
import { toneOf } from './chartTones.js';
import useWidth from './useWidth.js';

const PAD = { top: 10, right: 8, bottom: 26, left: 30 };

/** One line per series across the labels. `series`: [{ key, name, tone, values }]. Hover or tap for the numbers. */
export default function LineChart({ labels, titles, series, caption, labelHeader = 'Week', emptyMessage, height = 220 }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);

  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const all = series.flatMap((s) => s.values);
  const scale = niceScale(Math.max(0, ...all));
  const band = plotW / Math.max(1, labels.length);
  const x = (i) => PAD.left + band * i + band / 2;
  const y = (value) => PAD.top + plotH - (value / scale.max) * plotH;
  const sparse = band < 44;

  const line = (values) => values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i)} ${y(v || 0)}`).join(' ');
  const area = (values) => (values.length ? `${line(values)} L${x(values.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z` : '');

  return (
    <div>
      <div ref={ref} className="relative" onMouseLeave={() => setHover(null)}>
        <svg width={width} height={height} aria-hidden="true">
          {scale.ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-line" />
              <text x={PAD.left - 6} y={y(tick) + 4} textAnchor="end" className="fill-muted text-[11px]">
                {tick}
              </text>
            </g>
          ))}
          {labels.map((label, i) =>
            !sparse || i % 2 === 0 ? (
              <text key={`${label}-${i}`} x={x(i)} y={height - 8} textAnchor="middle" className="fill-muted text-[11px]">
                {label}
              </text>
            ) : null
          )}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + plotH} className="stroke-line-strong" strokeDasharray="3 3" />}
          {series.map((s) => (
            <g key={s.key}>
              <path d={area(s.values)} className={toneOf(s.tone).area} />
              <path d={line(s.values)} fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className={toneOf(s.tone).stroke} />
              {s.values.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v || 0)} r={hover === i ? 4.5 : 3} className={`${toneOf(s.tone).fill} stroke-panel`} strokeWidth="1.5" />
              ))}
            </g>
          ))}
          {labels.map((label, i) => (
            <rect key={`hit-${label}-${i}`} x={PAD.left + band * i} y={PAD.top} width={band} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
          ))}
        </svg>
        {hover !== null && (
          <ChartTooltip left={x(hover)} width={width} title={titles?.[hover] || labels[hover]} rows={series.map((s) => ({ name: s.name, value: s.values[hover] || 0, tone: s.tone }))} />
        )}
        {!hasAny(all) && <ChartEmpty>{emptyMessage}</ChartEmpty>}
      </div>
      <div className="mt-2">
        <ChartLegend items={series} />
      </div>
      <ChartTable caption={caption} labelHeader={labelHeader} labels={titles || labels} series={series} />
    </div>
  );
}
