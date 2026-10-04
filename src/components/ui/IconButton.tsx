import { forwardRef, ButtonHTMLAttributes } from 'react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'like' | 'pass' | 'rewind' | 'surface' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'surface', size = 'md', loading = false, disabled, children, className = '', ...props },
  ref
) {
  const baseStyles = 'inline-flex items-center justify-center rounded-full select-none cursor-pointer transition-all duration-150 active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF1493]';

  const variants = {
    like: 'bg-gradient-to-tr from-[#FF1493] to-[#FF4D6D] text-white shadow-xl shadow-[#FF1493]/30 hover:brightness-110 active:brightness-95',
    pass: 'bg-[#121216] border border-[#2D2D38] text-[#EF4444] hover:bg-[#1A1A22] hover:border-[#EF4444]/50 shadow-md',
    rewind: 'bg-[#121216] border border-[#2D2D38] text-[#FF4D6D] hover:bg-[#1A1A22] hover:border-[#FF4D6D]/50 shadow-md',
    surface: 'bg-[#1A1A22] border border-[#2D2D38] text-[#A1A1AA] hover:text-white hover:bg-[#22222E] shadow-sm',
    ghost: 'bg-transparent text-[#A1A1AA] hover:text-white hover:bg-[#1A1A22]',
  };

  const sizes = {
    sm: 'w-9 h-9',
    md: 'w-11 h-11',
    lg: 'w-14 h-14',
    xl: 'w-16 h-16',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : children}
    </button>
  );
});
