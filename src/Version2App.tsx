import React, { useState, useEffect, useRef } from 'react';
import { Volume2, BellRing, Swords } from 'lucide-react';
import { HeaderV2, AppTabV2 } from './components/v2/HeaderV2';
import { ReapingV2 } from './components/v2/ReapingV2';
import { VictorsV2 } from './components/v2/VictorsV2';
import { MyGamesV2 } from './components/v2/MyGamesV2';
import { GamemakerConsole } from './components/GamemakerConsole';
import { TributeLoginModal } from './components/TributeLoginModal';
import { TributeProfileModal } from './components/TributeProfileModal';
import { SponsorGiftModal } from './components/SponsorGiftModal';
import { SessionQrModal } from './components/SessionQrModal';
import { GamemakerAuthModal } from './components/GamemakerAuthModal';
import { ArenaAssignmentModal } from './components/ArenaAssignmentModal';
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
  setActiveSessionId,
  getGamemakerAuth,
  setGamemakerAuth,
} from './utils/storage';
import {
  isSoundEnabled,
  setSoundEnabled,
  announcePreReadyAlert,
  announceArenaAssignmentAlert,
  announcePostGameKudosAlert,
} from './utils/audio';

interface Version2AppProps {
  onSwitchToV1?: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Version2App: React.FC<Version2AppProps> = ({
  onSwitchToV1,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [activeTab, setActiveTab] = useState<AppTabV2>('queue');

  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [allTributes, setAllTributes] = useState<Player[]>([]);
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [sessions, setSessions] = useState<QueueSession[]>([]);
  const [activeSession, setActiveSession] = useState<QueueSession | null>(null);

  // Gamemaker Authorization State (organizer-only console)
  const [gamemakerAuth, setGamemakerAuthLocal] = useState<GamemakerAuth>({
    isAuthorized: false,
    gamemakerName: '',
  });

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

      // Check if URL has session query parameter
      const params = new URLSearchParams(window.location.search);
      const urlSession = params.get('session');
      if (urlSession) {
        setActiveSessionId(urlSession);
      }

      refreshData();
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

  const handleViewProfile = (player: Player) => {
    setViewingProfilePlayerId(player.id);
  };

  const handleSelectTributeFromProfile = (player: Player) => {
    setCurrentPlayer(player);
    setActiveTab('mygames');
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

  const activeSessionId = activeSession?.id || sessions[0]?.id || 'SHUTTLE-75-QUARTER';
  const activeSessionName = activeSession?.name || 'The Shuttle Games';
  const activeMonth = activeSession?.month || '2026-11';
  const viewingProfilePlayer = viewingProfilePlayerId
    ? allTributes.find((t) => t.id === viewingProfilePlayerId) || null
    : null;

  return (
    <div className="min-h-screen bg-[#f6f4ef] dark:bg-[#090a0d] text-stone-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-200 overflow-x-clip transition-colors duration-200">
      {/* Minimalist Top Bar & Mobile Thumb-Zone Bottom Navigation */}
      <HeaderV2
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

      {/* Main Content Container (pb-24 keeps content clear of 56px mobile bottom nav) */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3.5 sm:px-6 pt-4 pb-24 md:py-8 space-y-5">
        {/* Global Alert Strips on non-Reaping tabs (non-sticky so sticky chrome stays <=15%) */}
        {currentPlayer && activeTab !== 'queue' && activeMatch && (
          <div className="rounded-xl bg-amber-400 text-black px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 shadow-sm">
            <div className="min-w-0 flex items-center gap-2">
              <Swords className="w-4 h-4 shrink-0" />
              <p className="font-cinzel font-bold text-xs uppercase tracking-wide">
                Tribute, please go to {activeMatch.courtName}. &ldquo;May the shots be ever on your favor.&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => announceArenaAssignmentAlert(activeMatch.courtName)}
                className="min-h-[38px] px-2.5 rounded-lg bg-black/15 hover:bg-black/25 text-black inline-flex items-center gap-1 font-mono text-[11px] font-semibold"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Announcer
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className="min-h-[38px] px-3 rounded-lg bg-black text-amber-300 font-cinzel font-bold text-[11px]"
              >
                {activeMatch.courtName}
              </button>
            </div>
          </div>
        )}

        {currentPlayer && activeTab !== 'queue' && preReadyState.isPreReady && preReadyState.match && !activeMatch && (
          <div className="rounded-xl bg-amber-400 text-black px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="min-w-0">
              <p className="font-cinzel font-bold text-xs uppercase tracking-wide">
                Get Ready, Tribute! Next into{' '}
                {preReadyState.targetCourtId ? `Arena ${preReadyState.targetCourtId}` : 'the Arena'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => announcePreReadyAlert(preReadyState.targetCourtId)}
                className="min-h-[38px] px-2.5 rounded-lg bg-black/15 hover:bg-black/25 text-black inline-flex items-center gap-1 font-mono text-[11px] font-semibold"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Alert
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className="min-h-[38px] px-3 rounded-lg bg-black text-amber-300 font-cinzel font-bold text-[11px]"
              >
                The Reaping
              </button>
            </div>
          </div>
        )}

        {currentPlayer && activeTab !== 'queue' && pendingKudosMatch && !activeMatch && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/[0.08] border border-amber-300 dark:border-amber-500/35 px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
            <div className="text-xs text-stone-800 dark:text-amber-100">
              <span className="font-cinzel font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
                Match Complete
              </span>
              <span className="text-stone-600 dark:text-neutral-300"> · Bestow Sponsor's Gifts to auto re-join.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => announcePostGameKudosAlert()}
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-white dark:bg-white/[0.05] border border-amber-300 dark:border-white/[0.1] text-amber-700 dark:text-amber-300"
                title="Replay voice & vibration alert"
              >
                <BellRing className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsKudosModalOpen(true)}
                className="min-h-[38px] px-3 rounded-lg bg-amber-400 text-black font-cinzel font-bold text-[11px]"
              >
                Bestow Gifts
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: The Reaping (Minimalist Queue & Arena View) */}
        {activeTab === 'queue' && (
          <ReapingV2
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

        {/* Tab 2: Hall of Victors */}
        {activeTab === 'victors' && (
          <VictorsV2
            tributes={allTributes}
            onViewProfile={handleViewProfile}
            activeMonth={activeMonth}
          />
        )}

        {/* Tab 3: My Games & Integrated Sponsor's Gift Vault */}
        {activeTab === 'mygames' && (
          <MyGamesV2
            currentPlayer={currentPlayer}
            tributes={allTributes}
            activeSessionId={activeSessionId}
            activeSessionName={activeSessionName}
            activeMonth={activeMonth}
            onOpenPlayerModal={() => setIsPlayerModalOpen(true)}
            onViewProfile={handleViewProfile}
          />
        )}

        {/* Tab 4: Gamemakers Console (Authorized Organizers Only) */}
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
      />

      <TributeProfileModal
        isOpen={Boolean(viewingProfilePlayer)}
        player={viewingProfilePlayer}
        currentPlayerId={currentPlayer?.id}
        onClose={() => setViewingProfilePlayerId(null)}
        onProfileUpdated={refreshData}
        onViewMyGames={(p) => handleSelectTributeFromProfile(p)}
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

      {/* Minimalist Footer (cleared cleanly on mobile above the 56px bottom nav) */}
      <footer className="mt-auto border-t border-stone-200 dark:border-white/[0.06] bg-white dark:bg-[#07080a] pt-5 pb-20 md:pb-6 text-xs text-stone-600 dark:text-neutral-500 transition-colors">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/the_shuttle_games_logo.png"
              alt="The Shuttle Games"
              className="w-5 h-5 rounded-full border border-amber-500/50 object-contain"
            />
            <span className="font-cinzel text-amber-700 dark:text-amber-500/90 font-bold tracking-[0.14em] text-[11px] uppercase">
              The Shuttle Games · Version 2
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px]">
            <button
              type="button"
              onClick={() => setIsGamemakerAuthModalOpen(true)}
              className="min-h-[36px] px-2 text-stone-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-300 font-mono transition-colors"
            >
              {gamemakerAuth.isAuthorized
                ? `Gamemaker: ${gamemakerAuth.gamemakerName}`
                : 'Gamemaker Portal'}
            </button>
            {onSwitchToV1 && (
              <>
                <span aria-hidden="true" className="text-stone-300 dark:text-neutral-700">·</span>
                <button
                  type="button"
                  onClick={onSwitchToV1}
                  className="min-h-[36px] px-2 text-stone-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-300 font-mono transition-colors"
                >
                  Switch to Version 1
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
