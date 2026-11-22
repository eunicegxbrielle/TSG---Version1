import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Pencil, Check, Flame, Trophy, BarChart3 } from 'lucide-react';
import { CATEGORY_TO_DISTRICT, Player } from '../types';
import { TributeAvatar } from './TributeAvatar';
import { PRESET_AVATARS, resizeImageFileToDataUrl } from '../utils/avatars';
import { updatePlayerProfile } from '../utils/storage';

interface TributeProfileModalProps {
  isOpen: boolean;
  player: Player | null;
  currentPlayerId?: string;
  onClose: () => void;
  onProfileUpdated: () => void;
  onViewMyGames?: (player: Player) => void;
}

export const TributeProfileModal: React.FC<TributeProfileModalProps> = ({
  isOpen,
  player,
  currentPlayerId,
  onClose,
  onProfileUpdated,
  onViewMyGames,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (player) {
      setEditName(player.name);
      setEditBio(player.bio || '');
      setEditAvatar(player.avatarUrl || '');
      setIsEditing(false);
      setUploadError(null);
    }
  }, [player?.id, isOpen]);

  if (!isOpen || !player) return null;

  const district = CATEGORY_TO_DISTRICT[player.category] || player.district;
  const isMe = currentPlayerId === player.id;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageFileToDataUrl(file, 256);
      setEditAvatar(dataUrl);
      setUploadError(null);
    } catch {
      setUploadError('Could not load that image. Try a JPG or PNG file.');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlayerProfile(player.id, {
      name: editName,
      bio: editBio,
      avatarUrl: editAvatar || player.avatarUrl,
    });
    setIsEditing(false);
    onProfileUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#12141c] border border-amber-700/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Top Banner */}
        <div className="h-24 bg-gradient-to-r from-amber-950/70 via-[#1a1d2b] to-amber-950/70 border-b border-amber-900/40 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/40 text-neutral-300 hover:text-white hover:bg-black/70 transition-colors"
            aria-label="Close profile"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="absolute top-3 left-4 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-amber-400">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            Tribute Profile
          </div>
        </div>

        {/* Profile Picture overlapping banner */}
        <div className="px-6 pb-6 -mt-12 relative">
          <div className="flex items-end justify-between gap-3">
            <TributeAvatar
              name={isEditing ? editName || player.name : player.name}
              avatarUrl={isEditing ? editAvatar || player.avatarUrl : player.avatarUrl}
              size="xl"
              className="border-4 border-[#12141c] ring-2 ring-amber-400/80 shadow-xl"
            />

            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="px-3 py-1.5 rounded-lg bg-[#181b28] hover:bg-neutral-800 border border-amber-800/60 text-xs text-amber-300 font-medium inline-flex items-center gap-1.5 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          </div>

          {!isEditing ? (
            <div className="mt-4 space-y-4">
              {/* Name & District */}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-cinzel text-2xl font-black text-amber-100">
                    {player.name}
                  </h3>
                  {isMe && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-black uppercase">
                      YOU
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-bold">
                    {district}
                  </span>
                  <span className="text-neutral-400 font-medium">{player.category}</span>
                </div>
              </div>

              {/* Short Bio */}
              <div className="p-4 rounded-xl bg-[#0b0d14] border border-neutral-800/90 space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90 font-bold block">
                  Short Bio
                </span>
                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed">
                  {player.bio?.trim()
                    ? player.bio
                    : `${player.category} tribute competing from ${district} in The Shuttle Games.`}
                </p>
              </div>

              {/* Quick Record Strip */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-[#0b0d14] border border-neutral-800">
                  <span className="text-[10px] font-mono text-neutral-400 block">GAMES</span>
                  <span className="font-cinzel text-base font-black text-amber-100 tabular-nums">
                    {player.stats.totalGames}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0b0d14] border border-neutral-800">
                  <span className="text-[10px] font-mono text-emerald-400 block">WINS</span>
                  <span className="font-cinzel text-base font-black text-emerald-400 tabular-nums">
                    {player.stats.totalWins}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-[#0b0d14] border border-neutral-800">
                  <span className="text-[10px] font-mono text-amber-400 block">WIN RATE</span>
                  <span className="font-cinzel text-base font-black text-amber-300 tabular-nums">
                    {player.stats.winRate}%
                  </span>
                </div>
              </div>

              {onViewMyGames && (
                <button
                  type="button"
                  onClick={() => {
                    onViewMyGames(player);
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <BarChart3 className="w-4 h-4" />
                  Open Full Stats in My Games
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
              {/* Upload Photo or Preset */}
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-300 font-semibold block mb-2">
                  Profile Picture
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-200 text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Upload Photo
                  </button>

                  {PRESET_AVATARS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setEditAvatar(preset.url)}
                      title={preset.label}
                      className={`rounded-full p-0.5 border transition-all ${
                        editAvatar === preset.url
                          ? 'border-amber-400 scale-110'
                          : 'border-neutral-700 hover:border-amber-500/50'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    </button>
                  ))}
                </div>
                {uploadError && (
                  <p className="text-[11px] text-red-400 mt-1">{uploadError}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b0d14] border border-neutral-700 rounded-lg text-xs text-neutral-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 font-semibold mb-1">
                  Short Bio
                </label>
                <textarea
                  rows={3}
                  maxLength={180}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Favorite badminton shot, playing style, or District motto..."
                  className="w-full px-3 py-2 bg-[#0b0d14] border border-neutral-700 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500 resize-none"
                />
                <span className="text-[10px] text-neutral-500 font-mono block text-right">
                  {editBio.length}/180
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3.5 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-black font-cinzel font-bold text-xs inline-flex items-center gap-1.5 shadow-md"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save Profile
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
