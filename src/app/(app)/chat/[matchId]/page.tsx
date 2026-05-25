import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import { redirect } from 'next/navigation';
import ChatView from './ChatView';

interface PageProps {
  params: Promise<{ matchId: string }>;
}

export default async function ChatPage({ params }: PageProps) {
  const { matchId } = await params;
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('access_token');

  if (!tokenCookie?.value) {
    redirect('/login');
  }

  const accessToken = tokenCookie.value;

  let userId: string;
  try {
    const secret = new TextEncoder().encode(process.env['JWT_SECRET'] ?? 'secret');
    const { payload } = await jwtVerify(accessToken, secret);
    userId = String(payload['sub'] ?? payload['userId'] ?? payload['id'] ?? '');
    if (!userId) throw new Error('no userId in token');
  } catch {
    redirect('/login');
  }

  return (
    <ChatView matchId={matchId} userId={userId} accessToken={accessToken} />
  );
}
