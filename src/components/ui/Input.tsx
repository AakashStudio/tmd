import { forwardRef, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
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
        <label className="block text-xs font-bold uppercase tracking-wider text-[#9E9E9E] mb-1.5">{label}</label>
      )}
      <input
        ref={ref}
        className={`w-full h-11 px-3.5 bg-[#141414] border border-[#242424] rounded-lg text-white placeholder-[#555555] text-sm transition-all focus:outline-none focus:border-[#E91E63] focus:ring-1 focus:ring-[#E91E63] disabled:opacity-50 disabled:cursor-not-allowed ${error ? 'border-[#EF4444] focus:border-[#EF4444] focus:ring-[#EF4444]' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[#EF4444] font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-[#616161]">{helperText}</p>}
    </div>
  );
});
