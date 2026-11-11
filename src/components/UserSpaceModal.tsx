import React, { useState } from 'react';
import {
  X, User, Bookmark, History, Play, Trash2, LogOut, Check, Film, Tv, Clock, Shield
} from 'lucide-react';
import { MediaItem, UserProfile, UserHistoryItem } from '../types';
import { storageService } from '../services/storageService';

interface UserSpaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  allMedia: MediaItem[];
  onPlay: (media: MediaItem, episodeId?: string) => void;
  onOpenDetails: (media: MediaItem) => void;
  onOpenAdmin: () => void;
  initialTab?: 'profile' | 'watchlist' | 'history';
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=200&q=80',
];

export const UserSpaceModal: React.FC<UserSpaceModalProps> = ({
  isOpen,
  onClose,
  allMedia,
  onPlay,
  onOpenDetails,
  onOpenAdmin,
  initialTab = 'watchlist',
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'watchlist' | 'history'>(initialTab);
  const [user, setUser] = useState<UserProfile>(() => storageService.getUserProfile());
  const [usernameInput, setUsernameInput] = useState(user.username);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  // Resolve media items in watchlist
  const watchlistItems = allMedia.filter(item =>
    user.watchlist.some(id => String(id) === String(item.id))
  );

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...user,
      username: usernameInput.trim() || 'Cinéphile',
    };
    storageService.saveUserProfile(updated);
    setUser(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleSelectAvatar = (url: string) => {
    const updated: UserProfile = { ...user, avatar: url };
    storageService.saveUserProfile(updated);
    setUser(updated);
  };

  const handleRemoveFromWatchlist = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    storageService.toggleWatchlist(id);
    setUser(storageService.getUserProfile());
  };

  const handleRemoveHistoryItem = (e: React.MouseEvent, mediaId: string | number, episodeId?: string) => {
    e.stopPropagation();
    storageService.removeHistoryItem(mediaId, episodeId);
    setUser(storageService.getUserProfile());
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-[#110f1c] border border-purple-900/30 rounded-2xl shadow-2xl shadow-purple-950/40 overflow-hidden flex flex-col my-auto animate-fade-in text-zinc-200"
      >
        {/* Header with Tabs */}
        <div className="bg-[#151224] border-b border-white/5 p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar}
              alt={user.username}
              className="w-12 h-12 rounded-full object-cover border-2 border-purple-500 shadow-md"
            />
            <div>
              <h3 className="text-lg font-bold text-white font-heading">{user.username}</h3>
              <p className="text-xs text-zinc-400">{user.email} · Membre depuis {user.joinedDate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <button
              onClick={() => {
                onClose();
                onOpenAdmin();
              }}
              className="px-3 py-1.5 rounded-lg bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Accès Administrateur"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span>Administration</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center border-b border-white/5 bg-[#0d0c15] px-4 sm:px-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'watchlist'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Ma Liste ({watchlistItems.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'history'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Continuer la lecture ({user.history.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-purple-500 text-white font-semibold'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Mon Profil</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
          {/* TAB 1: WATCHLIST ("Ma Liste") */}
          {activeTab === 'watchlist' && (
            <div>
              {watchlistItems.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {watchlistItems.map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onClose();
                        onOpenDetails(item);
                      }}
                      className="group flex gap-3 p-2.5 rounded-xl bg-white/5 hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer relative"
                    >
                      <div className="w-16 h-24 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                        <img
                          src={item.poster}
                          alt={item.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="min-w-0 flex-1 flex flex-col justify-between py-1">
                        <div>
                          <span className="text-[10px] text-purple-400 font-semibold uppercase">
                            {item.type === 'movie' ? 'Film' : 'Série'}
                          </span>
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-purple-300">
                            {item.title}
                          </h4>
                          <span className="text-[11px] text-zinc-400">{item.releaseYear} · {item.duration}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onClose();
                              onPlay(item);
                            }}
                            className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-[11px] font-medium flex items-center gap-1"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Lire</span>
                          </button>
                          <button
                            onClick={(e) => handleRemoveFromWatchlist(e, item.id)}
                            className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors"
                            title="Retirer de ma liste"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <Bookmark className="w-10 h-10 text-zinc-600 mx-auto" />
                  <h4 className="text-sm font-semibold text-white">Votre liste est vide</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Cliquez sur le bouton « + » ou « Ajouter à ma liste » sur n'importe quel film ou série pour le retrouver ici facilement.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WATCH HISTORY ("Continuer à regarder") */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              {user.history.length > 0 ? (
                user.history.map((hist, idx) => {
                  const media = allMedia.find(m => String(m.id) === String(hist.mediaId));
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (media) {
                          onClose();
                          onPlay(media);
                        }
                      }}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 rounded-xl bg-white/5 hover:bg-purple-950/40 border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative w-20 h-12 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                          <img
                            src={hist.poster}
                            alt={hist.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-4 h-4 text-white fill-current" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-300">
                            {hist.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            <Clock className="w-3 h-3 text-purple-400" />
                            <span>Progression : {hist.progressPercent}%</span>
                            <span>·</span>
                            <span>{hist.lastWatched}</span>
                          </div>
                          {/* Progress bar */}
                          <div className="w-36 h-1 bg-zinc-700 rounded-full overflow-hidden mt-1.5">
                            <div
                              className="h-full bg-purple-500 rounded-full"
                              style={{ width: `${hist.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (media) {
                              onClose();
                              onPlay(media);
                            }
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Reprendre</span>
                        </button>
                        <button
                          onClick={(e) => handleRemoveHistoryItem(e, hist.mediaId, hist.episodeId)}
                          className="p-1.5 text-zinc-500 hover:text-red-400 rounded transition-colors"
                          title="Supprimer de l'historique"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center space-y-2">
                  <History className="w-10 h-10 text-zinc-600 mx-auto" />
                  <h4 className="text-sm font-semibold text-white">Aucun historique de visionnage</h4>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                    Lancez un film ou un épisode pour enregistrer votre position et pouvoir la reprendre plus tard sur n'importe quel écran.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFILE SETTINGS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-6 max-w-md">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                  Choisir un Avatar Cinéma
                </label>
                <div className="flex items-center gap-3">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectAvatar(preset)}
                      className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all ${
                        user.avatar === preset ? 'border-purple-500 ring-2 ring-purple-500/50 scale-105' : 'border-white/10 hover:border-white/30'
                      }`}
                    >
                      <img src={preset} alt="Avatar" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Nom d'utilisateur / Pseudo
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-[#181528] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full bg-[#181528]/50 border border-white/5 rounded-xl px-3 py-2 text-sm text-zinc-500 cursor-not-allowed"
                />
              </div>

              {savedSuccess && (
                <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Modifications du profil enregistrées avec succès !</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl transition-colors"
                >
                  Sauvegarder mon profil
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
