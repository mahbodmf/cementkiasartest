import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  HardDrive,
  Folder,
  FileText,
  FileSpreadsheet,
  FileJson,
  File as FileIcon,
  Search,
  Upload,
  FolderPlus,
  Download,
  Eye,
  Edit3,
  Trash2,
  RotateCw,
  LogOut,
  ChevronLeft,
  DatabaseBackup,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
  Home,
} from 'lucide-react';
import {
  subscribeToAuthChanges,
  signInWithGoogleDrive,
  getCachedAccessToken,
  signOutGoogleDrive,
} from '../../services/googleAuthService';
import {
  DriveFile,
  DriveAboutInfo,
  DriveFileCategory,
  DriveAuthError,
  FOLDER_MIME_TYPE,
  getDriveAbout,
  listDriveFiles,
  createDriveFolder,
  uploadFileToDrive,
  renameDriveFile,
  trashDriveFile,
  deleteDriveFilePermanently,
  downloadDriveFile,
  fetchDriveFileTextPreview,
  isPreviewableDriveFile,
} from '../../services/googleDriveService';
import { GoogleSignInButton } from '../../components/GoogleSignInButton';
import { ConfirmActionModal, PendingDriveAction } from './ConfirmActionModal';
import { useData } from '../../context/DataContext';
import { toPersianDigits } from '../../utils/persianUtils';

interface FolderCrumb {
  id: string;
  name: string;
}

interface StatusBanner {
  type: 'success' | 'error' | 'info';
  message: string;
}

function formatFileSize(bytesStr?: string): string {
  if (!bytesStr) return '—';
  const bytes = Number(bytesStr);
  if (!Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes === 0) return '۰ بایت';
  const units = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت', 'ترابایت'];
  const idx = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const val = bytes / Math.pow(1024, idx);
  const formatted = idx === 0 ? Math.round(val).toString() : val.toFixed(1);
  return `${toPersianDigits(formatted)} ${units[idx]}`;
}

function formatPersianDate(isoDate?: string): string {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoDate;
  }
}

function getFileTypeMeta(file: DriveFile): {
  label: string;
  icon: React.ReactNode;
} {
  if (file.mimeType === FOLDER_MIME_TYPE) {
    return {
      label: 'پوشه',
      icon: <Folder className="w-4 h-4 text-amber-500 shrink-0" />,
    };
  }
  if (
    file.mimeType === 'application/vnd.google-apps.spreadsheet' ||
    file.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    file.mimeType === 'application/vnd.ms-excel' ||
    file.mimeType === 'text/csv'
  ) {
    return {
      label: 'جدول / اکسل',
      icon: <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />,
    };
  }
  if (file.mimeType === 'application/json' || file.name.toLowerCase().endsWith('.json')) {
    return {
      label: 'داده JSON',
      icon: <FileJson className="w-4 h-4 text-cyan-500 shrink-0" />,
    };
  }
  if (
    file.mimeType === 'application/pdf' ||
    file.mimeType === 'application/vnd.google-apps.document' ||
    file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimeType === 'text/plain'
  ) {
    return {
      label: 'سند / PDF',
      icon: <FileText className="w-4 h-4 text-blue-500 shrink-0" />,
    };
  }
  return {
    label: 'فایل',
    icon: <FileIcon className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />,
  };
}

const CATEGORY_OPTIONS: { id: DriveFileCategory; label: string }[] = [
  { id: 'all', label: 'همه فایل‌ها' },
  { id: 'folders', label: 'پوشه‌ها' },
  { id: 'spreadsheets', label: 'اکسل و شیت' },
  { id: 'documents', label: 'اسناد و PDF' },
  { id: 'json', label: 'فایل‌های JSON' },
];

export const GoogleDriveTab: React.FC = () => {
  const { getFilteredData, filters } = useData();

  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => getCachedAccessToken());
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  const [aboutInfo, setAboutInfo] = useState<DriveAboutInfo | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [folderPath, setFolderPath] = useState<FolderCrumb[]>([
    { id: 'root', name: 'درایو من' },
  ]);
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [category, setCategory] = useState<DriveFileCategory>('all');

  const [banner, setBanner] = useState<StatusBanner | null>(null);

  // Input modals for New Folder & Rename (each routes to ConfirmActionModal before executing)
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('');

  const [renameTarget, setRenameTarget] = useState<DriveFile | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

  // File Preview modal
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Mandatory explicit confirmation modal state
  const [pendingAction, setPendingAction] = useState<PendingDriveAction | null>(null);
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const currentFolder = folderPath[folderPath.length - 1];

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((firebaseUser, hasToken) => {
      setUser(firebaseUser);
      setAccessToken(hasToken ? getCachedAccessToken() : null);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleDriveError = useCallback((err: unknown, fallbackMessage: string) => {
    if (err instanceof DriveAuthError) {
      setAccessToken(null);
      setBanner({ type: 'error', message: err.message });
      return;
    }
    const msg = err instanceof Error ? err.message : fallbackMessage;
    setBanner({ type: 'error', message: msg });
  }, []);

  const loadDriveAbout = useCallback(
    async (token: string) => {
      try {
        const info = await getDriveAbout(token);
        setAboutInfo(info);
      } catch (err) {
        handleDriveError(err, 'خطا در دریافت اطلاعات فضای ذخیره‌سازی Google Drive');
      }
    },
    [handleDriveError]
  );

  const loadFiles = useCallback(
    async (
      token: string,
      options?: { append?: boolean; pageToken?: string; folderId?: string; query?: string; cat?: DriveFileCategory }
    ) => {
      const append = options?.append ?? false;
      const targetFolderId = options?.folderId ?? currentFolder.id;
      const query = options?.query ?? activeSearch;
      const cat = options?.cat ?? category;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoadingFiles(true);
      }

      try {
        const result = await listDriveFiles(token, {
          folderId: query.trim() ? undefined : targetFolderId,
          searchQuery: query,
          category: cat,
          pageSize: 30,
          pageToken: options?.pageToken,
        });
        setFiles((prev) => (append ? [...prev, ...result.files] : result.files));
        setNextPageToken(result.nextPageToken);
      } catch (err) {
        handleDriveError(err, 'خطا در دریافت لیست فایل‌های Google Drive');
      } finally {
        setIsLoadingFiles(false);
        setIsLoadingMore(false);
      }
    },
    [activeSearch, category, currentFolder.id, handleDriveError]
  );

  useEffect(() => {
    if (accessToken) {
      loadDriveAbout(accessToken);
    }
  }, [accessToken, loadDriveAbout]);

  useEffect(() => {
    if (accessToken) {
      loadFiles(accessToken);
    }
  }, [accessToken, currentFolder.id, activeSearch, category, loadFiles]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setBanner(null);
    try {
      const { user: signedInUser, accessToken: token } = await signInWithGoogleDrive();
      setUser(signedInUser);
      setAccessToken(token);
      setBanner({
        type: 'success',
        message: `اتصال به Google Drive با حساب ${signedInUser.email || signedInUser.displayName || ''} برقرار شد.`,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ورود با حساب گوگل ناموفق بود.';
      setBanner({ type: 'error', message: msg });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutGoogleDrive();
      setAccessToken(null);
      setUser(null);
      setFiles([]);
      setAboutInfo(null);
      setFolderPath([{ id: 'root', name: 'درایو من' }]);
      setBanner({ type: 'info', message: 'اتصال حساب Google Drive با موفقیت قطع شد و توکن حافظه پاک گردید.' });
    } catch (err) {
      handleDriveError(err, 'خطا در خروج از حساب کاربری');
    }
  };

  const executeConfirmedAction = async () => {
    if (!pendingAction) return;
    setIsExecutingAction(true);
    try {
      await pendingAction.onConfirm();
      setPendingAction(null);
    } catch (err) {
      handleDriveError(err, 'اجرای عملیات روی Google Drive با خطا مواجه شد.');
      setPendingAction(null);
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Search form submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setActiveSearch('');
  };

  // Navigate into folder
  const handleOpenFolder = (folder: DriveFile) => {
    setActiveSearch('');
    setSearchInput('');
    setFolderPath((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleCrumbClick = (index: number) => {
    setActiveSearch('');
    setSearchInput('');
    setFolderPath((prev) => prev.slice(0, index + 1));
  };

  // File upload selection -> opens explicit confirmation dialog
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    e.target.value = '';
    if (!selectedFile || !accessToken) return;

    setPendingAction({
      title: 'تایید آپلود فایل در Google Drive',
      description: 'آیا مطمئن هستید که می‌خواهید این فایل را در پوشه فعلی Google Drive بارگذاری کنید؟',
      targetLabel: 'فایل انتخاب‌شده:',
      targetName: selectedFile.name,
      details: `حجم: ${formatFileSize(String(selectedFile.size))} • مسیر مقصد: ${currentFolder.name}`,
      confirmLabel: 'تایید و بارگذاری',
      variant: 'primary',
      iconType: 'upload',
      onConfirm: async () => {
        await uploadFileToDrive(
          accessToken,
          selectedFile,
          selectedFile.name,
          selectedFile.type || 'application/octet-stream',
          currentFolder.id
        );
        setBanner({ type: 'success', message: `فایل «${selectedFile.name}» با موفقیت در Google Drive بارگذاری شد.` });
        await loadFiles(accessToken);
        await loadDriveAbout(accessToken);
      },
    });
  };

  // EnMS JSON Backup -> opens explicit confirmation dialog
  const handleRequestEnmsBackup = () => {
    if (!accessToken) return;

    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const backupFileName = `kiasar-cement-enms-backup-${timestamp}.json`;

    const snapshotPayload = {
      exportedAt: new Date().toISOString(),
      platform: 'Kiasar Cement EnMS (ISO 50001:2018)',
      activeFilters: filters,
      datasets: {
        energyPerformance: getFilteredData('enpi-performance'),
        electricalEnergy: getFilteredData('electrical-energy'),
        productionOperations: getFilteredData('production-operations'),
        dispatchSales: getFilteredData('dispatch-sales'),
        inventorySilos: getFilteredData('inventory-silos'),
      },
    };

    const jsonString = JSON.stringify(snapshotPayload, null, 2);
    const jsonBlob = new Blob([jsonString], { type: 'application/json' });

    setPendingAction({
      title: 'تایید پشتیبان‌گیری داده‌های EnMS در Google Drive',
      description:
        'یک فایل پشتیبان JSON شامل داده‌های جاری پایش انرژی، برق، تولید و تحویل کارخانه سیمان کیاسر در پوشه فعلی Google Drive ذخیره خواهد شد.',
      targetLabel: 'نام فایل پشتیبان:',
      targetName: backupFileName,
      details: `حجم تقریبی: ${formatFileSize(String(jsonBlob.size))} • مسیر مقصد: ${currentFolder.name}`,
      confirmLabel: 'تایید و ذخیره پشتیبان',
      variant: 'primary',
      iconType: 'upload',
      onConfirm: async () => {
        await uploadFileToDrive(accessToken, jsonBlob, backupFileName, 'application/json', currentFolder.id);
        setBanner({ type: 'success', message: `نسخه پشتیبان «${backupFileName}» با موفقیت در Google Drive ذخیره شد.` });
        await loadFiles(accessToken);
        await loadDriveAbout(accessToken);
      },
    });
  };

  // Create Folder submit -> opens explicit confirmation dialog
  const handleRequestCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFolderName.trim();
    if (!trimmed || !accessToken) return;

    setIsNewFolderDialogOpen(false);
    setPendingAction({
      title: 'تایید ایجاد پوشه جدید در Google Drive',
      description: 'آیا ایجاد پوشه جدید در مسیر انتخاب‌شده را تایید می‌کنید؟',
      targetLabel: 'نام پوشه جدید:',
      targetName: trimmed,
      details: `مسیر والد: ${currentFolder.name}`,
      confirmLabel: 'ایجاد پوشه',
      variant: 'primary',
      iconType: 'folder',
      onConfirm: async () => {
        await createDriveFolder(accessToken, trimmed, currentFolder.id);
        setNewFolderName('');
        setBanner({ type: 'success', message: `پوشه «${trimmed}» با موفقیت ایجاد شد.` });
        await loadFiles(accessToken);
      },
    });
  };

  // Rename submit -> opens explicit confirmation dialog
  const handleRequestRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renameTarget || !accessToken) return;
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === renameTarget.name) {
      setRenameTarget(null);
      return;
    }

    const fileToRename = renameTarget;
    setRenameTarget(null);

    setPendingAction({
      title: 'تایید تغییر نام در Google Drive',
      description: 'آیا تغییر نام این مورد در Google Drive را تایید می‌کنید؟',
      targetLabel: 'تغییر نام از ← به:',
      targetName: `${fileToRename.name}  ←  ${trimmed}`,
      confirmLabel: 'تایید تغییر نام',
      variant: 'warning',
      iconType: 'rename',
      onConfirm: async () => {
        await renameDriveFile(accessToken, fileToRename.id, trimmed);
        setBanner({ type: 'success', message: `نام فایل با موفقیت به «${trimmed}» تغییر یافت.` });
        await loadFiles(accessToken);
      },
    });
  };

  // Move to Trash -> opens explicit confirmation dialog
  const handleRequestTrash = (file: DriveFile) => {
    if (!accessToken) return;
    setPendingAction({
      title: 'تایید انتقال به سطل زباله Google Drive',
      description: 'این مورد به سطل زباله (Trash) Google Drive منتقل می‌شود و در صورت نیاز از داخل Google Drive قابل بازیابی خواهد بود.',
      targetLabel: 'مورد انتخاب‌شده:',
      targetName: file.name,
      confirmLabel: 'انتقال به سطل زباله',
      variant: 'warning',
      iconType: 'trash',
      onConfirm: async () => {
        await trashDriveFile(accessToken, file.id);
        setBanner({ type: 'success', message: `«${file.name}» به سطل زباله Google Drive منتقل شد.` });
        await loadFiles(accessToken);
        await loadDriveAbout(accessToken);
      },
    });
  };

  // Permanent Delete -> opens explicit danger confirmation dialog
  const handleRequestPermanentDelete = (file: DriveFile) => {
    if (!accessToken) return;
    setPendingAction({
      title: 'تایید حذف دائمی از Google Drive',
      description: 'آیا کاملاً مطمئن هستید که می‌خواهید این فایل را برای همیشه حذف کنید؟',
      targetLabel: 'فایل جهت حذف دائمی:',
      targetName: file.name,
      confirmLabel: 'حذف دائمی',
      variant: 'danger',
      iconType: 'delete',
      onConfirm: async () => {
        await deleteDriveFilePermanently(accessToken, file.id);
        setBanner({ type: 'success', message: `«${file.name}» به صورت دائمی از Google Drive حذف شد.` });
        await loadFiles(accessToken);
        await loadDriveAbout(accessToken);
      },
    });
  };

  // Download file via Blob
  const handleDownloadFile = async (file: DriveFile) => {
    if (!accessToken || file.mimeType === FOLDER_MIME_TYPE) return;
    setBanner({ type: 'info', message: `در حال آماده‌سازی دانلود «${file.name}»...` });
    try {
      const { blob, downloadName } = await downloadDriveFile(accessToken, file);
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = downloadName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      setBanner({ type: 'success', message: `دانلود «${downloadName}» آغاز شد.` });
    } catch (err) {
      handleDriveError(err, `خطا در دانلود فایل «${file.name}»`);
    }
  };

  // Preview text/JSON/CSV/Docs in-app
  const handlePreviewFile = async (file: DriveFile) => {
    if (!accessToken || !isPreviewableDriveFile(file)) return;
    setPreviewFile(file);
    setPreviewContent('');
    setIsLoadingPreview(true);
    try {
      const content = await fetchDriveFileTextPreview(accessToken, file);
      setPreviewContent(content);
    } catch (err) {
      setPreviewFile(null);
      handleDriveError(err, `خطا در پیش‌نمایش فایل «${file.name}»`);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Storage percentage calculation
  const quotaUsage = Number(aboutInfo?.storageQuota?.usage || 0);
  const quotaLimit = Number(aboutInfo?.storageQuota?.limit || 0);
  const quotaPercent = quotaLimit > 0 ? Math.min(100, Math.round((quotaUsage / quotaLimit) * 100)) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5" dir="rtl">
      {/* سربرگ صفحه */}
      <div className="enms-card p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)] shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-text-primary)]">
              مرکز اسناد ابری و یکپارچه‌سازی Google Drive
            </h2>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              مدیریت مستندات سیستم مدیریت انرژی (ISO 50001:2018)، پشتیبان‌گیری گزارش‌های EnMS و تبادل فایل‌های اکسل و JSON
            </p>
          </div>
        </div>

        {accessToken && (
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[var(--color-text-primary)] font-medium truncate max-w-[200px]" dir="ltr">
                {aboutInfo?.user?.emailAddress || user?.email || 'حساب متصل'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>قطع اتصال</span>
            </button>
          </div>
        )}
      </div>

      {/* اعلان وضعیت */}
      {banner && (
        <div
          className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-xs ${
            banner.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : banner.type === 'error'
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {banner.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            <span>{banner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="p-1 rounded hover:bg-black/10 transition-colors cursor-pointer"
            aria-label="بستن پیام"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* حالت عدم احراز هویت یا نیاز به تمدید توکن حافظه */}
      {!accessToken ? (
        <div className="enms-card rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-8 md:p-12 flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] flex items-center justify-center text-[var(--color-primary)] mb-5">
            <HardDrive className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">
            {user && isAuthReady
              ? 'تمدید نشست دسترسی به Google Drive'
              : 'اتصال به حساب Google Drive'}
          </h3>

          <p className="text-xs leading-6 text-[var(--color-text-secondary)] max-w-lg mb-6">
            برای مشاهده، جستجو، بارگذاری مستندات ممیزی و ذخیره نسخه‌های پشتیبان داده‌های سیستم مدیریت انرژی سیمان کیاسر در فضای ابری Google Drive، با حساب گوگل خود وارد شوید.
          </p>

          <GoogleSignInButton
            onClick={handleSignIn}
            isLoading={isSigningIn}
            label="Sign in with Google"
          />

          <div className="mt-8 w-full grid grid-cols-1 sm:grid-cols-3 gap-3 text-right">
            <div className="p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
              <div className="text-xs font-bold text-[var(--color-text-primary)] mb-1">پشتیبان‌گیری یک‌کلیکه</div>
              <div className="text-[11px] text-[var(--color-text-muted)] leading-5">
                ذخیره آنی داده‌های پایش انرژی، خطوط مبنا و تولید در قالب JSON روی Drive
              </div>
            </div>
            <div className="p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
              <div className="text-xs font-bold text-[var(--color-text-primary)] mb-1">آرشیو مستندات ایزو</div>
              <div className="text-[11px] text-[var(--color-text-muted)] leading-5">
                مدیریت فایل‌های اکسل، PDF، صورتجلسات کمیته و گزارش‌های بازنگری انرژی
              </div>
            </div>
            <div className="p-3.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)]">
              <div className="text-xs font-bold text-[var(--color-text-primary)] mb-1">امنیت و تایید صریح</div>
              <div className="text-[11px] text-[var(--color-text-muted)] leading-5">
                توکن دسترسی صرفاً در حافظه موقت نگهداری می‌شود و هر تغییر نیازمند تایید شماست
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* نوار وضعیت حافظه و ابزارهای سریع */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* کارت فضای ذخیره‌سازی */}
            <div className="enms-card p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-[var(--color-text-primary)]">فضای ذخیره‌سازی Google Drive</span>
                <span className="font-mono text-[11px] text-[var(--color-text-muted)] tabular-nums">
                  {quotaLimit > 0 ? `${toPersianDigits(quotaPercent)}٪` : 'نامحدود'}
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] overflow-hidden mb-2">
                <svg
                  className="w-full h-full block"
                  viewBox="0 0 100 8"
                  preserveAspectRatio="none"
                  role="progressbar"
                  aria-valuenow={quotaPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="درصد مصرف فضای Google Drive"
                >
                  <rect
                    x="0"
                    y="0"
                    width={quotaPercent}
                    height="8"
                    rx="4"
                    className={quotaPercent > 85 ? 'fill-rose-500' : 'fill-[var(--color-primary)]'}
                  />
                </svg>
              </div>
              <div className="flex items-center justify-between text-[11px] text-[var(--color-text-muted)] tabular-nums">
                <span>مصرف‌شده: {formatFileSize(aboutInfo?.storageQuota?.usage)}</span>
                <span>ظرفیت کل: {quotaLimit > 0 ? formatFileSize(aboutInfo?.storageQuota?.limit) : '—'}</span>
              </div>
            </div>

            {/* کارت اکشن‌های سریع */}
            <div className="enms-card lg:col-span-2 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <input
                  ref={uploadInputRef}
                  type="file"
                  onChange={handleFileInputChange}
                  className="hidden"
                  id="google-drive-upload-input"
                />

                <button
                  type="button"
                  onClick={() => uploadInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>آپلود فایل به Drive</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setNewFolderName('');
                    setIsNewFolderDialogOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4 text-amber-500" />
                  <span>پوشه جدید</span>
                </button>

                <button
                  type="button"
                  onClick={handleRequestEnmsBackup}
                  className="px-3.5 py-2 rounded-lg border border-emerald-500/35 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <DatabaseBackup className="w-4 h-4" />
                  <span>پشتیبان‌گیری داده‌های EnMS</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  loadFiles(accessToken);
                  loadDriveAbout(accessToken);
                }}
                disabled={isLoadingFiles}
                className="px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                title="بروزرسانی لیست فایل‌ها"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
                <span>بروزرسانی</span>
              </button>
            </div>
          </div>

          {/* نوار جستجو، فیلتر نوع فایل و مسیر پوشه‌ها */}
          <div className="enms-card rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden">
            <div className="p-4 border-b border-[var(--color-border)] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* مسیر پوشه‌ها (Breadcrumbs) */}
              <div className="flex items-center gap-1.5 flex-wrap text-xs">
                {folderPath.map((crumb, idx) => {
                  const isLast = idx === folderPath.length - 1;
                  return (
                    <React.Fragment key={crumb.id}>
                      {idx > 0 && <ChevronLeft className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />}
                      <button
                        type="button"
                        onClick={() => handleCrumbClick(idx)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                          isLast
                            ? 'bg-[var(--color-primary-bg)] text-[var(--color-primary)] font-bold border border-[var(--color-primary-border)]'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                        }`}
                      >
                        {idx === 0 && <Home className="w-3.5 h-3.5" />}
                        <span>{crumb.name}</span>
                      </button>
                    </React.Fragment>
                  );
                })}
                {activeSearch && (
                  <span className="text-[11px] text-amber-500 mr-2">
                    نتایج جستجو برای: «{activeSearch}»
                  </span>
                )}
              </div>

              {/* فرم جستجو */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full lg:w-80">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[var(--color-text-muted)] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="جستجو در نام فایل‌های Drive..."
                    className="w-full pr-9 pl-8 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                  {(searchInput || activeSearch) && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
                      aria-label="پاک کردن جستجو"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)] text-xs font-medium text-[var(--color-text-primary)] cursor-pointer"
                >
                  جستجو
                </button>
              </form>
            </div>

            {/* فیلتر نوع فایل */}
            <div className="px-4 py-2.5 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] flex items-center gap-2 overflow-x-auto">
              {CATEGORY_OPTIONS.map((item) => {
                const isActive = category === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id)}
                    className={`px-3 py-1 rounded-md text-xs transition-colors whitespace-nowrap cursor-pointer border ${
                      isActive
                        ? 'bg-[var(--color-primary-bg)] text-[var(--color-primary)] border-[var(--color-primary-border)] font-bold'
                        : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* جدول فایل‌ها */}
            <div className="overflow-x-auto">
              {isLoadingFiles ? (
                <div className="py-16 text-center text-xs text-[var(--color-text-muted)] flex flex-col items-center gap-3">
                  <RotateCw className="w-6 h-6 animate-spin text-[var(--color-primary)]" />
                  <span>در حال بارگذاری فایل‌ها از Google Drive...</span>
                </div>
              ) : files.length === 0 ? (
                <div className="py-16 text-center text-xs text-[var(--color-text-muted)] space-y-2">
                  <Folder className="w-8 h-8 mx-auto opacity-40" />
                  <p className="font-medium text-[var(--color-text-secondary)]">
                    {activeSearch
                      ? 'هیچ فایلی مطابق با عبارت جستجو یافت نشد.'
                      : 'این پوشه خالی است یا فایلی با فیلتر انتخاب‌شده وجود ندارد.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]">
                      <th className="py-3 px-4 font-semibold">نام فایل / پوشه</th>
                      <th className="py-3 px-3 font-semibold hidden sm:table-cell">نوع</th>
                      <th className="py-3 px-3 font-semibold hidden md:table-cell">حجم</th>
                      <th className="py-3 px-3 font-semibold hidden lg:table-cell">آخرین ویرایش</th>
                      <th className="py-3 px-3 font-semibold hidden xl:table-cell">مالک</th>
                      <th className="py-3 px-4 font-semibold text-left">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {files.map((file) => {
                      const isFolder = file.mimeType === FOLDER_MIME_TYPE;
                      const meta = getFileTypeMeta(file);
                      const canPreview = !isFolder && isPreviewableDriveFile(file);

                      return (
                        <tr
                          key={file.id}
                          className="hover:bg-[var(--color-bg-hover)] transition-colors"
                        >
                          <td className="py-3 px-4">
                            {isFolder ? (
                              <button
                                type="button"
                                onClick={() => handleOpenFolder(file)}
                                className="flex items-center gap-2.5 text-right font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer"
                              >
                                {meta.icon}
                                <span className="truncate max-w-[240px] sm:max-w-[340px]" dir="auto">
                                  {file.name}
                                </span>
                              </button>
                            ) : (
                              <div className="flex items-center gap-2.5 text-[var(--color-text-primary)]">
                                {meta.icon}
                                <span className="truncate max-w-[240px] sm:max-w-[340px] font-medium" dir="auto">
                                  {file.name}
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[var(--color-text-muted)] hidden sm:table-cell whitespace-nowrap">
                            {meta.label}
                          </td>
                          <td className="py-3 px-3 text-[var(--color-text-secondary)] font-mono tabular-nums hidden md:table-cell whitespace-nowrap">
                            {isFolder ? '—' : formatFileSize(file.size)}
                          </td>
                          <td className="py-3 px-3 text-[var(--color-text-muted)] tabular-nums hidden lg:table-cell whitespace-nowrap">
                            {formatPersianDate(file.modifiedTime)}
                          </td>
                          <td className="py-3 px-3 text-[var(--color-text-muted)] hidden xl:table-cell truncate max-w-[160px]">
                            {file.owners?.[0]?.displayName || file.owners?.[0]?.emailAddress || '—'}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-1.5">
                              {canPreview && (
                                <button
                                  type="button"
                                  onClick={() => handlePreviewFile(file)}
                                  className="p-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary-border)] transition-colors cursor-pointer"
                                  title="پیش‌نمایش محتوا"
                                  aria-label={`پیش‌نمایش ${file.name}`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {!isFolder && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadFile(file)}
                                  className="p-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-emerald-500 hover:border-emerald-500/40 transition-colors cursor-pointer"
                                  title="دانلود فایل"
                                  aria-label={`دانلود ${file.name}`}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setRenameTarget(file);
                                  setRenameValue(file.name);
                                }}
                                className="p-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-amber-500 hover:border-amber-500/40 transition-colors cursor-pointer"
                                title="تغییر نام"
                                aria-label={`تغییر نام ${file.name}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRequestTrash(file)}
                                className="p-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-secondary)] hover:text-amber-500 hover:border-amber-500/40 transition-colors cursor-pointer"
                                title="انتقال به سطل زباله"
                                aria-label={`انتقال ${file.name} به سطل زباله`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleRequestPermanentDelete(file)}
                                className="px-2 py-1 rounded-md border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 text-[10px] font-medium transition-colors cursor-pointer"
                                title="حذف دائمی"
                              >
                                حذف دائم
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* صفحه‌بندی بارگذاری بیشتر */}
            {nextPageToken && !isLoadingFiles && (
              <div className="p-4 border-t border-[var(--color-border)] flex justify-center">
                <button
                  type="button"
                  onClick={() => loadFiles(accessToken, { append: true, pageToken: nextPageToken })}
                  disabled={isLoadingMore}
                  className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] hover:bg-[var(--color-bg-hover)] text-xs font-medium text-[var(--color-text-primary)] cursor-pointer disabled:opacity-50"
                >
                  {isLoadingMore ? 'در حال بارگذاری موارد بیشتر...' : 'نمایش فایل‌های بیشتر'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* مودال ورود نام پوشه جدید */}
      {isNewFolderDialogOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          <form
            onSubmit={handleRequestCreateFolder}
            className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5 font-bold text-sm text-[var(--color-text-primary)]">
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span>ایجاد پوشه جدید در Google Drive</span>
              </div>
              <button
                type="button"
                onClick={() => setIsNewFolderDialogOpen(false)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-xs text-[var(--color-text-secondary)]">
                نام پوشه (مسیر فعلی: {currentFolder.name})
              </label>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="مثال: گزارش‌های ممیزی ISO 50001"
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <button
                type="button"
                onClick={() => setIsNewFolderDialogOpen(false)}
                className="px-4 py-1.5 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={!newFolderName.trim()}
                className="px-4 py-1.5 rounded-lg bg-[var(--color-primary)] text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                ادامه به مرحله تایید
              </button>
            </div>
          </form>
        </div>
      )}

      {/* مودال ورود نام جدید برای تغییر نام */}
      {renameTarget && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          <form
            onSubmit={handleRequestRename}
            className="w-full max-w-md rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5 font-bold text-sm text-[var(--color-text-primary)]">
                <Edit3 className="w-4 h-4 text-amber-500" />
                <span>تغییر نام فایل / پوشه</span>
              </div>
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <label className="block text-xs text-[var(--color-text-secondary)]">نام جدید:</label>
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
                dir="auto"
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-xs text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-bg-card)]">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="px-4 py-1.5 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={!renameValue.trim() || renameValue.trim() === renameTarget.name}
                className="px-4 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold disabled:opacity-40 cursor-pointer"
              >
                ادامه به مرحله تایید
              </button>
            </div>
          </form>
        </div>
      )}

      {/* مودال پیش‌نمایش فایل متنی / JSON / CSV */}
      {previewFile && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          dir="rtl"
        >
          <div className="w-full max-w-3xl max-h-[82vh] flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2 min-w-0">
                <Eye className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                <span className="text-sm font-bold text-[var(--color-text-primary)] truncate" dir="auto">
                  {previewFile.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-[var(--color-bg-card)]">
              {isLoadingPreview ? (
                <div className="py-12 text-center text-xs text-[var(--color-text-muted)] flex flex-col items-center gap-2">
                  <RotateCw className="w-5 h-5 animate-spin text-[var(--color-primary)]" />
                  <span>در حال دریافت محتوای فایل...</span>
                </div>
              ) : (
                <pre
                  dir="ltr"
                  className="text-xs font-mono text-[var(--color-text-primary)] whitespace-pre-wrap break-words leading-5"
                >
                  {previewContent || '(فایل خالی است)'}
                </pre>
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-surface)]">
              <button
                type="button"
                onClick={() => handleDownloadFile(previewFile)}
                className="px-3.5 py-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 text-emerald-500 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود فایل</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="px-4 py-1.5 rounded-lg border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تایید صریح برای تمامی عملیات‌های تغییردهنده و حذف */}
      <ConfirmActionModal
        action={pendingAction}
        isExecuting={isExecutingAction}
        onCancel={() => setPendingAction(null)}
        onConfirm={executeConfirmedAction}
      />
    </div>
  );
};

export default GoogleDriveTab;
