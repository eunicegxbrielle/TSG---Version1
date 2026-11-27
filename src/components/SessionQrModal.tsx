import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Calendar, Users, ExternalLink } from 'lucide-react';
import { QueueSession } from '../types';
import { getSessions, setActiveSessionId } from '../utils/storage';

interface SessionQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: QueueSession;
  onSelectSession: (session: QueueSession) => void;
}

export const SessionQrModal: React.FC<SessionQrModalProps> = ({
  isOpen,
  onClose,
  activeSession,
  onSelectSession,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewHistory, setViewHistory] = useState(false);

  if (!isOpen) return null;

  const allSessions = getSessions();
  const sessionUrl = `${window.location.origin}/?session=${activeSession.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSwitchSession = (sess: QueueSession) => {
    setActiveSessionId(sess.id);
    onSelectSession(sess);
    setViewHistory(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/75 dark:bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md max-h-[92dvh] overflow-y-auto bg-white dark:bg-[#12141c] border border-stone-200 dark:border-amber-800/80 rounded-2xl shadow-2xl p-4 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-amber-950/60 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <QrCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="font-cinzel text-sm sm:text-base font-bold text-stone-900 dark:text-amber-200 block truncate">
                Session Reaping QR Code
              </span>
              <span className="text-[11px] font-mono text-stone-500 dark:text-neutral-400 block truncate">
                {activeSession.code} · Panem Protocol
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white rounded-lg shrink-0"
            aria-label="Close QR code modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!viewHistory ? (
          <div className="space-y-4 text-center">
            {/* The QR Code Container */}
            <div className="p-3 sm:p-4 bg-amber-50 rounded-2xl border-2 border-amber-500/80 inline-block shadow-lg dark:shadow-xl dark:shadow-amber-950/40">
              {activeSession.qrCodeUrl ? (
                <img
                  src={activeSession.qrCodeUrl}
                  alt={`QR Code for ${activeSession.name}`}
                  className="w-44 h-44 sm:w-56 sm:h-56 mx-auto object-contain"
                />
              ) : (
                <div className="w-44 h-44 sm:w-56 sm:h-56 flex items-center justify-center text-xs text-black font-mono">
                  Generating Session QR...
                </div>
              )}
            </div>

            <div>
              <h4 className="font-cinzel text-base font-bold text-stone-900 dark:text-neutral-100">
                {activeSession.name}
              </h4>
              <p className="text-xs text-stone-500 dark:text-neutral-400 mt-1 max-w-xs mx-auto">
                Scan with any smartphone camera to immediately enter this session's queue.
              </p>
            </div>

            {/* Copyable Share URL */}
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-[#171a25] border border-stone-200 dark:border-neutral-800 flex items-center justify-between gap-2 text-xs">
              <span className="text-stone-600 dark:text-neutral-400 truncate font-mono text-[11px]">
                {sessionUrl}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-[38px] px-3 py-1.5 rounded-lg bg-amber-500 text-black font-semibold text-xs flex items-center gap-1 shrink-0 hover:bg-amber-400 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="pt-2 border-t border-stone-200 dark:border-neutral-800/80 flex items-center justify-between text-xs">
              <span className="text-stone-500 dark:text-neutral-400 font-mono text-[11px]">
                Month: {activeSession.month}
              </span>
              <button
                type="button"
                onClick={() => setViewHistory(true)}
                className="min-h-[36px] text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 font-medium"
              >
                View All Sessions ({allSessions.length}) →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-bold">
                Archived & Active Sessions
              </span>
              <button
                onClick={() => setViewHistory(false)}
                className="text-xs text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white"
              >
                ← Back to QR
              </button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {allSessions.map((sess) => {
                const isActive = sess.id === activeSession.id;
                return (
                  <button
                    key={sess.id}
                    onClick={() => handleSwitchSession(sess)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm'
                        : 'bg-stone-50 dark:bg-[#161822] border-stone-200 dark:border-neutral-800 hover:border-stone-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-stone-900 dark:text-neutral-100">
                        {sess.name}
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-mono tracking-wider bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-stone-500 dark:text-neutral-400 flex items-center gap-2 mt-1">
                      <span>{sess.code}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(sess.date).toLocaleDateString()}</span>
                      <span aria-hidden="true">·</span>
                      <span>{sess.totalMatchesPlayed} matches</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
