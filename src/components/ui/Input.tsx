import { forwardRef, InputHTMLAttributes } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, helperText, className = '', ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-[#A1A1AA] mb-1.5">{label}</label>
      )}
      <input
        ref={ref}
        className={`w-full h-11 px-3.5 bg-[#121216] border border-[#1E1E26] rounded-[8px] text-white placeholder-[#71717A] text-sm transition-all focus:outline-none focus:border-[#FF1493] focus:ring-1 focus:ring-[#FF1493] disabled:opacity-50 disabled:cursor-not-allowed ${
          error ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[#EF4444] font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-[#71717A]">{helperText}</p>}
    </div>
  );
});
