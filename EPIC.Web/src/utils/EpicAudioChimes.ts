/**
 * EPIC SMILE - High Fidelity Audio Synthesizer & Voice Announcer
 * Built using native Web Audio API (zero external sound files needed)
 * and Web Speech API for natural kiosk voice prompts.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === "suspended") {
            void audioCtx.resume();
        }
        return audioCtx;
    } catch {
        return null;
    }
}

/**
 * Plays a bright, joyful 4-note ascending chime (C5 -> E5 -> G5 -> C6)
 * Inspired by the welcoming chime of DepEd SMILE kiosk.
 */
export function playSuccessChime(volume = 0.45) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const startTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        // Dual harmonic oscillator for bell-like timbre
        osc.type = idx === notes.length - 1 ? "triangle" : "sine";
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.08);

        const noteStart = startTime + idx * 0.08;
        const duration = idx === notes.length - 1 ? 0.9 : 0.35;

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.exponentialRampToValueAtTime(volume, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + duration);
    });
}

/**
 * Plays a gentle, two-tone notification when attendance was already recorded earlier
 */
export function playAlreadyRecordedChime(volume = 0.35) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [698.46, 880.00]; // F5, A5
    const startTime = ctx.currentTime;

    notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, startTime + idx * 0.12);

        const noteStart = startTime + idx * 0.12;
        const duration = 0.45;

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.exponentialRampToValueAtTime(volume, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + duration);
    });
}

/**
 * Plays a subtle cheerful pop when smile threshold is progressing
 */
export function playSmileProgressTick(volume = 0.15) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.06);
}

/**
 * Plays a gentle reminder / unrecognized sound
 */
export function playRetryTone(volume = 0.25) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
    osc.frequency.setValueAtTime(261.63, ctx.currentTime + 0.12); // C4

    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.36);
}

/**
 * Speaks an audio greeting using native Web Speech API.
 */
export function speakGreeting(name: string, status: string, alreadyRecorded = false) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    try {
        window.speechSynthesis.cancel(); // Stop any pending speech

        const firstName = name.split(" ")[0] || name;
        let text = "";

        if (alreadyRecorded) {
            text = `Welcome back, ${firstName}! Your attendance was already recorded today.`;
        } else if (status === "EARLY") {
            text = `Welcome to church, ${firstName}! You are early. God bless you!`;
        } else if (status === "LATE") {
            text = `Welcome to church, ${firstName}! Attendance recorded.`;
        } else {
            text = `Welcome to church, ${firstName}! Attendance successfully recorded. Have a blessed day!`;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.05;
        utterance.volume = 0.9;

        // Try to pick an English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Natural") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Zira")));
        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
    } catch {
        // Fallback silently if speech synthesis is disabled or blocked by browser permissions
    }
}
