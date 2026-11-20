import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface CrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string; // e.g. 'max-w-2xl'
}

export const CrudModal: React.FC<CrudModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  maxWidth = 'max-w-2xl',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-scaleUp`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
                {icon}
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-[var(--color-text-primary)]">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            title="بستن (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-sm text-[var(--color-text-primary)]">
          {children}
        </div>
      </div>
    </div>
  );
};

export default CrudModal;
