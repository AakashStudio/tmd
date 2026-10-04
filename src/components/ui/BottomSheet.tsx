'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Sheet Frame (Strict 8px radius on top corners) */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-lg bg-[#121216] border-t border-x border-[#1E1E26] shadow-2xl max-h-[88vh] overflow-y-auto z-10 animate-slide-up rounded-t-[8px]"
      >
        {/* Drag Indicator */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-[#2D2D38] rounded-[2px]" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1E1E26]">
            <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#A1A1AA] hover:text-white hover:bg-[#1A1A22] transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="px-5 py-4 pb-8">
          {children}
        </div>
      </div>
    </div>
  );
}
