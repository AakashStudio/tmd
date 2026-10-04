import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  children,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center select-none ${className}`}>
      <div className="w-14 h-14 rounded-full bg-[#1A1A22] border border-[#2D2D38] flex items-center justify-center mb-4 text-[#FF1493] shadow-md shadow-[#FF1493]/10">
        <Icon size={24} strokeWidth={2} />
      </div>
      <h3 className="tmd-h2 text-white mb-2">{title}</h3>
      <p className="tmd-body-small text-[#A1A1AA] max-w-xs mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
