/**
 * languages.js
 * Centralized language configuration for the Indian Voice Translator.
 * Maps language names → ISO codes for Web Speech API (BCP-47) and LibreTranslate.
 * Easily swap or extend here without touching speech/translation logic.
 */

/**
 * All 22 scheduled Indian languages with:
 *  - name: Display name
 *  - lt: LibreTranslate language code (ISO 639-1/3)
 *  - bcp47: BCP-47 tag used by Web Speech API (SpeechRecognition + speechSynthesis)
 *  - script: Script family (for UI hints)
 */
const INDIAN_LANGUAGES = [
  { name: 'Assamese',  lt: 'as', bcp47: 'as-IN', script: 'Bengali'   },
  { name: 'Bengali',   lt: 'bn', bcp47: 'bn-IN', script: 'Bengali'   },
  { name: 'Bodo',      lt: 'brx', bcp47: 'brx',  script: 'Devanagari'},
  { name: 'Dogri',     lt: 'doi', bcp47: 'doi',  script: 'Devanagari'},
  { name: 'Gujarati',  lt: 'gu', bcp47: 'gu-IN', script: 'Gujarati'  },
  { name: 'Hindi',     lt: 'hi', bcp47: 'hi-IN', script: 'Devanagari'},
  { name: 'Kannada',   lt: 'kn', bcp47: 'kn-IN', script: 'Kannada'   },
  { name: 'Kashmiri',  lt: 'ks', bcp47: 'ks',    script: 'Nastaliq'  },
  { name: 'Konkani',   lt: 'kok',bcp47: 'kok',   script: 'Devanagari'},
  { name: 'Maithili',  lt: 'mai', bcp47: 'mai',  script: 'Devanagari'},
  { name: 'Malayalam', lt: 'ml', bcp47: 'ml-IN', script: 'Malayalam' },
  { name: 'Manipuri',  lt: 'mni', bcp47: 'mni',  script: 'Meitei'    },
  { name: 'Marathi',   lt: 'mr', bcp47: 'mr-IN', script: 'Devanagari'},
  { name: 'Nepali',    lt: 'ne', bcp47: 'ne-IN', script: 'Devanagari'},
  { name: 'Odia',      lt: 'or', bcp47: 'or-IN', script: 'Odia'      },
  { name: 'Punjabi',   lt: 'pa', bcp47: 'pa-IN', script: 'Gurmukhi'  },
  { name: 'Sanskrit',  lt: 'sa', bcp47: 'sa',    script: 'Devanagari'},
  { name: 'Santali',   lt: 'sat', bcp47: 'sat',  script: 'Ol Chiki'  },
  { name: 'Sindhi',    lt: 'sd', bcp47: 'sd',    script: 'Devanagari'},
  { name: 'Tamil',     lt: 'ta', bcp47: 'ta-IN', script: 'Tamil'     },
  { name: 'Telugu',    lt: 'te', bcp47: 'te-IN', script: 'Telugu'    },
  { name: 'Urdu',      lt: 'ur', bcp47: 'ur-IN', script: 'Nastaliq'  },
];

/**
 * Returns the language config object by LibreTranslate code, or undefined.
 * @param {string} ltCode
 */
function getLangByLtCode(ltCode) {
  return INDIAN_LANGUAGES.find(l => l.lt === ltCode);
}

/**
 * Returns the language config object by BCP-47 tag or prefix, or undefined.
 * @param {string} bcp47
 */
function getLangByBcp47(bcp47) {
  return INDIAN_LANGUAGES.find(l => bcp47.startsWith(l.bcp47) || l.bcp47.startsWith(bcp47));
}

/**
 * Returns the display name for a LibreTranslate code, or the code itself.
 * @param {string} ltCode
 */
function getLangName(ltCode) {
  return getLangByLtCode(ltCode)?.name ?? ltCode.toUpperCase();
}

// Export for module consumers (unused in plain-script mode but harmless)
if (typeof module !== 'undefined') {
  module.exports = { INDIAN_LANGUAGES, getLangByLtCode, getLangByBcp47, getLangName };
}
