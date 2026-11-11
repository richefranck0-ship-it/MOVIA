import React, { useState, useEffect, useMemo } from 'react';
import { Film, Tv, ChevronDown, Loader2 } from 'lucide-react';
import { MediaItem, MediaType } from '../types';
import { AVAILABLE_GENRES } from '../data/mockData';
import { tmdbService, GENRE_NAME_TO_ID } from '../services/tmdbService';
import { MediaCard } from './MediaCard';
import { AdBannerSlot } from './AdBannerSlot';

interface CatalogViewProps {
  type: MediaType;
  allMedia: MediaItem[];
  onPlay: (media: MediaItem) => void;
  onOpenDetails: (media: MediaItem) => void;
  onWatchlistChange?: () => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({
  type,
  allMedia,
  onPlay,
  onOpenDetails,
  onWatchlistChange,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>('Tous');
  const [selectedSort, setSelectedSort] = useState<'popularity' | 'rating' | 'newest' | 'classic' | 'title'>('popularity');
  const [selectedYearEra, setSelectedYearEra] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [liveTmdbItems, setLiveTmdbItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isMovies = type === 'movie';
  const pageTitle = isMovies ? 'Catalogue des Films' : 'Catalogue des Séries';
  const pageSubtitle = isMovies
    ? 'Explorez notre sélection complète alimentée en direct par TMDB : des chefs-d’œuvre du cinéma classique aux dernières superproductions mondiales.'
    : 'Découvrez les plus grandes séries intégrales, drames captivants et créations originales.';

  // Base local items for fallback
  const baseItems = useMemo(() => {
    return allMedia.filter(item => item.type === type);
  }, [allMedia, type]);

  // Extract unique countries
  const countries = useMemo(() => {
    const set = new Set<string>();
    baseItems.forEach(i => {
      if (i.country) {
        i.country.split(/[/,]/).forEach(c => set.add(c.trim()));
      }
    });
    return Array.from(set).sort();
  }, [baseItems]);

  // Map sort to TMDB sort_by
  const tmdbSort = useMemo(() => {
    if (selectedSort === 'rating') return 'vote_average.desc';
    if (selectedSort === 'newest') return isMovies ? 'primary_release_date.desc' : 'first_air_date.desc';
    if (selectedSort === 'classic') return isMovies ? 'primary_release_date.asc' : 'first_air_date.asc';
    return 'popularity.desc';
  }, [selectedSort, isMovies]);

  // Reset page on filter changes
  useEffect(() => {
    setCurrentPage(1);
    setLiveTmdbItems([]);
  }, [selectedGenre, selectedSort, selectedYearEra, type]);

  // Fetch live from TMDB API on filter or page change
  useEffect(() => {
    let isCancelled = false;
    const fetchTmdb = async () => {
      setIsLoading(true);
      const genreId = selectedGenre !== 'Tous' ? GENRE_NAME_TO_ID[selectedGenre] : undefined;

      try {
        let results: MediaItem[] = [];
        if (isMovies) {
          results = await tmdbService.discoverMovies({
            genreId,
            yearEra: selectedYearEra,
            sortBy: tmdbSort,
            page: currentPage,
          });
        } else {
          results = await tmdbService.discoverSeries({
            genreId,
            yearEra: selectedYearEra,
            sortBy: tmdbSort,
            page: currentPage,
          });
        }

        if (!isCancelled) {
          if (currentPage === 1) {
            setLiveTmdbItems(results);
          } else {
            setLiveTmdbItems(prev => {
              const map = new Map<string, MediaItem>();
              prev.forEach(item => map.set(String(item.id), item));
              results.forEach(item => map.set(String(item.id), item));
              return Array.from(map.values());
            });
          }
        }
      } catch (err) {
        console.error('Failed to discover from TMDB:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };

    fetchTmdb();
    return () => { isCancelled = true; };
  }, [type, isMovies, selectedGenre, selectedSort, selectedYearEra, currentPage, tmdbSort]);

  // Combine live TMDB items with local items
  const combinedItems = useMemo(() => {
    const map = new Map<string, MediaItem>();
    // Add live TMDB items first
    liveTmdbItems.forEach(item => map.set(String(item.id), item));

    // Also include local items matching criteria if live results are empty or supplementing
    baseItems.forEach(item => {
      if (!map.has(String(item.id))) {
        let matches = true;
        if (selectedGenre !== 'Tous' && !item.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase())) {
          matches = false;
        }
        if (selectedCountry !== 'all' && !item.country.toLowerCase().includes(selectedCountry.toLowerCase())) {
          matches = false;
        }
        if (matches) map.set(String(item.id), item);
      }
    });

    let list = Array.from(map.values());

    if (selectedCountry !== 'all') {
      list = list.filter(item => item.country.toLowerCase().includes(selectedCountry.toLowerCase()));
    }

    return list;
  }, [liveTmdbItems, baseItems, selectedGenre, selectedCountry]);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 uppercase tracking-wider">
          {isMovies ? <Film className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
          <span>{isMovies ? 'Cinéma & Patrimoine (API TMDB)' : 'Saisons & Épisodes (API TMDB)'}</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-heading">
          {pageTitle}
        </h1>
        <p className="text-sm text-zinc-400 max-w-2xl leading-relaxed">
          {pageSubtitle}
        </p>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-[#110f1c] border border-white/5 rounded-2xl p-4 md:p-6 space-y-4">
        {/* Genre Tags Scrollable Bar */}
        <div>
          <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2.5">
            Filtrer par Genre
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            {AVAILABLE_GENRES.map(genre => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                  selectedGenre === genre
                    ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-950 scale-102'
                    : 'bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>

        {/* Multi-Dropdown Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/5">
          {/* Sort Selector */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Trier les résultats
            </label>
            <select
              value={selectedSort}
              onChange={(e: any) => setSelectedSort(e.target.value)}
              className="w-full bg-[#181528] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="popularity">Les plus populaires (TMDB)</option>
              <option value="rating">Les mieux notés (⭐)</option>
              <option value="newest">Sorties récentes d'abord</option>
              <option value="classic">Classiques d'abord (Ancienneté)</option>
            </select>
          </div>

          {/* Era / Year Selector */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Époque & Année
            </label>
            <select
              value={selectedYearEra}
              onChange={(e) => setSelectedYearEra(e.target.value)}
              className="w-full bg-[#181528] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">Toutes les époques</option>
              <option value="2024">Nouveautés 2024 - 2025</option>
              <option value="2020-2023">Années 2020 - 2023</option>
              <option value="2010-2019">Décennie 2010 - 2019</option>
              <option value="2000-2009">Années 2000</option>
              <option value="classics">Classiques (Avant 2000 / Patrimoine)</option>
            </select>
          </div>

          {/* Country Selector */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">
              Pays d'origine
            </label>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full bg-[#181528] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="all">Tous les pays</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Discreet In-Feed Ad Banner */}
      <AdBannerSlot placement="in_feed" />

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-2">
        <span className="flex items-center gap-2">
          <span>
            Affichage de <strong className="text-white">{combinedItems.length}</strong> {isMovies ? 'films' : 'séries'} via l'API TMDB
          </span>
          {isLoading && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />}
        </span>
        {selectedGenre !== 'Tous' && (
          <button
            onClick={() => { setSelectedGenre('Tous'); setSelectedYearEra('all'); setSelectedCountry('all'); }}
            className="text-purple-400 hover:text-purple-300 font-medium"
          >
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* Grid of Cards */}
      {combinedItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
          {combinedItems.map(item => (
            <MediaCard
              key={item.id}
              media={item}
              onPlay={onPlay}
              onOpenDetails={onOpenDetails}
              onWatchlistChange={onWatchlistChange}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-[#110f1c] rounded-2xl border border-white/5 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
              <p className="text-xs text-zinc-400">Chargement des données TMDB en direct...</p>
            </div>
          ) : (
            <>
              <Film className="w-12 h-12 text-zinc-600 mx-auto" />
              <h3 className="text-lg font-semibold text-white">Aucun contenu trouvé pour ces critères</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Essayez de modifier ou de réinitialiser vos filtres de genre, d'époque ou de pays.
              </p>
              <button
                onClick={() => { setSelectedGenre('Tous'); setSelectedYearEra('all'); setSelectedCountry('all'); }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                Afficher tous les {isMovies ? 'films' : 'séries'}
              </button>
            </>
          )}
        </div>
      )}

      {/* Load More from TMDB */}
      <div className="flex justify-center pt-8">
        <button
          onClick={() => setCurrentPage(prev => prev + 1)}
          disabled={isLoading}
          className="px-6 py-3 bg-[#181528] hover:bg-purple-600 hover:text-white text-zinc-300 text-xs font-semibold rounded-xl border border-white/10 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Chargement TMDB...</span>
            </>
          ) : (
            <>
              <span>Charger plus de {isMovies ? 'films' : 'séries'} depuis TMDB</span>
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
