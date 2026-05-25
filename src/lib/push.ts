import webpush from 'web-push';
import { db } from '@/lib/db';

let vapidConfigured = false;

function configureVapid(): boolean {
  if (vapidConfigured) return true;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? 'mailto:admin@mayla.app';

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
  return true;
}

export function isPushMockMode(): boolean {
  return !configureVapid();
}

export function getVapidPublicKey(): string | undefined {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? process.env.VAPID_PUBLIC_KEY;
}

export async function savePushSubscription(
  userId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
) {
  return db.pushSubscription.upsert({
    where: { userId_endpoint: { userId, endpoint: subscription.endpoint } },
    create: { userId, endpoint: subscription.endpoint, keys: subscription.keys },
    update: { keys: subscription.keys },
  });
}

export async function removePushSubscription(userId: string, endpoint: string) {
  await db.pushSubscription.deleteMany({ where: { userId, endpoint } });
}

export async function listUserPushSubscriptions(userId: string) {
  return db.pushSubscription.findMany({ where: { userId } });
}

export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
) {
  const subs = await listUserPushSubscriptions(userId);
  if (subs.length === 0) return { sent: 0 };

  if (isPushMockMode()) {
    console.info('[push]', userId, payload.title, payload.body);
    return { sent: subs.length, mock: true };
  }

  const body = JSON.stringify(payload);
  let sent = 0;

  await Promise.all(
    subs.map(async (sub) => {
      const keys = sub.keys as { p256dh: string; auth: string };
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys,
          },
          body,
        );
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await removePushSubscription(userId, sub.endpoint);
        }
        console.error('[push] send failed', userId, status, error);
      }
    }),
  );

  return { sent, mock: false };
}
