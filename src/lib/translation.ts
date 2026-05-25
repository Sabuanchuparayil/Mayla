const PHRASES: Record<string, Record<string, string>> = {
  hello: { en: 'hello', ar: 'مرحبا', ru: 'привет', es: 'hola', tl: 'kumusta' },
  hi: { en: 'hi', ar: 'أهلا', ru: 'привет', es: 'hola', tl: 'kumusta' },
  thanks: { en: 'thanks', ar: 'شكرا', ru: 'спасибо', es: 'gracias', tl: 'salamat' },
  'thank you': { en: 'thank you', ar: 'شكرا لك', ru: 'спасибо', es: 'gracias', tl: 'salamat' },
  'good morning': { en: 'good morning', ar: 'صباح الخير', ru: 'доброе утро', es: 'buenos días', tl: 'magandang umaga' },
  'good evening': { en: 'good evening', ar: 'مساء الخير', ru: 'добрый вечер', es: 'buenas tardes', tl: 'magandang gabi' },
  'how are you': { en: 'how are you', ar: 'كيف حالك', ru: 'как дела', es: 'cómo estás', tl: 'kumusta ka' },
  yes: { en: 'yes', ar: 'نعم', ru: 'да', es: 'sí', tl: 'oo' },
  no: { en: 'no', ar: 'لا', ru: 'нет', es: 'no', tl: 'hindi' },
};

const LANG_LABELS: Record<string, string> = {
  en: 'English',
  ar: 'Arabic',
  ru: 'Russian',
  es: 'Spanish',
  tl: 'Filipino',
};

function detectSourceLang(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  if (/[¿¡ñáéíóúü]/i.test(text)) return 'es';
  return 'en';
}

/** Mock translation — replace with DeepL/Google in production */
export async function translateText(
  text: string,
  targetLang: string,
): Promise<{ original: string; translated: string; targetLang: string; mock: boolean }> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { original: text, translated: text, targetLang, mock: true };
  }

  const sourceLang = detectSourceLang(trimmed);
  if (sourceLang === targetLang) {
    return { original: text, translated: trimmed, targetLang, mock: true };
  }

  const lower = trimmed.toLowerCase();
  const known = PHRASES[lower]?.[targetLang];
  if (known) {
    return { original: text, translated: known, targetLang, mock: true };
  }

  const label = LANG_LABELS[targetLang] ?? targetLang.toUpperCase();
  return {
    original: text,
    translated: `(Translated to ${label}) ${trimmed}`,
    targetLang,
    mock: true,
  };
}
