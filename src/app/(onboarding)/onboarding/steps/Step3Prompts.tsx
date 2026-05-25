'use client';

import { useState } from 'react';
import { savePrompts } from '@/app/actions/onboarding';

const MAX_PROMPTS = 3;
const MAX_CHARS = 300;

interface Prompt {
  id: string;
  question: string;
  category: string;
}

interface SelectedPrompt {
  promptId: string;
  answer: string;
}

interface Props {
  prompts: Prompt[];
  onNext: () => void;
}

export default function Step3Prompts({ prompts, onNext }: Props) {
  const [selected, setSelected] = useState<SelectedPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Group prompts by category
  const grouped = prompts.reduce<Record<string, Prompt[]>>((acc, p) => {
    const cat = p.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const isSelected = (id: string) => selected.some((s) => s.promptId === id);
  const getAnswer = (id: string) => selected.find((s) => s.promptId === id)?.answer ?? '';

  const togglePrompt = (prompt: Prompt) => {
    if (isSelected(prompt.id)) {
      setSelected((prev) => prev.filter((s) => s.promptId !== prompt.id));
    } else if (selected.length < MAX_PROMPTS) {
      setSelected((prev) => [...prev, { promptId: prompt.id, answer: '' }]);
    }
  };

  const setAnswer = (promptId: string, answer: string) => {
    setSelected((prev) =>
      prev.map((s) => (s.promptId === promptId ? { ...s, answer: answer.slice(0, MAX_CHARS) } : s)),
    );
  };

  const handleContinue = async () => {
    if (selected.length < MAX_PROMPTS) {
      setError(`Please select ${MAX_PROMPTS} prompts.`);
      return;
    }
    const unanswered = selected.filter((s) => !s.answer.trim());
    if (unanswered.length > 0) {
      setError('Please answer all selected prompts.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await savePrompts(selected);
    setLoading(false);
    if (!result.success) { setError(result.error); return; }
    onNext();
  };

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold text-foreground mb-1">Your profile prompts</h1>
      <p className="text-foreground/60 mb-2">
        Pick {MAX_PROMPTS} prompts and write your answers
      </p>
      <p className="text-sm text-primary-500 font-medium mb-6">
        {selected.length}/{MAX_PROMPTS} selected
      </p>

      {/* Selected prompts with answer boxes */}
      {selected.length > 0 && (
        <div className="mb-6 space-y-3">
          {selected.map((s) => {
            const prompt = prompts.find((p) => p.id === s.promptId);
            if (!prompt) return null;
            return (
              <div key={s.promptId} className="rounded-2xl border-2 border-primary-500 bg-primary-50 p-4">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-primary-700 text-sm flex-1 pr-2">{prompt.question}</p>
                  <button
                    type="button"
                    onClick={() => togglePrompt(prompt)}
                    className="text-primary-400 hover:text-primary-600 text-xs flex-shrink-0"
                  >
                    Remove
                  </button>
                </div>
                <textarea
                  value={s.answer}
                  onChange={(e) => setAnswer(s.promptId, e.target.value)}
                  placeholder="Write your answer..."
                  rows={3}
                  maxLength={MAX_CHARS}
                  className="w-full text-sm bg-white rounded-lg border border-primary-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-foreground placeholder:text-foreground/40"
                />
                <p className="text-xs text-foreground/40 text-right mt-1">
                  {s.answer.length}/{MAX_CHARS}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Prompts grouped by category */}
      <div className="space-y-5">
        {Object.entries(grouped).map(([category, categoryPrompts]) => (
          <div key={category}>
            <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-wider mb-2">
              {category}
            </h3>
            <div className="space-y-2">
              {categoryPrompts.map((prompt) => {
                const sel = isSelected(prompt.id);
                const atMax = selected.length >= MAX_PROMPTS && !sel;
                return (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => !atMax && togglePrompt(prompt)}
                    disabled={atMax}
                    className={`w-full text-left px-4 py-3 rounded-xl border transition-colors text-sm ${
                      sel
                        ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                        : atMax
                        ? 'border-primary-100 bg-gray-50 text-foreground/40 cursor-not-allowed'
                        : 'border-primary-100 bg-white text-foreground hover:border-primary-300'
                    }`}
                  >
                    {prompt.question}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg mt-4">{error}</p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={loading || selected.length < MAX_PROMPTS}
        className="w-full mt-6 py-4 bg-primary-500 text-white rounded-xl font-semibold text-base hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}
