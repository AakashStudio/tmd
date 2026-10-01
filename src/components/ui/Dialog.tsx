'use client';

import { ReactNode } from 'react';
import { Button } from './Button';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  onConfirm?: () => void;
  variant?: 'default' | 'danger';
  confirmVariant?: 'default' | 'danger' | 'primary' | 'secondary';
  loading?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  confirmText,
  cancelLabel,
  cancelText,
  onConfirm,
  variant = 'default',
  confirmVariant,
  loading = false,
}: DialogProps) {
  if (!isOpen) return null;

  const finalConfirmLabel = confirmText || confirmLabel || 'Confirm';
  const finalCancelLabel = cancelText || cancelLabel || 'Cancel';
  const finalVariant = confirmVariant === 'danger' || variant === 'danger' ? 'danger' : 'primary';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="relative bg-[#141414] border border-[#282828] rounded-[8px] w-full max-w-sm p-5 shadow-2xl z-10 animate-slide-up">
        <h3 className="text-base font-extrabold text-white mb-2 tracking-tight">{title}</h3>
        {description && (
          <p className="text-[#9E9E9E] text-xs leading-relaxed mb-4">{description}</p>
        )}
        {children && <div className="mb-4">{children}</div>}
        {onConfirm && (
          <div className="flex gap-2.5 mt-4">
            <Button variant="secondary" size="md" onClick={onClose} fullWidth>
              {finalCancelLabel}
            </Button>
            <Button
              variant={finalVariant}
              size="md"
              onClick={onConfirm}
              fullWidth
              loading={loading}
            >
              {finalConfirmLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
