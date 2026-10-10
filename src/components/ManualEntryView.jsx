/**
 * src/components/ManualEntryView.jsx
 *
 * Secondary scan path: staff type a matric number when the QR can't be scanned.
 * Emits onSubmit(matricNumber) — parent handles the API call.
 *
 * Props:
 *   onSubmit  – (matricNumber: string) => void
 *   loading   – boolean  (API call in flight)
 *   disabled  – boolean
 */
import { useState, useRef, useEffect } from 'react';

export default function ManualEntryView({ onSubmit, loading, disabled = false }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  // Focus input when this view mounts
  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || loading || disabled) return;
    onSubmit(trimmed);
  };

  // Allow parent to clear input after each result (via key reset from ScanPage)
  // Parent resets by remounting, so no imperative ref needed.

  return (
    <div className="glass-card rounded-2xl p-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/30
                        flex items-center justify-center flex-shrink-0" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
            className="w-4 h-4 text-amber-600 dark:text-amber-400">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Manual Matric Entry</p>
          <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-0.5 leading-none">
            Card not scanned — for damaged or absent cards only
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
        <div>
          <label htmlFor="manual-matric-input"
            className="block text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-white/40 mb-1.5">
            Matric Number
          </label>
          <input
            ref={inputRef}
            id="manual-matric-input"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
            disabled={loading || disabled}
            placeholder="e.g. CSC/2021/001"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 rounded-xl px-4 py-3 min-h-[48px]
                       text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25 font-mono uppercase tracking-wide
                       focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
                       transition-all duration-150 disabled:opacity-40"
          />
        </div>

        <button
          id="manual-validate-btn"
          type="submit"
          disabled={!value.trim() || loading || disabled}
          className="w-full inline-flex items-center justify-center gap-2
                     bg-amber-600 hover:bg-amber-500 active:bg-amber-700
                     text-white text-sm font-semibold rounded-xl px-4 py-2.5
                     transition-all duration-150 min-h-[48px]
                     focus:outline-none focus:ring-2 focus:ring-amber-400
                     disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10"
                  stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Validating…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
              </svg>
              Validate
            </>
          )}
        </button>
      </form>
    </div>
  );
}
