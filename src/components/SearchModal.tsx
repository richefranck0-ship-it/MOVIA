import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Film, Tv, Star, User, Sparkles, Loader2 } from 'lucide-react';
import { MediaItem } from '../types';
import { tmdbService } from '../services/tmdbService';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allMedia: MediaItem[];
  onSelectMedia: (media: MediaItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  allMedia,
  onSelectMedia,
}) => {
  const [query, setQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'movie' | 'tv'>('all');
  const [liveTmdbResults, setLiveTmdbResults] = useState<MediaItem[]>([]);
  const [isSearchingTmdb, setIsSearchingTmdb] = useState(false);

  // Focus input and lock body scroll on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Query live TMDB with debounce if key is configured
  useEffect(() => {
    if (!query.trim() || !tmdbService.hasApiKey()) {
      setLiveTmdbResults([]);
      setIsSearchingTmdb(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingTmdb(true);
      try {
        const results = await tmdbService.searchMulti(query);
        setLiveTmdbResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingTmdb(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  // Search local database by title, actor, director, genre, or year
  const localResults = useMemo(() => {
    if (!query.trim()) return [];

    const q = query.toLowerCase().trim();

    return allMedia.filter(item => {
      // type filter
      if (filterType !== 'all' && item.type !== filterType) return false;

      // title matching
      if (item.title.toLowerCase().includes(q)) return true;
      if (item.originalTitle?.toLowerCase().includes(q)) return true;

      // year matching
      if (String(item.releaseYear).includes(q)) return true;

      // genre matching
      if (item.genres.some(g => g.toLowerCase().includes(q))) return true;

      // director matching
      if (item.director?.toLowerCase().includes(q)) return true;

      // cast actor matching
      if (item.cast?.some(c => c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q))) return true;

      return false;
    });
  }, [query, allMedia, filterType]);

  // Combine and deduplicate
  const combinedResults = useMemo(() => {
    const map = new Map<string, MediaItem>();
    localResults.forEach(item => map.set(String(item.id), item));
    liveTmdbResults.forEach(item => {
      if (!map.has(String(item.id))) {
        if (filterType === 'all' || item.type === filterType) {
          map.set(String(item.id), item);
        }
      }
    });
    return Array.from(map.values());
  }, [localResults, liveTmdbResults, filterType]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-start justify-center pt-16 md:pt-24 px-4 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#110f1c] border border-purple-900/30 rounded-2xl shadow-2xl shadow-purple-950/40 overflow-hidden flex flex-col mb-12 animate-fade-in"
      >
        {/* Search Bar Input Row */}
        <div className="p-4 md:p-6 border-b border-white/5 flex items-center gap-3">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un film, une série, un acteur, un réalisateur (ex: Nolan, Dune, 1968)..."
            className="w-full bg-transparent text-white placeholder-zinc-500 text-sm md:text-base focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-zinc-500 hover:text-white"
              aria-label="Effacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs px-3 transition-colors"
          >
            Fermer
          </button>
        </div>

        {/* Quick Filter tabs & search helper */}
        <div className="px-4 md:px-6 py-2.5 bg-[#0d0b16] border-b border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 hidden sm:inline">Type :</span>
            {(['all', 'movie', 'tv'] as const).map(t => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  filterType === t
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {t === 'all' ? 'Tous les résultats' : t === 'movie' ? 'Films' : 'Séries'}
              </button>
            ))}
          </div>

          {isSearchingTmdb && (
            <div className="flex items-center gap-1.5 text-purple-400 text-[11px]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Recherche TMDB en direct...</span>
            </div>
          )}
        </div>

        {/* Results List or Suggestions */}
        <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto space-y-3">
          {query.trim() === '' ? (
            <div className="py-8 space-y-4 text-center">
              <Sparkles className="w-8 h-8 text-purple-400/50 mx-auto" />
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Tapez les premières lettres d'un titre, le nom d'un acteur célèbre (ex: <em>Timothée Chalamet</em>, <em>Bryan Cranston</em>) ou d'une année de sortie pour voir les résultats instantanément.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <span className="text-[11px] text-zinc-500">Suggestions rapides :</span>
                {['Dune', 'Breaking Bad', 'Nolan', 'Classique', 'Oppenheimer', 'Horreur'].map(s => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-2.5 py-1 bg-white/5 hover:bg-purple-600/30 hover:text-purple-300 text-zinc-300 text-xs rounded-full border border-white/5 transition-all"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : combinedResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {combinedResults.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectMedia(item);
                    onClose();
                  }}
                  className="group flex items-center gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer"
                >
                  <div className="w-14 h-20 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                    <img
                      src={item.poster}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mb-0.5">
                      <span className="font-semibold text-purple-400 uppercase">
                        {item.type === 'movie' ? 'Film' : 'Série'}
                      </span>
                      <span>·</span>
                      <span>{item.releaseYear}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5 text-amber-300">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        {item.rating.toFixed(1)}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                      {item.title}
                    </h4>
                    <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                      {item.synopsis}
                    </p>
                    {item.director && (
                      <span className="text-[10px] text-zinc-500 block truncate mt-1">
                        De : {item.director}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center space-y-2">
              <Film className="w-10 h-10 text-zinc-600 mx-auto" />
              <h4 className="text-sm font-semibold text-white">Aucun résultat trouvé pour « {query} »</h4>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Vérifiez l'orthographe du titre ou essayez d'autres mots-clés plus généraux.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
