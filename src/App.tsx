/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MediaItem, Episode, ActiveTab, UserProfile, LiveStreamChannel } from './types';
import { storageService } from './services/storageService';
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { MediaRow } from './components/MediaRow';
import { MediaCard } from './components/MediaCard';
import { VideoPlayer } from './components/VideoPlayer';
import { MediaDetailModal } from './components/MediaDetailModal';
import { CatalogView } from './components/CatalogView';
import { LiveDirectView } from './components/LiveDirectView';
import { SearchModal } from './components/SearchModal';
import { UserSpaceModal } from './components/UserSpaceModal';
import { AdminModal } from './components/AdminModal';
import { AdBannerSlot } from './components/AdBannerSlot';
import { AdNetworkBanners } from './components/AdNetworkBanners';
import { Footer } from './components/Footer';
import { tmdbService } from './services/tmdbService';
import { Film, Sparkles, Bookmark, Flame, Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [mediaList, setMediaList] = useState<MediaItem[]>(() => storageService.getMediaCatalog());
  const [user, setUser] = useState<UserProfile>(() => storageService.getUserProfile());
  const [isLiveLoadingTmdb, setIsLiveLoadingTmdb] = useState(false);

  // Modals & Active Viewers
  const [activeMediaForPlayer, setActiveMediaForPlayer] = useState<MediaItem | null>(null);
  const [activeEpisodeForPlayer, setActiveEpisodeForPlayer] = useState<Episode | undefined>(undefined);
  const [activeMediaForDetails, setActiveMediaForDetails] = useState<MediaItem | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [userSpaceOpen, setUserSpaceOpen] = useState(false);
  const [userSpaceInitialTab, setUserSpaceInitialTab] = useState<'profile' | 'watchlist' | 'history'>('watchlist');
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  // Auto-populate entire catalog directly from TMDB API on mount
  useEffect(() => {
    let isCancelled = false;
    const loadLiveTmdbCatalog = async () => {
      setIsLiveLoadingTmdb(true);
      try {
        const [trend, popM, nowPlaying, classics, popTv, classicTv, topRated] = await Promise.all([
          tmdbService.getTrending('all'),
          tmdbService.getPopularMovies(),
          tmdbService.getNowPlayingMovies(),
          tmdbService.getClassicMovies(),
          tmdbService.getPopularTv(),
          tmdbService.getClassicTv(),
          tmdbService.getTopRatedMovies(),
        ]);

        if (!isCancelled) {
          const combined = [...trend, ...popM, ...nowPlaying, ...classics, ...popTv, ...classicTv, ...topRated];
          const map = new Map<string, MediaItem>();

          // Keep user custom added items
          const currentCatalog = storageService.getMediaCatalog();
          currentCatalog.filter(m => m.customAdded).forEach(m => map.set(String(m.id), m));

          // Add live TMDB items
          combined.forEach(item => {
            if (!map.has(String(item.id))) {
              map.set(String(item.id), item);
            }
          });

          // Ensure at least first item is featured
          const list = Array.from(map.values());
          if (list.length > 0 && !list.some(m => m.isFeatured)) {
            list[0].isFeatured = true;
          }

          storageService.saveMediaCatalog(list);
          setMediaList(list);
        }
      } catch (err) {
        console.error('Failed to auto-populate from TMDB:', err);
      } finally {
        if (!isCancelled) setIsLiveLoadingTmdb(false);
      }
    };

    loadLiveTmdbCatalog();
    return () => { isCancelled = true; };
  }, []);

  // Record page view on tab change
  useEffect(() => {
    storageService.recordPageView(activeTab);
  }, [activeTab]);

  const refreshCatalog = useCallback(() => {
    setMediaList(storageService.getMediaCatalog());
  }, []);

  const refreshUser = useCallback(() => {
    setUser(storageService.getUserProfile());
  }, []);

  // Filtered Media Sets for Home Sections
  const featuredItems = useMemo(() => {
    const featured = mediaList.filter(m => m.isFeatured);
    return featured.length > 0 ? featured : mediaList.slice(0, 3);
  }, [mediaList]);

  const trendingItems = useMemo(() => mediaList.filter(m => m.isTrending), [mediaList]);
  const popularMovies = useMemo(() => mediaList.filter(m => m.type === 'movie' && (m.votesCount || 0) > 3000), [mediaList]);
  const newReleases = useMemo(() => mediaList.filter(m => m.releaseYear >= 2023 || m.isNew), [mediaList]);
  const classicFilms = useMemo(() => mediaList.filter(m => m.type === 'movie' && (m.releaseYear < 2000 || m.isClassic)), [mediaList]);
  const popularSeries = useMemo(() => mediaList.filter(m => m.type === 'tv'), [mediaList]);
  const classicSeries = useMemo(() => mediaList.filter(m => m.type === 'tv' && (m.releaseYear < 2015 || m.isClassic)), [mediaList]);
  const topRatedItems = useMemo(() => mediaList.filter(m => m.rating >= 8.5), [mediaList]);
  const editorialRecommendations = useMemo(() => [...mediaList].sort(() => 0.5 - Math.random()).slice(0, 8), [mediaList]);

  // Player launchers
  const handlePlayMedia = (media: MediaItem, episodeOrId?: Episode | string) => {
    setActiveMediaForPlayer(media);
    if (typeof episodeOrId === 'string') {
      let found: Episode | undefined;
      if (media.seasons) {
        for (const s of media.seasons) {
          found = s.episodes.find(e => e.id === episodeOrId);
          if (found) break;
        }
      }
      setActiveEpisodeForPlayer(found);
    } else {
      setActiveEpisodeForPlayer(episodeOrId);
    }
    // If detail modal was open, close it
    setActiveMediaForDetails(null);
  };

  const handleNextEpisode = () => {
    if (!activeMediaForPlayer || activeMediaForPlayer.type !== 'tv' || !activeMediaForPlayer.seasons) return;

    // Find current season and episode
    for (const s of activeMediaForPlayer.seasons) {
      if (activeEpisodeForPlayer && s.seasonNumber === activeEpisodeForPlayer.seasonNumber) {
        const nextEpIndex = s.episodes.findIndex(e => e.id === activeEpisodeForPlayer.id) + 1;
        if (nextEpIndex < s.episodes.length) {
          setActiveEpisodeForPlayer(s.episodes[nextEpIndex]);
          return;
        }
      }
    }
  };

  const handlePlayDirectChannel = (channel: LiveStreamChannel) => {
    const channelMedia: MediaItem = {
      id: `channel-${channel.id}`,
      title: channel.name,
      originalTitle: channel.name,
      type: 'movie',
      releaseYear: new Date().getFullYear(),
      releaseDate: new Date().toISOString().split('T')[0],
      rating: 9.8,
      genres: ['Direct TV', channel.category],
      duration: 'En direct 24/7',
      country: 'Live Streaming',
      language: 'Direct TV (VF/VO)',
      cast: [],
      synopsis: channel.description || `Diffusion continue en direct. Format: ${channel.format.toUpperCase()} (${channel.qualityBadge || '1080p FHD'}).`,
      poster: channel.logo,
      backdrop: channel.logo,
      videoUrl: channel.streamUrl,
      trailerUrl: channel.streamUrl,
      isFeatured: false,
    };
    handlePlayMedia(channelMedia);
  };

  const handleOpenUserSpace = (tab: 'profile' | 'watchlist' | 'history' = 'watchlist') => {
    setUserSpaceInitialTab(tab);
    setUserSpaceOpen(true);
  };

  const handleOpenDetails = (media: MediaItem) => {
    setActiveMediaForDetails(media);
  };

  return (
    <div className="min-h-screen bg-[#08070d] text-[#f3f3f7] flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* Optional Discreet Header Sponsor Bar */}
      <AdBannerSlot placement="header_bar" />

      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        onNavigate={setActiveTab}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenUserSpace={handleOpenUserSpace}
        onOpenAdmin={() => setAdminModalOpen(true)}
        user={user}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {/* VIEW 1: HOME PAGE */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <HeroBanner
              featuredItems={featuredItems}
              onPlay={handlePlayMedia}
              onOpenDetails={handleOpenDetails}
              onWatchlistChange={refreshUser}
            />

            {/* Sub-hero Ad Placement (Image or Video) */}
            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-2">
              <AdBannerSlot placement="sub_hero" />
            </div>

            {/* Quick Resume bar if user has recent in-progress streams */}
            {user.history.length > 0 && (
              <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4">
                <div className="bg-[#12101e] border border-purple-900/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/20">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Reprendre la lecture</span>
                      <h4 className="text-sm font-bold text-white line-clamp-1">{user.history[0].title}</h4>
                      <p className="text-[11px] text-zinc-400">Progression : {user.history[0].progressPercent}%</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const media = mediaList.find(m => String(m.id) === String(user.history[0].mediaId));
                      if (media) handlePlayMedia(media);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold self-end sm:self-center transition-colors"
                  >
                    Reprendre maintenant
                  </button>
                </div>
              </div>
            )}

            {/* Section 1: Tendances du moment */}
            <MediaRow
              title="Tendances du moment"
              subtitle="Les films et séries les plus regardés aujourd'hui sur STREAMORA"
              items={trendingItems}
              onPlay={handlePlayMedia}
              onOpenDetails={handleOpenDetails}
              onWatchlistChange={refreshUser}
            />

            {/* Section 2: Films populaires */}
            <MediaRow
              title="Films populaires"
              subtitle="Les grands succès cinématographiques acclamés par le public"
              items={popularMovies}
              onPlay={handlePlayMedia}
              onOpenDetails={handleOpenDetails}
              onWatchlistChange={refreshUser}
            />

            {/* Discreet In-Feed Ad Banner (Slot 1) */}
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <AdBannerSlot placement="in_feed" />
            </div>

            {/* Section 3: Nouveautés cinéma & récemment ajoutés */}
            <MediaRow
              title="Nouveautés cinéma & récentes sorties"
              subtitle="Les dernières pépites arrivées au catalogue"
              items={newReleases}
              onPlay={handlePlayMedia}
              onOpenDetails={handleOpenDetails}
              onWatchlistChange={refreshUser}
            />

            {/* Section 4: Films classiques incontournables */}
            <MediaRow
              title="Films classiques & Chefs-d'œuvre"
              subtitle="Des années 1940 aux années 1990 : l'histoire du cinéma mondial à portée de clic"
              items={classicFilms}
              onPlay={handlePlayMedia}
              onOpenDetails={handleOpenDetails}
              onWatchlistChange={refreshUser}
            />

            {/* Section 5: Séries populaires intégrales */}
            <MediaRow
              title="Séries populaires intégrales"
              subtitle="Des sagas télévisuelles cultes à visionner saison par saison"
              items={popularSeries}
              onPlay={handlePlayMedia}
              onOpenDetails={handleOpenDetails}
              onWatchlistChange={refreshUser}
            />

            {/* Section 6: Séries classiques cultes */}
            <MediaRow
              title="Séries cultes & classiques"
              subtitle="Les œuvres qui ont révolutionné le petit écran"
              items={classicSeries}
              onPlay={handlePlayMedia}
              onOpenDetails={handleOpenDetails}
              onWatchlistChange={refreshUser}
            />

            {/* Section 7: Films les mieux notés (Top Rated) */}
            <MediaRow
              title="Les mieux notés par la critique (⭐ 8.5+)"
              subtitle="Les plus hautes distinctions et notes d'évaluation du 7ème art"
              items={topRatedItems}
              onPlay={handlePlayMedia}
              onOpenDetails={handleOpenDetails}
              onWatchlistChange={refreshUser}
            />

            {/* Section 8: Recommandations de la rédaction */}
            <MediaRow
              title="Recommandations STREAMORA"
              subtitle="Sélectionnées pour vous par nos programmateurs de cinéma"
              items={editorialRecommendations}
              onPlay={handlePlayMedia}
              onOpenDetails={handleOpenDetails}
              onWatchlistChange={refreshUser}
            />
          </div>
        )}

        {/* VIEW 2: MOVIES DEDICATED CATALOG */}
        {activeTab === 'movies' && (
          <CatalogView
            type="movie"
            allMedia={mediaList}
            onPlay={handlePlayMedia}
            onOpenDetails={handleOpenDetails}
            onWatchlistChange={refreshUser}
          />
        )}

        {/* VIEW 3: SERIES DEDICATED CATALOG */}
        {activeTab === 'series' && (
          <CatalogView
            type="tv"
            allMedia={mediaList}
            onPlay={handlePlayMedia}
            onOpenDetails={handleOpenDetails}
            onWatchlistChange={refreshUser}
          />
        )}

        {/* VIEW 4: NEWS (Nouveautés) */}
        {activeTab === 'news' && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Nouveautés & Sorties Récentes</span>
              </span>
              <h1 className="text-3xl font-extrabold text-white font-heading">
                Les Dernières Sorties Cinéma & Séries
              </h1>
              <p className="text-xs text-zinc-400 max-w-xl">
                Restez à l'affût des productions de 2024 et 2025 ajoutées sur la plateforme.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {newReleases.map(item => (
                <MediaCard
                  key={item.id}
                  media={item}
                  onPlay={handlePlayMedia}
                  onOpenDetails={handleOpenDetails}
                  onWatchlistChange={refreshUser}
                />
              ))}
            </div>
          </div>
        )}

        {/* VIEW 5: WATCHLIST DIRECT TAB */}
        {activeTab === 'watchlist' && (
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark className="w-4 h-4" />
                <span>Espace Personnel</span>
              </span>
              <h1 className="text-3xl font-extrabold text-white font-heading">
                Ma Liste de Films & Séries
              </h1>
              <p className="text-xs text-zinc-400">
                Vos titres enregistrés pour les regarder à tout moment.
              </p>
            </div>

            {mediaList.filter(m => user.watchlist.some(id => String(id) === String(m.id))).length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {mediaList
                  .filter(m => user.watchlist.some(id => String(id) === String(m.id)))
                  .map(item => (
                    <MediaCard
                      key={item.id}
                      media={item}
                      onPlay={handlePlayMedia}
                      onOpenDetails={handleOpenDetails}
                      onWatchlistChange={refreshUser}
                    />
                  ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-[#110f1c] rounded-2xl border border-white/5 space-y-3">
                <Bookmark className="w-12 h-12 text-zinc-600 mx-auto" />
                <h3 className="text-lg font-semibold text-white">Votre liste est vide pour le moment</h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Explorez le catalogue et cliquez sur « + » pour ajouter des films et séries à votre liste personnelle.
                </p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  Découvrir le catalogue
                </button>
              </div>
            )}
          </div>
        )}

        {/* VIEW 6: DIRECT & CHAÎNES LIVE (MP4 / HLS / YOUTUBE) */}
        {activeTab === 'direct' && (
          <LiveDirectView onPlayDirectStream={handlePlayDirectChannel} />
        )}
      </main>

      {/* Bottom Ad Network & Banners Section ("ajout en bas aficher ses pubs et places banniers pours les regies publicitaire") */}
      <AdNetworkBanners />

      {/* Footer */}
      <Footer
        onNavigate={setActiveTab}
        onOpenAdmin={() => setAdminModalOpen(true)}
      />

      {/* Video Player Modal */}
      {activeMediaForPlayer && (
        <VideoPlayer
          media={activeMediaForPlayer}
          currentEpisode={activeEpisodeForPlayer}
          onClose={() => {
            setActiveMediaForPlayer(null);
            setActiveEpisodeForPlayer(undefined);
            refreshUser();
          }}
          onNextEpisode={handleNextEpisode}
        />
      )}

      {/* Detailed Media Modal */}
      {activeMediaForDetails && (
        <MediaDetailModal
          media={activeMediaForDetails}
          allMedia={mediaList}
          onClose={() => setActiveMediaForDetails(null)}
          onPlay={handlePlayMedia}
          onSelectMedia={handleOpenDetails}
          onWatchlistChange={refreshUser}
        />
      )}

      {/* Smart Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        allMedia={mediaList}
        onSelectMedia={handleOpenDetails}
      />

      {/* User Space Modal */}
      <UserSpaceModal
        isOpen={userSpaceOpen}
        onClose={() => {
          setUserSpaceOpen(false);
          refreshUser();
        }}
        allMedia={mediaList}
        onPlay={handlePlayMedia}
        onOpenDetails={handleOpenDetails}
        onOpenAdmin={() => setAdminModalOpen(true)}
        initialTab={userSpaceInitialTab}
      />

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        mediaList={mediaList}
        onRefreshMedia={refreshCatalog}
      />
    </div>
  );
}
