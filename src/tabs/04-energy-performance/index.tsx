import React, { useEffect } from 'react';
import { LineChart, Zap, Factory, Database, Gauge } from 'lucide-react';
import { MonitoringSubTabId, DatasetId } from '../../types';
import { useData } from '../../context/DataContext';
import { CusumDeviationsSubTab } from './subtabs/cusum-deviations';
import { ElectricalBreakdownSubTab } from './subtabs/electrical-breakdown';
import { OperationsDowntimeSubTab } from './subtabs/operations-downtime';
import { InventoryDispatchSubTab } from './subtabs/inventory-dispatch';
import { EnpiDashboardView } from './subtabs/enpis/EnpiDashboardView';

interface EnergyPerformanceCoordinatorProps {
  activeSubTab: MonitoringSubTabId;
  onSubTabChange: (subTab: MonitoringSubTabId) => void;
}

export const EnergyPerformanceCoordinator: React.FC<EnergyPerformanceCoordinatorProps> = ({
  activeSubTab,
  onSubTabChange,
}) => {
  const { loadDataset, loadMultipleDatasets, isDatasetLoading } = useData();

  // نگاشت هر زیرشاخه به دیتاست‌های وابسته به منظور واکشی تنبل (Lazy Load on Demand)
  useEffect(() => {
    switch (activeSubTab) {
      case 'cusum':
      case 'baseline':
        loadDataset('enpi-performance');
        break;
      case 'electrical':
        loadDataset('electrical-energy');
        break;
      case 'operations':
        loadDataset('production-operations');
        break;
      case 'inventory':
        loadMultipleDatasets(['dispatch-sales', 'inventory-silos']);
        break;
      case 'enpis':
        break;
    }
  }, [activeSubTab, loadDataset, loadMultipleDatasets]);

  const subTabs: {
    id: MonitoringSubTabId;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    datasetId?: DatasetId;
  }[] = [
    {
      id: 'cusum',
      title: 'تحلیل انحرافات و CUSUM',
      description: 'پایش تجمعی انحرافات مصرف ویژه برق و حرارت',
      icon: LineChart,
      datasetId: 'enpi-performance',
    },
    {
      id: 'enpis',
      title: 'شاخص‌های عملکرد انرژی (EnPIs)',
      description: 'پایش SEC دپارتمان‌ها در برابر اهداف مرحله اول و مدل رگرسیونی سازمان',
      icon: Gauge,
    },
    {
      id: 'electrical',
      title: 'تفکیک مصارف برق دپارتمان‌ها',
      description: 'سهم ترانس‌ها، الکتروموتورها و بار واحدهای فرایندی',
      icon: Zap,
      datasetId: 'electrical-energy',
    },
    {
      id: 'operations',
      title: 'بهره‌برداری و توقفات اضطراری',
      description: 'ساعات کارکرد، نرخ آمادگی و علل توقفات خطوط',
      icon: Factory,
      datasetId: 'production-operations',
    },
    {
      id: 'inventory',
      title: 'سیلوها و تحویل سیمان',
      description: 'سطح موجودی کلینکر، مواد خام و بارگیری روزانه',
      icon: Database,
      datasetId: 'inventory-silos',
    },
  ];

  const normalizedSubTab: MonitoringSubTabId =
    activeSubTab === 'baseline' ? 'cusum' : activeSubTab;
  const currentTabDef = subTabs.find((t) => t.id === normalizedSubTab) || subTabs[0];
  const isLoading = currentTabDef.datasetId ? isDatasetLoading(currentTabDef.datasetId) : false;

  return (
    <div className="flex flex-col gap-6">
      {/* سربرگ بخش پایش بند ۹.۱ استاندارد ISO 50001 با تب‌های قرصی */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="enms-badge badge-success font-mono">بند ۹.۱ استاندارد ISO 50001:2018</span>
            <span className="text-xs text-[var(--color-text-muted)] font-medium">پایش، اندازه‌گیری، تحلیل و ارزیابی</span>
          </div>
          <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] mt-1">
            پایش جامع عملکرد انرژی و بهره‌برداری کارخانه سیمان کیاسر
          </h2>
        </div>

        {/* لیست گزینه‌های زیرشاخه به صورت تب‌های ناوبری */}
        <div className="enms-tab-pills" role="tablist">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = normalizedSubTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onSubTabChange(tab.id)}
                className={`enms-tab-pill ${isActive ? 'active' : ''}`}
                title={tab.description}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ناحیه رندر محتوای زیرشاخه فعال */}
      {isLoading ? (
        <div className="enms-card p-12 flex flex-col items-center justify-center gap-3 min-h-[300px]">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
          <p className="text-sm text-[var(--color-text-primary)] font-semibold">
            در حال بارگذاری ماژولار داده‌های {currentTabDef.title}...
          </p>
          {currentTabDef.datasetId && (
            <span className="text-xs text-[var(--color-text-muted)] font-mono">
              واکشی مستقیم از public/data/{currentTabDef.datasetId}.json
            </span>
          )}
        </div>
      ) : (
        <>
          {normalizedSubTab === 'cusum' && <CusumDeviationsSubTab />}
          {normalizedSubTab === 'enpis' && <EnpiDashboardView />}
          {normalizedSubTab === 'electrical' && <ElectricalBreakdownSubTab />}
          {normalizedSubTab === 'operations' && <OperationsDowntimeSubTab />}
          {normalizedSubTab === 'inventory' && <InventoryDispatchSubTab />}
        </>
      )}
    </div>
  );
};
export const EnergyPerformance = EnergyPerformanceCoordinator;
export default EnergyPerformanceCoordinator;
