'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';
import { useLocale } from '@/hooks/use-locale';
import { parseVCardPhones } from '@/lib/vcard';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

type PrivacyState = {
  profilePaused: boolean;
  incognitoMode: boolean;
  ladiesFirstMessaging: boolean;
  canUseIncognito: boolean;
  canControlPhotoBlur: boolean;
};

export function PrivacyPanel() {
  const { t } = useLocale();
  const [state, setState] = useState<PrivacyState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<PrivacyState>('/api/users/me/privacy').then((r) => {
      if (r.success) setState(r.data);
    });
  }, []);

  async function update(patch: Partial<PrivacyState>) {
    if (!state) return;
    setSaving(true);
    const result = await apiFetch<PrivacyState>('/api/users/me/privacy', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    setSaving(false);
    if (result.success) {
      setState({
        ...state,
        ...result.data,
        canUseIncognito: result.data.canUseIncognito ?? state.canUseIncognito,
        canControlPhotoBlur: result.data.canControlPhotoBlur ?? state.canControlPhotoBlur,
      });
    }
  }

  if (!state) return null;

  const toggles = [
    { key: 'profilePaused' as const, label: t('pauseProfile'), desc: 'Hide from Discover while keeping chats' },
    { key: 'incognitoMode' as const, label: t('incognito'), desc: 'Only people you liked can see you', disabled: !state.canUseIncognito },
    { key: 'ladiesFirstMessaging' as const, label: t('ladiesFirst'), desc: 'Only you can start conversations' },
  ];

  return (
    <div className="space-y-4">
      {toggles.map((t) => (
        <label key={t.key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-card-border p-4">
          <input
            type="checkbox"
            checked={state[t.key]}
            disabled={t.disabled || saving}
            onChange={(e) => void update({ [t.key]: e.target.checked })}
            className="mt-1"
          />
          <div>
            <p className="font-medium">{t.label}</p>
            <p className="text-xs text-muted-foreground">{t.desc}</p>
            {t.disabled ? (
              <p className="mt-1 text-xs text-amber-600">Gold+ required</p>
            ) : null}
          </div>
        </label>
      ))}
      <p className="text-xs text-muted-foreground">
        {state.canControlPhotoBlur
          ? 'Photo blur controls are in Profile → Photos. Choose which images stay hidden until match.'
          : 'Upgrade to Gold to blur or reveal individual photos until match (Profile → Photos).'}
      </p>
    </div>
  );
}

export function ContactsBlockPanel() {
  const [phones, setPhones] = useState('');
  const [synced, setSynced] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function syncPhoneList(list: string[]) {
    setLoading(true);
    setImportStatus('');
    const result = await apiFetch<{ synced: number }>('/api/users/me/contacts', {
      method: 'POST',
      body: JSON.stringify({ phones: list }),
    });
    setLoading(false);
    if (result.success) {
      setSynced(result.data.synced);
      setPhones(list.join('\n'));
    }
  }

  async function sync() {
    const list = phones.split(/[\n,;]+/).map((p) => p.trim()).filter(Boolean);
    await syncPhoneList(list);
  }

  async function importVCard(file: File) {
    const content = await file.text();
    const extracted = parseVCardPhones(content);
    if (extracted.length === 0) {
      setImportStatus('No phone numbers found in this file');
      return;
    }
    setImportStatus(`Found ${extracted.length} numbers — syncing...`);
    await syncPhoneList(extracted);
    setImportStatus(`Imported ${extracted.length} numbers from vCard`);
  }

  async function pickDeviceContacts() {
    const nav = navigator as Navigator & {
      contacts?: {
        select: (props: string[], opts: { multiple: boolean }) => Promise<{ tel?: string[] }[]>;
      };
    };

    if (!nav.contacts?.select) {
      setImportStatus('Contact picker not supported — use vCard upload or paste numbers');
      return;
    }

    try {
      const contacts = await nav.contacts.select(['tel'], { multiple: true });
      const extracted = contacts.flatMap((c) => c.tel ?? []).filter(Boolean);
      if (extracted.length === 0) {
        setImportStatus('No phone numbers selected');
        return;
      }
      setImportStatus(`Selected ${extracted.length} numbers — syncing...`);
      await syncPhoneList(extracted);
      setImportStatus(`Synced ${extracted.length} contacts from your phone`);
    } catch {
      setImportStatus('Contact picker cancelled');
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="phones">Phone numbers to hide (one per line)</Label>
      <textarea
        id="phones"
        className="min-h-[100px] w-full rounded-xl border border-card-border bg-transparent p-3 text-sm"
        placeholder="+971501234567&#10;+974551234567"
        value={phones}
        onChange={(e) => setPhones(e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" loading={loading} onClick={() => void sync()}>
          Sync contacts
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={loading}
          onClick={() => fileInputRef.current?.click()}
        >
          Import vCard
        </Button>
        <Button size="sm" variant="outline" disabled={loading} onClick={() => void pickDeviceContacts()}>
          Pick from phone
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".vcf,text/vcard,text/x-vcard"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void importVCard(file);
            e.target.value = '';
          }}
        />
      </div>
      {importStatus ? <p className="text-sm text-muted-foreground">{importStatus}</p> : null}
      {synced !== null ? (
        <p className="text-sm text-emerald-600">{synced} contacts synced — matching profiles hidden</p>
      ) : null}
    </div>
  );
}

export function PushNotificationsPanel() {
  const { t } = useLocale();
  const [status, setStatus] = useState('');

  async function enablePush() {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setStatus('Push not supported in this browser');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setStatus('Permission denied');
      return;
    }
    const reg = await navigator.serviceWorker.ready;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const sub = await reg.pushManager
      .subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey
          ? (urlBase64ToUint8Array(vapidKey) as BufferSource)
          : undefined,
      })
      .catch(() => null);

    if (!sub) {
      setStatus('Push subscription requires VAPID keys in production');
      return;
    }

    const json = sub.toJSON();
    await apiFetch('/api/users/me/push', {
      method: 'POST',
      body: JSON.stringify({
        endpoint: json.endpoint,
        keys: json.keys,
      }),
    });
    setStatus('Notifications enabled');
  }

  return (
    <div>
      <Button size="sm" variant="outline" onClick={() => void enablePush()}>
        {t('enablePush')}
      </Button>
      {status ? <p className="mt-2 text-sm text-muted-foreground">{status}</p> : null}
    </div>
  );
}

export function LocaleSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-card-border bg-transparent px-3 py-2 text-sm"
    >
      <option value="en">English</option>
      <option value="tl">Filipino</option>
      <option value="ru">Russian</option>
      <option value="es">Spanish</option>
      <option value="ar">Arabic</option>
    </select>
  );
}
