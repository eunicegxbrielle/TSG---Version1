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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#12141c] border border-amber-800/80 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-amber-950/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-cinzel text-base font-bold text-amber-200 block">
                Gamemaker Authorization
              </span>
              <span className="text-[11px] font-mono text-neutral-400">
                Restricted Organizer Console Access
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {gamemakerAuth.isAuthorized ? (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-cinzel text-lg font-bold text-white">
                Authorized as {gamemakerAuth.gamemakerName}
              </h4>
              <p className="text-xs text-neutral-400 mt-1">
                You have active organizer privileges to oversee Arena matchmaking, enter scores, and
                open/close The Reaping.
              </p>
            </div>

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold bg-neutral-800 text-neutral-200 hover:bg-neutral-700 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold bg-red-950/60 text-red-300 border border-red-800/60 hover:bg-red-900/60 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                Exit Gamemaker Mode
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-neutral-300 leading-relaxed">
              The Gamemakers Console is strictly restricted to tournament officials and organizers to
              manage Arena assignments, scores, and Reaping status.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1">
                  Organizer Callsign / Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Head Gamemaker"
                  className="w-full px-3.5 py-2 bg-[#171a25] border border-neutral-700 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-neutral-300 mb-1">
                  Capitol Security Passkey
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={passkey}
                    onChange={(e) => {
                      setPasskey(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter passkey (e.g. 7475)"
                    className="w-full pl-9 pr-3.5 py-2 bg-[#171a25] border border-neutral-700 rounded-lg text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-800/60 text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-95"
                >
                  Verify & Enter Gamemakers Console
                </button>
              </div>
            </form>

            <div className="pt-3 border-t border-neutral-800 text-center">
              <span className="text-[11px] text-neutral-400 block mb-2 font-mono">
                Quick Organizer Presets:
              </span>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handleQuickLogin('Head Gamemaker Crane')}
                  className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-900/50 rounded transition-colors"
                >
                  Seneca Crane
                </button>
                <button
                  onClick={() => handleQuickLogin('Head Gamemaker Heavensbee')}
                  className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-900/50 rounded transition-colors"
                >
                  Plutarch Heavensbee
                </button>
                <button
                  onClick={() => handleQuickLogin('Tournament Director')}
                  className="px-2.5 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-amber-900/50 rounded transition-colors"
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
