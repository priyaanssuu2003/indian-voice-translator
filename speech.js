/**
 * speech.js
 * Wraps Web Speech API (SpeechRecognition) and Web Speech Synthesis API.
 * All speech-related state and operations live here.
 */

/* ========================================================
   SPEECH RECOGNITION (STT)
   ======================================================== */

const SpeechRecognitionAPI =
  window.SpeechRecognition || window.webkitSpeechRecognition || null;

let recognizer = null;
let isListening = false;

/**
 * Check if SpeechRecognition is available in this browser.
 * @returns {boolean}
 */
function isSpeechRecognitionSupported() {
  return SpeechRecognitionAPI !== null;
}

/**
 * Start listening for speech.
 * @param {object} opts
 * @param {string}   opts.lang         - BCP-47 language tag
 * @param {boolean}  opts.continuous   - keep listening after pauses
 * @param {function} opts.onInterim    - called with interim text
 * @param {function} opts.onFinal      - called with final text
 * @param {function} opts.onStart      - called when mic opens
 * @param {function} opts.onEnd        - called when mic closes
 * @param {function} opts.onError      - called with error object
 * @returns {boolean} whether recognition started successfully
 */
function startRecognition({ lang, continuous = false, onInterim, onFinal, onStart, onEnd, onError }) {
  if (!SpeechRecognitionAPI) {
    onError?.({ code: 'not-supported', message: 'Web Speech API is not supported in this browser. Try Chrome or Edge.' });
    return false;
  }

  // Stop any existing session
  stopRecognition();

  try {
    recognizer = new SpeechRecognitionAPI();
    recognizer.lang = lang;
    recognizer.continuous = continuous;
    recognizer.interimResults = true;
    recognizer.maxAlternatives = 1;

    recognizer.onstart = () => {
      isListening = true;
      onStart?.();
    };

    recognizer.onresult = (event) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        if (result.isFinal) {
          finalText += transcript + ' ';
        } else {
          interimText += transcript;
        }
      }

      if (interimText) onInterim?.(interimText);
      if (finalText.trim()) onFinal?.(finalText.trim());
    };

    recognizer.onerror = (event) => {
      isListening = false;
      const code = event.error;
      let message;

      switch (code) {
        case 'not-allowed':
        case 'permission-denied':
          message = 'Microphone access was denied. Please allow microphone access in your browser settings.';
          break;
        case 'no-speech':
          message = 'No speech detected. Make sure your microphone is working and try again.';
          break;
        case 'network':
          message = 'Network error during speech recognition. Check your internet connection.';
          break;
        case 'audio-capture':
          message = 'No microphone found. Please connect a microphone and try again.';
          break;
        case 'language-not-supported':
          message = `This browser does not support speech recognition for the selected language. Try Hindi or English first.`;
          break;
        case 'aborted':
          return; // user-initiated stop, not an error
        default:
          message = `Speech recognition error: ${code}`;
      }

      onError?.({ code, message });
    };

    recognizer.onend = () => {
      isListening = false;
      onEnd?.();
    };

    recognizer.start();
    return true;
  } catch (err) {
    isListening = false;
    onError?.({ code: 'start-failed', message: `Could not start speech recognition: ${err.message}` });
    return false;
  }
}

/**
 * Stop active recognition session.
 */
function stopRecognition() {
  if (recognizer) {
    try { recognizer.stop(); } catch (_) {}
    recognizer = null;
  }
  isListening = false;
}

/**
 * Whether recognition is currently active.
 * @returns {boolean}
 */
function getIsListening() {
  return isListening;
}

/* ========================================================
   SPEECH SYNTHESIS (TTS)
   ======================================================== */

let availableVoices = [];
let voicesLoaded = false;

/**
 * Load and cache available TTS voices.
 * speechSynthesis.getVoices() may be async on first call (Chrome triggers voiceschanged event).
 * @returns {Promise<SpeechSynthesisVoice[]>}
 */
function loadVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      availableVoices = voices;
      voicesLoaded = true;
      resolve(voices);
    } else {
      // Wait for voiceschanged event (Chrome behaviour)
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        availableVoices = window.speechSynthesis.getVoices();
        voicesLoaded = true;
        resolve(availableVoices);
      }, { once: true });
      // Fallback in case event never fires
      setTimeout(() => {
        if (!voicesLoaded) {
          availableVoices = window.speechSynthesis.getVoices();
          voicesLoaded = true;
          resolve(availableVoices);
        }
      }, 2000);
    }
  });
}

/**
 * Find the best available voice for a given BCP-47 language tag.
 * Priority: exact locale match → language prefix match → any voice → null
 * @param {string} bcp47
 * @returns {SpeechSynthesisVoice|null}
 */
function findVoice(bcp47) {
  if (!availableVoices.length) return null;

  const langPrefix = bcp47.split('-')[0].toLowerCase();

  // 1. Exact locale match (e.g. "hi-IN")
  let voice = availableVoices.find(v => v.lang.toLowerCase() === bcp47.toLowerCase());
  if (voice) return voice;

  // 2. Locale starts with bcp47 prefix (e.g. "hi-" for "hi-IN")
  voice = availableVoices.find(v => v.lang.toLowerCase().startsWith(langPrefix));
  if (voice) return voice;

  return null;
}

/**
 * Check if a TTS voice is available for a given BCP-47 tag.
 * @param {string} bcp47
 * @returns {boolean}
 */
function hasVoiceForLang(bcp47) {
  return findVoice(bcp47) !== null;
}

/**
 * Speak text in the given language.
 * @param {string}   text    - text to speak
 * @param {string}   bcp47   - BCP-47 language tag
 * @param {function} onStart - called when speech starts
 * @param {function} onEnd   - called when speech ends
 * @param {function} onError - called with error object
 * @returns {{ utterance: SpeechSynthesisUtterance, hasVoice: boolean }}
 */
function speak(text, bcp47, { onStart, onEnd, onError } = {}) {
  // Cancel any in-progress speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = bcp47;

  const voice = findVoice(bcp47);
  if (voice) {
    utterance.voice = voice;
  }

  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = (e) => {
    // 'interrupted' or 'canceled' is user-driven, not an error
    if (e.error === 'interrupted' || e.error === 'canceled') return;
    onError?.({ code: e.error, message: `TTS error: ${e.error}` });
  };

  // Chrome bug: long text may be silently truncated — split at sentence boundaries
  // For simplicity we rely on the browser's native handling here.
  window.speechSynthesis.speak(utterance);

  return { utterance, hasVoice: voice !== null };
}

/**
 * Stop any in-progress speech synthesis.
 */
function stopSpeaking() {
  window.speechSynthesis.cancel();
}

/**
 * Expose a snapshot of available voices for UI hints.
 * @returns {SpeechSynthesisVoice[]}
 */
function getAvailableVoices() {
  return availableVoices;
}
