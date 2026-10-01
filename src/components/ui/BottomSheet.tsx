'use client';

import { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
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
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Sheet Frame (Strict 8px radius on top corners, max 430px container) */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-[430px] bg-[#141414] border-t border-x border-[#282828] shadow-2xl max-h-[88vh] overflow-y-auto z-10 animate-slide-up"
        style={{ borderRadius: '8px 8px 0 0' }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-[#333333] rounded-[2px]" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#222222]">
            <h3 className="text-sm font-extrabold text-white tracking-tight">{title}</h3>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-[6px] flex items-center justify-center text-[#9E9E9E] hover:text-white hover:bg-[#202020] transition-colors"
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
