import { useState } from 'react';
import { hasAny, niceScale } from '../../utils/chart.js';
import { ChartEmpty, ChartLegend, ChartTable, ChartTooltip } from './ChartParts.jsx';
import { toneOf } from './chartTones.js';
import useWidth from './useWidth.js';

const PAD = { top: 10, right: 8, bottom: 26, left: 30 };

/** One stacked column per label. `series`: [{ key, name, tone, values }]. Hover or tap a column for its numbers. */
export default function StackedColumns({ labels, titles, series, caption, labelHeader = 'Week', emptyMessage, height = 220 }) {
  const [ref, width] = useWidth();
  const [hover, setHover] = useState(null);

  const plotW = width - PAD.left - PAD.right;
  const plotH = height - PAD.top - PAD.bottom;
  const totals = labels.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] || 0), 0));
  const scale = niceScale(Math.max(0, ...totals));
  const band = plotW / Math.max(1, labels.length);
  const barW = Math.min(40, band * 0.6);
  const y = (value) => PAD.top + plotH - (value / scale.max) * plotH;
  const sparse = band < 44; // narrow screens: label every other column

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
          {labels.map((label, i) => {
            const x = PAD.left + band * i + (band - barW) / 2;
            let stacked = 0;
            return (
              <g key={`${label}-${i}`}>
                {hover === i && <rect x={PAD.left + band * i} y={PAD.top} width={band} height={plotH} className="fill-subtle" />}
                {series.map((s) => {
                  const value = s.values[i] || 0;
                  if (!value) return null;
                  const top = y(stacked + value);
                  const bar = <rect key={s.key} x={x} y={top} width={barW} height={y(stacked) - top} rx="2" className={toneOf(s.tone).fill} />;
                  stacked += value;
                  return bar;
                })}
                {(!sparse || i % 2 === 0) && (
                  <text x={PAD.left + band * i + band / 2} y={height - 8} textAnchor="middle" className="fill-muted text-[11px]">
                    {label}
                  </text>
                )}
                <rect x={PAD.left + band * i} y={PAD.top} width={band} height={plotH} fill="transparent" onMouseEnter={() => setHover(i)} onClick={() => setHover(i)} />
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <ChartTooltip
            left={PAD.left + band * hover + band / 2}
            width={width}
            title={titles?.[hover] || labels[hover]}
            rows={series.map((s) => ({ name: s.name, value: s.values[hover] || 0, tone: s.tone }))}
            total={totals[hover]}
          />
        )}
        {!hasAny(totals) && <ChartEmpty>{emptyMessage}</ChartEmpty>}
      </div>
      <div className="mt-2">
        <ChartLegend items={series} />
      </div>
      <ChartTable caption={caption} labelHeader={labelHeader} labels={titles || labels} series={series} />
    </div>
  );
}
