import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Truck, Database, PackageCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { DispatchSales, InventorySilos } from '../../../../types';
import { useData } from '../../../../context/DataContext';
import { useTheme } from '../../../../context/ThemeContext';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';
import { useBaselinesConfig } from '../../../../services/configService';

export const InventoryDispatchSubTab: React.FC = () => {
  const { getFilteredData } = useData();
  const { isDark } = useTheme();
  const baselinesConfig = useBaselinesConfig();

  const dispatchData = getFilteredData<DispatchSales>('dispatch-sales');
  const inventoryData = getFilteredData<InventorySilos>('inventory-silos');

  const latestSilo = inventoryData[inventoryData.length - 1] || {
    Raw_Meal_Silo_Pct: 78,
    Clinker_Main_Silo_Pct: 82,
    Cement_Silo_1_Pct: 65,
    Cement_Silo_2_Pct: 70,
    Clinker_Depot_Stock_ton: 32000,
  };

  const totalDispatch = dispatchData.reduce((acc, d) => acc + d.Dispatch_Total, 0);
  const avgDailyDispatch = totalDispatch / (dispatchData.length || 1);
  const dailyTarget = baselinesConfig.daily_dispatch_target_ton;

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="flex flex-col gap-6">
      {/* موجودی سیلوهای کارخانه */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* سیلوی مواد خام */}
        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">سیلوی مواد خام (Raw Meal)</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">{toPersianDigits(latestSilo.Raw_Meal_Silo_Pct)}</span>
            <span className="enms-kpi-unit">٪</span>
          </div>
          <div className="enms-progress-bar mt-2">
            <div className="enms-progress-fill fill-raw-meal" />
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">تغذیه کوره پخت</span>
            <span className="enms-badge badge-info">ظرفیت مطلوب</span>
          </div>
        </div>

        {/* سیلوی اصلی کلینکر */}
        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">سیلوی اصلی کلینکر</span>
            <Database className="w-4 h-4 text-amber-500" />
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">{toPersianDigits(latestSilo.Clinker_Main_Silo_Pct)}</span>
            <span className="enms-kpi-unit">٪</span>
          </div>
          <div className="enms-progress-bar mt-2">
            <div className="enms-progress-fill fill-clinker-silo" />
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">سیلوی بتنی</span>
            <span className="enms-badge badge-warning">تکمیل ۸۲٪</span>
          </div>
        </div>

        {/* دپوی باز کلینکر */}
        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">دپوی استراتژیک کلینکر</span>
            <Database className="w-4 h-4 text-[var(--color-primary)]" />
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">
              {toPersianDigits(formatPersianNumber(latestSilo.Clinker_Depot_Stock_ton))}
            </span>
            <span className="enms-kpi-unit">تن</span>
          </div>
          <div className="enms-progress-bar mt-2">
            <div className="enms-progress-fill fill-clinker-depot" />
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">حداقل ایمن: ۲۵,۰۰۰ تن</span>
            <span className="enms-badge badge-success">ذخیره ایمن</span>
          </div>
        </div>

        {/* سیلوی سیمان ۱ */}
        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">سیلوی سیمان ۱ (تیپ ۲)</span>
            <Database className="w-4 h-4 text-pink-500" />
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">{toPersianDigits(latestSilo.Cement_Silo_1_Pct)}</span>
            <span className="enms-kpi-unit">٪</span>
          </div>
          <div className="enms-progress-bar mt-2">
            <div className="enms-progress-fill fill-cement-1" />
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">آماده بارگیری فله</span>
            <span className="enms-badge badge-purple">رده ۴۲.۵</span>
          </div>
        </div>

        {/* سیلوی سیمان ۲ */}
        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">سیلوی سیمان ۲</span>
            <Database className="w-4 h-4 text-purple-500" />
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">{toPersianDigits(latestSilo.Cement_Silo_2_Pct)}</span>
            <span className="enms-kpi-unit">٪</span>
          </div>
          <div className="enms-progress-bar mt-2">
            <div className="enms-progress-fill fill-cement-2" />
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">تغذیه واحد بارگیرخانه</span>
            <span className="enms-badge badge-purple">رده ۳۲.۵</span>
          </div>
        </div>
      </div>

      {/* نمودار بارگیری روزانه و مقایسه با سهمیه فروش */}
      <div className="enms-card">
        <div className="enms-card-header">
          <div>
            <h3 className="enms-card-title">
              <Truck className="w-5 h-5 text-[var(--color-primary)]" />
              روند روزانه تحویل و بارگیری سیمان (تن) در برابر تارگت ۴۵۰۰ تن
            </h3>
            <p className="enms-card-subtitle">برگرفته از dispatch-sales.json</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="enms-badge badge-success">
              میانگین روزانه: {toPersianDigits(formatPersianNumber(Math.round(avgDailyDispatch)))} تن
            </span>
          </div>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dispatchData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="Date"
                tick={{ fill: textColor, fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                tickFormatter={(val) => toPersianDigits(val.substring(5))}
              />
              <YAxis
                tick={{ fill: textColor, fontSize: 11 }}
                tickFormatter={(val) => toPersianDigits(val)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-xl text-xs text-[var(--color-text-primary)] font-sans">
                        <div className="font-bold text-[var(--color-primary)] mb-1 border-b border-[var(--color-border)] pb-1">
                          {toPersianDigits(label)}
                        </div>
                        {payload.map((entry, index) => (
                          <div key={index} className="flex justify-between gap-4 py-0.5">
                            <span className="text-[var(--color-text-muted)] font-semibold">{entry.name}:</span>
                            <span className="font-mono font-bold text-[var(--color-primary)]">
                              {toPersianDigits(formatPersianNumber(Number(entry.value)))} تن
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar
                dataKey="Bulk_Type2_42_5"
                name="فله تیپ ۲ رده ۴۲.۵"
                stackId="a"
                fill="#10b981"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="Bagged_Type2_42_5"
                name="پاکتی تیپ ۲ رده ۴۲.۵"
                stackId="a"
                fill="#3b82f6"
              />
              <Bar
                dataKey="Bulk_Type2_32_5"
                name="فله تیپ ۲ رده ۳۲.۵"
                stackId="a"
                fill="#f59e0b"
              />
              <Bar
                dataKey="Bagged_Type2_32_5"
                name="پاکتی تیپ ۲ رده ۳۲.۵"
                stackId="a"
                fill="#ec4899"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
export default InventoryDispatchSubTab;
