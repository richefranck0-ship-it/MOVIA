import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '../types';
import { MediaCard } from './MediaCard';

interface MediaRowProps {
  title: string;
  subtitle?: string;
  items: MediaItem[];
  onPlay: (media: MediaItem) => void;
  onOpenDetails: (media: MediaItem) => void;
  onWatchlistChange?: () => void;
}

export const MediaRow: React.FC<MediaRowProps> = ({
  title,
  subtitle,
  items,
  onPlay,
  onOpenDetails,
  onWatchlistChange,
}) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (items.length === 0) return null;

  return (
    <section className="my-8 relative group/row">
      {/* Row Header */}
      <div className="flex items-baseline justify-between mb-3 px-4 md:px-8">
        <div>
          <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>{title}</span>
            <span className="text-xs font-normal text-purple-400">({items.length})</span>
          </h3>
          {subtitle && (
            <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-1.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-600/30 hover:text-purple-300 text-zinc-400 border border-white/5 transition-all"
            aria-label="Défiler vers la gauche"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-purple-600/30 hover:text-purple-300 text-zinc-400 border border-white/5 transition-all"
            aria-label="Défiler vers la droite"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={rowRef}
        className="flex items-stretch gap-3 md:gap-4 overflow-x-auto scrollbar-none px-4 md:px-8 py-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="w-36 sm:w-44 md:w-52 shrink-0 transition-all"
          >
            <MediaCard
              media={item}
              onPlay={onPlay}
              onOpenDetails={onOpenDetails}
              onWatchlistChange={onWatchlistChange}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
