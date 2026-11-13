import { useState } from 'react';
import { Icon, FilledIcon } from '../../../components/landing/Icon';
import { SectionHead, Pill } from '../../../components/landing/ui';
import { WRAP, SECTION, ANCHOR, SORA, SLAB, GRADIENT, SWAP } from '../../../components/landing/classNames';

const ACTIVE_RING = {
  blue: 'shadow-[0_0_0_1.5px_var(--ag-blue)]',
  pine: 'shadow-[0_0_0_1.5px_var(--ag-pine)]'
};

/** 9:16 "video review" tile. The progress bar fills over 45s while playing. */
function VideoTile({ item, playing, onToggle }) {
  return (
    <div
      className="relative flex aspect-[9/16] max-h-[520px] w-full flex-col justify-between self-center overflow-hidden rounded-[20px] p-4 shadow-[0_30px_50px_-30px_rgba(0,0,0,.6),inset_0_0_0_1px_rgba(255,255,255,.14)] max-[900px]:max-w-[260px] max-[900px]:justify-self-center"
      style={{ background: `linear-gradient(165deg, rgba(255,255,255,.16), rgba(0,0,0,.25)), ${item.bg}` }}
    >
      <span aria-hidden="true" className={`absolute -right-[40%] -top-[6%] h-[46%] w-[120%] opacity-50 ${SLAB} ${GRADIENT}`} />
      <span aria-hidden="true" className={`absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 text-[clamp(54px,5vw,76px)] font-bold leading-[.98] tracking-[-.05em] text-white/92 ${SORA}`}>
        {item.initials}
      </span>
      <div className="relative flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-[8px] bg-black/28 px-[9px] py-[5px] text-[11.5px] font-semibold text-white backdrop-blur-[6px]">
          <i className="size-[7px] rounded-full bg-(--ag-orchid)" />
          Video review
        </span>
        <span className="inline-flex items-center rounded-[8px] bg-black/28 px-[9px] py-[5px] text-[11.5px] font-semibold text-white backdrop-blur-[6px]">
          {item.duration}
        </span>
      </div>
      <button
        type="button"
        aria-label={playing ? 'Pause video review' : 'Play video review'}
        onClick={onToggle}
        className="absolute left-1/2 top-[70%] flex size-[62px] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-white/94 text-(--ag-pine) shadow-[0_14px_30px_-12px_rgba(0,0,0,.6)] transition-[scale] duration-200 hover:scale-[1.06]"
      >
        {playing ? <FilledIcon name="pause" className="size-5" /> : <FilledIcon name="play" className="ml-[3px] size-[22px]" />}
      </button>
      <div className="relative flex flex-col gap-2">
        <div className="h-1 overflow-hidden rounded-[2px] bg-white/28">
          <i className={`block h-full bg-white ${playing ? 'w-full transition-[width] duration-[45s] ease-linear' : 'w-0'}`} />
        </div>
        <div className="flex justify-between text-[12px] font-semibold text-white/90">
          <span>{item.name}</span>
          <span>9:16</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Review carousel: a large card for the selected person plus a picker list.
 *  - items: [{ name, role, initials, bg, duration, tag, quote }]
 *  - activeRing: outline colour of the selected person ('blue' | 'pine')
 */
export default function TestimonialsSection({
  id, kicker, kickerTone, bold, light, lede, items, initialIndex = 0, activeRing = 'blue', className = ''
}) {
  const [index, setIndex] = useState(initialIndex);
  const [playing, setPlaying] = useState(false);
  const item = items[index];
  const titleId = `${id}-title`;

  const show = (next) => {
    setIndex((next + items.length) % items.length);
    setPlaying(false);
  };

  return (
    <section id={id} aria-labelledby={titleId} className={`${SECTION} ${ANCHOR} ${className}`}>
      <div className={WRAP}>
        <SectionHead kicker={kicker} kickerTone={kickerTone} titleId={titleId} bold={bold} light={light} lede={lede} ledeWidth="38ch" />

        <div className="grid grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] items-stretch gap-6 max-[900px]:grid-cols-[minmax(0,1fr)]">
          <article
            aria-live="polite"
            className={`relative grid min-h-[440px] grid-cols-[minmax(200px,.62fr)_minmax(0,1fr)] items-stretch gap-[clamp(20px,3vw,40px)] overflow-hidden rounded-[28px] py-[18px] pl-[18px] pr-[clamp(22px,3vw,40px)] text-white max-[900px]:min-h-0 max-[900px]:grid-cols-[minmax(0,1fr)] max-[900px]:pb-2 max-[900px]:pl-4 max-[900px]:pr-4 max-[900px]:pt-4 ${SWAP}`}
            style={{ background: item.bg }}
          >
            <span aria-hidden="true" className={`absolute -right-20 -top-[60px] h-[230px] w-[320px] opacity-30 ${SLAB} ${GRADIENT}`} />
            <VideoTile item={item} playing={playing} onToggle={() => setPlaying((value) => !value)} />

            <div className="relative flex min-w-0 flex-col gap-6 py-[22px] max-[900px]:gap-[18px] max-[900px]:pb-4 max-[900px]:pl-1 max-[900px]:pr-1 max-[900px]:pt-1">
              <div className="flex items-center justify-between gap-3">
                <Pill tone="glass">{item.tag}</Pill>
                <span className={`${SORA} text-[14px] font-medium text-white/90`}>{index + 1} / {items.length}</span>
              </div>
              <p className={`${SORA} text-[clamp(21px,2vw,29px)] font-normal leading-[1.32] tracking-[-.03em] text-pretty`}>“{item.quote}”</p>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <span className={`flex size-11 flex-none items-center justify-center bg-white text-[15px] font-semibold ${SORA}`} style={{ color: item.bg }}>
                    {item.initials}
                  </span>
                  <div>
                    <div className="text-[16px] font-semibold text-white">{item.name}</div>
                    <div className="text-[14px] font-medium text-white">{item.role}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" aria-label="Previous review" onClick={() => show(index - 1)} className="inline-flex size-12 cursor-pointer items-center justify-center rounded-[14px] border-0 bg-white/14 text-white transition-colors duration-200 hover:bg-white/24">
                    <Icon name="arrowLeft" />
                  </button>
                  <button type="button" aria-label="Next review" onClick={() => show(index + 1)} className="inline-flex size-12 cursor-pointer items-center justify-center rounded-[14px] border-0 bg-white/14 text-white transition-colors duration-200 hover:bg-white/24">
                    <Icon name="arrowRight" />
                  </button>
                </div>
              </div>
            </div>
          </article>

          <div className="flex flex-col gap-1.5 max-[900px]:-mx-5 max-[900px]:flex-row max-[900px]:overflow-x-auto max-[900px]:px-5 max-[900px]:pb-1.5 max-[900px]:pt-0.5 max-[900px]:[scrollbar-width:none]">
            {items.map((person, i) => {
              const isOn = i === index;
              return (
                <button
                  key={person.name}
                  type="button"
                  aria-pressed={isOn}
                  onClick={() => show(i)}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-[16px] border-0 p-3 text-left font-normal leading-[normal] text-(--ag-pine) transition-colors duration-200 max-[900px]:w-auto max-[900px]:flex-none ${isOn ? `bg-white ${ACTIVE_RING[activeRing]}` : 'bg-transparent hover:bg-white'}`}
                >
                  <span className={`flex size-11 flex-none items-center justify-center text-[15px] font-semibold text-white ${SORA}`} style={{ background: person.bg }}>
                    {person.initials}
                  </span>
                  <span className="min-w-0 max-[900px]:hidden">
                    <span className="block text-[15px] font-semibold">{person.name}</span>
                    <span className="block truncate text-[13px] text-(--ag-mute)">{person.role}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
