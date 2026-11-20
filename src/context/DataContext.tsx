import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  DatasetId,
  SchemaRegistry,
  FilterState,
  EnergyPerformanceEnPI,
} from '../types';
import { toPersianDigits } from '../utils/persianUtils';
import { safeFetchPublicJson } from '../services/configService';

// ساختار پیش‌فرض ایمن برای هر دیتاست در صورت عدم دسترسی موقت به شبکه
const EMPTY_DATASET_FALLBACK: Record<DatasetId, any> = {
  'enpi-performance': [],
  'electrical-energy': [],
  'production-operations': [],
  'dispatch-sales': [],
  'inventory-silos': [],
  'organization-context': {
    scopeBoundary: null,
    swotIssues: [],
    interestedParties: [],
  },
  'seu-registry': {
    seuRegistry: [],
    actionPlans: [],
  },
};

const CORE_PRELOAD_DATASETS: DatasetId[] = [
  'enpi-performance',
  'electrical-energy',
  'production-operations',
  'dispatch-sales',
  'inventory-silos',
];

const ALL_DATASET_IDS: DatasetId[] = [
  'enpi-performance',
  'electrical-energy',
  'production-operations',
  'dispatch-sales',
  'inventory-silos',
  'organization-context',
  'seu-registry',
];

interface DataContextType {
  schemaRegistry: SchemaRegistry | null;
  loadingRegistry: boolean;
  loadDataset: (id: DatasetId) => Promise<any>;
  loadMultipleDatasets: (ids: DatasetId[]) => Promise<void>;
  getDataset: <T = any>(id: DatasetId) => T | null;
  getFilteredData: <T = any>(id: DatasetId) => T[];
  isDatasetLoading: (id: DatasetId) => boolean;
  filters: FilterState;
  setFilters: (newFilters: Partial<FilterState>) => void;
  availableYears: number[];
  availableMonths: { value: string; label: string }[];
  refreshData: () => Promise<void>;
  isRefreshing: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function readCachedDataset<T>(id: DatasetId): T | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const raw = localStorage.getItem(`enms_dataset_${id}`);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore storage parse error
  }
  return undefined;
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [schemaRegistry, setSchemaRegistry] = useState<SchemaRegistry | null>(null);
  const [loadingRegistry, setLoadingRegistry] = useState(false);

  // حافظه نهان داده‌ها با بازیابی فوری از کش محلی (بدون باندل تکراری فایل‌های JSON در src)
  const [cache, setCache] = useState<Partial<Record<DatasetId, any>>>(() => {
    const initial: Partial<Record<DatasetId, any>> = {};
    for (const id of ALL_DATASET_IDS) {
      const cached = readCachedDataset(id);
      if (cached !== undefined) {
        initial[id] = cached;
      }
    }
    return initial;
  });

  const cacheRef = useRef(cache);
  cacheRef.current = cache;

  const schemaRegistryRef = useRef<SchemaRegistry | null>(schemaRegistry);
  schemaRegistryRef.current = schemaRegistry;

  const fetchedFromServerRef = useRef<Set<DatasetId>>(new Set());

  const [loadingStates, setLoadingStates] = useState<Partial<Record<DatasetId, boolean>>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // متد بارگذاری ماژولار و برخط هر دیتاست از مسیر استاندارد public/data/ بر اساس schema-registry.json
  const loadDataset = useCallback(
    async (id: DatasetId, forceRefresh = false): Promise<any> => {
      if (!forceRefresh && fetchedFromServerRef.current.has(id) && cacheRef.current[id] !== undefined) {
        return cacheRef.current[id];
      }

      setLoadingStates((prev) => ({ ...prev, [id]: true }));
      try {
        const activeRegistry = schemaRegistryRef.current;
        const filePath = activeRegistry?.datasets?.[id]?.filePath || `/data/${id}.json`;
        const fallback = cacheRef.current[id] ?? EMPTY_DATASET_FALLBACK[id];
        const data = await safeFetchPublicJson<any>(filePath, fallback, {
          storageKey: `enms_dataset_${id}`,
          forceRefresh,
        });
        fetchedFromServerRef.current.add(id);
        setCache((prev) => ({ ...prev, [id]: data }));
        return data;
      } finally {
        setLoadingStates((prev) => ({ ...prev, [id]: false }));
      }
    },
    []
  );

  // بارگذاری رجیستری مرکزی اسکیماها و پیش‌بارگذاری دیتاست‌های پایه از public/data/
  useEffect(() => {
    let isMounted = true;
    const bootstrapData = async () => {
      setLoadingRegistry(true);
      try {
        const registry = await safeFetchPublicJson<SchemaRegistry | null>(
          '/data/schema-registry.json',
          null,
          { storageKey: 'enms_schema_registry_v1' }
        );
        if (isMounted && registry) {
          schemaRegistryRef.current = registry;
          setSchemaRegistry(registry);
        }

        const results = await Promise.all(
          CORE_PRELOAD_DATASETS.map(async (id) => {
            const filePath = registry?.datasets?.[id]?.filePath || `/data/${id}.json`;
            const fallback = cacheRef.current[id] ?? EMPTY_DATASET_FALLBACK[id];
            const data = await safeFetchPublicJson<any>(filePath, fallback, {
              storageKey: `enms_dataset_${id}`,
            });
            fetchedFromServerRef.current.add(id);
            return [id, data] as const;
          })
        );

        if (isMounted) {
          setCache((prev) => {
            const next = { ...prev };
            for (const [id, data] of results) {
              next[id] = data;
            }
            return next;
          });
        }
      } finally {
        if (isMounted) setLoadingRegistry(false);
      }
    };

    bootstrapData();
    return () => {
      isMounted = false;
    };
  }, []);

  // محاسبه بازه اولیه تاریخ بر اساس enpi-performance
  const defaultDates = useMemo(() => {
    const defaultEnpi = (cache['enpi-performance'] || []) as EnergyPerformanceEnPI[];
    if (Array.isArray(defaultEnpi) && defaultEnpi.length > 0) {
      const allDates = defaultEnpi.map((d) => d.Date);
      return {
        start: allDates[Math.max(0, allDates.length - 30)] || '1405/05/29',
        end: allDates[allDates.length - 1] || '1405/06/29',
        all: allDates,
      };
    }
    return { start: '1405/05/29', end: '1405/06/29', all: [] as string[] };
  }, [cache]);

  const [filters, setFiltersState] = useState<FilterState>({
    startDate: defaultDates.start,
    endDate: defaultDates.end,
    selectedYear: 'All',
    selectedMonth: 'All',
    quickRange: '30d',
  });

  const hasSyncedInitialDates = useRef(false);
  useEffect(() => {
    if (!hasSyncedInitialDates.current && defaultDates.all.length > 0) {
      hasSyncedInitialDates.current = true;
      setFiltersState((prev) => ({
        ...prev,
        startDate: defaultDates.start,
        endDate: defaultDates.end,
      }));
    }
  }, [defaultDates]);

  // بارگذاری چند دیتاست به صورت همزمان
  const loadMultipleDatasets = useCallback(
    async (ids: DatasetId[]): Promise<void> => {
      await Promise.all(ids.map((id) => loadDataset(id)));
    },
    [loadDataset]
  );

  // استخراج مستقیم از حافظه نهان
  const getDataset = useCallback(
    <T = any,>(id: DatasetId): T | null => {
      return (cache[id] as T) ?? (EMPTY_DATASET_FALLBACK[id] as T) ?? null;
    },
    [cache]
  );

  // فیلتر کردن هوشمند دیتاست‌ها بر اساس dateKey یا Date
  const getFilteredData = useCallback(
    <T = any,>(id: DatasetId): T[] => {
      const data = getDataset<any[]>(id);
      if (!Array.isArray(data)) {
        return [];
      }

      return data.filter((row: any) => {
        const dateKey = row.dateKey || row.Date;
        const year = row.year || row.Year;
        const month = row.month || row.Month;

        if (filters.selectedYear !== 'All' && String(year) !== filters.selectedYear) {
          return false;
        }
        if (filters.selectedMonth !== 'All' && String(month) !== filters.selectedMonth) {
          return false;
        }
        if (dateKey && (dateKey < filters.startDate || dateKey > filters.endDate)) {
          return false;
        }
        return true;
      }) as T[];
    },
    [getDataset, filters]
  );

  const isDatasetLoading = useCallback(
    (id: DatasetId): boolean => {
      return !!loadingStates[id];
    },
    [loadingStates]
  );

  // اعمال تغییرات در فیلتر سراسری
  const setFilters = useCallback(
    (newFilters: Partial<FilterState>) => {
      setFiltersState((prev) => {
        const updated = { ...prev, ...newFilters };
        const allDates = defaultDates.all;

        if (newFilters.quickRange && allDates.length > 0) {
          const defaultStart = allDates[Math.max(0, allDates.length - 30)];
          const defaultEnd = allDates[allDates.length - 1];

          if (newFilters.quickRange === '7d') {
            updated.startDate = allDates[Math.max(0, allDates.length - 7)] || defaultStart;
            updated.endDate = defaultEnd;
            updated.selectedMonth = 'All';
            updated.selectedYear = 'All';
          } else if (newFilters.quickRange === '30d') {
            updated.startDate = allDates[Math.max(0, allDates.length - 30)] || defaultStart;
            updated.endDate = defaultEnd;
            updated.selectedMonth = 'All';
            updated.selectedYear = 'All';
          } else if (newFilters.quickRange === 'all') {
            updated.startDate = allDates[0] || defaultStart;
            updated.endDate = defaultEnd;
            updated.selectedMonth = 'All';
            updated.selectedYear = 'All';
          }
        }

        return updated;
      });
    },
    [defaultDates]
  );

  // سال‌ها و ماه‌های موجود برای منوهای فیلتر
  const availableYears = useMemo(() => {
    const enpi = (cache['enpi-performance'] || []) as EnergyPerformanceEnPI[];
    if (!Array.isArray(enpi)) return [];
    const years = Array.from(new Set(enpi.map((d) => d.Year)));
    return years.sort((a, b) => b - a);
  }, [cache]);

  const availableMonths = useMemo(() => {
    const enpi = (cache['enpi-performance'] || []) as EnergyPerformanceEnPI[];
    if (!Array.isArray(enpi)) return [];
    const map = new Map<number, string>();
    enpi.forEach((d) => {
      if (!map.has(d.Month)) {
        map.set(d.Month, d.MonthName);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([num, name]) => ({
        value: String(num),
        label: `${name} (ماه ${toPersianDigits(num)})`,
      }));
  }, [cache]);

  // رفرش کردن کل داده‌ها از public/data/
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all(
        ALL_DATASET_IDS.map((key) => loadDataset(key, true))
      );
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  return (
    <DataContext.Provider
      value={{
        schemaRegistry,
        loadingRegistry,
        loadDataset,
        loadMultipleDatasets,
        getDataset,
        getFilteredData,
        isDatasetLoading,
        filters,
        setFilters,
        availableYears,
        availableMonths,
        refreshData,
        isRefreshing,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
