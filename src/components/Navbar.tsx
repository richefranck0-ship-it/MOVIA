import React, { useState } from 'react';
import { Search, Radio, Film, Tv, Bookmark, Play, Menu, X } from 'lucide-react';
import { ActiveTab, UserProfile } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onOpenSearch: () => void;
  onOpenUserSpace: (tab?: 'profile' | 'watchlist' | 'history') => void;
  onOpenAdmin: () => void;
  user: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onNavigate,
  onOpenSearch,
  onOpenUserSpace,
  onOpenAdmin,
  user,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks: { tab: ActiveTab; label: string; icon?: React.ReactNode }[] = [
    { tab: 'home', label: 'Accueil' },
    { tab: 'direct', label: 'Direct' },
    { tab: 'movies', label: 'Films' },
    { tab: 'series', label: 'Séries' },
    { tab: 'news', label: 'Nouveautés' },
    { tab: 'watchlist', label: 'Ma Liste' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#08070d]/90 backdrop-blur-md border-b border-purple-900/20">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand title (double-click opens admin quietly) */}
        <button
          onClick={() => onNavigate('home')}
          onDoubleClick={onOpenAdmin}
          className="flex items-center gap-2.5 text-left focus:outline-none shrink-0 group"
          title="STREAMORA"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-700 to-violet-500 flex items-center justify-center shadow-md shadow-purple-900/40 group-hover:scale-105 transition-transform">
            <Play className="w-4 h-4 text-white fill-current ml-0.5" />
          </div>
          <span className="text-xl md:text-2xl font-black tracking-wider text-white font-heading">
            STREAM<span className="text-purple-500">ORA</span>
          </span>
        </button>

        {/* Zone 2: Nav links (Single-line controls) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map(({ tab, label }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => onNavigate(tab)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 relative flex items-center gap-1.5 ${
                  isActive
                    ? 'text-white font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab === 'direct' && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                )}
                <span>{label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500 rounded-full" />
                )}
                {tab === 'watchlist' && user.watchlist.length > 0 && (
                  <span className="ml-1 text-[10px] bg-purple-950 text-purple-300 border border-purple-500/30 px-1.5 py-0.2 rounded-full font-mono">
                    {user.watchlist.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Interactive Affordances (Search & User Profile only - no public admin password button!) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Search Trigger */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Rechercher un film, une série..."
            aria-label="Rechercher"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => onOpenUserSpace('watchlist')}
            className="flex items-center gap-2 p-1 rounded-full hover:ring-2 hover:ring-purple-500/50 transition-all focus:outline-none"
            title="Mon profil & Ma liste"
            aria-label="Mon profil & Ma liste"
          >
            <img
              src={user.avatar}
              alt={user.username}
              className="w-8 h-8 rounded-full object-cover border border-purple-500/50"
            />
          </button>

          {/* Mobile hamburger toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white"
            aria-label="Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#100e1b] border-b border-purple-900/30 px-4 py-4 space-y-2">
          {navLinks.map(({ tab, label }) => (
            <button
              key={tab}
              onClick={() => {
                onNavigate(tab);
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-between ${
                activeTab === tab
                  ? 'bg-purple-600/20 text-purple-300 font-semibold border border-purple-500/30'
                  : 'text-zinc-300 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab === 'direct' && <span className="w-2 h-2 rounded-full bg-rose-500" />}
                <span>{label}</span>
              </div>
              {tab === 'watchlist' && user.watchlist.length > 0 && (
                <span className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded-full">
                  {user.watchlist.length}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </header>
  );
};
