'use client';

import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '../lib/cn';

type CarouselProps = {
  /** Nama carousel untuk pembaca layar. */
  label: string;
  items: Array<{ key: string; content: ReactNode }>;
  /** Class lebar tiap item, mis. "w-64" atau "w-full". */
  itemClassName?: string;
  /** `overlay` menaruh tombol di atas isi (banner); `below` di bawahnya. */
  controls?: 'overlay' | 'below';
  /** Warna tombol saat berada di atas banner berwarna. */
  onColor?: boolean;
  /**
   * Geser otomatis tiap sekian milidetik. Selalu disertai tombol jeda, berhenti saat
   * disentuh atau difokus, dan mati bila pengguna meminta gerak dikurangi.
   */
  autoAdvanceMs?: number;
};

const buttonBase =
  'inline-flex size-11 items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40';

/**
 * Carousel geser dengan scroll-snap. Bawaannya tidak bergerak sendiri; geser otomatis
 * hanya bila `autoAdvanceMs` diisi. Tetap bisa digeser bila JavaScript belum siap.
 */
export function Carousel({
  label,
  items,
  itemClassName = 'w-64',
  controls = 'below',
  onColor = false,
  autoAdvanceMs,
}: CarouselProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  const [paused, setPaused] = useState(false);
  const engaged = useRef(false);

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setEdges({
      start: track.scrollLeft <= 1,
      end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  const move = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
  };

  const itemCount = items.length;
  useEffect(() => {
    if (!autoAdvanceMs || paused || itemCount <= 1) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setInterval(() => {
      const track = trackRef.current;
      if (!track || engaged.current || document.hidden) return;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
      if (atEnd) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
        return;
      }
      const first = track.firstElementChild;
      const step = first ? first.getBoundingClientRect().width + 16 : track.clientWidth;
      track.scrollBy({ left: step, behavior: 'smooth' });
    }, autoAdvanceMs);
    return () => window.clearInterval(timer);
  }, [autoAdvanceMs, paused, itemCount]);

  const buttonTone = onColor
    ? 'bg-white/15 text-white hover:bg-white/25'
    : 'border border-ink-300 bg-surface-0 text-ink-900 hover:border-ink-900';
  const single = items.length <= 1;

  const buttons = single ? null : (
    <div
      className={cn(
        'flex gap-2',
        controls === 'overlay'
          ? 'absolute right-4 bottom-4 tablet:right-8 tablet:bottom-8'
          : 'mt-4 justify-end',
      )}
    >
      {autoAdvanceMs ? (
        <button
          type="button"
          aria-pressed={paused}
          aria-label={
            paused ? `${label}: lanjutkan geser otomatis` : `${label}: jeda geser otomatis`
          }
          onClick={() => setPaused((value) => !value)}
          className={cn(buttonBase, buttonTone)}
        >
          {paused ? (
            <Play aria-hidden className="size-5" />
          ) : (
            <Pause aria-hidden className="size-5" />
          )}
        </button>
      ) : null}
      <button
        type="button"
        data-carousel-prev
        aria-label={`${label}: sebelumnya`}
        disabled={edges.start}
        onClick={() => move(-1)}
        className={cn(buttonBase, buttonTone)}
      >
        <ChevronLeft aria-hidden className="size-5" />
      </button>
      <button
        type="button"
        data-carousel-next
        aria-label={`${label}: berikutnya`}
        disabled={edges.end}
        onClick={() => move(1)}
        className={cn(buttonBase, buttonTone)}
      >
        <ChevronRight aria-hidden className="size-5" />
      </button>
    </div>
  );

  return (
    <div
      data-carousel
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className="relative"
    >
      <ul
        ref={trackRef}
        onScroll={update}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <li key={item.key} className={cn('shrink-0 snap-start', itemClassName)}>
            {item.content}
          </li>
        ))}
      </ul>
      {buttons}
    </div>
  );
}
