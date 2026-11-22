import React, { useState } from 'react';
import {
  Swords,
  Flame,
  Calendar,
  Award,
  Gift,
  Sparkles,
  Shield,
  Search,
  ArrowDownWideNarrow,
  Camera,
  X,
} from 'lucide-react';
import {
  CourtMatch,
  Player,
  PlayerStats,
  TECHNICAL_SKILLS,
} from '../types';
import {
  getMatchHistory,
  getSessions,
  getPlayerCurrentReapingStats,
  getPlayerCurrentReapingGifts,
  getPlayerMonthlyStats,
  getPlayerMonthlyGifts,
} from '../utils/storage';
import { TributeAvatar, resolvePlayerAvatar } from './TributeAvatar';

interface MyGamesOverviewProps {
  currentPlayer: Player | null;
  tributes: Player[];
  activeSessionId: string;
  activeSessionName: string;
  activeMonth: string;
  onOpenPlayerModal: () => void;
  onViewProfile: (player: Player) => void;
}

interface ReceivedGiftItem {
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

function buildSortedGifts(rawGifts: Record<string, number>): ReceivedGiftItem[] {
  return Object.entries(rawGifts || {})
    .filter(([_, count]) => typeof count === 'number' && count > 0)
    .map(([name, count]) => {
      const isTech = (TECHNICAL_SKILLS as readonly string[]).includes(name);
      return {
        name,
        count: Number(count),
        category: (isTech ? 'Technical' : 'Character') as 'Technical' | 'Character',
      };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

interface CompactStatsCardProps {
  title: string;
  subtitle: string;
  stats: PlayerStats;
  gifts: ReceivedGiftItem[];
  accentBadge: string;
  accentBorder: string;
  onOpenScreenshot?: () => void;
}

const CompactStatsCard: React.FC<CompactStatsCardProps> = ({
  title,
  subtitle,
  stats,
  gifts,
  accentBadge,
  accentBorder,
  onOpenScreenshot,
}) => {
  const totalGifts = gifts.reduce((acc, g) => acc + g.count, 0);

  return (
    <div
      className={`p-4 sm:p-6 rounded-2xl bg-gradient-to-b from-[#141722] to-[#0f1119] border ${accentBorder} shadow-xl space-y-4`}
    >
      {/* Card Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${accentBadge}`}
          >
            {title}
          </span>
          <p className="text-[11px] sm:text-xs text-neutral-400 font-mono mt-1.5">{subtitle}</p>
        </div>

        {onOpenScreenshot && (
          <button
            type="button"
            onClick={onOpenScreenshot}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-mono font-semibold transition-colors shrink-0"
            title="Open clean card for mobile screenshot"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Screenshot</span>
          </button>
        )}
      </div>

      {/* Ultra-compact 4-stat KPI Strip (fits cleanly on 1 mobile row or 2x2 tight grid) */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#0b0d14] border border-neutral-800/90 text-center">
          <span className="text-[10px] font-mono text-neutral-400 uppercase block leading-tight">
            Games
          </span>
          <span className="font-cinzel text-xl sm:text-2xl font-black text-amber-100 tabular-nums block mt-0.5">
            {stats.totalGames}
          </span>
        </div>

        <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#0b0d14] border border-emerald-950/60 text-center">
          <span className="text-[10px] font-mono text-emerald-400 uppercase block leading-tight">
            Wins
          </span>
          <span className="font-cinzel text-xl sm:text-2xl font-black text-emerald-400 tabular-nums block mt-0.5">
            {stats.totalWins}
          </span>
        </div>

        <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#0b0d14] border border-red-950/50 text-center">
          <span className="text-[10px] font-mono text-neutral-400 uppercase block leading-tight">
            Loses
          </span>
          <span className="font-cinzel text-xl sm:text-2xl font-black text-neutral-300 tabular-nums block mt-0.5">
            {stats.totalLoses}
          </span>
        </div>

        <div className="p-2.5 sm:p-3.5 rounded-xl bg-[#0b0d14] border border-amber-900/60 text-center">
          <span className="text-[10px] font-mono text-amber-400 uppercase block leading-tight">
            Win Rate
          </span>
          <span className="font-cinzel text-xl sm:text-2xl font-black text-amber-400 tabular-nums block mt-0.5">
            {stats.winRate}%
          </span>
        </div>
      </div>

      {/* Win Rate Progress Bar */}
      <div className="w-full bg-neutral-800/80 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full transition-all duration-500"
          style={{ width: `${stats.winRate}%` }}
        />
      </div>

      {/* Sponsor's Gifts Received (Top first, 0-count omitted) */}
      <div className="pt-2 border-t border-neutral-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-cinzel font-bold text-amber-200 flex items-center gap-1.5">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            Sponsor's Gifts Received
          </span>
          <span className="font-mono text-amber-400/90 font-semibold tabular-nums">
            {totalGifts} Total
          </span>
        </div>

        {gifts.length === 0 ? (
          <p className="text-[11px] text-neutral-500 italic">
            No Sponsor's Gifts received in this scope yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {gifts.map((gift, idx) => (
              <span
                key={gift.name}
                className={`px-2.5 py-1 rounded-lg border text-[11px] inline-flex items-center gap-1.5 ${
                  idx === 0
                    ? 'bg-amber-500/20 border-amber-400/80 text-amber-200 font-bold'
                    : 'bg-[#0b0d14] border-neutral-800 text-neutral-300'
                }`}
              >
                <span className="font-cinzel font-black text-amber-300 tabular-nums">
                  {gift.count}
                </span>
                <span>{gift.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const MyGamesOverview: React.FC<MyGamesOverviewProps> = ({
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
      <div className="max-w-md mx-auto text-center py-12">
        <p className="text-sm text-neutral-400 mb-4">
          Please select a tribute to view match records and Sponsor's Gifts.
        </p>
        <button
          onClick={onOpenPlayerModal}
          className="px-4 py-2 bg-amber-500 text-black font-cinzel font-bold text-xs rounded-lg"
        >
          Select Tribute
        </button>
      </div>
    );
  }

  const allMatches = getMatchHistory();
  const sessions = getSessions();
  const monthSessionIds = new Set(
    sessions.filter((s) => s.month === activeMonth).map((s) => s.id)
  );

  // Filter matches involving currentPlayer
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

  // Current Reaping Stats & Gifts
  const currentStats = getPlayerCurrentReapingStats(currentPlayer, activeSessionId);
  const currentGifts = buildSortedGifts(
    getPlayerCurrentReapingGifts(currentPlayer, activeSessionId)
  );

  // Monthly Standing Stats & Gifts
  const monthlyStats = getPlayerMonthlyStats(currentPlayer, activeMonth);
  const monthlyGifts = buildSortedGifts(getPlayerMonthlyGifts(currentPlayer, activeMonth));

  const monthLabel = formatMonthLabel(activeMonth);

  // Vault list
  const vaultGifts = vaultScope === 'current' ? currentGifts : monthlyGifts;
  const totalVaultGifts = vaultGifts.reduce((acc, g) => acc + g.count, 0);
  const totalTechGifts = vaultGifts
    .filter((g) => g.category === 'Technical')
    .reduce((acc, g) => acc + g.count, 0);
  const totalCharGifts = vaultGifts
    .filter((g) => g.category === 'Character')
    .reduce((acc, g) => acc + g.count, 0);

  const displayedVaultGifts = vaultGifts.filter((g) => {
    if (filterType === 'technical' && g.category !== 'Technical') return false;
    if (filterType === 'character' && g.category !== 'Character') return false;
    if (searchQuery.trim() && !g.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const displayedHistoryMatches =
    historyScope === 'current' ? currentReapingMatches : monthlyMatches;

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header + Mobile Screenshot Share Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div className="flex items-center gap-3.5">
          <TributeAvatar
            name={currentPlayer.name}
            avatarUrl={currentPlayer.avatarUrl}
            size="lg"
            onClick={() => onViewProfile(currentPlayer)}
            title="View / Edit Tribute Profile"
            className="border-2 border-amber-500/80"
          />
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400">
                My Games & Sponsor's Gift Vault
              </span>
            </div>
            <button
              type="button"
              onClick={() => onViewProfile(currentPlayer)}
              className="text-left group"
            >
              <h2 className="font-cinzel text-2xl md:text-3xl font-extrabold text-amber-100 group-hover:text-amber-300 transition-colors leading-tight">
                {currentPlayer.name}
              </h2>
            </button>
            <div className="text-xs text-neutral-400 flex items-center gap-2">
              <span className="text-amber-400/90 font-medium">{currentPlayer.category}</span>
              <span aria-hidden="true">·</span>
              <span>{currentPlayer.district}</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => onViewProfile(currentPlayer)}
                className="text-amber-400 hover:text-amber-300 underline underline-offset-2"
              >
                View Profile
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setScreenshotScope('both')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-cinzel font-bold text-xs shadow-lg hover:from-amber-300 hover:to-amber-400 active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4" />
            Share / Screenshot Card
          </button>
          <button
            type="button"
            onClick={onOpenPlayerModal}
            className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 text-xs text-amber-300 font-medium transition-colors"
          >
            Switch
          </button>
        </div>
      </div>

      {/* Side-by-Side (Desktop) / Compact Stacked (Mobile-Screenshot-Friendly) Stats Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CompactStatsCard
          title="Current Reaping"
          subtitle={`Active Session: ${activeSessionName}`}
          stats={currentStats}
          gifts={currentGifts}
          accentBadge="bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
          accentBorder="border-emerald-900/50"
          onOpenScreenshot={() => setScreenshotScope('current')}
        />

        <CompactStatsCard
          title={`Monthly Standing · ${monthLabel}`}
          subtitle={`All battles & gifts throughout ${monthLabel}`}
          stats={monthlyStats}
          gifts={monthlyGifts}
          accentBadge="bg-amber-500/15 text-amber-300 border border-amber-500/40"
          accentBorder="border-amber-800/50"
          onOpenScreenshot={() => setScreenshotScope('monthly')}
        />
      </div>

      {/* SECTION: Battle History Log */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#12141c] border border-amber-900/40 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Swords className="w-4 h-4 text-amber-400" />
            <h3 className="font-cinzel text-base font-bold text-amber-100">
              Battle History Log ({displayedHistoryMatches.length} Recorded)
            </h3>
          </div>

          <div className="flex items-center gap-1 p-1 bg-[#0b0d14] border border-neutral-800 rounded-xl self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setHistoryScope('current')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                historyScope === 'current'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Current Reaping ({currentReapingMatches.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryScope('monthly')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                historyScope === 'monthly'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {monthLabel} ({monthlyMatches.length})
            </button>
          </div>
        </div>

        {displayedHistoryMatches.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            No completed matches recorded in{' '}
            {historyScope === 'current' ? 'the Current Reaping' : monthLabel} yet. Enter The
            Reaping to begin your battle!
          </div>
        ) : (
          <>
            {/* Mobile compact cards for easy scrolling & screenshotting */}
            <div className="grid grid-cols-1 gap-2.5 sm:hidden">
              {displayedHistoryMatches.map((m) => {
                const inT1 =
                  m.team1.player1.id === currentPlayer.id ||
                  m.team1.player2?.id === currentPlayer.id;
                const isWinner = (inT1 && m.winnerTeam === 1) || (!inT1 && m.winnerTeam === 2);
                const myTeam = inT1 ? m.team1 : m.team2;
                const oppTeam = inT1 ? m.team2 : m.team1;

                return (
                  <div
                    key={m.id}
                    className="p-3 rounded-xl bg-[#0b0d14] border border-neutral-800 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`font-mono font-bold text-[10px] uppercase px-2 py-0.5 rounded ${
                            isWinner
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-neutral-800 text-neutral-400'
                          }`}
                        >
                          {isWinner ? 'VICTOR' : 'DEFEATED'}
                        </span>
                        <span className="text-[11px] font-semibold text-neutral-200">
                          {m.courtName}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500">
                          {new Date(m.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-amber-200 font-medium">
                        {[myTeam.player1, myTeam.player2].filter(Boolean).map((p) => {
                          const pl = p!;
                          const resolved = tributes.find((t) => t.id === pl.id) || pl;
                          const avatar = resolvePlayerAvatar(pl.id, pl.name, tributes, pl.avatarUrl);
                          return (
                            <button
                              key={pl.id}
                              type="button"
                              onClick={() => onViewProfile(resolved)}
                              className="inline-flex items-center gap-1"
                            >
                              <TributeAvatar name={pl.name} avatarUrl={avatar} size="xs" />
                              <span className="truncate max-w-[100px]">{pl.name}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400 mt-1">
                        <span>vs</span>
                        {[oppTeam.player1, oppTeam.player2].filter(Boolean).map((p) => {
                          const pl = p!;
                          const resolved = tributes.find((t) => t.id === pl.id) || pl;
                          const avatar = resolvePlayerAvatar(pl.id, pl.name, tributes, pl.avatarUrl);
                          return (
                            <button
                              key={pl.id}
                              type="button"
                              onClick={() => onViewProfile(resolved)}
                              className="inline-flex items-center gap-1"
                            >
                              <TributeAvatar name={pl.name} avatarUrl={avatar} size="xs" />
                              <span className="truncate max-w-[100px]">{pl.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div className="text-right font-cinzel font-black text-base text-amber-100 tabular-nums shrink-0">
                      {myTeam.score ?? '-'} : {oppTeam.score ?? '-'}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-neutral-800 text-neutral-400 font-mono uppercase text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Arena</th>
                    <th className="py-2.5 px-3">Your Team</th>
                    <th className="py-2.5 px-3">Opponents</th>
                    <th className="py-2.5 px-3 text-right">Score</th>
                    <th className="py-2.5 px-3 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850">
                  {displayedHistoryMatches.map((m) => {
                    const inT1 =
                      m.team1.player1.id === currentPlayer.id ||
                      m.team1.player2?.id === currentPlayer.id;
                    const isWinner =
                      (inT1 && m.winnerTeam === 1) || (!inT1 && m.winnerTeam === 2);

                    const myTeam = inT1 ? m.team1 : m.team2;
                    const oppTeam = inT1 ? m.team2 : m.team1;

                    return (
                      <tr key={m.id} className="hover:bg-neutral-800/20 transition-colors">
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block font-mono font-bold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded ${
                              isWinner
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-neutral-800 text-neutral-400'
                            }`}
                          >
                            {isWinner ? 'VICTOR' : 'DEFEATED'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-neutral-200">{m.courtName}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            {[myTeam.player1, myTeam.player2].filter(Boolean).map((p) => {
                              const pl = p!;
                              const resolved = tributes.find((t) => t.id === pl.id) || pl;
                              const avatar = resolvePlayerAvatar(pl.id, pl.name, tributes, pl.avatarUrl);
                              return (
                                <button
                                  key={pl.id}
                                  type="button"
                                  onClick={() => onViewProfile(resolved)}
                                  className="inline-flex items-center gap-1.5 text-amber-200 hover:text-amber-100 font-medium"
                                >
                                  <TributeAvatar name={pl.name} avatarUrl={avatar} size="xs" />
                                  <span>{pl.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-neutral-400">
                          <div className="flex items-center gap-2 flex-wrap">
                            {[oppTeam.player1, oppTeam.player2].filter(Boolean).map((p) => {
                              const pl = p!;
                              const resolved = tributes.find((t) => t.id === pl.id) || pl;
                              const avatar = resolvePlayerAvatar(pl.id, pl.name, tributes, pl.avatarUrl);
                              return (
                                <button
                                  key={pl.id}
                                  type="button"
                                  onClick={() => onViewProfile(resolved)}
                                  className="inline-flex items-center gap-1.5 text-neutral-300 hover:text-amber-200"
                                >
                                  <TributeAvatar name={pl.name} avatarUrl={avatar} size="xs" />
                                  <span>{pl.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-neutral-100">
                          {myTeam.score ?? '-'} : {oppTeam.score ?? '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-neutral-400 text-[11px]">
                          {new Date(m.startTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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

      {/* SECTION: Integrated Sponsor's Gift Collection Vault */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#12141c] border border-amber-900/40 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-500/70 shrink-0 bg-neutral-900">
              <img
                src="/src/assets/images/mockingjay_badminton_crest_1794230312788.jpg"
                alt="Mockingjay Badminton Crest"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                  Sponsor's Gift Collection
                </span>
              </div>
              <h3 className="font-cinzel text-lg font-extrabold text-amber-100">
                {vaultScope === 'current'
                  ? `Current Reaping Gifts (${totalVaultGifts})`
                  : `${monthLabel} Gifts (${totalVaultGifts})`}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Top gift shown first · Zero-count gifts omitted · {totalTechGifts} Technical ·{' '}
                {totalCharGifts} Character
              </p>
            </div>
          </div>

          {/* Scope Toggle */}
          <div className="flex items-center gap-1 p-1 bg-[#0b0d14] border border-neutral-800 rounded-xl self-start md:self-auto">
            <button
              type="button"
              onClick={() => setVaultScope('current')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                vaultScope === 'current'
                  ? 'bg-emerald-500 text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Current Reaping
            </button>
            <button
              type="button"
              onClick={() => setVaultScope('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                vaultScope === 'monthly'
                  ? 'bg-amber-500 text-black font-bold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Monthly ({monthLabel})
            </button>
          </div>
        </div>

        {/* Category Filter & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#0b0d14] border border-neutral-800 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                filterType === 'all'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All ({vaultGifts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('technical')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                filterType === 'technical'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Technical Skills ({vaultGifts.filter((g) => g.category === 'Technical').length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('character')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                filterType === 'character'
                  ? 'bg-amber-500 text-black font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Character & Sportsmanship (
              {vaultGifts.filter((g) => g.category === 'Character').length})
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search received gifts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 bg-[#0b0d14] border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {displayedVaultGifts.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-[#0b0d14] border border-neutral-800 space-y-2">
            <Gift className="w-8 h-8 text-neutral-600 mx-auto" />
            <p className="text-xs font-bold text-neutral-300 font-cinzel">
              {vaultGifts.length === 0
                ? 'No Sponsor\'s Gifts Received in This Scope Yet'
                : 'No matching gifts found'}
            </p>
            <p className="text-[11px] text-neutral-500">
              Complete matches and exchange post-game Sponsor's Gifts to build your collection!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {displayedVaultGifts.map((gift, idx) => {
              const isTop = idx === 0;
              const isTech = gift.category === 'Technical';

              return (
                <div
                  key={gift.name}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                    isTop
                      ? 'bg-gradient-to-b from-[#1c1d29] to-[#141622] border-amber-500/80 shadow-lg ring-1 ring-amber-500/30'
                      : 'bg-[#0b0d14] border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                        isTop
                          ? 'bg-amber-500 text-black font-extrabold'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="text-xl font-cinzel font-black tabular-nums text-amber-300">
                      {gift.count}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-100 truncate">
                      {gift.name}
                    </h4>
                    <div className="flex items-center gap-1 mt-1">
                      {isTech ? (
                        <Shield className="w-3 h-3 text-amber-400/80 shrink-0" />
                      ) : (
                        <Award className="w-3 h-3 text-amber-400/80 shrink-0" />
                      )}
                      <span className="text-[10px] text-neutral-400 font-mono truncate">
                        {isTech ? 'Technical Skill' : 'Character'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MOBILE SCREENSHOT / SOCIAL SHARE MODAL */}
      {screenshotScope && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto">
          {/* Top Minimal Controls (hidden nicely at top, easy to crop or frame card cleanly below) */}
          <div className="w-full max-w-sm flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1 p-1 bg-[#141620] border border-neutral-800 rounded-xl text-[11px]">
              <button
                type="button"
                onClick={() => setScreenshotScope('both')}
                className={`px-2.5 py-1 rounded-lg font-medium ${
                  screenshotScope === 'both'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-neutral-400'
                }`}
              >
                Both
              </button>
              <button
                type="button"
                onClick={() => setScreenshotScope('current')}
                className={`px-2.5 py-1 rounded-lg font-medium ${
                  screenshotScope === 'current'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'text-neutral-400'
                }`}
              >
                Reaping
              </button>
              <button
                type="button"
                onClick={() => setScreenshotScope('monthly')}
                className={`px-2.5 py-1 rounded-lg font-medium ${
                  screenshotScope === 'monthly'
                    ? 'bg-amber-500 text-black font-bold'
                    : 'text-neutral-400'
                }`}
              >
                Monthly
              </button>
            </div>

            <button
              type="button"
              onClick={() => setScreenshotScope(null)}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-700 text-neutral-300 hover:text-white"
              aria-label="Close screenshot card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Self-Contained 9:16-Friendly Shareable Card */}
          <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-[#171925] via-[#0f1119] to-[#0a0b10] border-2 border-amber-500/70 shadow-2xl shadow-amber-950/60 p-5 space-y-4">
            {/* Brand + Tribute Identity */}
            <div className="flex items-center gap-3 pb-3 border-b border-amber-900/40">
              <TributeAvatar
                name={currentPlayer.name}
                avatarUrl={currentPlayer.avatarUrl}
                size="md"
                className="border-2 border-amber-400"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block">
                  The Shuttle Games
                </span>
                <h3 className="font-cinzel text-xl font-black text-amber-100 truncate">
                  {currentPlayer.name}
                </h3>
                <span className="text-[11px] font-mono text-neutral-300 block">
                  {currentPlayer.category} · {currentPlayer.district}
                </span>
              </div>
              <img
                src="/the_shuttle_games_logo.png"
                alt="The Shuttle Games"
                className="w-8 h-8 rounded-full border border-amber-500/50 object-contain shrink-0"
              />
            </div>

            {/* Current Reaping Compact Block */}
            {(screenshotScope === 'both' || screenshotScope === 'current') && (
              <div className="p-3.5 rounded-2xl bg-[#0c0e15] border border-emerald-700/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                    Current Reaping
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[160px]">
                    {activeSessionName}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="p-2 rounded-lg bg-[#141724]">
                    <span className="text-[9px] font-mono text-neutral-400 block">GAMES</span>
                    <span className="font-cinzel text-lg font-black text-white tabular-nums">
                      {currentStats.totalGames}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141724]">
                    <span className="text-[9px] font-mono text-emerald-400 block">WINS</span>
                    <span className="font-cinzel text-lg font-black text-emerald-400 tabular-nums">
                      {currentStats.totalWins}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141724]">
                    <span className="text-[9px] font-mono text-neutral-400 block">LOSES</span>
                    <span className="font-cinzel text-lg font-black text-neutral-300 tabular-nums">
                      {currentStats.totalLoses}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141724]">
                    <span className="text-[9px] font-mono text-amber-400 block">WIN %</span>
                    <span className="font-cinzel text-lg font-black text-amber-400 tabular-nums">
                      {currentStats.winRate}%
                    </span>
                  </div>
                </div>
                {currentGifts.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {currentGifts.slice(0, 6).map((g, i) => (
                      <span
                        key={g.name}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          i === 0
                            ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 font-bold'
                            : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                        }`}
                      >
                        {g.count} {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Monthly Standing Compact Block */}
            {(screenshotScope === 'both' || screenshotScope === 'monthly') && (
              <div className="p-3.5 rounded-2xl bg-[#0c0e15] border border-amber-700/50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                    Monthly Standing
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-400" />
                    {monthLabel}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className="p-2 rounded-lg bg-[#141724]">
                    <span className="text-[9px] font-mono text-neutral-400 block">GAMES</span>
                    <span className="font-cinzel text-lg font-black text-white tabular-nums">
                      {monthlyStats.totalGames}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141724]">
                    <span className="text-[9px] font-mono text-emerald-400 block">WINS</span>
                    <span className="font-cinzel text-lg font-black text-emerald-400 tabular-nums">
                      {monthlyStats.totalWins}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141724]">
                    <span className="text-[9px] font-mono text-neutral-400 block">LOSES</span>
                    <span className="font-cinzel text-lg font-black text-neutral-300 tabular-nums">
                      {monthlyStats.totalLoses}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-[#141724]">
                    <span className="text-[9px] font-mono text-amber-400 block">WIN %</span>
                    <span className="font-cinzel text-lg font-black text-amber-400 tabular-nums">
                      {monthlyStats.winRate}%
                    </span>
                  </div>
                </div>
                {monthlyGifts.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {monthlyGifts.slice(0, 6).map((g, i) => (
                      <span
                        key={g.name}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          i === 0
                            ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 font-bold'
                            : 'bg-neutral-900 text-neutral-300 border border-neutral-800'
                        }`}
                      >
                        {g.count} {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-amber-500/80">
              <span>THE SHUTTLE GAMES · DOUBLES</span>
              <span>"May the odds be ever in your favor"</span>
            </div>
          </div>

          <p className="text-[11px] font-mono text-neutral-400 mt-3 text-center">
            Take a screenshot of the gold-framed card above to share on social media!
          </p>
        </div>
      )}
    </div>
  );
};
