import React, { useState } from 'react';
import {
  Clock,
  Users,
  Play,
  LogOut,
  Sparkles,
  Swords,
  Timer,
  CheckCircle,
  AlertCircle,
  Shield,
  Zap,
  Volume2,
  BellRing,
} from 'lucide-react';
import {
  Court,
  CourtMatch,
  Player,
  QueueEntry,
  ReapingQueueStatus,
  SKILL_CATEGORIES,
  SkillCategory,
  CATEGORY_TO_DISTRICT,
  PreReadyMatch,
} from '../types';
import {
  addToQueue,
  removeFromQueue,
  calculateEstimatedWaitTime,
  getPlayerPreReadyInfo,
  getPreReadyMatches,
} from '../utils/storage';
import { announcePreReadyAlert, announcePostGameKudosAlert } from '../utils/audio';
import { TributeAvatar, resolvePlayerAvatar } from './TributeAvatar';

interface TributeQueueViewProps {
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

export const TributeQueueView: React.FC<TributeQueueViewProps> = ({
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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-8 bg-[#12141c] border border-amber-900/50 rounded-2xl max-w-md mx-auto shadow-2xl">
          <img
            src="/the_shuttle_games_logo.png"
            alt="The Shuttle Games"
            className="w-20 h-20 mx-auto rounded-full border-2 border-amber-500/80 mb-4 shadow-lg shadow-amber-950/60"
          />
          <h2 className="font-cinzel text-xl font-bold text-amber-200 mb-2">
            Tribute Login Required
          </h2>
          <p className="text-sm text-neutral-400 mb-6">
            Please login or select your tribute profile before entering The Reaping.
          </p>
          <button
            onClick={onOpenPlayerModal}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-cinzel font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg hover:from-amber-300 hover:to-amber-400 transition-all active:scale-95"
          >
            Select / Register Tribute
          </button>
        </div>
      </div>
    );
  }

  // Check queue status
  const queueIndex = queue.findIndex((q) => q.playerId === currentPlayer.id);
  const isInQueue = queueIndex >= 0;
  const isNextInQueue = queueIndex >= 0 && queueIndex < 4;
  const estimatedWaitMin = isInQueue ? calculateEstimatedWaitTime(queueIndex, courts.length) : 0;

  // Check Pre-Ready status
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

  const handleJoinQueue = () => {
    if (pendingKudosMatch) {
      onOpenKudosModal();
      return;
    }
    if (isReapingClosed || isArenaFull) {
      return;
    }
    currentPlayer.category = selectedCategory;
    addToQueue(currentPlayer);
    onQueueUpdated();
  };

  const handleLeaveQueue = () => {
    removeFromQueue(currentPlayer.id);
    onQueueUpdated();
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative rounded-2xl overflow-hidden border border-amber-900/50 shadow-2xl min-h-[190px] md:min-h-[220px] flex items-end">
        <img
          src="/src/assets/images/hunger_games_arena_hero_1794230313253.jpg"
          alt="The Arena"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 contrast-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0e] via-[#0a0b0e]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0b0e]/95 via-[#0a0b0e]/60 to-transparent" />

        <div className="relative z-10 p-6 md:p-8 max-w-4xl flex items-center justify-between w-full">
          <div className="flex items-center gap-5">
            <img
              src="/the_shuttle_games_logo.png"
              alt="The Shuttle Games Logo"
              className="hidden sm:block w-16 h-16 md:w-20 md:h-20 object-contain rounded-2xl border-2 border-amber-500/80 shadow-2xl shadow-black shrink-0"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">
                <span className="font-bold text-amber-300">The Shuttle Games</span>
                <span aria-hidden="true">·</span>
                <span>{activeSessionName}</span>
                <span aria-hidden="true">·</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                    reapingStatus === 'open'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : reapingStatus === 'full'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                >
                  {reapingStatus === 'open'
                    ? 'Reaping is Open'
                    : reapingStatus === 'full'
                    ? 'The Arena is Full'
                    : 'Reaping has Ended'}
                </span>
              </div>
              <h1 className="font-cinzel text-3xl md:text-4xl font-extrabold text-amber-100 tracking-tight">
                The Reaping
              </h1>
              <p className="text-xs text-neutral-300 mt-0.5 max-w-xl">
                Doubles badminton open play queue. Enter The Reaping to be matched and assigned to The Arena.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onViewProfile(currentPlayer)}
            className="hidden lg:flex items-center gap-3 text-left p-2 rounded-xl bg-black/40 border border-amber-900/50 hover:border-amber-500/70 transition-colors"
            title="View Your Tribute Profile"
          >
            <TributeAvatar
              name={currentPlayer.name}
              avatarUrl={currentPlayer.avatarUrl}
              size="md"
            />
            <div className="text-xs font-mono">
              <span className="text-amber-300 font-bold text-sm block">{currentPlayer.name}</span>
              <span className="text-neutral-400">
                {currentPlayer.category} · {currentPlayer.district}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* NOTIFICATION 1: PRE-READY ALERT (Tribute is On Deck for Next Arena) */}
      {preReadyInfo.isPreReady && preReadyInfo.match && !activeMatch && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/90 via-[#262016] to-amber-950/90 border-2 border-amber-400 shadow-2xl shadow-amber-950/70">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-black flex items-center justify-center font-bold shadow-lg shadow-amber-950/50 shrink-0 animate-pulse">
                <Zap className="w-7 h-7 fill-current animate-bounce" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-400 text-black">
                    ON DECK · PRE-READY
                  </span>
                  <span className="text-xs text-amber-300 font-mono font-bold">
                    {preReadyInfo.targetCourtId
                      ? `Target: Arena ${preReadyInfo.targetCourtId}`
                      : 'Assigned to the Next Available Arena!'}
                  </span>
                </div>
                <h3 className="font-cinzel text-xl md:text-2xl font-extrabold text-white mt-1">
                  Get Ready, Tribute! You Are Next into the Arena.
                </h3>
                <p className="text-xs text-amber-200/90 mt-1">
                  Gamemakers have pre-paired you. Please stretch and prepare your racket.
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-mono">
                  <span className="text-neutral-300">
                    Your Teammate:{' '}
                    <strong className="text-amber-300">
                      {preReadyInfo.teammate?.name} ({preReadyInfo.teammate?.district})
                    </strong>
                  </span>
                  <span aria-hidden="true" className="text-neutral-500">vs</span>
                  <span className="text-neutral-300">
                    Opponents:{' '}
                    <strong className="text-neutral-200">
                      {preReadyInfo.opponents?.[0]?.name} & {preReadyInfo.opponents?.[1]?.name}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => announcePreReadyAlert(preReadyInfo.targetCourtId)}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-cinzel font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
              >
                <Volume2 className="w-4 h-4" />
                Voice & Vibrate Alert
              </button>
              <span className="px-3 py-1.5 rounded-xl bg-black/50 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-bold text-center">
                Stand by Court Gate
              </span>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION 2: Player is currently active in a match */}
      {activeMatch && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/80 via-[#1f1b16] to-amber-950/80 border-2 border-amber-500 shadow-xl shadow-amber-950/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shrink-0">
                <Swords className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  Match in Progress · Report to The Arena
                </span>
                <h3 className="font-cinzel text-xl font-bold text-white">
                  You are Battling on {activeMatch.courtName}!
                </h3>
                <p className="text-xs text-neutral-300 mt-1">
                  Team 1: {activeMatch.team1.player1.name}{' '}
                  {activeMatch.team1.player2 && `& ${activeMatch.team1.player2.name}`} vs Team 2:{' '}
                  {activeMatch.team2.player1.name}{' '}
                  {activeMatch.team2.player2 && `& ${activeMatch.team2.player2.name}`}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-amber-400 font-mono block">
                Gamemakers will record Arena Results upon conclusion
              </span>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATION 3: Pending Mandatory Sponsor's Gifts */}
      {pendingKudosMatch && !activeMatch && (
        <div className="p-6 rounded-2xl bg-amber-950/40 border-2 border-amber-500/80 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/60 text-amber-300 flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block">
                Match Complete · Post-Game Kudos Required
              </span>
              <h3 className="font-cinzel text-lg font-bold text-amber-100">
                Bestow Sponsor's Gifts to Re-Enter The Reaping
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                Pick a Required Technical Skill (and optional Character & Sportsmanship) for your matchmates. Submitting automatically places you back in queue!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => announcePostGameKudosAlert()}
              title="Replay voice & vibration alert"
              className="p-3 rounded-xl bg-black/40 border border-amber-500/40 text-amber-300 hover:bg-amber-950/60 transition-colors"
            >
              <BellRing className="w-4 h-4" />
            </button>
            <button
              onClick={onOpenKudosModal}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg hover:from-amber-300 hover:to-amber-400 transition-all active:scale-95"
            >
              Bestow Sponsor's Gifts Now
            </button>
          </div>
        </div>
      )}

      {/* REAPING ACTION SECTION: Direct ENTER THE REAPING Button / In-Queue Banner */}
      {!activeMatch && !pendingKudosMatch && (
        <div className="p-5 md:p-6 rounded-2xl bg-[#12141c] border border-amber-900/40 shadow-xl">
          {isInQueue ? (
            /* User is already waiting in queue */
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border-2 border-amber-500/50 text-amber-300 flex items-center justify-center font-cinzel text-2xl font-black shrink-0">
                  #{queueIndex + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      IN THE REAPING QUEUE
                    </span>
                    {isNextInQueue && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500 text-black animate-pulse">
                        Next in line
                      </span>
                    )}
                  </div>
                  <h3 className="font-cinzel text-lg font-bold text-amber-100 mt-1">
                    Position #{queueIndex + 1} of {queue.length} Waiting Tributes
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-neutral-400 mt-0.5 font-mono">
                    <span>
                      Est. Wait: <strong className="text-amber-300 font-bold">{isNextInQueue ? '1 – 3 mins (Next Arena)' : `~${estimatedWaitMin} minutes`}</strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Tribute: {currentPlayer.name} ({currentPlayer.category} · {currentPlayer.district})</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleLeaveQueue}
                className="py-3 px-5 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/60 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 self-start md:self-auto shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                Withdraw from the Games
              </button>
            </div>
          ) : (
            /* User is NOT in queue: Direct Clean ENTER THE REAPING button */
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                    Step Forward, Tribute
                  </span>
                  <span className="text-neutral-500">·</span>
                  <span className="text-xs font-mono text-neutral-400">Doubles Matchmaking</span>
                </div>
                <h3 className="font-cinzel text-xl md:text-2xl font-black text-amber-100 mt-1">
                  Ready to Battle for Your District?
                </h3>
                <p className="text-xs text-neutral-300 mt-1 max-w-xl">
                  Press Enter the Reaping to join the queue. Gamemakers will pair you and dispatch your match to the next available Arena.
                </p>

                {/* Inline Skill Category Selector (Quick Adjustment) */}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="text-xs font-mono text-neutral-400 mr-1">Playing as:</span>
                  {SKILL_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const district = CATEGORY_TO_DISTRICT[cat];
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md shadow-amber-950/40'
                            : 'bg-[#161824] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <span>{cat}</span>
                        <span className={`ml-1.5 text-[10px] font-mono ${isSelected ? 'text-black/80' : 'text-amber-400/80'}`}>
                          {district}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* The Primary Button: ENTER THE REAPING */}
              <button
                onClick={handleJoinQueue}
                disabled={isReapingClosed || isArenaFull}
                className={`py-4 px-8 rounded-xl font-cinzel font-black text-sm uppercase tracking-wider transition-all shadow-xl flex items-center justify-center gap-3 shrink-0 self-start lg:self-center ${
                  isReapingClosed || isArenaFull
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700/50'
                    : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black hover:from-amber-300 hover:to-amber-500 hover:shadow-amber-500/20 active:scale-95 ring-2 ring-amber-400/50'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                {isArenaFull
                  ? 'The Arena is Full'
                  : isReapingClosed
                  ? 'Reaping has Ended'
                  : 'Enter the Reaping'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: THE ARENA (Made Bigger and Prominent) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-amber-400" />
            <h2 className="font-cinzel text-xl md:text-2xl font-black text-amber-100">
              The Arena ({courts.length} Battle Courts)
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping inline-block" />
              <strong className="text-amber-300">
                {courts.filter((c) => c.status === 'in_game').length} In Battle
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              <strong className="text-emerald-300">
                {courts.filter((c) => c.status === 'available').length} Available
              </strong>
            </span>
          </div>
        </div>

        {/* Larger Arena Grid: 2 columns on desktop for prominent display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courts.map((court) => {
            const isInGame = court.status === 'in_game';
            const match = court.currentMatch;
            const elapsedMins = match
              ? Math.max(1, Math.floor((Date.now() - match.startTime) / (1000 * 60)))
              : 0;

            return (
              <div
                key={court.id}
                className={`rounded-2xl border transition-all p-5 md:p-6 flex flex-col justify-between ${
                  isInGame
                    ? 'bg-gradient-to-b from-[#181a26] to-[#12141e] border-amber-700/60 shadow-xl shadow-amber-950/30'
                    : 'bg-[#12141c] border-neutral-800/90 shadow-md'
                }`}
              >
                {/* Court Top Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-cinzel font-black text-xs ${
                      isInGame ? 'bg-amber-500 text-black' : 'bg-neutral-800 text-neutral-300'
                    }`}>
                      {court.id}
                    </div>
                    <div>
                      <h3 className="font-cinzel text-lg font-bold text-amber-200">
                        {court.name}
                      </h3>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        Badminton Court {court.id} · Doubles
                      </span>
                    </div>
                  </div>

                  <div>
                    {isInGame ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold">
                        <Clock className="w-3.5 h-3.5 animate-spin" />
                        IN BATTLE · {elapsedMins}m
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5" />
                        AVAILABLE
                      </span>
                    )}
                  </div>
                </div>

                {/* Court Active Match / Visual Arena Floor */}
                <div className="py-4">
                  {isInGame && match ? (
                    <div className="rounded-xl bg-[#0f1118] border border-neutral-800 p-4 space-y-3">
                      <div className="grid grid-cols-11 items-center gap-2">
                        {/* Team 1 */}
                        <div className="col-span-5 space-y-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                            Team 1
                          </span>
                          {[match.team1.player1, match.team1.player2].filter(Boolean).map((p) => {
                            const playerObj = p!;
                            const resolvedPlayer = tributes.find((t) => t.id === playerObj.id) || playerObj;
                            const avatar = resolvePlayerAvatar(playerObj.id, playerObj.name, tributes, playerObj.avatarUrl);
                            return (
                              <button
                                key={playerObj.id}
                                type="button"
                                onClick={() => onViewProfile(resolvedPlayer)}
                                className="w-full p-2 rounded-lg bg-[#161824] border border-amber-900/40 hover:border-amber-500/60 transition-colors flex items-center gap-2 text-left"
                              >
                                <TributeAvatar name={playerObj.name} avatarUrl={avatar} size="xs" />
                                <div className="min-w-0">
                                  <div className="font-semibold text-neutral-100 text-xs truncate">
                                    {playerObj.name}
                                  </div>
                                  <div className="text-[10px] text-amber-400 font-mono">
                                    {playerObj.district}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* VS Center Emblem */}
                        <div className="col-span-1 text-center flex flex-col items-center justify-center">
                          <span className="w-7 h-7 rounded-full bg-amber-500 text-black font-cinzel font-black text-[11px] flex items-center justify-center shadow-md">
                            VS
                          </span>
                        </div>

                        {/* Team 2 */}
                        <div className="col-span-5 space-y-1.5">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold block text-right">
                            Team 2
                          </span>
                          {[match.team2.player1, match.team2.player2].filter(Boolean).map((p) => {
                            const playerObj = p!;
                            const resolvedPlayer = tributes.find((t) => t.id === playerObj.id) || playerObj;
                            const avatar = resolvePlayerAvatar(playerObj.id, playerObj.name, tributes, playerObj.avatarUrl);
                            return (
                              <button
                                key={playerObj.id}
                                type="button"
                                onClick={() => onViewProfile(resolvedPlayer)}
                                className="w-full p-2 rounded-lg bg-[#161824] border border-neutral-800 hover:border-amber-500/60 transition-colors flex items-center justify-end gap-2 text-right"
                              >
                                <div className="min-w-0">
                                  <div className="font-semibold text-neutral-100 text-xs truncate">
                                    {playerObj.name}
                                  </div>
                                  <div className="text-[10px] text-neutral-400 font-mono">
                                    {playerObj.district}
                                  </div>
                                </div>
                                <TributeAvatar name={playerObj.name} avatarUrl={avatar} size="xs" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Match footer */}
                      <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 pt-2 border-t border-neutral-850">
                        <span>Started: {new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-amber-300">Doubles Battle</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-[#0e1017] border border-neutral-850 p-6 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <h4 className="font-cinzel text-sm font-bold text-neutral-200">
                        Arena Clear & Available
                      </h4>
                      <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                        Gamemakers will dispatch the next pre-ready match or top waiting tributes into this arena.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: WAITING TRIBUTES (The Reaping Roster) */}
      <div className="p-6 rounded-2xl bg-[#12141c] border border-amber-900/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="font-cinzel text-xl font-black text-amber-100">
              Waiting Tributes ({queue.length})
            </h2>
          </div>
          <span className="text-xs text-neutral-400 font-mono">
            The Reaping Official Queue Roster
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="p-12 text-center rounded-xl bg-[#0e1017] border border-neutral-800 space-y-2">
            <Users className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-neutral-300 font-cinzel">The Reaping Queue is Empty</p>
            <p className="text-xs text-neutral-400">
              No tributes are currently waiting. Click "Enter the Reaping" above to step forward!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 text-neutral-400 font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3">Order</th>
                  <th className="py-3 px-3">Tribute Name</th>
                  <th className="py-3 px-3">Skill Category</th>
                  <th className="py-3 px-3">District</th>
                  <th className="py-3 px-3">Wait Time</th>
                  <th className="py-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {queue.map((entry, index) => {
                  const isMe = entry.playerId === currentPlayer.id;
                  const isTop4 = index < 4;
                  const isPreReady = preReadyPlayerIds.has(entry.playerId);
                  const waitTime = calculateEstimatedWaitTime(index, courts.length);

                  return (
                    <tr
                      key={entry.id}
                      className={`transition-colors ${
                        isMe
                          ? 'bg-amber-950/25 hover:bg-amber-950/40'
                          : isPreReady
                          ? 'bg-[#181a24] hover:bg-[#1c1f2c]'
                          : 'hover:bg-neutral-800/20'
                      }`}
                    >
                      <td className="py-3 px-3">
                        <span
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-cinzel font-bold text-xs ${
                            isPreReady
                              ? 'bg-amber-400 text-black font-extrabold shadow-sm'
                              : isTop4
                              ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          #{index + 1}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        {(() => {
                          const foundPlayer = tributes.find((t) => t.id === entry.playerId);
                          const avatar = resolvePlayerAvatar(
                            entry.playerId,
                            entry.playerName,
                            tributes,
                            entry.avatarUrl
                          );
                          return (
                            <button
                              type="button"
                              onClick={() => foundPlayer && onViewProfile(foundPlayer)}
                              className="flex items-center gap-2.5 text-left group"
                            >
                              <TributeAvatar
                                name={entry.playerName}
                                avatarUrl={avatar}
                                size="sm"
                              />
                              <span className="font-semibold text-neutral-100 group-hover:text-amber-300 transition-colors text-sm">
                                {entry.playerName}
                              </span>
                              {isMe && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-500 text-black">
                                  YOU
                                </span>
                              )}
                            </button>
                          );
                        })()}
                      </td>

                      <td className="py-3 px-3 text-amber-300 font-medium">
                        {entry.playerCategory}
                      </td>

                      <td className="py-3 px-3 text-neutral-300 font-mono">
                        {CATEGORY_TO_DISTRICT[entry.playerCategory] || entry.playerDistrict}
                      </td>

                      <td className="py-3 px-3 font-mono text-neutral-400">
                        {isPreReady ? 'Immediate (On Deck)' : isTop4 ? '1 – 3 mins' : `~${waitTime} mins`}
                      </td>

                      <td className="py-3 px-3 text-right">
                        {isPreReady ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-black uppercase animate-pulse shadow-sm">
                            <Zap className="w-3 h-3 fill-current" />
                            PRE-READY · ON DECK
                          </span>
                        ) : isTop4 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300 uppercase">
                            NEXT IN LINE
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono text-neutral-400 bg-neutral-800 uppercase">
                            WAITING
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
