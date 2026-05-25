// Minimal prohibited content list — extend with a proper dataset in production
const PROHIBITED_TERMS = [
  'spam', 'phishing', 'onlyfans.com', 'cashapp', 'venmo me',
  'click here', 'free money', 'wire transfer',
];

export interface FilterResult {
  clean: boolean;
  reason?: 'prohibited_content';
}

export function filterText(text: string): FilterResult {
  const lower = text.toLowerCase();
  for (const term of PROHIBITED_TERMS) {
    if (lower.includes(term)) return { clean: false, reason: 'prohibited_content' };
  }
  return { clean: true };
}
