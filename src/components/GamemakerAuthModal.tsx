import React, { useState } from 'react';
import { Shield, KeyRound, Lock, CheckCircle, AlertCircle, X, LogOut } from 'lucide-react';
import { GamemakerAuth } from '../types';
import { verifyGamemakerPasskey } from '../utils/storage';

interface GamemakerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  gamemakerAuth: GamemakerAuth;
  onLogin: (gamemakerName: string) => void;
  onLogout: () => void;
}

export const GamemakerAuthModal: React.FC<GamemakerAuthModalProps> = ({
  isOpen,
  onClose,
  gamemakerAuth,
  onLogin,
  onLogout,
}) => {
  const [passkey, setPasskey] = useState('');
  const [name, setName] = useState('Head Gamemaker');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyGamemakerPasskey(passkey)) {
      onLogin(name.trim() || 'Head Gamemaker');
      setPasskey('');
      setError(null);
      onClose();
    } else {
      setError('Invalid Capitol Authorization Passkey. (Hint: 7475 or gamemaker)');
    }
  };

  const handleQuickLogin = (organizerTitle: string) => {
    onLogin(organizerTitle);
    setPasskey('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/75 dark:bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto bg-white dark:bg-[#12141c] border border-stone-200 dark:border-amber-800/80 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-amber-950/60 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-cinzel text-sm sm:text-base font-bold text-stone-900 dark:text-amber-200 block truncate">
                Gamemaker Authorization
              </span>
              <span className="text-[11px] font-mono text-stone-500 dark:text-neutral-400 block truncate">
                Restricted Organizer Console Access
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white rounded-lg transition-colors shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {gamemakerAuth.isAuthorized ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-cinzel text-lg font-bold text-stone-900 dark:text-white">
                Authorized as {gamemakerAuth.gamemakerName}
              </h4>
              <p className="text-xs text-stone-600 dark:text-neutral-400 mt-1">
                You have active organizer privileges to oversee Arena matchmaking, enter scores, and
                open/close The Reaping.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[42px] px-4 py-2 text-xs font-semibold bg-stone-100 dark:bg-neutral-800 text-stone-800 dark:text-neutral-200 hover:bg-stone-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="min-h-[42px] px-4 py-2 text-xs font-semibold bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800/60 hover:bg-red-100 dark:hover:bg-red-900/60 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit Gamemaker Mode
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-stone-600 dark:text-neutral-300 leading-relaxed">
              The Gamemakers Console is strictly restricted to tournament officials and organizers to
              manage Arena assignments, scores, and Reaping status.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 dark:text-neutral-300 mb-1">
                  Organizer Callsign / Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Head Gamemaker"
                  className="w-full min-h-[42px] px-3.5 py-2 bg-stone-50 dark:bg-[#171a25] border border-stone-300 dark:border-neutral-700 rounded-lg text-xs text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-700 dark:text-neutral-300 mb-1">
                  Capitol Security Passkey
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-stone-400 dark:text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passkey}
                    onChange={(e) => {
                      setPasskey(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter passkey (e.g. 7475)"
                    className="w-full min-h-[42px] pl-9 pr-3.5 py-2 bg-stone-50 dark:bg-[#171a25] border border-stone-300 dark:border-neutral-700 rounded-lg text-xs text-stone-900 dark:text-neutral-100 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/60 text-xs text-red-700 dark:text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full min-h-[44px] py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-95"
                >
                  Verify & Enter Gamemakers Console
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-stone-200 dark:border-neutral-800 text-center">
              <span className="text-[11px] text-stone-500 dark:text-neutral-400 block mb-2 font-mono">
                Quick Organizer Presets:
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Head Gamemaker Crane')}
                  className="min-h-[38px] px-3 py-1.5 text-[11px] bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-amber-800 dark:text-amber-300 border border-stone-300 dark:border-amber-900/50 rounded-lg transition-colors"
                >
                  Seneca Crane
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Head Gamemaker Heavensbee')}
                  className="min-h-[38px] px-3 py-1.5 text-[11px] bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-amber-800 dark:text-amber-300 border border-stone-300 dark:border-amber-900/50 rounded-lg transition-colors"
                >
                  Plutarch Heavensbee
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('Tournament Director')}
                  className="min-h-[38px] px-3 py-1.5 text-[11px] bg-stone-100 dark:bg-neutral-800 hover:bg-stone-200 dark:hover:bg-neutral-700 text-amber-800 dark:text-amber-300 border border-stone-300 dark:border-amber-900/50 rounded-lg transition-colors"
                >
                  Organizer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
