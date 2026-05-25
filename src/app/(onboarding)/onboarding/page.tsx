import { requireServerUser, requireOnboardingComplete } from '@/lib/auth/server';
import { OnboardingForm } from '@/components/auth/onboarding-form';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const user = await requireServerUser();
  await requireOnboardingComplete(user, '/onboarding');

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <OnboardingForm defaultName={user.name} />
    </div>
  );
}
