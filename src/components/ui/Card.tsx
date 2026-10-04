import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'surface' | 'elevated' | 'interactive';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'surface', className = '', children, ...props },
  ref
) {
  const variants = {
    surface: 'bg-[#121216] border border-[#1E1E26]',
    elevated: 'bg-[#1A1A22] border border-[#2D2D38] shadow-lg',
    interactive: 'bg-[#121216] border border-[#1E1E26] hover:border-[#2D2D38] hover:bg-[#1A1A22] transition-colors cursor-pointer',
  };

  return (
    <div
      ref={ref}
      className={`rounded-[8px] p-4 text-white ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
