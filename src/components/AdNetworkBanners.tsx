import React, { useState } from 'react';
import { Megaphone, ExternalLink, Sparkles, Check, Plus, X, Globe, BarChart3, ShieldCheck } from 'lucide-react';
import { AdBanner, AdPlacement } from '../types';
import { storageService } from '../services/storageService';

interface AdNetworkBannersProps {
  onAdClick?: (ad: AdBanner) => void;
  className?: string;
}

export const AdNetworkBanners: React.FC<AdNetworkBannersProps> = ({
  onAdClick,
  className = '',
}) => {
  const [ads, setAds] = useState<AdBanner[]>(() => storageService.getAds());
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [activeFormatTab, setActiveFormatTab] = useState<'live' | 'formats' | 'code'>('live');

  // New ad campaign form state
  const [formData, setFormData] = useState({
    clientName: '',
    title: '',
    description: '',
    mediaType: 'image' as 'image' | 'video',
    mediaUrl: '',
    targetUrl: '',
    placement: 'footer_network' as AdPlacement,
    badgeText: 'Régie Partenaire',
  });
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  // Filter bottom/network or feed ads
  const networkAds = ads.filter(a => a.isActive && (a.placement === 'footer_network' || a.placement === 'in_feed'));
  const currentAd = networkAds.length > 0 ? networkAds[0] : null;

  const handleRecordClick = (ad: AdBanner) => {
    storageService.recordAdClick(ad.id);
    setAds(storageService.getAds());
    if (onAdClick) onAdClick(ad);
    window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSaveAdvertiserAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.targetUrl.trim() || !formData.mediaUrl.trim()) return;

    const newAd = storageService.addAd({
      clientName: formData.clientName.trim() || 'Annonceur STREAMORA',
      title: formData.title.trim(),
      description: formData.description.trim() || 'Campagne publicitaire ciblée streaming & divertissement.',
      mediaType: formData.mediaType,
      mediaUrl: formData.mediaUrl.trim(),
      imageUrl: formData.mediaType === 'image' ? formData.mediaUrl.trim() : 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      targetUrl: formData.targetUrl.trim(),
      placement: formData.placement,
      isActive: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2028-12-31',
      badgeText: formData.badgeText.trim() || 'Régie Annonceur',
    });

    setAds(storageService.getAds());
    setSubmittedSuccess(true);
    setTimeout(() => {
      setSubmittedSuccess(false);
      setShowSubmitModal(false);
      setFormData({
        clientName: '',
        title: '',
        description: '',
        mediaType: 'image',
        mediaUrl: '',
        targetUrl: '',
        placement: 'footer_network',
        badgeText: 'Régie Partenaire',
      });
    }, 1400);
  };

  return (
    <section className={`w-full max-w-7xl mx-auto px-4 md:px-8 py-8 ${className}`}>
      <div className="bg-gradient-to-b from-[#131024] to-[#0c0a15] border border-purple-900/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 overflow-hidden relative">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-950/80 border border-purple-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-purple-400" />
                <span>ESPACE RÉGIE PUBLICITAIRE & ANNONCEURS</span>
              </span>
              <span className="text-[11px] text-emerald-400 font-mono hidden sm:inline">
                ● Emplacements 100% Disponibles
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-white font-heading">
              Afficher vos Publicités & Bannières sur STREAMORA
            </h3>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Emplacements premium compatibles avec les régies publicitaires (Google AdSense, Adsterra, PropellerAds, Monetag) et campagnes directes par lien image ou vidéo MP4.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setShowSubmitModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-950 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Placer votre Bannière ici</span>
            </button>
          </div>
        </div>

        {/* Tab switcher: Live Banner / Formats Régie / Infos Régies */}
        <div className="flex items-center gap-2 border-b border-white/5 pb-2 text-xs">
          <button
            onClick={() => setActiveFormatTab('live')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeFormatTab === 'live'
                ? 'bg-purple-600 text-white font-semibold'
                : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
          >
            Bannières Actives ({networkAds.length})
          </button>
          <button
            onClick={() => setActiveFormatTab('formats')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeFormatTab === 'formats'
                ? 'bg-purple-600 text-white font-semibold'
                : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
          >
            Grille des Formats Régies (970x250, 728x90, 300x250)
          </button>
          <button
            onClick={() => setActiveFormatTab('code')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              activeFormatTab === 'code'
                ? 'bg-purple-600 text-white font-semibold'
                : 'text-zinc-400 hover:text-white bg-white/5'
            }`}
          >
            Intégration Script & Tags Régie
          </button>
        </div>

        {/* TAB 1: LIVE ACTIVE BANNERS */}
        {activeFormatTab === 'live' && (
          <div className="space-y-4">
            {currentAd ? (
              <div
                onClick={() => handleRecordClick(currentAd)}
                className="group relative rounded-2xl overflow-hidden border border-purple-500/30 hover:border-purple-400 bg-black/60 shadow-xl transition-all cursor-pointer flex flex-col md:flex-row items-center justify-between"
              >
                {/* Media area */}
                <div className="w-full md:w-3/5 h-44 sm:h-52 relative overflow-hidden bg-black shrink-0">
                  {currentAd.mediaType === 'video' ? (
                    <video
                      src={currentAd.mediaUrl}
                      poster={currentAd.imageUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                  ) : (
                    <img
                      src={currentAd.mediaUrl || currentAd.imageUrl}
                      alt={currentAd.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-transparent via-black/40 to-[#0e0c1a]" />
                  <span className="absolute top-3 left-3 bg-black/80 backdrop-blur-md text-[10px] uppercase font-bold text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                    {currentAd.badgeText || 'Régie Partenaire'}
                  </span>
                </div>

                {/* Content details & CTA */}
                <div className="p-5 md:p-6 flex-1 space-y-3 w-full">
                  <div>
                    <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wide">
                      {currentAd.clientName}
                    </span>
                    <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-purple-300 transition-colors mt-0.5">
                      {currentAd.title}
                    </h4>
                    {currentAd.description && (
                      <p className="text-xs text-zinc-300 mt-1 line-clamp-2 leading-relaxed">
                        {currentAd.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/5">
                    <span className="text-[11px] text-zinc-400 truncate max-w-xs font-mono">
                      {currentAd.targetUrl}
                    </span>
                    <span className="px-4 py-2 bg-purple-600 group-hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-md transition-colors">
                      <span>Visiter le sponsor</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-black/40 rounded-2xl border border-dashed border-white/10 space-y-3">
                <Megaphone className="w-10 h-10 text-zinc-500 mx-auto" />
                <h4 className="text-base font-bold text-white">Aucune bannière active en bas</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto">
                  Cliquez sur « Placer votre Bannière ici » pour ajouter la première annonce publicitaire (image ou vidéo MP4).
                </p>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl"
                >
                  Ajouter une publicité
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AD NETWORK STANDARD FORMATS (Bannières Régies) */}
        {activeFormatTab === 'formats' && (
          <div className="space-y-4 text-xs">
            {/* Format Billboard 970x250 */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-zinc-300">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Format Régie Billboard (970 × 250 px)
                </span>
                <span className="font-mono text-[11px] text-purple-400">Emplacement Haut & Bas de page</span>
              </div>
              <div className="w-full h-28 sm:h-32 rounded-xl bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/20 flex flex-col items-center justify-center text-center p-4">
                <span className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                  Emplacement Billboard 970 × 250 Disponible
                </span>
                <p className="text-[11px] text-zinc-400 mt-1 max-w-md">
                  Idéal pour bannières interactives, bannières Google AdSense ou annonces directes haute conversion.
                </p>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, placement: 'footer_network' }));
                    setShowSubmitModal(true);
                  }}
                  className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[11px] font-semibold"
                >
                  Réserver cet emplacement
                </button>
              </div>
            </div>

            {/* Grid 2 formats: Leaderboard 728x90 & Pavé 300x250 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Leaderboard 728x90 */}
              <div className="md:col-span-2 p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    Format Leaderboard (728 × 90 px)
                  </span>
                  <span className="font-mono text-[11px] text-indigo-400">Entre les sections de flux</span>
                </div>
                <div className="w-full h-20 rounded-xl bg-gradient-to-r from-indigo-950/40 to-black border border-indigo-500/20 flex items-center justify-between px-6">
                  <div className="text-left">
                    <span className="text-xs font-bold text-indigo-300 block">Bannière Standard 728 × 90</span>
                    <span className="text-[10px] text-zinc-400">Affichage garanti sur ordinateur et tablette</span>
                  </div>
                  <button
                    onClick={() => {
                      setFormData(prev => ({ ...prev, placement: 'in_feed' }));
                      setShowSubmitModal(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-semibold"
                  >
                    Activer
                  </button>
                </div>
              </div>

              {/* Medium Rectangle 300x250 */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    Format Pavé (300 × 250 px)
                  </span>
                </div>
                <div className="w-full h-20 rounded-xl bg-gradient-to-r from-amber-950/30 to-black border border-amber-500/20 flex flex-col items-center justify-center text-center p-2">
                  <span className="text-xs font-bold text-amber-300">Pavé 300 × 250</span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">Format mobile & sidebar</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CODE INTEGRATION (AdSense / Adsterra / Direct Tag) */}
        {activeFormatTab === 'code' && (
          <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-purple-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Compatibilité Régies Publicitaires Mondiales</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              STREAMORA prend en charge nativement les tags de bannières pour les principales régies du marché :
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                <span className="font-bold text-white block">Google AdSense</span>
                <span className="text-[10px] text-zinc-400">Display Responsive</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                <span className="font-bold text-white block">Adsterra</span>
                <span className="text-[10px] text-zinc-400">Bannières & Popunder</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                <span className="font-bold text-white block">PropellerAds</span>
                <span className="text-[10px] text-zinc-400">In-Page Push / Video</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-center">
                <span className="font-bold text-white block">Sponsor Direct</span>
                <span className="text-[10px] text-zinc-400">Lien Image ou MP4</span>
              </div>
            </div>
            <div className="bg-[#090810] p-3 rounded-xl border border-white/5 font-mono text-[11px] text-purple-300">
              <code>&lt;!-- Emplacement Régie STREAMORA prêt pour balises de scripts asynchrones &lt;script async src="..."&gt;&lt;/script&gt; --&gt;</code>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: SUBMIT ADVERTISER BANNER */}
      {showSubmitModal && (
        <div
          onClick={() => setShowSubmitModal(false)}
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-[#141223] border border-purple-500/40 rounded-2xl p-6 shadow-2xl my-auto text-zinc-200 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
                  Diffuser votre Bannière Publicitaire
                </h3>
              </div>
              <button
                onClick={() => setShowSubmitModal(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {submittedSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-white">Bannière publiée avec succès !</h4>
                <p className="text-xs text-zinc-400">
                  Votre publicité est maintenant active et diffusée sur les emplacements du site.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveAdvertiserAd} className="space-y-3 text-xs">
                {/* Media Type Toggle: Image vs Video */}
                <div>
                  <label className="text-zinc-400 block mb-1.5 font-medium">Type de média</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, mediaType: 'image' })}
                      className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        formData.mediaType === 'image'
                          ? 'bg-purple-600/30 border-purple-500 text-white'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>🖼️ Image (JPG, PNG, WebP)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, mediaType: 'video' })}
                      className={`py-2 px-3 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        formData.mediaType === 'video'
                          ? 'bg-purple-600/30 border-purple-500 text-white'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span>🎬 Vidéo MP4 (Boucle)</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Nom de l'Annonceur / Marque / Régie</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Studio Cinéma, Marque Tech, Régie Partenaire..."
                    value={formData.clientName}
                    onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Titre de la publicité</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Découvrez les meilleures offres streaming 4K de l'année"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Lien de la bannière ({formData.mediaType === 'video' ? 'URL Vidéo MP4 direct' : 'URL Image'})</label>
                  <input
                    type="url"
                    required
                    placeholder={formData.mediaType === 'video' ? 'https://.../video.mp4' : 'https://images.unsplash.com/...'}
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Lien de destination (Site web ciblé)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://votre-site.com/offre"
                    value={formData.targetUrl}
                    onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                    className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2.5 text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1">Emplacement souhaité</label>
                    <select
                      value={formData.placement}
                      onChange={(e: any) => setFormData({ ...formData, placement: e.target.value })}
                      className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                    >
                      <option value="footer_network">Bannière Bas de page (Régie & Annonceurs)</option>
                      <option value="in_feed">Bannière Flux (Accueil & Catalogues)</option>
                      <option value="under_player">Sous le lecteur vidéo</option>
                      <option value="header_bar">Bannière discrète d'en-tête (Top Bar)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Texte du badge</label>
                    <input
                      type="text"
                      placeholder="Ex: Sponsorisé, Régie Partenaire, Offre Spéciale"
                      value={formData.badgeText}
                      onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                      className="w-full bg-[#0d0c15] border border-white/10 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg shadow-md transition-colors"
                  >
                    Publier l'annonce maintenant
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
