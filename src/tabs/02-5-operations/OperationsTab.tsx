import React from 'react';
import { OperationsSubTabId } from '../../types';

// ۱. ایمپورت ۳ ساب‌تب قبلی
import ProductionManagementView from './subtabs/01-production-management/ProductionManagementView';
import StoppagesAnalysisView from './subtabs/02-stoppages-analysis/StoppagesAnalysisView';
import DispatchInventoryView from './subtabs/03-dispatch-inventory/DispatchInventoryView';

// ۲. ایمپورت ساب‌تب چهارم تحلیلی و OEE شما
import OperationsAnalyticsDashboard from './subtabs/04-operations-analytics/OperationsAnalyticsDashboard';

export interface OperationsTabProps {
  activeSubTab: OperationsSubTabId | string;
  onSubTabChange?: (subTab: OperationsSubTabId) => void;
  externalPeriodKey?: string;
}

export const OperationsTab: React.FC<OperationsTabProps> = ({
  activeSubTab = 'production',
  externalPeriodKey,
}) => {
  return (
    <div className="w-full flex flex-col p-4 space-y-4 animate-fadeIn" dir="rtl">
      {/* ساب‌تب ۱: تولید */}
      {(activeSubTab === 'production' || activeSubTab === '01') && (
        <ProductionManagementView externalPeriodKey={externalPeriodKey} />
      )}

      {/* ساب‌تب ۲: توقفات */}
      {(activeSubTab === 'stops' || activeSubTab === '02') && (
        <StoppagesAnalysisView externalPeriodKey={externalPeriodKey} />
      )}

      {/* ساب‌تب ۳: دیسپاچ */}
      {(activeSubTab === 'dispatch' || activeSubTab === '03') && (
        <DispatchInventoryView externalPeriodKey={externalPeriodKey} />
      )}

      {/* ساب‌تب ۴: تحلیل جامع و هوش عملیات */}
      {(activeSubTab === 'analytics' || activeSubTab === 'intelligence' || activeSubTab === '04') && (
        <OperationsAnalyticsDashboard externalPeriodKey={externalPeriodKey} />
      )}
    </div>
  );
};

export default OperationsTab;