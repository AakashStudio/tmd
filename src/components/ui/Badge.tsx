interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'premium';
  size?: 'sm' | 'md';
}

export function Badge({ children, variant = 'default', size = 'sm' }: BadgeProps) {
  const variants = {
    default: 'bg-[#1F1F1F] text-[#9E9E9E] border border-[#2E2E2E]',
    success: 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 font-semibold',
    warning: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-semibold',
    error: 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 font-semibold',
    premium: 'bg-[#E91E63]/15 text-[#E91E63] border border-[#E91E63]/35 font-bold',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}
