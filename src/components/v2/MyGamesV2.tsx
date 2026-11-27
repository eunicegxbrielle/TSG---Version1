import React, { useState } from 'react';
import { Camera, Search, X } from 'lucide-react';
import { CourtMatch, Player, PlayerStats, TECHNICAL_SKILLS } from '../../types';
import {
  getMatchHistory,
  getSessions,
  getPlayerCurrentReapingStats,
  getPlayerCurrentReapingGifts,
  getPlayerMonthlyStats,
  getPlayerMonthlyGifts,
} from '../../utils/storage';
import { TributeAvatar, resolvePlayerAvatar } from '../TributeAvatar';

interface MyGamesV2Props {
  currentPlayer: Player | null;
  tributes: Player[];
  activeSessionId: string;
  activeSessionName: string;
  activeMonth: string;
  onOpenPlayerModal: () => void;
  onViewProfile: (player: Player) => void;
}

interface GiftItem {
  name: string;
  count: number;
  category: 'Technical' | 'Character';
}

function formatMonthLabel(monthStr: string): string {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = Number(yearStr);
  const monthIdx = Number(monthNumStr) - 1;
  if (!Number.isNaN(year) && !Number.isNaN(monthIdx) && monthIdx >= 0 && monthIdx < 12) {
    return new Date(year, monthIdx, 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  }
  return monthStr;
}

function buildSortedGifts(raw: Record<string, number>): GiftItem[] {
  return Object.entries(raw || {})
    .filter(([_, count]) => typeof count === 'number' && count > 0)
    .map(([name, count]) => ({
      name,
      count: Number(count),
      category: ((TECHNICAL_SKILLS as readonly string[]).includes(name)
        ? 'Technical'
        : 'Character') as 'Technical' | 'Character',
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

const MinimalStatBlock: React.FC<{
  heading: string;
  subheading: string;
  stats: PlayerStats;
  gifts: GiftItem[];
  onScreenshot: () => void;
}> = ({ heading, subheading, stats, gifts, onScreenshot }) => {
  const totalGifts = gifts.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] space-y-4 shadow-xs dark:shadow-none">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-cinzel text-base sm:text-lg font-bold text-stone-900 dark:text-amber-100">{heading}</h2>
          <p className="text-xs text-stone-600 dark:text-neutral-400 mt-0.5">{subheading}</p>
        </div>
        <button
          type="button"
          onClick={onScreenshot}
          className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-stone-200 dark:border-white/[0.08] text-[11px] font-medium text-amber-700 dark:text-amber-300 inline-flex items-center gap-1.5 shrink-0"
        >
          <Camera className="w-3.5 h-3.5" />
          Share
        </button>
      </div>

      {/* Hairline-divided 4-column metrics (clean, zero nested boxes) */}
      <div className="grid grid-cols-4 divide-x divide-stone-200 dark:divide-white/[0.07] py-2 border-y border-stone-200 dark:border-white/[0.06] text-center">
        <div className="px-1">
          <span className="text-[11px] text-stone-600 dark:text-neutral-400 block">Games</span>
          <span className="font-cinzel text-xl font-bold text-stone-900 dark:text-neutral-100 tabular-nums">
            {stats.totalGames}
          </span>
        </div>
        <div className="px-1">
          <span className="text-[11px] text-stone-600 dark:text-neutral-400 block">Wins</span>
          <span className="font-cinzel text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {stats.totalWins}
          </span>
        </div>
        <div className="px-1">
          <span className="text-[11px] text-stone-600 dark:text-neutral-400 block">Loses</span>
          <span className="font-cinzel text-xl font-bold text-stone-700 dark:text-neutral-300 tabular-nums">
            {stats.totalLoses}
          </span>
        </div>
        <div className="px-1">
          <span className="text-[11px] text-stone-600 dark:text-neutral-400 block">Win Rate</span>
          <span className="font-cinzel text-xl font-bold text-amber-700 dark:text-amber-300 tabular-nums">
            {stats.winRate}%
          </span>
        </div>
      </div>

      {/* Uncluttered Sponsor's Gifts summary (top first, 0-count hidden) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-stone-700 dark:text-neutral-300 font-medium">Sponsor's Gifts Received</span>
          <span className="font-mono tabular-nums text-amber-700 dark:text-amber-400">{totalGifts} total</span>
        </div>
        {gifts.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-neutral-500">No Sponsor's Gifts received yet.</p>
        ) : (
          <p className="text-xs text-stone-800 dark:text-neutral-200 leading-relaxed font-mono">
            {gifts.map((g, i) => (
              <span key={g.name}>
                {i > 0 && <span className="text-stone-400 dark:text-neutral-600"> · </span>}
                <strong className={i === 0 ? 'text-amber-700 dark:text-amber-300' : 'text-stone-800 dark:text-neutral-200'}>
                  {g.count} {g.name}
                </strong>
              </span>
            ))}
          </p>
        )}
      </div>
    </div>
  );
};

export const MyGamesV2: React.FC<MyGamesV2Props> = ({
  currentPlayer,
  tributes,
  activeSessionId,
  activeSessionName,
  activeMonth,
  onOpenPlayerModal,
  onViewProfile,
}) => {
  const [vaultScope, setVaultScope] = useState<'current' | 'monthly'>('current');
  const [filterType, setFilterType] = useState<'all' | 'technical' | 'character'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [historyScope, setHistoryScope] = useState<'current' | 'monthly'>('current');
  const [screenshotScope, setScreenshotScope] = useState<'both' | 'current' | 'monthly' | null>(null);

  if (!currentPlayer) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <p className="text-sm text-stone-600 dark:text-neutral-400">Select a tribute to view My Games &amp; Sponsor's Gifts.</p>
        <button
          type="button"
          onClick={onOpenPlayerModal}
          className="min-h-[44px] px-5 py-2.5 bg-amber-400 text-black font-cinzel font-bold text-xs rounded-xl"
        >
          Select Tribute
        </button>
      </div>
    );
  }

  const allMatches = getMatchHistory();
  const sessions = getSessions();
  const monthSessionIds = new Set(sessions.filter((s) => s.month === activeMonth).map((s) => s.id));
  const playerInvolves = (m: CourtMatch) =>
    m.team1.player1.id === currentPlayer.id ||
    m.team1.player2?.id === currentPlayer.id ||
    m.team2.player1.id === currentPlayer.id ||
    m.team2.player2?.id === currentPlayer.id;

  const currentReapingMatches = allMatches.filter(
    (m) => m.sessionId === activeSessionId && playerInvolves(m)
  );
  const monthlyMatches = allMatches.filter(
    (m) => (monthSessionIds.has(m.sessionId) || m.sessionId === activeSessionId) && playerInvolves(m)
  );

  const currentStats = getPlayerCurrentReapingStats(currentPlayer, activeSessionId);
  const currentGifts = buildSortedGifts(
    getPlayerCurrentReapingGifts(currentPlayer, activeSessionId)
  );

  const monthlyStats = getPlayerMonthlyStats(currentPlayer, activeMonth);
  const monthlyGifts = buildSortedGifts(getPlayerMonthlyGifts(currentPlayer, activeMonth));

  const monthLabel = formatMonthLabel(activeMonth);
  const vaultGifts = vaultScope === 'current' ? currentGifts : monthlyGifts;
  const displayedVaultGifts = vaultGifts.filter((g) => {
    if (filterType === 'technical' && g.category !== 'Technical') return false;
    if (filterType === 'character' && g.category !== 'Character') return false;
    if (searchQuery.trim() && !g.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const displayedMatches = historyScope === 'current' ? currentReapingMatches : monthlyMatches;

  return (
    <div className="space-y-8">
      {/* Minimalist Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 dark:border-white/[0.07] pb-4">
        <div className="flex items-center gap-3.5">
          <TributeAvatar
            name={currentPlayer.name}
            avatarUrl={currentPlayer.avatarUrl}
            size="lg"
            onClick={() => onViewProfile(currentPlayer)}
          />
          <div>
            <button
              type="button"
              onClick={() => onViewProfile(currentPlayer)}
              className="text-left group"
            >
              <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-stone-900 dark:text-amber-100 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                {currentPlayer.name}
              </h1>
            </button>
            <div className="text-xs text-stone-600 dark:text-neutral-400">
              {currentPlayer.category} · {currentPlayer.district} ·{' '}
              <button
                type="button"
                onClick={() => onViewProfile(currentPlayer)}
                className="text-amber-700 dark:text-amber-400 hover:underline font-medium"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setScreenshotScope('both')}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-cinzel font-bold text-xs inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Camera className="w-4 h-4" />
            Screenshot Card
          </button>
          <button
            type="button"
            onClick={onOpenPlayerModal}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white hover:bg-stone-100 dark:bg-white/[0.04] dark:hover:bg-white/[0.08] border border-stone-300 dark:border-white/[0.08] text-xs font-medium text-stone-800 dark:text-neutral-200 transition-colors"
          >
            Switch Tribute
          </button>
        </div>
      </div>

      {/* Current Reaping & Monthly Standing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MinimalStatBlock
          heading="Current Reaping"
          subheading={activeSessionName}
          stats={currentStats}
          gifts={currentGifts}
          onScreenshot={() => setScreenshotScope('current')}
        />
        <MinimalStatBlock
          heading={`Monthly Standing · ${monthLabel}`}
          subheading={`All matches & gifts in ${monthLabel}`}
          stats={monthlyStats}
          gifts={monthlyGifts}
          onScreenshot={() => setScreenshotScope('monthly')}
        />
      </div>

      {/* Battle History Log */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="font-cinzel text-base sm:text-lg font-bold text-stone-900 dark:text-amber-100">
            Battle History Log
          </h2>
          <div className="grid grid-cols-2 sm:inline-flex p-1 bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] rounded-xl text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setHistoryScope('current')}
              className={`min-h-[40px] px-3 py-1 rounded-lg font-medium transition-colors ${
                historyScope === 'current'
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'text-stone-600 dark:text-neutral-400'
              }`}
            >
              Current ({currentReapingMatches.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryScope('monthly')}
              className={`min-h-[40px] px-3 py-1 rounded-lg font-medium transition-colors ${
                historyScope === 'monthly'
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'text-stone-600 dark:text-neutral-400'
              }`}
            >
              {monthLabel} ({monthlyMatches.length})
            </button>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] divide-y divide-stone-200 dark:divide-white/[0.06] overflow-hidden shadow-xs dark:shadow-none">
          {displayedMatches.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-500 dark:text-neutral-500">
              No completed matches recorded in this scope yet.
            </div>
          ) : (
            displayedMatches.map((m) => {
              const inT1 =
                m.team1.player1.id === currentPlayer.id ||
                m.team1.player2?.id === currentPlayer.id;
              const isWinner = (inT1 && m.winnerTeam === 1) || (!inT1 && m.winnerTeam === 2);
              const myTeam = inT1 ? m.team1 : m.team2;
              const oppTeam = inT1 ? m.team2 : m.team1;

              return (
                <div
                  key={m.id}
                  className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3"
                >
                  <div className="min-w-0 space-y-1.5 flex-1">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`font-mono font-bold ${
                            isWinner ? 'text-emerald-700 dark:text-emerald-400' : 'text-stone-500 dark:text-neutral-400'
                          }`}
                        >
                          {isWinner ? 'VICTOR' : 'DEFEATED'}
                        </span>
                        <span className="text-stone-300 dark:text-neutral-600">·</span>
                        <span className="text-stone-700 dark:text-neutral-300 font-medium truncate">{m.courtName}</span>
                        <span className="text-stone-300 dark:text-neutral-600">·</span>
                        <span className="text-stone-500 dark:text-neutral-500 font-mono shrink-0">
                          {new Date(m.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="sm:hidden font-cinzel text-base font-bold text-stone-900 dark:text-amber-100 tabular-nums shrink-0">
                        {myTeam.score ?? '-'} : {oppTeam.score ?? '-'}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
                      {[myTeam.player1, myTeam.player2].filter(Boolean).map((p) => {
                        const pl = p!;
                        const resolved = tributes.find((t) => t.id === pl.id) || pl;
                        const avatar = resolvePlayerAvatar(pl.id, pl.name, tributes, pl.avatarUrl);
                        return (
                          <button
                            key={pl.id}
                            type="button"
                            onClick={() => onViewProfile(resolved)}
                            className="inline-flex items-center gap-1.5 text-amber-800 dark:text-amber-200 hover:text-amber-600 dark:hover:text-amber-100 font-medium min-h-[28px]"
                          >
                            <TributeAvatar name={pl.name} avatarUrl={avatar} size="xs" />
                            <span>{pl.name}</span>
                          </button>
                        );
                      })}
                      <span className="text-stone-400 dark:text-neutral-500">vs</span>
                      {[oppTeam.player1, oppTeam.player2].filter(Boolean).map((p) => {
                        const pl = p!;
                        const resolved = tributes.find((t) => t.id === pl.id) || pl;
                        const avatar = resolvePlayerAvatar(pl.id, pl.name, tributes, pl.avatarUrl);
                        return (
                          <button
                            key={pl.id}
                            type="button"
                            onClick={() => onViewProfile(resolved)}
                            className="inline-flex items-center gap-1.5 text-stone-700 dark:text-neutral-300 hover:text-amber-700 dark:hover:text-amber-200 min-h-[28px]"
                          >
                            <TributeAvatar name={pl.name} avatarUrl={avatar} size="xs" />
                            <span>{pl.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="hidden sm:block font-cinzel text-lg font-bold text-stone-900 dark:text-amber-100 tabular-nums shrink-0">
                    {myTeam.score ?? '-'} : {oppTeam.score ?? '-'}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Sponsor's Gift Collection Vault */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-cinzel text-base sm:text-lg font-bold text-stone-900 dark:text-amber-100">
              Sponsor's Gift Collection
            </h2>
            <p className="text-xs text-stone-600 dark:text-neutral-400">
              Ordered by highest count · Zero-count gifts omitted
            </p>
          </div>

          <div className="grid grid-cols-2 sm:inline-flex p-1 bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] rounded-xl text-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setVaultScope('current')}
              className={`min-h-[40px] px-3 py-1 rounded-lg font-medium transition-colors ${
                vaultScope === 'current'
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'text-stone-600 dark:text-neutral-400'
              }`}
            >
              Current Reaping
            </button>
            <button
              type="button"
              onClick={() => setVaultScope('monthly')}
              className={`min-h-[40px] px-3 py-1 rounded-lg font-medium transition-colors ${
                vaultScope === 'monthly'
                  ? 'bg-amber-400 text-black font-semibold'
                  : 'text-stone-600 dark:text-neutral-400'
              }`}
            >
              {monthLabel}
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl border whitespace-nowrap shrink-0 ${
                filterType === 'all'
                  ? 'bg-amber-100 dark:bg-amber-500/15 border-amber-500 dark:border-amber-400 text-amber-900 dark:text-amber-200 font-semibold'
                  : 'bg-white dark:bg-[#11131a] border-stone-200 dark:border-white/[0.07] text-stone-600 dark:text-neutral-400'
              }`}
            >
              All ({vaultGifts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('technical')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl border whitespace-nowrap shrink-0 ${
                filterType === 'technical'
                  ? 'bg-amber-100 dark:bg-amber-500/15 border-amber-500 dark:border-amber-400 text-amber-900 dark:text-amber-200 font-semibold'
                  : 'bg-white dark:bg-[#11131a] border-stone-200 dark:border-white/[0.07] text-stone-600 dark:text-neutral-400'
              }`}
            >
              Technical ({vaultGifts.filter((g) => g.category === 'Technical').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('character')}
              className={`min-h-[40px] px-3 py-1.5 rounded-xl border whitespace-nowrap shrink-0 ${
                filterType === 'character'
                  ? 'bg-amber-100 dark:bg-amber-500/15 border-amber-500 dark:border-amber-400 text-amber-900 dark:text-amber-200 font-semibold'
                  : 'bg-white dark:bg-[#11131a] border-stone-200 dark:border-white/[0.07] text-stone-600 dark:text-neutral-400'
              }`}
            >
              Character ({vaultGifts.filter((g) => g.category === 'Character').length})
            </button>
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-stone-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search gifts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[42px] pl-9 pr-3 py-2 bg-white dark:bg-[#11131a] border border-stone-300 dark:border-white/[0.08] rounded-xl text-xs text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
            />
          </div>
        </div>

        {displayedVaultGifts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] text-center text-xs text-stone-500 dark:text-neutral-500">
            No Sponsor's Gifts received in this scope yet.
          </div>
        ) : (
          <div className="rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] divide-y divide-stone-200 dark:divide-white/[0.06] overflow-hidden shadow-xs dark:shadow-none">
            {displayedVaultGifts.map((gift, idx) => (
              <div
                key={gift.name}
                className="px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 text-xs font-mono text-stone-500 dark:text-neutral-500 tabular-nums">
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-stone-900 dark:text-neutral-100">{gift.name}</div>
                    <div className="text-[11px] text-stone-500 dark:text-neutral-500">{gift.category}</div>
                  </div>
                </div>
                <span className="font-cinzel text-lg font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                  {gift.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Clean Mobile Screenshot Modal */}
      {screenshotScope && (
        <div className="fixed inset-0 z-50 bg-stone-900/75 dark:bg-black/95 backdrop-blur-sm flex flex-col items-center justify-start sm:justify-center p-3 sm:p-6 pt-5 pb-10 overflow-y-auto">
          <div className="w-full max-w-sm flex items-center justify-between gap-2 mb-3 shrink-0">
            <div className="inline-flex p-1 bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.1] rounded-xl text-[11px]">
              {(['both', 'current', 'monthly'] as const).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => setScreenshotScope(sc)}
                  className={`min-h-[34px] px-2.5 py-1 rounded-lg capitalize font-medium ${
                    screenshotScope === sc
                      ? 'bg-amber-400 text-black font-semibold'
                      : 'text-stone-600 dark:text-neutral-400'
                  }`}
                >
                  {sc === 'current' ? 'Reaping' : sc}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setScreenshotScope(null)}
              aria-label="Close screenshot preview"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.1] text-stone-700 dark:text-neutral-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0e1017] border-2 border-amber-500 dark:border-amber-500/60 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 pb-3 border-b border-stone-200 dark:border-white/[0.08]">
              <TributeAvatar
                name={currentPlayer.name}
                avatarUrl={currentPlayer.avatarUrl}
                size="md"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 block">
                  The Shuttle Games
                </span>
                <h3 className="font-cinzel text-lg font-bold text-stone-900 dark:text-amber-100 truncate">
                  {currentPlayer.name}
                </h3>
                <span className="text-xs text-stone-600 dark:text-neutral-400 block">
                  {currentPlayer.category} · {currentPlayer.district}
                </span>
              </div>
              <img
                src="/the_shuttle_games_logo.png"
                alt="The Shuttle Games"
                className="w-8 h-8 rounded-full border border-amber-500/50 object-contain shrink-0"
              />
            </div>

            {(screenshotScope === 'both' || screenshotScope === 'current') && (
              <div className="space-y-2 pb-3 border-b border-stone-200 dark:border-white/[0.06]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium">Current Reaping</span>
                  <span className="text-stone-500 dark:text-neutral-500 truncate max-w-[160px]">{activeSessionName}</span>
                </div>
                <div className="grid grid-cols-4 text-center py-1">
                  <div>
                    <span className="text-[10px] text-stone-500 dark:text-neutral-500 block">Games</span>
                    <span className="font-cinzel text-lg font-bold text-stone-900 dark:text-white tabular-nums">
                      {currentStats.totalGames}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 dark:text-neutral-500 block">Wins</span>
                    <span className="font-cinzel text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {currentStats.totalWins}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 dark:text-neutral-500 block">Loses</span>
                    <span className="font-cinzel text-lg font-bold text-stone-700 dark:text-neutral-300 tabular-nums">
                      {currentStats.totalLoses}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 dark:text-neutral-500 block">Win %</span>
                    <span className="font-cinzel text-lg font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                      {currentStats.winRate}%
                    </span>
                  </div>
                </div>
                {currentGifts.length > 0 && (
                  <p className="text-[11px] font-mono text-amber-800 dark:text-amber-200/90 leading-relaxed">
                    {currentGifts.slice(0, 6).map((g) => `${g.count} ${g.name}`).join(' · ')}
                  </p>
                )}
              </div>
            )}

            {(screenshotScope === 'both' || screenshotScope === 'monthly') && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-amber-700 dark:text-amber-300 font-medium">Monthly Standing</span>
                  <span className="text-stone-500 dark:text-neutral-500">{monthLabel}</span>
                </div>
                <div className="grid grid-cols-4 text-center py-1">
                  <div>
                    <span className="text-[10px] text-stone-500 dark:text-neutral-500 block">Games</span>
                    <span className="font-cinzel text-lg font-bold text-stone-900 dark:text-white tabular-nums">
                      {monthlyStats.totalGames}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 dark:text-neutral-500 block">Wins</span>
                    <span className="font-cinzel text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {monthlyStats.totalWins}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 dark:text-neutral-500 block">Loses</span>
                    <span className="font-cinzel text-lg font-bold text-stone-700 dark:text-neutral-300 tabular-nums">
                      {monthlyStats.totalLoses}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-500 dark:text-neutral-500 block">Win %</span>
                    <span className="font-cinzel text-lg font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                      {monthlyStats.winRate}%
                    </span>
                  </div>
                </div>
                {monthlyGifts.length > 0 && (
                  <p className="text-[11px] font-mono text-amber-800 dark:text-amber-200/90 leading-relaxed">
                    {monthlyGifts.slice(0, 6).map((g) => `${g.count} ${g.name}`).join(' · ')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
