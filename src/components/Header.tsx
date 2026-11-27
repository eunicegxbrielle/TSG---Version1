import React from 'react';
import { Volume2, VolumeX, Shield, User, Flame, Trophy, BarChart3, Sun, Moon } from 'lucide-react';
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
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
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
  theme = 'dark',
  onToggleTheme,
}) => {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0e1015]/95 backdrop-blur-md border-b border-stone-200 dark:border-amber-950/40 transition-colors">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-6">
          {/* Zone 1: Brand Wordmark with Official Logo */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className="flex items-center gap-2 sm:gap-2.5 text-left group transition-transform active:scale-95 min-h-[44px] min-w-0"
            >
              <img
                src="/the_shuttle_games_logo.png"
                alt="The Shuttle Games"
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain rounded-full border border-amber-500/60 dark:border-amber-500/50 shadow-sm dark:shadow-amber-950/60 shrink-0"
              />
              <div className="min-w-0">
                <span className="font-cinzel text-xs sm:text-base md:text-lg font-bold tracking-wider text-stone-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors whitespace-nowrap block truncate">
                  THE SHUTTLE GAMES
                </span>
                <span className="hidden sm:block text-[10px] text-amber-700 dark:text-amber-500/80 uppercase tracking-widest font-mono font-medium">
                  Badminton Club
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`whitespace-nowrap transition-colors py-1 relative flex items-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'text-amber-700 dark:text-amber-300 font-semibold'
                  : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200'
              }`}
            >
              The Reaping
              {pendingKudosCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping" />
              )}
              {activeTab === 'queue' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-500 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('victors')}
              className={`whitespace-nowrap transition-colors py-1 relative ${
                activeTab === 'victors'
                  ? 'text-amber-700 dark:text-amber-300 font-semibold'
                  : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200'
              }`}
            >
              Victors
              {activeTab === 'victors' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-500 rounded-full" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mygames')}
              className={`whitespace-nowrap transition-colors py-1 relative ${
                activeTab === 'mygames'
                  ? 'text-amber-700 dark:text-amber-300 font-semibold'
                  : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200'
              }`}
            >
              My Games
              {activeTab === 'mygames' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-500 rounded-full" />
              )}
            </button>

            {gamemakerAuth.isAuthorized && (
              <button
                type="button"
                onClick={() => setActiveTab('gamemaker')}
                className={`whitespace-nowrap transition-colors py-1 relative flex items-center gap-1.5 ${
                  activeTab === 'gamemaker'
                    ? 'text-amber-700 dark:text-amber-300 font-semibold'
                    : 'text-amber-700/80 dark:text-amber-500/80 hover:text-amber-900 dark:hover:text-amber-300'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Gamemakers Console
                <span className="text-[9px] bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 px-1 rounded font-mono uppercase">
                  Staff
                </span>
                {activeTab === 'gamemaker' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-600 dark:bg-amber-500 rounded-full" />
                )}
              </button>
            )}
          </nav>

          {/* Zone 3: Theme, Sound, Gamemaker Gate & Tribute Profile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="min-h-[40px] min-w-[40px] sm:min-h-[42px] sm:min-w-[42px] flex items-center justify-center text-stone-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-100 dark:hover:bg-neutral-800/60 rounded-lg transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-amber-700" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onToggleSound}
              title={
                soundState
                  ? 'Mute Capitol sound & voice effects'
                  : 'Enable Capitol sound & voice effects'
              }
              className="min-h-[40px] min-w-[40px] sm:min-h-[42px] sm:min-w-[42px] flex items-center justify-center text-stone-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-100 dark:hover:bg-neutral-800/60 rounded-lg transition-colors"
              aria-label="Toggle sound"
            >
              {soundState ? (
                <Volume2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenGamemakerAuthModal}
              title={
                gamemakerAuth.isAuthorized
                  ? `Authorized as ${gamemakerAuth.gamemakerName}`
                  : 'Gamemaker / Organizer Login'
              }
              aria-label="Organizer Portal"
              className={`min-h-[40px] min-w-[40px] sm:min-h-[42px] px-2.5 rounded-lg border transition-all flex items-center justify-center gap-1.5 text-xs ${
                gamemakerAuth.isAuthorized
                  ? 'bg-amber-100 dark:bg-amber-500/15 border-amber-400 dark:border-amber-500/50 text-amber-800 dark:text-amber-300 hover:bg-amber-200/70 dark:hover:bg-amber-500/25'
                  : 'bg-stone-100 dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 text-stone-600 dark:text-neutral-400 hover:text-amber-800 dark:hover:text-amber-200 hover:border-stone-300 dark:hover:border-neutral-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden xl:inline text-[11px] font-mono">
                {gamemakerAuth.isAuthorized ? 'Gamemaker' : 'Organizer'}
              </span>
            </button>

            {/* Tribute Profile Switcher + Avatar Trigger */}
            <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-neutral-900 border border-stone-300 dark:border-amber-900/50 hover:border-amber-500/70 rounded-xl p-1 pr-2 sm:pr-2.5 transition-all shadow-sm min-h-[40px]">
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
                  aria-label="Select Tribute"
                  className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-600/30 border border-amber-400 dark:border-amber-500/50 flex items-center justify-center text-amber-700 dark:text-amber-300"
                >
                  <User className="w-3 h-3" />
                </button>
              )}
              <button
                type="button"
                onClick={onOpenPlayerModal}
                className="text-left max-w-[68px] sm:max-w-[115px] truncate"
              >
                <span className="block text-[11px] sm:text-xs font-medium text-stone-900 dark:text-amber-100 truncate">
                  {currentPlayer ? currentPlayer.name : 'Sign In'}
                </span>
                <span className="hidden sm:block text-[10px] text-amber-700 dark:text-amber-400/80 truncate">
                  {currentPlayer?.category || 'Tribute'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Thumb-Zone Bottom Tab Bar (< md only) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0e1015]/95 backdrop-blur-md border-t border-stone-200 dark:border-amber-950/60 pb-safe transition-colors"
      >
        <div
          className={`grid ${
            gamemakerAuth.isAuthorized ? 'grid-cols-4' : 'grid-cols-3'
          } h-14 items-center`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors relative ${
              activeTab === 'queue'
                ? 'text-amber-700 dark:text-amber-300 font-semibold'
                : 'text-stone-500 dark:text-neutral-400'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>The Reaping</span>
            {pendingKudosCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400 animate-ping absolute top-2 right-5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('victors')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'victors'
                ? 'text-amber-700 dark:text-amber-300 font-semibold'
                : 'text-stone-500 dark:text-neutral-400'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Victors</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mygames')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              activeTab === 'mygames'
                ? 'text-amber-700 dark:text-amber-300 font-semibold'
                : 'text-stone-500 dark:text-neutral-400'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>My Games</span>
          </button>

          {gamemakerAuth.isAuthorized && (
            <button
              type="button"
              onClick={() => setActiveTab('gamemaker')}
              className={`h-full flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                activeTab === 'gamemaker'
                  ? 'text-amber-700 dark:text-amber-300 font-semibold'
                  : 'text-stone-500 dark:text-neutral-400'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Console</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
};
