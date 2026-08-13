# Indian Voice Translator — Vāk

A real-time voice translation web app for all **22 scheduled Indian languages**, built with:
- 🎙 **Web Speech API** (SpeechRecognition) for free, browser-native STT
- 🤖 **Claude AI** (Anthropic API) for accurate translation
- 🔊 **Web Speech Synthesis** for free, browser-native TTS

- ## Live Demo
- indian-voice-translator.vercel.app

## Setup

1. **Serve the app** (required for ES modules to work):
   ```bash
   # Python (simplest)
   python -m http.server 5500

   # OR Node.js
   npx serve .

   # OR VS Code Live Server extension
   ```

2. **Open** `http://localhost:5500` in Chrome or Edge

3. **Enter your Anthropic API key** in the Settings panel (click the gear icon)
   - Get a key at: https://console.anthropic.com
   - The key is stored in session storage only (not persisted to disk)

4. **Select languages**, tap the microphone, and speak!

## Browser Requirements

| Feature | Required Browser |
|---------|-----------------|
| Speech Recognition (STT) | Chrome or Edge |
| Speech Synthesis (TTS) | Chrome, Edge, Firefox, Safari |
| ES Modules | All modern browsers |

> **Note:** Firefox and Safari do **not** support `SpeechRecognition`. Use Chrome or Edge for the full experience.

## File Structure

```
indian-voice-translator/
├── index.html      # Main HTML + UI markup
├── style.css       # Dark glassmorphism design system
├── app.js          # Main app controller & state
├── languages.js    # 22 scheduled Indian languages config
├── api.js          # Anthropic Claude translation module
└── speech.js       # Web Speech API wrapper (STT + TTS)
```

## All 22 Scheduled Indian Languages

Assamese, Bengali, Bodo, Dogri, Gujarati, Hindi, Kannada, Kashmiri, Konkani, Maithili, Malayalam, Manipuri, Marathi, Nepali, Odia, Punjabi, Sanskrit, Santali, Sindhi, Tamil, Telugu, Urdu

## Features

- ✅ All 22 scheduled Indian languages
- ✅ Live interim transcription while speaking
- ✅ Auto-play translated audio
- ✅ Replay button for translation
- ✅ Copy-to-clipboard for translated text
- ✅ Language swap button
- ✅ Translation history log (last 20)
- ✅ Voice availability badge per language
- ✅ Graceful fallback if voice not available
- ✅ Error handling for mic permission denial
- ✅ Mobile-friendly responsive layout
- ✅ Zero build step — pure HTML/CSS/ES modules

## Notes on Voice Support

Browser TTS voice availability varies by OS:
- **Hindi, Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Marathi, Punjabi, Urdu** — widely supported across Chrome/Edge on Windows/Mac
- **Less common languages** (Bodo, Dogri, Santali, etc.) — may not have TTS voices in all browsers; translated text is always shown as fallback
