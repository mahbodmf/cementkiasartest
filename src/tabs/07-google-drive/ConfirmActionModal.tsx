import React from 'react';
import { AlertTriangle, CheckCircle2, Trash2, UploadCloud, FolderPlus, Edit3, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'primary';

export interface PendingDriveAction {
  title: string;
  description: string;
  targetName: string;
  targetLabel?: string;
  details?: string;
  confirmLabel: string;
  variant: ConfirmVariant;
  iconType: 'delete' | 'trash' | 'upload' | 'folder' | 'rename';
  onConfirm: () => Promise<void>;
}

interface ConfirmActionModalProps {
  action: PendingDriveAction | null;
  isExecuting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  action,
  isExecuting,
  onCancel,
  onConfirm,
}) => {
  if (!action) return null;

  const iconWrapperClass =
    action.variant === 'danger'
      ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
      : action.variant === 'warning'
      ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
      : 'bg-[var(--color-primary-bg)] text-[var(--color-primary)] border-[var(--color-primary-border)]';

  const confirmBtnClass =
    action.variant === 'danger'
      ? 'bg-rose-600 hover:bg-rose-700 text-white border-rose-500'
      : action.variant === 'warning'
      ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-500'
      : 'bg-[var(--color-primary)] hover:opacity-90 text-white border-[var(--color-primary)]';

  const renderIcon = () => {
    switch (action.iconType) {
      case 'delete':
        return <AlertTriangle className="w-5 h-5" />;
      case 'trash':
        return <Trash2 className="w-5 h-5" />;
      case 'upload':
        return <UploadCloud className="w-5 h-5" />;
      case 'folder':
        return <FolderPlus className="w-5 h-5" />;
      case 'rename':
        return <Edit3 className="w-5 h-5" />;
      default:
        return <CheckCircle2 className="w-5 h-5" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drive-confirm-title"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${iconWrapperClass}`}>
              {renderIcon()}
            </div>
            <h3 id="drive-confirm-title" className="text-sm font-bold text-[var(--color-text-primary)]">
              {action.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isExecuting}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-40 cursor-pointer"
            aria-label="بستن پنجره تایید"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3.5 text-xs leading-6 text-[var(--color-text-secondary)]">
          <p>{action.description}</p>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-3 space-y-1">
            <div className="text-[11px] text-[var(--color-text-muted)]">
              {action.targetLabel || 'مورد انتخاب‌شده:'}
            </div>
            <div className="font-bold text-[var(--color-text-primary)] break-all" dir="auto">
              {action.targetName}
            </div>
            {action.details && (
              <div className="text-[11px] text-[var(--color-text-muted)] pt-1 border-t border-[var(--color-border)] mt-2">
                {action.details}
              </div>
            )}
          </div>

          {action.variant === 'danger' && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-400 text-[11px]">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>این عملیات غیرقابل بازگشت است و فایل به طور کامل از Google Drive حذف خواهد شد.</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]">
          <button
            type="button"
            onClick={onCancel}
            disabled={isExecuting}
            className="px-4 py-2 rounded-lg text-xs font-medium border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors disabled:opacity-40 cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isExecuting}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 disabled:cursor-wait ${confirmBtnClass}`}
          >
            {isExecuting ? 'در حال اجرا...' : action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmActionModal;
