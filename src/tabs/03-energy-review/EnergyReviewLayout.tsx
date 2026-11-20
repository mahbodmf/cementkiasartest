import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  Save,
  RotateCcw,
  Edit3,
  Check,
  Flame,
  Zap,
  Wind,
  Layers,
} from 'lucide-react';
import {
  EnergyReviewSubTabId,
  EnergyReviewAdvancedData,
  DepartmentGroupWithEquipments,
  RelevantVariableItem,
} from '../../types';
import { toPersianDigits, formatPersianNumber } from '../../utils/persianUtils';

import { DepartmentsEquipmentView } from './subtabs/01-departments';
import { ProductionManagementView } from './subtabs/02-production-management';
import { EnergyIngestionView } from './subtabs/03-energy-ingestion';
import { StoppagesAnalysisView } from './subtabs/04-stoppages-analysis';
import { DispatchInventoryView } from './subtabs/05-dispatch-inventory';
import { VariablesView } from './subtabs/06-variables';
import { EfficiencyOpportunitiesView } from './subtabs/07-efficiency-opportunities';
import { CompetencePersonsView } from './subtabs/08-competence-persons';

interface EnergyReviewLayoutProps {
  activeSubSection?: EnergyReviewSubTabId;
  activeSubTab?: EnergyReviewSubTabId;
}

const STORAGE_KEY = 'enms_energy_review_advanced_data';
const DATA_VERSION_KEY = 'enms_energy_review_version';
const CURRENT_DATA_VERSION = 'v5_relevant_variables_iso50001';

const DATA_URLS = {
  advanced: '/data/03-energy-review/energy-review-advanced.json',
  departmentsEquipment: '/data/03-energy-review/departments-equipment.json',
  seuInventory: '/data/03-energy-review/seu-inventory.json',
  actionPlans: '/data/03-energy-review/action-plans.json',
  relevantVariables: '/data/03-energy-review/relevant-variables.json',
};

const safeFetchJson = async <T,>(url: string, fallback: T): Promise<T> => {
  try {
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('json') && !contentType.includes('text/plain')) {
      return fallback;
    }
    const text = await res.text();
    if (!text || text.trim().startsWith('<') || text.includes('Rate exceeded')) {
      return fallback;
    }
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
};

export const EnergyReviewLayout: React.FC<EnergyReviewLayoutProps> = ({
  activeSubSection,
  activeSubTab: externalSubTab,
}) => {
  // دریافت مستقیم ساب‌تب فعال از نوار کناری سایدبار
  const currentSubTab: EnergyReviewSubTabId = activeSubSection || externalSubTab || 'departments';

  const [data, setData] = useState<EnergyReviewAdvancedData | null>(null);
  const [departmentsEquipment, setDepartmentsEquipment] = useState<DepartmentGroupWithEquipments[]>([]);
  const [seuInventory, setSeuInventory] = useState<any[]>([]);
  const [actionPlans, setActionPlans] = useState<any[]>([]);
  const [relevantVariables, setRelevantVariables] = useState<RelevantVariableItem[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAllEnergyReviewData = async () => {
      try {
        const savedVersion = localStorage.getItem(DATA_VERSION_KEY);
        const stored = localStorage.getItem(STORAGE_KEY);

        if (savedVersion === CURRENT_DATA_VERSION && stored) {
          try {
            const parsed: EnergyReviewAdvancedData = JSON.parse(stored);
            if (parsed && (parsed.keyPersonnel || parsed.energyBreakdown || parsed.productionEnergyForecast)) {
              if (isMounted) {
                setData(parsed);
                if (parsed.relevantVariables && Array.isArray(parsed.relevantVariables)) {
                  setRelevantVariables(parsed.relevantVariables);
                }
              }
            }
          } catch (e) {
            console.warn('Could not parse stored data:', e);
          }
        }

        // واکشی موازی و کاملاً امن تمامی فایل‌های JSON با safeFetchJson
        const [advData, deptsData, seusData, actsData, varsData] = await Promise.all([
          safeFetchJson<EnergyReviewAdvancedData | null>(DATA_URLS.advanced, null),
          safeFetchJson<DepartmentGroupWithEquipments[]>(DATA_URLS.departmentsEquipment, []),
          safeFetchJson<any>(DATA_URLS.seuInventory, []),
          safeFetchJson<any>(DATA_URLS.actionPlans, []),
          safeFetchJson<any>(DATA_URLS.relevantVariables, []),
        ]);

        if (isMounted) {
          if (advData) {
            setData((prev) => prev || advData);
          }
          if (Array.isArray(deptsData) && deptsData.length > 0) {
            setDepartmentsEquipment(deptsData);
          }
          if (seusData) {
            setSeuInventory(Array.isArray(seusData) ? seusData : seusData.seus || []);
          }
          if (actsData) {
            setActionPlans(Array.isArray(actsData) ? actsData : actsData.actionPlans || []);
          }
          if (varsData) {
            const varsList = Array.isArray(varsData) ? varsData : varsData.variables || [];
            if (varsList.length > 0) {
              setRelevantVariables((prev) => (prev.length > 0 ? prev : varsList));
            }
          }
        }
      } catch (err) {
        console.warn('Notice while loading energy review data:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAllEnergyReviewData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ذخیره اطلاعات
  const handleSave = () => {
    if (!data) return;
    try {
      const payload: EnergyReviewAdvancedData = {
        ...data,
        relevantVariables,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload, null, 2));
      localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
      setData(payload);
      setIsEditing(false);
      setSaveToast('تغییرات بازنگری انرژی و متغیرها با موفقیت در حافظه مرورگر ذخیره شد.');
      setTimeout(() => setSaveToast(null), 3500);
    } catch {
      alert('خطا در ذخیره داده‌ها.');
    }
  };

  // بازنشانی داده‌ها
  const handleReset = async () => {
    if (!confirm('آیا از بازنشانی داده‌های بازنگری انرژی به مقادیر اولیه فایل‌های JSON اطمینان دارید؟')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DATA_VERSION_KEY);
    setIsEditing(false);
    setIsLoading(true);
    try {
      const [initialAdv, initialVars] = await Promise.all([
        safeFetchJson<EnergyReviewAdvancedData | null>(DATA_URLS.advanced, null),
        safeFetchJson<any>(DATA_URLS.relevantVariables, []),
      ]);

      if (initialAdv) {
        setData(initialAdv);
      }
      if (initialVars) {
        const varsList = Array.isArray(initialVars) ? initialVars : initialVars.variables || [];
        setRelevantVariables(varsList);
      }

      setSaveToast('اطلاعات به نسخه پیش‌فرض فایل‌های سرور بازنشانی شد.');
      setTimeout(() => setSaveToast(null), 3500);
    } catch (e) {
      console.error('Failed to reset:', e);
    } finally {
      setIsLoading(false);
    }
  };

  // خروجی فایل JSON
  const handleExportJson = () => {
    if (!data) return;
    const exportPayload = {
      ...data,
      relevantVariables,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `energy-review-advanced-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  // بارگذاری فایل سفارشی JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);
        if (parsed && (parsed.keyPersonnel || parsed.energyBreakdown || parsed.relevantVariables)) {
          setData(parsed);
          if (parsed.relevantVariables && Array.isArray(parsed.relevantVariables)) {
            setRelevantVariables(parsed.relevantVariables);
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed, null, 2));
          localStorage.setItem(DATA_VERSION_KEY, CURRENT_DATA_VERSION);
          setSaveToast('فایل JSON بازنگری انرژی با موفقیت بارگذاری و اعمال شد.');
          setTimeout(() => setSaveToast(null), 4000);
        } else {
          alert('فرمت فایل انتخابی معتبر نیست.');
        }
      } catch {
        alert('خطا در خواندن فایل JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const breakdownSummary = data?.energyBreakdown?.summary;
  const annualForecast = data?.productionEnergyForecast?.annualSummary;

  if (isLoading) {
    return (
      <div className="tab-viewport flex items-center justify-center p-12">
        <div className="text-[var(--color-text-muted)] text-sm animate-pulse flex items-center gap-2">
          <Zap className="w-5 h-5 text-[var(--color-primary)] animate-bounce" />
          <span>در حال بارگذاری اطلاعات جامع بازنگری انرژی...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6" dir="rtl">
      {/* سربرگ نوار کنترل و کارت‌های کلیدی موازنه انرژی */}
      <div className="enms-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="enms-badge badge-warning font-semibold">بند ۶.۳ استاندارد ISO 50001:2018</span>
              <span className="text-xs text-[var(--color-text-muted)] font-mono">Energy Review & Significant Energy Uses (SEUs)</span>
            </div>
            <h1 className="text-lg font-bold text-[var(--color-text-primary)] mt-1">
              بازنگری جامع انرژی، موازنه مصارف و شناسنامه بارزترین تجهیزات کارخانه سیمان کیاسر
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              تحلیل گذشته‌نگر و حال حاضر مصرف انرژی، موازنه حامل‌ها، شناسایی متغیرهای مرتبط و فرصت‌های بهبود عملکرد انرژی
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportJson}
              accept=".json"
              className="hidden"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="enms-button enms-button-secondary text-xs"
              title="بارگذاری فایل JSON"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>بارگذاری JSON</span>
            </button>

            <button
              onClick={handleExportJson}
              className="enms-button enms-button-secondary text-xs"
              title="دریافت فایل پشتیبان JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>خروجی JSON</span>
            </button>

            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="enms-button enms-button-primary text-xs"
                  title="ذخیره تغییرات"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>ذخیره تغییرات</span>
                </button>

                <button
                  onClick={handleReset}
                  className="enms-button enms-button-outline text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  title="بازنشانی"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>بازنشانی</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="enms-button enms-button-secondary text-xs text-[var(--color-primary)] border-[var(--color-primary-border)] hover:border-[var(--color-primary)]"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>حالت ویرایش</span>
              </button>
            )}
          </div>
        </div>

        {saveToast && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--color-primary-bg)] border border-[var(--color-primary-border)] text-xs text-[var(--color-primary)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
              <span>{saveToast}</span>
            </div>
            <button onClick={() => setSaveToast(null)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] text-xs">
              بستن
            </button>
          </div>
        )}

        {/* کارت‌های شاخص‌های کلیدی موازنه انرژی */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-[var(--color-border)]">
          <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted)]">کل مصرف انرژی حرارتی</span>
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-lg font-bold font-mono text-amber-500 mt-1">
              {toPersianDigits(formatPersianNumber(breakdownSummary?.totalThermalEnergyGj || 1820000))}
              <span className="text-[10px] text-[var(--color-text-muted)] font-sans mr-1">GJ</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">معادل گاز طبیعی و مازوت</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted)]">کل مصرف برق سالانه</span>
              <Zap className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
            <div className="text-lg font-bold font-mono text-[var(--color-primary)] mt-1">
              {toPersianDigits(formatPersianNumber(breakdownSummary?.totalElectricalEnergyMwh || 65000))}
              <span className="text-[10px] text-[var(--color-text-muted)] font-sans mr-1">MWh</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">پست ۶۳/۶.۳ کیلوولت کارخانه</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted)]">سهم گاز طبیعی پخت</span>
              <Flame className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-lg font-bold font-mono text-cyan-500 mt-1">
              {toPersianDigits(formatPersianNumber((breakdownSummary?.totalFuelGasNm3 || 48500000) / 1000000, 1))}
              <span className="text-[10px] text-[var(--color-text-muted)] font-sans mr-1">میلیون Nm³</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">ایستگاه تقلیل فشار CGS</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted)]">هوای فشرده تولیدی</span>
              <Wind className="w-4 h-4 text-sky-500" />
            </div>
            <div className="text-lg font-bold font-mono text-sky-500 mt-1">
              {toPersianDigits(formatPersianNumber((breakdownSummary?.totalCompressedAirNm3 || 18500000) / 1000000, 1))}
              <span className="text-[10px] text-[var(--color-text-muted)] font-sans mr-1">میلیون Nm³</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">فشار کاری ۷.۵ بار</div>
          </div>

          <div className="p-2.5 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[var(--color-text-muted)]">هدف تولید کلینکر</span>
              <Layers className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-lg font-bold font-mono text-purple-500 mt-1">
              {toPersianDigits(formatPersianNumber(annualForecast?.plannedClinkerTon || 680000))}
              <span className="text-[10px] text-[var(--color-text-muted)] font-sans mr-1">تن</span>
            </div>
            <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">سیمان: {toPersianDigits(formatPersianNumber(annualForecast?.plannedCementTon || 720000))} تن</div>
          </div>
        </div>
      </div>

      {/* رندر مستقیم ساب‌تب‌های ۸ گانه بر مبنای کلیک نوار سایدبار */}
      <div className="transition-all duration-200">
        {currentSubTab === 'departments' && (
          <DepartmentsEquipmentView
            departmentsShare={data?.energyBreakdown?.departmentsShare}
            departmentsEquipment={departmentsEquipment}
            isEditing={isEditing}
          />
        )}

        {(currentSubTab === 'production-management' || currentSubTab === 'production') && (
          <ProductionManagementView />
        )}

        {(currentSubTab === 'energy-ingestion' || currentSubTab === 'seu') && (
          <EnergyIngestionView />
        )}

        {(currentSubTab === 'stoppages-analysis' || currentSubTab === 'stoppages') && (
          <StoppagesAnalysisView />
        )}

        {(currentSubTab === 'dispatch-inventory' || currentSubTab === 'dispatch') && (
          <DispatchInventoryView />
        )}

        {currentSubTab === 'variables' && (
          <VariablesView
            variables={relevantVariables}
            onChange={(updated) => setRelevantVariables(updated)}
            isEditing={isEditing}
          />
        )}

        {(currentSubTab === 'efficiency-opportunities' || currentSubTab === 'efficiency' || currentSubTab === 'actions') && (
          <EfficiencyOpportunitiesView
            equipmentEfficiency={data?.equipmentEfficiency}
            actionPlans={actionPlans}
            onEquipmentChange={(updated: any) => {
              if (data) setData({ ...data, equipmentEfficiency: updated });
            }}
            onActionPlansChange={(updated: any) => setActionPlans(updated)}
            isEditing={isEditing}
          />
        )}

        {(currentSubTab === 'competence-persons' || currentSubTab === 'personnel') && (
          <CompetencePersonsView
            keyPersonnel={data?.keyPersonnel}
            onChange={(updated) => {
              if (data) setData({ ...data, keyPersonnel: updated });
            }}
            isEditing={isEditing}
          />
        )}
      </div>
    </div>
  );
};

export default EnergyReviewLayout;