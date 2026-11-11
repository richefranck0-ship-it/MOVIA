import React, { useState } from 'react';
import { Radio, Play, Plus, X, Globe, Eye, Sparkles, Check, AlertCircle } from 'lucide-react';
import { LiveStreamChannel } from '../types';
import { storageService } from '../services/storageService';
import { AdBannerSlot } from './AdBannerSlot';

interface LiveDirectViewProps {
  onPlayDirectStream: (channel: LiveStreamChannel) => void;
}

export const LiveDirectView: React.FC<LiveDirectViewProps> = ({ onPlayDirectStream }) => {
  const [channels, setChannels] = useState<LiveStreamChannel[]>(() => storageService.getLiveChannels());
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [showAddStreamModal, setShowAddStreamModal] = useState(false);
  const [newStreamData, setNewStreamData] = useState({
    name: '',
    category: 'Cinéma & Fiction',
    streamUrl: '',
    format: 'mp4' as 'mp4' | 'hls' | 'youtube',
    description: '',
    qualityBadge: '1080p FHD',
  });
  const [addSuccess, setAddSuccess] = useState(false);

  const categories = ['Tous', 'Cinéma & Fiction', 'Science-Fiction', 'Animation & Art', 'Classiques', 'Science & Espace', 'Sports & Aventure'];

  const filteredChannels = selectedCategory === 'Tous'
    ? channels
    : channels.filter(c => c.category === selectedCategory);

  const handleAddStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreamData.name.trim() || !newStreamData.streamUrl.trim()) return;

    const logo = newStreamData.format === 'youtube'
      ? 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=200&q=80'
      : 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=200&q=80';

    const created = storageService.addLiveChannel({
      name: newStreamData.name.trim(),
      category: newStreamData.category,
      logo,
      streamUrl: newStreamData.streamUrl.trim(),
      format: newStreamData.format,
      description: newStreamData.description.trim() || 'Flux direct streaming haute fidélité.',
      isLive: true,
      qualityBadge: newStreamData.qualityBadge,
    });

    setChannels(storageService.getLiveChannels());
    setAddSuccess(true);
    setTimeout(() => {
      setAddSuccess(false);
      setShowAddStreamModal(false);
      onPlayDirectStream(created);
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in text-zinc-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#17142b] via-[#120f21] to-[#0c0a15] border border-purple-900/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/80 border border-rose-500/30 px-2.5 py-1 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>DIRECT & FLUX LIVE</span>
            </span>
            <span className="text-zinc-500">·</span>
            <span className="text-xs text-purple-300 font-medium">MP4 / HLS / Live TV 24/7</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-heading">
            Chaînes & Flux en Direct
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Regardez des flux continus en direct, chaînes cinéma 24/7, sports et événements spatiaux, ou ajoutez vos propres liens directs MP4 et flux IPTV en un clic.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={() => setShowAddStreamModal(true)}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-950 hover:scale-105 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter un flux direct (MP4 / HLS)</span>
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-purple-600 text-white font-semibold shadow-md shadow-purple-950 scale-102'
                : 'bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Discreet Live Sponsor Placement */}
      <AdBannerSlot placement="direct_feed" />

      {/* Live Channels Grid or Clean Zero State */}
      {filteredChannels.length === 0 ? (
        <div className="py-20 px-6 text-center bg-[#110f1c] rounded-3xl border border-white/5 space-y-4 max-w-2xl mx-auto shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-purple-950/60 border border-purple-500/20 text-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-950/40">
            <Radio className="w-8 h-8" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-white font-heading">
              0 flux direct actuellement actif
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
              Les flux de test ont été réinitialisés à zéro. Vous pouvez ajouter directement vos flux streaming réels (liens MP4 direct, flux HLS .m3u8 ou live YouTube).
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => setShowAddStreamModal(true)}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-lg shadow-purple-950 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter votre premier flux direct</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredChannels.map(channel => (
            <div
              key={channel.id}
              onClick={() => onPlayDirectStream(channel)}
              className="group relative rounded-2xl bg-[#120f20] border border-white/5 hover:border-purple-500/40 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-purple-950/30 flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* Channel Header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10 relative">
                      <img
                        src={channel.logo}
                        alt={channel.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors truncate">
                        {channel.name}
                      </h3>
                      <span className="text-[11px] text-zinc-400 block truncate">
                        {channel.category}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30 uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    <span>DIRECT</span>
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                  {channel.description}
                </p>
              </div>

              {/* Footer with Viewers count and Action Button */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span className="tabular-nums font-mono">{(channel.viewersCount || 0).toLocaleString()} spectateurs</span>
                  {channel.qualityBadge && (
                    <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-zinc-300 font-mono">
                      {channel.qualityBadge}
                    </span>
                  )}
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayDirectStream(channel);
                  }}
                  className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-purple-950 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Aperçu</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add custom direct stream (MP4 / HLS / Live) */}
      {showAddStreamModal && (
        <div
          onClick={() => setShowAddStreamModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#141223] border border-purple-500/40 rounded-2xl p-6 shadow-2xl my-auto text-zinc-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Ajouter un Flux Direct (MP4 / HLS)</h3>
              </div>
              <button
                onClick={() => setShowAddStreamModal(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStream} className="space-y-3 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Nom de la chaîne ou du flux</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cinéma Action 4K, Chaîne Direct Live, Flux Sport..."
                  value={newStreamData.name}
                  onChange={(e) => setNewStreamData({ ...newStreamData, name: e.target.value })}
                  className="w-full bg-[#0d0c15] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-zinc-400 block mb-1">Catégorie</label>
                  <select
                    value={newStreamData.category}
                    onChange={(e) => setNewStreamData({ ...newStreamData, category: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="Cinéma & Fiction">Cinéma & Fiction</option>
                    <option value="Science-Fiction">Science-Fiction</option>
                    <option value="Animation & Art">Animation & Art</option>
                    <option value="Classiques">Classiques</option>
                    <option value="Science & Espace">Science & Espace</option>
                    <option value="Sports & Aventure">Sports & Aventure</option>
                  </select>
                </div>
                <div>
                  <label className="text-zinc-400 block mb-1">Format de flux</label>
                  <select
                    value={newStreamData.format}
                    onChange={(e: any) => setNewStreamData({ ...newStreamData, format: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-xl p-2.5 text-white"
                  >
                    <option value="mp4">Lien direct vidéo MP4 / WebM</option>
                    <option value="hls">Flux HLS / IPTV (.m3u8)</option>
                    <option value="youtube">Lien YouTube Live / Embed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">URL du flux vidéo</label>
                <input
                  type="url"
                  required
                  placeholder="https://domaine.com/flux.mp4 ou https://.../stream.m3u8"
                  value={newStreamData.streamUrl}
                  onChange={(e) => setNewStreamData({ ...newStreamData, streamUrl: e.target.value })}
                  className="w-full bg-[#0d0c15] border border-white/10 rounded-xl p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-zinc-400 block mb-1">Description courte (facultatif)</label>
                <input
                  type="text"
                  placeholder="Ex: Diffusion continue HD 24/7..."
                  value={newStreamData.description}
                  onChange={(e) => setNewStreamData({ ...newStreamData, description: e.target.value })}
                  className="w-full bg-[#0d0c15] border border-white/10 rounded-xl p-2.5 text-white"
                />
              </div>

              {addSuccess && (
                <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs py-2 px-3 rounded-lg flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Flux ajouté avec succès ! Lancement du lecteur...</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddStreamModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl shadow-md shadow-purple-950"
                >
                  Lancer le flux
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
