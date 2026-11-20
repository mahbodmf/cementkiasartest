import React, { useState } from 'react';
import { useMultiMonthData } from './hooks/useMultiMonthData';
import {
  DEFAULT_TARGETS,
  OperationsTargets,
  ModalType,
} from './types';
import {
  SummaryCardsGrid,
  TrendDrilldownModal,
  TargetsSettingsModal,
} from './components';

export interface OperationsSummaryCardsProps {
  summary?: any;
  dailyRecords?: any[];
  externalPeriodKey?: string;
  onTargetsChange?: (newTargets: OperationsTargets) => void;
}

export const OperationsSummaryCards: React.FC<OperationsSummaryCardsProps> = ({
  summary: propSummary,
  dailyRecords: propDailyRecords,
  externalPeriodKey,
  onTargetsChange,
}) => {
  // ۱. مدیریت اهداف پذیرش با LocalStorage
  const [targets, setTargets] = useState<OperationsTargets>(() => {
    try {
      const saved = localStorage.getItem('cement_operations_targets');
      return saved ? JSON.parse(saved) : DEFAULT_TARGETS;
    } catch {
      return DEFAULT_TARGETS;
    }
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  // ۲. هوک واکشی داده‌های چندماهه، فیلترها و تجمیع (دقیقاً مطابق قرارداد پروژه شما)
  const {
    availableMonthKeys,
    startPeriod,
    setStartPeriod,
    endPeriod,
    setEndPeriod,
    quickFilter,
    handleQuickFilter,
    multiMonthDailyRecords,
    effectiveSummary,
    handleExportModalExcel,
  } = useMultiMonthData({
    propSummary,
    propDailyRecords,
    externalPeriodKey,
    targets,
  });

  // ۳. اعمال و ذخیره اهداف جدید
  const handleSaveTargets = (newTargets: OperationsTargets) => {
    setTargets(newTargets);
    localStorage.setItem('cement_operations_targets', JSON.stringify(newTargets));
    if (onTargetsChange) onTargetsChange(newTargets);
    setIsSettingsOpen(false);
  };

  const handleResetTargets = () => {
    setTargets(DEFAULT_TARGETS);
    localStorage.setItem('cement_operations_targets', JSON.stringify(DEFAULT_TARGETS));
    if (onTargetsChange) onTargetsChange(DEFAULT_TARGETS);
    setIsSettingsOpen(false);
  };

  return (
    <>
      {/* کارت‌های ۴گانه شاخص‌ها در بالای صفحه */}
      <SummaryCardsGrid
        summary={effectiveSummary}
        targets={targets}
        onCardClick={(type) => setActiveModal(type)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* مودال منعطف پایش روند (با پشتیبانی از زوم، تغییر اندازه پویا و نمای ماتریس ۴تایی) */}
      <TrendDrilldownModal
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        targets={targets}
        multiMonthDailyRecords={multiMonthDailyRecords}
        startPeriod={startPeriod}
        endPeriod={endPeriod}
        quickFilter={quickFilter}
        availableMonthKeys={availableMonthKeys}
        onQuickFilterChange={handleQuickFilter}
        onStartPeriodChange={(val) => {
          setStartPeriod(val);
          handleQuickFilter('all');
        }}
        onEndPeriodChange={(val) => {
          setEndPeriod(val);
          handleQuickFilter('all');
        }}
        onExportExcel={handleExportModalExcel}
        onModalTypeChange={(type) => setActiveModal(type)}
      />

      {/* مودال تنظیم و ذخیره‌سازی شاخص‌ها */}
      <TargetsSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        targets={targets}
        onSave={handleSaveTargets}
        onReset={handleResetTargets}
      />
    </>
  );
};

export default OperationsSummaryCards;