import { useEffect, useState } from 'react';

export interface BaselinesConfig {
  target_thermal_kcal_kg: number;
  target_electric_kwh_ton: number;
  clinker_depot_min_safe_stock_ton: number;
  daily_dispatch_target_ton: number;
  kiln_availability_target_pct: number;
  tolerance_electric_pct: number;
  tolerance_thermal_pct: number;
  units: {
    electric: string;
    thermal: string;
    gas: string;
    mass: string;
    percent: string;
    power: string;
  };
  critical_alert_thresholds: {
    electric_high_kwh_ton: number;
    thermal_high_kcal_kg: number;
    silo_critical_high_pct: number;
    silo_critical_low_pct: number;
  };
  department_electric_benchmarks: Record<
    string,
    { name: string; benchmark_kwh_ton: number; share_pct: number }
  >;
}

// مقادیر پیش‌فرض ایمن برای جلوگیری از کرش در صورت قطعی شبکه یا خطای بارگذاری /config/baselines.json
export const DEFAULT_BASELINES: BaselinesConfig = {
  target_thermal_kcal_kg: 888.0,
  target_electric_kwh_ton: 104.0,
  clinker_depot_min_safe_stock_ton: 30000.0,
  daily_dispatch_target_ton: 4500.0,
  kiln_availability_target_pct: 85.0,
  tolerance_electric_pct: 5.0,
  tolerance_thermal_pct: 5.0,
  units: {
    electric: 'kWh/t',
    thermal: 'kcal/kg.cl',
    gas: 'Nm³',
    mass: 'تن',
    percent: '٪',
    power: 'kW',
  },
  critical_alert_thresholds: {
    electric_high_kwh_ton: 112.0,
    thermal_high_kcal_kg: 925.0,
    silo_critical_high_pct: 92.0,
    silo_critical_low_pct: 20.0,
  },
  department_electric_benchmarks: {
    crusher: { name: 'سنگ‌شکن', benchmark_kwh_ton: 2.2, share_pct: 2.3 },
    rawMill: { name: 'آسیاب مواد خام', benchmark_kwh_ton: 24.5, share_pct: 23.8 },
    kiln: { name: 'کوره پخت و خنک‌کن', benchmark_kwh_ton: 22.8, share_pct: 22.1 },
    cementMill: { name: 'آسیاب‌های سیمان', benchmark_kwh_ton: 38.5, share_pct: 37.4 },
    packingUtilities: { name: 'بارگیرخانه و تأسیسات جانبی', benchmark_kwh_ton: 16.0, share_pct: 14.4 },
  },
};

const memoryCache = new Map<string, any>();
const inflightRequests = new Map<string, Promise<any>>();

/**
 * واکشی ایمن فایل‌های JSON از مسیرهای public/ با محافظت در برابر HTML/Rate-Limit و کش محلی
 */
export async function safeFetchPublicJson<T>(
  url: string,
  fallback: T,
  options?: { storageKey?: string; forceRefresh?: boolean }
): Promise<T> {
  const { storageKey, forceRefresh = false } = options || {};

  if (!forceRefresh && memoryCache.has(url)) {
    return memoryCache.get(url) as T;
  }

  if (!forceRefresh && inflightRequests.has(url)) {
    return inflightRequests.get(url) as Promise<T>;
  }

  const readLocalFallback = (): T => {
    if (storageKey && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved) as T;
      } catch {
        // ignore storage parse error
      }
    }
    return fallback;
  };

  const requestPromise = (async (): Promise<T> => {
    if (typeof fetch === 'undefined') {
      return readLocalFallback();
    }
    try {
      const fetchUrl = forceRefresh
        ? `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`
        : url;
      const res = await fetch(fetchUrl);
      if (!res.ok) {
        return readLocalFallback();
      }
      const text = (await res.text()).trim();
      if (!text || text.startsWith('<') || text.includes('Rate exceeded')) {
        return readLocalFallback();
      }
      const parsed = JSON.parse(text) as T;
      memoryCache.set(url, parsed);
      if (storageKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKey, JSON.stringify(parsed));
        } catch {
          // ignore quota error
        }
      }
      return parsed;
    } catch {
      return readLocalFallback();
    } finally {
      inflightRequests.delete(url);
    }
  })();

  inflightRequests.set(url, requestPromise);
  return requestPromise;
}

export function loadBaselinesConfig(): Promise<BaselinesConfig> {
  return safeFetchPublicJson<BaselinesConfig>('/config/baselines.json', DEFAULT_BASELINES, {
    storageKey: 'enms_config_baselines_v1',
  });
}

export function useBaselinesConfig(): BaselinesConfig {
  const [baselines, setBaselines] = useState<BaselinesConfig>(
    () => (memoryCache.get('/config/baselines.json') as BaselinesConfig) || DEFAULT_BASELINES
  );

  useEffect(() => {
    let mounted = true;
    loadBaselinesConfig().then((data) => {
      if (mounted && data) {
        setBaselines(data);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return baselines;
}
