import React, { useState, useEffect } from 'react';
import { Play, Info, Plus, Check, Star, Film, Volume2, VolumeX, ChevronRight, ChevronLeft, Download, ExternalLink } from 'lucide-react';
import { MediaItem } from '../types';
import { storageService } from '../services/storageService';
import { openOmniSave } from '../utils/omniSave';

interface HeroBannerProps {
  featuredItems: MediaItem[];
  onPlay: (media: MediaItem) => void;
  onOpenDetails: (media: MediaItem) => void;
  onWatchlistChange?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  featuredItems,
  onPlay,
  onOpenDetails,
  onWatchlistChange,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [showTrailerPreview, setShowTrailerPreview] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  const current = featuredItems[currentIndex] || featuredItems[0];

  useEffect(() => {
    if (current) {
      setInWatchlist(storageService.isInWatchlist(current.id));
      setShowTrailerPreview(false);
    }
  }, [current]);

  // Auto rotate hero every 12 seconds if trailer preview is inactive
  useEffect(() => {
    if (featuredItems.length <= 1 || showTrailerPreview) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [featuredItems.length, showTrailerPreview]);

  if (!current) return null;

  const handleToggleWatchlist = () => {
    const added = storageService.toggleWatchlist(current.id);
    setInWatchlist(added);
    onWatchlistChange?.();
  };

  const nextHero = () => {
    setCurrentIndex((prev) => (prev + 1) % featuredItems.length);
  };

  const prevHero = () => {
    setCurrentIndex((prev) => (prev - 1 + featuredItems.length) % featuredItems.length);
  };

  const isMovie = current.type === 'movie';
  const downloadButtonLabel = 'Télécharger';

  return (
    <div className="relative w-full h-[75vh] min-h-[520px] max-h-[800px] overflow-hidden bg-[#08070d]">
      {/* Background Backdrop or Trailer Video */}
      <div className="absolute inset-0">
        {!showTrailerPreview ? (
          <img
            src={current.backdrop || current.poster}
            alt={current.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top filter brightness-80 transition-all duration-700 ease-in-out scale-100 hover:scale-102"
          />
        ) : (
          <div className="w-full h-full relative pointer-events-none">
            <iframe
              src={`${current.trailerUrl}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${current.trailerUrl.split('/').pop()}`}
              title="Aperçu Bande-annonce"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              className="w-full h-full object-cover scale-125"
            />
          </div>
        )}

        {/* Cinematic Gradient Scrim Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#08070d] via-[#08070d]/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#08070d] via-[#08070d]/70 to-transparent w-full md:w-3/4" />
      </div>

      {/* Hero Content Container */}
      <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-end pb-16 md:pb-24 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Top highlight kicker */}
          <div className="flex items-center gap-3 text-xs md:text-sm text-zinc-300">
            <span className="font-semibold text-purple-400 uppercase tracking-wider text-[11px] bg-purple-950/70 border border-purple-500/30 px-2 py-0.5 rounded">
              À LA UNE CE SOIR
            </span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="flex items-center gap-1 font-semibold text-amber-300">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{current.rating.toFixed(1)}/10</span>
            </span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>{current.releaseYear}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>{current.duration}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="text-purple-300">{current.genres.slice(0, 2).join(', ')}</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight font-heading text-balance drop-shadow-md">
            {current.title}
          </h1>

          {/* Synopsis */}
          <p className="text-sm md:text-base text-zinc-300 line-clamp-3 leading-relaxed max-w-xl text-balance drop-shadow">
            {current.synopsis}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* OMNISAVE DOWNLOAD BUTTON */}
            <button
              onClick={() => openOmniSave(current.title || current.originalTitle)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-950 hover:scale-105 active:scale-95"
              title="Télécharger sur VideoDownloader / OmniSave"
            >
              <Download className="w-5 h-5" />
              <span>{downloadButtonLabel}</span>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </button>

            {/* Aperçu Button */}
            <button
              onClick={() => onPlay(current)}
              className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl flex items-center gap-2.5 transition-all shadow-lg shadow-purple-900/50 hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Aperçu</span>
            </button>

            <button
              onClick={() => setShowTrailerPreview(!showTrailerPreview)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl flex items-center gap-2 backdrop-blur-md border border-white/10 transition-all hover:border-white/20"
            >
              <Film className="w-4 h-4 text-purple-300" />
              <span>{showTrailerPreview ? 'Arrêter l\'aperçu' : 'Bande-annonce'}</span>
            </button>

            <button
              onClick={() => onOpenDetails(current)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl flex items-center gap-2 backdrop-blur-md border border-white/10 transition-all hover:border-white/20"
            >
              <Info className="w-4 h-4" />
              <span>Détails</span>
            </button>

            <button
              onClick={handleToggleWatchlist}
              className={`p-3 rounded-xl border backdrop-blur-md transition-all ${
                inWatchlist
                  ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                  : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
              }`}
              title={inWatchlist ? 'Dans ma liste' : 'Ajouter à ma liste'}
              aria-label={inWatchlist ? 'Dans ma liste' : 'Ajouter à ma liste'}
            >
              {inWatchlist ? <Check className="w-5 h-5 text-purple-300" /> : <Plus className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Carousel controls & Mute preview button */}
        <div className="absolute right-4 md:right-8 bottom-12 flex items-center gap-3">
          {showTrailerPreview && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/10 backdrop-blur-md transition-colors"
              title={isMuted ? 'Activer le son' : 'Couper le son'}
              aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-purple-400" />}
            </button>
          )}

          {featuredItems.length > 1 && (
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/10">
              <button
                onClick={prevHero}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 transition-colors"
                aria-label="Titre précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-medium text-zinc-300 px-1 tabular-nums">
                {currentIndex + 1} / {featuredItems.length}
              </span>
              <button
                onClick={nextHero}
                className="p-1.5 rounded-full hover:bg-white/10 text-zinc-300 transition-colors"
                aria-label="Titre suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
