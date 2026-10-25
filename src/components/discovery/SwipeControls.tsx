"use client";

interface SwipeControlsProps {
  onPass: () => void;
  onLike: () => void;
  onRewind: () => void;
  disabled?: boolean;
  canRewind?: boolean;
}

export function SwipeControls({
  onPass,
  onLike,
  onRewind,
  disabled = false,
  canRewind = false,
}: SwipeControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-2.5">
      {/* Rewind Button */}
      <button
        type="button"
        onClick={onRewind}
        disabled={disabled}
        aria-label="Rewind"
        className="relative group p-3 rounded-full bg-zinc-900 border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 active:scale-95 transition-all shadow-lg hover:shadow-amber-500/20 disabled:opacity-40"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 10h10a5 5 0 0 1 5 5v2m0 0l-4-4m4 4l4-4M3 10l4-4m-4 4l4 4"
          />
        </svg>
        {!canRewind && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[#D4AF37] to-[#FFC629] text-black text-[9px] font-black px-1.5 py-0.5 rounded-full shadow">
            PRO
          </span>
        )}
      </button>

      {/* Pass (Cross) Button */}
      <button
        type="button"
        onClick={onPass}
        disabled={disabled}
        aria-label="Pass"
        className="p-4 rounded-full bg-zinc-900 border border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-500 active:scale-95 transition-all shadow-lg disabled:opacity-40"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-7 h-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Like (Heart) Button - Bumble Gold */}
      <button
        type="button"
        onClick={onLike}
        disabled={disabled}
        aria-label="Like"
        className="p-4 rounded-full bg-gradient-to-tr from-[#F59E0B] via-[#FFC629] to-[#F59E0B] text-black hover:brightness-105 active:scale-95 transition-all shadow-xl shadow-amber-500/35 border border-amber-300/40 disabled:opacity-40"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-7 h-7 fill-current"
          viewBox="0 0 24 24"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
    </div>
  );
}
