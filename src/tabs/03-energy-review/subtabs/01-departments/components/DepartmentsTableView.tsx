import React from 'react';
import { Factory, Flame } from 'lucide-react';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';
import { TimeHorizonType } from './HorizonControlBar';

export interface DepartmentsTableViewProps {
  departmentsShare?: any[];
  flowData: any;
  periodMultiplier: number;
  timeHorizon: TimeHorizonType;
}

export const DepartmentsTableView: React.FC<DepartmentsTableViewProps> = ({
  departmentsShare = [],
  flowData,
  periodMultiplier,
  timeHorizon,
}) => {
  const dataSource = departmentsShare.length > 0 ? departmentsShare : flowData?.departmentFlows || [];

  return (
    <div className="enms-card animate-fadeIn" dir="rtl">
      <div className="enms-card-header flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
        <div>
          <h3 className="enms-card-title flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <span>ماتریس جامع ترازنامه و تفکیک حامل‌های انرژی به تفکیک ۵ دپارتمان</span>
          </h3>
          <p className="enms-card-subtitle text-xs text-[var(--color-text-muted)] mt-0.5">
            مقادیر براساس{' '}
            {timeHorizon === 'current_month'
              ? 'عملکرد ماهانه'
              : timeHorizon === 'design_capacity'
              ? 'ظرفیت اسمی'
              : 'سال مالی ۱۴۰۴-۱۴۰۵'}{' '}
            محاسبه گردیده‌اند
          </p>
        </div>
        <span className="enms-badge badge-warning">سال مالی کیاسر: ۱ دی تا ۳۰ آذر</span>
      </div>

      <div className="enms-table-container mt-4">
        <table className="enms-table text-xs">
          <thead>
            <tr>
              <th>دپارتمان فرآیندی</th>
              <th>مصرف برق (MWh)</th>
              <th>سهم از برق کل (%)</th>
              <th>گاز طبیعی (Nm³)</th>
              <th>سوخت مازوت (لیتر)</th>
              <th>سهم هوای فشرده (%)</th>
              <th>مجموع انرژی معادل (GJ)</th>
            </tr>
          </thead>
          <tbody>
            {dataSource.map((dept: any, idx: number) => {
              const elec = Math.round((dept.electricityMwh || 0) * periodMultiplier);
              const gas = Math.round((dept.naturalGasNm3 || 0) * periodMultiplier);
              const oil = Math.round((dept.fuelOilLiter || 0) * periodMultiplier);
              const gj = Math.round((dept.totalGj || dept.energyShareGj || 0) * periodMultiplier);
              const elecPct = dept.electricityPct || dept.electricSharePct || 0;

              return (
                <tr key={idx}>
                  <td className="font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                    <Factory className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
                    <span>{dept.department || dept.name}</span>
                  </td>
                  <td className="font-mono text-[var(--color-primary)] font-bold">
                    {toPersianDigits(formatPersianNumber(elec))}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-[var(--color-border)] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{ width: `${Math.min(elecPct * 2, 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-[var(--color-text-secondary)]">
                        {toPersianDigits(elecPct)}٪
                      </span>
                    </div>
                  </td>
                  <td className="font-mono text-cyan-500">
                    {gas > 0 ? toPersianDigits(formatPersianNumber(gas)) : '-'}
                  </td>
                  <td className="font-mono text-amber-500">
                    {oil > 0 ? toPersianDigits(formatPersianNumber(oil)) : '-'}
                  </td>
                  <td className="font-mono text-sky-500">
                    {toPersianDigits(dept.compressedAirPct || 0)}٪
                  </td>
                  <td className="font-mono font-bold text-purple-500">
                    {toPersianDigits(formatPersianNumber(gj))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DepartmentsTableView;
