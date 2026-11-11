import React, { useState, useEffect } from 'react';
import {
  X, Play, Plus, Check, Star, Share2, Film, Download, ExternalLink,
  Flag, CheckCheck, User, Sparkles
} from 'lucide-react';
import { MediaItem, Episode } from '../types';
import { storageService } from '../services/storageService';
import { tmdbService } from '../services/tmdbService';
import { openOmniSave } from '../utils/omniSave';

interface MediaDetailModalProps {
  media: MediaItem;
  allMedia: MediaItem[];
  onClose: () => void;
  onPlay: (media: MediaItem, episode?: Episode) => void;
  onSelectMedia: (media: MediaItem) => void;
  onWatchlistChange?: () => void;
}

export const MediaDetailModal: React.FC<MediaDetailModalProps> = ({
  media: initialMedia,
  allMedia,
  onClose,
  onPlay,
  onSelectMedia,
  onWatchlistChange,
}) => {
  const [media, setMedia] = useState<MediaItem>(initialMedia);
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [inWatchlist, setInWatchlist] = useState(() => storageService.isInWatchlist(initialMedia.id));
  const [copiedLink, setCopiedLink] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState<'broken_video' | 'audio_sync' | 'wrong_subtitles' | 'copyright' | 'other'>('broken_video');
  const [reportComment, setReportComment] = useState('');
  const [reportSent, setReportSent] = useState(false);
  const [realEpisodes, setRealEpisodes] = useState<Episode[]>([]);

  // Fetch full live TMDB details if tmdbId is present
  useEffect(() => {
    let isMounted = true;
    const fetchFullDetails = async () => {
      const cleanId = String(initialMedia.tmdbId || initialMedia.id).replace(/^(movie|tv)-/, '');
      if (initialMedia.type === 'movie') {
        const fullMovie = await tmdbService.getMovieDetails(cleanId);
        if (fullMovie && isMounted) {
          setMedia(prev => ({ ...prev, ...fullMovie }));
        }
      } else {
        const fullTv = await tmdbService.getTvDetails(cleanId);
        if (fullTv && isMounted) {
          setMedia(prev => ({ ...prev, ...fullTv }));
        }
      }
    };
    fetchFullDetails();
    return () => { isMounted = false; };
  }, [initialMedia]);

  // Fetch real episodes when season changes
  useEffect(() => {
    let isMounted = true;
    if (media.type === 'tv' && media.tmdbId) {
      tmdbService.getTvSeason(media.tmdbId, selectedSeasonNumber).then(eps => {
        if (isMounted && eps.length > 0) {
          setRealEpisodes(eps);
        }
      });
    }
    return () => { isMounted = false; };
  }, [media.tmdbId, media.type, selectedSeasonNumber]);

  const handleToggleWatchlist = () => {
    const added = storageService.toggleWatchlist(media.id);
    setInWatchlist(added);
    onWatchlistChange?.();
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportComment.trim()) return;

    storageService.addReport({
      mediaId: media.id,
      mediaTitle: media.title,
      reason: reportReason,
      comment: reportComment.trim(),
    });

    setReportSent(true);
    setTimeout(() => {
      setShowReportForm(false);
      setReportSent(false);
      setReportComment('');
    }, 2000);
  };

  // Find similar titles
  const similarItems = allMedia
    .filter(item => item.id !== media.id && (item.type === media.type || item.genres.some(g => media.genres.includes(g))))
    .slice(0, 4);

  const activeSeason = media.seasons?.find(s => s.seasonNumber === selectedSeasonNumber) || media.seasons?.[0];
  const displayedEpisodes = realEpisodes.length > 0 ? realEpisodes : (activeSeason?.episodes || []);

  const isMovie = media.type === 'movie';
  const downloadButtonLabel = 'Télécharger';

  const handleOmniSaveSearch = (titleToSearch?: string) => {
    openOmniSave(titleToSearch || media.title || media.originalTitle);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-[#100e1b] rounded-2xl overflow-hidden border border-purple-900/30 shadow-2xl shadow-purple-950/40 my-auto text-zinc-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/70 hover:bg-black/95 text-zinc-300 hover:text-white border border-white/10 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop Header */}
        <div className="relative aspect-[16/8] sm:aspect-[16/7] w-full overflow-hidden bg-[#0d0c15]">
          {!showTrailer ? (
            <>
              <img
                src={media.backdrop || media.poster}
                alt={media.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#100e1b] via-[#100e1b]/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#100e1b]/80 via-transparent to-transparent" />
            </>
          ) : (
            <div className="w-full h-full relative">
              <iframe
                src={`${media.trailerUrl}?autoplay=1`}
                title="Bande-annonce"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                className="w-full h-full border-none"
              />
              <button
                onClick={() => setShowTrailer(false)}
                className="absolute top-3 left-3 bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 hover:bg-black"
              >
                Fermer la bande-annonce
              </button>
            </div>
          )}

          {/* Title & Quick Actions floating on bottom of backdrop */}
          <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs mb-1.5">
                <span className="flex items-center gap-1 font-bold text-amber-300 bg-black/70 px-2 py-0.5 rounded border border-white/10">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{media.rating.toFixed(1)}/10</span>
                </span>
                <span className="text-zinc-400">·</span>
                <span className="text-zinc-300 font-medium">{media.releaseYear}</span>
                <span className="text-zinc-400">·</span>
                <span className="text-purple-300 font-medium">{media.duration}</span>
                {media.type === 'tv' && (
                  <>
                    <span className="text-zinc-400">·</span>
                    <span className="text-purple-400 font-semibold uppercase text-[10px] bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/20">
                      Série TV
                    </span>
                  </>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight font-heading">
                {media.title}
              </h2>
              {media.originalTitle && media.originalTitle !== media.title && (
                <p className="text-xs text-zinc-400 italic">
                  Titre original : {media.originalTitle}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* PRIMARY OMNISAVE / VIDEODOWNLOADER BUTTON */}
              <button
                onClick={() => handleOmniSaveSearch()}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all shadow-lg shadow-emerald-950 hover:scale-105 active:scale-95"
                title="Télécharger sur VideoDownloader / OmniSave"
              >
                <Download className="w-4 h-4" />
                <span>{downloadButtonLabel}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </button>

              <button
                onClick={() => onPlay(media)}
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs sm:text-sm flex items-center gap-1.5 transition-all shadow-lg shadow-purple-950"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Aperçu</span>
              </button>

              <button
                onClick={() => setShowTrailer(!showTrailer)}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs transition-colors"
                title="Bande-annonce"
                aria-label="Bande-annonce"
              >
                <Film className="w-4 h-4 text-purple-300" />
              </button>

              <button
                onClick={handleToggleWatchlist}
                className={`p-2.5 rounded-xl border text-xs transition-colors ${
                  inWatchlist
                    ? 'bg-purple-600/30 border-purple-500 text-purple-300'
                    : 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                }`}
                title={inWatchlist ? 'Dans ma liste' : 'Ajouter à ma liste'}
                aria-label={inWatchlist ? 'Dans ma liste' : 'Ajouter à ma liste'}
              >
                {inWatchlist ? <Check className="w-4 h-4 text-purple-300" /> : <Plus className="w-4 h-4" />}
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs transition-colors relative"
                title="Partager"
                aria-label="Partager"
              >
                {copiedLink ? <CheckCheck className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowReportForm(!showReportForm)}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/5 text-zinc-400 hover:text-red-400 text-xs transition-colors"
                title="Signaler un problème"
                aria-label="Signaler un problème"
              >
                <Flag className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Share Copied Toast */}
        {copiedLink && (
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs py-2 px-4 mx-6 mt-3 rounded-lg text-center font-medium">
            Lien copié dans le presse-papier !
          </div>
        )}

        {/* Report Form */}
        {showReportForm && (
          <div className="bg-[#171426] border border-purple-500/30 rounded-xl p-4 mx-6 mt-4">
            <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
              <Flag className="w-4 h-4 text-purple-400" />
              Signaler un problème sur ce titre
            </h4>
            {reportSent ? (
              <p className="text-xs text-emerald-400">
                Merci ! Votre signalement a été transmis à l'équipe technique de STREAMORA.
              </p>
            ) : (
              <form onSubmit={handleSubmitReport} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-zinc-400 mb-1 block">Nature du problème</label>
                    <select
                      value={reportReason}
                      onChange={(e: any) => setReportReason(e.target.value)}
                      className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                    >
                      <option value="broken_video">Vidéo ne se lance pas</option>
                      <option value="audio_sync">Décalage du son / audio</option>
                      <option value="wrong_subtitles">Problème de sous-titres</option>
                      <option value="copyright">Droits / Signalement</option>
                      <option value="other">Autre problème</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-400 mb-1 block">Commentaire / Détail</label>
                    <input
                      type="text"
                      placeholder="Ex: Précisez le souci..."
                      value={reportComment}
                      onChange={(e) => setReportComment(e.target.value)}
                      required
                      className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-white"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Envoyer le rapport
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Main synopsis & metadata banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <h3 className="text-xs uppercase font-semibold text-zinc-400 tracking-wider mb-1.5">
                  Synopsis
                </h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {media.synopsis}
                </p>
              </div>

              {/* Cast */}
              {media.cast && media.cast.length > 0 && (
                <div>
                  <h3 className="text-xs uppercase font-semibold text-zinc-400 tracking-wider mb-2.5">
                    Acteurs & Distribution (TMDB)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {media.cast.map((actor, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-white/5 border border-white/5"
                      >
                        {actor.photo ? (
                          <img
                            src={actor.photo}
                            alt={actor.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-white/10"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-purple-900/40 text-purple-300 flex items-center justify-center shrink-0">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{actor.name}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{actor.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar details */}
            <div className="bg-[#151224] border border-white/5 rounded-xl p-4 text-xs space-y-3 h-fit">
              <div>
                <span className="text-zinc-500 block">Réalisateur :</span>
                <span className="font-semibold text-white">{media.director || 'Non spécifié'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Genres :</span>
                <span className="font-medium text-purple-300">{media.genres.join(', ')}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Pays de production :</span>
                <span className="text-zinc-300">{media.country}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Langues disponibles :</span>
                <span className="text-zinc-300">{media.language}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Date de sortie :</span>
                <span className="text-zinc-300">{media.releaseDate}</span>
              </div>
              <div>
                <span className="text-zinc-500 block">Identifiant officiel :</span>
                <span className="font-mono text-purple-400">TMDB #{media.tmdbId || media.id}</span>
              </div>

              {/* Dedicated OmniSave Search Callout in sidebar */}
              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={() => handleOmniSaveSearch()}
                  className="w-full py-2 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{downloadButtonLabel} (OmniSave)</span>
                </button>
              </div>
            </div>
          </div>

          {/* For Series: Seasons & Episodes Accordion */}
          {media.type === 'tv' && media.seasons && media.seasons.length > 0 && (
            <div className="pt-4 border-t border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white font-heading">
                  Saisons & Épisodes
                </h3>
                {/* Season tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {media.seasons.map((s) => (
                    <button
                      key={s.seasonNumber}
                      onClick={() => setSelectedSeasonNumber(s.seasonNumber)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        selectedSeasonNumber === s.seasonNumber
                          ? 'bg-purple-600 text-white font-semibold shadow-sm'
                          : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Episodes List */}
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {displayedEpisodes.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => onPlay(media, ep)}
                    className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl bg-white/5 hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                        <img
                          src={ep.thumbnail || media.backdrop || media.poster}
                          alt={ep.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-5 h-5 text-white fill-current" />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-purple-400 font-bold shrink-0">
                            E{ep.episodeNumber}
                          </span>
                          <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                            {ep.title}
                          </h4>
                        </div>
                        <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                          {ep.synopsis}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOmniSaveSearch(`${media.title} S${ep.seasonNumber}E${ep.episodeNumber}`);
                        }}
                        className="px-2.5 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                        title="Télécharger cet épisode sur OmniSave"
                      >
                        <Download className="w-3 h-3" />
                        <span>Télécharger</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlay(media, ep);
                        }}
                        className="px-3 py-1 bg-purple-600 group-hover:bg-purple-500 text-white rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Aperçu</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Similar Content Suggestions */}
          {similarItems.length > 0 && (
            <div className="pt-4 border-t border-white/5">
              <h3 className="text-sm uppercase font-semibold text-zinc-400 tracking-wider mb-3">
                Titres similaires recommandés
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {similarItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectMedia(item)}
                    className="group cursor-pointer rounded-xl overflow-hidden bg-white/5 border border-white/5 hover:border-purple-500/40 transition-all p-2 flex flex-col"
                  >
                    <div className="aspect-[2/3] w-full rounded-lg overflow-hidden bg-black mb-2">
                      <img
                        src={item.poster}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-xs font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-zinc-400">{item.releaseYear}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
