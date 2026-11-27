import React, { useState, useRef } from 'react';
import {
  Shield,
  Sun,
  Moon,
  Upload,
  Check,
  ArrowRight,
  QrCode,
  Eye,
  EyeOff,
  AlertCircle,
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

interface LandingGateProps {
  tributes: Player[];
  pendingQrSessionId?: string | null;
  onAuthenticated: (player: Player) => void;
  onOpenGamemakerAuthModal: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const LandingGate: React.FC<LandingGateProps> = ({
  tributes,
  pendingQrSessionId,
  onAuthenticated,
  onOpenGamemakerAuthModal,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  // Sign-In state
  const [signInUsername, setSignInUsername] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign-Up state
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [category, setCategory] = useState<SkillCategory>('Intermediate');
  const [bio, setBio] = useState('');
  const [password, setPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = signInTributeAccount(signInUsername, signInPassword);
    if (!res.success || !res.player) {
      setFormError(res.error || 'Invalid Tribute Username or Password.');
      return;
    }
    setFormError(null);
    onAuthenticated(res.player);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageFileToDataUrl(file, 256);
      setAvatarUrl(dataUrl);
      setFormError(null);
    } catch {
      setFormError('Could not load that image. Please try a JPG or PNG file.');
    }
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
    setFormError(null);
    onAuthenticated(res.player);
  };

  return (
    <div className="min-h-screen bg-[#f6f4ef] dark:bg-[#090a0d] text-stone-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-amber-500/30 transition-colors duration-200">
      {/* Top Navigation Bar (3-zone contract) */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#090a0d]/90 backdrop-blur-md border-b border-stone-200 dark:border-white/[0.07]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand Title */}
          <a
            href="#top"
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0"
          >
            <img
              src="/the_shuttle_games_logo.png"
              alt="The Shuttle Games"
              className="w-8 h-8 rounded-full border border-amber-500/50 object-contain shrink-0"
            />
            <span className="font-cinzel text-sm sm:text-base font-bold tracking-wider text-stone-900 dark:text-amber-100 whitespace-nowrap shrink-0">
              THE SHUTTLE GAMES
            </span>
          </a>

          {/* Zone 2: Clean Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600 dark:text-neutral-400 shrink-0">
            <a
              href="#how-it-works"
              className="hover:text-stone-900 dark:hover:text-neutral-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </a>
            <a
              href="#districts"
              className="hover:text-stone-900 dark:hover:text-neutral-100 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Districts
            </a>
          </nav>

          {/* Zone 3: Theme + Primary Staff Action */}
          <div className="flex items-center gap-2 shrink-0">
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-stone-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-stone-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-amber-700" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onOpenGamemakerAuthModal}
              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-stone-900 dark:bg-amber-400 text-amber-300 dark:text-black hover:bg-stone-800 dark:hover:bg-amber-300 text-xs font-semibold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              Gamemaker Portal
            </button>
          </div>
        </div>
      </header>

      <main id="top" className="flex-1">
        {/* Pending QR Notice when arriving via phone camera link */}
        {pendingQrSessionId && (
          <div className="bg-amber-400 text-black px-4 py-2.5 text-center text-xs font-semibold">
            <span className="inline-flex items-center gap-1.5">
              <QrCode className="w-4 h-4 shrink-0" />
              Reaping QR code scanned. Sign in or sign up below to enter the session directly.
            </span>
          </div>
        )}

        {/* Hero + Auth Split */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Pure Typographic Brand Statement (No Hero Photo) */}
            <div className="lg:col-span-7 space-y-7">
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <p className="font-cinzel text-sm sm:text-base font-bold tracking-[0.16em] uppercase text-amber-700 dark:text-amber-400">
                    The Shuttle Games
                  </p>
                  <p className="text-xs sm:text-sm font-mono uppercase tracking-[0.22em] text-stone-600 dark:text-neutral-400">
                    Badminton Club
                  </p>
                </div>

                <h1
                  className="font-cinzel font-bold text-stone-900 dark:text-white tracking-tight text-balance leading-[1.08] pt-1"
                  style={{ fontSize: 'clamp(2.25rem, 4.4vw, 3.65rem)' }}
                >
                  <span className="block">Step Onto The Court.</span>
                  <span className="block text-amber-700 dark:text-amber-300 mt-1">
                    Enter The Reaping.
                  </span>
                </h1>

                <p className="font-cinzel italic text-lg sm:text-xl font-medium tracking-wide text-stone-700 dark:text-amber-200/90 pt-2">
                  May the shots be ever on your favor.
                </p>
              </div>

              <p className="text-sm sm:text-base text-stone-600 dark:text-neutral-400 leading-relaxed max-w-xl">
                Sign in with your Tribute Username or register a new profile, scan the Gamemaker&apos;s daily QR code or enter the Game Code, and join live doubles rotations across four arenas.
              </p>
            </div>

            {/* Right Column: Sign In / Sign Up Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.08] p-5 sm:p-6 space-y-5 shadow-sm dark:shadow-none">
                <div className="space-y-1">
                  <span className="text-xs font-mono text-amber-700 dark:text-amber-400 font-semibold">
                    Step 1 of 2 · Tribute Access
                  </span>
                  <h2 className="font-cinzel text-xl font-bold text-stone-900 dark:text-white">
                    {authMode === 'signin' ? 'Tribute Sign In' : 'Create Tribute Account'}
                  </h2>
                </div>

                {/* Segmented Auth Mode Switcher */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#0b0d12] border border-stone-200 dark:border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signin');
                      setFormError(null);
                    }}
                    className={`min-h-[42px] py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      authMode === 'signin'
                        ? 'bg-white dark:bg-[#191c27] text-stone-900 dark:text-amber-200 shadow-xs'
                        : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setFormError(null);
                    }}
                    className={`min-h-[42px] py-2 px-3 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      authMode === 'signup'
                        ? 'bg-white dark:bg-[#191c27] text-stone-900 dark:text-amber-200 shadow-xs'
                        : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>

                {authMode === 'signin' ? (
                  <form onSubmit={handleSignInSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="landing-signin-username"
                        className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1"
                      >
                        Tribute Username
                      </label>
                      <input
                        id="landing-signin-username"
                        type="text"
                        required
                        autoComplete="username"
                        value={signInUsername}
                        onChange={(e) => {
                          setSignInUsername(e.target.value);
                          setFormError(null);
                        }}
                        placeholder="Enter your tribute username"
                        className="w-full min-h-[44px] px-3.5 py-2 bg-stone-50 dark:bg-[#0b0d12] border border-stone-300 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="landing-signin-password"
                        className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="landing-signin-password"
                          type={showSignInPassword ? 'text' : 'password'}
                          required
                          autoComplete="current-password"
                          value={signInPassword}
                          onChange={(e) => {
                            setSignInPassword(e.target.value);
                            setFormError(null);
                          }}
                          placeholder="Enter your password"
                          className="w-full min-h-[44px] pl-3.5 pr-11 py-2 bg-stone-50 dark:bg-[#0b0d12] border border-stone-300 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500"
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
                      className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider shadow-md inline-flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <p className="text-xs text-center text-stone-500 dark:text-neutral-400">
                      New to The Shuttle Games?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('signup');
                          setFormError(null);
                        }}
                        className="text-amber-700 dark:text-amber-400 font-semibold hover:underline"
                      >
                        Create a Tribute account
                      </button>
                    </p>
                  </form>
                ) : (
                  <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                    {/* Optional Profile Picture */}
                    <div className="flex items-center gap-3.5 p-3 rounded-xl bg-stone-50 dark:bg-[#0e1017] border border-stone-200 dark:border-white/[0.06]">
                      <TributeAvatar
                        name={name || 'New Tribute'}
                        avatarUrl={avatarUrl || undefined}
                        size="lg"
                      />
                      <div className="flex-1 space-y-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="min-h-[38px] px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/30 border border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-medium inline-flex items-center gap-1.5"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Upload Photo
                          </button>
                          <span className="text-[11px] text-stone-500 dark:text-neutral-400">
                            or pick crest
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {PRESET_AVATARS.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => setAvatarUrl(preset.url)}
                              title={preset.label}
                              className={`rounded-full p-0.5 border transition-transform ${
                                avatarUrl === preset.url
                                  ? 'border-amber-500 scale-110'
                                  : 'border-stone-300 dark:border-neutral-700'
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
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="landing-signup-name"
                        className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1"
                      >
                        Tribute Name
                      </label>
                      <input
                        id="landing-signup-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setFormError(null);
                        }}
                        placeholder="Enter your full name"
                        className="w-full min-h-[44px] px-3.5 py-2 bg-stone-50 dark:bg-[#0b0d12] border border-stone-300 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="landing-signup-username"
                        className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1"
                      >
                        Tribute Username
                      </label>
                      <input
                        id="landing-signup-username"
                        type="text"
                        required
                        autoComplete="username"
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value.replace(/\s+/g, ''));
                          setFormError(null);
                        }}
                        placeholder="e.g., katniss12"
                        className="w-full min-h-[44px] px-3.5 py-2 bg-stone-50 dark:bg-[#0b0d12] border border-stone-300 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="landing-signup-category"
                        className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1"
                      >
                        Skill Category &amp; District
                      </label>
                      <select
                        id="landing-signup-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as SkillCategory)}
                        className="w-full min-h-[44px] px-3.5 py-2 bg-stone-50 dark:bg-[#0b0d12] border border-stone-300 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-neutral-100 focus:outline-none focus:border-amber-500"
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
                        htmlFor="landing-signup-bio"
                        className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1"
                      >
                        Short Bio (Optional)
                      </label>
                      <textarea
                        id="landing-signup-bio"
                        rows={2}
                        maxLength={180}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Favorite shot, doubles style, or arena motto..."
                        className="w-full px-3.5 py-2 bg-stone-50 dark:bg-[#0b0d12] border border-stone-300 dark:border-neutral-800 rounded-xl text-xs text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="landing-signup-password"
                        className="block text-xs font-medium text-stone-700 dark:text-neutral-300 mb-1"
                      >
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="landing-signup-password"
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
                          className="w-full min-h-[44px] pl-3.5 pr-11 py-2 bg-stone-50 dark:bg-[#0b0d12] border border-stone-300 dark:border-neutral-800 rounded-xl text-sm text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500"
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

                    <button
                      type="submit"
                      className="w-full min-h-[46px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider shadow-md inline-flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Check className="w-4 h-4" />
                      Sign Up &amp; Continue
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* How It Works (3-Step Flow) */}
        <section
          id="how-it-works"
          className="border-t border-stone-200 dark:border-white/[0.06] py-12 sm:py-16 bg-white/60 dark:bg-[#0c0e14]/70"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="max-w-2xl space-y-2">
              <h2 className="font-cinzel text-2xl sm:text-3xl font-bold text-stone-900 dark:text-white">
                How Club Open Play Works
              </h2>
              <p className="text-sm text-stone-600 dark:text-neutral-400">
                Every session follows a three-step entry path from registration to your first doubles match.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] space-y-2">
                <span className="font-mono text-xs text-amber-700 dark:text-amber-400 font-semibold block">
                  01. Sign In or Sign Up
                </span>
                <h3 className="font-cinzel text-lg font-bold text-stone-900 dark:text-white">
                  Access Your Tribute Account
                </h3>
                <p className="text-sm text-stone-600 dark:text-neutral-400 leading-relaxed">
                  Sign in using your Tribute Username and Password, or sign up with your name, skill category, and password to claim your District.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] space-y-2">
                <span className="font-mono text-xs text-amber-700 dark:text-amber-400 font-semibold block">
                  02. Scan QR or Enter Game Code
                </span>
                <h3 className="font-cinzel text-lg font-bold text-stone-900 dark:text-white">
                  Check Into Today&apos;s Session
                </h3>
                <p className="text-sm text-stone-600 dark:text-neutral-400 leading-relaxed">
                  Scan the daily QR Code generated by the Gamemaker or type in the active Game Code to verify your attendance for the day.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.07] space-y-2">
                <span className="font-mono text-xs text-amber-700 dark:text-amber-400 font-semibold block">
                  03. Enter The Reaping
                </span>
                <h3 className="font-cinzel text-lg font-bold text-stone-900 dark:text-white">
                  Queue, Play &amp; Bestow Gifts
                </h3>
                <p className="text-sm text-stone-600 dark:text-neutral-400 leading-relaxed">
                  Enter the open-play queue, hear your Arena callout from the Capitol announcer, and submit post-match Sponsor&apos;s Gifts to rejoin automatically.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Districts Overview */}
        <section
          id="districts"
          className="border-t border-stone-200 dark:border-white/[0.06] py-12 sm:py-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-4">
              <h2 className="font-cinzel text-2xl font-bold text-stone-900 dark:text-white">
                Skill Categories &amp; Districts
              </h2>
              <div className="divide-y divide-stone-200 dark:divide-white/[0.06] border-y border-stone-200 dark:border-white/[0.06] text-sm">
                {SKILL_CATEGORIES.map((cat) => (
                  <div key={cat} className="py-2.5 flex items-center justify-between">
                    <span className="font-medium text-stone-900 dark:text-neutral-100">{cat}</span>
                    <span className="font-mono text-xs text-amber-700 dark:text-amber-400">
                      {CATEGORY_TO_DISTRICT[cat]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 dark:border-white/[0.06] bg-white dark:bg-[#07080a] py-6 text-xs text-stone-600 dark:text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-cinzel font-bold tracking-widest text-amber-700 dark:text-amber-500">
            THE SHUTTLE GAMES
          </span>
          <button
            type="button"
            onClick={onOpenGamemakerAuthModal}
            className="min-h-[36px] px-2 text-stone-600 dark:text-neutral-400 hover:text-amber-700 dark:hover:text-amber-300 font-mono transition-colors"
          >
            Gamemaker Portal
          </button>
        </div>
      </footer>
    </div>
  );
};
