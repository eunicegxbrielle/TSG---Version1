import React from 'react';
import { Volume2, VolumeX, Shield, User } from 'lucide-react';
import { GamemakerAuth, Player } from '../types';
import { TributeAvatar } from './TributeAvatar';

export type AppTab = 'queue' | 'gamemaker' | 'victors' | 'mygames';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  currentPlayer: Player | null;
  onOpenPlayerModal: () => void;
  onOpenCurrentProfile?: () => void;
  gamemakerAuth: GamemakerAuth;
  onOpenGamemakerAuthModal: () => void;
  soundState: boolean;
  onToggleSound: () => void;
  pendingKudosCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentPlayer,
  onOpenPlayerModal,
  onOpenCurrentProfile,
  gamemakerAuth,
  onOpenGamemakerAuthModal,
  soundState,
  onToggleSound,
  pendingKudosCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0e1015]/95 backdrop-blur-md border-b border-amber-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark with Official Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('queue')}
            className="flex items-center gap-2.5 text-left group transition-transform active:scale-95"
          >
            <img
              src="/the_shuttle_games_logo.png"
              alt="The Shuttle Games"
              className="w-10 h-10 object-contain rounded-full border border-amber-500/50 shadow-md shadow-amber-950/60"
            />
            <div>
              <span className="font-cinzel text-base sm:text-lg font-bold tracking-wider text-amber-100 group-hover:text-amber-300 transition-colors whitespace-nowrap block">
                THE SHUTTLE GAMES
              </span>
              <span className="text-[10px] text-amber-500/80 uppercase tracking-widest font-mono font-medium block">
                Badminton Club
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Sponsor's Gift tab removed; hosted inside My Games) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {/* Queue is strictly called: The Reaping */}
          <button
            onClick={() => setActiveTab('queue')}
            className={`whitespace-nowrap transition-colors py-1 relative flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'text-amber-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            The Reaping
            {pendingKudosCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
            {activeTab === 'queue' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('victors')}
            className={`whitespace-nowrap transition-colors py-1 relative ${
              activeTab === 'victors'
                ? 'text-amber-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Victors
            {activeTab === 'victors' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('mygames')}
            className={`whitespace-nowrap transition-colors py-1 relative ${
              activeTab === 'mygames'
                ? 'text-amber-300 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            My Games
            {activeTab === 'mygames' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>

          {/* Gamemakers Console: ONLY visible to authorized organizers/gamemakers */}
          {gamemakerAuth.isAuthorized && (
            <button
              onClick={() => setActiveTab('gamemaker')}
              className={`whitespace-nowrap transition-colors py-1 relative flex items-center gap-1.5 ${
                activeTab === 'gamemaker'
                  ? 'text-amber-300 font-semibold'
                  : 'text-amber-500/80 hover:text-amber-300'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Gamemakers Console
              <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1 rounded font-mono uppercase">
                Staff
              </span>
              {activeTab === 'gamemaker' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full" />
              )}
            </button>
          )}
        </nav>

        {/* Zone 3: Sound, Gamemaker Gate & Tribute Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onToggleSound}
            title={soundState ? 'Mute Capitol sound & voice effects' : 'Enable Capitol sound & voice effects'}
            className="p-2 text-neutral-400 hover:text-amber-300 hover:bg-neutral-800/60 rounded-lg transition-colors"
            aria-label="Toggle sound"
          >
            {soundState ? (
              <Volume2 className="w-4 h-4 text-amber-400" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Gamemaker Access button */}
          <button
            onClick={onOpenGamemakerAuthModal}
            title={
              gamemakerAuth.isAuthorized
                ? `Authorized as ${gamemakerAuth.gamemakerName}`
                : 'Gamemaker / Organizer Login'
            }
            className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs ${
              gamemakerAuth.isAuthorized
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 hover:bg-amber-500/25'
                : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-amber-200 hover:border-neutral-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline text-[11px] font-mono">
              {gamemakerAuth.isAuthorized ? 'Gamemaker' : 'Organizer'}
            </span>
          </button>

          {/* Tribute Profile Switcher + Avatar Profile Trigger */}
          <div className="flex items-center gap-1.5 bg-neutral-900 border border-amber-900/50 hover:border-amber-500/60 rounded-lg p-1 pr-2.5 transition-all shadow-sm">
            {currentPlayer ? (
              <TributeAvatar
                name={currentPlayer.name}
                avatarUrl={currentPlayer.avatarUrl}
                size="xs"
                onClick={onOpenCurrentProfile || onOpenPlayerModal}
                title="View / Edit Your Profile"
              />
            ) : (
              <button
                type="button"
                onClick={onOpenPlayerModal}
                className="w-6 h-6 rounded-full bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-300"
              >
                <User className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={onOpenPlayerModal}
              className="text-left hidden sm:block max-w-[110px] truncate"
            >
              <span className="block text-xs font-medium text-amber-100 truncate">
                {currentPlayer ? currentPlayer.name : 'Select Tribute'}
              </span>
              <span className="block text-[10px] text-amber-400/80 truncate">
                {currentPlayer?.category || 'Tribute'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around px-2 py-2 border-t border-neutral-800/80 bg-[#0a0b0e] text-xs">
        <button
          onClick={() => setActiveTab('queue')}
          className={`px-3 py-1 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'queue' ? 'text-amber-400 font-semibold' : 'text-neutral-400'
          }`}
        >
          The Reaping
          {pendingKudosCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('victors')}
          className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
            activeTab === 'victors' ? 'text-amber-400 font-semibold' : 'text-neutral-400'
          }`}
        >
          Victors
        </button>
        <button
          onClick={() => setActiveTab('mygames')}
          className={`px-3 py-1 rounded transition-colors whitespace-nowrap ${
            activeTab === 'mygames' ? 'text-amber-400 font-semibold' : 'text-neutral-400'
          }`}
        >
          My Games
        </button>
        {gamemakerAuth.isAuthorized && (
          <button
            onClick={() => setActiveTab('gamemaker')}
            className={`px-3 py-1 rounded transition-colors whitespace-nowrap text-amber-300 font-semibold ${
              activeTab === 'gamemaker' ? 'underline' : ''
            }`}
          >
            Console
          </button>
        )}
      </div>
    </header>
  );
};
