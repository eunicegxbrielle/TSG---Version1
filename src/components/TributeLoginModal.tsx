import React, { useState, useRef } from 'react';
import {
  X,
  Check,
  Upload,
  LogOut,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  User as UserIcon,
} from 'lucide-react';
import {
  CATEGORY_TO_DISTRICT,
  Player,
  SKILL_CATEGORIES,
  SkillCategory,
} from '../types';
import {
  registerTributeAccount,
  signInTributeAccount,
} from '../utils/storage';
import { TributeAvatar } from './TributeAvatar';
import { PRESET_AVATARS, resizeImageFileToDataUrl } from '../utils/avatars';

interface TributeLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlayer: Player | null;
  onSelectPlayer: (player: Player) => void;
  onViewProfile?: (player: Player) => void;
  onSignOut?: () => void;
}

export const TributeLoginModal: React.FC<TributeLoginModalProps> = ({
  isOpen,
  onClose,
  currentPlayer,
  onSelectPlayer,
  onViewProfile,
  onSignOut,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // Sign In state
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Intermediate');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetForms = () => {
    setSignInUsername('');
    setSignInPassword('');
    setName('');
    setUsername('');
    setBio('');
    setPassword('');
    setAvatarUrl('');
    setFormError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageFileToDataUrl(file, 256);
      setAvatarUrl(dataUrl);
      setFormError(null);
    } catch {
      setFormError('Could not load that image. Try a JPG or PNG file.');
    }
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = signInTributeAccount(signInUsername, signInPassword);
    if (!res.success || !res.player) {
      setFormError(res.error || 'Invalid Tribute Username or Password.');
      return;
    }
    onSelectPlayer(res.player);
    resetForms();
    onClose();
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = registerTributeAccount({
      name,
      username,
      category,
      bio: bio.trim() || undefined,
      avatarUrl: avatarUrl || undefined,
      password,
    });
    if (!res.success || !res.player) {
      setFormError(res.error || 'Unable to complete sign up. Please check your details.');
      return;
    }
    onSelectPlayer(res.player);
    resetForms();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/75 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92dvh] flex flex-col bg-white dark:bg-[#111319] border border-stone-200 dark:border-amber-900/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-stone-200 dark:border-amber-950/60 flex items-center justify-between bg-gradient-to-r from-stone-50 via-white to-stone-50 dark:from-neutral-900 dark:via-[#151821] dark:to-neutral-900 shrink-0">
          <div>
            <span className="font-cinzel text-base sm:text-lg font-bold text-stone-900 dark:text-amber-200 tracking-wide block">
              Tribute Account
            </span>
            <span className="text-xs text-stone-500 dark:text-neutral-400">
              The Shuttle Games · Sign In or Sign Up
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-amber-200 hover:bg-stone-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Active Account Summary if signed in */}
        {currentPlayer && (
          <div className="px-4 sm:px-6 py-3 bg-stone-50 dark:bg-[#0e1015] border-b border-stone-200 dark:border-neutral-800 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <TributeAvatar
                name={currentPlayer.name}
                avatarUrl={currentPlayer.avatarUrl}
                size="sm"
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-stone-900 dark:text-neutral-100 truncate">
                  {currentPlayer.name}
                  {currentPlayer.username && (
                    <span className="ml-1.5 font-mono text-[11px] font-normal text-amber-700 dark:text-amber-400">
                      @{currentPlayer.username}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-stone-500 dark:text-neutral-400 truncate">
                  {currentPlayer.category} · {CATEGORY_TO_DISTRICT[currentPlayer.category] || currentPlayer.district}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onViewProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onViewProfile(currentPlayer);
                  }}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-white dark:bg-[#171a24] border border-stone-300 dark:border-neutral-700 text-[11px] font-medium text-stone-700 dark:text-neutral-200 hover:border-amber-500 inline-flex items-center gap-1"
                >
                  <UserIcon className="w-3 h-3" />
                  Profile
                </button>
              )}
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-[11px] font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 inline-flex items-center gap-1"
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}

        {/* Segmented Tabs: Sign In | Sign Up */}
        <div className="flex border-b border-stone-200 dark:border-neutral-800 bg-stone-50 dark:bg-[#0e1015] shrink-0">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setFormError(null);
            }}
            className={`flex-1 min-h-[44px] py-3 px-2 text-xs font-semibold tracking-wider uppercase transition-colors border-b-2 ${
              mode === 'signin'
                ? 'border-amber-500 text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/5'
                : 'border-transparent text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setFormError(null);
            }}
            className={`flex-1 min-h-[44px] py-3 px-2 text-xs font-semibold tracking-wider uppercase transition-colors border-b-2 ${
              mode === 'signup'
                ? 'border-amber-500 text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/5'
                : 'border-transparent text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
          {mode === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="modal-signin-username"
                  className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1.5"
                >
                  Tribute Username
                </label>
                <input
                  id="modal-signin-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={signInUsername}
                  onChange={(e) => {
                    setSignInUsername(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="Enter your tribute username"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-stone-50 dark:bg-[#161922] border border-stone-300 dark:border-neutral-700 rounded-xl text-sm text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-signin-password"
                  className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="modal-signin-password"
                    type={showSignInPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={signInPassword}
                    onChange={(e) => {
                      setSignInPassword(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="Enter your password"
                    className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 bg-stone-50 dark:bg-[#161922] border border-stone-300 dark:border-neutral-700 rounded-xl text-sm text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignInPassword((v) => !v)}
                    aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200 rounded-lg"
                  >
                    {showSignInPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/60 text-xs text-red-700 dark:text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[46px] px-5 py-2.5 text-xs font-bold font-cinzel uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {onSignOut && currentPlayer && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="inline-flex items-center gap-1.5 text-xs text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out to Landing Page
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              {/* Optional Profile Picture */}
              <div className="flex items-center gap-4 p-3 rounded-xl bg-stone-50 dark:bg-[#161922] border border-stone-200 dark:border-neutral-800">
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
                      className="min-h-[40px] px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 border border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-medium inline-flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Photo
                    </button>
                    <span className="text-[10px] font-mono text-stone-500 dark:text-neutral-400">
                      or pick crest:
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {PRESET_AVATARS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setAvatarUrl(preset.url)}
                        title={preset.label}
                        className={`rounded-full p-1 border transition-all ${
                          avatarUrl === preset.url
                            ? 'border-amber-500 dark:border-amber-400 scale-110'
                            : 'border-stone-300 dark:border-neutral-700 hover:border-amber-500/50'
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
                </div>
              </div>

              <div>
                <label
                  htmlFor="modal-signup-name"
                  className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1"
                >
                  Tribute Name
                </label>
                <input
                  id="modal-signup-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFormError(null);
                  }}
                  placeholder="Enter your full name"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-stone-50 dark:bg-[#161922] border border-stone-300 dark:border-neutral-700 rounded-xl text-sm text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-signup-username"
                  className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1"
                >
                  Tribute Username
                </label>
                <input
                  id="modal-signup-username"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.replace(/\s+/g, ''));
                    setFormError(null);
                  }}
                  placeholder="e.g., katniss12"
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-stone-50 dark:bg-[#161922] border border-stone-300 dark:border-neutral-700 rounded-xl text-sm text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-signup-category"
                  className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1"
                >
                  Skill Category &amp; District
                </label>
                <select
                  id="modal-signup-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as SkillCategory)}
                  className="w-full min-h-[44px] px-3.5 py-2.5 bg-stone-50 dark:bg-[#161922] border border-stone-300 dark:border-neutral-700 rounded-xl text-sm text-stone-900 dark:text-neutral-100 focus:outline-none focus:border-amber-500 transition-colors"
                >
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat} — {CATEGORY_TO_DISTRICT[cat]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="modal-signup-bio"
                  className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1"
                >
                  Short Bio (Optional)
                </label>
                <textarea
                  id="modal-signup-bio"
                  rows={2}
                  maxLength={180}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your favorite shot, doubles style, or arena motto..."
                  className="w-full px-3.5 py-2 bg-stone-50 dark:bg-[#161922] border border-stone-300 dark:border-neutral-700 rounded-xl text-xs text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label
                  htmlFor="modal-signup-password"
                  className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="modal-signup-password"
                    type={showSignUpPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    minLength={4}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="Create a password (min. 4 characters)"
                    className="w-full min-h-[44px] pl-3.5 pr-11 py-2.5 bg-stone-50 dark:bg-[#161922] border border-stone-300 dark:border-neutral-700 rounded-xl text-sm text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword((v) => !v)}
                    aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 min-w-[36px] min-h-[36px] flex items-center justify-center text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200 rounded-lg"
                  >
                    {showSignUpPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/60 text-xs text-red-700 dark:text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="pt-1 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 text-xs font-medium text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200 rounded-xl border border-stone-200 dark:border-neutral-800 sm:border-transparent"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 text-xs font-bold font-cinzel uppercase tracking-wider text-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  Sign Up &amp; Enter
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
