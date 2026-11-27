import React from 'react';
import { Volume2, VolumeX, Shield, User, Flame, Trophy, BarChart3, Sun, Moon } from 'lucide-react';
import { GamemakerAuth, Player } from '../../types';
import { TributeAvatar } from '../TributeAvatar';

export type AppTabV2 = 'queue' | 'victors' | 'mygames' | 'gamemaker';

interface HeaderV2Props {
  activeTab: AppTabV2;
  setActiveTab: (tab: AppTabV2) => void;
  currentPlayer: Player | null;
  onOpenPlayerModal: () => void;
  onOpenCurrentProfile: () => void;
  gamemakerAuth: GamemakerAuth;
  onOpenGamemakerAuthModal: () => void;
  soundState: boolean;
  onToggleSound: () => void;
  pendingKudosCount: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const HeaderV2: React.FC<HeaderV2Props> = ({
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
      {/* Minimalist Top App Bar (56px mobile, 64px desktop) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#090a0d]/90 backdrop-blur-md border-b border-stone-200 dark:border-white/[0.07] transition-colors">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 h-14 md:h-16 flex items-center justify-between gap-2 sm:gap-6">
          {/* Zone 1: Brand Title */}
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className="flex items-center gap-2 text-left whitespace-nowrap min-w-0 group min-h-[44px]"
          >
            <img
              src="/the_shuttle_games_logo.png"
              alt="The Shuttle Games"
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-amber-500/50 object-contain shrink-0"
            />
            <span className="font-cinzel text-xs sm:text-base font-bold tracking-wide sm:tracking-wider text-stone-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors truncate">
              THE SHUTTLE GAMES
            </span>
          </button>

          {/* Zone 2: Clean Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`whitespace-nowrap shrink-0 py-1.5 transition-colors border-b-2 ${
                activeTab === 'queue'
                  ? 'text-amber-700 dark:text-amber-300 border-amber-600 dark:border-amber-400 font-semibold'
                  : 'text-stone-600 dark:text-neutral-400 border-transparent hover:text-stone-900 dark:hover:text-neutral-100'
              }`}
            >
              The Reaping
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('victors')}
              className={`whitespace-nowrap shrink-0 py-1.5 transition-colors border-b-2 ${
                activeTab === 'victors'
                  ? 'text-amber-700 dark:text-amber-300 border-amber-600 dark:border-amber-400 font-semibold'
                  : 'text-stone-600 dark:text-neutral-400 border-transparent hover:text-stone-900 dark:hover:text-neutral-100'
              }`}
            >
              Victors
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('mygames')}
              className={`whitespace-nowrap shrink-0 py-1.5 transition-colors border-b-2 ${
                activeTab === 'mygames'
                  ? 'text-amber-700 dark:text-amber-300 border-amber-600 dark:border-amber-400 font-semibold'
                  : 'text-stone-600 dark:text-neutral-400 border-transparent hover:text-stone-900 dark:hover:text-neutral-100'
              }`}
            >
              My Games
            </button>

            {gamemakerAuth.isAuthorized && (
              <button
                type="button"
                onClick={() => setActiveTab('gamemaker')}
                className={`whitespace-nowrap shrink-0 py-1.5 transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'gamemaker'
                    ? 'text-amber-700 dark:text-amber-300 border-amber-600 dark:border-amber-400 font-semibold'
                    : 'text-amber-700/80 dark:text-amber-400/80 border-transparent hover:text-amber-900 dark:hover:text-amber-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Console
              </button>
            )}
          </nav>

          {/* Zone 3: Minimal Action Cluster */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center text-stone-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
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
              title={soundState ? 'Mute alerts & voice-over' : 'Enable alerts & voice-over'}
              aria-label="Toggle sound"
              className="min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center text-stone-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-100 dark:hover:bg-white/[0.06] rounded-lg transition-colors"
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
                  ? `Gamemaker: ${gamemakerAuth.gamemakerName}`
                  : 'Organizer Portal'
              }
              aria-label="Organizer Portal"
              className={`min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center rounded-lg transition-colors ${
                gamemakerAuth.isAuthorized
                  ? 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10'
                  : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-100 hover:bg-stone-100 dark:hover:bg-white/[0.06]'
              }`}
            >
              <Shield className="w-4 h-4" />
            </button>

            {/* Unified Avatar + Tribute Switcher Pill (fits cleanly on 360px phones) */}
            <div className="flex items-center gap-1.5 rounded-xl bg-stone-100 dark:bg-white/[0.04] border border-stone-200 dark:border-white/[0.08] p-1 pr-2 sm:pr-2.5 min-h-[40px]">
              {currentPlayer ? (
                <TributeAvatar
                  name={currentPlayer.name}
                  avatarUrl={currentPlayer.avatarUrl}
                  size="xs"
                  onClick={onOpenCurrentProfile}
                  title="Open Your Profile"
                />
              ) : (
                <User className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 ml-1" />
              )}

              <button
                type="button"
                onClick={onOpenPlayerModal}
                className="text-xs font-medium text-stone-900 dark:text-neutral-100 hover:text-amber-700 dark:hover:text-amber-200 max-w-[68px] sm:max-w-[130px] truncate transition-colors"
              >
                {currentPlayer ? currentPlayer.name : 'Sign In'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Thumb-Zone Navigation Bar (56px + safe-area, visible on < md only) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#090a0d]/95 backdrop-blur-md border-t border-stone-200 dark:border-white/[0.08] pb-safe transition-colors"
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
            <span>Reaping</span>
            {pendingKudosCount > 0 && (
              <span className="text-[9px] font-mono text-amber-600 dark:text-amber-400 absolute top-1 right-4">!</span>
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
