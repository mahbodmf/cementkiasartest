import React, { useState } from 'react';
import { RotateCw, Check, Trash2 } from 'lucide-react';
import { clearEnmsAppCache } from '../utils/cacheUtils';

interface ClearCacheButtonProps {
  className?: string;
  compact?: boolean;
}

export const ClearCacheButton: React.FC<ClearCacheButtonProps> = ({
  className = '',
  compact = false,
}) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearCache = () => {
    const confirmClear = window.confirm(
      'آیا از پاک‌سازی کَش و بازخوانی مجدد اطلاعات از فایل‌های JSON اطمینان دارید؟\n(تمام تغییرات ذخیره‌نشده ریست شده و آخرین نسخه فایل‌های پروژه اعمال می‌شود)'
    );

    if (!confirmClear) return;

    setIsClearing(true);
    setTimeout(() => {
      clearEnmsAppCache(true);
    }, 400);
  };

  return (
    <button
      onClick={handleClearCache}
      disabled={isClearing}
      title="پاک‌سازی کَش مرورگر و همگام‌سازی مجدد با فایل‌های JSON"
      className={`enms-button enms-button-secondary text-xs !py-1 !px-2.5 hover:!border-amber-500/50 hover:!text-amber-400
        ${isClearing ? 'opacity-70 cursor-wait' : ''} ${className}`}
    >
      <RotateCw className={`w-3.5 h-3.5 text-amber-500 ${isClearing ? 'animate-spin' : ''}`} />
      {!compact && <span>پاک‌سازی کَش و همگام‌سازی</span>}
    </button>
  );
};

export default ClearCacheButton;