/**
 * src/components/LoadingSpinner.jsx
 *
 * Animated SVG ring spinner.
 * Props:
 *   message  – optional label shown below the spinner
 *   size     – 'sm' | 'md' (default) | 'lg'
 *   overlay  – if true, centers inside a full-height flex container
 */

export default function LoadingSpinner({ message, size = 'md', overlay = false }) {
  const dims = { sm: 28, md: 44, lg: 64 }[size] ?? 44;
  const stroke = { sm: 3, md: 4, lg: 5 }[size] ?? 4;
  const r = (dims - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;

  const spinner = (
    <div className="flex flex-col items-center gap-3">
      <svg
        width={dims}
        height={dims}
        viewBox={`0 0 ${dims} ${dims}`}
        aria-label="Loading"
        role="status"
        className="animate-spin-slow"
      >
        {/* Track */}
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={stroke}
        />
        {/* Progress arc — 75 % visible */}
        <circle
          cx={dims / 2}
          cy={dims / 2}
          r={r}
          fill="none"
          stroke="url(#spinnerGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={circ * 0.25}
          transform={`rotate(-90 ${dims / 2} ${dims / 2})`}
        />
        <defs>
          <linearGradient id="spinnerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#818cf8" />
            <stop offset="100%" stopColor="#a78bfa" />
          </linearGradient>
        </defs>
      </svg>
      {message && (
        <p className="text-slate-600 dark:text-white/60 text-sm font-medium tracking-wide animate-fade-in">
          {message}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="flex flex-1 items-center justify-center py-12">
        {spinner}
      </div>
    );
  }

  return spinner;
}
