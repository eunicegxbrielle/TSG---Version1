import React, { useState } from 'react';
import {
  Trophy,
  Gift,
  Calendar,
  Flame,
  Medal,
  ChevronRight,
  Shield,
  Award,
  Sparkles,
  Info,
  CheckCircle,
} from 'lucide-react';
import {
  CATEGORY_TO_DISTRICT,
  CHARACTER_SPORTSMANSHIP,
  Player,
  SKILL_CATEGORIES,
  SkillCategory,
  TECHNICAL_SKILLS,
} from '../types';
import { TributeAvatar } from './TributeAvatar';

interface VictorsLeaderboardProps {
  tributes: Player[];
  onSelectTribute: (player: Player) => void;
  onViewProfile?: (player: Player) => void;
  activeMonth: string; // e.g. "2026-11"
}

export const VictorsLeaderboard: React.FC<VictorsLeaderboardProps> = ({
  tributes,
  onSelectTribute,
  onViewProfile,
  activeMonth,
}) => {
  const [activeTab, setActiveTab] = useState<'victors' | 'gifts' | 'monthly'>('victors');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGiftType, setSelectedGiftType] = useState<string>('Clear');
  const [monthlyGiftFilter, setMonthlyGiftFilter] = useState<string>('All');
  const handleInspectTribute = (player: Player) => {
    if (onViewProfile) {
      onViewProfile(player);
    } else {
      onSelectTribute(player);
    }
  };

  const formatMonthYear = (monthStr: string) => {
    if (!monthStr) return 'November 2026';
    const parts = monthStr.split('-');
    if (parts.length === 2) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const date = new Date(year, month - 1, 1);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      }
    }
    return 'November 2026';
  };

  // Sort tributes by Win Rate and Total Wins
  const filteredTributes = tributes.filter((t) => {
    if (selectedCategory === 'All') return true;
    return t.category === selectedCategory;
  });

  const sortedVictors = [...filteredTributes].sort((a, b) => {
    if (b.stats.winRate !== a.stats.winRate) {
      return b.stats.winRate - a.stats.winRate;
    }
    return b.stats.totalWins - a.stats.totalWins;
  });

  // Monthly leaderboard: Filter tributes who joined >= 3 sessions
  const qualifyingMonthly = tributes
    .filter((t) => t.sessionsJoined.length >= 3)
    .sort((a, b) => {
      if (b.stats.winRate !== a.stats.winRate) {
        return b.stats.winRate - a.stats.winRate;
      }
      return b.stats.totalWins - a.stats.totalWins;
    });

  const inContentionMonthly = tributes
    .filter((t) => t.sessionsJoined.length < 3)
    .sort((a, b) => b.sessionsJoined.length - a.sessionsJoined.length);

  // Compute Sponsor Gift Leaderboard for selected gift
  const giftLeaders = [...tributes]
    .map((t) => ({
      player: t,
      giftCount: t.sponsorGifts?.[selectedGiftType] || 0,
    }))
    .filter((entry) => entry.giftCount > 0)
    .sort((a, b) => b.giftCount - a.giftCount);

  // Overall top gift recipient
  const allGiftLeadersSummary = [...TECHNICAL_SKILLS, ...CHARACTER_SPORTSMANSHIP].map((giftName) => {
    let topTribute: Player | null = null;
    let maxCount = 0;
    tributes.forEach((t) => {
      const c = t.sponsorGifts?.[giftName] || 0;
      if (c > maxCount) {
        maxCount = c;
        topTribute = t;
      }
    });
    return {
      giftName,
      topTribute,
      maxCount,
      type: (TECHNICAL_SKILLS as readonly string[]).includes(giftName) ? 'Technical' : 'Character',
    };
  });

  // Monthly Sponsor's Gift Leaderboard (Qualified tributes >= 3 sessions)
  const monthlyGiftLeaders = qualifyingMonthly
    .map((tribute) => {
      const gifts = tribute.sponsorGifts || {};
      const techTotal = TECHNICAL_SKILLS.reduce((sum, s) => sum + (gifts[s] || 0), 0);
      const charTotal = CHARACTER_SPORTSMANSHIP.reduce((sum, c) => sum + (gifts[c] || 0), 0);
      const allTotal = techTotal + charTotal;

      const focusCount =
        monthlyGiftFilter === 'All'
          ? allTotal
          : monthlyGiftFilter === 'Technical'
          ? techTotal
          : monthlyGiftFilter === 'Character'
          ? charTotal
          : gifts[monthlyGiftFilter] || 0;

      const topGifts = Object.entries(gifts)
        .filter(([_, c]) => typeof c === 'number' && c > 0)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 3)
        .map(([name, count]) => `${count} ${name}`)
        .join(', ');

      return {
        tribute,
        techTotal,
        charTotal,
        allTotal,
        focusCount,
        topGifts,
      };
    })
    .filter((entry) => entry.focusCount > 0)
    .sort((a, b) => b.focusCount - a.focusCount || b.allTotal - a.allTotal);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-400">
              The Capitol Archives
            </span>
          </div>
          <h2 className="font-cinzel text-2xl md:text-3xl font-extrabold text-amber-100 mt-1">
            Hall of Victors & Honors
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Tracking match supremacy, sponsor favor, and monthly qualifications across Panem.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#141722] border border-neutral-800 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('victors')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'victors'
                ? 'bg-amber-500 text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Victors
          </button>
          <button
            onClick={() => setActiveTab('gifts')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'gifts'
                ? 'bg-amber-500 text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Sponsor's Gifts
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              activeTab === 'monthly'
                ? 'bg-amber-500 text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Month's Leaderboard
          </button>
        </div>
      </div>

      {/* TAB 1: VICTORS LEADERBOARD */}
      {activeTab === 'victors' && (
        <div className="space-y-5">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-neutral-400 font-mono mr-2">Filter Tier:</span>
            {['All', ...SKILL_CATEGORIES].map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg border whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                      : 'bg-[#151722] border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-amber-900/40 shadow-xl overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-neutral-800 text-neutral-400 font-mono uppercase text-[11px]">
                <tr>
                  <th className="py-3 px-3">Rank</th>
                  <th className="py-3 px-3">Tribute</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">District</th>
                  <th className="py-3 px-3 text-right">Battles</th>
                  <th className="py-3 px-3 text-right">Wins</th>
                  <th className="py-3 px-3 text-right">Loses</th>
                  <th className="py-3 px-3 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-850">
                {sortedVictors.map((tribute, idx) => {
                  const rank = idx + 1;
                  const isTop3 = rank <= 3;
                  const rankColor =
                    rank === 1
                      ? 'text-amber-400 bg-amber-500/10 border-amber-500/40'
                      : rank === 2
                      ? 'text-slate-200 bg-slate-500/10 border-slate-400/30'
                      : rank === 3
                      ? 'text-amber-600 bg-amber-700/10 border-amber-700/30'
                      : 'text-neutral-400 bg-neutral-800 border-neutral-700';

                  return (
                    <tr
                      key={tribute.id}
                      onClick={() => handleInspectTribute(tribute)}
                      className="hover:bg-neutral-800/30 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3">
                        <span
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-cinzel font-bold text-xs border ${rankColor}`}
                        >
                          {rank}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <TributeAvatar
                            name={tribute.name}
                            avatarUrl={tribute.avatarUrl}
                            size="sm"
                          />
                          <span className="font-semibold text-neutral-100 hover:text-amber-300 transition-colors">
                            {tribute.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-amber-300/90 font-medium">{tribute.category}</td>
                      <td className="py-3 px-3 text-neutral-400">
                        {CATEGORY_TO_DISTRICT[tribute.category] || tribute.district}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-300">
                        {tribute.stats.totalGames}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-emerald-400">
                        {tribute.stats.totalWins}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-400">
                        {tribute.stats.totalLoses}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums font-extrabold text-amber-300 text-sm">
                        {tribute.stats.winRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SPONSOR'S GIFT LEADERBOARD */}
      {activeTab === 'gifts' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/30 flex items-center justify-between text-xs text-neutral-300">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-400" />
              <span>
                Discover which tributes hold the highest honors in each Technical Skill and
                Sportsmanship discipline.
              </span>
            </div>
            <span className="text-amber-400 font-mono text-[11px]">Bestowed by Peers</span>
          </div>

          {/* Gift Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2 font-mono">
              Select Specific Sponsor Gift to View Rankings:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[...TECHNICAL_SKILLS, ...CHARACTER_SPORTSMANSHIP].map((giftName) => {
                const isSelected = selectedGiftType === giftName;
                const isTech = (TECHNICAL_SKILLS as readonly string[]).includes(giftName);

                return (
                  <button
                    key={giftName}
                    onClick={() => setSelectedGiftType(giftName)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-black border-amber-400 font-bold shadow-md'
                        : 'bg-[#151822] text-neutral-300 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <span>{giftName}</span>
                    <span
                      className={`ml-1.5 text-[9px] uppercase font-mono ${
                        isSelected ? 'text-black/70' : 'text-neutral-500'
                      }`}
                    >
                      {isTech ? 'Tech' : 'Virtue'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ranking for Selected Gift */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-amber-900/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  Category Leaderboard
                </span>
                <h3 className="font-cinzel text-lg font-bold text-amber-100">
                  Top Bestowals for: {selectedGiftType}
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {giftLeaders.length} tributes received this gift
              </span>
            </div>

            {giftLeaders.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                No tributes have received this gift yet. Bestow it after your next match!
              </div>
            ) : (
              <div className="space-y-2">
                {giftLeaders.map(({ player, giftCount }, idx) => (
                  <div
                    key={player.id}
                    onClick={() => handleInspectTribute(player)}
                    className="p-3.5 rounded-xl bg-[#151824] border border-neutral-800 hover:border-amber-700/60 transition-all flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg inline-flex items-center justify-center font-cinzel font-bold text-xs shrink-0 ${
                          idx === 0
                            ? 'bg-amber-500 text-black font-extrabold'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <TributeAvatar
                        name={player.name}
                        avatarUrl={player.avatarUrl}
                        size="sm"
                      />
                      <div>
                        <span className="text-sm font-semibold text-neutral-100">
                          {player.name}
                        </span>
                        <div className="text-xs text-neutral-400 mt-0.5">
                          {player.category} · {CATEGORY_TO_DISTRICT[player.category] || player.district}
                        </div>
                        {(() => {
                          const top3 = Object.entries(player.sponsorGifts || {})
                            .filter(([_, c]) => typeof c === 'number' && c > 0)
                            .sort((a, b) => (b[1] as number) - (a[1] as number))
                            .slice(0, 3)
                            .map(([n, c]) => `${c} ${n}`)
                            .join(', ');
                          return top3 ? (
                            <div className="text-[11px] text-amber-300/90 font-mono mt-1">
                              Top: {top3}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-extrabold font-cinzel text-amber-300 tabular-nums">
                        {giftCount}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono block">
                        Gifts Awarded
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Champions Grid */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-amber-900/40 shadow-xl space-y-4">
            <h3 className="font-cinzel text-base font-bold text-amber-100">
              Discipline Champions Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {allGiftLeadersSummary.map(({ giftName, topTribute, maxCount, type }) => (
                <div
                  key={giftName}
                  onClick={() => setSelectedGiftType(giftName)}
                  className="p-3 rounded-xl bg-[#151722] border border-neutral-800 hover:border-amber-700/60 transition-colors cursor-pointer text-xs"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-neutral-200">{giftName}</span>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase">{type}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <div className="flex items-center gap-2 min-w-0">
                      {topTribute && (
                        <TributeAvatar
                          name={(topTribute as Player).name}
                          avatarUrl={(topTribute as Player).avatarUrl}
                          size="xs"
                        />
                      )}
                      <span className="text-amber-300 font-medium truncate max-w-[125px]">
                        {topTribute ? (topTribute as Player).name : 'None'}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-neutral-300 font-semibold shrink-0">
                      {maxCount > 0 ? `${maxCount} gifts` : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MONTH'S LEADERBOARD */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          {/* Rule Card: Must join 3 sessions */}
          <div className="p-5 rounded-2xl bg-amber-950/30 border-2 border-amber-500/80 shadow-lg space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" />
              <h3 className="font-cinzel text-lg font-bold text-amber-200">
                The Shuttle Games Monthly Honors: {formatMonthYear(activeMonth)}
              </h3>
            </div>
            <div className="text-xs text-neutral-300 leading-relaxed">
              <strong className="text-amber-300">Qualification Rule:</strong> A tribute can enter
              the Monthly Leaderboard once they have participated in{' '}
              <strong className="text-amber-300 underline underline-offset-2">
                at least 3 queue sessions
              </strong>{' '}
              within the server registry. This ensures sustained arena dedication and fair ranking.
            </div>
          </div>

          {/* Qualified Monthly Victors */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-amber-900/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                  Qualified Tributes (≥ 3 Sessions)
                </span>
                <h3 className="font-cinzel text-lg font-bold text-amber-100">
                  Official Monthly Standings
                </h3>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {qualifyingMonthly.length} Qualified Victors
              </span>
            </div>

            {qualifyingMonthly.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                No tributes have met the 3-session requirement yet this month.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 text-neutral-400 font-mono uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Tribute</th>
                      <th className="py-2.5 px-3">Tier</th>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3 text-right">Sessions</th>
                      <th className="py-2.5 px-3 text-right">Wins</th>
                      <th className="py-2.5 px-3 text-right">Loses</th>
                      <th className="py-2.5 px-3 text-right">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {qualifyingMonthly.map((tribute, idx) => (
                      <tr
                        key={tribute.id}
                        onClick={() => handleInspectTribute(tribute)}
                        className="hover:bg-neutral-800/20 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-3 font-cinzel font-bold text-amber-400">
                          #{idx + 1}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <TributeAvatar
                              name={tribute.name}
                              avatarUrl={tribute.avatarUrl}
                              size="sm"
                            />
                            <span className="font-semibold text-neutral-100 hover:text-amber-300 transition-colors">
                              {tribute.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-amber-300 font-medium">{tribute.category}</td>
                        <td className="py-3 px-3 text-neutral-400">
                          {CATEGORY_TO_DISTRICT[tribute.category] || tribute.district}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-400 font-bold">
                          {tribute.sessionsJoined.length} / 3 ✓
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-neutral-200">
                          {tribute.stats.totalWins}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-400">
                          {tribute.stats.totalLoses}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-extrabold text-amber-300 text-sm">
                          {tribute.stats.winRate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Monthly Sponsor's Gift Leaderboard */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-amber-900/40 shadow-xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                    Monthly Sponsor's Gift Honors (≥ 3 Sessions)
                  </span>
                </div>
                <h3 className="font-cinzel text-lg font-bold text-amber-100 mt-0.5">
                  Monthly Sponsor's Gift Leaderboard
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-mono text-neutral-400">Filter:</span>
                <select
                  value={monthlyGiftFilter}
                  onChange={(e) => setMonthlyGiftFilter(e.target.value)}
                  className="px-3 py-1.5 bg-[#151824] border border-amber-900/60 rounded-lg text-xs text-amber-200 font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value="All">All Sponsor's Gifts (Total)</option>
                  <option value="Technical">Technical Skills (Total)</option>
                  <option value="Character">Character &amp; Sportsmanship (Total)</option>
                  <optgroup label="Technical Skills">
                    {TECHNICAL_SKILLS.map((skill) => (
                      <option key={skill} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Character &amp; Sportsmanship">
                    {CHARACTER_SPORTSMANSHIP.map((trait) => (
                      <option key={trait} value={trait}>
                        {trait}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>
            </div>

            {monthlyGiftLeaders.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                No qualified tributes have received{' '}
                {monthlyGiftFilter === 'All' ? "Sponsor's Gifts" : monthlyGiftFilter} yet this
                month.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-neutral-800 text-neutral-400 font-mono uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Tribute</th>
                      <th className="py-2.5 px-3">District</th>
                      <th className="py-2.5 px-3">Top Gifts Received</th>
                      <th className="py-2.5 px-3 text-right">Technical</th>
                      <th className="py-2.5 px-3 text-right">Character</th>
                      <th className="py-2.5 px-3 text-right">
                        {monthlyGiftFilter === 'All'
                          ? 'Total Gifts'
                          : monthlyGiftFilter === 'Technical'
                          ? 'Tech Gifts'
                          : monthlyGiftFilter === 'Character'
                          ? 'Char Gifts'
                          : monthlyGiftFilter}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-850">
                    {monthlyGiftLeaders.map(
                      ({ tribute, techTotal, charTotal, focusCount, topGifts }, idx) => (
                        <tr
                          key={tribute.id}
                          onClick={() => handleInspectTribute(tribute)}
                          className="hover:bg-neutral-800/20 transition-colors cursor-pointer"
                        >
                          <td className="py-3 px-3 font-cinzel font-bold text-amber-400">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <TributeAvatar
                                name={tribute.name}
                                avatarUrl={tribute.avatarUrl}
                                size="sm"
                              />
                              <div>
                                <span className="font-semibold text-neutral-100 hover:text-amber-300 transition-colors">
                                  {tribute.name}
                                </span>
                                <span className="block text-[10px] text-amber-300/80 font-mono">
                                  {tribute.category}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-neutral-400">
                            {CATEGORY_TO_DISTRICT[tribute.category] || tribute.district}
                          </td>
                          <td className="py-3 px-3 text-amber-200/90 font-mono text-[11px]">
                            {topGifts || '-'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-300">
                            {techTotal}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums text-neutral-300">
                            {charTotal}
                          </td>
                          <td className="py-3 px-3 text-right font-mono tabular-nums font-extrabold text-amber-300 text-sm">
                            {focusCount}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* In Contention (Tributes approaching qualification: 1 or 2 sessions) */}
          <div className="p-6 rounded-2xl bg-[#12141c] border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-amber-400/80 font-bold block">
                  In Contention
                </span>
                <h3 className="font-cinzel text-base font-bold text-neutral-200">
                  Approaching Monthly Qualification (&lt; 3 Sessions)
                </h3>
              </div>
              <span className="text-xs text-neutral-500 font-mono">
                Join {3 - (inContentionMonthly[0]?.sessionsJoined.length || 0)} more session to enter
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {inContentionMonthly.map((tribute) => {
                const attended = tribute.sessionsJoined.length;
                const needed = 3 - attended;

                return (
                  <div
                    key={tribute.id}
                    onClick={() => handleInspectTribute(tribute)}
                    className="p-3.5 rounded-xl bg-[#151722] border border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <TributeAvatar
                          name={tribute.name}
                          avatarUrl={tribute.avatarUrl}
                          size="xs"
                        />
                        <span className="font-semibold text-neutral-100 truncate">
                          {tribute.name}
                        </span>
                      </div>
                      <span className="font-mono text-amber-400 font-bold shrink-0">
                        {attended} / 3
                      </span>
                    </div>
                    <div className="text-neutral-400">
                      {tribute.category} · {CATEGORY_TO_DISTRICT[tribute.category] || tribute.district}
                    </div>
                    <div className="text-[11px] text-amber-500/90 font-mono">
                      Needs {needed} more {needed === 1 ? 'session' : 'sessions'} to qualify
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
