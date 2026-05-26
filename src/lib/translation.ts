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

const GOOGLE_LANG: Record<string, string> = {
  en: 'en',
  ar: 'ar',
  ru: 'ru',
  es: 'es',
  tl: 'fil',
};

const DEEPL_LANG: Record<string, string> = {
  en: 'EN',
  ar: 'AR',
  ru: 'RU',
  es: 'ES',
};

function detectSourceLang(text: string): string {
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  if (/[¿¡ñáéíóúü]/i.test(text)) return 'es';
  return 'en';
}

function mockTranslate(text: string, targetLang: string) {
  const trimmed = text.trim();
  const sourceLang = detectSourceLang(trimmed);
  if (sourceLang === targetLang) {
    return { original: text, translated: trimmed, targetLang, mock: true as const };
  }

  const known = PHRASES[trimmed.toLowerCase()]?.[targetLang];
  if (known) {
    return { original: text, translated: known, targetLang, mock: true as const };
  }

  const label = LANG_LABELS[targetLang] ?? targetLang.toUpperCase();
  return {
    original: text,
    translated: `(Translated to ${label}) ${trimmed}`,
    targetLang,
    mock: true as const,
  };
}

async function translateWithGoogle(text: string, targetLang: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) return null;

  const target = GOOGLE_LANG[targetLang];
  if (!target) return null;

  const url = new URL('https://translation.googleapis.com/language/translate/v2');
  url.searchParams.set('key', apiKey);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, target, format: 'text' }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    data?: { translations?: { translatedText?: string }[] };
  };
  return data.data?.translations?.[0]?.translatedText ?? null;
}

async function translateWithDeepL(text: string, targetLang: string): Promise<string | null> {
  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey || !DEEPL_LANG[targetLang]) return null;

  const baseUrl = apiKey.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

  const body = new URLSearchParams({
    auth_key: apiKey,
    text,
    target_lang: DEEPL_LANG[targetLang],
  });

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    translations?: { text?: string }[];
  };
  return data.translations?.[0]?.text ?? null;
}

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
    return { original: text, translated: trimmed, targetLang, mock: false };
  }

  try {
    const deepl = await translateWithDeepL(trimmed, targetLang);
    if (deepl) {
      return { original: text, translated: deepl, targetLang, mock: false };
    }

    const google = await translateWithGoogle(trimmed, targetLang);
    if (google) {
      return { original: text, translated: google, targetLang, mock: false };
    }
  } catch (error) {
    console.error('[Translation] provider error:', error);
  }

  return mockTranslate(text, targetLang);
}
