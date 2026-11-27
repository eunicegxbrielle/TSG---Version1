import React, { useState } from 'react';
import { Sparkles, Shield, Award, Search, Gift, ArrowDownWideNarrow } from 'lucide-react';
import {
  Player,
  TECHNICAL_SKILLS,
} from '../types';

interface SponsorGiftCollectionProps {
  currentPlayer: Player | null;
  onOpenPlayerModal: () => void;
}

interface ReceivedGiftItem {
  name: string;
  count: number;
  category: 'Technical' | 'Character';
}

export const SponsorGiftCollection: React.FC<SponsorGiftCollectionProps> = ({
  currentPlayer,
  onOpenPlayerModal,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'technical' | 'character'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!currentPlayer) {
    return (
      <div className="max-w-md mx-auto text-center py-16 bg-white dark:bg-[#12141c] border border-stone-200 dark:border-amber-900/40 rounded-2xl p-8 shadow-sm dark:shadow-none">
        <Gift className="w-10 h-10 text-amber-700 dark:text-amber-400 mx-auto mb-3 opacity-80" />
        <h3 className="font-cinzel text-lg font-bold text-stone-900 dark:text-amber-100 mb-1">
          No Tribute Selected
        </h3>
        <p className="text-xs text-stone-600 dark:text-neutral-400 mb-6">
          Please select or register your tribute profile to inspect your received Sponsor's Gifts.
        </p>
        <button
          onClick={onOpenPlayerModal}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-cinzel font-bold text-xs rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          Select Tribute Profile
        </button>
      </div>
    );
  }

  const rawGifts = currentPlayer.sponsorGifts || {};

  // Strictly extract gifts with count > 0, mapped with category
  const allReceivedGifts: ReceivedGiftItem[] = Object.entries(rawGifts)
    .filter(([_, count]) => typeof count === 'number' && count > 0)
    .map(([name, count]) => {
      const isTech = (TECHNICAL_SKILLS as readonly string[]).includes(name);
      const category: 'Technical' | 'Character' = isTech ? 'Technical' : 'Character';
      return {
        name,
        count: Number(count),
        category,
      };
    })
    // Sort descending by count (top gift first), secondary alphabetical
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  // Compute breakdown totals
  const totalAllGifts = allReceivedGifts.reduce((acc, g) => acc + g.count, 0);
  const totalTechGifts = allReceivedGifts
    .filter((g) => g.category === 'Technical')
    .reduce((acc, g) => acc + g.count, 0);
  const totalCharGifts = allReceivedGifts
    .filter((g) => g.category === 'Character')
    .reduce((acc, g) => acc + g.count, 0);

  // Filter according to selected tab and search query
  const displayedGifts = allReceivedGifts.filter((g) => {
    if (filterType === 'technical' && g.category !== 'Technical') return false;
    if (filterType === 'character' && g.category !== 'Character') return false;
    if (searchQuery.trim() && !g.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Header with Mockingjay Badminton Crest Asset */}
      <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#12141c] border border-stone-200 dark:border-amber-900/50 shadow-sm dark:shadow-2xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-amber-500/80 shadow-md dark:shadow-xl dark:shadow-amber-950/50 shrink-0 bg-stone-200 dark:bg-neutral-900">
          <img
            src="/src/assets/images/mockingjay_badminton_crest_1794230312788.jpg"
            alt="Mockingjay Badminton Crest"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="text-center md:text-left flex-1">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span className="text-xs font-mono uppercase tracking-widest text-amber-700 dark:text-amber-400 font-bold">
              Capitol Vault & Treasury
            </span>
          </div>
          <h2 className="font-cinzel text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-amber-100 mt-1">
            Sponsor's Gift Collection
          </h2>
          <p className="text-xs text-stone-600 dark:text-neutral-300 mt-1 max-w-xl">
            Tokens of esteem and admiration bestowed by teammates and adversaries after each arena
            battle. Only received gifts are displayed, ordered from highest acclaim.
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-4 text-xs font-mono">
            <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-400 dark:border-amber-500/30 text-amber-900 dark:text-amber-300 font-bold tabular-nums">
              {totalAllGifts} Total Gifts Received
            </span>
            <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300 tabular-nums">
              {totalTechGifts} Technical ({allReceivedGifts.filter((g) => g.category === 'Technical').length} Disciplines)
            </span>
            <span className="px-3 py-1 rounded-full bg-stone-100 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300 tabular-nums">
              {totalCharGifts} Character ({allReceivedGifts.filter((g) => g.category === 'Character').length} Virtues)
            </span>
          </div>
        </div>

        <button
          onClick={onOpenPlayerModal}
          className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 underline underline-offset-4 self-center md:self-start shrink-0 font-medium"
        >
          Viewing: {currentPlayer.name} ({currentPlayer.district})
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Segmented Filter */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/80 dark:bg-[#151722] border border-stone-300 dark:border-neutral-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'all'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            All Received Gifts ({allReceivedGifts.length})
          </button>
          <button
            onClick={() => setFilterType('technical')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'technical'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Technical Skills ({allReceivedGifts.filter((g) => g.category === 'Technical').length})
          </button>
          <button
            onClick={() => setFilterType('character')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterType === 'character'
                ? 'bg-amber-500 text-black font-semibold shadow-sm'
                : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            Character & Sportsmanship ({allReceivedGifts.filter((g) => g.category === 'Character').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-3.5 h-3.5 text-stone-400 dark:text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search received gifts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-white dark:bg-[#151722] border border-stone-300 dark:border-neutral-800 rounded-xl text-xs text-stone-900 dark:text-neutral-200 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Grid of Received Gifts (strictly sorted descending, NO 0-count gifts shown) */}
      {displayedGifts.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#12141c] border border-stone-200 dark:border-neutral-800 space-y-3">
          <Gift className="w-10 h-10 text-stone-400 dark:text-neutral-600 mx-auto" />
          <h4 className="font-cinzel text-base font-bold text-stone-800 dark:text-neutral-300">
            {allReceivedGifts.length === 0
              ? "No Sponsor's Gifts Received Yet"
              : 'No matching gifts found'}
          </h4>
          <p className="text-xs text-stone-600 dark:text-neutral-400 max-w-md mx-auto">
            {allReceivedGifts.length === 0
              ? 'Tributes receive Sponsor Gifts from allies and opponents after concluding an arena match. Enter The Reaping to earn your first accolade!'
              : 'Try clearing your search query or switching category filters.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-neutral-800 pb-2">
            <div className="flex items-center gap-2">
              <ArrowDownWideNarrow className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              <h3 className="font-cinzel text-base font-bold text-stone-900 dark:text-amber-100">
                Received Gifts ({displayedGifts.length} Bestowals)
              </h3>
            </div>
            <span className="text-xs text-stone-500 dark:text-neutral-400 font-mono">
              Ordered by highest count
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {displayedGifts.map((gift, idx) => {
              const isTop = idx === 0;
              const isTop3 = idx < 3;
              const isTech = gift.category === 'Technical';

              return (
                <div
                  key={gift.name}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between hover:scale-[1.02] ${
                    isTop
                      ? 'bg-gradient-to-b from-amber-50 to-amber-100/80 dark:from-[#1c1d29] dark:to-[#141622] border-amber-400 dark:border-amber-500/80 shadow-md dark:shadow-lg dark:shadow-amber-950/40 ring-1 ring-amber-400/50 dark:ring-amber-500/30'
                      : isTop3
                      ? 'bg-amber-50/40 dark:bg-[#161824] border-amber-300 dark:border-amber-700/60 shadow-sm dark:shadow-md'
                      : 'bg-white dark:bg-[#141622] border-stone-200 dark:border-neutral-800 hover:border-amber-400 dark:hover:border-amber-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        isTop
                          ? 'bg-amber-500 text-black font-extrabold'
                          : isTop3
                          ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold border border-amber-400 dark:border-amber-500/30'
                          : 'bg-stone-200 dark:bg-neutral-800 text-stone-600 dark:text-neutral-400'
                      }`}
                    >
                      #{idx + 1}
                    </span>
                    <span className="text-2xl font-cinzel font-black tabular-nums text-amber-700 dark:text-amber-300">
                      {gift.count}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-neutral-100 truncate">{gift.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      {isTech ? (
                        <Shield className="w-3 h-3 text-amber-700 dark:text-amber-400/80 shrink-0" />
                      ) : (
                        <Award className="w-3 h-3 text-amber-700 dark:text-amber-400/80 shrink-0" />
                      )}
                      <span className="text-[10px] text-stone-600 dark:text-neutral-400 font-mono truncate">
                        {isTech ? 'Technical Skill' : 'Character & Sport'}
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400/80 block mt-1.5 font-mono">
                      {gift.count} {gift.count === 1 ? 'gift received' : 'gifts received'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
