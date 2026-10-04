export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'premium' | 'subtle';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-[#1A1A22] text-[#A1A1AA] border border-[#2D2D38]',
    success: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-semibold',
    warning: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold',
    error: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-semibold',
    premium: 'bg-gradient-to-r from-[#FF1493]/20 to-[#FF4D6D]/20 text-[#FF4D6D] border border-[#FF1493]/40 font-bold',
    subtle: 'bg-white/10 backdrop-blur-md text-white border border-white/15 font-medium',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center rounded-[6px] tracking-tight ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
