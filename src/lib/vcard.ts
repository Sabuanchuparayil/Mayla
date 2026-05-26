/** Extract phone numbers from vCard (.vcf) text content. */
export function parseVCardPhones(content: string): string[] {
  const normalized = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const unfolded = normalized.replace(/\n[ \t]/g, '');
  const phones = new Set<string>();

  for (const line of unfolded.split('\n')) {
    const match = line.match(/^TEL(?:;[^:]*)*:(.+)$/i);
    if (match?.[1]) {
      const phone = match[1].trim();
      if (phone) phones.add(phone);
    }
  }

  return [...phones];
}
