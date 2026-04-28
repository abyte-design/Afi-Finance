import React from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxHeight?: string;
}

export function BottomSheet({
  isOpen,
  title,
  onClose,
  children,
  footer,
  maxHeight = '80vh',
}: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(6,5,15,0.85)' }}
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-lg flex flex-col"
        style={{
          maxWidth: '430px',
          background: '#13112E',
          border: '1px solid #2D2A6E',
          borderBottom: 'none',
          maxHeight,
          onClick: (e) => e.stopPropagation(),
        }}
      >
        {/* Header */}
        <div
          className="flex justify-between items-center p-5 border-b"
          style={{ borderBottomColor: '#2D2A6E', flexShrink: 0 }}
        >
          <span
            style={{
              fontFamily: "'Press Start 2P', monospace",
              fontSize: '10px',
              color: '#E2E0FF',
            }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-opacity-50 transition-colors"
            style={{ background: 'transparent' }}
          >
            <X size={20} color="#7A78A0" />
          </button>
        </div>

        {/* Content - scrollable */}
        <div
          className="flex-1 overflow-y-auto p-5"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#4A4870 transparent',
          }}
        >
          {children}
        </div>

        {/* Footer - fixed */}
        {footer && (
          <div
            className="border-t p-5"
            style={{ borderTopColor: '#2D2A6E', flexShrink: 0 }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
