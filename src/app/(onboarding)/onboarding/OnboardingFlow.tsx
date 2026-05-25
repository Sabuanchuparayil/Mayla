'use client';

import { useReducer, useRef } from 'react';
import { track } from '@/lib/analytics';
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2Intent from './steps/Step2Intent';
import Step3Prompts from './steps/Step3Prompts';
import Step4Selfie from './steps/Step4Selfie';
import Step5Photos from './steps/Step5Photos';
import Step6Done from './steps/Step6Done';

const TOTAL_STEPS = 6;

type Direction = 'forward' | 'backward';

interface FlowState {
  step: number;
  direction: Direction;
  profileName: string;
}

type FlowAction =
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'SET_NAME'; name: string };

function flowReducer(state: FlowState, action: FlowAction): FlowState {
  switch (action.type) {
    case 'NEXT':
      return { ...state, step: Math.min(state.step + 1, TOTAL_STEPS), direction: 'forward' };
    case 'PREV':
      return { ...state, step: Math.max(state.step - 1, 1), direction: 'backward' };
    case 'SET_NAME':
      return { ...state, profileName: action.name };
    default:
      return state;
  }
}

interface Prompt {
  id: string;
  question: string;
  category: string;
}

interface Props {
  prompts: Prompt[];
  existingName: string | null;
  initialStep?: number;
}

export default function OnboardingFlow({ prompts, existingName, initialStep = 1 }: Props) {
  const [state, dispatch] = useReducer(flowReducer, {
    step: Math.min(Math.max(initialStep, 1), TOTAL_STEPS),
    direction: 'forward',
    profileName: existingName ?? '',
  });

  // Fire onboarding_completed once if the user lands directly on the done step.
  const completedTracked = useRef(false);
  if (state.step === TOTAL_STEPS && !completedTracked.current) {
    completedTracked.current = true;
    track('onboarding_completed');
  }

  const goNext = () => {
    const completedStep = state.step;
    const nextStep = Math.min(completedStep + 1, TOTAL_STEPS);
    track('onboarding_step_completed', { step: completedStep });
    if (nextStep === TOTAL_STEPS && !completedTracked.current) {
      completedTracked.current = true;
      track('onboarding_completed');
    }
    dispatch({ type: 'NEXT' });
  };
  const goPrev = () => dispatch({ type: 'PREV' });
  const setName = (name: string) => dispatch({ type: 'SET_NAME', name });

  const progress = (state.step / TOTAL_STEPS) * 100;

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col min-h-dvh">
      {/* Progress bar */}
      {state.step < TOTAL_STEPS && (
        <div className="px-4 pt-6 pb-4 sticky top-0 bg-gradient-to-b from-primary-50/90 to-transparent z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground/60">
              Step {state.step} of {TOTAL_STEPS - 1}
            </span>
            {state.step > 1 && (
              <button
                onClick={goPrev}
                className="text-sm text-foreground/60 hover:text-foreground transition-colors"
              >
                ← Back
              </button>
            )}
          </div>
          <div className="h-2 bg-primary-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-hidden relative">
        <div
          className={`transition-all duration-300 ${
            state.direction === 'forward'
              ? 'animate-slide-in-left'
              : 'animate-slide-in-right'
          }`}
          key={state.step}
        >
          {state.step === 1 && (
            <Step1BasicInfo onNext={(name: string) => { setName(name); goNext(); }} />
          )}
          {state.step === 2 && (
            <Step2Intent onNext={goNext} />
          )}
          {state.step === 3 && (
            <Step3Prompts prompts={prompts} onNext={goNext} />
          )}
          {state.step === 4 && (
            <Step4Selfie onNext={goNext} />
          )}
          {state.step === 5 && (
            <Step5Photos onNext={goNext} />
          )}
          {state.step === 6 && (
            <Step6Done name={state.profileName} />
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInFromLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-left {
          animation: slideInFromRight 0.3s ease-out;
        }
        .animate-slide-in-right {
          animation: slideInFromLeft 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
