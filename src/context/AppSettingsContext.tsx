import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light' | 'high-contrast';
export type AccentColor = 'emerald' | 'blue' | 'amber' | 'purple' | 'cyan';
export type FontFamily = 'Vazirmatn' | 'IRANYekan' | 'Shabnam' | 'system';
export type FontSize = 'compact' | 'normal' | 'large';
export type CornerRadius = 'sharp' | 'balanced' | 'rounded';
export type UserRole = 'manager' | 'operator' | 'auditor';

export interface AppSettings {
  theme: ThemeMode;
  accent: AccentColor;
  fontFamily: FontFamily;
  fontSize: FontSize;
  cornerRadius: CornerRadius;
  density: 'compact' | 'comfortable';
  soundAlerts: boolean;
  deviationThreshold: number; // درصد انحراف مجاز دیماند/مصرف
  userRole: UserRole;
  userName: string;
}

const defaultSettings: AppSettings = {
  theme: 'dark',
  accent: 'emerald',
  fontFamily: 'Vazirmatn',
  fontSize: 'normal',
  cornerRadius: 'balanced',
  density: 'comfortable',
  soundAlerts: true,
  deviationThreshold: 5,
  userRole: 'manager',
  userName: 'مهندس جابر شریعت‌نژاد (مدیر سیستم EnMS)',
};

const STORAGE_KEY = 'enms_kiasar_app_settings';

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultSettings));
  };

  // اعمال لحظه‌ای تم به ریشه DOM
  useEffect(() => {
    const root = document.documentElement;

    // ۱. حذف کلاس‌ها و اتریبیوت‌های قبلی
    root.classList.remove('dark', 'light', 'high-contrast');

    // ۲. اعمال تم جدید روی کلاس و data-theme
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else if (settings.theme === 'light') {
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    } else if (settings.theme === 'high-contrast') {
      root.classList.add('dark', 'high-contrast');
      root.setAttribute('data-theme', 'high-contrast');
    }
  }, [settings.theme]);

  // اعمال لحظه‌ای متغیرها به ریشه DOM
  useEffect(() => {
    const root = document.documentElement;

    // پالت رنگی اکسنت سازمانی
    const accents: Record<AccentColor, { primary: string; hover: string; light: string; bg: string }> = {
      emerald: { primary: '#10b981', hover: '#059669', light: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' },
      blue: { primary: '#0284c7', hover: '#0369a1', light: '#38bdf8', bg: 'rgba(2, 132, 199, 0.15)' },
      amber: { primary: '#f59e0b', hover: '#d97706', light: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' },
      purple: { primary: '#a855f7', hover: '#9333ea', light: '#c084fc', bg: 'rgba(168, 85, 247, 0.15)' },
      cyan: { primary: '#06b6d4', hover: '#0891b2', light: '#22d3ee', bg: 'rgba(6, 182, 212, 0.15)' },
    };

    const selectedAccent = accents[settings.accent] || accents.emerald;
    root.style.setProperty('--color-primary', selectedAccent.primary);
    root.style.setProperty('--color-primary-hover', selectedAccent.hover);
    root.style.setProperty('--color-primary-light', selectedAccent.light);
    root.style.setProperty('--color-primary-bg', selectedAccent.bg);

    // هندسه شعاع گوشه‌ها
    const radii: Record<CornerRadius, { md: string; lg: string; xl: string }> = {
      sharp: { md: '2px', lg: '4px', xl: '4px' },
      balanced: { md: '0.5rem', lg: '0.75rem', xl: '1rem' },
      rounded: { md: '0.75rem', lg: '1.25rem', xl: '1.75rem' },
    };
    const selectedRadii = radii[settings.cornerRadius] || radii.balanced;
    root.style.setProperty('--radius-md', selectedRadii.md);
    root.style.setProperty('--radius-lg', selectedRadii.lg);
    root.style.setProperty('--radius-xl', selectedRadii.xl);

    // مقیاس فونت
    const fontSizes: Record<FontSize, string> = {
      compact: '13px',
      normal: '14px',
      large: '16px',
    };
    root.style.fontSize = fontSizes[settings.fontSize] || '14px';
  }, [settings]);

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    return {
      settings: defaultSettings,
      updateSettings: () => {},
      resetSettings: () => {},
    };
  }
  return context;
};