import React, { useState } from 'react';
import {
  Shield, Key, Lock, X, Plus, Trash2, Edit3, Star, BarChart3,
  Megaphone, Film, Tv, ExternalLink, Check, AlertCircle, RefreshCw, Eye, MousePointerClick, Radio, Video, RotateCcw
} from 'lucide-react';
import { MediaItem, AdBanner, TrafficStats, ContentReport, AdPlacement, LiveStreamChannel } from '../types';
import { storageService } from '../services/storageService';
import { tmdbService } from '../services/tmdbService';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaList: MediaItem[];
  onRefreshMedia: () => void;
}

const DEFAULT_ADMIN_PIN = '8000';
const ADMIN_AUTH_KEY = 'streamora_admin_auth_v2';
const ADMIN_PASSWORD_CUSTOM_KEY = 'streamora_admin_pin_custom_v2';

const getStoredAdminPin = () => {
  try {
    return localStorage.getItem(ADMIN_PASSWORD_CUSTOM_KEY) || DEFAULT_ADMIN_PIN;
  } catch {
    return DEFAULT_ADMIN_PIN;
  }
};

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  mediaList,
  onRefreshMedia,
}) => {
  // Check if admin is authenticated in cache
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const currentPin = getStoredAdminPin();
      return localStorage.getItem(ADMIN_AUTH_KEY) === currentPin;
    } catch {
      return false;
    }
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'direct' | 'ads' | 'traffic' | 'reports' | 'tmdb' | 'security'>('content');
  const [isSyncingTmdb, setIsSyncingTmdb] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Live direct streams state
  const [liveChannels, setLiveChannels] = useState<LiveStreamChannel[]>(() => storageService.getLiveChannels());
  const [showAddChannelModal, setShowAddChannelModal] = useState(false);
  const [channelFormData, setChannelFormData] = useState({
    name: '',
    category: 'Cinéma & Fiction',
    streamUrl: '',
    format: 'mp4' as 'mp4' | 'hls' | 'youtube',
    description: '',
    qualityBadge: '1080p FHD',
  });

  // Content form state
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [mediaFormData, setMediaFormData] = useState({
    title: '',
    originalTitle: '',
    type: 'movie' as 'movie' | 'tv',
    releaseYear: 2024,
    rating: 8.0,
    genres: 'Action, Science-Fiction',
    duration: '2h 10m',
    country: 'France / États-Unis',
    director: '',
    synopsis: '',
    poster: '',
    backdrop: '',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
  });

  // Ads form state
  const [ads, setAds] = useState<AdBanner[]>(() => storageService.getAds());
  const [showAddAdModal, setShowAddAdModal] = useState(false);
  const [adFormData, setAdFormData] = useState({
    clientName: '',
    title: '',
    description: '',
    mediaType: 'image' as 'image' | 'video',
    mediaUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    targetUrl: 'https://example.com',
    placement: 'in_feed' as AdPlacement,
    badgeText: 'Partenaire Recommandé',
  });

  // Traffic stats state
  const [stats, setStats] = useState<TrafficStats>(() => storageService.getTrafficStats());
  // Reports state
  const [reports, setReports] = useState<ContentReport[]>(() => storageService.getReports());
  // TMDB key state
  const [tmdbKeyInput, setTmdbKeyInput] = useState(() => storageService.getTmdbKey());
  const [tmdbTestResult, setTmdbTestResult] = useState<string | null>(null);
  const [isTestingTmdb, setIsTestingTmdb] = useState(false);

  if (!isOpen) return null;

  // Handle PIN authentication & save in cache
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPin = getStoredAdminPin();
    if (pinInput.trim() === currentPin) {
      setIsAuthenticated(true);
      setPinError(false);
      try {
        localStorage.setItem(ADMIN_AUTH_KEY, currentPin);
      } catch {
        // ignore
      }
    } else {
      setPinError(true);
    }
  };

  // Lock admin session (clear cache)
  const handleLogoutAdmin = () => {
    try {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    } catch {
      // ignore
    }
    setIsAuthenticated(false);
    setPinInput('');
  };

  // Change admin password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordInput.trim()) return;
    try {
      localStorage.setItem(ADMIN_PASSWORD_CUSTOM_KEY, newPasswordInput.trim());
      localStorage.setItem(ADMIN_AUTH_KEY, newPasswordInput.trim());
      setPasswordChangeSuccess(true);
      setNewPasswordInput('');
      setTimeout(() => setPasswordChangeSuccess(false), 2500);
    } catch {
      // ignore
    }
  };

  // Reset traffic stats to zero
  const handleResetTraffic = () => {
    const zero = storageService.resetTrafficStats();
    setStats(zero);
  };

  // Sync entire live TMDB catalog
  const handleSyncFromTmdb = async () => {
    setIsSyncingTmdb(true);
    setSyncSuccessMsg(null);
    try {
      const [trend, popM, popTv, classics, classicTv] = await Promise.all([
        tmdbService.getTrending('all'),
        tmdbService.getPopularMovies(),
        tmdbService.getPopularTv(),
        tmdbService.getClassicMovies(),
        tmdbService.getClassicTv(),
      ]);
      const combined = [...trend, ...popM, ...popTv, ...classics, ...classicTv];
      const map = new Map<string, MediaItem>();
      mediaList.filter(m => m.customAdded).forEach(m => map.set(String(m.id), m));
      combined.forEach(m => {
        if (!map.has(String(m.id))) map.set(String(m.id), m);
      });
      const updatedList = Array.from(map.values());
      storageService.saveMediaCatalog(updatedList);
      onRefreshMedia();
      setSyncSuccessMsg(`Catalogue actualisé ! ${updatedList.length} titres synchronisés depuis l'API TMDB.`);
    } catch (err) {
      console.error(err);
      setSyncSuccessMsg('Erreur lors de la synchronisation TMDB.');
    } finally {
      setIsSyncingTmdb(false);
    }
  };

  // Toggle Featured status on hero
  const handleToggleFeatured = (id: string | number) => {
    storageService.toggleFeatured(id);
    onRefreshMedia();
  };

  // Delete media item
  const handleDeleteMedia = (id: string | number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce titre du catalogue STREAMORA ?")) {
      storageService.deleteMediaItem(id);
      onRefreshMedia();
    }
  };

  // Save new or edited media
  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    const genresArray = mediaFormData.genres.split(',').map(g => g.trim()).filter(Boolean);

    if (editingMedia) {
      const updated: MediaItem = {
        ...editingMedia,
        ...mediaFormData,
        genres: genresArray,
      };
      storageService.updateMediaItem(updated);
    } else {
      const newItem: MediaItem = {
        id: `custom_${Date.now()}`,
        ...mediaFormData,
        releaseDate: `${mediaFormData.releaseYear}-01-01`,
        language: 'Français / VOSTFR',
        genres: genresArray,
        cast: [
          { name: 'Acteur Principal', role: 'Rôle Majeur' },
          { name: 'Second Rôle', role: 'Protagoniste' }
        ],
        customAdded: true,
      };
      storageService.addMediaItem(newItem);
    }

    onRefreshMedia();
    setShowAddMediaModal(false);
    setEditingMedia(null);
  };

  // Open edit modal with prefilled data
  const handleOpenEdit = (item: MediaItem) => {
    setEditingMedia(item);
    setMediaFormData({
      title: item.title,
      originalTitle: item.originalTitle || item.title,
      type: item.type,
      releaseYear: item.releaseYear,
      rating: item.rating,
      genres: item.genres.join(', '),
      duration: item.duration,
      country: item.country,
      director: item.director || '',
      synopsis: item.synopsis,
      poster: item.poster,
      backdrop: item.backdrop,
      videoUrl: item.videoUrl,
      trailerUrl: item.trailerUrl,
    });
    setShowAddMediaModal(true);
  };

  // Handle Ads management
  const handleToggleAdActive = (ad: AdBanner) => {
    const updated = { ...ad, isActive: !ad.isActive };
    storageService.updateAd(updated);
    setAds(storageService.getAds());
  };

  const handleDeleteAd = (id: string) => {
    storageService.deleteAd(id);
    setAds(storageService.getAds());
  };

  const handleSaveAd = (e: React.FormEvent) => {
    e.preventDefault();
    const mediaUrl = adFormData.mediaUrl.trim() || adFormData.imageUrl.trim();
    storageService.addAd({
      clientName: adFormData.clientName.trim(),
      title: adFormData.title.trim(),
      description: adFormData.description.trim(),
      mediaType: adFormData.mediaType,
      mediaUrl,
      imageUrl: adFormData.mediaType === 'image' ? mediaUrl : adFormData.imageUrl.trim(),
      targetUrl: adFormData.targetUrl.trim(),
      placement: adFormData.placement,
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2027-12-31',
      badgeText: adFormData.badgeText.trim() || 'Sponsorisé',
    });
    setAds(storageService.getAds());
    setShowAddAdModal(false);
    setAdFormData({
      clientName: '',
      title: '',
      description: '',
      mediaType: 'image',
      mediaUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
      targetUrl: 'https://example.com',
      placement: 'in_feed',
      badgeText: 'Partenaire Recommandé',
    });
  };

  // Handle Channel management
  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelFormData.name.trim() || !channelFormData.streamUrl.trim()) return;

    storageService.addLiveChannel({
      name: channelFormData.name.trim(),
      category: channelFormData.category,
      logo: channelFormData.format === 'youtube'
        ? 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&q=80'
        : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80',
      streamUrl: channelFormData.streamUrl.trim(),
      format: channelFormData.format,
      description: channelFormData.description.trim() || 'Diffusion continue en direct.',
      isLive: true,
      qualityBadge: channelFormData.qualityBadge,
    });

    setLiveChannels(storageService.getLiveChannels());
    setShowAddChannelModal(false);
    setChannelFormData({
      name: '',
      category: 'Cinéma & Fiction',
      streamUrl: '',
      format: 'mp4',
      description: '',
      qualityBadge: '1080p FHD',
    });
  };

  // Handle TMDB test connection
  const handleSaveTmdbKey = async () => {
    storageService.setTmdbKey(tmdbKeyInput);
    setIsTestingTmdb(true);
    setTmdbTestResult(null);
    try {
      if (!tmdbKeyInput.trim()) {
        setTmdbTestResult('Clé supprimée. Le catalogue utilise désormais la base de données interne STREAMORA.');
      } else {
        const res = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${tmdbKeyInput.trim()}&language=fr-FR&page=1`);
        if (res.ok) {
          setTmdbTestResult('Succès ! Connexion à l\'API TMDB établie. Le catalogue en direct est maintenant actif.');
        } else {
          setTmdbTestResult(`Échec de connexion (Erreur ${res.status}). Vérifiez votre clé TMDB.`);
        }
      }
    } catch {
      setTmdbTestResult('Erreur réseau lors de la validation TMDB.');
    } finally {
      setIsTestingTmdb(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-5xl bg-[#100e1b] border border-purple-800/40 rounded-2xl shadow-2xl shadow-purple-950/50 overflow-hidden flex flex-col my-auto animate-fade-in text-zinc-200"
      >
        {/* If NOT authenticated, show PIN Screen */}
        {!isAuthenticated ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center mx-auto text-purple-400 shadow-lg shadow-purple-900/30">
              <Lock className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-white font-heading">
                Espace Administrateur
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Accès protégé. Veuillez saisir le code de sécurité pour déverrouiller le panneau de gestion.
              </p>
            </div>

            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div>
                <input
                  type="password"
                  autoFocus
                  placeholder="••••••••"
                  value={pinInput}
                  onChange={(e) => {
                    setPinInput(e.target.value);
                    setPinError(false);
                  }}
                  className="w-full bg-[#181528] border border-white/10 rounded-xl px-4 py-3 text-center text-lg tracking-widest text-white font-mono focus:outline-none focus:border-purple-500"
                />
                {pinError && (
                  <p className="text-xs text-red-400 mt-2 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Mot de passe incorrect.</span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950"
                >
                  Déverrouiller
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN PANEL */
          <>
            {/* Header */}
            <div className="bg-[#151224] border-b border-white/5 p-4 sm:p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md shadow-purple-950">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-heading">
                      Panneau d'Administration STREAMORA
                    </h3>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                      SESSION ACTIVE (EN CACHE)
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Gestion des flux, des publicités non-intrusives, des métadonnées et du trafic.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncFromTmdb}
                  disabled={isSyncingTmdb}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  title="Synchroniser le catalogue complet depuis l'API officielle TMDB"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingTmdb ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Sync TMDB</span>
                </button>
                <button
                  onClick={handleLogoutAdmin}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-red-950/40 text-zinc-400 hover:text-red-300 border border-white/10 text-xs transition-colors"
                  title="Verrouiller la session (effacer le mot de passe en cache)"
                >
                  Verrouiller
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

            {/* Sync success banner */}
            {syncSuccessMsg && (
              <div className="bg-emerald-950/80 border-b border-emerald-500/30 text-emerald-300 text-xs py-2 px-6 flex items-center justify-between">
                <span>{syncSuccessMsg}</span>
                <button onClick={() => setSyncSuccessMsg(null)} className="text-zinc-400 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-white/5 bg-[#0d0c15] px-4 sm:px-6 text-xs font-medium overflow-x-auto">
              <button
                onClick={() => setActiveTab('content')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'content'
                    ? 'border-purple-500 text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Film className="w-4 h-4 text-purple-400" />
                <span>Films & Séries ({mediaList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('direct')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'direct'
                    ? 'border-purple-500 text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Radio className="w-4 h-4 text-purple-400" />
                <span>Chaînes & Direct ({liveChannels.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('ads')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'ads'
                    ? 'border-purple-500 text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Megaphone className="w-4 h-4 text-purple-400" />
                <span>Régie Publicitaire ({ads.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('traffic')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'traffic'
                    ? 'border-purple-500 text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <span>Trafic & Statistiques</span>
              </button>

              <button
                onClick={() => setActiveTab('reports')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'reports'
                    ? 'border-purple-500 text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-purple-400" />
                <span>Signalements ({reports.filter(r => r.status === 'pending').length})</span>
              </button>

              <button
                onClick={() => setActiveTab('tmdb')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'tmdb'
                    ? 'border-purple-500 text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Key className="w-4 h-4 text-purple-400" />
                <span>Configuration API TMDB</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`py-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                  activeTab === 'security'
                    ? 'border-purple-500 text-white font-semibold'
                    : 'border-transparent text-zinc-400 hover:text-white'
                }`}
              >
                <Lock className="w-4 h-4 text-purple-400" />
                <span>Sécurité & Mot de Passe</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="p-4 sm:p-6 max-h-[65vh] overflow-y-auto">
              {/* TAB 1: CONTENT MANAGEMENT */}
              {activeTab === 'content' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">Catalogue Actif</h4>
                      <p className="text-xs text-zinc-400">
                        Ajoutez manuellement des films, séries, bandes-annonces ou flux vidéo autorisés.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingMedia(null);
                        setMediaFormData({
                          title: '',
                          originalTitle: '',
                          type: 'movie',
                          releaseYear: 2024,
                          rating: 8.2,
                          genres: 'Action, Science-Fiction',
                          duration: '2h 15m',
                          country: 'France / International',
                          director: '',
                          synopsis: '',
                          poster: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
                          backdrop: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?auto=format&fit=crop&w=1920&q=80',
                          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                          trailerUrl: 'https://www.youtube.com/embed/Way9Dexny3w',
                        });
                        setShowAddMediaModal(true);
                      }}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-950 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un Film ou une Série</span>
                    </button>
                  </div>

                  {/* List of items */}
                  <div className="space-y-2">
                    {mediaList.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.poster}
                            alt={item.title}
                            referrerPolicy="no-referrer"
                            className="w-10 h-14 object-cover rounded shrink-0 bg-black border border-white/10"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase text-purple-400 bg-purple-950/80 px-1.5 py-0.5 rounded">
                                {item.type === 'movie' ? 'Film' : 'Série'}
                              </span>
                              <h5 className="text-sm font-semibold text-white truncate">
                                {item.title}
                              </h5>
                              {item.isFeatured && (
                                <span className="text-[10px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/20 font-medium">
                                  À la une
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 truncate mt-0.5">
                              {item.releaseYear} · {item.duration} · Note : {item.rating.toFixed(1)}/10 · {item.genres.join(', ')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleFeatured(item.id)}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              item.isFeatured
                                ? 'bg-amber-600/30 border-amber-500 text-amber-300'
                                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                            }`}
                            title={item.isFeatured ? 'Retirer de la une' : 'Mettre à la une sur la bannière'}
                          >
                            <Star className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors"
                            title="Modifier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMedia(item.id)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-white/10 transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: DIRECT & LIVE CHANNELS (MP4 / HLS / LIVE STREAMING) */}
              {activeTab === 'direct' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">Flux Directs & Chaînes Live</h4>
                      <p className="text-xs text-zinc-400">
                        Diffusez des chaînes en continu et ajoutez vos propres flux MP4, flux HLS (.m3u8) ou directs YouTube.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddChannelModal(true)}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-950 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter un flux direct (MP4/HLS)</span>
                    </button>
                  </div>

                  {/* Channel cards in admin */}
                  <div className="space-y-2.5">
                    {liveChannels.map(chan => (
                      <div
                        key={chan.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={chan.logo}
                            alt={chan.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 object-cover rounded-lg shrink-0 bg-black border border-white/10"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded border border-rose-500/30">
                                {chan.format.toUpperCase()} DIRECT
                              </span>
                              <h5 className="text-sm font-semibold text-white truncate">
                                {chan.name}
                              </h5>
                              <span className="text-xs text-purple-400">({chan.category})</span>
                            </div>
                            <p className="text-xs font-mono text-zinc-400 truncate mt-0.5 max-w-md">
                              {chan.streamUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <span className="text-xs text-zinc-400 tabular-nums">
                            {chan.viewersCount} spectateurs
                          </span>
                          <button
                            onClick={() => {
                              storageService.deleteLiveChannel(chan.id);
                              setLiveChannels(storageService.getLiveChannels());
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 border border-white/10 transition-colors"
                            title="Supprimer la chaîne"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: ADS MANAGEMENT ("ajouter les pubs des gens par lien et ça s'affiche") */}
              {activeTab === 'ads' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">Campagnes Publicitaires & Sponsors</h4>
                      <p className="text-xs text-zinc-400">
                        Intégrez des bannières partenaires par lien, discrètes et non intrusives, et suivez leurs statistiques de clics.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowAddAdModal(true)}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-950 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter une Campagne Pub par Lien</span>
                    </button>
                  </div>

                  {/* Summary metric cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#161326] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Campagnes actives</span>
                      <p className="text-lg font-bold text-white mt-1">
                        {ads.filter(a => a.isActive).length} / {ads.length}
                      </p>
                    </div>
                    <div className="bg-[#161326] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Impressions totales</span>
                      <p className="text-lg font-bold text-purple-400 mt-1">
                        {ads.reduce((acc, a) => acc + (a.impressions || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#161326] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">Clics enregistrés</span>
                      <p className="text-lg font-bold text-emerald-400 mt-1">
                        {ads.reduce((acc, a) => acc + (a.clicks || 0), 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="bg-[#161326] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-zinc-400 uppercase font-semibold">CTR Moyen</span>
                      <p className="text-lg font-bold text-amber-300 mt-1">
                        {(() => {
                          const totalImp = ads.reduce((acc, a) => acc + (a.impressions || 0), 0);
                          const totalClicks = ads.reduce((acc, a) => acc + (a.clicks || 0), 0);
                          return totalImp > 0 ? `${((totalClicks / totalImp) * 100).toFixed(1)}%` : '0%';
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Ads list */}
                  <div className="space-y-3">
                    {ads.map(ad => {
                      const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : '0';
                      return (
                        <div
                          key={ad.id}
                          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 transition-all"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {ad.imageUrl && (
                              <img
                                src={ad.imageUrl}
                                alt={ad.title}
                                referrerPolicy="no-referrer"
                                className="w-16 h-12 object-cover rounded-lg shrink-0 border border-white/10"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  ad.isActive ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'
                                }`}>
                                  {ad.isActive ? 'En diffusion' : 'En pause'}
                                </span>
                                <span className="text-xs text-purple-400 font-semibold truncate">{ad.clientName}</span>
                                <span className="text-zinc-500 text-xs">·</span>
                                <span className="text-[10px] text-zinc-400 uppercase font-mono">
                                  {ad.placement === 'header_bar' ? 'En-tête' : ad.placement === 'under_player' ? 'Sous lecteur' : 'Flux'}
                                </span>
                              </div>
                              <h5 className="text-sm font-semibold text-white truncate">{ad.title}</h5>
                              <a
                                href={ad.targetUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-zinc-400 hover:text-purple-300 flex items-center gap-1 mt-0.5 truncate"
                              >
                                <span>{ad.targetUrl}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                            {/* Live Stats for this ad */}
                            <div className="text-right text-xs">
                              <div className="text-zinc-300">
                                <Eye className="w-3 h-3 inline mr-1 text-purple-400" />
                                <strong>{ad.impressions}</strong> vues
                              </div>
                              <div className="text-zinc-400 text-[11px] mt-0.5">
                                <MousePointerClick className="w-3 h-3 inline mr-1 text-emerald-400" />
                                <strong>{ad.clicks}</strong> clics ({ctr}%)
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleToggleAdActive(ad)}
                                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                                  ad.isActive ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                }`}
                              >
                                {ad.isActive ? 'Mettre en pause' : 'Activer'}
                              </button>
                              <button
                                onClick={() => handleDeleteAd(ad.id)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-red-950/40 text-zinc-400 hover:text-red-400 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: TRAFFIC & SITE STATS */}
              {activeTab === 'traffic' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-white">Audience & Métriques STREAMORA</h4>
                      <p className="text-xs text-zinc-400">
                        Suivi en direct des visiteurs, des pages consultées et des lectures lancées.
                      </p>
                    </div>
                    <button
                      onClick={handleResetTraffic}
                      className="px-3.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/50 text-red-300 border border-red-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                      title="Remettre toutes les statistiques de trafic à zéro"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Remettre le trafic à zéro</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-[#161326] p-4 rounded-xl border border-white/5">
                      <span className="text-xs text-zinc-400">Visiteurs Uniques</span>
                      <p className="text-2xl font-bold text-white mt-1 tabular-nums">{(stats.totalVisitors || 0).toLocaleString()}</p>
                      <span className="text-[11px] text-zinc-400 mt-1 block">Compteur en temps réel</span>
                    </div>
                    <div className="bg-[#161326] p-4 rounded-xl border border-white/5">
                      <span className="text-xs text-zinc-400">Pages Vues</span>
                      <p className="text-2xl font-bold text-purple-400 mt-1 tabular-nums">{(stats.pageViews || 0).toLocaleString()}</p>
                      <span className="text-[11px] text-purple-300 mt-1 block">Vues enregistrées</span>
                    </div>
                    <div className="bg-[#161326] p-4 rounded-xl border border-white/5">
                      <span className="text-xs text-zinc-400">Flux Vidéo Démarrés</span>
                      <p className="text-2xl font-bold text-amber-300 mt-1 tabular-nums">{(stats.streamsStarted || 0).toLocaleString()}</p>
                      <span className="text-[11px] text-zinc-400 mt-1 block">Lectures lancées</span>
                    </div>
                    <div className="bg-[#161326] p-4 rounded-xl border border-white/5">
                      <span className="text-xs text-zinc-400">Heures de Visionnage</span>
                      <p className="text-2xl font-bold text-emerald-400 mt-1 tabular-nums">{(stats.totalWatchHours || 0).toLocaleString()}h</p>
                      <span className="text-[11px] text-zinc-400 mt-1 block">Temps cumulé</span>
                    </div>
                  </div>

                  {/* Top content ranking */}
                  <div className="bg-[#161326] rounded-xl border border-white/5 p-4">
                    <h5 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-3">
                      Top des Titres les Plus Regardés
                    </h5>
                    {stats.topTitles && stats.topTitles.length > 0 ? (
                      <div className="space-y-2">
                        {stats.topTitles.map((t, i) => (
                          <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                            <div className="flex items-center gap-2">
                              <span className="w-5 font-mono text-purple-400 font-bold">{i + 1}.</span>
                              <span className="text-white font-medium">{t.title}</span>
                            </div>
                            <span className="text-zinc-400 font-mono">{t.views.toLocaleString()} lectures</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 italic py-2">
                        Aucun titre enregistré pour le moment. Les compteurs ont été réinitialisés à zéro.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: REPORTS / FEEDBACK */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Signalements Techniques des Utilisateurs</h4>
                    <p className="text-xs text-zinc-400">
                      Rapports envoyés par les spectateurs en cas de lien cassé, décalage audio ou problème de sous-titres.
                    </p>
                  </div>

                  {reports.length > 0 ? (
                    <div className="space-y-2.5">
                      {reports.map(rep => (
                        <div
                          key={rep.id}
                          className="p-3.5 rounded-xl bg-white/5 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                rep.status === 'pending' ? 'bg-amber-950 text-amber-300 border border-amber-500/20' : 'bg-emerald-950 text-emerald-300'
                              }`}>
                                {rep.status === 'pending' ? 'À traiter' : 'Résolu'}
                              </span>
                              <h5 className="text-xs font-bold text-white">{rep.mediaTitle}</h5>
                              <span className="text-zinc-500 text-xs">·</span>
                              <span className="text-[11px] text-zinc-400">{rep.createdAt}</span>
                            </div>
                            <p className="text-xs text-zinc-300 mt-1">« {rep.comment} »</p>
                          </div>

                          {rep.status === 'pending' && (
                            <button
                              onClick={() => {
                                storageService.resolveReport(rep.id);
                                setReports(storageService.getReports());
                              }}
                              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shrink-0"
                            >
                              Marquer comme résolu
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 py-6 text-center">Aucun signalement en attente.</p>
                  )}
                </div>
              )}

              {/* TAB 5: TMDB API CONFIGURATION */}
              {activeTab === 'tmdb' && (
                <div className="space-y-4 max-w-xl">
                  <div>
                    <h4 className="text-sm font-bold text-white">Connexion API The Movie Database (TMDB)</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      STREAMORA intègre l'API officielle TMDB v3. Si vous possédez une clé API personnelle TMDB gratuite, entrez-la ci-dessous pour interroger des millions de films et séries en direct.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-300 block">
                      Clé d'API TMDB (v3 auth)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 8d2c94f107f903823467..."
                      value={tmdbKeyInput}
                      onChange={(e) => setTmdbKeyInput(e.target.value)}
                      className="w-full bg-[#181528] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Vous pouvez obtenir une clé gratuite en vous inscrivant sur themoviedb.org/settings/api.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSaveTmdbKey}
                      disabled={isTestingTmdb}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-950 transition-colors disabled:opacity-50"
                    >
                      {isTestingTmdb ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      <span>Sauvegarder & Tester la clé</span>
                    </button>
                  </div>

                  {tmdbTestResult && (
                    <div className="p-3 bg-[#161326] border border-white/10 rounded-xl text-xs text-zinc-300">
                      {tmdbTestResult}
                    </div>
                  )}

                  {/* Official TMDB attribution badge */}
                  <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                    <img
                      src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fd22f3be3dd20b12401e2a4c65dd6d63a002b10ecf44263edec69c2e2a6b.svg"
                      alt="TMDB Logo"
                      className="w-10 h-10 object-contain"
                    />
                    <p className="text-[11px] text-zinc-400">
                      Ce produit utilise l'API TMDB mais n'est ni certifié ni approuvé par The Movie Database (conformément aux conditions d'utilisation).
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 6: SECURITY & PASSWORD SETTINGS */}
              {activeTab === 'security' && (
                <div className="space-y-6 max-w-xl">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-400" />
                      <span>Sécurité & Gestion du Mot de Passe</span>
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Votre mot de passe est strictement confidentiel. Il n'est affiché nulle part sur le site public.
                    </p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-3 bg-[#161326] p-5 rounded-2xl border border-white/5">
                    <label className="text-xs font-semibold text-zinc-300 block">
                      Définir un nouveau mot de passe administrateur
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Nouveau mot de passe"
                      value={newPasswordInput}
                      onChange={(e) => setNewPasswordInput(e.target.value)}
                      className="w-full bg-[#0f0d1a] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Ce mot de passe servira à déverrouiller l'administration sur vos prochains accès.
                    </p>

                    <div className="pt-2 flex items-center justify-between">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
                      >
                        Enregistrer le nouveau mot de passe
                      </button>

                      {passwordChangeSuccess && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Mot de passe mis à jour !</span>
                        </span>
                      )}
                    </div>
                  </form>

                  <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs text-zinc-300 space-y-2">
                    <span className="font-semibold text-purple-300 block">Session & Cache</span>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Lorsque vous vous connectez, votre session est conservée localement dans votre navigateur pour vous éviter de retaper votre code à chaque actualisation. Pour verrouiller complètement le panneau, cliquez sur le bouton ci-dessous.
                    </p>
                    <button
                      type="button"
                      onClick={handleLogoutAdmin}
                      className="mt-2 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-500/30 text-xs font-semibold transition-colors"
                    >
                      Verrouiller la session maintenant
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* MODAL: ADD / EDIT MEDIA ITEM */}
      {showAddMediaModal && (
        <div
          onClick={() => setShowAddMediaModal(false)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-[#141223] border border-purple-500/40 rounded-2xl p-6 shadow-2xl my-auto text-zinc-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-base font-bold text-white">
                {editingMedia ? 'Modifier le titre' : 'Ajouter un Film ou une Série'}
              </h4>
              <button
                onClick={() => setShowAddMediaModal(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMedia} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Titre</label>
                  <input
                    type="text"
                    required
                    value={mediaFormData.title}
                    onChange={(e) => setMediaFormData({ ...mediaFormData, title: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Type de contenu</label>
                  <select
                    value={mediaFormData.type}
                    onChange={(e: any) => setMediaFormData({ ...mediaFormData, type: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                  >
                    <option value="movie">Film</option>
                    <option value="tv">Série TV</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Année de sortie</label>
                  <input
                    type="number"
                    value={mediaFormData.releaseYear}
                    onChange={(e) => setMediaFormData({ ...mediaFormData, releaseYear: parseInt(e.target.value, 10) || 2024 })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Note (sur 10)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="10"
                    value={mediaFormData.rating}
                    onChange={(e) => setMediaFormData({ ...mediaFormData, rating: parseFloat(e.target.value) || 8.0 })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Durée (ex: 2h 15m ou 3 Saisons)</label>
                  <input
                    type="text"
                    value={mediaFormData.duration}
                    onChange={(e) => setMediaFormData({ ...mediaFormData, duration: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Genres (séparés par des virgules)</label>
                <input
                  type="text"
                  placeholder="Action, Thriller, Science-Fiction"
                  value={mediaFormData.genres}
                  onChange={(e) => setMediaFormData({ ...mediaFormData, genres: e.target.value })}
                  className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Lien de l'affiche (Poster URL)</label>
                  <input
                    type="url"
                    required
                    value={mediaFormData.poster}
                    onChange={(e) => setMediaFormData({ ...mediaFormData, poster: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Lien du fond (Backdrop URL)</label>
                  <input
                    type="url"
                    value={mediaFormData.backdrop}
                    onChange={(e) => setMediaFormData({ ...mediaFormData, backdrop: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Lien du flux vidéo (MP4, HLS, ou vidéo autorisée)</label>
                <input
                  type="url"
                  required
                  value={mediaFormData.videoUrl}
                  onChange={(e) => setMediaFormData({ ...mediaFormData, videoUrl: e.target.value })}
                  className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Synopsis</label>
                <textarea
                  rows={3}
                  value={mediaFormData.synopsis}
                  onChange={(e) => setMediaFormData({ ...mediaFormData, synopsis: e.target.value })}
                  className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddMediaModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg"
                >
                  {editingMedia ? 'Sauvegarder les modifications' : 'Ajouter au catalogue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ADVERTISING CAMPAIGN ("ajouter les pubs des gens par lien") */}
      {showAddAdModal && (
        <div
          onClick={() => setShowAddAdModal(false)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#141223] border border-purple-500/40 rounded-2xl p-6 shadow-2xl my-auto text-zinc-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-purple-400" />
                <span>Ajouter une Campagne Publicitaire Partenaire</span>
              </h4>
              <button
                onClick={() => setShowAddAdModal(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAd} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Nom de l'Annonceur / Client</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: NordVPN, Sony Audio, Studio Cinéma..."
                  value={adFormData.clientName}
                  onChange={(e) => setAdFormData({ ...adFormData, clientName: e.target.value })}
                  className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Titre de la publicité</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Profitez de -70% sur le pack streaming ultra rapide"
                  value={adFormData.title}
                  onChange={(e) => setAdFormData({ ...adFormData, title: e.target.value })}
                  className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Description courte (facultatif)</label>
                <input
                  type="text"
                  placeholder="Ex: Offre valable pour une durée limitée avec le code STREAM..."
                  value={adFormData.description}
                  onChange={(e) => setAdFormData({ ...adFormData, description: e.target.value })}
                  className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>

              {/* Media Type Toggle: Image vs Video */}
              <div>
                <label className="text-zinc-400 block mb-1.5 font-medium">Type de média publicitaire</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdFormData({ ...adFormData, mediaType: 'image' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      adFormData.mediaType === 'image'
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>🖼️ Image (JPG, PNG, WebP)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdFormData({ ...adFormData, mediaType: 'video' })}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      adFormData.mediaType === 'video'
                        ? 'bg-purple-600/30 border-purple-500 text-white'
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>🎬 Vidéo MP4 / WebM (Boucle)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">
                    {adFormData.mediaType === 'video' ? 'Lien de la vidéo (MP4 ou WebM direct)' : 'Lien de l\'image (Image URL)'}
                  </label>
                  <input
                    type="url"
                    required
                    placeholder={adFormData.mediaType === 'video' ? 'https://.../video.mp4' : 'https://images.unsplash.com/...'}
                    value={adFormData.mediaUrl || adFormData.imageUrl}
                    onChange={(e) => setAdFormData({ ...adFormData, mediaUrl: e.target.value, imageUrl: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Lien de destination (Site web du sponsor)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://partenaire.com/offre"
                    value={adFormData.targetUrl}
                    onChange={(e) => setAdFormData({ ...adFormData, targetUrl: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Emplacement d'affichage</label>
                  <select
                    value={adFormData.placement}
                    onChange={(e: any) => setAdFormData({ ...adFormData, placement: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                  >
                    <option value="in_feed">Bannière de flux (Accueil & Catalogues)</option>
                    <option value="sub_hero">Sous la grande bannière principale (Hero)</option>
                    <option value="under_player">Sous le lecteur vidéo (Recommandé)</option>
                    <option value="direct_feed">Section Direct & Chaînes Live</option>
                    <option value="footer_network">Bannière Bas de page (Régie & Annonceurs)</option>
                    <option value="header_bar">Bannière discrète d'en-tête (Top bar)</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Texte du badge</label>
                  <input
                    type="text"
                    placeholder="Ex: Sponsorisé, Partenaire Officiel, Offre Spéciale"
                    value={adFormData.badgeText}
                    onChange={(e) => setAdFormData({ ...adFormData, badgeText: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddAdModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md"
                >
                  Publier l'annonce
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DIRECT LIVE CHANNEL (MP4 / HLS / YOUTUBE) */}
      {showAddChannelModal && (
        <div
          onClick={() => setShowAddChannelModal(false)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#141223] border border-purple-500/40 rounded-2xl p-6 shadow-2xl my-auto text-zinc-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Tv className="w-4 h-4 text-rose-400" />
                <span>Ajouter une chaîne ou un flux direct</span>
              </h4>
              <button
                onClick={() => setShowAddChannelModal(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChannel} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Nom de la chaîne ou du flux</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cinéma Action 24/7, Live Événement..."
                  value={channelFormData.name}
                  onChange={(e) => setChannelFormData({ ...channelFormData, name: e.target.value })}
                  className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Catégorie</label>
                  <select
                    value={channelFormData.category}
                    onChange={(e) => setChannelFormData({ ...channelFormData, category: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                  >
                    <option value="Cinéma & Fiction">Cinéma & Fiction</option>
                    <option value="Séries & Drama">Séries & Drama</option>
                    <option value="Documentaires & Science">Documentaires & Science</option>
                    <option value="Sports & Extrême">Sports & Extrême</option>
                    <option value="Culture & Monde">Culture & Monde</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Format du flux</label>
                  <select
                    value={channelFormData.format}
                    onChange={(e: any) => setChannelFormData({ ...channelFormData, format: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white font-mono"
                  >
                    <option value="mp4">Fichier Vidéo Direct (.mp4)</option>
                    <option value="hls">Flux Streaming HLS (.m3u8)</option>
                    <option value="youtube">Flux Live YouTube (Embed)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">
                  Lien du flux en direct (URL)
                </label>
                <input
                  type="url"
                  required
                  placeholder={
                    channelFormData.format === 'mp4'
                      ? 'https://.../video.mp4'
                      : channelFormData.format === 'hls'
                      ? 'https://.../live/playlist.m3u8'
                      : 'https://www.youtube.com/embed/...'
                  }
                  value={channelFormData.streamUrl}
                  onChange={(e) => setChannelFormData({ ...channelFormData, streamUrl: e.target.value })}
                  className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Badge de qualité</label>
                  <select
                    value={channelFormData.qualityBadge}
                    onChange={(e) => setChannelFormData({ ...channelFormData, qualityBadge: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                  >
                    <option value="1080p FHD">1080p FHD</option>
                    <option value="4K UHD">4K UHD</option>
                    <option value="720p HD">720p HD</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Description courte (facultatif)</label>
                  <input
                    type="text"
                    placeholder="Diffusion en direct 24h/24..."
                    value={channelFormData.description}
                    onChange={(e) => setChannelFormData({ ...channelFormData, description: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddChannelModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-md"
                >
                  Ajouter le flux en direct
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
