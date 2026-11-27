import React, { useState, useEffect } from 'react';
import { Gift, Check, Sparkles, AlertCircle, Shield, Award } from 'lucide-react';
import {
  CourtMatch,
  Player,
  TechnicalSkill,
  CharacterTrait,
  TECHNICAL_SKILLS,
  CHARACTER_SPORTSMANSHIP,
  SponsorGiftPayload,
} from '../types';
import { submitSponsorGifts } from '../utils/storage';
import { playSponsorGiftChime } from '../utils/audio';
import { TributeAvatar } from './TributeAvatar';

interface SponsorGiftModalProps {
  isOpen: boolean;
  match: CourtMatch;
  currentPlayer: Player;
  onGiftsSubmitted: () => void;
}

interface RecipientAllocation {
  player: Player;
  role: 'teammate' | 'opponent1' | 'opponent2';
  roleLabel: string;
  technicalSkill: TechnicalSkill | null;
  characterTrait: CharacterTrait | null;
}

function buildInitialRecipients(match: CourtMatch, currentPlayer: Player): RecipientAllocation[] {
  const inTeam1 =
    match.team1.player1.id === currentPlayer.id || match.team1.player2?.id === currentPlayer.id;

  const myTeam = inTeam1 ? match.team1 : match.team2;
  const opposingTeam = inTeam1 ? match.team2 : match.team1;

  const teammate =
    myTeam.player1.id === currentPlayer.id ? myTeam.player2 : myTeam.player1;
  const opponent1 = opposingTeam.player1;
  const opponent2 = opposingTeam.player2;

  const list: RecipientAllocation[] = [];
  if (teammate) {
    list.push({
      player: teammate,
      role: 'teammate',
      roleLabel: 'Teammate',
      technicalSkill: null,
      characterTrait: null,
    });
  }
  if (opponent1) {
    list.push({
      player: opponent1,
      role: 'opponent1',
      roleLabel: 'Opponent 1',
      technicalSkill: null,
      characterTrait: null,
    });
  }
  if (opponent2) {
    list.push({
      player: opponent2,
      role: 'opponent2',
      roleLabel: 'Opponent 2',
      technicalSkill: null,
      characterTrait: null,
    });
  }
  return list;
}

export const SponsorGiftModal: React.FC<SponsorGiftModalProps> = ({
  isOpen,
  match,
  currentPlayer,
  onGiftsSubmitted,
}) => {
  const [recipientsState, setRecipientsState] = useState<RecipientAllocation[]>(() =>
    buildInitialRecipients(match, currentPlayer)
  );
  const [activeRecipientIdx, setActiveRecipientIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setRecipientsState(buildInitialRecipients(match, currentPlayer));
    setActiveRecipientIdx(0);
    setErrorMsg(null);
  }, [match.id, currentPlayer.id]);

  if (!isOpen) return null;

  const activeRecipient = recipientsState[activeRecipientIdx] || recipientsState[0];

  const handleSelectSkill = (skill: TechnicalSkill) => {
    setRecipientsState((prev) => {
      const next = [...prev];
      next[activeRecipientIdx] = {
        ...next[activeRecipientIdx],
        technicalSkill: skill,
      };
      return next;
    });
    setErrorMsg(null);
  };

  const handleSelectTrait = (trait: CharacterTrait) => {
    setRecipientsState((prev) => {
      const next = [...prev];
      const currentTrait = next[activeRecipientIdx].characterTrait;
      next[activeRecipientIdx] = {
        ...next[activeRecipientIdx],
        // Toggle off if clicking the same optional trait again
        characterTrait: currentTrait === trait ? null : trait,
      };
      return next;
    });
    setErrorMsg(null);
  };

  // Technical Skill is REQUIRED for all recipients; Character & Sportsmanship is OPTIONAL
  const technicalAllocated = recipientsState.filter((r) => Boolean(r.technicalSkill)).length;
  const requiredCount = recipientsState.length;
  const allTechnicalSelected = technicalAllocated === requiredCount && requiredCount > 0;
  const optionalTraitCount = recipientsState.filter((r) => Boolean(r.characterTrait)).length;
  const totalBestowed = technicalAllocated + optionalTraitCount;

  const handleSubmit = () => {
    if (!allTechnicalSelected) {
      setErrorMsg(
        `Please select a Technical Skill (Required) for all ${requiredCount} tributes before continuing.`
      );
      return;
    }

    const payload: SponsorGiftPayload = {
      matchId: match.id,
      giverId: currentPlayer.id,
      recipients: recipientsState.map((r) => ({
        playerId: r.player.id,
        playerName: r.player.name,
        role: r.role,
        technicalSkill: r.technicalSkill!,
        characterTrait: r.characterTrait || undefined,
      })),
    };

    submitSponsorGifts(payload);
    playSponsorGiftChime();
    onGiftsSubmitted();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/75 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#12141c] border border-stone-200 dark:border-amber-800/60 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Capitol Banner Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200 dark:border-amber-950/80 bg-gradient-to-r from-amber-50/90 via-stone-50 to-amber-50/90 dark:from-amber-950/50 dark:via-[#181a24] dark:to-amber-950/50 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 border border-amber-300 dark:border-amber-500/50 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <span className="font-cinzel text-base sm:text-lg font-bold text-stone-900 dark:text-amber-200 tracking-wide block">
                Bestow Sponsor's Gifts
              </span>
              <span className="text-xs text-amber-700 dark:text-amber-500/80 block">
                Submitting automatically returns you to The Reaping Queue
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <div className="text-xs font-mono font-bold tabular-nums text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-500/10 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-500/30">
              {technicalAllocated}/{requiredCount} Tech · {optionalTraitCount} Char
            </div>
          </div>
        </div>

        {/* Rule explanation strip */}
        <div className="px-5 sm:px-6 py-2.5 bg-amber-50/70 dark:bg-amber-950/20 border-b border-stone-200 dark:border-amber-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-stone-600 dark:text-neutral-300">
          <span>
            <strong className="text-amber-800 dark:text-amber-300">Technical Skill is Required</strong> (1 per tribute).{' '}
            <strong className="text-stone-900 dark:text-neutral-200">Character & Sportsmanship is Optional.</strong>
          </span>
          <span className="text-amber-700 dark:text-amber-400/90 font-mono text-[11px] shrink-0">
            {allTechnicalSelected ? 'Ready · Auto Re-Join Enabled' : `${requiredCount - technicalAllocated} Tech Required`}
          </span>
        </div>

        {/* Main Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5">
          {/* Recipient Selector Tabs */}
          <div className="flex sm:grid sm:grid-cols-3 gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            {recipientsState.map((r, idx) => {
              const hasTech = !!r.technicalSkill;
              const hasTrait = !!r.characterTrait;
              const isSelected = activeRecipientIdx === idx;

              return (
                <button
                  key={r.player.id}
                  type="button"
                  onClick={() => setActiveRecipientIdx(idx)}
                  className={`min-w-[148px] shrink-0 sm:min-w-0 min-h-[68px] p-2.5 sm:p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm dark:shadow-amber-950/40'
                      : 'bg-stone-50 dark:bg-[#161822] border-stone-200 dark:border-neutral-800 hover:border-stone-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono tracking-wider uppercase text-amber-700 dark:text-amber-400">
                      {r.roleLabel}
                    </span>
                    {hasTech ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
                        {hasTrait ? '2/2 ✓' : 'Tech ✓'}
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-700 dark:text-amber-400/80 font-mono">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <TributeAvatar
                      name={r.player.name}
                      avatarUrl={r.player.avatarUrl}
                      size="xs"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-stone-900 dark:text-neutral-100 truncate">
                        {r.player.name}
                      </div>
                      <div className="text-xs text-stone-500 dark:text-neutral-400 truncate">
                        {r.player.district}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {activeRecipient && (
            <div className="space-y-5">
              {/* Recipient banner */}
              <div className="p-3.5 rounded-lg bg-stone-50 dark:bg-[#181b26] border border-stone-200 dark:border-neutral-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs text-amber-700 dark:text-amber-500/80 uppercase tracking-widest font-mono">
                    Selecting Gifts for:
                  </span>
                  <div className="text-base font-bold text-stone-900 dark:text-neutral-100 truncate">
                    {activeRecipient.player.name}{' '}
                    <span className="text-xs font-normal text-stone-500 dark:text-neutral-400">
                      ({activeRecipient.roleLabel} · {activeRecipient.player.category})
                    </span>
                  </div>
                </div>
                <div className="text-right text-xs shrink-0">
                  <span className="text-stone-500 dark:text-neutral-400 block">Selected:</span>
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    {activeRecipient.technicalSkill || 'Tech Needed'} /{' '}
                    {activeRecipient.characterTrait || 'Optional'}
                  </span>
                </div>
              </div>

              {/* Section 1: Technical Skills (REQUIRED) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-cinzel text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    1. Technical Skill (Required · Pick 1)
                  </span>
                  {activeRecipient.technicalSkill ? (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Selected ✓</span>
                  ) : (
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-mono">Required</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {TECHNICAL_SKILLS.map((skill) => {
                    const isSelected = activeRecipient.technicalSkill === skill;
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleSelectSkill(skill)}
                        className={`min-h-[40px] px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-black border-amber-500 dark:border-amber-400 font-bold shadow-md dark:shadow-amber-950/50'
                            : 'bg-stone-50 dark:bg-[#151722] text-stone-700 dark:text-neutral-300 border-stone-200 dark:border-neutral-800 hover:border-amber-500/60 dark:hover:border-amber-700/60 hover:text-stone-900 dark:hover:text-white'
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Character & Sportsmanship (OPTIONAL) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold font-cinzel text-stone-800 dark:text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    2. Character & Sportsmanship (Optional · Tap to Toggle)
                  </span>
                  {activeRecipient.characterTrait ? (
                    <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Selected ✓</span>
                  ) : (
                    <span className="text-[11px] text-stone-500 dark:text-neutral-400 font-mono">Optional</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {CHARACTER_SPORTSMANSHIP.map((trait) => {
                    const isSelected = activeRecipient.characterTrait === trait;
                    return (
                      <button
                        key={trait}
                        type="button"
                        onClick={() => handleSelectTrait(trait)}
                        className={`min-h-[40px] px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-black border-amber-500 dark:border-amber-400 font-bold shadow-md dark:shadow-amber-950/50'
                            : 'bg-stone-50 dark:bg-[#151722] text-stone-700 dark:text-neutral-300 border-stone-200 dark:border-neutral-800 hover:border-amber-500/60 dark:hover:border-amber-700/60 hover:text-stone-900 dark:hover:text-white'
                        }`}
                      >
                        {trait}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/50 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-t border-stone-200 dark:border-amber-950/60 bg-stone-50 dark:bg-[#0e1017] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="text-xs text-stone-500 dark:text-neutral-400">
            {allTechnicalSelected ? (
              <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" /> {totalBestowed} gifts ready — submitting auto-joins The Reaping!
              </span>
            ) : (
              <span>
                Select Technical Skill for {requiredCount - technicalAllocated} more tribute(s)
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2">
            {activeRecipientIdx < recipientsState.length - 1 && (
              <button
                type="button"
                onClick={() => setActiveRecipientIdx((prev) => prev + 1)}
                className="min-h-[44px] px-4 py-2 text-xs font-semibold text-stone-700 dark:text-neutral-200 hover:text-stone-900 dark:hover:text-white bg-stone-200 dark:bg-neutral-800 rounded-xl transition-colors"
              >
                Next Tribute →
              </button>
            )}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allTechnicalSelected}
              className={`min-h-[46px] w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold font-cinzel transition-all shadow-lg flex items-center justify-center gap-2 ${
                allTechnicalSelected
                  ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black hover:from-amber-300 hover:to-amber-500 dark:shadow-amber-950/80 cursor-pointer active:scale-95'
                  : 'bg-stone-200 dark:bg-neutral-800 text-stone-500 dark:text-neutral-500 border border-stone-300 dark:border-neutral-700/50 cursor-not-allowed opacity-60'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Bestow Gifts & Re-Join Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
