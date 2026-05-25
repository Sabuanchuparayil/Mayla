'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiFetch } from '@/lib/api/client';
import { REPORT_CATEGORIES } from '@/lib/validators/profile';

type BlockReportModalProps = {
  userId: string;
  displayName: string;
  open: boolean;
  onClose: () => void;
  onBlocked?: () => void;
};

export function BlockReportModal({
  userId,
  displayName,
  open,
  onClose,
  onBlocked,
}: BlockReportModalProps) {
  const [mode, setMode] = useState<'menu' | 'report'>('menu');
  const [reason, setReason] = useState<string>('HARASSMENT');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  if (!open) return null;

  async function handleBlock() {
    setLoading(true);
    setMessage('');
    const result = await apiFetch('/api/users/block', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
    setLoading(false);
    if (result.success) {
      onBlocked?.();
      onClose();
    } else {
      setMessage(result.error.message);
    }
  }

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const result = await apiFetch('/api/users/report', {
      method: 'POST',
      body: JSON.stringify({ userId, reason, details: details || undefined }),
    });
    setLoading(false);
    if (result.success) {
      setMessage('Report submitted. Thank you for keeping Mayla safe.');
      setTimeout(onClose, 1500);
    } else {
      setMessage(result.error.message);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl animate-scale-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold">
            {mode === 'menu' ? displayName : 'Report user'}
          </h3>
          <button
            type="button"
            onClick={() => {
              setMode('menu');
              onClose();
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {message ? (
          <p className="mb-4 text-sm text-muted-foreground">{message}</p>
        ) : null}

        {mode === 'menu' ? (
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start text-red-600"
              loading={loading}
              onClick={handleBlock}
            >
              Block {displayName}
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setMode('report')}>
              Report {displayName}
            </Button>
            <Button variant="ghost" className="w-full" onClick={onClose}>
              Cancel
            </Button>
          </div>
        ) : (
          <form onSubmit={handleReport} className="space-y-4">
            <div>
              <Label>Reason</Label>
              <div className="mt-2 space-y-2">
                {REPORT_CATEGORIES.map((cat) => (
                  <label
                    key={cat.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-sm"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={cat.value}
                      checked={reason === cat.value}
                      onChange={() => setReason(cat.value)}
                    />
                    {cat.label}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="details">Additional details (optional)</Label>
              <Input
                id="details"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Tell us more..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setMode('menu')}>
                Back
              </Button>
              <Button type="submit" className="flex-1" loading={loading}>
                Submit report
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
