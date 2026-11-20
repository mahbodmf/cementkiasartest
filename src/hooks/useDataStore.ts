import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseDataStoreReturn<T> {
  data: T | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  toast: string | null;
  saveToast: string | null;
  setToast: (msg: string | null) => void;
  clearToast: () => void;
  updateData: (updater: Partial<T> | T | ((prev: T) => T)) => void;
  saveToStorage: () => boolean;
  resetToDefault: () => Promise<void>;
  exportJson: (fileName?: string) => void;
  importJson: (file: File) => Promise<boolean>;
  reload: () => Promise<void>;
}

/**
 * هوک یکپارچه و بهینه‌شده برای مدیریت پایگاه‌داده محلی و داده‌های JSON استاندارد EnMS
 * @param storageKey کلید ذخیره‌سازی در LocalStorage
 * @param endpointPath مسیر نسبی فایل پایگاه داده در سرور (مثلاً /data/02-organization-context/organization-context.json)
 * @param initialFallback داده‌های پیش‌فرض اولیه در صورت آفلاین بودن یا خطای شبکه (اختیاری)
 */
export function useDataStore<T>(
  storageKey: string,
  endpointPath: string,
  initialFallback?: T
): UseDataStoreReturn<T> {
  const [data, setData] = useState<T | null>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch {
      // در صورت خطای تجزیه JSON، به مقدار پیش‌فرض مراجعه می‌شود
    }
    return initialFallback || null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(!data);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToastState] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setToast = useCallback((msg: string | null) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastState(msg);
    if (msg) {
      toastTimeoutRef.current = setTimeout(() => {
        setToastState(null);
      }, 4000);
    }
  }, []);

  const clearToast = useCallback(() => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    setToastState(null);
  }, []);

  // بارگذاری داده‌ها با الگوی Cache-First
  const loadData = useCallback(async () => {
    try {
      // ۱. بررسی حافظه مرورگر
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as T;
          setData(parsed);
          setIsLoading(false);
          return;
        } catch {
          // اگر خراب بود، از حافظه محلی پاک می‌شود
          localStorage.removeItem(storageKey);
        }
      }

      // ۲. دریافت از سرور
      setIsLoading(true);
      setError(null);
      const res = await fetch(endpointPath);
      if (res.ok) {
        const json = (await res.json()) as T;
        setData(json);
      } else {
        throw new Error(`خطای دریافت اطلاعات از مسیر ${endpointPath}: کد وضعیت ${res.status}`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'خطای بارگذاری داده‌ها';
      setError(message);
      if (initialFallback) {
        setData(initialFallback);
      }
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, endpointPath, initialFallback]);

  useEffect(() => {
    loadData();
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [loadData]);

  // به‌روزرسانی بخشی یا کل وضعیت داده‌ها در حافظه React
  const updateData = useCallback((updater: Partial<T> | T | ((prev: T) => T)) => {
    setData((prev) => {
      if (prev === null) {
        if (typeof updater === 'function') {
          return (updater as any)({} as T);
        }
        return updater as T;
      }
      if (typeof updater === 'function') {
        return (updater as (prev: T) => T)(prev);
      }
      if (typeof updater === 'object' && updater !== null && !Array.isArray(updater)) {
        return { ...prev, ...updater };
      }
      return updater as T;
    });
  }, []);

  // ذخیره‌سازی داده‌های فعلی در LocalStorage
  const saveToStorage = useCallback((): boolean => {
    if (!data) return false;
    setIsSaving(true);
    try {
      localStorage.setItem(storageKey, JSON.stringify(data, null, 2));
      setToast('تغییرات با موفقیت در پایگاه داده محلی ذخیره گردید.');
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'خطای ناشناخته';
      setToast(`خطا در ذخیره‌سازی داده‌ها در حافظه مرورگر: ${msg}`);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [data, storageKey, setToast]);

  // بازنشانی داده‌ها به مقادیر اولیه سرور و پاک کردن کش مرورگر
  const resetToDefault = useCallback(async () => {
    setIsLoading(true);
    try {
      localStorage.removeItem(storageKey);
      const res = await fetch(endpointPath);
      if (res.ok) {
        const json = (await res.json()) as T;
        setData(json);
        setToast('داده‌ها با موفقیت به مقادیر پیش‌فرض سرور بازنشانی گردید.');
      } else if (initialFallback) {
        setData(initialFallback);
        setToast('داده‌ها به مقادیر پیش‌فرض اولیه بازنشانی شد.');
      } else {
        throw new Error('عدم دریافت نسخه پیش‌فرض از سرور');
      }
    } catch {
      if (initialFallback) {
        setData(initialFallback);
        setToast('داده‌ها به مقادیر پیش‌فرض بازنشانی گردید.');
      } else {
        setToast('خطا در بازیابی نسخه پیش‌فرض از سرور.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [storageKey, endpointPath, initialFallback, setToast]);

  // دریافت خروجی استاندارد JSON
  const exportJson = useCallback(
    (fileName?: string) => {
      if (!data) {
        setToast('داده‌ای برای صدور خروجی وجود ندارد.');
        return;
      }
      try {
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(data, null, 2)
        )}`;
        const actualFileName =
          fileName || `${storageKey}-${new Date().toISOString().slice(0, 10)}.json`;
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', jsonString);
        downloadAnchor.setAttribute('download', actualFileName);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        setToast('فایل نسخه پشتیبان JSON با موفقیت ایجاد و دانلود شد.');
      } catch {
        setToast('خطا در ایجاد فایل خروجی JSON.');
      }
    },
    [data, storageKey, setToast]
  );

  // بارگذاری و درون‌ریزی فایل JSON
  const importJson = useCallback(
    async (file: File): Promise<boolean> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const parsed = JSON.parse(content) as T;
            setData(parsed);
            localStorage.setItem(storageKey, JSON.stringify(parsed, null, 2));
            setToast('فایل JSON با موفقیت بارگذاری و در حافظه محلی ذخیره گردید.');
            resolve(true);
          } catch {
            setToast('خطا در قالب‌بندی فایل JSON انتخابی.');
            resolve(false);
          }
        };
        reader.onerror = () => {
          setToast('خطا در خواندن فایل از دیسک.');
          resolve(false);
        };
        reader.readAsText(file);
      });
    },
    [storageKey, setToast]
  );

  return {
    data,
    isLoading,
    isSaving,
    error,
    toast,
    saveToast: toast,
    setToast,
    clearToast,
    updateData,
    saveToStorage,
    resetToDefault,
    exportJson,
    importJson,
    reload: loadData,
  };
}

export default useDataStore;
