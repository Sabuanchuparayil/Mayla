'use client';

import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function SafetyCenter() {
  return (
    <Card>
      <CardHeader
        title="Safety Center"
        description="Tools and tips to stay safe while meeting new people"
      />
      <div className="space-y-4 text-sm text-muted-foreground">
        <div className="rounded-xl border border-card-border p-4">
          <p className="font-medium text-foreground">Every profile is selfie-verified</p>
          <p className="mt-1">
            Mayla requires live selfie verification before appearing in Discover. Report anyone who
            seems misrepresented.
          </p>
        </div>
        <div className="rounded-xl border border-card-border p-4">
          <p className="font-medium text-foreground">Meet in public first</p>
          <p className="mt-1">
            Choose a busy café or mall for first dates. Tell a friend where you&apos;re going and
            share your live location.
          </p>
        </div>
        <div className="rounded-xl border border-card-border p-4">
          <p className="font-medium text-foreground">Block &amp; report</p>
          <p className="mt-1">
            Use the ··· menu on any profile or chat to block or report. Blocked users cannot see
            you or contact you.
          </p>
        </div>
        <Button href="mailto:safety@mayla.app" variant="outline" className="w-full">
          Contact safety team
        </Button>
      </div>
    </Card>
  );
}
