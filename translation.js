/**
 * translation.js
 * Handles all communication with LibreTranslate public API.
 * Modular: swap the endpoint or entire backend by editing LIBRETRANSLATE_ENDPOINTS only.
 */

/**
 * Ordered list of LibreTranslate mirrors to try.
 * Primary: official instance. Fallbacks: community mirrors.
 * A future self-hosted Docker instance can be prepended here.
 */
const LIBRETRANSLATE_ENDPOINTS = [
  'https://libretranslate.com',
  'https://translate.argosopentech.com',
  'https://translate.terraprint.co',
  'https://lt.vern.cc',
];

let activeEndpoint = null;       // resolved at startup
let supportedLTCodes = new Set(); // populated from GET /languages

/**
 * Probe each endpoint in order until one responds to GET /languages.
 * Sets `activeEndpoint` and `supportedLTCodes`.
 * @returns {Promise<boolean>} true if an endpoint was found
 */
async function initTranslationAPI() {
  for (const endpoint of LIBRETRANSLATE_ENDPOINTS) {
    try {
      const url = `${endpoint}/languages`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timer);

      if (!res.ok) continue;

      const langs = await res.json();
      if (!Array.isArray(langs) || langs.length === 0) continue;

      activeEndpoint = endpoint;
      supportedLTCodes = new Set(langs.map(l => l.code));

      console.log(`[TranslationAPI] Using endpoint: ${endpoint}`);
      console.log(`[TranslationAPI] Supported codes: ${[...supportedLTCodes].join(', ')}`);
      return true;
    } catch (err) {
      console.warn(`[TranslationAPI] Endpoint ${endpoint} unavailable:`, err.message);
    }
  }
  console.error('[TranslationAPI] All endpoints unavailable.');
  return false;
}

/**
 * Check whether a given LibreTranslate language code is supported.
 * @param {string} code
 * @returns {boolean}
 */
function isLTLangSupported(code) {
  if (!code) return false;
  // Direct match
  if (supportedLTCodes.has(code)) return true;
  // Sometimes codes like 'as' are listed as 'as-IN' etc — check prefix
  for (const s of supportedLTCodes) {
    if (s.startsWith(code) || code.startsWith(s)) return true;
  }
  return false;
}

/**
 * Translate text using the active LibreTranslate endpoint.
 * @param {string} text    - text to translate
 * @param {string} source  - source language code (LT code or 'auto')
 * @param {string} target  - target language code
 * @returns {Promise<string>} translated text
 * @throws {Error} with descriptive message on failure
 */
async function translateText(text, source, target) {
  if (!activeEndpoint) {
    throw new Error('Translation API is not available. Please check your internet connection.');
  }
  if (!text || !text.trim()) {
    throw new Error('No text to translate.');
  }
  if (source === target) {
    return text; // nothing to do
  }
  if (!isLTLangSupported(target)) {
    throw new Error(
      `LibreTranslate does not currently support ${getLangName(target)}. ` +
      `Try translating to Hindi, Bengali, Tamil, Telugu, Urdu, Gujarati, Malayalam, Kannada, Marathi, or Punjabi.`
    );
  }

  const payload = {
    q: text,
    source: isLTLangSupported(source) ? source : 'auto',
    target,
    format: 'text',
    alternatives: 0,
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${activeEndpoint}/translate`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload),
    });
    clearTimeout(timer);

    const data = await res.json();

    if (!res.ok) {
      // LibreTranslate returns { error: "..." } on failure
      const msg = data?.error ?? `HTTP ${res.status}`;
      // Rate limit
      if (res.status === 429) {
        throw new Error('Rate limit hit. Please wait a moment and try again.');
      }
      throw new Error(`Translation failed: ${msg}`);
    }

    const translated = data?.translatedText;
    if (!translated) throw new Error('Empty response from translation API.');

    return translated;
  } catch (err) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      throw new Error('Translation request timed out. Check your connection.');
    }
    throw err;
  }
}

/**
 * Returns the current active endpoint URL, or null.
 * @returns {string|null}
 */
function getActiveEndpoint() {
  return activeEndpoint;
}

/**
 * Returns a Set of supported LibreTranslate language codes.
 * @returns {Set<string>}
 */
function getSupportedLTCodes() {
  return supportedLTCodes;
}
