import React, { useState, useRef, useEffect } from 'react';
import jsQR from 'jsqr';
import {
  QrCode,
  KeyRound,
  Camera,
  Upload,
  LogOut,
  Shield,
  Sun,
  Moon,
  AlertCircle,
  ArrowRight,
  X,
} from 'lucide-react';
import { CATEGORY_TO_DISTRICT, Player, QueueSession } from '../types';
import { resolveAndEnterSessionByCodeOrQr } from '../utils/storage';
import { TributeAvatar } from './TributeAvatar';

interface SessionGateViewProps {
  currentPlayer: Player;
  onSessionEntered: (session: QueueSession) => void;
  onSignOut: () => void;
  onOpenGamemakerAuthModal: () => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const SessionGateView: React.FC<SessionGateViewProps> = ({
  currentPlayer,
  onSessionEntered,
  onSignOut,
  onOpenGamemakerAuthModal,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [entryMode, setEntryMode] = useState<'code' | 'qr'>('code');
  const [gameCode, setGameCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Camera QR Scanner state
  const [isScanningCamera, setIsScanningCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = () => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanningCamera(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const attemptEnterWithPayload = (rawValue: string) => {
    const res = resolveAndEnterSessionByCodeOrQr(rawValue, currentPlayer.id);
    if (res.success && res.session) {
      stopCamera();
      setError(null);
      onSessionEntered(res.session);
      return true;
    }
    setError(res.error || 'Game Code or QR code not recognized.');
    return false;
  };

  const handleSubmitCode = (e: React.FormEvent) => {
    e.preventDefault();
    attemptEnterWithPayload(gameCode);
  };

  const startCameraScan = async () => {
    setError(null);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera scanning is unavailable on this browser. Upload a QR image or enter the Game Code.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      setIsScanningCamera(true);

      setTimeout(() => {
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        video.play().catch(() => {});

        const scanFrame = () => {
          const vid = videoRef.current;
          const canvas = canvasRef.current;
          if (!vid || !canvas || !streamRef.current) return;

          if (vid.readyState === vid.HAVE_ENOUGH_DATA) {
            canvas.width = vid.videoWidth;
            canvas.height = vid.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const decoded = jsQR(imageData.data, imageData.width, imageData.height);
              if (decoded && decoded.data) {
                const matched = attemptEnterWithPayload(decoded.data);
                if (matched) return;
              }
            }
          }

          animFrameRef.current = requestAnimationFrame(scanFrame);
        };

        animFrameRef.current = requestAnimationFrame(scanFrame);
      }, 60);
    } catch {
      setError('Camera permission was denied or unavailable. Upload a QR code image or enter the Game Code instead.');
      stopCamera();
    }
  };

  const handleQrImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError('Could not inspect QR image.');
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const decoded = jsQR(imageData.data, imageData.width, imageData.height);
        if (decoded && decoded.data) {
          attemptEnterWithPayload(decoded.data);
        } else {
          setError('No valid Reaping QR code detected in that image. Please try another photo or enter the Game Code.');
        }
      };
      img.onerror = () => {
        setError('Could not load image file.');
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const districtLabel = CATEGORY_TO_DISTRICT[currentPlayer.category] || currentPlayer.district;

  return (
    <div className="min-h-screen bg-[#f6f4ef] dark:bg-[#090a0d] text-stone-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#090a0d]/90 backdrop-blur-md border-b border-stone-200 dark:border-white/[0.07]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src="/the_shuttle_games_logo.png"
              alt="The Shuttle Games"
              className="w-8 h-8 rounded-full border border-amber-500/50 object-contain shrink-0"
            />
            <span className="font-cinzel text-sm sm:text-base font-bold tracking-wider text-stone-900 dark:text-amber-100 truncate">
              THE SHUTTLE GAMES
            </span>
          </div>

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
              className="min-h-[40px] px-3 rounded-lg bg-stone-100 dark:bg-white/[0.05] hover:bg-stone-200 dark:hover:bg-white/[0.1] border border-stone-200 dark:border-white/[0.08] text-xs font-mono text-stone-700 dark:text-neutral-200 inline-flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Gamemaker Portal</span>
            </button>
            <button
              type="button"
              onClick={onSignOut}
              className="min-h-[40px] px-3 rounded-lg border border-stone-300 dark:border-neutral-700 text-xs font-medium text-stone-700 dark:text-neutral-300 hover:text-red-700 dark:hover:text-red-300 inline-flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#11131a] border border-stone-200 dark:border-white/[0.08] p-5 sm:p-8 space-y-6 shadow-sm dark:shadow-none">
          {/* Signed-in Tribute Summary */}
          <div className="flex items-center justify-between gap-3 pb-4 border-b border-stone-200 dark:border-white/[0.07]">
            <div className="flex items-center gap-3 min-w-0">
              <TributeAvatar
                name={currentPlayer.name}
                avatarUrl={currentPlayer.avatarUrl}
                size="md"
              />
              <div className="min-w-0">
                <div className="text-xs font-mono text-amber-700 dark:text-amber-400 font-semibold">
                  Signed In Tribute
                </div>
                <div className="text-sm font-bold text-stone-900 dark:text-white truncate">
                  {currentPlayer.name}
                  {currentPlayer.username && (
                    <span className="ml-1.5 text-xs font-mono font-normal text-amber-700 dark:text-amber-400">
                      @{currentPlayer.username}
                    </span>
                  )}
                </div>
                <div className="text-xs text-stone-500 dark:text-neutral-400">
                  {currentPlayer.category} · {districtLabel}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className="text-xs text-amber-700 dark:text-amber-400 hover:underline shrink-0"
            >
              Sign Out
            </button>
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-mono text-amber-700 dark:text-amber-400 font-semibold block">
              Step 2 of 2 · Session Check-In
            </span>
            <h1 className="font-cinzel text-2xl font-bold text-stone-900 dark:text-white">
              Enter Today&apos;s Reaping
            </h1>
            <p className="text-sm text-stone-600 dark:text-neutral-400">
              Scan the QR Code created by the Gamemaker for today&apos;s session, or enter the Game Code below.
            </p>
          </div>

          {/* Mode Toggle: Enter Game Code vs Scan QR Code */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-stone-100 dark:bg-[#0b0d12] border border-stone-200 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setEntryMode('code');
                setError(null);
              }}
              className={`min-h-[42px] py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                entryMode === 'code'
                  ? 'bg-white dark:bg-[#191c27] text-stone-900 dark:text-amber-200 shadow-xs'
                  : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              Enter Game Code
            </button>
            <button
              type="button"
              onClick={() => {
                setEntryMode('qr');
                setError(null);
              }}
              className={`min-h-[42px] py-2 px-3 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors ${
                entryMode === 'qr'
                  ? 'bg-white dark:bg-[#191c27] text-stone-900 dark:text-amber-200 shadow-xs'
                  : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Scan QR Code
            </button>
          </div>

          {entryMode === 'code' ? (
            <form onSubmit={handleSubmitCode} className="space-y-4">
              <div>
                <label
                  htmlFor="reaping-game-code-input"
                  className="block text-xs font-mono uppercase tracking-wider text-stone-700 dark:text-neutral-300 mb-1.5"
                >
                  Game Code
                </label>
                <input
                  id="reaping-game-code-input"
                  type="text"
                  value={gameCode}
                  onChange={(e) => {
                    setGameCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="Enter today's Game Code"
                  className="w-full min-h-[48px] px-4 py-2.5 bg-stone-50 dark:bg-[#0b0d12] border border-stone-300 dark:border-neutral-800 rounded-xl font-mono text-sm tracking-wider uppercase text-stone-900 dark:text-amber-200 placeholder-stone-400 dark:placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/60 text-xs text-red-700 dark:text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider shadow-md inline-flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Enter The Reaping</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {isScanningCamera ? (
                <div className="space-y-3">
                  <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-black border border-amber-500/70">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-amber-400 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-stone-100 dark:bg-neutral-800 text-stone-800 dark:text-neutral-200 text-xs font-semibold inline-flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    Stop Camera Scanner
                  </button>
                </div>
              ) : (
                <div className="p-6 rounded-xl bg-stone-50 dark:bg-[#0b0d12] border border-dashed border-stone-300 dark:border-neutral-700 text-center space-y-4">
                  <QrCode className="w-10 h-10 text-amber-600 dark:text-amber-400 mx-auto" />
                  <p className="text-xs text-stone-600 dark:text-neutral-400 max-w-xs mx-auto">
                    Point your camera at the Gamemaker&apos;s Reaping QR code, or upload a photo of the QR code.
                  </p>
                  <div className="flex flex-col sm:flex-row items-stretch justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={startCameraScan}
                      className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-cinzel font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <Camera className="w-4 h-4" />
                      Open Camera Scanner
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQrImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[44px] px-4 py-2.5 rounded-xl bg-white dark:bg-[#151822] border border-stone-300 dark:border-neutral-700 hover:border-amber-500/60 text-stone-800 dark:text-neutral-200 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      Upload QR Image
                    </button>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-300 dark:border-red-800/60 text-xs text-red-700 dark:text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
