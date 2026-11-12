import React, { useState } from 'react';
import {
  Search, Film, Tv, Radio, Home, Menu, X, Bell, BellOff, Bookmark, Megaphone
} from 'lucide-react';
import { ActiveTab, UserProfile } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface NavbarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenSearch: () => void;
  onOpenUserSpace: (tab?: 'profile' | 'watchlist' | 'history') => void;
  user: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  onOpenSearch,
  onOpenUserSpace,
  user,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const {
    serverEnabled,
    isSubscribed,
    isBusy,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  const navLinks: { tab: ActiveTab; label: string }[] = [
    { tab: 'home', label: 'Accueil' },
    { tab: 'movies', label: 'Films' },
    { tab: 'series', label: 'Séries' },
    { tab: 'news', label: 'Nouveautés' },
    { tab: 'direct', label: 'Direct' },
    { tab: 'partenariat', label: 'Partenariat' },
  ];

  const handleTogglePush = async () => {
    if (isBusy) return;
    if (isSubscribed) {
      await unsubscribe();
    } else {
      await subscribe();
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#08070d]/92 backdrop-blur-lg border-b border-white/8">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-3 md:gap-6">
          {/* Zone 1: Brand Title */}
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 text-left focus:outline-none shrink-0 group min-h-[44px]"
            aria-label="Accueil STREAMORA"
          >
            <img
              src="/icon.svg"
              alt="Logo STREAMORA"
              className="w-8 h-8 rounded-lg shadow-md shadow-purple-950/50 group-hover:scale-105 transition-transform"
            />
            <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wider text-white font-heading">
              STREAM<span className="text-purple-400">ORA</span>
            </span>
          </button>

          {/* Zone 2: Single-line Desktop Navigation */}
          <nav aria-label="Navigation principale" className="hidden lg:flex items-center gap-6 text-sm font-medium">
            {navLinks.map(({ tab, label }) => {
              const isActive =
                activeTab === tab ||
                (tab === 'movies' && activeTab === 'movie') ||
                (tab === 'series' && (activeTab === 'series_detail' || activeTab === 'episode'));

              return (
                <button
                  key={tab}
                  onClick={() => onNavigate(tab)}
                  className={`whitespace-nowrap shrink-0 transition-colors py-2 relative flex items-center gap-1.5 ${
                    isActive ? 'text-white font-semibold' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {tab === 'direct' && <Radio className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                  <span>{label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Direct Quick Button, Search, Push Toggle, PWA Install & Watchlist/Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={() => onNavigate('direct')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 min-h-[40px] rounded-xl border text-xs font-semibold transition-colors ${
                activeTab === 'direct'
                  ? 'bg-rose-600 border-rose-500 text-white shadow-md shadow-rose-950/50'
                  : 'bg-rose-500/12 hover:bg-rose-500/22 border-rose-500/35 text-rose-200 hover:text-white'
              }`}
              aria-label="Accéder aux chaînes et flux en direct"
            >
              <Radio className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Direct</span>
            </button>

            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-3 sm:px-4 min-h-[40px] rounded-xl bg-white/6 hover:bg-white/12 border border-white/10 text-zinc-300 hover:text-white text-xs sm:text-sm transition-colors"
              aria-label="Rechercher un film, une série ou un acteur"
            >
              <Search className="w-4 h-4 text-purple-400 shrink-0" />
              <span className="hidden md:inline text-zinc-400">Rechercher...</span>
            </button>

            {serverEnabled && (
              <button
                onClick={handleTogglePush}
                disabled={isBusy}
                className={`p-2 min-w-[40px] min-h-[40px] rounded-xl border transition-colors flex items-center justify-center ${
                  isSubscribed
                    ? 'bg-purple-600/20 border-purple-500/40 text-purple-300'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                }`}
                title={isSubscribed ? 'Notifications push activées (cliquer pour gérer)' : 'Activer les alertes nouveautés'}
                aria-label={isSubscribed ? 'Désactiver les notifications push' : 'Activer les notifications push'}
              >
                {isSubscribed ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </button>
            )}

            <PWAInstallButton compact />

            <button
              onClick={() => onOpenUserSpace('watchlist')}
              className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-purple-500/50 transition-all focus:outline-none min-w-[40px] min-h-[40px] justify-center"
              title="Mon espace & Ma liste"
              aria-label="Mon espace et ma liste"
            >
              <img
                src={user.avatar || '/images/app-icon.png'}
                alt={user.username}
                className="w-8 h-8 rounded-full object-cover border border-purple-500/50"
              />
            </button>

            {/* Mobile/Tablet menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 min-w-[40px] min-h-[40px] rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 flex items-center justify-center"
              aria-label="Ouvrir le menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#100e1b] border-t border-white/10 px-4 py-4 space-y-1.5">
            {navLinks.map(({ tab, label }) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    onNavigate(tab);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-medium flex items-center justify-between min-h-[44px] ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-200 font-semibold border border-purple-500/30'
                      : 'text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {tab === 'direct' && <Radio className="w-4 h-4 text-rose-400" />}
                    {tab === 'partenariat' && <Megaphone className="w-4 h-4 text-purple-400" />}
                    <span>{label}</span>
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => {
                onNavigate('watchlist');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-medium flex items-center justify-between min-h-[44px] ${
                activeTab === 'watchlist'
                  ? 'bg-purple-600/20 text-purple-200 font-semibold border border-purple-500/30'
                  : 'text-zinc-300 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-purple-400" />
                <span>Ma Liste</span>
              </span>
              {user.watchlist.length > 0 && (
                <span className="text-xs text-purple-300 font-mono">{user.watchlist.length}</span>
              )}
            </button>
          </div>
        )}
      </header>

      {/* Mobile Bottom Navigation Bar (MovieBox Mobile-First pattern) */}
      <nav
        aria-label="Navigation mobile inférieure"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#09080f]/95 backdrop-blur-xl border-t border-white/10 pb-safe"
      >
        <div className="grid grid-cols-5 h-15">
          <button
            onClick={() => onNavigate('home')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'home' ? 'text-purple-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Accueil</span>
          </button>

          <button
            onClick={() => onNavigate('movies')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'movies' || activeTab === 'movie'
                ? 'text-purple-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Film className="w-5 h-5" />
            <span>Films</span>
          </button>

          <button
            onClick={() => onNavigate('series')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'series' || activeTab === 'series_detail' || activeTab === 'episode'
                ? 'text-purple-400'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Tv className="w-5 h-5" />
            <span>Séries</span>
          </button>

          <button
            onClick={() => onNavigate('direct')}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'direct' ? 'text-rose-400' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Radio className="w-5 h-5" />
            <span>Direct</span>
          </button>

          <button
            onClick={onOpenSearch}
            className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <Search className="w-5 h-5" />
            <span>Recherche</span>
          </button>
        </div>
      </nav>
    </>
  );
};
