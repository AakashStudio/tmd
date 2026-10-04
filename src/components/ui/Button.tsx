import { forwardRef, ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', fullWidth = false, loading = false, disabled, children, className = '', ...props },
  ref
) {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-150 rounded-[8px] select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF1493] focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080A] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';

  const variants = {
    primary: 'bg-[#FF1493] hover:bg-[#E0007E] active:bg-[#C2006D] text-white shadow-md shadow-[#FF1493]/20 border border-[#FF4D6D]/30',
    secondary: 'bg-[#1A1A22] text-white border border-[#2D2D38] hover:bg-[#22222E] hover:border-[#3D3D4C]',
    outline: 'bg-transparent text-[#FF1493] border border-[#FF1493] hover:bg-[#FF1493]/10',
    ghost: 'bg-transparent text-[#A1A1AA] hover:text-white hover:bg-[#1A1A22]',
    danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] border border-[#F87171]/20',
  };

  const sizes = {
    sm: 'h-9 px-3.5 text-xs gap-1.5',
    md: 'h-11 px-5 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
});
