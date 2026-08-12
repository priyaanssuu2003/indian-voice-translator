/**
 * api.js
 * Handles communication with the Anthropic Claude API for text translation.
 * Only the translation step uses an external API — STT and TTS are browser-native.
 */

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Translates text from a source language to a target language using Claude.
 *
 * @param {string} text - The text to translate
 * @param {string} sourceLang - The source language name (e.g., "Hindi")
 * @param {string} targetLang - The target language name (e.g., "Tamil")
 * @param {string} apiKey - The Anthropic API key
 * @returns {Promise<string>} - The translated text
 */
export async function translateText(text, sourceLang, targetLang, apiKey) {
  if (!text || !text.trim()) {
    throw new Error("No text provided for translation.");
  }
  if (!apiKey || !apiKey.trim()) {
    throw new Error(
      "Anthropic API key is missing. Please enter your key in the settings panel."
    );
  }

  const systemPrompt = `You are a precise multilingual translator specializing in Indian languages. 
Your task is to translate the given text accurately.
Rules:
- Return ONLY the translated text. No explanations, no notes, no alternatives.
- Preserve the tone and meaning of the original.
- Use the natural script of the target language (e.g., Devanagari for Hindi, Tamil script for Tamil, etc.).
- If source and target language are the same, return the original text unchanged.`;

  const userPrompt = `Translate the following text from ${sourceLang} to ${targetLang}:

"${text}"`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(`Translation API error: ${message}`);
  }

  const data = await response.json();
  const translated = data?.content?.[0]?.text?.trim();

  if (!translated) {
    throw new Error("Received an empty response from the translation API.");
  }

  return translated;
}
