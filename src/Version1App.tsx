import React, { useState, useEffect, useRef } from 'react';
import { Zap, Volume2, Sparkles, BellRing, Swords } from 'lucide-react';
import { Header, AppTab } from './components/Header';
import { TributeQueueView } from './components/TributeQueueView';
import { GamemakerConsole } from './components/GamemakerConsole';
import { VictorsLeaderboard } from './components/VictorsLeaderboard';
import { MyGamesOverview } from './components/MyGamesOverview';
import { TributeLoginModal } from './components/TributeLoginModal';
import { TributeProfileModal } from './components/TributeProfileModal';
import { SponsorGiftModal } from './components/SponsorGiftModal';
import { SessionQrModal } from './components/SessionQrModal';
import { GamemakerAuthModal } from './components/GamemakerAuthModal';
import { ArenaAssignmentModal } from './components/ArenaAssignmentModal';
import { LandingGate } from './components/LandingGate';
import { SessionGateView } from './components/SessionGateView';
import {
  Court,
  CourtMatch,
  GamemakerAuth,
  Player,
  PreReadyMatch,
  QueueEntry,
  QueueSession,
} from './types';
import {
  initializeStorage,
  getTributes,
  getCurrentPlayer,
  getQueue,
  getCourts,
  getSessions,
  getActiveSessionId,
  getPlayerMatchStatus,
  getPlayerPreReadyInfo,
  getGamemakerAuth,
  setGamemakerAuth,
  getEnteredReapingSessionId,
  signOutCurrentPlayer,
  resolveAndEnterSessionByCodeOrQr,
} from './utils/storage';
import {
  isSoundEnabled,
  setSoundEnabled,
  announcePreReadyAlert,
  announceArenaAssignmentAlert,
  announcePostGameKudosAlert,
} from './utils/audio';

interface Version1AppProps {
  initialTab?: AppTab;
  onSwitchToV2?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Version1App: React.FC<Version1AppProps> = ({
  initialTab = 'queue',
  onSwitchToV2,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState<AppTab>(initialTab);

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [allTributes, setAllTributes] = useState<Player[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [sessions, setSessions] = useState<QueueSession[]>([]);
  const [activeSession, setActiveSession] = useState<QueueSession | null>(null);

  // Gamemaker Authorization State (organizer-only console)
  const [gamemakerAuth, setGamemakerAuthLocal] = useState<GamemakerAuth>(() => getGamemakerAuth());
  const [isStorageReady, setIsStorageReady] = useState(false);
  const [enteredSessionId, setEnteredSessionId] = useState<string | null>(() =>
    getEnteredReapingSessionId()
  );
  const [pendingUrlSessionId, setPendingUrlSessionId] = useState<string | null>(null);

  // Modals
  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [viewingProfilePlayerId, setViewingProfilePlayerId] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isKudosModalOpen, setIsKudosModalOpen] = useState(false);
  const [isGamemakerAuthModalOpen, setIsGamemakerAuthModalOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(() => isSoundEnabled());

  // Active, pre-ready, or pending kudos match for current player
  const [activeMatch, setActiveMatch] = useState<CourtMatch | undefined>(undefined);
  const [pendingKudosMatch, setPendingKudosMatch] = useState<CourtMatch | undefined>(undefined);
  const [arenaNoticeMatch, setArenaNoticeMatch] = useState<CourtMatch | null>(null);
  const [preReadyState, setPreReadyState] = useState<{
    isPreReady: boolean;
    match?: PreReadyMatch;
    targetCourtId?: number;
  }>({ isPreReady: false });

  // Track last announced alert IDs so voice-over + vibration fire on state transitions
  const hasInitializedTransitionsRef = useRef(false);
  const lastActiveMatchIdRef = useRef<string | null>(null);
  const lastPreReadyMatchIdRef = useRef<string | null>(null);
  const lastPendingKudosMatchIdRef = useRef<string | null>(null);

  const checkAndNotifyPlayerTransitions = (
    player: Player | null,
    nextActiveMatch?: CourtMatch,
    nextPendingKudos?: CourtMatch
  ) => {
    if (!player) {
      setPreReadyState({ isPreReady: false });
      setArenaNoticeMatch(null);
      lastActiveMatchIdRef.current = null;
      lastPreReadyMatchIdRef.current = null;
      lastPendingKudosMatchIdRef.current = null;
      return;
    }

    const preReady = getPlayerPreReadyInfo(player.id);
    setPreReadyState({
      isPreReady: preReady.isPreReady,
      match: preReady.match,
      targetCourtId: preReady.targetCourtId,
    });

    if (!hasInitializedTransitionsRef.current) {
      hasInitializedTransitionsRef.current = true;
      lastActiveMatchIdRef.current = nextActiveMatch?.id ?? null;
      lastPreReadyMatchIdRef.current =
        preReady.isPreReady && preReady.match && !nextActiveMatch ? preReady.match.id : null;
      lastPendingKudosMatchIdRef.current =
        nextPendingKudos && !nextActiveMatch ? nextPendingKudos.id : null;
      return;
    }

    // Trigger Arena Assignment modal + voice announcer + vibration when newly assigned to an Arena
    if (nextActiveMatch) {
      if (lastActiveMatchIdRef.current !== nextActiveMatch.id) {
        lastActiveMatchIdRef.current = nextActiveMatch.id;
        setArenaNoticeMatch(nextActiveMatch);
        announceArenaAssignmentAlert(nextActiveMatch.courtName);
      }
    } else {
      lastActiveMatchIdRef.current = null;
      setArenaNoticeMatch(null);
    }

    // Trigger voice-over + vibration alarm when pre-ready notification appears
    if (preReady.isPreReady && preReady.match && !nextActiveMatch) {
      if (lastPreReadyMatchIdRef.current !== preReady.match.id) {
        lastPreReadyMatchIdRef.current = preReady.match.id;
        announcePreReadyAlert(preReady.targetCourtId);
      }
    } else {
      lastPreReadyMatchIdRef.current = null;
    }

    // Trigger chime + voice-over + vibration alarm when post-game kudos notification appears
    if (nextPendingKudos && !nextActiveMatch) {
      if (lastPendingKudosMatchIdRef.current !== nextPendingKudos.id) {
        lastPendingKudosMatchIdRef.current = nextPendingKudos.id;
        announcePostGameKudosAlert();
      }
    } else {
      lastPendingKudosMatchIdRef.current = null;
    }
  };

  // Initialize data on load
  const refreshData = () => {
    const tributes = getTributes();
    const currPlayer = getCurrentPlayer();
    const q = getQueue();
    const c = getCourts();
    const s = getSessions();
    const activeId = getActiveSessionId();
    const activeSess = s.find((sess) => sess.id === activeId) || s[0] || null;
    const auth = getGamemakerAuth();

    setAllTributes(tributes);
    setCurrentPlayer(currPlayer);
    setQueue(q);
    setCourts(c);
    setSessions(s);
    setActiveSession(activeSess);
    setGamemakerAuthLocal(auth);
    setEnteredSessionId(getEnteredReapingSessionId());

    if (currPlayer) {
      const status = getPlayerMatchStatus(currPlayer.id);
      setActiveMatch(status.activeMatch);
      setPendingKudosMatch(status.pendingKudosMatch);
      checkAndNotifyPlayerTransitions(currPlayer, status.activeMatch, status.pendingKudosMatch);
    } else {
      setActiveMatch(undefined);
      setPendingKudosMatch(undefined);
      checkAndNotifyPlayerTransitions(null);
    }
  };

  useEffect(() => {
    const init = async () => {
      await initializeStorage();

      // Check if URL has session query parameter (e.g. phone camera scanned QR)
      const params = new URLSearchParams(window.location.search);
      const urlSession = params.get('session');
      if (urlSession) {
        setPendingUrlSessionId(urlSession);
        const existingPlayer = getCurrentPlayer();
        if (existingPlayer) {
          resolveAndEnterSessionByCodeOrQr(urlSession, existingPlayer.id);
        }
      }

      refreshData();
      setIsStorageReady(true);
    };

    init();
  }, []);

  // Poll local state periodically so changes reflect instantly
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Re-check player status when currentPlayer changes
  useEffect(() => {
    if (currentPlayer) {
      const status = getPlayerMatchStatus(currentPlayer.id);
      setActiveMatch(status.activeMatch);
      setPendingKudosMatch(status.pendingKudosMatch);
      checkAndNotifyPlayerTransitions(currentPlayer, status.activeMatch, status.pendingKudosMatch);
    }
  }, [currentPlayer?.id]);

  // Security guard: If user is on 'gamemaker' tab without authorization, redirect to 'queue'
  useEffect(() => {
    if (activeTab === 'gamemaker' && !gamemakerAuth.isAuthorized) {
      setActiveTab('queue');
    }
  }, [activeTab, gamemakerAuth.isAuthorized]);

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundEnabled(next);
    setSoundActive(next);
  };

  const handleSelectTributeFromLeaderboard = (player: Player) => {
    setCurrentPlayer(player);
    setActiveTab('mygames');
  };

  const handleViewProfile = (player: Player) => {
    setViewingProfilePlayerId(player.id);
  };

  const handleGiftsSubmitted = () => {
    setIsKudosModalOpen(false);
    refreshData();
    setActiveTab('queue');
  };

  const handleGamemakerLogin = (name: string) => {
    const auth = { isAuthorized: true, gamemakerName: name };
    setGamemakerAuth(auth);
    setGamemakerAuthLocal(auth);
    setActiveTab('gamemaker');
  };

  const handleGamemakerLogout = () => {
    const auth = { isAuthorized: false, gamemakerName: '' };
    setGamemakerAuth(auth);
    setGamemakerAuthLocal(auth);
    setActiveTab('queue');
  };

  const handleLandingAuthenticated = (player: Player) => {
    setCurrentPlayer(player);
    if (pendingUrlSessionId) {
      const res = resolveAndEnterSessionByCodeOrQr(pendingUrlSessionId, player.id);
      if (res.success && res.session) {
        setEnteredSessionId(res.session.id);
        setPendingUrlSessionId(null);
        setActiveTab('queue');
      }
    }
    refreshData();
  };

  const handleSessionEntered = (sess: QueueSession) => {
    setEnteredSessionId(sess.id);
    setPendingUrlSessionId(null);
    setActiveTab('queue');
    refreshData();
  };

  const handleSignOut = () => {
    signOutCurrentPlayer();
    setCurrentPlayer(null);
    setEnteredSessionId(null);
    setIsPlayerModalOpen(false);
    refreshData();
  };

  const activeSessionId = activeSession?.id || 'SHUTTLE-75-QUARTER';
  const activeSessionName = activeSession?.name || 'The Shuttle Games';
  const activeMonth = activeSession?.month || '2026-11';
  const viewingProfilePlayer = viewingProfilePlayerId
    ? allTributes.find((t) => t.id === viewingProfilePlayerId) || null
    : null;

  if (!isStorageReady) {
    return <div className="min-h-screen bg-[#f6f4ef] dark:bg-[#0a0b0e]" />;
  }

  // Step 1: Landing Page for Sign In / Sign Up (unless Gamemaker is signed in)
  if (!gamemakerAuth.isAuthorized && !currentPlayer) {
    return (
      <>
        <LandingGate
          tributes={allTributes}
          pendingQrSessionId={pendingUrlSessionId}
          onAuthenticated={handleLandingAuthenticated}
          onOpenGamemakerAuthModal={() => setIsGamemakerAuthModalOpen(true)}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
        <GamemakerAuthModal
          isOpen={isGamemakerAuthModalOpen}
          onClose={() => setIsGamemakerAuthModalOpen(false)}
          gamemakerAuth={gamemakerAuth}
          onLogin={handleGamemakerLogin}
          onLogout={handleGamemakerLogout}
        />
      </>
    );
  }

  // Step 2: Scan QR Code or Enter Game Code before entering The Reaping
  if (!gamemakerAuth.isAuthorized && currentPlayer && !enteredSessionId) {
    return (
      <>
        <SessionGateView
          currentPlayer={currentPlayer}
          onSessionEntered={handleSessionEntered}
          onSignOut={handleSignOut}
          onOpenGamemakerAuthModal={() => setIsGamemakerAuthModalOpen(true)}
          theme={theme}
          onToggleTheme={onToggleTheme}
        />
        <GamemakerAuthModal
          isOpen={isGamemakerAuthModalOpen}
          onClose={() => setIsGamemakerAuthModalOpen(false)}
          gamemakerAuth={gamemakerAuth}
          onLogin={handleGamemakerLogin}
          onLogout={handleGamemakerLogout}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f4ef] dark:bg-[#0a0b0e] text-stone-900 dark:text-[#e6e6e6] flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200 overflow-x-clip transition-colors duration-200">
      {/* Top Bar Navigation & Mobile Bottom Tab Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentPlayer={currentPlayer}
        onOpenPlayerModal={() => setIsPlayerModalOpen(true)}
        onOpenCurrentProfile={() => currentPlayer && handleViewProfile(currentPlayer)}
        gamemakerAuth={gamemakerAuth}
        onOpenGamemakerAuthModal={() => setIsGamemakerAuthModalOpen(true)}
        soundState={soundActive}
        onToggleSound={handleToggleSound}
        pendingKudosCount={pendingKudosMatch ? 1 : 0}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      {/* Global Alert Strip for Arena Assignment, Pre-Ready & Post-Game Kudos (visible on non-queue tabs too) */}
      {currentPlayer && activeTab !== 'queue' && activeMatch && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black px-3 sm:px-4 py-2.5 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-2 min-w-0">
              <Swords className="w-4 h-4 shrink-0 animate-bounce" />
              <span className="font-cinzel uppercase tracking-wide">
                Tribute, please go to {activeMatch.courtName}. &ldquo;May the shots be ever on your favor.&rdquo;
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => announceArenaAssignmentAlert(activeMatch.courtName)}
                className="min-h-[38px] px-3 py-1 rounded-lg bg-black/15 hover:bg-black/25 text-black inline-flex items-center gap-1 font-mono text-[11px]"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Announcer
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className="min-h-[38px] px-3 py-1 rounded-lg bg-black text-amber-300 font-cinzel text-[11px]"
              >
                Go to {activeMatch.courtName}
              </button>
            </div>
          </div>
        </div>
      )}

      {currentPlayer && activeTab !== 'queue' && preReadyState.isPreReady && preReadyState.match && !activeMatch && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black px-3 sm:px-4 py-2.5 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-2 min-w-0">
              <Zap className="w-4 h-4 fill-current shrink-0 animate-bounce" />
              <span className="font-cinzel uppercase tracking-wide">
                Get Ready, Tribute! You Are Next into{' '}
                {preReadyState.targetCourtId ? `Arena ${preReadyState.targetCourtId}` : 'the Arena'}.
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => announcePreReadyAlert(preReadyState.targetCourtId)}
                className="min-h-[38px] px-3 py-1 rounded-lg bg-black/15 hover:bg-black/25 text-black inline-flex items-center gap-1 font-mono text-[11px]"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Alert
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className="min-h-[38px] px-3 py-1 rounded-lg bg-black text-amber-300 font-cinzel text-[11px]"
              >
                Go to The Reaping
              </button>
            </div>
          </div>
        </div>
      )}

      {currentPlayer && activeTab !== 'queue' && pendingKudosMatch && !activeMatch && (
        <div className="bg-amber-50 dark:bg-amber-950/90 border-b border-amber-300 dark:border-amber-500/60 px-3 sm:px-4 py-2.5 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-stone-800 dark:text-amber-100 min-w-0">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong className="font-cinzel text-amber-800 dark:text-amber-300">Match Complete!</strong> Bestow
                Sponsor's Gifts to automatically re-join The Reaping queue.
              </span>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => announcePostGameKudosAlert()}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-white dark:bg-black/40 border border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300"
                title="Replay voice & vibration alert"
              >
                <BellRing className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsKudosModalOpen(true)}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-amber-400 text-black font-cinzel font-bold text-[11px]"
              >
                Bestow Gifts Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area (pb-24 clears mobile bottom nav) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-24 md:py-8">
        {/* Strictly: The Reaping */}
        {activeTab === 'queue' && (
          <TributeQueueView
            currentPlayer={currentPlayer}
            tributes={allTributes}
            queue={queue}
            courts={courts}
            activeMatch={activeMatch}
            pendingKudosMatch={pendingKudosMatch}
            onOpenKudosModal={() => setIsKudosModalOpen(true)}
            onOpenPlayerModal={() => setIsPlayerModalOpen(true)}
            onViewProfile={handleViewProfile}
            onQueueUpdated={refreshData}
            activeSessionName={activeSessionName}
            reapingStatus={activeSession?.reapingStatus || 'open'}
          />
        )}

        {/* Gamemakers Console: ONLY visible & accessible to authorized organizers/gamemakers */}
        {activeTab === 'gamemaker' && activeSession && gamemakerAuth.isAuthorized && (
          <GamemakerConsole
            courts={courts}
            queue={queue}
            activeSession={activeSession}
            allTributes={allTributes}
            gamemakerAuth={gamemakerAuth}
            onLogoutGamemaker={handleGamemakerLogout}
            onDataUpdated={refreshData}
            onOpenQrModal={() => setIsQrModalOpen(true)}
            currentVersion="v1"
            onSwitchVersion={onSwitchToV2}
          />
        )}

        {activeTab === 'victors' && (
          <VictorsLeaderboard
            tributes={allTributes}
            onSelectTribute={handleSelectTributeFromLeaderboard}
            onViewProfile={handleViewProfile}
            activeMonth={activeMonth}
          />
        )}

        {activeTab === 'mygames' && (
          <MyGamesOverview
            currentPlayer={currentPlayer}
            tributes={allTributes}
            activeSessionId={activeSessionId}
            activeSessionName={activeSessionName}
            activeMonth={activeMonth}
            onOpenPlayerModal={() => setIsPlayerModalOpen(true)}
            onViewProfile={handleViewProfile}
          />
        )}
      </main>

      {/* Modals */}
      <TributeLoginModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        currentPlayer={currentPlayer}
        onSelectPlayer={(p) => {
          setCurrentPlayer(p);
          refreshData();
        }}
        onViewProfile={handleViewProfile}
        onSignOut={handleSignOut}
      />

      <TributeProfileModal
        isOpen={Boolean(viewingProfilePlayer)}
        player={viewingProfilePlayer}
        currentPlayerId={currentPlayer?.id}
        onClose={() => setViewingProfilePlayerId(null)}
        onProfileUpdated={refreshData}
        onViewMyGames={(p) => handleSelectTributeFromLeaderboard(p)}
      />

      <GamemakerAuthModal
        isOpen={isGamemakerAuthModalOpen}
        onClose={() => setIsGamemakerAuthModalOpen(false)}
        gamemakerAuth={gamemakerAuth}
        onLogin={handleGamemakerLogin}
        onLogout={handleGamemakerLogout}
      />

      {pendingKudosMatch && currentPlayer && (
        <SponsorGiftModal
          isOpen={isKudosModalOpen}
          match={pendingKudosMatch}
          currentPlayer={currentPlayer}
          onGiftsSubmitted={handleGiftsSubmitted}
        />
      )}

      {activeSession && (
        <SessionQrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          activeSession={activeSession}
          onSelectSession={(sess) => {
            setActiveSession(sess);
            refreshData();
          }}
        />
      )}

      {currentPlayer && (
        <ArenaAssignmentModal
          isOpen={Boolean(arenaNoticeMatch)}
          match={arenaNoticeMatch}
          currentPlayer={currentPlayer}
          allTributes={allTributes}
          onClose={() => setArenaNoticeMatch(null)}
          onGoToArena={() => setActiveTab('queue')}
        />
      )}

      {/* Footer (cleared cleanly on mobile above the bottom nav) */}
      <footer className="mt-auto border-t border-stone-200 dark:border-amber-950/40 bg-white dark:bg-[#07080a] pt-5 pb-20 md:pb-6 text-xs text-stone-600 dark:text-neutral-500 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <img
              src="/the_shuttle_games_logo.png"
              alt="The Shuttle Games"
              className="w-6 h-6 rounded-full border border-amber-500/50 object-contain"
            />
            <span className="font-cinzel text-amber-700 dark:text-amber-500 font-bold tracking-widest text-[11px] sm:text-xs">
              THE SHUTTLE GAMES · VERSION 1
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => setIsGamemakerAuthModalOpen(true)}
              className="min-h-[36px] px-2 text-stone-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-300 font-mono transition-colors"
            >
              {gamemakerAuth.isAuthorized ? `Organizer: ${gamemakerAuth.gamemakerName}` : 'Gamemaker Portal'}
            </button>
            {currentPlayer && (
              <>
                <span aria-hidden="true" className="text-stone-300 dark:text-neutral-700">·</span>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="min-h-[36px] px-2 text-stone-600 dark:text-neutral-400 hover:text-red-700 dark:hover:text-red-300 font-mono transition-colors"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
