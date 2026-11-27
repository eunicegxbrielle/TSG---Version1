import React, { useState, useEffect } from 'react';
import {
  Shield,
  QrCode,
  Users,
  Play,
  Trophy,
  Flame,
  Volume2,
  PlusCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  LogOut,
  Radio,
  Zap,
  Swords,
  Trash2,
  ChevronDown,
  BellRing,
  Repeat,
} from 'lucide-react';
import {
  Court,
  CourtMatch,
  GamemakerAuth,
  Player,
  PreReadyMatch,
  QueueEntry,
  QueueSession,
  ReapingQueueStatus,
  CATEGORY_TO_DISTRICT,
} from '../types';
import {
  assignPlayersToCourt,
  recordMatchScore,
  createNewSession,
  getSessions,
  setActiveSessionId,
  setActiveSessionReapingStatus,
  getActiveSessionReapingStatus,
  getPreReadyMatches,
  createPreReadyMatch,
  deletePreReadyMatch,
  deployPreReadyMatchToCourt,
  getCurrentPlayer,
} from '../utils/storage';
import {
  playCannonBoom,
  playMockingjayWhistle,
  announceDeskArenaCallout,
} from '../utils/audio';
import { TributeAvatar, resolvePlayerAvatar } from './TributeAvatar';

interface GamemakerConsoleProps {
  courts: Court[];
  queue: QueueEntry[];
  activeSession: QueueSession;
  allTributes: Player[];
  gamemakerAuth: GamemakerAuth;
  onLogoutGamemaker: () => void;
  onDataUpdated: () => void;
  onOpenQrModal: () => void;
  currentVersion?: 'v1' | 'v2';
  onSwitchVersion?: () => void;
}

export const GamemakerConsole: React.FC<GamemakerConsoleProps> = ({
  courts,
  queue,
  activeSession,
  allTributes,
  gamemakerAuth,
  onLogoutGamemaker,
  onDataUpdated,
  onOpenQrModal,
  currentVersion = 'v2',
  onSwitchVersion,
}) => {
  // Score entry state (Arena Results)
  const [scoringCourt, setScoringCourt] = useState<Court | null>(null);
  const [scoreTeam1, setScoreTeam1] = useState<number>(21);
  const [scoreTeam2, setScoreTeam2] = useState<number>(18);
  const [scoreError, setScoreError] = useState<string | null>(null);

  // Manual assignment state
  const [assigningCourtId, setAssigningCourtId] = useState<number | null>(null);
  const [selectedQueuePlayerIds, setSelectedQueuePlayerIds] = useState<string[]>([]);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Pre-Ready Match Staging state
  const [showPreReadyBuilder, setShowPreReadyBuilder] = useState(false);
  const [preReadyT1P1, setPreReadyT1P1] = useState<string>('');
  const [preReadyT1P2, setPreReadyT1P2] = useState<string>('');
  const [preReadyT2P1, setPreReadyT2P1] = useState<string>('');
  const [preReadyT2P2, setPreReadyT2P2] = useState<string>('');
  const [preReadyTargetCourt, setPreReadyTargetCourt] = useState<number | undefined>(undefined);
  const [preReadyMsg, setPreReadyMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [announcerNotice, setAnnouncerNotice] = useState<string | null>(null);

  // Reaping status control
  const [reapingStatus, setReapingStatus] = useState<ReapingQueueStatus>(
    activeSession.reapingStatus || 'open'
  );

  // New session modal state
  const [showNewSessionModal, setShowNewSessionModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Elapsed timer ticker for live matches
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(timer);
  }, []);

  const preReadyMatches = getPreReadyMatches();
  const availableCourts = courts.filter((c) => c.status === 'available');

  const handleCopyLink = () => {
    const url = `${window.location.origin}/?session=${activeSession.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleChangeReapingStatus = (newStatus: ReapingQueueStatus) => {
    setReapingStatus(newStatus);
    setActiveSessionReapingStatus(newStatus);
    onDataUpdated();
  };

  const triggerArenaDeploymentAnnouncement = (courtId: number, playerIds: string[]) => {
    const names = playerIds
      .map((id) => allTributes.find((t) => t.id === id)?.name)
      .filter(Boolean) as string[];
    const courtName = `Arena ${courtId}`;
    setAnnouncerNotice(
      `Announcer called ${courtName}${names.length > 0 ? ` (${names.join(', ')})` : ''} — "May the shots be ever on your favor."`
    );

    const loggedInId = getCurrentPlayer()?.id;
    // If the currently logged-in tribute is in this match, Version1App/Version2App transition watcher
    // triggers the Tribute Arena Assignment voice+modal alert directly without speech collision.
    if (!loggedInId || !playerIds.includes(loggedInId)) {
      announceDeskArenaCallout(courtName, names);
    }
  };

  const handleQuickMatch = (courtId: number) => {
    if (queue.length < 4) {
      setAssignError('The Reaping is strictly Doubles. At least 4 waiting tributes required to deploy to an Arena.');
      return;
    }

    const playerIds = queue.slice(0, 4).map((q) => q.playerId);

    const res = assignPlayersToCourt(courtId, playerIds);
    if (res.success) {
      triggerArenaDeploymentAnnouncement(courtId, playerIds);
      onDataUpdated();
      setAssignError(null);
    } else {
      setAssignError(res.error || 'Failed to assign Arena');
    }
  };

  const handleManualAssign = () => {
    if (!assigningCourtId) return;
    if (selectedQueuePlayerIds.length !== 4) {
      setAssignError('The Reaping is strictly Doubles. Please select exactly 4 tributes.');
      return;
    }

    const assignedIds = [...selectedQueuePlayerIds];
    const targetCourt = assigningCourtId;
    const res = assignPlayersToCourt(targetCourt, assignedIds);
    if (res.success) {
      triggerArenaDeploymentAnnouncement(targetCourt, assignedIds);
      setSelectedQueuePlayerIds([]);
      setAssigningCourtId(null);
      setAssignError(null);
      onDataUpdated();
    } else {
      setAssignError(res.error || 'Failed to assign Arena');
    }
  };

  const handleToggleSelectTribute = (playerId: string) => {
    if (selectedQueuePlayerIds.includes(playerId)) {
      setSelectedQueuePlayerIds(selectedQueuePlayerIds.filter((id) => id !== playerId));
    } else {
      if (selectedQueuePlayerIds.length >= 4) return;
      setSelectedQueuePlayerIds([...selectedQueuePlayerIds, playerId]);
    }
  };

  const handleOpenScoreModal = (court: Court) => {
    setScoringCourt(court);
    setScoreTeam1(21);
    setScoreTeam2(19);
    setScoreError(null);
  };

  const handleConfirmScores = () => {
    if (!scoringCourt) return;
    if (scoreTeam1 === scoreTeam2) {
      setScoreError('Scores cannot be tied. One team must emerge as Victors.');
      return;
    }

    try {
      recordMatchScore(scoringCourt.id, scoreTeam1, scoreTeam2);
      playCannonBoom(); // Iconic Hunger Games Cannon Boom for match finish
      setScoringCourt(null);
      onDataUpdated();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error recording Arena Results';
      setScoreError(msg);
    }
  };

  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) return;
    await createNewSession(newSessionName.trim(), 4);
    setShowNewSessionModal(false);
    setNewSessionName('');
    onDataUpdated();
  };

  // Pre-Ready Pair Creation
  const handleCreatePreReady = () => {
    const selected = [preReadyT1P1, preReadyT1P2, preReadyT2P1, preReadyT2P2];
    const unique = new Set(selected.filter(Boolean));
    if (unique.size !== 4) {
      setPreReadyMsg({
        text: 'Please choose 4 distinct tributes to form the two Doubles pairs.',
        type: 'error',
      });
      return;
    }

    const p1 = allTributes.find((p) => p.id === preReadyT1P1);
    const p2 = allTributes.find((p) => p.id === preReadyT1P2);
    const p3 = allTributes.find((p) => p.id === preReadyT2P1);
    const p4 = allTributes.find((p) => p.id === preReadyT2P2);

    if (!p1 || !p2 || !p3 || !p4) {
      setPreReadyMsg({ text: 'Invalid player selection.', type: 'error' });
      return;
    }

    createPreReadyMatch(activeSession.id, p1, p2, p3, p4, preReadyTargetCourt);
    setPreReadyMsg({
      text: `Tributes pre-readied! ${p1.name} & ${p2.name} vs ${p3.name} & ${p4.name} are now On Deck. They have been alerted to stretch and get ready!`,
      type: 'success',
    });
    setPreReadyT1P1('');
    setPreReadyT1P2('');
    setPreReadyT2P1('');
    setPreReadyT2P2('');
    setShowPreReadyBuilder(false);
    onDataUpdated();
  };

  const handleDeployPreReady = (matchId: string, courtId: number) => {
    const staged = preReadyMatches.find((m) => m.id === matchId);
    const stagedPlayerIds = staged
      ? [
          staged.team1.player1.id,
          staged.team1.player2.id,
          staged.team2.player1.id,
          staged.team2.player2.id,
        ]
      : [];

    const res = deployPreReadyMatchToCourt(matchId, courtId);
    if (res.success) {
      triggerArenaDeploymentAnnouncement(courtId, stagedPlayerIds);
      onDataUpdated();
      setPreReadyMsg({
        text: `Pre-ready match deployed to Arena ${courtId}! Tributes notified: "May the shots be ever on your favor."`,
        type: 'success',
      });
    } else {
      setPreReadyMsg({ text: res.error || 'Failed to deploy match', type: 'error' });
    }
  };

  const handleDeletePreReady = (matchId: string) => {
    deletePreReadyMatch(matchId);
    onDataUpdated();
  };

  // Get eligible tributes for pre-ready builder (from queue first, then all tributes)
  const queueTributes = queue
    .map((q) => allTributes.find((p) => p.id === q.playerId))
    .filter(Boolean) as Player[];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Gamemaker Header */}
      <div className="p-4 sm:p-6 md:p-8 rounded-2xl bg-white dark:bg-[#12141d] border border-stone-200 dark:border-amber-900/60 shadow-sm dark:shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
              Gamemakers Console · Capitol Command
            </span>
          </div>
          <h2 className="font-cinzel text-xl sm:text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-amber-100 mt-1">
            Arena & Match Orchestration
          </h2>
          <p className="text-xs text-stone-500 dark:text-neutral-400 mt-1">
            Session: <strong className="text-amber-700 dark:text-amber-300">{activeSession.name}</strong> · Code:{' '}
            <strong className="text-amber-700 dark:text-amber-300 font-mono">{activeSession.code}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenQrModal}
            className="min-h-[40px] px-3.5 py-2 bg-stone-100 dark:bg-[#1a1c28] hover:bg-stone-200 dark:hover:bg-neutral-800 text-amber-800 dark:text-amber-300 border border-stone-300 dark:border-amber-900/60 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Show QR Code
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="min-h-[40px] px-3.5 py-2 bg-stone-100 dark:bg-[#1a1c28] hover:bg-stone-200 dark:hover:bg-neutral-800 text-stone-800 dark:text-neutral-200 border border-stone-300 dark:border-neutral-700 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copiedLink ? 'Link Copied' : 'Share Link'}
          </button>

          <button
            type="button"
            onClick={() => setShowNewSessionModal(true)}
            className="min-h-[40px] px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-cinzel font-bold text-xs rounded-xl shadow-md hover:from-amber-400 hover:to-amber-500 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            New Session
          </button>

          {onSwitchVersion && (
            <button
              type="button"
              onClick={onSwitchVersion}
              className="min-h-[40px] px-3.5 py-2 bg-stone-100 dark:bg-[#1a1c28] hover:bg-stone-200 dark:hover:bg-neutral-800 text-amber-800 dark:text-amber-300 border border-stone-300 dark:border-amber-900/60 rounded-xl text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Repeat className="w-4 h-4" />
              {currentVersion === 'v2' ? 'Switch to Version 1' : 'Switch to Version 2'}
            </button>
          )}

          <button
            type="button"
            onClick={onLogoutGamemaker}
            title="Lock Gamemakers Console and return to player view"
            aria-label="Lock Gamemakers Console"
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-stone-600 dark:text-neutral-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* The Reaping Status Control */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#101218] border border-stone-200 dark:border-amber-900/40 shadow-sm dark:shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-neutral-300 font-bold">
            The Reaping Queue Status:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleChangeReapingStatus('open')}
            className={`min-h-[40px] px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
              reapingStatus === 'open'
                ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500 font-bold'
                : 'bg-stone-100 dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            ● Reaping is Open
          </button>

          <button
            type="button"
            onClick={() => handleChangeReapingStatus('full')}
            className={`min-h-[40px] px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
              reapingStatus === 'full'
                ? 'bg-amber-50 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500 font-bold'
                : 'bg-stone-100 dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            ● The Arena is Full
          </button>

          <button
            type="button"
            onClick={() => handleChangeReapingStatus('closed')}
            className={`min-h-[40px] px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
              reapingStatus === 'closed'
                ? 'bg-red-50 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-500 font-bold'
                : 'bg-stone-100 dark:bg-neutral-900 border-stone-200 dark:border-neutral-800 text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            ● Reaping has Ended
          </button>
        </div>
      </div>

      {/* Feedback Alert Bar */}
      {preReadyMsg && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium ${
            preReadyMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/60 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-500/60 text-red-700 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {preReadyMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{preReadyMsg.text}</span>
          </div>
          <button
            onClick={() => setPreReadyMsg(null)}
            className="text-xs text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white underline ml-4 font-mono"
          >
            Dismiss
          </button>
        </div>
      )}

      {announcerNotice && (
        <div className="p-4 rounded-xl border bg-amber-50 dark:bg-amber-950/35 border-amber-400 dark:border-amber-500/60 text-amber-900 dark:text-amber-100 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2.5 min-w-0">
            <Volume2 className="w-4 h-4 text-amber-700 dark:text-amber-300 shrink-0" />
            <span>{announcerNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setAnnouncerNotice(null)}
            className="text-xs text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white underline ml-4 font-mono shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {assignError && (
        <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/60 text-xs text-red-700 dark:text-red-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
          <span>{assignError}</span>
        </div>
      )}

      {/* ============================================================ */}
      {/* PRE-READY MATCHES / PAIRING STAGING ZONE (ON DECK) */}
      {/* ============================================================ */}
      <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-amber-50 dark:from-amber-950/30 dark:via-[#151824] dark:to-amber-950/20 border-2 border-amber-400 dark:border-amber-500/70 shadow-md dark:shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-200 dark:border-amber-900/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-black flex items-center justify-center font-bold shadow-md dark:shadow-amber-950/50 shrink-0">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-300 font-bold">
                  Pre-Ready Pairings & Staging (On Deck)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-black">
                  {preReadyMatches.length} Staged
                </span>
              </div>
              <h3 className="font-cinzel text-lg md:text-xl font-black text-stone-900 dark:text-amber-100 mt-0.5">
                Pre-Assign Pairs Ahead of Time
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPreReadyBuilder(!showPreReadyBuilder)}
            className="w-full sm:w-auto min-h-[42px] px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            {showPreReadyBuilder ? 'Close Builder' : '+ Pre-Ready Next Match'}
          </button>
        </div>

        <p className="text-xs text-stone-600 dark:text-neutral-300">
          Pair tributes before putting them into an Arena. Once staged, all 4 tributes receive a live notification that they are <strong className="text-stone-900 dark:text-amber-200">ON DECK</strong> and must get ready for the next available arena.
        </p>

        {/* Pre-Ready Match Creator Form */}
        {showPreReadyBuilder && (
          <div className="p-4 sm:p-5 rounded-xl bg-stone-50 dark:bg-[#0f1118] border border-amber-400 dark:border-amber-500/50 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-cinzel text-sm font-bold text-stone-900 dark:text-amber-200">
                Create Pre-Ready Doubles Match
              </span>
              <span className="text-[11px] font-mono text-stone-500 dark:text-neutral-400">
                Choose 4 Waiting Tributes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pair 1 / Team 1 Selection */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#151824] border border-amber-300 dark:border-amber-900/40 space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold block">
                  Pair 1 · Team 1 (2 Tributes)
                </span>
                <div className="space-y-2">
                  <select
                    value={preReadyT1P1}
                    onChange={(e) => setPreReadyT1P1(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 bg-stone-50 dark:bg-[#0c0e14] border border-stone-300 dark:border-neutral-700 rounded-lg text-xs text-stone-900 dark:text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Pair 1 - Player 1...</option>
                    {queueTributes
                      .filter((p) => p.id === preReadyT1P1 || ![preReadyT1P2, preReadyT2P1, preReadyT2P2].includes(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category} · {CATEGORY_TO_DISTRICT[p.category] || p.district})
                        </option>
                      ))}
                  </select>

                  <select
                    value={preReadyT1P2}
                    onChange={(e) => setPreReadyT1P2(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 bg-stone-50 dark:bg-[#0c0e14] border border-stone-300 dark:border-neutral-700 rounded-lg text-xs text-stone-900 dark:text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Pair 1 - Player 2...</option>
                    {queueTributes
                      .filter((p) => p.id === preReadyT1P2 || ![preReadyT1P1, preReadyT2P1, preReadyT2P2].includes(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category} · {CATEGORY_TO_DISTRICT[p.category] || p.district})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Pair 2 / Team 2 Selection */}
              <div className="p-3.5 rounded-xl bg-white dark:bg-[#151824] border border-stone-200 dark:border-neutral-800 space-y-3">
                <span className="text-xs font-mono uppercase tracking-wider text-stone-500 dark:text-neutral-400 font-bold block">
                  Pair 2 · Team 2 (2 Tributes)
                </span>
                <div className="space-y-2">
                  <select
                    value={preReadyT2P1}
                    onChange={(e) => setPreReadyT2P1(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 bg-stone-50 dark:bg-[#0c0e14] border border-stone-300 dark:border-neutral-700 rounded-lg text-xs text-stone-900 dark:text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Pair 2 - Opponent 1...</option>
                    {queueTributes
                      .filter((p) => p.id === preReadyT2P1 || ![preReadyT1P1, preReadyT1P2, preReadyT2P2].includes(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category} · {CATEGORY_TO_DISTRICT[p.category] || p.district})
                        </option>
                      ))}
                  </select>

                  <select
                    value={preReadyT2P2}
                    onChange={(e) => setPreReadyT2P2(e.target.value)}
                    className="w-full min-h-[42px] px-3 py-2 bg-stone-50 dark:bg-[#0c0e14] border border-stone-300 dark:border-neutral-700 rounded-lg text-xs text-stone-900 dark:text-neutral-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">Select Pair 2 - Opponent 2...</option>
                    {queueTributes
                      .filter((p) => p.id === preReadyT2P2 || ![preReadyT1P1, preReadyT1P2, preReadyT2P1].includes(p.id))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.category} · {CATEGORY_TO_DISTRICT[p.category] || p.district})
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Target Court Selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
                <span className="font-mono text-stone-600 dark:text-neutral-400">Target Arena:</span>
                <select
                  value={preReadyTargetCourt ?? ''}
                  onChange={(e) =>
                    setPreReadyTargetCourt(e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-full sm:w-auto min-h-[42px] px-3 py-2 bg-white dark:bg-[#0c0e14] border border-stone-300 dark:border-neutral-700 rounded-lg text-xs text-amber-800 dark:text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value="">Next Available Arena (Default)</option>
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.status === 'available' ? 'Available Now' : 'In Battle'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPreReadyBuilder(false)}
                  className="min-h-[42px] px-4 py-2 rounded-lg bg-stone-200 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300 hover:text-stone-900 dark:hover:text-white text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreatePreReady}
                  className="min-h-[44px] px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-95"
                >
                  Alert Tributes & Pre-Ready Match
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Pre-Ready Matches List */}
        {preReadyMatches.length === 0 ? (
          <div className="py-6 text-center text-xs text-stone-500 dark:text-neutral-400 font-mono border border-dashed border-stone-300 dark:border-amber-900/40 rounded-xl bg-white dark:bg-[#0e1017]">
            No matches currently pre-readied. Click "+ Pre-Ready Next Match" to prepare pairs in advance.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {preReadyMatches.map((staged, idx) => {
              const targetCourt = staged.targetCourtId
                ? courts.find((c) => c.id === staged.targetCourtId)
                : availableCourts[0];

              return (
                <div
                  key={staged.id}
                  className="p-4 rounded-xl bg-white dark:bg-[#10121a] border border-amber-400 dark:border-amber-500/60 shadow-md dark:shadow-lg space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-amber-400 text-black">
                        #{idx + 1} ON DECK
                      </span>
                      <span className="text-xs text-amber-700 dark:text-amber-300 font-mono font-bold">
                        {staged.targetCourtId ? `Arena ${staged.targetCourtId}` : 'Next Available Arena'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePreReady(staged.id)}
                      className="min-w-[36px] min-h-[36px] flex items-center justify-center text-stone-400 dark:text-neutral-500 hover:text-red-600 dark:hover:text-red-400 p-1 rounded-lg transition-colors"
                      title="Cancel Pre-Ready"
                      aria-label="Cancel Pre-Ready"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Teams Row */}
                  <div className="flex flex-col sm:grid sm:grid-cols-11 items-stretch sm:items-center gap-2 text-xs">
                    {/* Team 1 */}
                    <div className="sm:col-span-5 p-2.5 sm:p-2 rounded-lg bg-stone-50 dark:bg-[#151824] border border-amber-300 dark:border-amber-900/40 space-y-1.5">
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono uppercase font-bold block">
                        Team 1
                      </span>
                      <div className="flex items-center gap-1.5">
                        <TributeAvatar
                          name={staged.team1.player1.name}
                          avatarUrl={resolvePlayerAvatar(staged.team1.player1.id, staged.team1.player1.name, allTributes, staged.team1.player1.avatarUrl)}
                          size="xs"
                        />
                        <span className="font-semibold text-stone-900 dark:text-neutral-100 truncate">
                          {staged.team1.player1.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <TributeAvatar
                          name={staged.team1.player2.name}
                          avatarUrl={resolvePlayerAvatar(staged.team1.player2.id, staged.team1.player2.name, allTributes, staged.team1.player2.avatarUrl)}
                          size="xs"
                        />
                        <span className="font-semibold text-stone-900 dark:text-neutral-100 truncate">
                          {staged.team1.player2.name}
                        </span>
                      </div>
                    </div>

                    {/* VS */}
                    <div className="sm:col-span-1 text-center font-cinzel font-black text-amber-700 dark:text-amber-400 text-[11px] sm:text-xs">
                      VS
                    </div>

                    {/* Team 2 */}
                    <div className="sm:col-span-5 p-2.5 sm:p-2 rounded-lg bg-stone-50 dark:bg-[#151824] border border-stone-200 dark:border-neutral-800 space-y-1.5 sm:text-right">
                      <span className="text-[10px] text-stone-500 dark:text-neutral-400 font-mono uppercase font-bold block">
                        Team 2
                      </span>
                      <div className="flex items-center sm:flex-row-reverse gap-1.5">
                        <TributeAvatar
                          name={staged.team2.player1.name}
                          avatarUrl={resolvePlayerAvatar(staged.team2.player1.id, staged.team2.player1.name, allTributes, staged.team2.player1.avatarUrl)}
                          size="xs"
                        />
                        <span className="font-semibold text-stone-900 dark:text-neutral-100 truncate">
                          {staged.team2.player1.name}
                        </span>
                      </div>
                      <div className="flex items-center sm:flex-row-reverse gap-1.5">
                        <TributeAvatar
                          name={staged.team2.player2.name}
                          avatarUrl={resolvePlayerAvatar(staged.team2.player2.id, staged.team2.player2.name, allTributes, staged.team2.player2.avatarUrl)}
                          size="xs"
                        />
                        <span className="font-semibold text-stone-900 dark:text-neutral-100 truncate">
                          {staged.team2.player2.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Deploy Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-stone-500 dark:text-neutral-400 font-mono">
                      Staged {Math.max(1, Math.round((Date.now() - staged.stagedAt) / 60000))}m ago
                    </span>

                    {targetCourt && targetCourt.status === 'available' ? (
                      <button
                        type="button"
                        onClick={() => handleDeployPreReady(staged.id, targetCourt.id)}
                        className="min-h-[40px] px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-black font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Deploy to {targetCourt.name} Now
                      </button>
                    ) : availableCourts.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-stone-500 dark:text-neutral-400 font-mono">Deploy to:</span>
                        {availableCourts.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleDeployPreReady(staged.id, c.id)}
                            className="min-h-[36px] px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-[11px] rounded-lg"
                          >
                            Arena {c.id}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-700 dark:text-amber-400/90 font-mono">
                        Waiting for next arena to open...
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* THE ARENA (4 Arenas Grid) */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="font-cinzel text-lg font-bold text-stone-900 dark:text-amber-100">
              The Arena · Active Battles ({courts.length} Arenas)
            </h3>
          </div>
          <span className="text-xs text-stone-500 dark:text-neutral-400 font-mono">
            Arena Schedule Overview
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {courts.map((court) => {
            const match = court.currentMatch;
            const isInGame = court.status === 'in_game' && match;
            const elapsedMins = isInGame
              ? Math.max(1, Math.round((Date.now() - match.startTime) / 60000))
              : 0;

            const nextStaged = preReadyMatches[0];

            return (
              <div
                key={court.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isInGame
                    ? 'bg-amber-50/70 dark:bg-[#151824] border-amber-400 dark:border-amber-800/60 shadow-md dark:shadow-lg dark:shadow-amber-950/20'
                    : 'bg-white dark:bg-[#12141c] border-stone-200 dark:border-neutral-800 shadow-sm dark:shadow-none'
                }`}
              >
                <div>
                  {/* Arena Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-neutral-800">
                    <div>
                      <h4 className="font-cinzel text-base font-bold text-stone-900 dark:text-amber-200">
                        {court.name}
                      </h4>
                      <span className="text-[11px] text-stone-500 dark:text-neutral-400 font-mono">Court {court.id}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isInGame ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-mono text-xs">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span>{elapsedMins}m elapsed</span>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-mono text-xs font-semibold">
                          AVAILABLE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arena Body */}
                  <div className="py-4">
                    {isInGame && match ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-white dark:bg-[#101218] border border-stone-200 dark:border-neutral-800/80">
                          {/* Team 1 */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold block">
                              Team 1
                            </span>
                            <div className="flex items-center gap-1.5 font-semibold text-stone-900 dark:text-neutral-100 text-xs">
                              <TributeAvatar
                                name={match.team1.player1.name}
                                avatarUrl={resolvePlayerAvatar(match.team1.player1.id, match.team1.player1.name, allTributes, match.team1.player1.avatarUrl)}
                                size="xs"
                              />
                              <span className="truncate">{match.team1.player1.name}</span>
                            </div>
                            {match.team1.player2 && (
                              <div className="flex items-center gap-1.5 font-semibold text-stone-900 dark:text-neutral-100 text-xs">
                                <TributeAvatar
                                  name={match.team1.player2.name}
                                  avatarUrl={resolvePlayerAvatar(match.team1.player2.id, match.team1.player2.name, allTributes, match.team1.player2.avatarUrl)}
                                  size="xs"
                                />
                                <span className="truncate">{match.team1.player2.name}</span>
                              </div>
                            )}
                          </div>

                          {/* Team 2 */}
                          <div className="sm:text-right space-y-1.5 pt-2 border-t border-stone-200 dark:border-neutral-800/60 sm:pt-0 sm:border-t-0">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 dark:text-neutral-400 font-bold block">
                              Team 2
                            </span>
                            <div className="flex items-center sm:flex-row-reverse gap-1.5 font-semibold text-stone-900 dark:text-neutral-100 text-xs">
                              <TributeAvatar
                                name={match.team2.player1.name}
                                avatarUrl={resolvePlayerAvatar(match.team2.player1.id, match.team2.player1.name, allTributes, match.team2.player1.avatarUrl)}
                                size="xs"
                              />
                              <span className="truncate">{match.team2.player1.name}</span>
                            </div>
                            {match.team2.player2 && (
                              <div className="flex items-center sm:flex-row-reverse gap-1.5 font-semibold text-stone-900 dark:text-neutral-100 text-xs">
                                <TributeAvatar
                                  name={match.team2.player2.name}
                                  avatarUrl={resolvePlayerAvatar(match.team2.player2.id, match.team2.player2.name, allTributes, match.team2.player2.avatarUrl)}
                                  size="xs"
                                />
                                <span className="truncate">{match.team2.player2.name}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-neutral-400 font-mono px-1">
                          <span>Match ID: {match.id.slice(-8)}</span>
                          <span className="text-amber-700 dark:text-amber-300">Doubles Match</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center">
                        <p className="text-xs text-stone-600 dark:text-neutral-400">
                          No active battle on this Arena.
                        </p>
                        <p className="text-[11px] text-stone-500 dark:text-neutral-500 font-mono mt-0.5">
                          Deploy a pre-readied match or quick-match top waiting tributes.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arena Action Buttons */}
                <div className="pt-3 border-t border-stone-200 dark:border-neutral-800/80 flex flex-col gap-2">
                  {isInGame && match ? (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const names = [
                            match.team1.player1.name,
                            match.team1.player2?.name,
                            match.team2.player1.name,
                            match.team2.player2?.name,
                          ].filter(Boolean) as string[];
                          announceDeskArenaCallout(court.name, names);
                          setAnnouncerNotice(
                            `Announcer called ${court.name} (${names.join(', ')}) — "May the shots be ever on your favor."`
                          );
                        }}
                        className="min-h-[44px] py-2.5 px-3.5 bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-amber-800 dark:text-amber-300 border border-stone-300 dark:border-amber-900/50 font-mono font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0"
                        title={`Announce ${court.name} on PA`}
                      >
                        <Volume2 className="w-4 h-4" />
                        Announce
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenScoreModal(court)}
                        className="flex-1 min-h-[44px] py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-cinzel font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                      >
                        <Trophy className="w-4 h-4" />
                        Record Arena Results & Crown Victors
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* If next staged match exists, offer 1-click deploy */}
                      {nextStaged && (
                        <button
                          type="button"
                          onClick={() => handleDeployPreReady(nextStaged.id, court.id)}
                          className="w-full min-h-[44px] py-2 px-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
                          <span>Deploy Staged Match (#1 On Deck) to {court.name}</span>
                        </button>
                      )}

                      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickMatch(court.id)}
                          disabled={queue.length < 4}
                          className={`flex-1 min-h-[42px] py-2 px-3 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                            queue.length >= 4
                              ? 'bg-stone-100 dark:bg-neutral-800 text-amber-800 dark:text-amber-300 hover:bg-stone-200 dark:hover:bg-neutral-700 border border-stone-300 dark:border-amber-900/40 shadow-sm'
                              : 'bg-stone-100 dark:bg-neutral-900 text-stone-400 dark:text-neutral-600 cursor-not-allowed'
                          }`}
                        >
                          <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                          <span>Quick Match Next 4</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAssigningCourtId(court.id);
                            setSelectedQueuePlayerIds([]);
                          }}
                          disabled={queue.length === 0}
                          className="min-h-[42px] py-2 px-4 rounded-xl bg-stone-100 dark:bg-neutral-900 hover:bg-stone-200 dark:hover:bg-neutral-800 text-stone-700 dark:text-neutral-300 border border-stone-300 dark:border-neutral-700 text-xs font-semibold transition-colors"
                        >
                          Manual Pick
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Manual Arena Assignment Tray */}
      {assigningCourtId && (() => {
        const pair1Ids = selectedQueuePlayerIds.slice(0, 2);
        const pair2Ids = selectedQueuePlayerIds.slice(2, 4);
        const currentPhase: 'PAIR 1' | 'PAIR 2' | 'READY' =
          selectedQueuePlayerIds.length < 2
            ? 'PAIR 1'
            : selectedQueuePlayerIds.length < 4
            ? 'PAIR 2'
            : 'READY';

        const getEntryName = (id?: string) =>
          id ? queue.find((q) => q.playerId === id)?.playerName || 'Selected' : null;

        return (
          <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#141724] border-2 border-amber-500 shadow-xl dark:shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold block">
                  Manual Arena Assignment
                </span>
                <h3 className="font-cinzel text-lg font-bold text-stone-900 dark:text-neutral-100">
                  Deploying to Arena {assigningCourtId}
                </h3>
                <p className="text-xs text-stone-500 dark:text-neutral-400 mt-0.5">
                  Select 4 tributes for a Doubles match: First choose Pair 1 (2 tributes), then Pair 2 (2 tributes).
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAssigningCourtId(null);
                  setSelectedQueuePlayerIds([]);
                }}
                className="min-h-[38px] px-2.5 text-xs text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white underline font-mono shrink-0"
              >
                Cancel
              </button>
            </div>

            {/* Small Active Pair Indicator & Pair 1 / Pair 2 Slots Section */}
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-[#0e1018] border border-stone-200 dark:border-amber-900/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-extrabold uppercase tracking-wider ${
                      currentPhase === 'PAIR 1'
                        ? 'bg-amber-500 text-black animate-pulse'
                        : currentPhase === 'PAIR 2'
                        ? 'bg-emerald-500 text-black animate-pulse'
                        : 'bg-amber-100 dark:bg-amber-400/20 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                    }`}
                  >
                    {currentPhase === 'PAIR 1'
                      ? `Choosing for PAIR 1 (${pair1Ids.length}/2)`
                      : currentPhase === 'PAIR 2'
                      ? `Choosing for PAIR 2 (${pair2Ids.length}/2)`
                      : 'PAIR 1 & PAIR 2 Ready'}
                  </span>
                  <span className="text-xs text-stone-600 dark:text-neutral-400 font-mono">
                    {currentPhase === 'PAIR 1'
                      ? 'Pick 2 tributes for Pair 1 below'
                      : currentPhase === 'PAIR 2'
                      ? 'Now pick 2 tributes for Pair 2 below'
                      : 'All 4 slots filled — ready to deploy'}
                  </span>
                </div>
                {selectedQueuePlayerIds.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedQueuePlayerIds([])}
                    className="text-[11px] font-mono text-stone-500 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-300 underline"
                  >
                    Reset Pairs
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* PAIR 1 Preview Box */}
                <div
                  className={`p-3 rounded-xl border transition-all ${
                    currentPhase === 'PAIR 1'
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-500 ring-1 ring-amber-500/50'
                      : 'bg-white dark:bg-[#151824] border-stone-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      PAIR 1 (Team 1)
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 dark:text-neutral-400">
                      {pair1Ids.length} / 2
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1].map((slotIdx) => {
                      const pId = pair1Ids[slotIdx];
                      const pName = getEntryName(pId);
                      return (
                        <div
                          key={slotIdx}
                          className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between border ${
                            pName
                              ? 'bg-amber-100 dark:bg-amber-500/15 border-amber-400 dark:border-amber-500/40 text-amber-900 dark:text-amber-100 font-semibold'
                              : 'bg-stone-100 dark:bg-black/30 border-dashed border-stone-300 dark:border-neutral-700 text-stone-500 dark:text-neutral-500 font-mono'
                          }`}
                        >
                          <span className="truncate">{pName || `Slot ${slotIdx + 1}`}</span>
                          {pId && (
                            <button
                              type="button"
                              onClick={() => handleToggleSelectTribute(pId)}
                              className="ml-1 text-amber-700 dark:text-amber-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold"
                              title="Remove"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PAIR 2 Preview Box */}
                <div
                  className={`p-3 rounded-xl border transition-all ${
                    currentPhase === 'PAIR 2'
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 ring-1 ring-emerald-500/50'
                      : 'bg-white dark:bg-[#151824] border-stone-200 dark:border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      PAIR 2 (Team 2)
                    </span>
                    <span className="text-[10px] font-mono text-stone-500 dark:text-neutral-400">
                      {pair2Ids.length} / 2
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[0, 1].map((slotIdx) => {
                      const pId = pair2Ids[slotIdx];
                      const pName = getEntryName(pId);
                      return (
                        <div
                          key={slotIdx}
                          className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between border ${
                            pName
                              ? 'bg-emerald-100 dark:bg-emerald-500/15 border-emerald-400 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-100 font-semibold'
                              : 'bg-stone-100 dark:bg-black/30 border-dashed border-stone-300 dark:border-neutral-700 text-stone-500 dark:text-neutral-500 font-mono'
                          }`}
                        >
                          <span className="truncate">{pName || `Slot ${slotIdx + 1}`}</span>
                          {pId && (
                            <button
                              type="button"
                              onClick={() => handleToggleSelectTribute(pId)}
                              className="ml-1 text-emerald-700 dark:text-emerald-300 hover:text-stone-900 dark:hover:text-white text-xs font-bold"
                              title="Remove"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              {queue.map((entry) => {
                const selectedIndex = selectedQueuePlayerIds.indexOf(entry.playerId);
                const assignedPair = selectedIndex >= 0 ? (selectedIndex < 2 ? 1 : 2) : null;
                const districtName = CATEGORY_TO_DISTRICT[entry.playerCategory] || entry.playerDistrict;

                return (
                  <button
                    type="button"
                    key={entry.id}
                    onClick={() => handleToggleSelectTribute(entry.playerId)}
                    className={`min-h-[58px] p-3 rounded-xl border text-left transition-all ${
                      assignedPair === 1
                        ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-900 dark:text-amber-200 shadow-md ring-1 ring-amber-500'
                        : assignedPair === 2
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500 text-emerald-900 dark:text-emerald-200 shadow-md ring-1 ring-emerald-500'
                        : 'bg-stone-50 dark:bg-[#181b28] border-stone-200 dark:border-neutral-800 hover:border-stone-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <TributeAvatar
                          name={entry.playerName}
                          avatarUrl={resolvePlayerAvatar(entry.playerId, entry.playerName, allTributes, entry.avatarUrl)}
                          size="xs"
                        />
                        <span className="text-sm font-semibold text-stone-900 dark:text-neutral-100 truncate">
                          {entry.playerName}
                        </span>
                      </div>
                      {assignedPair === 1 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-amber-500 text-black shrink-0">
                          PAIR 1
                        </span>
                      )}
                      {assignedPair === 2 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-emerald-500 text-black shrink-0">
                          PAIR 2
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-neutral-400 mt-1">
                      {entry.playerCategory} · <span className="font-mono text-amber-700 dark:text-amber-400">{districtName}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-amber-700 dark:text-amber-300 font-mono">
                Selected: {selectedQueuePlayerIds.length} / 4 tributes (Doubles)
              </span>
              <button
                type="button"
                onClick={handleManualAssign}
                disabled={selectedQueuePlayerIds.length !== 4}
                className={`w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs uppercase tracking-wider transition-all ${
                  selectedQueuePlayerIds.length === 4
                    ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg cursor-pointer'
                    : 'bg-stone-200 dark:bg-neutral-800 text-stone-500 dark:text-neutral-500 cursor-not-allowed'
                }`}
              >
                Deploy to Arena {assigningCourtId}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Waiting Tributes Table */}
      <div className="p-4 sm:p-6 rounded-2xl bg-white dark:bg-[#12141c] border border-stone-200 dark:border-amber-900/40 shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <h3 className="font-cinzel text-base font-bold text-stone-900 dark:text-amber-100">
              Waiting Tributes ({queue.length})
            </h3>
          </div>
          <span className="text-[11px] sm:text-xs text-stone-500 dark:text-neutral-400 font-mono">
            Official Line
          </span>
        </div>

        {queue.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-500 dark:text-neutral-500">
            No Waiting Tributes. Share the Session QR Code to invite players.
          </div>
        ) : (
          <>
            {/* Mobile Tap-List View (< md) */}
            <div className="md:hidden space-y-2.5">
              {queue.map((entry, idx) => {
                const isPreReady = preReadyMatches.some(
                  (m) =>
                    m.team1.player1.id === entry.playerId ||
                    m.team1.player2.id === entry.playerId ||
                    m.team2.player1.id === entry.playerId ||
                    m.team2.player2.id === entry.playerId
                );

                return (
                  <div
                    key={entry.id}
                    className="p-3 rounded-xl bg-stone-50 dark:bg-[#0e1017] border border-stone-200 dark:border-neutral-800/90 flex items-center justify-between gap-2.5"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono font-bold text-xs text-amber-700 dark:text-amber-400 w-6 shrink-0">
                        #{idx + 1}
                      </span>
                      <TributeAvatar
                        name={entry.playerName}
                        avatarUrl={resolvePlayerAvatar(entry.playerId, entry.playerName, allTributes, entry.avatarUrl)}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-stone-900 dark:text-neutral-100 truncate">
                          {entry.playerName}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-neutral-400 truncate">
                          {entry.playerCategory} · {CATEGORY_TO_DISTRICT[entry.playerCategory] || entry.playerDistrict} · {Math.max(1, Math.round((Date.now() - entry.joinedAt) / 60000))}m
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isPreReady ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-400 text-black uppercase animate-pulse">
                          <Zap className="w-2.5 h-2.5 fill-current" />
                          ON DECK
                        </span>
                      ) : idx < 4 ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 uppercase">
                          Next
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono text-stone-600 dark:text-neutral-400 bg-stone-200 dark:bg-neutral-800 uppercase">
                          Waiting
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (md+) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-stone-200 dark:border-neutral-800 text-stone-500 dark:text-neutral-400 font-mono uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Pos</th>
                    <th className="py-2.5 px-3">Tribute Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Wait Time</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 dark:divide-neutral-800">
                  {queue.map((entry, idx) => {
                    const isPreReady = preReadyMatches.some(
                      (m) =>
                        m.team1.player1.id === entry.playerId ||
                        m.team1.player2.id === entry.playerId ||
                        m.team2.player1.id === entry.playerId ||
                        m.team2.player2.id === entry.playerId
                    );

                    return (
                      <tr key={entry.id} className="hover:bg-stone-50 dark:hover:bg-neutral-800/30 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-700 dark:text-amber-400">#{idx + 1}</td>
                        <td className="py-2.5 px-3 font-semibold text-stone-900 dark:text-neutral-100">
                          <div className="flex items-center gap-2">
                            <TributeAvatar
                              name={entry.playerName}
                              avatarUrl={resolvePlayerAvatar(entry.playerId, entry.playerName, allTributes, entry.avatarUrl)}
                              size="xs"
                            />
                            <span>{entry.playerName}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-amber-700 dark:text-amber-300/90 font-medium">
                          {entry.playerCategory}
                        </td>
                        <td className="py-2.5 px-3 text-stone-700 dark:text-neutral-300 font-mono">
                          {CATEGORY_TO_DISTRICT[entry.playerCategory] || entry.playerDistrict}
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-stone-700 dark:text-neutral-300">
                          {Math.max(1, Math.round((Date.now() - entry.joinedAt) / 60000))}m in queue
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isPreReady ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400 text-black uppercase animate-pulse">
                              <Zap className="w-3 h-3 fill-current" />
                              PRE-READY · ON DECK
                            </span>
                          ) : idx < 4 ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 uppercase">
                              Next in Line
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono text-stone-600 dark:text-neutral-400 bg-stone-200 dark:bg-neutral-800 uppercase">
                              Waiting
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Score Entry Modal - Terminology: Arena Results */}
      {scoringCourt && scoringCourt.currentMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/75 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto bg-white dark:bg-[#12141d] border border-stone-200 dark:border-amber-800/80 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-amber-950/60 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold block">
                  Conclude Arena Battle
                </span>
                <h3 className="font-cinzel text-lg sm:text-xl font-bold text-stone-900 dark:text-amber-100">
                  {scoringCourt.name} · Arena Results
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setScoringCourt(null)}
                className="min-h-[38px] px-2.5 text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
            </div>

            {scoreError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800/80 text-xs text-red-700 dark:text-red-200">
                {scoreError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Team 1 Score Card */}
              <div
                className={`p-4 rounded-xl border text-center space-y-3 ${
                  scoreTeam1 > scoreTeam2
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500'
                    : 'bg-stone-50 dark:bg-[#151724] border-stone-200 dark:border-neutral-800'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 uppercase tracking-widest font-bold">
                    Team 1
                  </span>
                  <div className="font-semibold text-stone-900 dark:text-neutral-100 text-xs mt-0.5 truncate">
                    {scoringCourt.currentMatch.team1.player1.name}
                  </div>
                  {scoringCourt.currentMatch.team1.player2 && (
                    <div className="font-semibold text-stone-900 dark:text-neutral-100 text-xs truncate">
                      {scoringCourt.currentMatch.team1.player2.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 dark:text-neutral-400 font-mono mb-1">
                    Final Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={scoreTeam1}
                    onChange={(e) => setScoreTeam1(parseInt(e.target.value) || 0)}
                    className="w-24 min-h-[48px] text-center py-2 bg-white dark:bg-neutral-900 border border-stone-300 dark:border-neutral-700 rounded-lg text-2xl font-cinzel font-black text-amber-700 dark:text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {scoreTeam1 > scoreTeam2 && (
                  <span className="inline-block text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded uppercase">
                    Victors
                  </span>
                )}
              </div>

              {/* Team 2 Score Card */}
              <div
                className={`p-4 rounded-xl border text-center space-y-3 ${
                  scoreTeam2 > scoreTeam1
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-500'
                    : 'bg-stone-50 dark:bg-[#151724] border-stone-200 dark:border-neutral-800'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono text-stone-500 dark:text-neutral-400 uppercase tracking-widest font-bold">
                    Team 2
                  </span>
                  <div className="font-semibold text-stone-900 dark:text-neutral-100 text-xs mt-0.5 truncate">
                    {scoringCourt.currentMatch.team2.player1.name}
                  </div>
                  {scoringCourt.currentMatch.team2.player2 && (
                    <div className="font-semibold text-stone-900 dark:text-neutral-100 text-xs truncate">
                      {scoringCourt.currentMatch.team2.player2.name}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-stone-500 dark:text-neutral-400 font-mono mb-1">
                    Final Points
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={scoreTeam2}
                    onChange={(e) => setScoreTeam2(parseInt(e.target.value) || 0)}
                    className="w-24 min-h-[48px] text-center py-2 bg-white dark:bg-neutral-900 border border-stone-300 dark:border-neutral-700 rounded-lg text-2xl font-cinzel font-black text-stone-900 dark:text-neutral-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {scoreTeam2 > scoreTeam1 && (
                  <span className="inline-block text-[10px] font-mono font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded uppercase">
                    Victors
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-stone-50 dark:bg-neutral-900 border border-stone-200 dark:border-neutral-800 text-[11px] text-stone-600 dark:text-neutral-400 font-mono leading-relaxed">
              * Recording results triggers the Capitol Cannon Boom and unlocks mandatory post-game Sponsor's Gifts bestowal for all 4 tributes before they may re-enter the queue.
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-2 border-t border-stone-200 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => setScoringCourt(null)}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-stone-700 dark:text-neutral-300 text-xs font-mono transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmScores}
                className="min-h-[44px] w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95"
              >
                Crown Victors & Conclude Battle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Session Creation Modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/75 dark:bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto bg-white dark:bg-[#12141d] border border-stone-200 dark:border-amber-800/80 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-amber-950/60 pb-3">
              <div>
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold block">
                  Capitol Session Registry
                </span>
                <h3 className="font-cinzel text-lg font-bold text-stone-900 dark:text-amber-100">
                  Launch New Queue Session
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowNewSessionModal(false)}
                className="min-h-[38px] px-2.5 text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white text-xs font-mono"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleCreateSessionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-neutral-300 mb-1.5 font-mono">
                  Session Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. The Shuttle Games · Sunday Open Play"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-stone-50 dark:bg-[#0e1017] border border-stone-300 dark:border-neutral-700 rounded-xl text-xs text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <p className="text-[11px] text-stone-500 dark:text-neutral-400 leading-relaxed font-mono">
                A unique QR Code and session code will automatically be generated. Matches from this session will count towards player attendance for the Monthly Leaderboard (3 sessions required).
              </p>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2.5 pt-3 border-t border-stone-200 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowNewSessionModal(false)}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-stone-700 dark:text-neutral-300 text-xs font-mono transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95"
                >
                  Generate QR & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
