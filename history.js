/**
 * history.js
 * Manages the translation history stored in localStorage.
 * Each entry is a plain object serialized as JSON.
 */

const HISTORY_KEY = 'vak_translation_history';
const MAX_HISTORY = 50;

/**
 * Load history array from localStorage.
 * @returns {Array<HistoryEntry>}
 */
function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/**
 * Save history array to localStorage.
 * @param {Array} items
 */
function saveHistory(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('[History] Could not save:', e.message);
  }
}

/**
 * Add a new translation to the history (newest first, capped at MAX_HISTORY).
 * @param {object} entry
 * @param {string} entry.sourceLang  - LT code of source language
 * @param {string} entry.targetLang  - LT code of target language
 * @param {string} entry.sourceText  - original transcribed text
 * @param {string} entry.targetText  - translated text
 * @returns {Array} updated history
 */
function addToHistory({ sourceLang, targetLang, sourceText, targetText }) {
  const items = loadHistory();
  const entry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    sourceLang,
    targetLang,
    sourceText: sourceText.trim(),
    targetText: targetText.trim(),
  };
  items.unshift(entry);
  if (items.length > MAX_HISTORY) items.splice(MAX_HISTORY);
  saveHistory(items);
  return items;
}

/**
 * Clear all history.
 */
function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

/* ===== UI RENDERING ===== */

const historyListEl = document.getElementById('history-list');
const historyEmptyEl = document.getElementById('history-empty');

/**
 * Render history items into the DOM.
 * @param {Array} items
 */
function renderHistory(items) {
  // Remove existing history items (keep #history-empty)
  Array.from(historyListEl.querySelectorAll('.history-item')).forEach(el => el.remove());

  if (!items || items.length === 0) {
    historyEmptyEl.style.display = '';
    return;
  }

  historyEmptyEl.style.display = 'none';

  items.forEach(entry => {
    const el = createHistoryItemEl(entry);
    historyListEl.appendChild(el);
  });
}

/**
 * Prepend a single history item to the top of the list (after the empty notice).
 * @param {object} entry
 */
function prependHistoryItem(entry) {
  historyEmptyEl.style.display = 'none';
  const el = createHistoryItemEl(entry);
  // Insert right after the empty notice
  historyListEl.insertBefore(el, historyEmptyEl.nextSibling);

  // Cap DOM nodes
  const all = historyListEl.querySelectorAll('.history-item');
  if (all.length > MAX_HISTORY) {
    all[all.length - 1].remove();
  }
}

/**
 * Build a history item DOM element.
 * @param {object} entry
 * @returns {HTMLElement}
 */
function createHistoryItemEl(entry) {
  const srcName = getLangName(entry.sourceLang);
  const tgtName = getLangName(entry.targetLang);
  const timeStr = formatHistoryTime(entry.timestamp);

  const div = document.createElement('div');
  div.className = 'history-item';
  div.setAttribute('role', 'listitem');
  div.setAttribute('data-id', entry.id);
  div.title = `Click to reload this translation`;

  div.innerHTML = `
    <div class="history-item-content">
      <div class="history-langs">
        <span class="history-lang-tag">${escapeHtml(srcName)}</span>
        <span class="history-lang-arrow">→</span>
        <span class="history-lang-tag">${escapeHtml(tgtName)}</span>
        <span class="history-time">${timeStr}</span>
      </div>
      <div class="history-source">${escapeHtml(truncate(entry.sourceText, 80))}</div>
      <div class="history-target">${escapeHtml(truncate(entry.targetText, 80))}</div>
    </div>
    <button class="history-replay-btn" title="Replay translation audio" aria-label="Replay audio for this translation">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </button>
  `;

  // Replay button plays the target text
  div.querySelector('.history-replay-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const lang = getLangByLtCode(entry.targetLang);
    if (lang) {
      speak(entry.targetText, lang.bcp47);
    }
  });

  // Click item to reload into main panels
  div.addEventListener('click', () => {
    dispatchHistoryLoad(entry);
  });

  return div;
}

/**
 * Dispatch a custom event so app.js can reload a history entry.
 */
function dispatchHistoryLoad(entry) {
  document.dispatchEvent(new CustomEvent('history:load', { detail: entry }));
}

/* ===== HELPERS ===== */

function formatHistoryTime(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH}h ago`;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (_) { return ''; }
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
