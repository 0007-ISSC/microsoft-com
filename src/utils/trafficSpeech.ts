/**
 * Professional Browser-Based Text-to-Speech (TTS) Integration
 * Powered by Web Speech API (SpeechSynthesis)
 * Provides real-time, mission-control style audio notifications for major traffic incidents,
 * clearance advisories, and emergency vehicle preemption.
 */

import { playEmergencyAlert, playSuccessChime, playRadarPing } from './soundEffects';

export interface TtsSettings {
  enabled: boolean;
  rate: number; // 0.8 to 1.3
  pitch: number; // 0.8 to 1.2
  volume: number; // 0.0 to 1.0
  voiceName: string | null;
}

const DEFAULT_SETTINGS: TtsSettings = {
  enabled: true,
  rate: 1.02,
  pitch: 1.0,
  volume: 1.0,
  voiceName: null,
};

let currentSettings: TtsSettings = { ...DEFAULT_SETTINGS };
let speechListeners: Array<(text: string) => void> = [];

/**
 * Register a listener to receive the text of spoken announcements (for UI banners, logs, etc.)
 */
export const onSpeechBroadcast = (callback: (text: string) => void) => {
  speechListeners.push(callback);
  return () => {
    speechListeners = speechListeners.filter((cb) => cb !== callback);
  };
};

function notifySpeechListeners(text: string) {
  speechListeners.forEach((cb) => cb(text));
}

/**
 * Get available browser speech synthesis voices
 */
export const getAvailableVoices = (): SpeechSynthesisVoice[] => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
};

/**
 * Find the optimal professional voice (prefers natural English voices)
 */
function getBestVoice(): SpeechSynthesisVoice | null {
  const voices = getAvailableVoices();
  if (voices.length === 0) return null;

  if (currentSettings.voiceName) {
    const matched = voices.find((v) => v.name === currentSettings.voiceName);
    if (matched) return matched;
  }

  // Priority order for professional sounding English voices
  const preferredNames = [
    'Google US English',
    'Microsoft Zira',
    'Microsoft David',
    'Samantha',
    'Daniel',
    'Karen',
    'Victoria',
    'en-US',
  ];

  for (const name of preferredNames) {
    const v = voices.find((item) => item.name.includes(name) || item.lang.includes(name));
    if (v) return v;
  }

  // Fallback to any English voice or default
  return voices.find((v) => v.lang.startsWith('en')) || voices[0] || null;
}

export const setTtsEnabled = (enabled: boolean) => {
  currentSettings.enabled = enabled;
  if (!enabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

export const isTtsEnabled = (): boolean => currentSettings.enabled;

export const setTtsVoice = (voiceName: string) => {
  currentSettings.voiceName = voiceName;
};

export const setTtsRate = (rate: number) => {
  currentSettings.rate = Math.max(0.7, Math.min(1.5, rate));
};

export const getTtsSettings = (): TtsSettings => ({ ...currentSettings });

/**
 * Core text-to-speech speak function with professional cadence
 */
export const speakAnnouncement = (text: string, playAlertChime = true) => {
  if (!currentSettings.enabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  try {
    if (playAlertChime) {
      playRadarPing();
    }

    window.speechSynthesis.cancel(); // Cancel any lingering utterance for urgent updates

    const clean = text.replace(/[*#_`]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(clean);

    const voice = getBestVoice();
    if (voice) {
      utterance.voice = voice;
    }

    utterance.rate = currentSettings.rate;
    utterance.pitch = currentSettings.pitch;
    utterance.volume = currentSettings.volume;

    notifySpeechListeners(clean);
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis notification error:', err);
  }
};

/**
 * Professional audio notification for major traffic incidents
 */
export const speakMajorIncidentAlert = (
  title: string,
  locationName: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  lanesBlocked: number,
  detourAdvice?: string
) => {
  playEmergencyAlert();

  let severityLabel = 'Advisory Notice';
  if (severity === 'critical') severityLabel = 'Critical Incident Alert';
  else if (severity === 'high') severityLabel = 'High Priority Traffic Hazard';
  else if (severity === 'medium') severityLabel = 'Moderate Traffic Notice';

  let script = `Attention all units. ${severityLabel}. ${title} reported at ${locationName}. `;
  if (lanesBlocked > 0) {
    script += `${lanesBlocked} lane${lanesBlocked > 1 ? 's are' : ' is'} blocked. `;
  }
  if (detourAdvice) {
    script += `Recommended action: ${detourAdvice} `;
  }
  script += `Adaptive signal timing adjustments applied to mitigate queue buildup.`;

  speakAnnouncement(script, false);
};

/**
 * Professional audio notification when an incident is cleared
 */
export const speakIncidentClearance = (title: string, locationName: string) => {
  playSuccessChime();
  const script = `Incident clearance confirmed. ${title} at ${locationName} has been fully cleared. Roadway lanes restored to normal Level of Service.`;
  speakAnnouncement(script, false);
};

/**
 * Audio notification for Emergency Vehicle Preemption (EVP)
 */
export const speakPreemptionActivation = (corridorName: string) => {
  playEmergencyAlert();
  const script = `Emergency Vehicle Preemption active. Priority green wave cleared for emergency responders along ${corridorName}. Conflicting arterial movements held on red.`;
  speakAnnouncement(script, false);
};
