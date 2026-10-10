/**
 * src/pages/ScanPage.jsx
 *
 * The main scanner screen used by security / library / exam staff.
 *
 * Scan modes:
 *   scanMode = 'qr'     – camera scanner (default)
 *   scanMode = 'manual' – manual matric-number entry fallback
 *
 * State machine (shared across both modes):
 *   scanning – ready (camera live OR manual input open)
 *   loading  – API call in flight
 *   result   – API responded; ResultCard displayed
 *
 * API contract:
 *   POST /api/scan/validate
 *   QR path:     { token: <decoded QR string> }
 *   Manual path: { matricNumber }
 *   Response:    { result, method, data?: { student } }
 */

import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import ScannerView from '../components/ScannerView';
import ManualEntryView from '../components/ManualEntryView';
import ResultCard from '../components/ResultCard';
import LoadingSpinner from '../components/LoadingSpinner';
import LocationSelector from '../components/LocationSelector';

const SCAN_STATES = { SCANNING: 'scanning', LOADING: 'loading', RESULT: 'result' };

export default function ScanPage() {
  const { locationTag, setLocationTag } = useAuth();

  const [scanState,  setScanState]  = useState(SCAN_STATES.SCANNING);
  const [scanResult, setScanResult] = useState(null);   // { result, student?, method }
  const [apiError,   setApiError]   = useState('');
  const [scanMode,   setScanMode]   = useState('qr');   // 'qr' | 'manual'
  // Key used to remount ManualEntryView and clear its input after each result
  const [manualKey,  setManualKey]  = useState(0);

  // Camera active only in QR mode during scanning state when a location is selected
  const scannerActive = scanState === SCAN_STATES.SCANNING && scanMode === 'qr' && Boolean(locationTag);

  // ── Shared submission handler ──────────────────────────────────────────────
  // Accepts either { token } (QR) or { matricNumber } (manual) — never both.
  const submitValidation = useCallback(async ({ token, matricNumber }) => {
    if (!locationTag) {
      setApiError('Location tag is required before submitting a scan.');
      return;
    }

    setScanState(SCAN_STATES.LOADING);
    setApiError('');

    try {
      const body = matricNumber
        ? { matricNumber, locationTag }
        : { token, locationTag };

      const response = await axiosClient.post('/api/scan/validate', body);

      const { result, method, data } = response.data;
      const student = data?.student ?? null;

      setScanResult({ result, student, method: method ?? (matricNumber ? 'manual_entry' : 'qr_scan') });
      setScanState(SCAN_STATES.RESULT);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Network error. Please check your connection and try again.';
      setApiError(msg);
      setScanState(SCAN_STATES.SCANNING);
    }
  }, [locationTag]);

  // ── QR decode callback ─────────────────────────────────────────────────────
  const handleScanSuccess = useCallback((decodedText) => {
    submitValidation({ token: decodedText });
  }, [submitValidation]);

  // ── Manual entry submit ────────────────────────────────────────────────────
  const handleManualSubmit = useCallback((matricNumber) => {
    submitValidation({ matricNumber });
  }, [submitValidation]);

  // ── "Scan Next" — reset to QR mode and clear everything ───────────────────
  const handleScanNext = useCallback(() => {
    setScanResult(null);
    setApiError('');
    setScanMode('qr');          // always return to QR mode after each result
    setManualKey((k) => k + 1); // remount ManualEntryView to clear its input
    setScanState(SCAN_STATES.SCANNING);
  }, []);

  // ── Mode toggle ────────────────────────────────────────────────────────────
  const handleModeSwitch = (mode) => {
    if (mode === scanMode) return;
    setApiError('');
    setScanMode(mode);
  };

  const isLoading = scanState === SCAN_STATES.LOADING;

  return (
    <div className="flex-1 flex flex-col">
      {/* ── Main content ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col max-w-lg md:max-w-2xl xl:max-w-3xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-5 gap-3 sm:gap-4">

        {/* ── Location Selector — required before scanning / validating ───── */}
        {scanState !== SCAN_STATES.RESULT && (
          <LocationSelector
            value={locationTag}
            onChange={setLocationTag}
            disabled={isLoading}
          />
        )}

        {/* ── Mode toggle — only when not in result state ─────────────────── */}
        {scanState !== SCAN_STATES.RESULT && (
          <div
            role="tablist"
            aria-label="Scan method"
            className="flex rounded-xl overflow-hidden border border-slate-900/10 dark:border-white/10 bg-slate-900/5 dark:bg-white/5 p-1 gap-1 animate-fade-in"
          >
            <button
              id="mode-qr-tab"
              role="tab"
              aria-selected={scanMode === 'qr'}
              onClick={() => handleModeSwitch('qr')}
              disabled={isLoading}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-3 min-h-[44px] px-3 rounded-lg text-sm font-semibold transition-all duration-200',
                scanMode === 'qr'
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-white/45 hover:text-slate-700 dark:hover:text-white/75 hover:bg-slate-900/5 dark:hover:bg-white/5',
                'disabled:opacity-40',
              ].join(' ')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                <path fillRule="evenodd" d="M2 4.25A2.25 2.25 0 014.25 2h2A2.25 2.25 0 018.5 4.25v2A2.25 2.25 0 016.25 8.5h-2A2.25 2.25 0 012 6.25v-2zm9.5 0A2.25 2.25 0 0113.75 2h2A2.25 2.25 0 0118 4.25v2a2.25 2.25 0 01-2.25 2.25h-2a2.25 2.25 0 01-2.25-2.25v-2zm-9.5 9.5A2.25 2.25 0 014.25 11.5h2a2.25 2.25 0 012.25 2.25v2A2.25 2.25 0 016.25 18h-2A2.25 2.25 0 012 15.75v-2zm9.5 0A2.25 2.25 0 0113.75 11.5h2A2.25 2.25 0 0118 13.75v2A2.25 2.25 0 0115.75 18h-2a2.25 2.25 0 01-2.25-2.25v-2z" clipRule="evenodd" />
              </svg>
              Scan QR Code
            </button>

            <button
              id="mode-manual-tab"
              role="tab"
              aria-selected={scanMode === 'manual'}
              onClick={() => handleModeSwitch('manual')}
              disabled={isLoading}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-3 min-h-[44px] px-3 rounded-lg text-sm font-semibold transition-all duration-200',
                scanMode === 'manual'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-white/45 hover:text-slate-700 dark:hover:text-white/75 hover:bg-slate-900/5 dark:hover:bg-white/5',
                'disabled:opacity-40',
              ].join(' ')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
              </svg>
              Enter Matric No.
            </button>
          </div>
        )}

        {/* ── SCANNING / LOADING — QR mode ──────────────────────────────── */}
        {(scanState === SCAN_STATES.SCANNING || isLoading) && scanMode === 'qr' && (
          <div className="flex flex-col gap-4">
            {!locationTag ? (
              <div className="glass-card p-5 sm:p-7 flex flex-col items-center justify-center text-center gap-3.5 border border-amber-500/25 bg-amber-500/5 animate-fade-in">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" aria-hidden="true">
                    <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Location Selection Required</h3>
                  <p className="text-xs text-slate-600 dark:text-white/50 mt-1 max-w-xs mx-auto">
                    Please select a checkpoint location above before scanning. The camera will activate immediately once selected.
                  </p>
                </div>
              </div>
            ) : (
              <div className="glass-card overflow-hidden p-3">
                {/* ScannerView is always rendered in QR mode to avoid remount cost,
                    but isActive=false pauses decoding during loading */}
                <ScannerView
                  onScanSuccess={handleScanSuccess}
                  isActive={scannerActive}
                  onSwitchToManual={() => handleModeSwitch('manual')}
                />
              </div>
            )}

            {scanState === SCAN_STATES.SCANNING && locationTag && (
              <div className="flex items-center justify-center gap-2 text-slate-500 dark:text-white/40 text-sm animate-fade-in">
                <span className="inline-block w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                Point the camera at a student ID QR code
              </div>
            )}

            {isLoading && (
              <div className="glass-card py-8 animate-fade-in">
                <LoadingSpinner overlay message="Validating ID…" />
              </div>
            )}
          </div>
        )}

        {/* ── SCANNING / LOADING — Manual mode ─────────────────────────── */}
        {(scanState === SCAN_STATES.SCANNING || isLoading) && scanMode === 'manual' && (
          <div className="flex flex-col gap-3">
            {isLoading ? (
              <div className="glass-card py-8 animate-fade-in">
                <LoadingSpinner overlay message="Validating ID…" />
              </div>
            ) : (
              <>
                <ManualEntryView
                  key={manualKey}
                  onSubmit={handleManualSubmit}
                  loading={isLoading}
                  disabled={!locationTag || isLoading}
                />
                {!locationTag && (
                  <div className="text-center px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-medium animate-fade-in">
                    Select a scan location above to enable manual validation.
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── RESULT ─────────────────────────────────────────────────────── */}
        {scanState === SCAN_STATES.RESULT && scanResult && (
          <ResultCard
            result={scanResult.result}
            student={scanResult.student}
            method={scanResult.method}
            onScanNext={handleScanNext}
          />
        )}

        {/* ── API / network error banner ──────────────────────────────────── */}
        {apiError && scanState === SCAN_STATES.SCANNING && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-xl bg-red-500/15 border border-red-500/30
                       text-red-700 dark:text-red-300 text-sm px-4 py-3 animate-fade-in"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            {apiError}
          </div>
        )}
      </main>
    </div>
  );
}
