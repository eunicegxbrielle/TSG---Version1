import React, { useState, useRef } from 'react';
import { X, UserPlus, Check, Upload } from 'lucide-react';
import { CATEGORY_TO_DISTRICT, Player, SKILL_CATEGORIES, SkillCategory } from '../types';
import { createOrUpdatePlayer, getTributes, setCurrentPlayerId } from '../utils/storage';
import { TributeAvatar } from './TributeAvatar';
import { PRESET_AVATARS, resizeImageFileToDataUrl } from '../utils/avatars';

interface TributeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player | null;
  onSelectPlayer: (player: Player) => void;
  onViewProfile?: (player: Player) => void;
}

export const TributeLoginModal: React.FC<TributeLoginModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  onSelectPlayer,
  onViewProfile,
}) => {
  const [mode, setMode] = useState<'switch' | 'create'>('switch');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Intermediate');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const allTributes = getTributes();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageFileToDataUrl(file, 256);
      setAvatarUrl(dataUrl);
      setUploadError(null);
    } catch {
      setUploadError('Could not load that image. Try a JPG or PNG file.');
    }
  };

  const handleCreateOrLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tribute = createOrUpdatePlayer(
      name.trim(),
      category,
      bio.trim() || undefined,
      avatarUrl || undefined
    );
    onSelectPlayer(tribute);
    setName('');
    setBio('');
    setAvatarUrl('');
    setUploadError(null);
    onClose();
  };

  const handleSelectExisting = (tribute: Player) => {
    setCurrentPlayerId(tribute.id);
    onSelectPlayer(tribute);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#111319] border border-amber-900/60 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-amber-950/60 flex items-center justify-between bg-gradient-to-r from-neutral-900 via-[#151821] to-neutral-900">
          <div>
            <span className="font-cinzel text-lg font-bold text-amber-200 tracking-wide block">
              Tribute Registration
            </span>
            <span className="text-xs text-neutral-400">
              The Shuttle Games · Official Player Roster
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-amber-200 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch / create */}
        <div className="flex border-b border-neutral-800 bg-[#0e1015]">
          <button
            onClick={() => setMode('switch')}
            className={`flex-1 py-3 text-xs font-semibold tracking-wider uppercase transition-colors border-b-2 ${
              mode === 'switch'
                ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Select Tribute ({allTributes.length})
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-3 text-xs font-semibold tracking-wider uppercase transition-colors border-b-2 ${
              mode === 'create'
                ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            New Tribute Registration
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {mode === 'switch' ? (
            <div className="space-y-2.5">
              <p className="text-xs text-neutral-400 mb-3">
                Select your tribute profile to enter The Reaping, or tap their photo to view/edit profile:
              </p>
              <div className="grid gap-2">
                {allTributes.map((tribute) => {
                  const isCurrent = currentPlayer?.id === tribute.id;
                  const districtLabel = CATEGORY_TO_DISTRICT[tribute.category] || tribute.district;

                  return (
                    <div
                      key={tribute.id}
                      onClick={() => handleSelectExisting(tribute)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between cursor-pointer ${
                        isCurrent
                          ? 'bg-amber-950/30 border-amber-500/80 shadow-sm'
                          : 'bg-[#151822] border-neutral-800/80 hover:border-amber-700/60 hover:bg-[#1a1e2b]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <TributeAvatar
                          name={tribute.name}
                          avatarUrl={tribute.avatarUrl}
                          size="md"
                          onClick={
                            onViewProfile
                              ? (e) => {
                                  e.stopPropagation();
                                  onClose();
                                  onViewProfile(tribute);
                                }
                              : undefined
                          }
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-100 truncate">
                              {tribute.name}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] text-amber-400 font-mono tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30 shrink-0">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                            <span className="text-amber-400/90 font-medium">{tribute.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-neutral-300 font-semibold">{districtLabel}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs font-mono tabular-nums text-neutral-300">
                          {tribute.stats.totalWins}W · {tribute.stats.totalLoses}L
                        </div>
                        <div className="text-[11px] text-amber-400/80 font-mono tabular-nums">
                          {tribute.stats.winRate}% Win Rate
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 text-center">
                <button
                  onClick={() => setMode('create')}
                  className="inline-flex items-center gap-2 text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Register a new tribute name
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreateOrLogin} className="space-y-4">
              {/* Profile Picture */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-[#161922] border border-neutral-800">
                <TributeAvatar
                  name={name || 'New Tribute'}
                  avatarUrl={avatarUrl || undefined}
                  size="lg"
                />
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Photo
                    </button>
                    <span className="text-[10px] font-mono text-neutral-400">or pick crest:</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {PRESET_AVATARS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatarUrl(preset.url)}
                        title={preset.label}
                        className={`rounded-full p-0.5 border transition-all ${
                          avatarUrl === preset.url
                            ? 'border-amber-400 scale-110'
                            : 'border-neutral-700 hover:border-amber-500/50'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  {uploadError && <p className="text-[11px] text-red-400">{uploadError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                  Tribute Name / Callsign
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Gale Hawthorne"
                  className="w-full px-3.5 py-2.5 bg-[#161922] border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                  Short Bio
                </label>
                <textarea
                  rows={2}
                  maxLength={180}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your favorite shot, doubles style, or arena motto..."
                  className="w-full px-3.5 py-2 bg-[#161922] border border-neutral-700 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                  Skill Category & District Assignment
                </label>
                <p className="text-[11px] text-neutral-400 mb-2">
                  Each skill category is officially assigned to its respective District:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {SKILL_CATEGORIES.map((cat) => {
                    const isSelected = category === cat;
                    const districtName = CATEGORY_TO_DISTRICT[cat];

                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-3 text-left rounded-lg border transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-amber-950/40 border-amber-500 text-amber-200'
                            : 'bg-[#161922] border-neutral-800 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        <div>
                          <span className="font-semibold text-xs block text-neutral-100">{cat}</span>
                          <span className="text-[11px] font-mono text-amber-400">{districtName}</span>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMode('switch')}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-neutral-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold font-cinzel text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-lg shadow-md transition-all active:scale-95"
                >
                  Register & Enter The Reaping
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
