'use client';

import { useActionState, useCallback, useEffect, useRef, useState } from 'react';
import { verifyOTPAction, resendOTPAction, type AuthActionState } from '@/app/actions/auth';

const RESEND_SECONDS = 60;
const CODE_LENGTH = 6;

interface VerifyFormProps {
  maskedPhone: string;
}

export default function VerifyForm({ maskedPhone }: VerifyFormProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resendError, setResendError] = useState<string | undefined>();
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(verifyOTPAction, undefined);

  // Countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  // Auto-submit when all digits are filled
  useEffect(() => {
    const code = digits.join('');
    if (code.length === CODE_LENGTH && /^\d{6}$/.test(code)) {
      formRef.current?.requestSubmit();
    }
  }, [digits]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = useCallback((index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, []);

  const handleKeyDown = useCallback((index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (digits[index]) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
      }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }, [digits]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    if (!pasted) return;
    const next = Array(CODE_LENGTH).fill('') as string[];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i] ?? '';
    setDigits(next);
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  }, []);

  const handleResend = async () => {
    setResendError(undefined);
    setResendSuccess(false);
    const result = await resendOTPAction();
    if (result?.error) {
      setResendError(result.error);
    } else {
      setSecondsLeft(RESEND_SECONDS);
      setDigits(Array(CODE_LENGTH).fill(''));
      setResendSuccess(true);
      inputRefs.current[0]?.focus();
    }
  };

  const code = digits.join('');
  const isComplete = code.length === CODE_LENGTH && /^\d{6}$/.test(code);
  const countdownDisplay = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return (
    <form ref={formRef} action={formAction} className="w-full space-y-6">
      {/* Hidden code field */}
      <input type="hidden" name="code" value={code} />

      {/* OTP digit inputs */}
      <div className="flex justify-between gap-2" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            disabled={isPending}
            className={[
              'h-12 w-12 rounded-xl border-2 text-center text-lg font-semibold text-gray-900',
              'transition-all focus:outline-none',
              digit
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 bg-white',
              'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
              isPending ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {state?.error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {resendError && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {resendError}
        </div>
      )}

      {resendSuccess && (
        <div className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          New code sent to {maskedPhone}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !isComplete}
        className="w-full h-12 rounded-xl bg-primary-500 font-semibold text-white transition-all hover:bg-primary-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:ring-offset-2"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Verifying…
          </span>
        ) : (
          'Verify'
        )}
      </button>

      <div className="text-center text-sm text-gray-500">
        {secondsLeft > 0 ? (
          <span>
            Resend code in{' '}
            <span className="font-medium text-gray-700 tabular-nums">{countdownDisplay}</span>
          </span>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="font-medium text-primary-500 hover:text-primary-600 hover:underline focus:outline-none"
          >
            Resend code
          </button>
        )}
      </div>
    </form>
  );
}
