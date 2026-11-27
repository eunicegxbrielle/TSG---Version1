import React, { useState } from 'react';
import { Play, LogOut, Volume2, BellRing, ChevronRight, Swords } from 'lucide-react';
import {
  Court,
  CourtMatch,
  Player,
  QueueEntry,
  ReapingQueueStatus,
  SKILL_CATEGORIES,
  SkillCategory,
  CATEGORY_TO_DISTRICT,
} from '../../types';
import {
  addToQueue,
  removeFromQueue,
  calculateEstimatedWaitTime,
  getPlayerPreReadyInfo,
  getPreReadyMatches,
} from '../../utils/storage';
import {
  announcePreReadyAlert,
  announceArenaAssignmentAlert,
  announcePostGameKudosAlert,
} from '../../utils/audio';
import { TributeAvatar, resolvePlayerAvatar } from '../TributeAvatar';

interface ReapingV2Props {
  currentPlayer: Player | null;
  tributes: Player[];
  queue: QueueEntry[];
  courts: Court[];
  activeMatch?: CourtMatch;
  pendingKudosMatch?: CourtMatch;
  onOpenKudosModal: () => void;
  onOpenPlayerModal: () => void;
  onViewProfile: (player: Player) => void;
  onQueueUpdated: () => void;
  activeSessionName: string;
  reapingStatus?: ReapingQueueStatus;
}

export const ReapingV2: React.FC<ReapingV2Props> = ({
  currentPlayer,
  tributes,
  queue,
  courts,
  activeMatch,
  pendingKudosMatch,
  onOpenKudosModal,
  onOpenPlayerModal,
  onViewProfile,
  onQueueUpdated,
  activeSessionName,
  reapingStatus = 'open',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory>(
    currentPlayer?.category || 'Intermediate'
  );

  if (!currentPlayer) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 text-center space-y-5">
        <img
          src="/the_shuttle_games_logo.png"
          alt="The Shuttle Games"
          className="w-20 h-20 mx-auto rounded-full border border-amber-500/60 dark:border-amber-500/50 object-contain"
        />
        <div className="space-y-1.5">
          <h1 className="font-cinzel text-2xl font-bold text-stone-900 dark:text-amber-100">The Reaping</h1>
          <p className="text-sm text-stone-600 dark:text-neutral-400">
            Sign in as a tribute to join the badminton open play queue.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenPlayerModal}
          className="w-full min-h-[48px] px-6 py-3 bg-amber-400 hover:bg-amber-300 text-black font-cinzel font-bold text-sm rounded-2xl transition-colors"
        >
          Select or Register Tribute
        </button>
      </div>
    );
  }

  const queueIndex = queue.findIndex((q) => q.playerId === currentPlayer.id);
  const isInQueue = queueIndex >= 0;
  const isNextInQueue = queueIndex >= 0 && queueIndex < 4;
  const estimatedWaitMin = isInQueue ? calculateEstimatedWaitTime(queueIndex, courts.length) : 0;

  const preReadyInfo = getPlayerPreReadyInfo(currentPlayer.id);
  const allPreReady = getPreReadyMatches();
  const preReadyPlayerIds = new Set<string>();
  allPreReady.forEach((m) => {
    preReadyPlayerIds.add(m.team1.player1.id);
    preReadyPlayerIds.add(m.team1.player2.id);
    preReadyPlayerIds.add(m.team2.player1.id);
    preReadyPlayerIds.add(m.team2.player2.id);
  });

  const isReapingClosed = reapingStatus === 'closed';
  const isArenaFull = reapingStatus === 'full';

  const statusText =
    reapingStatus === 'open'
      ? 'Reaping is Open'
      : reapingStatus === 'full'
      ? 'The Arena is Full'
      : 'Reaping has Ended';

  const handleJoinQueue = () => {
    if (pendingKudosMatch) {
      onOpenKudosModal();
      return;
    }
    if (isReapingClosed || isArenaFull) return;
    currentPlayer.category = selectedCategory;
    addToQueue(currentPlayer);
    onQueueUpdated();
  };

  const handleLeaveQueue = () => {
    removeFromQueue(currentPlayer.id);
    onQueueUpdated();
  };

  const activeArenasCount = courts.filter((c) => c.status === 'in_game').length;

  return (
    <div className="space-y-8">
      {/* Quiet Brand Header & Primary Queue Action */}
      <section className="space-y-4 sm:space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-stone-600 dark:text-neutral-400">
              <span className="text-amber-700 dark:text-amber-400 font-medium truncate max-w-[160px] sm:max-w-none">
                {activeSessionName}
              </span>
              <span aria-hidden="true">·</span>
              <span>Doubles</span>
              <span aria-hidden="true">·</span>
              <span
                className={
                  reapingStatus === 'open'
                    ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                    : reapingStatus === 'full'
                    ? 'text-amber-700 dark:text-amber-300 font-medium'
                    : 'text-red-700 dark:text-red-400 font-medium'
                }
              >
                {statusText}
              </span>
            </div>
            <h1 className="font-cinzel text-2xl sm:text-4xl font-bold text-stone-900 dark:text-amber-100 tracking-tight">
              The Reaping
            </h1>
          </div>

          <button
            type="button"
            onClick={() => onViewProfile(currentPlayer)}
            className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] hover:border-amber-500/60 dark:hover:border-amber-500/40 transition-colors text-left self-start sm:self-auto min-h-[48px] shadow-xs dark:shadow-none"
          >
            <TributeAvatar name={currentPlayer.name} avatarUrl={currentPlayer.avatarUrl} size="sm" />
            <div className="text-xs min-w-0">
              <div className="font-semibold text-stone-900 dark:text-neutral-100 truncate">{currentPlayer.name}</div>
              <div className="text-stone-600 dark:text-neutral-400 truncate">
                {currentPlayer.category} · {currentPlayer.district}
              </div>
            </div>
          </button>
        </div>

        {/* Contextual Alert Strip (Pre-Ready / In Game / Pending Gifts) */}
        {preReadyInfo.isPreReady && preReadyInfo.match && !activeMatch && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-400 dark:border-amber-400/60 space-y-3 shadow-xs dark:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-xs font-mono text-amber-800 dark:text-amber-300 font-semibold">
                  On Deck ·{' '}
                  {preReadyInfo.targetCourtId
                    ? `Arena ${preReadyInfo.targetCourtId}`
                    : 'Next Available Arena'}
                </div>
                <h2 className="font-cinzel text-lg sm:text-xl font-bold text-stone-900 dark:text-white">
                  Get Ready, Tribute! You Are Next into the Arena.
                </h2>
                <p className="text-xs text-stone-700 dark:text-neutral-300">
                  Teammate: <strong className="text-amber-800 dark:text-amber-200">{preReadyInfo.teammate?.name}</strong>{' '}
                  · Opponents:{' '}
                  <strong className="text-stone-900 dark:text-neutral-100">
                    {preReadyInfo.opponents?.[0]?.name} &amp; {preReadyInfo.opponents?.[1]?.name}
                  </strong>
                </p>
              </div>

              <button
                type="button"
                onClick={() => announcePreReadyAlert(preReadyInfo.targetCourtId)}
                className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs inline-flex items-center justify-center gap-2 shrink-0 transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                Voice &amp; Vibrate Alert
              </button>
            </div>
          </div>
        )}

        {activeMatch && (
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#11131a] border-2 border-amber-400 dark:border-amber-500/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs dark:shadow-none">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center shrink-0">
                <Swords className="w-5 h-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <div className="text-xs text-amber-700 dark:text-amber-400 font-mono uppercase tracking-wider font-bold">
                  Arena Assignment · {activeMatch.courtName}
                </div>
                <div className="font-cinzel text-base sm:text-lg font-bold text-stone-900 dark:text-white truncate">
                  Tribute, please go to {activeMatch.courtName}.
                </div>
                <div className="text-xs text-stone-600 dark:text-neutral-400">
                  {activeMatch.team1.player1.name} &amp; {activeMatch.team1.player2?.name} vs{' '}
                  {activeMatch.team2.player1.name} &amp; {activeMatch.team2.player2?.name}
                </div>
                <div className="font-cinzel text-xs font-bold italic text-amber-800 dark:text-amber-300 pt-0.5">
                  &ldquo;May the shots be ever on your favor.&rdquo;
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => announceArenaAssignmentAlert(activeMatch.courtName)}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-semibold text-xs inline-flex items-center justify-center gap-2 shrink-0 transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              Arena Announcer
            </button>
          </div>
        )}

        {pendingKudosMatch && !activeMatch && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-400 dark:border-amber-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs dark:shadow-none">
            <div className="space-y-1">
              <div className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                Match Complete · Post-Game Gifts Required
              </div>
              <div className="font-cinzel text-lg font-bold text-stone-900 dark:text-amber-100">
                Bestow Sponsor's Gifts to Re-Enter Queue
              </div>
              <p className="text-xs text-stone-700 dark:text-neutral-300">
                Technical Skill is required; Character is optional. Submitting automatically joins you back into The Reaping.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => announcePostGameKudosAlert()}
                aria-label="Replay notification alert"
                className="min-h-[44px] min-w-[44px] rounded-xl bg-white dark:bg-[#11131a] border border-amber-400 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0"
              >
                <BellRing className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onOpenKudosModal}
                className="flex-1 sm:flex-none min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-cinzel font-bold text-xs transition-colors"
              >
                Bestow Gifts Now
              </button>
            </div>
          </div>
        )}

        {/* Primary Action Box (Single Clean Card) */}
        {!activeMatch && !pendingKudosMatch && (
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] shadow-xs dark:shadow-none">
            {isInQueue ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-500/10 border border-amber-400 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 flex items-center justify-center font-cinzel text-2xl font-bold tabular-nums shrink-0">
                    #{queueIndex + 1}
                  </div>
                  <div>
                    <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      In The Reaping Queue{isNextInQueue ? ' · Next in Line' : ''}
                    </div>
                    <div className="font-cinzel text-lg font-bold text-stone-900 dark:text-neutral-100 mt-0.5 tabular-nums">
                      Position {queueIndex + 1} of {queue.length}
                    </div>
                    <div className="text-xs text-stone-600 dark:text-neutral-400 font-mono tabular-nums mt-0.5">
                      Est. Wait: {isNextInQueue ? '1–3 mins' : `~${estimatedWaitMin} mins`} ·{' '}
                      {currentPlayer.category}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLeaveQueue}
                  className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-stone-300 dark:border-white/[0.08] text-xs font-medium text-stone-700 dark:text-neutral-300 inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Leave Queue
                </button>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                <div className="space-y-3 min-w-0">
                  <div>
                    <h2 className="font-cinzel text-lg sm:text-xl font-bold text-stone-900 dark:text-amber-100">
                      Step Forward into The Reaping
                    </h2>
                    <p className="text-xs text-stone-600 dark:text-neutral-400 mt-0.5">
                      Choose your playing tier and enter the live doubles queue.
                    </p>
                  </div>

                  {/* Horizontal Scrollable Skill Picker for effortless mobile thumbs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {SKILL_CATEGORIES.map((cat) => {
                      const active = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`min-h-[42px] px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors border ${
                            active
                              ? 'bg-amber-400 text-black border-amber-400 font-semibold'
                              : 'bg-stone-50 dark:bg-[#090a0d] text-stone-700 dark:text-neutral-300 border-stone-200 dark:border-white/[0.07] hover:border-amber-500/60 dark:hover:border-amber-500/40'
                          }`}
                        >
                          {cat} · {CATEGORY_TO_DISTRICT[cat]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleJoinQueue}
                  disabled={isReapingClosed || isArenaFull}
                  className={`w-full lg:w-auto min-h-[48px] px-7 py-3 rounded-2xl font-cinzel font-bold text-sm inline-flex items-center justify-center gap-2.5 shrink-0 transition-all active:scale-[0.98] ${
                    isReapingClosed || isArenaFull
                      ? 'bg-stone-200 dark:bg-neutral-800 text-stone-500 dark:text-neutral-500 cursor-not-allowed'
                      : 'bg-amber-400 hover:bg-amber-300 text-black shadow-lg shadow-amber-900/15 dark:shadow-amber-950/30'
                  }`}
                >
                  <Play className="w-4 h-4 fill-current" />
                  {isArenaFull
                    ? 'The Arena is Full'
                    : isReapingClosed
                    ? 'Reaping Ended'
                    : 'Enter the Reaping'}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 2: THE ARENA (Minimalist 2-Column Match Grid) */}
      <section className="space-y-3.5">
        <div className="flex items-baseline justify-between border-b border-stone-200 dark:border-white/[0.07] pb-2.5">
          <h2 className="font-cinzel text-lg sm:text-xl font-bold text-stone-900 dark:text-amber-100">The Arena</h2>
          <span className="text-xs font-mono tabular-nums text-stone-600 dark:text-neutral-400">
            {activeArenasCount} in battle · {courts.length - activeArenasCount} available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courts.map((court) => {
            const isInGame = court.status === 'in_game' && court.currentMatch;
            const match = court.currentMatch;
            const elapsedMins = match
              ? Math.max(1, Math.floor((Date.now() - match.startTime) / 60000))
              : 0;

            return (
              <div
                key={court.id}
                className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] space-y-4 shadow-xs dark:shadow-none"
              >
                {/* Arena Header Line */}
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <h3 className="font-cinzel text-base font-bold text-amber-800 dark:text-amber-200">{court.name}</h3>
                    <span className="text-xs text-stone-500 dark:text-neutral-500 font-mono">Doubles</span>
                  </div>
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      isInGame ? 'text-amber-700 dark:text-amber-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400'
                    }`}
                  >
                    {isInGame ? `In Battle · ${elapsedMins}m` : 'Available'}
                  </span>
                </div>

                {/* Match Roster (Stacks cleanly on <sm, 2-col VS on sm+) */}
                {isInGame && match ? (
                  <div className="flex flex-col sm:grid sm:grid-cols-11 sm:items-center gap-2.5 sm:gap-2 pt-3 border-t border-stone-200 dark:border-white/[0.06]">
                    {/* Team 1 */}
                    <div className="sm:col-span-5 space-y-2">
                      {[match.team1.player1, match.team1.player2].filter(Boolean).map((p) => {
                        const pl = p!;
                        const resolved = tributes.find((t) => t.id === pl.id) || pl;
                        const avatar = resolvePlayerAvatar(pl.id, pl.name, tributes, pl.avatarUrl);
                        return (
                          <button
                            key={pl.id}
                            type="button"
                            onClick={() => onViewProfile(resolved)}
                            className="w-full min-h-[44px] flex items-center gap-2.5 text-left group"
                          >
                            <TributeAvatar name={pl.name} avatarUrl={avatar} size="sm" />
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-stone-900 dark:text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 truncate transition-colors">
                                {pl.name}
                              </div>
                              <div className="text-[11px] text-stone-500 dark:text-neutral-500 truncate">
                                {pl.district}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* VS Separator */}
                    <div className="sm:col-span-1 text-center flex items-center justify-center gap-2">
                      <span className="flex-1 h-px bg-stone-200 dark:bg-white/[0.06] sm:hidden" />
                      <span className="font-cinzel text-[11px] font-bold text-amber-700 dark:text-amber-500/80 shrink-0">
                        vs
                      </span>
                      <span className="flex-1 h-px bg-stone-200 dark:bg-white/[0.06] sm:hidden" />
                    </div>

                    {/* Team 2 */}
                    <div className="sm:col-span-5 space-y-2">
                      {[match.team2.player1, match.team2.player2].filter(Boolean).map((p) => {
                        const pl = p!;
                        const resolved = tributes.find((t) => t.id === pl.id) || pl;
                        const avatar = resolvePlayerAvatar(pl.id, pl.name, tributes, pl.avatarUrl);
                        return (
                          <button
                            key={pl.id}
                            type="button"
                            onClick={() => onViewProfile(resolved)}
                            className="w-full min-h-[44px] flex sm:flex-row-reverse items-center gap-2.5 text-left sm:text-right group"
                          >
                            <TributeAvatar name={pl.name} avatarUrl={avatar} size="sm" />
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-stone-900 dark:text-neutral-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 truncate transition-colors">
                                {pl.name}
                              </div>
                              <div className="text-[11px] text-stone-500 dark:text-neutral-500 truncate">
                                {pl.district}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-5 border-t border-stone-200 dark:border-white/[0.06] text-center text-xs text-stone-500 dark:text-neutral-500">
                    Arena clear for the next Doubles match.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: WAITING TRIBUTES (Clean Touch Tap-List Rows) */}
      <section className="space-y-3.5">
        <div className="flex items-baseline justify-between border-b border-stone-200 dark:border-white/[0.07] pb-2.5">
          <h2 className="font-cinzel text-lg sm:text-xl font-bold text-stone-900 dark:text-amber-100">
            Waiting Tributes
          </h2>
          <span className="text-xs font-mono tabular-nums text-stone-600 dark:text-neutral-400">
            {queue.length} in line
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] text-center text-xs text-stone-600 dark:text-neutral-400">
            The Reaping queue is empty. Tap &ldquo;Enter the Reaping&rdquo; above to step forward.
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] divide-y divide-stone-200 dark:divide-white/[0.06] overflow-hidden shadow-xs dark:shadow-none">
            {queue.map((entry, idx) => {
              const isMe = entry.playerId === currentPlayer.id;
              const isTop4 = idx < 4;
              const isPreReady = preReadyPlayerIds.has(entry.playerId);
              const waitTime = calculateEstimatedWaitTime(indexOrZero(idx), courts.length);
              const foundPlayer = tributes.find((t) => t.id === entry.playerId);
              const avatar = resolvePlayerAvatar(
                entry.playerId,
                entry.playerName,
                tributes,
                entry.avatarUrl
              );
              const districtLabel =
                CATEGORY_TO_DISTRICT[entry.playerCategory] || entry.playerDistrict;

              return (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => foundPlayer && onViewProfile(foundPlayer)}
                  className={`w-full min-h-[60px] px-4 py-3 flex items-center justify-between gap-3 text-left transition-colors ${
                    isMe
                      ? 'bg-amber-50 hover:bg-amber-100/70 dark:bg-amber-500/[0.07] dark:hover:bg-amber-500/[0.11]'
                      : 'hover:bg-stone-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 text-xs font-mono tabular-nums font-semibold shrink-0 ${
                        isPreReady || isTop4 ? 'text-amber-700 dark:text-amber-400' : 'text-stone-500 dark:text-neutral-500'
                      }`}
                    >
                      #{idx + 1}
                    </span>

                    <TributeAvatar name={entry.playerName} avatarUrl={avatar} size="sm" />

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-stone-900 dark:text-neutral-100 truncate">
                          {entry.playerName}
                        </span>
                        {isMe && (
                          <span className="text-[10px] font-mono font-bold text-amber-700 dark:text-amber-400">
                            (You)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-600 dark:text-neutral-400 truncate">
                        {entry.playerCategory} · {districtLabel}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 text-right">
                    <div>
                      <div
                        className={`text-xs font-medium ${
                          isPreReady
                            ? 'text-amber-700 dark:text-amber-300'
                            : isTop4
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-stone-600 dark:text-neutral-400'
                        }`}
                      >
                        {isPreReady ? 'On Deck' : isTop4 ? 'Next' : 'Waiting'}
                      </div>
                      <div className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-neutral-500">
                        {isPreReady ? 'Ready' : isTop4 ? '1–3m' : `~${waitTime}m`}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-stone-400 dark:text-neutral-600" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

function indexOrZero(n: number): number {
  return n < 0 ? 0 : n;
}
