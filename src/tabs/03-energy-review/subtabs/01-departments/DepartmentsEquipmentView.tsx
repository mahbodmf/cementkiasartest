import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  DepartmentGroupWithEquipments,
  EnergyBreakdownData,
} from '../../../../types';
import { getFiscalYearInfo, DEFAULT_FISCAL_YEAR } from '../../../../utils/fiscalYearUtils';
import {
  HorizonControlBar,
  DepartmentsFlowView,
  DepartmentsTableView,
  EquipmentInventorySection,
  EnergyCarrierAnalytics,
} from './components';
import { TimeHorizonType, CustomDateRange } from './components/HorizonControlBar';

export interface DepartmentsEquipmentViewProps {
  departmentsShare?: EnergyBreakdownData['departmentsShare'];
  departmentsEquipment: DepartmentGroupWithEquipments[];
  isEditing?: boolean;
}

export const DepartmentsEquipmentView: React.FC<DepartmentsEquipmentViewProps> = ({
  departmentsShare = [],
  departmentsEquipment = [],
  isEditing = false,
}) => {
  const [timeHorizon, setTimeHorizon] = useState<TimeHorizonType>('fiscal_year');
  const [customRange, setCustomRange] = useState<CustomDateRange | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'flow' | 'table'>('flow');
  const [activeFlowDeptId, setActiveFlowDeptId] = useState<string>('kiln');

  const [flowData, setFlowData] = useState<any>(null);
  const [customEquipments, setCustomEquipments] = useState<DepartmentGroupWithEquipments[] | null>(null);

  // ۱. بارگذاری داده‌های پایه ترازنامه از فایل JSON مرجع
  useEffect(() => {
    let isMounted = true;
    const loadFlow = async () => {
      try {
        const res = await fetch('/data/03-energy-review/energy-flow-data.json');
        if (!res.ok) return;
        const text = await res.text();
        if (!text || text.trim().startsWith('<') || text.includes('Rate exceeded')) return;
        const json = JSON.parse(text);
        if (isMounted) setFlowData(json);
      } catch {
        // Ignore rate limit or parse error
      }
    };
    loadFlow();
    return () => {
      isMounted = false;
    };
  }, []);

  const fiscalInfo = useMemo(() => getFiscalYearInfo(DEFAULT_FISCAL_YEAR), []);

  // ۲. محاسبه ضریب مقیاس بر اساس تمامی انواع افق زمانی و تقویم دلخواه
  const periodMultiplier = useMemo(() => {
    switch (timeHorizon) {
      case 'current_month':
        return 1 / 12;
      case 'design_capacity':
        return 1.05;
      case 'q1':
      case 'q2':
      case 'q3':
      case 'q4':
        return 0.25;
      case 'h1':
      case 'h2':
        return 0.5;
      case 'custom_range':
        return customRange ? customRange.daysCount / 365 : 1.0;
      case 'fiscal_year':
      default:
        return 1.0;
    }
  }, [timeHorizon, customRange]);

  // ۳. موتور موازنه دینامیک: محاسبه مجدد کل انرژی و سهم‌ها به محض تغییر، افزودن یا حذف دپارتمان‌ها
  const handleUpdateDepartments = (updatedFlows: any[]) => {
    let totalElecMwh = 0;
    let totalGasNm3 = 0;
    let totalFuelOilLiter = 0;
    let totalGj = 0;

    updatedFlows.forEach((d) => {
      totalElecMwh += d.electricityMwh || 0;
      totalGasNm3 += d.naturalGasNm3 || 0;
      totalFuelOilLiter += d.fuelOilLiter || 0;
      totalGj += d.energyShareGj || 0;
    });

    // به‌روزرسانی سهم درصدی هر واحد بر اساس جمع کل جدید
    const balancedFlows = updatedFlows.map((d) => ({
      ...d,
      energySharePct: totalGj > 0 ? Number(((d.energyShareGj / totalGj) * 100).toFixed(1)) : 0,
      electricSharePct: totalElecMwh > 0 ? Number(((d.electricityMwh / totalElecMwh) * 100).toFixed(2)) : 0,
    }));

    setFlowData((prev: any) => ({
      ...prev,
      plantTotalFlow: {
        ...prev?.plantTotalFlow,
        electricityMwh: totalElecMwh,
        naturalGasNm3: totalGasNm3,
        fuelOilLiter: totalFuelOilLiter,
        totalEquivalentGj: totalGj,
      },
      departmentFlows: balancedFlows,
    }));
  };

  // ۴. همگام‌سازی تجهیزات دپارتمان‌های جدید یا ویرایش‌شده با شناسنامه تجهیزات پایین صفحه
  const baseEquipments = useMemo(() => {
    if (customEquipments) return customEquipments;
    if (!flowData?.departmentFlows) return departmentsEquipment;

    return flowData.departmentFlows.map((d: any) => {
      const existingGroup = departmentsEquipment.find((eg) => eg.id === d.id);
      return {
        id: d.id,
        name: d.name,
        code: d.code,
        seuStatus: d.energySharePct > 10 ? 'دپارتمان بارز انرژی (SEU)' : 'دپارتمان غیر بارز',
        description: d.category || `واحد فرآیندی ${d.name}`,
        installedPowerKw: d.installedElectricalPowerKw || d.electricityMwh || 0,
        installedThermalGjH: d.installedThermalGjH || 0,
        secBenchmark: d.secElectricActual || 0,
        secUnit: 'kWh/ton',
        secThermalBenchmark: d.secThermalActual || 0,
        secThermalUnit: 'kcal/kg.cl',
        sharePct: d.energySharePct || 0,
        equipments: (d.keyEquipments && d.keyEquipments.length > 0)
          ? d.keyEquipments.map((eq: any) => ({
              tag: eq.tag || 'TAG-NEW',
              name: eq.name,
              type: eq.type || 'تجهیز فرآیندی',
              powerKw: eq.powerKw || 0,
              voltage: eq.voltage || '400 V',
              capacity: eq.capacity || '-',
              isSeu: Boolean(eq.isSeu),
              criticality: eq.criticality || 'عادی',
              energyType: eq.thermalCapacityGjH ? 'حرارتی' : 'الکتریکی',
            }))
          : existingGroup?.equipments || [],
      };
    });
  }, [flowData, departmentsEquipment, customEquipments]);

  // ۵. تابع همگام‌ساز بلادرنگ مصارف بارز انرژی (SEU Sync Engine)
  const handleSyncSeuList = useCallback((updatedGroups: DepartmentGroupWithEquipments[]) => {
    // الف: ذخیره در استیت محلی کامپوننت
    setCustomEquipments(updatedGroups);

    // ب: استخراج جامع تمام تجهیزات شناسایی‌شده به عنوان مصرف بارز (SEU)
    const allSeuEquipments = updatedGroups.flatMap((group) => {
      const isDeptSeu = group.seuStatus?.includes('بارز انرژی');
      return group.equipments
        .filter((eq) => eq.isSeu || isDeptSeu)
        .map((eq) => ({
          id: `seu_${eq.tag.replace(/[^a-zA-Z0-9]/g, '_')}`,
          tag: eq.tag,
          name: eq.name,
          departmentId: group.id,
          departmentName: group.name,
          departmentCode: group.code,
          powerKw: eq.powerKw,
          voltage: eq.voltage,
          energyType: eq.energyType || 'الکتریکی (برق)',
          criticality: eq.criticality || 'بحرانی',
          isSeu: true,
          selectionCriteria: eq.isSeu
            ? 'مصرف بالای انرژی و توان الکتریکی بحرانی'
            : 'استقرار در دپارتمان بارز فرآیندی',
          syncTimestamp: Date.now(),
        }));
    });

    // ج: مخابره به حافظه مشترک و انتشار ایونت اختصاصی در سراسر نرم‌افزار
    try {
      localStorage.setItem('enms_synced_seus', JSON.stringify(allSeuEquipments));
      window.dispatchEvent(new CustomEvent('enms_seu_updated', { detail: allSeuEquipments }));
    } catch (e) {
      console.warn('عدم موفقیت در ذخیره سازی رویداد SEU:', e);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* ۱. نوار فرماندهی موازنه، افق زمانی و ابزارهای اکسپورت/ایمپورت */}
      <HorizonControlBar
        timeHorizon={timeHorizon}
        onTimeHorizonChange={(horizon, range) => {
          setTimeHorizon(horizon);
          if (range) setCustomRange(range);
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        fiscalPeriodTitle={fiscalInfo.persianTitle}
        flowData={flowData}
        onImportData={(newData) => setFlowData(newData)}
        activeCustomRange={customRange}
      />

      {/* ۲. تحلیل گرافیکی سبد حامل‌ها (دونات چارت و نمودارهای میله‌ای مقایسه‌ای) */}
      <EnergyCarrierAnalytics
        flowData={flowData}
        periodMultiplier={periodMultiplier}
      />

      {/* ۳. الف: جریان درختی با امکان ویرایش، تکثیر و ساخت دپارتمان‌های جدید */}
      {viewMode === 'flow' && (
        <DepartmentsFlowView
          flowData={flowData}
          periodMultiplier={periodMultiplier}
          timeHorizon={timeHorizon}
          activeFlowDeptId={activeFlowDeptId}
          onSelectDept={setActiveFlowDeptId}
          onUpdateDepartments={handleUpdateDepartments}
        />
      )}

      {/* ۳. ب: ماتریس جدولی ترازنامه سنتی ۵ دپارتمان */}
      {viewMode === 'table' && (
        <DepartmentsTableView
          departmentsShare={departmentsShare}
          flowData={flowData}
          periodMultiplier={periodMultiplier}
          timeHorizon={timeHorizon}
        />
      )}

      {/* ۴. سیاهه تفصیلی و شناسنامه تجهیزات متصل به واحدهای فرآیندی با اتصال به ساب‌تب SEU */}
      <EquipmentInventorySection
        departmentsEquipment={baseEquipments}
        isEditing={isEditing}
        onUpdateInventory={handleSyncSeuList}
      />
    </div>
  );
};

export default DepartmentsEquipmentView;