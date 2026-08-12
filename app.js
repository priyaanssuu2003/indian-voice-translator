const languages = [
    { code: 'as', bcp47: 'as-IN', name: 'Assamese' },
    { code: 'bn', bcp47: 'bn-IN', name: 'Bengali' },
    { code: 'brx', bcp47: 'brx-IN', name: 'Bodo' },
    { code: 'doi', bcp47: 'doi-IN', name: 'Dogri' },
    { code: 'gu', bcp47: 'gu-IN', name: 'Gujarati' },
    { code: 'hi', bcp47: 'hi-IN', name: 'Hindi' },
    { code: 'kn', bcp47: 'kn-IN', name: 'Kannada' },
    { code: 'ks', bcp47: 'ks-IN', name: 'Kashmiri' },
    { code: 'kok', bcp47: 'kok-IN', name: 'Konkani' },
    { code: 'mai', bcp47: 'mai-IN', name: 'Maithili' },
    { code: 'ml', bcp47: 'ml-IN', name: 'Malayalam' },
    { code: 'mni', bcp47: 'mni-IN', name: 'Manipuri' },
    { code: 'mr', bcp47: 'mr-IN', name: 'Marathi' },
    { code: 'ne', bcp47: 'ne-NP', name: 'Nepali' },
    { code: 'or', bcp47: 'or-IN', name: 'Odia' },
    { code: 'pa', bcp47: 'pa-IN', name: 'Punjabi' },
    { code: 'sa', bcp47: 'sa-IN', name: 'Sanskrit' },
    { code: 'sat', bcp47: 'sat-IN', name: 'Santali' },
    { code: 'sd', bcp47: 'sd-IN', name: 'Sindhi' },
    { code: 'ta', bcp47: 'ta-IN', name: 'Tamil' },
    { code: 'te', bcp47: 'te-IN', name: 'Telugu' },
    { code: 'ur', bcp47: 'ur-IN', name: 'Urdu' }
];

// DOM Elements
const sourceSelect = document.getElementById('source-lang');
const targetSelect = document.getElementById('target-lang');
const swapBtn = document.getElementById('swap-langs');
const micBtn = document.getElementById('mic-btn');
const micStatus = document.getElementById('mic-status');
const sourceText = document.getElementById('source-text');
const targetText = document.getElementById('target-text');
const playBtn = document.getElementById('play-btn');
const copyBtn = document.getElementById('copy-btn');
const toastEl = document.getElementById('toast');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history');
const modal = document.getElementById('settings-modal');
const openSettingsBtn = document.getElementById('open-settings');
const closeSettingsBtn = document.getElementById('close-settings');
const emailInput = document.getElementById('email-input');
const saveSettingsBtn = document.getElementById('save-settings');

// State
let isRecording = false;
let recognition = null;
let currentEmail = localStorage.getItem('anuvad_email') || '';
let history = JSON.parse(localStorage.getItem('anuvad_history') || '[]');

// Initialize Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
} else {
    showToast('Browser does not support Speech Recognition', 'error');
    micBtn.disabled = true;
}

// Populate Selects
function populateSelects() {
    languages.forEach(lang => {
        const option1 = document.createElement('option');
        option1.value = lang.code;
        option1.dataset.bcp = lang.bcp47;
        option1.textContent = lang.name;
        sourceSelect.appendChild(option1);

        const option2 = document.createElement('option');
        option2.value = lang.code;
        option2.dataset.bcp = lang.bcp47;
        option2.textContent = lang.name;
        targetSelect.appendChild(option2);
    });
    
    // Set defaults
    sourceSelect.value = 'hi';
    targetSelect.value = 'ta';
}

// Toast Notification
let toastTimeout;
function showToast(message, type = 'warning') {
    toastEl.textContent = message;
    toastEl.className = `toast ${type}`;
    
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.className = 'toast hidden';
    }, 3000);
}

// History
function renderHistory() {
    historyList.innerHTML = '';
    history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const langInfo = document.createElement('div');
        langInfo.className = 'history-langs';
        langInfo.textContent = `${getLangName(item.sourceCode)} → ${getLangName(item.targetCode)}`;
        
        const srcText = document.createElement('div');
        srcText.className = 'history-text';
        srcText.textContent = item.sourceText;
        
        const trgText = document.createElement('div');
        trgText.className = 'history-translation';
        trgText.textContent = item.targetText;
        
        li.appendChild(langInfo);
        li.appendChild(srcText);
        li.appendChild(trgText);
        historyList.appendChild(li);
    });
}

function addToHistory(sourceCode, targetCode, srcText, trgText) {
    history.unshift({ sourceCode, targetCode, sourceText: srcText, targetText: trgText });
    if (history.length > 20) history.pop(); // limit to 20
    localStorage.setItem('anuvad_history', JSON.stringify(history));
    renderHistory();
}

function getLangName(code) {
    const l = languages.find(x => x.code === code);
    return l ? l.name : code;
}

// Settings
openSettingsBtn.addEventListener('click', () => {
    emailInput.value = currentEmail;
    modal.classList.add('show');
});
closeSettingsBtn.addEventListener('click', () => modal.classList.remove('show'));
saveSettingsBtn.addEventListener('click', () => {
    currentEmail = emailInput.value.trim();
    localStorage.setItem('anuvad_email', currentEmail);
    modal.classList.remove('show');
    showToast('Settings saved', 'success');
});
window.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
});

// Translation API
async function translateText(text, sourceCode, targetCode) {
    try {
        let url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceCode}|${targetCode}`;
        if (currentEmail) {
            url += `&de=${encodeURIComponent(currentEmail)}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.responseStatus !== 200) {
            showToast('Translation failed: API Error', 'error');
            return null;
        }
        
        // MyMemory sometimes returns match scores
        if (data.responseData.match < 0.5) {
            showToast('Warning: Translation might be inaccurate', 'warning');
        }
        
        return data.responseData.translatedText;
    } catch (error) {
        console.error(error);
        showToast('Network error during translation', 'error');
        return null;
    }
}

// STT Logic
if (recognition) {
    recognition.onstart = () => {
        isRecording = true;
        micBtn.classList.add('active');
        micStatus.textContent = 'Listening...';
        sourceText.value = '';
        targetText.value = '';
        playBtn.disabled = true;
        copyBtn.disabled = true;
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        sourceText.value = finalTranscript || interimTranscript;
    };
    
    recognition.onend = async () => {
        isRecording = false;
        micBtn.classList.remove('active');
        micStatus.textContent = 'Tap to speak';
        
        const text = sourceText.value.trim();
        if (text) {
            micStatus.textContent = 'Translating...';
            const sCode = sourceSelect.value;
            const tCode = targetSelect.value;
            
            const translation = await translateText(text, sCode, tCode);
            if (translation) {
                targetText.value = translation;
                playBtn.disabled = false;
                copyBtn.disabled = false;
                addToHistory(sCode, tCode, text, translation);
                micStatus.textContent = 'Done';
                playTranslation(translation, tCode);
            } else {
                micStatus.textContent = 'Translation failed';
            }
        }
    };
    
    recognition.onerror = (event) => {
        console.error(event.error);
        showToast(`Mic error: ${event.error}`, 'error');
        isRecording = false;
        micBtn.classList.remove('active');
        micStatus.textContent = 'Tap to speak';
    };
}

// TTS Logic
function playTranslation(text, langCode) {
    if (!window.speechSynthesis) return;
    
    const langObj = languages.find(l => l.code === langCode);
    if (!langObj) return;
    const bcp = langObj.bcp47;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = bcp;
    
    // Find best voice if needed
    const voices = window.speechSynthesis.getVoices();
    const targetVoice = voices.find(v => v.lang.startsWith(bcp) || v.lang.startsWith(langCode));
    if (targetVoice) {
        utterance.voice = targetVoice;
    }
    
    window.speechSynthesis.speak(utterance);
}

// Ensure voices are loaded (Chrome)
if (window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

// Event Listeners
micBtn.addEventListener('click', () => {
    if (!recognition) return;
    
    if (isRecording) {
        recognition.stop();
    } else {
        const langObj = languages.find(l => l.code === sourceSelect.value);
        recognition.lang = langObj ? langObj.bcp47 : 'en-US';
        try {
            recognition.start();
        } catch(e) {
            showToast('Microphone access denied', 'error');
        }
    }
});

swapBtn.addEventListener('click', () => {
    const temp = sourceSelect.value;
    sourceSelect.value = targetSelect.value;
    targetSelect.value = temp;
    
    const tempText = sourceText.value;
    sourceText.value = targetText.value;
    targetText.value = tempText;
});

playBtn.addEventListener('click', () => {
    const text = targetText.value.trim();
    if (text) {
        playTranslation(text, targetSelect.value);
    }
});

copyBtn.addEventListener('click', () => {
    const text = targetText.value.trim();
    if (text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard', 'success');
        });
    }
});

clearHistoryBtn.addEventListener('click', () => {
    history = [];
    localStorage.removeItem('anuvad_history');
    renderHistory();
});

// Init
populateSelects();
renderHistory();
