import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Palette,
  BellRing,
  Flame,
  Clock3,
  DatabaseZap,
  ShieldCheck,
  RotateCcw,
  Check,
  LogOut,
  SlidersHorizontal,
  HardDriveDownload,
  Lock,
  ZoomIn
} from 'lucide-react';
import {
  useAppSettings,
  CornerRadius,
  UserRole,
} from '../../context/AppSettingsContext';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = 'display' | 'alarms' | 'energy_factors' | 'shifts' | 'data_engine' | 'security';

interface ShiftTiming {
  start: string;
  end: string;
}

interface IndustrialSkin {
  id: string;
  title: string;
  subtitle: string;
  isDark: boolean;
  themeAttr: 'dark' | 'light' | 'high-contrast';
  badgeGradient: string;
  colors: {
    bgApp: string;
    bgViewport: string;
    bgSurface: string;
    bgCard: string;
    border: string;
    textPrimary: string;
    primary: string;
    primaryBg: string;
    primaryBorder: string;
  };
}

const INDUSTRIAL_SKINS: IndustrialSkin[] = [
  {
    id: 'classic-slate',
    title: 'Classic Industrial Slate',
    subtitle: 'Dark Control Room',
    isDark: true,
    themeAttr: 'dark',
    badgeGradient: 'from-sky-400 to-slate-900',
    colors: {
      bgApp: '#0b111e',
      bgViewport: '#0f172a',
      bgSurface: '#1e293b',
      bgCard: 'rgba(30, 41, 59, 0.95)',
      border: '#334155',
      textPrimary: '#f8fafc',
      primary: '#38bdf8',
      primaryBg: 'rgba(56, 189, 248, 0.15)',
      primaryBorder: 'rgba(56, 189, 248, 0.4)',
    },
  },
  {
    id: 'petroleum-teal',
    title: 'Petroleum Teal',
    subtitle: 'Petrochemical Process',
    isDark: true,
    themeAttr: 'dark',
    badgeGradient: 'from-emerald-400 to-slate-900',
    colors: {
      bgApp: '#051614',
      bgViewport: '#062421',
      bgSurface: '#0a332f',
      bgCard: 'rgba(10, 51, 47, 0.95)',
      border: '#134e48',
      textPrimary: '#f0fdf4',
      primary: '#10b981',
      primaryBg: 'rgba(16, 185, 129, 0.15)',
      primaryBorder: 'rgba(16, 185, 129, 0.4)',
    },
  },
  {
    id: 'dark-amber',
    title: 'High-Contrast Dark Amber',
    subtitle: 'Night Shift Phosphor',
    isDark: true,
    themeAttr: 'high-contrast',
    badgeGradient: 'from-amber-500 to-black',
    colors: {
      bgApp: '#140d05',
      bgViewport: '#1c1307',
      bgSurface: '#2b1d0c',
      bgCard: 'rgba(43, 29, 12, 0.95)',
      border: '#78350f',
      textPrimary: '#fffbeb',
      primary: '#f59e0b',
      primaryBg: 'rgba(245, 158, 11, 0.15)',
      primaryBorder: 'rgba(245, 158, 11, 0.4)',
    },
  },
  {
    id: 'modern-cyan',
    title: 'Modern Control Cyan',
    subtitle: 'Daylight Technical',
    isDark: false,
    themeAttr: 'light',
    badgeGradient: 'from-sky-400 to-white',
    colors: {
      bgApp: '#f0fdfa',
      bgViewport: '#f8fafc',
      bgSurface: '#ffffff',
      bgCard: '#ffffff',
      border: '#cbd5e1',
      textPrimary: '#0f172a',
      primary: '#0284c7',
      primaryBg: 'rgba(2, 132, 199, 0.12)',
      primaryBorder: 'rgba(2, 132, 199, 0.35)',
    },
  },
  {
    id: 'safety-vis',
    title: 'Safety High-Vis',
    subtitle: 'Field Inspection',
    isDark: true,
    themeAttr: 'dark',
    badgeGradient: 'from-yellow-400 to-black',
    colors: {
      bgApp: '#050505',
      bgViewport: '#000000',
      bgSurface: '#171717',
      bgCard: '#1f1f1f',
      border: '#404040',
      textPrimary: '#fef08a',
      primary: '#eab308',
      primaryBg: 'rgba(234, 179, 8, 0.2)',
      primaryBorder: 'rgba(234, 179, 8, 0.5)',
    },
  },
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, resetSettings } = useAppSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('display');
  const drawerRef = useRef<HTMLDivElement>(null);

  const [selectedSkinId, setSelectedSkinId] = useState<string>(() => {
    return localStorage.getItem('enms_active_skin') || 'classic-slate';
  });

  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    return Number(localStorage.getItem('enms_font_scale')) || 100;
  });

  const gasCalorificValue = (settings as any).gasCalorificValue ?? 8600;
  const mazutCalorificValue = (settings as any).mazutCalorificValue ?? 9600;
  const maxDemandKw = (settings as any).maxDemandKw ?? 12500;
  const autoRefreshSec = (settings as any).autoRefreshSec ?? 30;
  const auditLockEnabled = (settings as any).auditLockEnabled ?? true;

  const [shift1, setShift1] = useState<ShiftTiming>((settings as any).shift1 ?? { start: '07:00', end: '15:00' });
  const [shift2, setShift2] = useState<ShiftTiming>((settings as any).shift2 ?? { start: '15:00', end: '23:00' });
  const [shift3, setShift3] = useState<ShiftTiming>((settings as any).shift3 ?? { start: '23:00', end: '07:00' });
  const [peakHours, setPeakHours] = useState<ShiftTiming>((settings as any).peakHours ?? { start: '19:00', end: '23:00' });

  // اعمال قطعی و بلادرنگ اندازه فونت و زوم به کل نرم‌افزار
  const applyFontScale = (val: number) => {
    setZoomLevel(val);
    localStorage.setItem('enms_font_scale', val.toString());

    const root = document.documentElement;
    const body = document.body;

    // ۱. متد Zoom فیزیکی (پشتیبانی‌شده در Chromium و Electron)
    (root.style as any).zoom = `${val}%`;

    // ۲. اعمال پشتیبان روی فونت ریشه و بادی
    root.style.fontSize = `${(val / 100) * 16}px`;
    body.style.fontSize = `${val}%`;
    root.style.setProperty('--font-scale-percent', `${val}%`);

    updateSettings({ zoomLevel: val } as any);
  };

  // اعمال پوسته صنعتی به صورت زنده
  const applySkin = (skin: IndustrialSkin) => {
    setSelectedSkinId(skin.id);
    localStorage.setItem('enms_active_skin', skin.id);

    const root = document.documentElement;
    root.setAttribute('data-skin', skin.id);
    root.setAttribute('data-theme', skin.themeAttr);
    root.classList.remove('dark', 'light', 'high-contrast');
    root.classList.add(skin.isDark ? 'dark' : 'light');
    if (skin.themeAttr === 'high-contrast') root.classList.add('high-contrast');

    root.style.setProperty('--color-bg-app', skin.colors.bgApp);
    root.style.setProperty('--color-bg-viewport', skin.colors.bgViewport);
    root.style.setProperty('--color-bg-surface', skin.colors.bgSurface);
    root.style.setProperty('--color-bg-card', skin.colors.bgCard);
    root.style.setProperty('--color-border', skin.colors.border);
    root.style.setProperty('--color-text-primary', skin.colors.textPrimary);
    root.style.setProperty('--color-primary', skin.colors.primary);
    root.style.setProperty('--color-primary-bg', skin.colors.primaryBg);
    root.style.setProperty('--color-primary-border', skin.colors.primaryBorder);

    updateSettings({
      theme: skin.themeAttr,
      industrialSkinId: skin.id,
    } as any);
  };

  useEffect(() => {
    const savedSkin = INDUSTRIAL_SKINS.find((s) => s.id === selectedSkinId);
    if (savedSkin) applySkin(savedSkin);
    applyFontScale(zoomLevel);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const tabsConfig = [
    { id: 'display', label: 'پوسته و ارگونومی', icon: Palette },
    { id: 'alarms', label: 'آستانه‌ها و آلارم', icon: BellRing },
    { id: 'energy_factors', label: 'ارزش حرارتی و ضرایب', icon: Flame },
    { id: 'shifts', label: 'شیفت و تعرفه بار', icon: Clock3 },
    { id: 'data_engine', label: 'داده‌ها و لاگ‌شیت', icon: DatabaseZap },
    { id: 'security', label: 'سطوح دسترسی و ممیزی', icon: ShieldCheck },
  ];

  return (
    /* لایه مادر: بدون تیره کردن سنگین و بدون هیچ‌گونه مات کردن پس‌زمینه (کاملاً شفاف با قابلیت دریافت کلیک بیرون) */
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/15 transition-opacity select-none"
      dir="rtl"
      onMouseDown={(e) => {
        if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      {/* بدنه دراور: نیمه‌شفاف شیشه‌ای (Backdrop blur فقط روی خود پنل اعمال می‌شود نه پس‌زمینه سایت) */}
      <div
        ref={drawerRef}
        style={{
          backgroundColor: 'rgba(var(--color-bg-surface-rgb, 15, 23, 42), 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
        className="w-full max-w-xl bg-[var(--color-bg-surface)]/90 border-r border-[var(--color-border)] shadow-2xl h-full flex flex-col justify-between overflow-hidden"
      >
        {/* سربرگ دراور */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-bg-app)]/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--color-primary-bg)] text-[var(--color-primary)] border border-[var(--color-primary-border)]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[var(--color-text-primary)]">
                مرکز تنظیمات مهندسی و پیکربندی EnMS
              </h3>
              <p className="text-[11px] text-[var(--color-text-muted)]">
                سیستم یکپارچه مدیریت انرژی سیمان کیاسر بر مبنای ISO 50001
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* نوار تب‌های ۶ گانه */}
        <div className="grid grid-cols-3 sm:grid-cols-6 border-b border-[var(--color-border)] bg-[var(--color-bg-app)]/70 text-[11px]">
          {tabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as SettingsTab)}
                className={`py-3 px-1 font-bold flex flex-col items-center justify-center gap-1.5 border-b-2 transition-all ${
                  isActive
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-bg-surface)]/80'
                    : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-center truncate w-full">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* محتوای تب‌ها */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs text-[var(--color-text-primary)]">
          
          {/* تب ۱: ظاهر، پوسته و اسلایدر اندازه فونت */}
          {activeTab === 'display' && (
            <div className="space-y-5">
              {/* اسلایدر پیوسته اندازه قلم با تغییر زنده و آنی */}
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1.5 text-[var(--color-text-primary)]">
                    <ZoomIn className="w-4 h-4 text-[var(--color-primary)]" />
                    بزرگ‌نمایی و مقیاس قلم (Zoom & Font Scale):
                  </span>
                  <span className="font-mono font-bold text-sm text-[var(--color-primary)] px-2.5 py-0.5 rounded-md bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)]">
                    {zoomLevel}٪
                  </span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="200"
                  step="5"
                  value={zoomLevel}
                  onChange={(e) => applyFontScale(Number(e.target.value))}
                  className="w-full accent-[var(--color-primary)] cursor-pointer h-2 bg-[var(--color-border)] rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-[var(--color-text-muted)] font-mono">
                  <span>۷۵٪ (فشرده)</span>
                  <span>۱۰۰٪ (عادی)</span>
                  <span>۱۵۰٪ (اتاق کنترل)</span>
                  <span>۲۰۰٪ (ویدئو وال)</span>
                </div>
              </div>

              {/* پوسته‌های صنعتی */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-[var(--color-text-secondary)] font-bold block">
                    انتخاب پوسته صنعتی:
                  </label>
                  <Palette className="w-4 h-4 text-[var(--color-primary)]" />
                </div>
                <div className="space-y-2">
                  {INDUSTRIAL_SKINS.map((skin) => {
                    const isSelected = selectedSkinId === skin.id;
                    return (
                      <div
                        key={skin.id}
                        onClick={() => applySkin(skin)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)] ring-1 ring-[var(--color-primary)] shadow-sm'
                            : 'border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/60 hover:bg-[var(--color-bg-hover)]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                                : 'border-transparent text-transparent'
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                          <div>
                            <div className="font-bold text-xs font-mono text-[var(--color-text-primary)]">
                              {skin.title}
                            </div>
                            <div className="text-[10px] text-[var(--color-text-muted)] font-mono mt-0.5">
                              {skin.subtitle}
                            </div>
                          </div>
                        </div>

                        <div
                          className={`w-6 h-6 rounded-md bg-gradient-to-tr ${skin.badgeGradient} border border-[var(--color-border)] shadow-xs shrink-0`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* هندسه گوشه باکس‌ها */}
              <div className="space-y-2">
                <label className="text-[var(--color-text-secondary)] font-bold block">
                  هندسه گوشه کارت‌ها:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'sharp', label: 'زاویه‌دار (صنعتی)' },
                    { id: 'balanced', label: 'متعادل (مهندسی)' },
                    { id: 'rounded', label: 'نرم و مدرن' },
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => updateSettings({ cornerRadius: r.id as CornerRadius })}
                      className={`p-2.5 rounded-lg border text-center transition-all ${
                        settings.cornerRadius === r.id
                          ? 'border-[var(--color-primary)] text-[var(--color-primary)] font-bold bg-[var(--color-primary-bg)]'
                          : 'border-[var(--color-border)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* تب ۲: آستانه‌ها و آلارم‌ها */}
          {activeTab === 'alarms' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/70">
                <div>
                  <span className="font-bold text-[var(--color-text-primary)] block">هشدار صوتی تجاوز دیماند:</span>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    پخش آلارم صوتی در صورت عبور بار دپارتمان‌ها از سقف مجاز
                  </span>
                </div>
                <button
                  onClick={() => updateSettings({ soundAlerts: !settings.soundAlerts })}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    settings.soundAlerts ? 'bg-[var(--color-primary)] justify-end' : 'bg-slate-400 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <div className="space-y-2 p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/70">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-[var(--color-text-primary)]">
                    آستانه حساسیت انحراف CUSUM:
                  </label>
                  <span className="font-mono font-bold text-sm text-[var(--color-primary)]">
                    {settings.deviationThreshold}٪
                  </span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="15"
                  value={settings.deviationThreshold}
                  onChange={(e) => updateSettings({ deviationThreshold: Number(e.target.value) })}
                  className="w-full accent-[var(--color-primary)] cursor-pointer"
                />
              </div>

              <div className="space-y-2 p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/70">
                <label className="font-bold text-[var(--color-text-primary)] block">
                  سقف دیماند مجاز کارخانه (قرارداد توانیر):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={maxDemandKw}
                    onChange={(e) => updateSettings({ maxDemandKw: Number(e.target.value) } as any)}
                    className="flex-1 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] font-mono text-left font-bold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                  <span className="text-[var(--color-text-muted)] font-mono">kW</span>
                </div>
              </div>
            </div>
          )}

          {/* تب ۳: ارزش حرارتی و ضرایب فرآیندی */}
          {activeTab === 'energy_factors' && (
            <div className="space-y-4">
              <div className="space-y-2 p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/70">
                <label className="font-bold text-[var(--color-text-primary)] block">
                  ارزش حرارتی ویژه گاز طبیعی (Gas Calorific Value):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={gasCalorificValue}
                    onChange={(e) => updateSettings({ gasCalorificValue: Number(e.target.value) } as any)}
                    className="flex-1 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] font-mono text-left font-bold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                  <span className="text-[var(--color-text-muted)] font-mono">kcal/Nm³</span>
                </div>
              </div>

              <div className="space-y-2 p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/70">
                <label className="font-bold text-[var(--color-text-primary)] block">
                  ارزش حرارتی مازوت سوختی (Fuel Oil Calorific Value):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={mazutCalorificValue}
                    onChange={(e) => updateSettings({ mazutCalorificValue: Number(e.target.value) } as any)}
                    className="flex-1 p-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] font-mono text-left font-bold text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                  />
                  <span className="text-[var(--color-text-muted)] font-mono">kcal/lit</span>
                </div>
              </div>
            </div>
          )}

          {/* تب ۴: شیفت‌ها و ساعات پیک بار */}
          {activeTab === 'shifts' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/70 space-y-3">
                <span className="font-bold text-[var(--color-text-primary)] block">
                  تنظیم و ویرایش ساعات کاری شیفت‌های تولید:
                </span>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center py-1 border-b border-[var(--color-border)]">
                    <span className="font-semibold">شیفت صبح (شیفت ۱)</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <input
                        type="time"
                        value={shift1.start}
                        onChange={(e) => {
                          const updated = { ...shift1, start: e.target.value };
                          setShift1(updated);
                          updateSettings({ shift1: updated } as any);
                        }}
                        className="p-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] outline-none"
                      />
                      <span>الی</span>
                      <input
                        type="time"
                        value={shift1.end}
                        onChange={(e) => {
                          const updated = { ...shift1, end: e.target.value };
                          setShift1(updated);
                          updateSettings({ shift1: updated } as any);
                        }}
                        className="p-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1 border-b border-[var(--color-border)]">
                    <span className="font-semibold">شیفت عصر (شیفت ۲)</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <input
                        type="time"
                        value={shift2.start}
                        onChange={(e) => {
                          const updated = { ...shift2, start: e.target.value };
                          setShift2(updated);
                          updateSettings({ shift2: updated } as any);
                        }}
                        className="p-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] outline-none"
                      />
                      <span>الی</span>
                      <input
                        type="time"
                        value={shift2.end}
                        onChange={(e) => {
                          const updated = { ...shift2, end: e.target.value };
                          setShift2(updated);
                          updateSettings({ shift2: updated } as any);
                        }}
                        className="p-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-1">
                    <span className="font-semibold">شیفت شب (شیفت ۳)</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <input
                        type="time"
                        value={shift3.start}
                        onChange={(e) => {
                          const updated = { ...shift3, start: e.target.value };
                          setShift3(updated);
                          updateSettings({ shift3: updated } as any);
                        }}
                        className="p-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] outline-none"
                      />
                      <span>الی</span>
                      <input
                        type="time"
                        value={shift3.end}
                        onChange={(e) => {
                          const updated = { ...shift3, end: e.target.value };
                          setShift3(updated);
                          updateSettings({ shift3: updated } as any);
                        }}
                        className="p-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/70 space-y-2">
                <span className="font-bold text-[var(--color-text-primary)] block">
                  بازه اوج بار و محدودیت شبکه توانیر:
                </span>
                <div className="flex items-center justify-between font-mono">
                  <span className="text-[11px] font-sans text-[var(--color-text-muted)]">ساعت پیک بار اجباری:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="time"
                      value={peakHours.start}
                      onChange={(e) => {
                        const updated = { ...peakHours, start: e.target.value };
                        setPeakHours(updated);
                        updateSettings({ peakHours: updated } as any);
                      }}
                      className="p-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] outline-none"
                    />
                    <span>الی</span>
                    <input
                      type="time"
                      value={peakHours.end}
                      onChange={(e) => {
                        const updated = { ...peakHours, end: e.target.value };
                        setPeakHours(updated);
                        updateSettings({ peakHours: updated } as any);
                      }}
                      className="p-1 rounded border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* تب ۵: موتور داده‌ها و فایل‌ها */}
          {activeTab === 'data_engine' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/70 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[var(--color-text-primary)]">
                    بازه به‌روزرسانی شاخص‌ها:
                  </span>
                  <span className="font-mono font-bold text-[var(--color-primary)]">
                    {autoRefreshSec} ثانیه
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="10"
                  value={autoRefreshSec}
                  onChange={(e) => updateSettings({ autoRefreshSec: Number(e.target.value) } as any)}
                  className="w-full accent-[var(--color-primary)] cursor-pointer"
                />
              </div>

              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/70 space-y-3">
                <span className="font-bold text-[var(--color-text-primary)] block">
                  وضعیت پایگاه داده‌های ۲۴ ماهه (۷۲۲ روز):
                </span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                  <div className="p-2 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                    daily-production: <span className="text-emerald-500 font-bold">۷۲۲ روز</span>
                  </div>
                  <div className="p-2 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                    energy-consumption: <span className="text-emerald-500 font-bold">۷۲۲ روز</span>
                  </div>
                  <div className="p-2 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                    cement-dispatch: <span className="text-emerald-500 font-bold">۷۲۲ روز</span>
                  </div>
                  <div className="p-2 rounded bg-[var(--color-bg-surface)] border border-[var(--color-border)]">
                    department-stops: <span className="text-emerald-500 font-bold">۷۲۲ روز</span>
                  </div>
                </div>
                <button
                  onClick={() => alert('پکیج داده‌های ۲۴ ماهه آماده بارگیری شد.')}
                  className="w-full py-2.5 px-3 rounded-lg bg-[var(--color-bg-hover)] hover:opacity-90 text-[var(--color-text-primary)] font-bold flex items-center justify-center gap-1.5 transition-colors border border-[var(--color-border)]"
                >
                  <HardDriveDownload className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <span>دانلود دیتابیس JSON کارخانه</span>
                </button>
              </div>
            </div>
          )}

          {/* تب ۶: امنیت و ممیزی */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/70 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[var(--color-primary-bg)] border border-[var(--color-primary)] flex items-center justify-center text-[var(--color-primary)] font-bold text-sm">
                  مه
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-text-primary)]">{settings.userName}</h4>
                  <span className="text-[11px] text-[var(--color-primary)] block mt-0.5">
                    سرممیز و مشاور ارشد سیستم‌های مدیریت انرژی (ISO 50001)
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[var(--color-text-secondary)] font-bold block">
                  نقش سازمانی و تراز دسترسی:
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'manager', label: 'مدیر انرژی و سرممیز (تصویب خط مبنا و کنترل کامل سیستم)' },
                    { id: 'operator', label: 'اپراتور اتاق کنترل CCR (ثبت ارقام لاگ‌شیت و مشاهده وضعیت)' },
                    { id: 'auditor', label: 'ممیز شخص ثالث استاندارد (صرفاً بازرسی و پایش مدارک)' },
                  ].map((role) => (
                    <button
                      key={role.id}
                      onClick={() => updateSettings({ userRole: role.id as UserRole })}
                      className={`w-full p-2.5 rounded-xl border text-right transition-all flex items-center justify-between ${
                        settings.userRole === role.id
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary-bg)] text-[var(--color-primary)] font-bold'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-bg-card-subtle)]/70'
                      }`}
                    >
                      <span>{role.label}</span>
                      {settings.userRole === role.id && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)]/70">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <div>
                    <span className="font-bold text-[var(--color-text-primary)] block">قفل داده‌های ممیزی‌شده:</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">جلوگیری از دستکاری لاگ‌شیت‌های تاییدشده سال قبل</span>
                  </div>
                </div>
                <button
                  onClick={() => updateSettings({ auditLockEnabled: !auditLockEnabled } as any)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    auditLockEnabled ? 'bg-amber-500 justify-end' : 'bg-slate-400 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

              <button
                onClick={() => alert('خروج از حساب کاربری انجام شد.')}
                className="w-full mt-2 py-2 px-3 rounded-lg border border-rose-300 dark:border-rose-900/50 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>خروج از حساب کاربری</span>
              </button>
            </div>
          )}
        </div>

        {/* فوتر دراور */}
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg-app)]/80 flex items-center justify-between">
          <button
            onClick={resetSettings}
            className="text-xs text-rose-500 hover:underline flex items-center gap-1 font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>بازنشانی به پیش‌فرض</span>
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-6 rounded-xl bg-[var(--color-primary)] text-slate-950 font-black text-xs hover:opacity-95 shadow-md transition-all cursor-pointer"
          >
            ذخیره و بستن
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsDrawer;