import React from 'react';
import { Film, Lock } from 'lucide-react';
import { ActiveTab } from '../types';

interface FooterProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenAdmin }) => {
  return (
    <footer className="w-full bg-[#07060b] border-t border-purple-900/20 text-zinc-400 text-xs mt-16 py-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-wider text-white font-heading">
                STREAM<span className="text-purple-500">ORA</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Plateforme moderne de streaming cinématographique. Découvrez, explorez et visionnez les plus grands classiques du cinéma mondial, les nouvelles séries et les flux directs.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Navigation</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-purple-300 transition-colors">Accueil</button>
              </li>
              <li>
                <button onClick={() => onNavigate('direct')} className="hover:text-purple-300 transition-colors">Chaînes & Direct</button>
              </li>
              <li>
                <button onClick={() => onNavigate('movies')} className="hover:text-purple-300 transition-colors">Tous les Films</button>
              </li>
              <li>
                <button onClick={() => onNavigate('series')} className="hover:text-purple-300 transition-colors">Toutes les Séries</button>
              </li>
              <li>
                <button onClick={() => onNavigate('news')} className="hover:text-purple-300 transition-colors">Nouveautés Cinéma</button>
              </li>
              <li>
                <button onClick={() => onNavigate('watchlist')} className="hover:text-purple-300 transition-colors">Ma Liste personnelle</button>
              </li>
            </ul>
          </div>

          {/* Technical & Services */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Services & Diffusion</h4>
            <ul className="space-y-1.5 text-xs">
              <li><span>Lecteur vidéo compatible MP4 & HLS</span></li>
              <li><span>Recherche externe de sources</span></li>
              <li><span>Flux en direct 24/7</span></li>
              <li>
                <button
                  onClick={onOpenAdmin}
                  className="text-zinc-500 hover:text-purple-400 flex items-center gap-1.5 transition-colors pt-2"
                  title="Accès Technique Sécurisé"
                >
                  <Lock className="w-3 h-3" />
                  <span>Espace Gestion</span>
                </button>
              </li>
            </ul>
          </div>

          {/* TMDB Official Attribution */}
          <div className="space-y-2.5 bg-[#0e0c17] p-4 rounded-xl border border-white/5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-1.5">
              <span>Attribution Légale TMDB</span>
            </h4>
            <div className="flex items-center gap-3">
              <img
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d537fd22f3be3dd20b12401e2a4c65dd6d63a002b10ecf44263edec69c2e2a6b.svg"
                alt="TMDB Logo"
                className="w-8 h-8 object-contain shrink-0"
              />
              <p className="text-[11px] text-zinc-400 leading-snug">
                This product uses the TMDB API but is not endorsed or certified by TMDB.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-zinc-500">
          <p>© {new Date().getFullYear()} STREAMORA — Tous droits réservés. Lecteur compatible MP4/HLS & flux autorisés.</p>
          <div className="flex items-center gap-4">
            <span>Qualité 4K HDR</span>
            <span>·</span>
            <span>Son Stéréo & 5.1</span>
            <span>·</span>
            <span>Sous-titres FR/VO</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
