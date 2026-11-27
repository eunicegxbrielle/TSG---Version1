import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  CATEGORY_TO_DISTRICT,
  CHARACTER_SPORTSMANSHIP,
  Player,
  SKILL_CATEGORIES,
  TECHNICAL_SKILLS,
} from '../../types';
import { TributeAvatar } from '../TributeAvatar';

interface VictorsV2Props {
  tributes: Player[];
  onViewProfile: (player: Player) => void;
  activeMonth: string;
}

export const VictorsV2: React.FC<VictorsV2Props> = ({
  tributes,
  onViewProfile,
  activeMonth,
}) => {
  const [activeTab, setActiveTab] = useState<'victors' | 'gifts' | 'monthly'>('victors');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGiftType, setSelectedGiftType] = useState<string>('Clear');
  const [monthlyGiftFilter, setMonthlyGiftFilter] = useState<string>('All');

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

  const sortedVictors = tributes
    .filter((t) => selectedCategory === 'All' || t.category === selectedCategory)
    .sort((a, b) =>
      b.stats.winRate !== a.stats.winRate
        ? b.stats.winRate - a.stats.winRate
        : b.stats.totalWins - a.stats.totalWins
    );

  const qualifyingMonthly = tributes
    .filter((t) => t.sessionsJoined.length >= 3)
    .sort((a, b) =>
      b.stats.winRate !== a.stats.winRate
        ? b.stats.winRate - a.stats.winRate
        : b.stats.totalWins - a.stats.totalWins
    );

  const inContentionMonthly = tributes
    .filter((t) => t.sessionsJoined.length < 3)
    .sort((a, b) => b.sessionsJoined.length - a.sessionsJoined.length);

  const giftLeaders = [...tributes]
    .map((t) => ({
      player: t,
      giftCount: t.sponsorGifts?.[selectedGiftType] || 0,
    }))
    .filter((entry) => entry.giftCount > 0)
    .sort((a, b) => b.giftCount - a.giftCount);

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
        .slice(0, 2)
        .map(([n, c]) => `${c} ${n}`)
        .join(', ');

      return { tribute, techTotal, charTotal, allTotal, focusCount, topGifts };
    })
    .filter((entry) => entry.focusCount > 0)
    .sort((a, b) => b.focusCount - a.focusCount || b.allTotal - a.allTotal);

  return (
    <div className="space-y-6">
      {/* Header + Segmented View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-stone-200 dark:border-white/[0.07] pb-4">
        <div>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium">Capitol Standings</span>
          <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-stone-900 dark:text-amber-100 mt-0.5">
            Hall of Victors
          </h1>
        </div>

        <div className="grid grid-cols-3 sm:inline-flex w-full sm:w-auto p-1 bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] rounded-xl text-xs shadow-xs dark:shadow-none">
          <button
            type="button"
            onClick={() => setActiveTab('victors')}
            className={`min-h-[42px] px-2.5 sm:px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'victors'
                ? 'bg-amber-400 text-black font-semibold'
                : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Victors
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('gifts')}
            className={`min-h-[42px] px-2.5 sm:px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'gifts'
                ? 'bg-amber-400 text-black font-semibold'
                : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Sponsor's Gifts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('monthly')}
            className={`min-h-[42px] px-2.5 sm:px-3.5 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'monthly'
                ? 'bg-amber-400 text-black font-semibold'
                : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Monthly
          </button>
        </div>
      </div>

      {/* TAB 1: VICTORS */}
      {activeTab === 'victors' && (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {['All', ...SKILL_CATEGORIES].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 border transition-colors ${
                  selectedCategory === cat
                    ? 'bg-amber-100 dark:bg-amber-500/15 border-amber-500 dark:border-amber-400 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'bg-white dark:bg-[#11131a] border-stone-200 dark:border-white/[0.07] text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] divide-y divide-stone-200 dark:divide-white/[0.06] overflow-hidden shadow-xs dark:shadow-none">
            {sortedVictors.map((tribute, idx) => (
              <button
                key={tribute.id}
                type="button"
                onClick={() => onViewProfile(tribute)}
                className="w-full min-h-[64px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-stone-50 dark:hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-6 text-xs font-cinzel font-bold tabular-nums shrink-0 ${
                      idx === 0
                        ? 'text-amber-700 dark:text-amber-300'
                        : idx < 3
                        ? 'text-amber-600 dark:text-amber-400/80'
                        : 'text-stone-500 dark:text-neutral-500'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <TributeAvatar name={tribute.name} avatarUrl={tribute.avatarUrl} size="sm" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-stone-900 dark:text-neutral-100 truncate">
                      {tribute.name}
                    </div>
                    <div className="text-xs text-stone-600 dark:text-neutral-400 truncate">
                      {tribute.category} · {CATEGORY_TO_DISTRICT[tribute.category] || tribute.district}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 text-right">
                  <div>
                    <div className="text-sm font-cinzel font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                      {tribute.stats.winRate}%
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-stone-600 dark:text-neutral-400">
                      {tribute.stats.totalWins}W · {tribute.stats.totalLoses}L
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-stone-400 dark:text-neutral-600" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: SPONSOR'S GIFT LEADERBOARD */}
      {activeTab === 'gifts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-stone-600 dark:text-neutral-400">
              Select a Technical Skill or Character discipline:
            </span>
            <select
              value={selectedGiftType}
              onChange={(e) => setSelectedGiftType(e.target.value)}
              className="w-full sm:w-64 min-h-[44px] px-3.5 py-2 bg-white dark:bg-[#11131a] border border-stone-300 dark:border-white/[0.1] rounded-xl text-xs text-stone-900 dark:text-amber-200 font-medium focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
            >
              <optgroup label="Technical Skills">
                {TECHNICAL_SKILLS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Character & Sportsmanship">
                {CHARACTER_SPORTSMANSHIP.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] divide-y divide-stone-200 dark:divide-white/[0.06] overflow-hidden shadow-xs dark:shadow-none">
            {giftLeaders.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 dark:text-neutral-500">
                No tributes have received {selectedGiftType} yet.
              </div>
            ) : (
              giftLeaders.map(({ player, giftCount }, idx) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => onViewProfile(player)}
                  className="w-full min-h-[64px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-stone-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-xs font-cinzel font-bold text-amber-700 dark:text-amber-400 tabular-nums shrink-0">
                      #{idx + 1}
                    </span>
                    <TributeAvatar name={player.name} avatarUrl={player.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-stone-900 dark:text-neutral-100 truncate">
                        {player.name}
                      </div>
                      <div className="text-xs text-stone-600 dark:text-neutral-400 truncate">
                        {player.category} · {CATEGORY_TO_DISTRICT[player.category] || player.district}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <span className="text-base font-cinzel font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                      {giftCount}
                    </span>
                    <span className="text-[11px] text-stone-500 dark:text-neutral-500 font-mono">gifts</span>
                    <ChevronRight className="w-4 h-4 text-stone-400 dark:text-neutral-600" />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MONTH'S LEADERBOARD */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-[#11131a] border border-amber-300 dark:border-amber-500/30 space-y-1">
            <h2 className="font-cinzel text-base sm:text-lg font-bold text-amber-900 dark:text-amber-200">
              The Shuttle Games Monthly Honors: {formatMonthYear(activeMonth)}
            </h2>
            <p className="text-xs text-stone-700 dark:text-neutral-400">
              Qualification requires joining at least 3 sessions this month.
            </p>
          </div>

          {/* Monthly Victors Standings */}
          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <h3 className="font-cinzel text-base font-bold text-stone-900 dark:text-amber-100">
                Monthly Victors
              </h3>
              <span className="text-xs text-stone-600 dark:text-neutral-400 font-mono tabular-nums">
                {qualifyingMonthly.length} Qualified
              </span>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] divide-y divide-stone-200 dark:divide-white/[0.06] overflow-hidden shadow-xs dark:shadow-none">
              {qualifyingMonthly.map((tribute, idx) => (
                <button
                  key={tribute.id}
                  type="button"
                  onClick={() => onViewProfile(tribute)}
                  className="w-full min-h-[64px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-stone-50 dark:hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-xs font-cinzel font-bold text-amber-700 dark:text-amber-400 tabular-nums shrink-0">
                      #{idx + 1}
                    </span>
                    <TributeAvatar name={tribute.name} avatarUrl={tribute.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-stone-900 dark:text-neutral-100 truncate">
                        {tribute.name}
                      </div>
                      <div className="text-xs text-stone-600 dark:text-neutral-400 truncate">
                        {CATEGORY_TO_DISTRICT[tribute.category] || tribute.district} ·{' '}
                        {tribute.sessionsJoined.length} sessions
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-cinzel font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                      {tribute.stats.winRate}%
                    </div>
                    <div className="text-[11px] font-mono tabular-nums text-stone-600 dark:text-neutral-400">
                      {tribute.stats.totalWins}W · {tribute.stats.totalLoses}L
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Monthly Sponsor's Gift Leaderboard */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-cinzel text-base font-bold text-stone-900 dark:text-amber-100">
                Monthly Sponsor's Gift Leaderboard
              </h3>
              <select
                value={monthlyGiftFilter}
                onChange={(e) => setMonthlyGiftFilter(e.target.value)}
                className="w-full sm:w-64 min-h-[44px] px-3 py-2 bg-white dark:bg-[#11131a] border border-stone-300 dark:border-white/[0.1] rounded-xl text-xs text-stone-900 dark:text-amber-200 font-medium focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
              >
                <option value="All">All Sponsor's Gifts</option>
                <option value="Technical">Technical Skills</option>
                <option value="Character">Character &amp; Sportsmanship</option>
                <optgroup label="Technical Skills">
                  {TECHNICAL_SKILLS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Character & Sportsmanship">
                  {CHARACTER_SPORTSMANSHIP.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] divide-y divide-stone-200 dark:divide-white/[0.06] overflow-hidden shadow-xs dark:shadow-none">
              {monthlyGiftLeaders.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-500 dark:text-neutral-500">
                  No qualified tributes have received this gift yet this month.
                </div>
              ) : (
                monthlyGiftLeaders.map(({ tribute, focusCount, topGifts }, idx) => (
                  <button
                    key={tribute.id}
                    type="button"
                    onClick={() => onViewProfile(tribute)}
                    className="w-full min-h-[64px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-stone-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 text-xs font-cinzel font-bold text-amber-700 dark:text-amber-400 tabular-nums shrink-0">
                        #{idx + 1}
                      </span>
                      <TributeAvatar name={tribute.name} avatarUrl={tribute.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-stone-900 dark:text-neutral-100 truncate">
                          {tribute.name}
                        </div>
                        <div className="text-xs text-stone-600 dark:text-neutral-400 truncate">
                          {topGifts || CATEGORY_TO_DISTRICT[tribute.category]}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base font-cinzel font-bold text-amber-700 dark:text-amber-300 tabular-nums">
                        {focusCount}
                      </div>
                      <div className="text-[10px] font-mono text-stone-500 dark:text-neutral-500">gifts</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Approaching Qualification */}
          {inContentionMonthly.length > 0 && (
            <div className="space-y-2.5">
              <h3 className="font-cinzel text-sm font-semibold text-stone-700 dark:text-neutral-300">
                Approaching Qualification (&lt; 3 Sessions)
              </h3>
              <div className="rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] divide-y divide-stone-200 dark:divide-white/[0.06] overflow-hidden shadow-xs dark:shadow-none">
                {inContentionMonthly.map((tribute) => (
                  <button
                    key={tribute.id}
                    type="button"
                    onClick={() => onViewProfile(tribute)}
                    className="w-full min-h-[56px] px-4 py-2.5 flex items-center justify-between gap-3 text-left hover:bg-stone-50 dark:hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <TributeAvatar name={tribute.name} avatarUrl={tribute.avatarUrl} size="xs" />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-medium text-stone-800 dark:text-neutral-200 truncate">
                          {tribute.name}
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-neutral-500 truncate">
                          {CATEGORY_TO_DISTRICT[tribute.category] || tribute.district}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-amber-700 dark:text-amber-400 tabular-nums shrink-0">
                      {tribute.sessionsJoined.length} / 3 sessions
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
