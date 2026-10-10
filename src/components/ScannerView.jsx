/**
 * src/components/ScannerView.jsx
 *
 * Wraps the html5-qrcode library to provide an in-browser QR scanner
 * with camera selection, file upload scanning fallback, and robust error recovery.
 *
 * Props:
 *   onScanSuccess(decodedText) – called once per successful scan.
 *   isActive                  – when false, the camera scanner is paused.
 *   onSwitchToManual          – optional callback to toggle to manual entry mode.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const SCANNER_ID = 'qr-reader-container';

const QR_CONFIG = {
  fps: 10,
  qrbox: { width: 240, height: 240 },
  aspectRatio: 1.0,
  disableFlip: false,
};

export default function ScannerView({ onScanSuccess, isActive, onSwitchToManual }) {
  const html5QrRef = useRef(null);
  const isRunningRef = useRef(false);
  const fileInputRef = useRef(null);

  const [cameraError, setCameraError] = useState(null); // null | 'permission_denied' | 'no_device' | 'in_use' | 'unknown'
  const [errorDetails, setErrorDetails] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [fileScanning, setFileScanning] = useState(false);

  // Safe cleanup of any active camera stream
  const stopScanner = useCallback(async () => {
    if (html5QrRef.current) {
      try {
        if (isRunningRef.current) {
          await html5QrRef.current.stop();
        }
        await html5QrRef.current.clear();
      } catch (_) {
        // Ignore cleanup errors
      }
      isRunningRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isActive) {
      stopScanner();
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      setCameraError(null);
      setErrorDetails('');

      // Ensure DOM element is present before initializing html5-qrcode
      const el = document.getElementById(SCANNER_ID);
      if (!el) return;

      try {
        // Stop any previous running scanner first
        await stopScanner();
        if (cancelled) return;

        html5QrRef.current = new Html5Qrcode(SCANNER_ID, { verbose: false });

        // Strategy 1: Try environment camera directly (prompts permission in modern browsers)
        try {
          await html5QrRef.current.start(
            { facingMode: 'environment' },
            QR_CONFIG,
            (decodedText) => {
              if (!cancelled) onScanSuccess(decodedText);
            },
            undefined,
          );
          if (cancelled) {
            await stopScanner();
            return;
          }
          isRunningRef.current = true;
          return;
        } catch (envErr) {
          // If facingMode failed, fall back to getCameras() list
          console.warn('[ScannerView] environment facingMode failed, falling back to camera list:', envErr?.message);
        }

        // Strategy 2: Query camera list and select best available camera
        const cameras = await Html5Qrcode.getCameras();
        if (cancelled) return;

        if (!cameras || cameras.length === 0) {
          setCameraError('no_device');
          return;
        }

        const rearCamera = cameras.find((c) => /back|rear|environment/i.test(c.label));
        const cameraId = rearCamera ? rearCamera.id : cameras[0].id;

        await html5QrRef.current.start(
          cameraId,
          QR_CONFIG,
          (decodedText) => {
            if (!cancelled) onScanSuccess(decodedText);
          },
          undefined,
        );

        if (cancelled) {
          await stopScanner();
          return;
        }

        isRunningRef.current = true;
      } catch (err) {
        if (cancelled) return;
        console.error('[ScannerView] start error:', err);

        const errMsg = err?.message?.toLowerCase() || '';
        const errName = err?.name || '';

        if (
          errName === 'NotAllowedError' ||
          errName === 'PermissionDeniedError' ||
          errMsg.includes('permission') ||
          errMsg.includes('denied') ||
          errMsg.includes('notallowed')
        ) {
          setCameraError('permission_denied');
        } else if (
          errName === 'NotFoundError' ||
          errName === 'DevicesNotFoundError' ||
          errMsg.includes('not found') ||
          errMsg.includes('no device') ||
          errMsg.includes('requested device not found')
        ) {
          setCameraError('no_device');
        } else if (
          errName === 'NotReadableError' ||
          errName === 'TrackStartError' ||
          errMsg.includes('in use') ||
          errMsg.includes('could not start video source')
        ) {
          setCameraError('in_use');
        } else {
          setCameraError('unknown');
          setErrorDetails(err?.message || '');
        }
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [isActive, retryKey, onScanSuccess, stopScanner]);

  const handleRetry = () => {
    setCameraError(null);
    setRetryKey((k) => k + 1);
  };

  // ── Image File Upload Scan (Fallback for devices without camera) ───────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileScanning(true);
    try {
      if (!html5QrRef.current) {
        html5QrRef.current = new Html5Qrcode(SCANNER_ID, { verbose: false });
      }
      const decodedText = await html5QrRef.current.scanFile(file, true);
      if (decodedText) {
        onScanSuccess(decodedText);
      }
    } catch (err) {
      alert('Could not decode QR code from the selected image. Please try a clearer image or enter the matric number manually.');
    } finally {
      setFileScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const messages = {
    permission_denied: {
      title: 'Camera Access Denied',
      body: 'Camera permission was blocked. Please enable camera access in your browser site settings and click Retry.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-red-600 dark:text-red-400">
          <path d="M12 9a3.75 3.75 0 100 7.5A3.75 3.75 0 0012 9z" />
          <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 015.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 01-3 3h-15a3 3 0 01-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 001.11-.71l.822-1.315a2.942 2.942 0 012.332-1.39zM6.75 12.75a5.25 5.25 0 1110.5 0 5.25 5.25 0 01-10.5 0zm12-1.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
        </svg>
      ),
    },
    no_device: {
      title: 'No Camera Detected',
      body: 'No active webcam or camera was found on this device. You can upload a QR image or use manual matric entry.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-amber-600 dark:text-amber-400">
          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
        </svg>
      ),
    },
    in_use: {
      title: 'Camera In Use',
      body: 'The camera is currently being used by another application or browser tab. Please close other apps using the camera and retry.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-amber-600 dark:text-amber-400">
          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
        </svg>
      ),
    },
    unknown: {
      title: 'Camera Unavailable',
      body: errorDetails || 'Could not connect to camera. Ensure camera permissions are granted or use manual matric entry.',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-red-600 dark:text-red-400">
          <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a1 1 0 110-2 1 1 0 010 2z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const currentError = cameraError ? (messages[cameraError] ?? messages.unknown) : null;

  return (
    <div className="relative w-full">
      {/* Hidden file input for QR image scanning fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
        id="qr-file-input"
      />

      {/* ── Error UI Card (shown overlaying when cameraError is active) ───── */}
      {cameraError && currentError && (
        <div className="glass-card flex flex-col items-center gap-3 p-4 sm:p-6 text-center animate-fade-in mb-3">
          {currentError.icon}
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{currentError.title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-white/60 leading-relaxed max-w-xs sm:max-w-sm">{currentError.body}</p>

          <div className="flex flex-wrap items-center justify-center gap-2 mt-2 w-full max-w-xs sm:max-w-sm">
            <button
              id="scanner-retry-btn"
              onClick={handleRetry}
              className="flex-1 min-w-[120px] min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
              </svg>
              Retry Camera
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={fileScanning}
              className="flex-1 min-w-[120px] min-h-[44px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/10 dark:bg-white/10 hover:bg-slate-900/15 dark:hover:bg-white/15 text-slate-800 dark:text-white/90 text-xs font-semibold transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5" aria-hidden="true">
                <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.22a.75.75 0 00-1.06 0l-1.91 1.91-4.72-4.72a.75.75 0 00-1.06 0L2.5 11.06zm12-4.81a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" clipRule="evenodd" />
              </svg>
              {fileScanning ? 'Scanning…' : 'Upload QR Image'}
            </button>
          </div>

          {onSwitchToManual && (
            <button
              type="button"
              onClick={onSwitchToManual}
              className="text-xs text-amber-600/90 dark:text-amber-400/90 hover:text-amber-700 dark:hover:text-amber-300 underline underline-offset-2 mt-1 min-h-[44px] px-2"
            >
              Switch to Manual Matric Entry →
            </button>
          )}
        </div>
      )}

      {/* ── Scanner Viewport Container (always present in DOM to prevent mount errors) ── */}
      <div className={`relative w-full overflow-hidden rounded-2xl ${cameraError ? 'hidden' : 'block'}`}>
        <div id={SCANNER_ID} className="w-full" />

        {/* Decorative scanning-reticle overlay */}
        {isActive && !cameraError && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <div className="relative w-44 h-44 sm:w-52 sm:h-52 max-w-[80%] max-h-[80%]">
              {['tl', 'tr', 'bl', 'br'].map((corner) => {
                const isTop = corner.startsWith('t');
                const isLeft = corner.endsWith('l');
                return (
                  <span
                    key={corner}
                    className={`absolute w-8 h-8 border-brand-400 border-opacity-80
                      ${isTop ? 'top-0 border-t-[3px]' : 'bottom-0 border-b-[3px]'}
                      ${isLeft ? 'left-0 border-l-[3px]' : 'right-0 border-r-[3px]'}
                      ${isTop && isLeft ? 'rounded-tl-lg' : ''}
                      ${isTop && !isLeft ? 'rounded-tr-lg' : ''}
                      ${!isTop && isLeft ? 'rounded-bl-lg' : ''}
                      ${!isTop && !isLeft ? 'rounded-br-lg' : ''}
                    `}
                  />
                );
              })}
              <div className="absolute left-1 right-1 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-80 animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {/* Optional Upload QR button when camera is active */}
      {!cameraError && (
        <div className="flex justify-center mt-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={fileScanning}
            className="text-[11px] sm:text-xs min-h-[44px] px-3 text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70 flex items-center gap-1 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M1 5.25A2.25 2.25 0 013.25 3h13.5A2.25 2.25 0 0119 5.25v9.5A2.25 2.25 0 0116.75 17H3.25A2.25 2.25 0 011 14.75v-9.5zm1.5 5.81v3.69c0 .414.336.75.75.75h13.5a.75.75 0 00.75-.75v-2.69l-2.22-2.22a.75.75 0 00-1.06 0l-1.91 1.91-4.72-4.72a.75.75 0 00-1.06 0L2.5 11.06zm12-4.81a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0z" clipRule="evenodd" />
            </svg>
            {fileScanning ? 'Scanning image…' : 'Or upload a QR image from device'}
          </button>
        </div>
      )}
    </div>
  );
}
