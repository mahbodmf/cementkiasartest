import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  RotateCw,
  Menu,
  ChevronLeft,
  Trash2,
  Settings,
  HardDrive,
} from 'lucide-react';
import {
  MainTabId,
  MonitoringSubTabId,
  EnergyReviewSubTabId,
  ContextSubTabId,
  CommitteeSubTabId,
  EnergyObjectivesSubTabId,
} from '../../types';
import { useData } from '../../context/DataContext';
import {
  getCurrentPersianDateTime,
  toPersianDigits,
} from '../../utils/persianUtils';
import { clearAllCache } from '../../utils/cacheUtils';
import { NAVIGATION_CONFIG } from '../../config/navigation';
import { SettingsDrawer } from './SettingsDrawer';

interface HeaderProps {
  currentMainTab: MainTabId;
  monitoringSubTab?: MonitoringSubTabId;
  energyReviewSubTab?: EnergyReviewSubTabId;
  contextSubTab?: ContextSubTabId;
  committeeSubTab?: CommitteeSubTabId;
  energyObjectivesSubTab?: EnergyObjectivesSubTabId;
  onOpenDataset: () => void;
  onOpenGoogleDrive?: () => void;
  onSidebarToggle?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentMainTab,
  monitoringSubTab,
  energyReviewSubTab,
  contextSubTab,
  committeeSubTab,
  energyObjectivesSubTab,
  onOpenDataset,
  onOpenGoogleDrive,
  onSidebarToggle,
}) => {
  const {
    filters,
    setFilters,
    availableMonths,
    refreshData,
    isRefreshing,
  } = useData();

  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [liveTime, setLiveTime] = useState(getCurrentPersianDateTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveTime(getCurrentPersianDateTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const navConfig = NAVIGATION_CONFIG;

  const currentTabObj = navConfig.mainTabs.find(
    (t) =>
      t.id === currentMainTab ||
      (t.id === 'energy-review' && currentMainTab === '03-energy-review') ||
      (t.id === 'context' && currentMainTab === '02-organization-context') ||
      (t.id === 'monitoring' && currentMainTab === '04-energy-performance') ||
      (t.id === 'energy-committee' && currentMainTab === '05-energy-committee') ||
      (t.id === 'energy-objectives' && currentMainTab === '06-energy-objectives-projects') ||
      (t.id === '06-energy-objectives-projects' && currentMainTab === 'energy-objectives') ||
      (t.id === '07-google-drive' && currentMainTab === 'google-drive')
  );

  let subTabTitle = '';

  if ((currentMainTab === 'monitoring' || currentMainTab === '04-energy-performance') && monitoringSubTab) {
    const sub = currentTabObj?.subTabs?.find((s) => s.id === monitoringSubTab);
    subTabTitle = sub?.title || '';
  } else if ((currentMainTab === 'energy-review' || currentMainTab === '03-energy-review') && energyReviewSubTab) {
    const sub = currentTabObj?.subTabs?.find((s) => s.id === energyReviewSubTab);
    subTabTitle = sub?.title || '';
  } else if ((currentMainTab === 'context' || currentMainTab === '02-organization-context') && contextSubTab) {
    const sub = currentTabObj?.subTabs?.find((s) => s.id === contextSubTab);
    subTabTitle = sub?.title || '';
  } else if ((currentMainTab === 'energy-committee' || currentMainTab === '05-energy-committee') && committeeSubTab) {
    const sub = currentTabObj?.subTabs?.find((s) => s.id === committeeSubTab);
    subTabTitle = sub?.title || '';
  } else if ((currentMainTab === 'energy-objectives' || currentMainTab === '06-energy-objectives-projects') && energyObjectivesSubTab) {
    const sub = currentTabObj?.subTabs?.find((s) => s.id === energyObjectivesSubTab);
    subTabTitle = sub?.title || '';
  }

  const handleClearCache = async () => {
    setIsClearingCache(true);

    try {
      clearAllCache();

      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();

        if ('caches' in window) {
          try {
            const cacheKeys = await window.caches.keys();
            await Promise.all(cacheKeys.map((key) => window.caches.delete(key)));
          } catch (e) {
            console.warn('CacheStorage cleanup bypassed:', e);
          }
        }

        const url = new URL(window.location.href);
        url.searchParams.set('_nocache', Date.now().toString());
        window.location.replace(url.toString());
      }
    } catch (err) {
      console.error('خطا در پاک‌سازی کش:', err);
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  return (
    <>
      <header className="enms-header">
        {/* بخش راست: مسیر ناوبری */}
        <div className="flex items-center gap-3 overflow-hidden">
          {onSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="enms-button-icon sm:hidden"
              aria-label="تغییر وضعیت سایدبار"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="enms-breadcrumb-container">
            <span className="enms-breadcrumb-root">{navConfig.systemTitle}</span>
            <ChevronLeft className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
            <span className="font-semibold text-[var(--color-text-secondary)]">
              {currentTabObj?.title || 'داشبورد'}
            </span>

            {subTabTitle && (
              <>
                <ChevronLeft className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                <span className="enms-breadcrumb-active">{subTabTitle}</span>
              </>
            )}
          </div>
        </div>

        {/* بخش میانی: ساعت زنده */}
        <div className="hidden lg:flex items-center">
          <div className="enms-clock-widget">
            <div className="enms-live-dot" />
            <div className="flex items-center gap-1.5 font-bold text-[var(--color-primary)]">
              <Clock className="w-3.5 h-3.5" />
              <span>{toPersianDigits(liveTime.time)}</span>
            </div>
            <span className="text-[var(--color-text-muted)]">•</span>
            <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span>{liveTime.date}</span>
            </div>
          </div>
        </div>

        {/* بخش چپ: اکشن‌ها، فیلترها و دکمه تنظیمات */}
        <div className="enms-header-actions flex items-center gap-2">
          {/* فیلتر سریع بازه زمانی */}
          <div className="hidden md:flex items-center gap-1 enms-tab-pills !p-0.5 text-xs">
            <button
              onClick={() => setFilters({ quickRange: '7d' })}
              className={`enms-tab-pill !py-1 !px-2.5 ${filters.quickRange === '7d' ? 'active' : ''}`}
            >
              ۷ روز اخیر
            </button>
            <button
              onClick={() => setFilters({ quickRange: '30d' })}
              className={`enms-tab-pill !py-1 !px-2.5 ${filters.quickRange === '30d' ? 'active' : ''}`}
            >
              ۳۰ روز اخیر
            </button>
            <button
              onClick={() => setFilters({ quickRange: 'all' })}
              className={`enms-tab-pill !py-1 !px-2.5 ${filters.quickRange === 'all' ? 'active' : ''}`}
            >
              کل دوره
            </button>
          </div>

          {/* انتخاب ماه تقویمی */}
          <select
            value={filters.selectedMonth}
            onChange={(e) => setFilters({ selectedMonth: e.target.value, quickRange: undefined })}
            className="enms-select hidden sm:block text-xs"
            aria-label="انتخاب ماه گزارش"
          >
            <option value="All">همه ماه‌ها</option>
            {availableMonths.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* دسترسی سریع به Google Drive */}
          {onOpenGoogleDrive && (
            <button
              onClick={onOpenGoogleDrive}
              className={`enms-button enms-button-secondary !py-1 !px-2.5 text-xs ${
                currentMainTab === '07-google-drive' || currentMainTab === 'google-drive'
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-bg)]'
                  : ''
              }`}
              title="مدیریت اسناد و پشتیبان‌گیری در Google Drive"
              aria-label="باز کردن بخش Google Drive"
            >
              <HardDrive className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span className="hidden xl:inline">Google Drive</span>
            </button>
          )}

          {/* پاک‌سازی کش */}
          <button
            onClick={handleClearCache}
            disabled={isClearingCache}
            className={`enms-button enms-button-secondary !py-1 !px-2.5 text-xs text-rose-500 hover:text-rose-600 border-rose-500/30 hover:border-rose-500/60 ${
              isClearingCache ? 'opacity-50 cursor-wait' : ''
            }`}
            title="پاک‌سازی کامل کش محلی مرورگر و همگام‌سازی مجدد با فایل‌های JSON"
            aria-label="پاک‌سازی حافظه کش"
          >
            <Trash2 className={`w-3.5 h-3.5 text-rose-500 ${isClearingCache ? 'animate-spin' : ''}`} />
            <span className="hidden xl:inline">پاک‌سازی کَش</span>
          </button>

          {/* تازه‌سازی داده‌ها */}
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="enms-button-icon"
            title="تازه‌سازی جریان داده‌ها"
            aria-label="تازه‌سازی داده‌ها"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[var(--color-primary)]' : ''}`} />
          </button>

          {/* دکمه باز کردن مرکز تنظیمات */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="enms-button-icon hover:rotate-45 transition-transform"
            title="مرکز کنترل و تنظیمات سامانه"
            aria-label="تنظیمات پلتفرم"
          >
            <Settings className="w-4 h-4 text-[var(--color-text-secondary)]" />
          </button>
        </div>
      </header>

      {/* کشوی تنظیمات */}
      <SettingsDrawer isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
};

export default Header;