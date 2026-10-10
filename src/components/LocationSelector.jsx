/**
 * src/components/LocationSelector.jsx
 *
 * Dynamic location selector for checkpoint tags.
 * Fetches active locations from GET /api/locations on mount.
 * Includes an "Other (specify)" option with an explicit "Start" button
 * required before scanning can begin for custom entries.
 *
 * Props:
 *   value      – string (current selected locationTag)
 *   onChange   – (location: string) => void
 *   disabled   – boolean
 */

import { useState, useEffect, useCallback } from 'react';
import axiosClient from '../api/axiosClient';

const OTHER_VALUE = '__OTHER__';

export default function LocationSelector({ value = '', onChange, disabled = false }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOther, setIsOther] = useState(false);
  const [customText, setCustomText] = useState('');
  const [isCommitted, setIsCommitted] = useState(false);

  const loadLocations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.get('/api/locations');
      const list = res.data.locations || res.data.data?.locations || [];
      setLocations(list);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Unable to load scan locations. Please check your network connection.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  // Synchronize state when value is passed or updated from parent
  useEffect(() => {
    if (!value) {
      if (!isOther) {
        setCustomText('');
      }
      setIsCommitted(false);
    } else if (locations.length > 0) {
      const isKnown = locations.some((loc) => {
        const locName = typeof loc === 'string' ? loc : loc.name;
        return locName === value;
      });
      if (!isKnown) {
        setIsOther(true);
        setCustomText(value);
        setIsCommitted(true);
      } else {
        setIsOther(false);
        setCustomText('');
        setIsCommitted(false);
      }
    }
  }, [value, locations]);

  // Regular dropdown selection or switching to "Other (specify)"
  const handleSelectChange = (e) => {
    const selected = e.target.value;
    if (selected === OTHER_VALUE) {
      setIsOther(true);
      setCustomText('');
      setIsCommitted(false);
      // Custom entry requires explicit Start button click — do not activate camera
      onChange?.('');
    } else {
      setIsOther(false);
      setCustomText('');
      setIsCommitted(false);
      // Managed location selection starts scanning immediately
      onChange?.(selected);
    }
  };

  // Typing in custom location input
  const handleCustomInputChange = (e) => {
    const text = e.target.value;
    setCustomText(text);

    // If staff changes text after clicking Start, un-commit and stop camera immediately
    if (isCommitted || value) {
      setIsCommitted(false);
      onChange?.('');
    }
  };

  // Explicit Start button click for custom location
  const handleCustomStart = () => {
    const trimmed = customText.trim();
    if (!trimmed || disabled) return;

    setIsCommitted(true);
    // Lock in locationTag and activate camera / enable validation
    onChange?.(trimmed);
  };

  // Determine current select element value
  const selectValue = isOther ? OTHER_VALUE : (value || '');

  return (
    <div className="glass-card p-3 sm:p-4 transition-all duration-200">
      <div className="flex items-center justify-between gap-2 mb-2">
        <label
          htmlFor="location-selector"
          className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-white/70"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          <span>Scan Location</span>
          <span className="text-brand-600 dark:text-brand-400 font-semibold">*</span>
        </label>

        {loading ? (
          <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Loading…
          </span>
        ) : value ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active: {value}
          </span>
        ) : (
          <span className="inline-flex items-center text-[10px] font-medium text-amber-700/80 dark:text-amber-300/80 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
            Required
          </span>
        )}
      </div>

      <div className="space-y-2">
        {loading ? (
          <div className="flex items-center gap-2.5 py-2.5 px-3.5 rounded-xl bg-slate-900/5 dark:bg-white/5 border border-slate-900/10 dark:border-white/10 text-slate-600 dark:text-white/50 text-sm animate-pulse">
            <svg className="animate-spin w-4 h-4 text-brand-600 dark:text-brand-400 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            <span>Loading checkpoint locations…</span>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs animate-fade-in"
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 text-red-600 dark:text-red-400">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              type="button"
              id="retry-locations-btn"
              onClick={loadLocations}
              className="self-start sm:self-auto min-h-[44px] px-4 py-1 rounded-lg bg-red-500/25 hover:bg-red-500/40 text-slate-900 dark:text-white font-semibold text-xs transition-colors"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="relative">
              <select
                id="location-selector"
                value={selectValue}
                onChange={handleSelectChange}
                disabled={disabled}
                className={[
                  'w-full bg-slate-900/5 dark:bg-white/5 border rounded-xl px-3.5 py-3 min-h-[48px] text-base sm:text-sm text-slate-900 dark:text-white appearance-none',
                  'focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all duration-150',
                  'disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer pr-10',
                  selectValue ? 'border-brand-500/40 bg-brand-500/5 font-medium' : 'border-slate-900/15 dark:border-white/15 text-slate-600 dark:text-white/50',
                ].join(' ')}
              >
                <option value="" disabled className="bg-white dark:bg-slate-900 text-slate-500 dark:text-white/50">
                  — Select checkpoint location —
                </option>
                {locations.map((loc) => {
                  const locName = typeof loc === 'string' ? loc : loc.name;
                  const locId = typeof loc === 'string' ? loc : loc._id;
                  return (
                    <option key={locId} value={locName} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                      {locName}
                    </option>
                  );
                })}
                <option value={OTHER_VALUE} className="bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-300 font-medium">
                  Other (specify)
                </option>
              </select>

              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 dark:text-white/40">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {locations.length === 0 && !isOther && (
              <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 px-1">
                No managed locations configured. Choose "Other (specify)" to type a location.
              </p>
            )}

            {/* Custom location input with explicit "Start" button */}
            {isOther && (
              <div className="space-y-2 pt-1 animate-fade-in">
                <div className="flex gap-2">
                  <div className="relative flex-1 min-w-0">
                    <input
                      id="custom-location-input"
                      type="text"
                      value={customText}
                      onChange={handleCustomInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCustomStart();
                        }
                      }}
                      disabled={disabled}
                      maxLength={60}
                      autoFocus
                      placeholder="Enter custom location name…"
                      className={[
                         'w-full bg-slate-900/5 dark:bg-white/5 border rounded-xl px-3.5 py-3 min-h-[48px] text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/25',
                        'focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all pr-12',
                        isCommitted ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-amber-500/40',
                      ].join(' ')}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[10px] text-slate-400 dark:text-white/30 font-mono">
                      {customText.length}/60
                    </div>
                  </div>

                  <button
                    type="button"
                    id="custom-location-start-btn"
                    onClick={handleCustomStart}
                    disabled={disabled || !customText.trim() || isCommitted}
                    className={[
                      'px-4 py-2.5 min-h-[48px] rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 flex-shrink-0',
                      isCommitted
                        ? 'bg-emerald-600/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 cursor-default'
                        : customText.trim()
                        ? 'bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white shadow-md focus:outline-none focus:ring-2 focus:ring-amber-400'
                        : 'bg-slate-900/10 dark:bg-white/10 text-slate-400 dark:text-white/30 border border-slate-900/10 dark:border-white/10 cursor-not-allowed',
                    ].join(' ')}
                  >
                    {isCommitted ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                        Started
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Start
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-amber-700/70 dark:text-amber-300/70 pl-1">
                  <span className="flex items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                    <span>This won't be added to the admin's location list automatically</span>
                  </span>

                  {!isCommitted && customText.trim() && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold animate-pulse">
                      Click "Start" to activate scanner →
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
