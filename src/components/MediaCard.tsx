import React, { useState } from 'react';
import { Play, Plus, Check, Info, Star, Film, Download } from 'lucide-react';
import { MediaItem } from '../types';
import { storageService } from '../services/storageService';

interface MediaCardProps {
  media: MediaItem;
  onPlay: (media: MediaItem) => void;
  onOpenDetails: (media: MediaItem) => void;
  onWatchlistChange?: () => void;
}

export const MediaCard: React.FC<MediaCardProps> = ({
  media,
  onPlay,
  onOpenDetails,
  onWatchlistChange,
}) => {
  const [imageError, setImageError] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(() => storageService.isInWatchlist(media.id));

  const handleToggleWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    const added = storageService.toggleWatchlist(media.id);
    setInWatchlist(added);
    onWatchlistChange?.();
  };

  return (
    <div
      onClick={() => onOpenDetails(media)}
      className="group relative cursor-pointer select-none rounded-xl overflow-hidden bg-[#13111f] border border-white/5 hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/30 hover:-translate-y-1.5 flex flex-col"
    >
      {/* Poster Image or styled fallback */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0d0c15]">
        {!imageError ? (
          <img
            src={media.poster}
            alt={media.title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-[#1b1730] to-[#0d0c15] text-zinc-400">
            <Film className="w-10 h-10 mb-2 text-purple-400/60" />
            <span className="text-xs font-semibold text-zinc-300 line-clamp-2">{media.title}</span>
            <span className="text-[10px] text-zinc-500 mt-1">{media.releaseYear}</span>
          </div>
        )}

        {/* Subtle top overlay with Rating & Quality */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-md text-amber-300 text-[11px] font-semibold border border-white/10">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{media.rating.toFixed(1)}</span>
          </div>
          {media.type === 'tv' ? (
            <span className="bg-purple-900/80 backdrop-blur-md text-purple-200 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-500/30">
              SÉRIE
            </span>
          ) : (
            <span className="bg-black/60 backdrop-blur-md text-zinc-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">
              4K HD
            </span>
          )}
        </div>

        {/* Hover quick action overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3.5">
          <div className="flex items-center gap-1.5 mb-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay(media);
              }}
              className="flex-1 py-1.5 px-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1 transition-colors shadow-md shadow-purple-900/40"
              title="Aperçu"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Aperçu</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.open(`https://videodownloader.site/?utm_source=MB_Official_Website&q=${encodeURIComponent(media.title || media.originalTitle)}`, '_blank', 'noopener,noreferrer');
              }}
              className="p-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white border border-emerald-500/30 text-xs transition-colors flex items-center justify-center gap-1"
              title="Télécharger"
              aria-label="Télécharger"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleToggleWatchlist}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                inWatchlist
                  ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                  : 'bg-black/60 border-white/20 text-white hover:bg-white/20'
              }`}
              title={inWatchlist ? 'Retirer de ma liste' : 'Ajouter à ma liste'}
              aria-label={inWatchlist ? 'Retirer de ma liste' : 'Ajouter à ma liste'}
            >
              {inWatchlist ? <Check className="w-3.5 h-3.5 text-purple-300" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(media);
              }}
              className="p-1.5 rounded-lg bg-black/60 hover:bg-white/20 border border-white/20 text-white text-xs transition-colors"
              title="Détails complets"
              aria-label="Détails complets"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-zinc-300 line-clamp-2 leading-tight">
            {media.synopsis}
          </p>
        </div>
      </div>

      {/* Card Footer Info */}
      <div className="p-3 flex flex-col flex-1 justify-between">
        <div>
          <h4 className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
            {media.title}
          </h4>
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mt-1">
            <span>{media.releaseYear}</span>
            <span aria-hidden="true">·</span>
            <span>{media.duration}</span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{media.genres[0] || 'Cinéma'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
