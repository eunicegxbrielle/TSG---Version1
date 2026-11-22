/**
 * Web Audio API synthesizer for authentic Hunger Games sound effects:
 * - Mockingjay 4-note whistle (Court call alert)
 * - Cannon Boom (Match victory / game conclusion)
 * - Sponsor's Gift golden chime
 */

let audioCtx: AudioContext | null = null;
let soundEnabled = true;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/**
 * Iconic Mockingjay 4-note whistle
 * Notes approximate: D5, F#5, G5, B4
 */
export function playMockingjayWhistle() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const notes = [
    { freq: 587.33, duration: 0.42, delay: 0 },    // D5
    { freq: 739.99, duration: 0.42, delay: 0.38 }, // F#5
    { freq: 783.99, duration: 0.42, delay: 0.76 }, // G5
    { freq: 493.88, duration: 0.85, delay: 1.14 }, // B4 (sustained resolving note)
  ];

  const now = ctx.currentTime;

  notes.forEach(({ freq, duration, delay }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + delay);

    // subtle vibrato
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.setValueAtTime(5, now + delay);
    vibratoGain.gain.setValueAtTime(2.5, now + delay);
    vibrato.connect(osc.frequency);
    vibrato.start(now + delay);
    vibrato.stop(now + delay + duration);

    // Warm resonant filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now + delay);

    // Gentle breath envelope
    gain.gain.setValueAtTime(0.0001, now + delay);
    gain.gain.exponentialRampToValueAtTime(0.25, now + delay + 0.08);
    gain.gain.setValueAtTime(0.22, now + delay + duration - 0.1);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + delay);
    osc.stop(now + delay + duration);
  });
}

/**
 * The deep ominous Capitol Cannon Boom
 */
export function playCannonBoom() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Low frequency thump
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();

  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(140, now);
  subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.4);

  subGain.gain.setValueAtTime(0.7, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

  subOsc.connect(subGain);
  subGain.connect(ctx.destination);

  subOsc.start(now);
  subOsc.stop(now + 1.3);

  // 2. Filtered noise explosion
  const bufferSize = ctx.sampleRate * 1.5;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(60, now + 0.8);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.5, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

  whiteNoise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  whiteNoise.start(now);
  whiteNoise.stop(now + 1.5);
}

/**
 * Sponsor's Gift golden chime
 */
export function playSponsorGiftChime() {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggiated

  chords.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + idx * 0.08);

    gain.gain.setValueAtTime(0.0001, now + idx * 0.08);
    gain.gain.exponentialRampToValueAtTime(0.2, now + idx * 0.08 + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + idx * 0.08);
    osc.stop(now + idx * 0.08 + 0.7);
  });
}

/**
 * Trigger phone vibration alarm pattern
 */
export function triggerVibrationAlarm(pattern: number | number[] = [350, 150, 350, 150, 550]) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(pattern);
    }
  } catch {
    // Ignore vibration errors on unsupported browsers
  }
}

/**
 * Speak a Capitol voice-over announcement using Web Speech API
 */
export function speakCapitolAnnouncement(text: string) {
  if (!soundEnabled) return;
  try {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.96;
      utterance.pitch = 0.92;
      utterance.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferred =
          voices.find((v) => /en[-_]US|en[-_]GB/i.test(v.lang) && /natural|google|samantha|daniel/i.test(v.name)) ||
          voices.find((v) => v.lang.startsWith('en'));
        if (preferred) {
          utterance.voice = preferred;
        }
      }

      window.speechSynthesis.speak(utterance);
    }
  } catch {
    // Ignore speech synthesis errors on restricted environments
  }
}

/**
 * Voice-over + Mockingjay chime + Phone Vibration for Pre-Ready ("Get Ready, Tribute!")
 */
export function announcePreReadyAlert(targetCourtId?: number) {
  playMockingjayWhistle();
  triggerVibrationAlarm([350, 140, 350, 140, 600]);
  const arenaText = targetCourtId ? `Arena ${targetCourtId}` : 'the Arena';
  setTimeout(() => {
    speakCapitolAnnouncement(`Get ready, Tribute! You are next into ${arenaText}!`);
  }, 900);
}

/**
 * Voice-over + Golden Chime + Phone Vibration for Post-Game Kudos Bestowal
 */
export function announcePostGameKudosAlert() {
  playSponsorGiftChime();
  triggerVibrationAlarm([250, 120, 250, 120, 450]);
  setTimeout(() => {
    speakCapitolAnnouncement(
      "Match complete! Please bestow your Sponsor's Gifts to automatically return to The Reaping queue."
    );
  }, 700);
}

