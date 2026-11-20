/**
 * ماژول مدیریت حافظه نهان و کشینگ داده‌های سامانه مدیریت انرژی
 * Energy Management System (EnMS) ISO 50001 Cache Utility
 *
 * قابلیت‌ها:
 * ۱. کش درون‌حافظه‌ای با انقضای زمانی (TTL) و سیاست تخلیه LRU
 * ۲. کش ماندگار مرورگر (LocalStorage و SessionStorage) با اعتبارسنجی انقضا و نسخه داده
 * ۳. واکشی هوشمند با کش خودکار داده‌ها (fetchWithCache)
 * ۴. ابزارهای پاک‌سازی بر اساس کلید، پیشوند (Prefix) یا تخلیه کامل
 * ۵. تابع جامع پاک‌سازی کش و همگام‌سازی مستقیم با فایل‌های JSON پروژه (clearEnmsAppCache)
 */

export type StorageType = 'memory' | 'local' | 'session';

export interface CacheOptions {
  ttlMs?: number; // مدت زمان اعتبار به میلی‌ثانیه (پیش‌فرض: ۱۰ دقیقه)
  version?: string; // نسخه ساختار داده جهت باطل‌سازی در زمان ارتقا
  storageType?: StorageType;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number | null; // null یعنی بدون انقضای زمانی
  version?: string;
  hits: number;
}

export interface CacheStats {
  memoryEntriesCount: number;
  memoryEstimatedBytes: number;
  storageEntriesCount: number;
  hitCount: number;
  missCount: number;
}

// پیشوند سراسری برای کلیدهای کش سامانه جهت جلوگیری از تداخل با سایر برنامه‌ها
const CACHE_KEY_PREFIX = 'enms_kiasar_cache_';
const DEFAULT_TTL_MS = 10 * 60 * 1000; // ۱۰ دقیقه
const MAX_MEMORY_CACHE_ITEMS = 200; // حداکثر آیتم‌های کش موقت حافظه (LRU)

/**
 * مدیریت کش درون‌حافظه‌ای (In-Memory Cache)
 */
class MemoryCacheManager {
  private store = new Map<string, CacheEntry<any>>();
  private hitCount = 0;
  private missCount = 0;

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) {
      this.missCount++;
      return null;
    }

    // بررسی انقضای زمانی
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.missCount++;
      return null;
    }

    // به‌روزرسانی آمار و رتبه LRU (انتقال به انتهای Map با حذف و اضافه مجدد)
    entry.hits++;
    this.hitCount++;
    this.store.delete(key);
    this.store.set(key, entry);

    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number, version?: string): void {
    // اعمال سیاست LRU در صورت پر شدن ظرفیت
    if (this.store.size >= MAX_MEMORY_CACHE_ITEMS && !this.store.has(key)) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) {
        this.store.delete(oldestKey);
      }
    }

    const now = Date.now();
    const effectiveTtl = ttlMs !== undefined ? ttlMs : DEFAULT_TTL_MS;
    const expiresAt = effectiveTtl > 0 ? now + effectiveTtl : null;

    this.store.set(key, {
      data,
      timestamp: now,
      expiresAt,
      version,
      hits: 0,
    });
  }

  has(key: string): boolean {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  deleteByPrefix(prefix: string): number {
    let deletedCount = 0;
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  clear(): void {
    this.store.clear();
  }

  getStats(): { count: number; hitCount: number; missCount: number } {
    return {
      count: this.store.size,
      hitCount: this.hitCount,
      missCount: this.missCount,
    };
  }
}

// نمونه واحد کش حافظه
export const memoryCache = new MemoryCacheManager();

/**
 * دریافت شئ Storage مرورگر با بررسی دسترسی و ایمنی
 */
function getWebStorage(type: 'local' | 'session'): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    const storage = type === 'local' ? window.localStorage : window.sessionStorage;
    // تست دسترسی واقعی (برخی مرورگرها در حالت Incognito یا بلاک کوکی خطا می‌دهند)
    const testKey = `__storage_test__`;
    storage.setItem(testKey, '1');
    storage.removeItem(testKey);
    return storage;
  } catch {
    return null;
  }
}

/**
 * نرمال‌سازی کلید کش با پیشوند استاندارد سامانه
 */
export function normalizeCacheKey(key: string): string {
  return key.startsWith(CACHE_KEY_PREFIX) ? key : `${CACHE_KEY_PREFIX}${key}`;
}

/**
 * ذخیره داده در کش با مدت زمان ماندگاری مشخص
 *
 * @param key کلید شناسه داده
 * @param data محتوای ذخیره‌سازی
 * @param options تنظیمات زمان ماندگاری و محل ذخیره
 */
export function setCacheItem<T>(
  key: string,
  data: T,
  options?: CacheOptions | number
): void {
  const normalizedKey = normalizeCacheKey(key);
  const opts: CacheOptions =
    typeof options === 'number' ? { ttlMs: options } : options || {};
  const storageType = opts.storageType || 'memory';
  const ttlMs = opts.ttlMs !== undefined ? opts.ttlMs : DEFAULT_TTL_MS;

  if (storageType === 'memory') {
    memoryCache.set(normalizedKey, data, ttlMs, opts.version);
    return;
  }

  const storage = getWebStorage(storageType);
  if (!storage) {
    // در صورت عدم دسترسی به WebStorage به حافظه رم سوییچ می‌شود
    memoryCache.set(normalizedKey, data, ttlMs, opts.version);
    return;
  }

  const now = Date.now();
  const expiresAt = ttlMs > 0 ? now + ttlMs : null;

  const entry: CacheEntry<T> = {
    data,
    timestamp: now,
    expiresAt,
    version: opts.version,
    hits: 0,
  };

  try {
    storage.setItem(normalizedKey, JSON.stringify(entry));
  } catch {
    // در صورت پر شدن حافظه (QuotaExceededError)، داده‌های قدیمی منقضی‌شده پاک‌سازی می‌شوند
    cleanExpiredStorageItems(storageType);
    try {
      storage.setItem(normalizedKey, JSON.stringify(entry));
    } catch {
      // اگر همچنان فضا کم بود، در حافظه موقت ذخیره می‌شود
      memoryCache.set(normalizedKey, data, ttlMs, opts.version);
    }
  }
}

/**
 * بازیابی داده از کش (با اعتبارسنجی خودکار زمان انقضا و نسخه)
 *
 * @param key کلید شناسه داده
 * @param storageType نوع محل ذخیره (memory, local, session)
 * @param expectedVersion نسخه مورد انتظار داده (در صورت عدم انطباق باطل می‌شود)
 */
export function getCacheItem<T>(
  key: string,
  storageType: StorageType = 'memory',
  expectedVersion?: string
): T | null {
  const normalizedKey = normalizeCacheKey(key);

  if (storageType === 'memory') {
    return memoryCache.get<T>(normalizedKey);
  }

  const storage = getWebStorage(storageType);
  if (!storage) {
    return memoryCache.get<T>(normalizedKey);
  }

  const rawItem = storage.getItem(normalizedKey);
  if (!rawItem) return null;

  try {
    const entry: CacheEntry<T> = JSON.parse(rawItem);

    // بررسی زمان انقضا
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      storage.removeItem(normalizedKey);
      return null;
    }

    // بررسی انطباق نسخه داده
    if (expectedVersion && entry.version !== expectedVersion) {
      storage.removeItem(normalizedKey);
      return null;
    }

    // افزایش شمارنده دفعات استفاده
    entry.hits = (entry.hits || 0) + 1;
    storage.setItem(normalizedKey, JSON.stringify(entry));

    return entry.data;
  } catch {
    storage.removeItem(normalizedKey);
    return null;
  }
}

/**
 * بررسی اینکه آیا یک داده معتبر در کش وجود دارد یا خیر
 */
export function hasValidCache(key: string, storageType: StorageType = 'memory'): boolean {
  const normalizedKey = normalizeCacheKey(key);
  if (storageType === 'memory') {
    return memoryCache.has(normalizedKey);
  }
  return getCacheItem(key, storageType) !== null;
}

/**
 * حذف یک آیتم مشخص از کش
 */
export function removeCacheItem(key: string, storageType?: StorageType): void {
  const normalizedKey = normalizeCacheKey(key);
  if (!storageType || storageType === 'memory') {
    memoryCache.delete(normalizedKey);
  }
  if (!storageType || storageType === 'local') {
    getWebStorage('local')?.removeItem(normalizedKey);
  }
  if (!storageType || storageType === 'session') {
    getWebStorage('session')?.removeItem(normalizedKey);
  }
}

/**
 * پاک‌سازی تمام کش‌های دارای یک پیشوند خاص
 */
export function clearCacheByPrefix(prefix: string, storageType?: StorageType): number {
  const normalizedPrefix = normalizeCacheKey(prefix);
  let totalDeleted = 0;

  if (!storageType || storageType === 'memory') {
    totalDeleted += memoryCache.deleteByPrefix(normalizedPrefix);
  }

  const checkStorage = (type: 'local' | 'session') => {
    const storage = getWebStorage(type);
    if (!storage) return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && key.startsWith(normalizedPrefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => {
      storage.removeItem(k);
      totalDeleted++;
    });
  };

  if (!storageType || storageType === 'local') checkStorage('local');
  if (!storageType || storageType === 'session') checkStorage('session');

  return totalDeleted;
}

/**
 * تخلیه کلیه داده‌های کش مربوط به این سامانه
 */
export function clearAllCache(storageType?: StorageType): void {
  if (!storageType || storageType === 'memory') {
    memoryCache.clear();
  }

  const cleanStorage = (type: 'local' | 'session') => {
    const storage = getWebStorage(type);
    if (!storage) return;
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && (key.startsWith(CACHE_KEY_PREFIX) || key.startsWith('enms_'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => storage.removeItem(k));
  };

  if (!storageType || storageType === 'local') cleanStorage('local');
  if (!storageType || storageType === 'session') cleanStorage('session');
}

/**
 * پاک‌سازی اختصاصی تمامی کلیدها و داده‌های سامانه مدیریت انرژی کیاسر
 * و همگام‌سازی مجدد با فایل‌های JSON
 */
export function clearEnmsAppCache(reload: boolean = false): void {
  // ۱. تخلیه کش رم
  memoryCache.clear();

  // ۲. پاک‌سازی کلیدهای شناخته‌شده در localStorage و sessionStorage
  const knownKeys = [
    'enms_organization_context_data',
    'enms_organization_version',
    'enms_energy_review_advanced_data',
    'enms_energy_review_version',
    'enms_fiscal_year_active',
  ];

  if (typeof window !== 'undefined') {
    try {
      // پاک‌سازی کلیدهای شناخته‌شده
      knownKeys.forEach((key) => {
        window.localStorage.removeItem(key);
        window.sessionStorage.removeItem(key);
      });

      // پاک‌سازی تمام کلیدهایی که با enms_ شروع می‌شوند
      const localKeysToRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith('enms_')) {
          localKeysToRemove.push(k);
        }
      }
      localKeysToRemove.forEach((k) => window.localStorage.removeItem(k));

      const sessionKeysToRemove: string[] = [];
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const k = window.sessionStorage.key(i);
        if (k && k.startsWith('enms_')) {
          sessionKeysToRemove.push(k);
        }
      }
      sessionKeysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
    } catch (e) {
      console.warn('عدم امکان دسترسی به Storage مرورگر جهت پاک‌سازی کش:', e);
    }

    // ۳. در صورت درخواست، رفرش صفحه جهت دریافت مستقیم از فایل‌های JSON
    if (reload) {
      window.location.reload();
    }
  }
}

/**
 * پاک‌سازی آیتم‌های تاریخ‌گذشته از WebStorage
 */
export function cleanExpiredStorageItems(storageType: 'local' | 'session'): number {
  const storage = getWebStorage(storageType);
  if (!storage) return 0;

  let cleaned = 0;
  const now = Date.now();
  const keysToRemove: string[] = [];

  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && (key.startsWith(CACHE_KEY_PREFIX) || key.startsWith('enms_'))) {
      try {
        const item = JSON.parse(storage.getItem(key) || '{}');
        if (item.expiresAt && now > item.expiresAt) {
          keysToRemove.push(key);
        }
      } catch {
        // اگر JSON نبود، دست نخورده باقی بماند
      }
    }
  }

  keysToRemove.forEach((k) => {
    storage.removeItem(k);
    cleaned++;
  });

  return cleaned;
}

/**
 * گزینه‌های درخواست واکشی هوشمند با کش
 */
export interface FetchWithCacheOptions extends RequestInit {
  cacheOptions?: CacheOptions;
  forceRefresh?: boolean; // در صورت true بودن، کش نادیده گرفته شده و درخواست مجدد ارسال می‌شود
  cacheKey?: string; // کلید دلخواه کش (در صورت عدم ارسال، خود url مبنا قرار می‌گیرد)
}

/**
 * واکشی داده با کش خودکار (JSON Fetch with Caching)
 *
 * @param url آدرس منبع داده یا فایل JSON
 * @param options گزینه‌های فچ و کش
 */
export async function fetchWithCache<T>(
  url: string,
  options?: FetchWithCacheOptions
): Promise<T> {
  const {
    cacheOptions = { ttlMs: DEFAULT_TTL_MS, storageType: 'memory' },
    forceRefresh = false,
    cacheKey = url,
    ...fetchInit
  } = options || {};

  const storageType = cacheOptions.storageType || 'memory';

  // ۱. بررسی وجود در کش معتبر در صورت عدم درخواست رفرش اجباری
  if (!forceRefresh) {
    const cachedData = getCacheItem<T>(cacheKey, storageType, cacheOptions.version);
    if (cachedData !== null) {
      return cachedData;
    }
  }

  // ۲. ارسال درخواست به شبکه / فایل سرور با محافظت در برابر پاسخ غیر JSON یا خطای شبکه
  try {
    const response = await fetch(url, fetchInit);
    if (!response.ok) {
      throw new Error(`خطا در واکشی داده از ${url}: وضعیت ${response.status} ${response.statusText}`);
    }

    const rawText = (await response.text()).trim();
    if (!rawText || rawText.startsWith('<') || rawText.includes('Rate exceeded')) {
      throw new Error(`پاسخ نامعتبر از سرور برای ${url}`);
    }

    const data = JSON.parse(rawText) as T;

    // ۳. ذخیره در کش
    setCacheItem<T>(cacheKey, data, cacheOptions);

    return data;
  } catch (err) {
    const fallbackCached = getCacheItem<T>(cacheKey, storageType, cacheOptions.version);
    if (fallbackCached !== null) {
      return fallbackCached;
    }
    throw err;
  }
}

/**
 * آمار وضعیت کش سامانه
 */
export function getOverallCacheStats(): CacheStats {
  const memStats = memoryCache.getStats();
  let storageCount = 0;

  const countFor = (type: 'local' | 'session') => {
    const storage = getWebStorage(type);
    if (!storage) return;
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k && (k.startsWith(CACHE_KEY_PREFIX) || k.startsWith('enms_'))) {
        storageCount++;
      }
    }
  };

  countFor('local');
  countFor('session');

  return {
    memoryEntriesCount: memStats.count,
    memoryEstimatedBytes: memStats.count * 512, // برآورد میانگین
    storageEntriesCount: storageCount,
    hitCount: memStats.hitCount,
    missCount: memStats.missCount,
  };
}
