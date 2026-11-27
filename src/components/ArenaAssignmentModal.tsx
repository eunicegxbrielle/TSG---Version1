import React from 'react';
import { Swords, Volume2, X, MapPin } from 'lucide-react';
import { CourtMatch, Player } from '../types';
import { announceArenaAssignmentAlert } from '../utils/audio';
import { TributeAvatar, resolvePlayerAvatar } from './TributeAvatar';

interface ArenaAssignmentModalProps {
  isOpen: boolean;
  match: CourtMatch | null;
  currentPlayer: Player;
  allTributes: Player[];
  onClose: () => void;
  onGoToArena?: () => void;
}

export const ArenaAssignmentModal: React.FC<ArenaAssignmentModalProps> = ({
  isOpen,
  match,
  currentPlayer,
  allTributes,
  onClose,
  onGoToArena,
}) => {
  if (!isOpen || !match) return null;

  const team1Players = [match.team1.player1, match.team1.player2].filter(Boolean) as Player[];
  const team2Players = [match.team2.player1, match.team2.player2].filter(Boolean) as Player[];
  const isOnTeam1 = team1Players.some((p) => p.id === currentPlayer.id);
  const yourTeam = isOnTeam1 ? team1Players : team2Players;
  const opposingTeam = isOnTeam1 ? team2Players : team1Players;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="arena-assignment-title"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#12141d] border-2 border-amber-500 dark:border-amber-500/80 shadow-2xl overflow-hidden">
        {/* Top Accent Strip */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 px-5 py-3 flex items-center justify-between text-black">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5" />
            <span className="font-cinzel font-black text-xs uppercase tracking-widest">
              Capitol Arena Summons
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close arena notification"
            className="min-w-[36px] min-h-[36px] rounded-lg bg-black/10 hover:bg-black/20 flex items-center justify-center text-black transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Arena Destination Callout */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
              <MapPin className="w-3.5 h-3.5" />
              <span>Your Match Has Been Called</span>
            </div>

            <h2
              id="arena-assignment-title"
              className="font-cinzel text-2xl sm:text-3xl font-black text-stone-900 dark:text-white tracking-wide"
            >
              {match.courtName}
            </h2>

            <p className="text-xs sm:text-sm text-stone-600 dark:text-neutral-300">
              {currentPlayer.name}, your doubles court is ready.
            </p>
          </div>

          {/* Official Capitol Quote */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-300 dark:border-amber-500/40 text-center">
            <p className="font-cinzel text-sm sm:text-base font-bold italic text-amber-900 dark:text-amber-200">
              &ldquo;Tribute, please go to {match.courtName}. May the shots be ever on your favor.&rdquo;
            </p>
          </div>

          {/* Matchup Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-stone-50 dark:bg-[#0c0e14] border border-stone-200 dark:border-neutral-800">
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold block">
                Your Pair
              </span>
              {yourTeam.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-xs font-semibold text-stone-900 dark:text-neutral-100">
                  <TributeAvatar
                    name={p.name}
                    avatarUrl={resolvePlayerAvatar(p.id, p.name, allTributes, p.avatarUrl)}
                    size="xs"
                  />
                  <span className="truncate">
                    {p.name}
                    {p.id === currentPlayer.id ? ' (You)' : ''}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-stone-200 dark:border-neutral-800 sm:pt-0 sm:border-t-0 sm:text-right">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-neutral-400 font-bold block">
                Opponents
              </span>
              {opposingTeam.map((p) => (
                <div key={p.id} className="flex items-center sm:flex-row-reverse gap-2 text-xs font-semibold text-stone-900 dark:text-neutral-100">
                  <TributeAvatar
                    name={p.name}
                    avatarUrl={resolvePlayerAvatar(p.id, p.name, allTributes, p.avatarUrl)}
                    size="xs"
                  />
                  <span className="truncate">{p.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => announceArenaAssignmentAlert(match.courtName)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 border border-stone-300 dark:border-neutral-700 text-stone-800 dark:text-amber-200 text-xs font-mono font-bold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              Play Arena Announcer
            </button>

            <button
              type="button"
              onClick={() => {
                if (onGoToArena) onGoToArena();
                onClose();
              }}
              className="flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-cinzel font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
            >
              Entering {match.courtName}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
