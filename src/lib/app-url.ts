/** Runtime app URL — prefer APP_ORIGIN so invite links work without a client rebuild. */
export function getAppBaseUrl(): string {
  return process.env.APP_ORIGIN ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}
