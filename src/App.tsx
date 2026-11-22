import React, { useState, useEffect, useRef } from 'react';
import { Zap, Volume2, Sparkles, BellRing } from 'lucide-react';
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
  announcePostGameKudosAlert,
} from './utils/audio';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('queue');

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
  const [preReadyState, setPreReadyState] = useState<{
    isPreReady: boolean;
    match?: PreReadyMatch;
    targetCourtId?: number;
  }>({ isPreReady: false });

  // Track last announced alert IDs so voice-over + vibration fire on state transitions
  const lastPreReadyMatchIdRef = useRef<string | null>(null);
  const lastPendingKudosMatchIdRef = useRef<string | null>(null);

  const checkAndNotifyPlayerTransitions = (
    player: Player | null,
    nextActiveMatch?: CourtMatch,
    nextPendingKudos?: CourtMatch
  ) => {
    if (!player) {
      setPreReadyState({ isPreReady: false });
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

  const activeSessionId = activeSession?.id || 'SHUTTLE-75-QUARTER';
  const activeSessionName = activeSession?.name || 'The Shuttle Games';
  const activeMonth = activeSession?.month || '2026-11';
  const viewingProfilePlayer = viewingProfilePlayerId
    ? allTributes.find((t) => t.id === viewingProfilePlayerId) || null
    : null;

  return (
    <div className="min-h-screen bg-[#0a0b0e] text-[#e6e6e6] flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar Navigation */}
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
      />

      {/* Global Alert Strip for Pre-Ready & Post-Game Kudos (visible on non-queue tabs too) */}
      {currentPlayer && activeTab !== 'queue' && preReadyState.isPreReady && preReadyState.match && !activeMatch && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black px-4 py-2.5 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 fill-current shrink-0 animate-bounce" />
              <span className="font-cinzel uppercase tracking-wide">
                Get Ready, Tribute! You Are Next into{' '}
                {preReadyState.targetCourtId ? `Arena ${preReadyState.targetCourtId}` : 'the Arena'}.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => announcePreReadyAlert(preReadyState.targetCourtId)}
                className="px-2.5 py-1 rounded-lg bg-black/15 hover:bg-black/25 text-black inline-flex items-center gap-1 font-mono text-[11px]"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Alert
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className="px-3 py-1 rounded-lg bg-black text-amber-300 font-cinzel text-[11px]"
              >
                Go to The Reaping
              </button>
            </div>
          </div>
        </div>
      )}

      {currentPlayer && activeTab !== 'queue' && pendingKudosMatch && !activeMatch && (
        <div className="bg-amber-950/90 border-b border-amber-500/60 px-4 py-2.5 shadow-lg">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-amber-100">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="font-cinzel text-amber-300">Match Complete!</strong> Bestow
                Sponsor's Gifts to automatically re-join The Reaping queue.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => announcePostGameKudosAlert()}
                className="p-1.5 rounded-lg bg-black/40 border border-amber-500/40 text-amber-300"
                title="Replay voice & vibration alert"
              >
                <BellRing className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsKudosModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-400 text-black font-cinzel font-bold text-[11px]"
              >
                Bestow Gifts Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
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

      {/* Footer */}
      <footer className="mt-auto border-t border-amber-950/40 bg-[#07080a] py-6 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/the_shuttle_games_logo.png"
              alt="The Shuttle Games"
              className="w-6 h-6 rounded-full border border-amber-500/40 object-contain"
            />
            <span className="font-cinzel text-amber-500 font-bold tracking-widest text-xs">
              THE SHUTTLE GAMES BADMINTON CLUB
            </span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <span>Est. The 74th Hunger Games</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-amber-500/70 font-mono italic">
              "May the odds be ever in your favor."
            </span>
            <span aria-hidden="true" className="text-neutral-700">·</span>
            <button
              onClick={() => setIsGamemakerAuthModalOpen(true)}
              className="text-neutral-400 hover:text-amber-300 font-mono transition-colors"
            >
              {gamemakerAuth.isAuthorized ? `Organizer: ${gamemakerAuth.gamemakerName}` : 'Gamemaker Portal'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
