import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Clock, AlertTriangle, Factory, Wrench, ShieldAlert } from 'lucide-react';
import { ProductionOperations } from '../../../../types';
import { useData } from '../../../../context/DataContext';
import { useTheme } from '../../../../context/ThemeContext';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';

export const OperationsDowntimeSubTab: React.FC = () => {
  const { getFilteredData } = useData();
  const { isDark } = useTheme();
  const data = getFilteredData<ProductionOperations>('production-operations');

  const totalKilnRun = data.reduce((acc, d) => acc + d.Kiln_Run_Hours, 0);
  const totalKilnStop = data.reduce((acc, d) => acc + d.Kiln_Stop_Hours, 0);
  const totalMillRun = data.reduce((acc, d) => acc + d.CementMill_Run_Hours, 0);
  const totalMillStop = data.reduce((acc, d) => acc + d.CementMill_Stop_Hours, 0);
  const totalClinker = data.reduce((acc, d) => acc + d.Clinker_Prod_ton, 0);
  const totalCement = data.reduce((acc, d) => acc + d.Cement_Prod_ton, 0);

  const kilnAvailability = (totalKilnRun / ((totalKilnRun + totalKilnStop) || 1)) * 100;
  const millAvailability = (totalMillRun / ((totalMillRun + totalMillStop) || 1)) * 100;

  // دسته‌بندی توقفات
  const categoryCounts = data.reduce((acc: Record<string, number>, item) => {
    if (item.Stop_Category && item.Stop_Category !== 'عادی') {
      acc[item.Stop_Category] = (acc[item.Stop_Category] || 0) + (item.Downtime_Duration_Hours || 2.5);
    }
    return acc;
  }, {});

  const paretoData = Object.entries(categoryCounts).map(([cat, hours]) => ({
    category: cat,
    hours: Math.round(hours * 10) / 10,
  })).sort((a, b) => b.hours - a.hours);

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="flex flex-col gap-6">
      {/* کارت‌های شاخص کارکرد و قابلیت دسترسی خطوط */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">آمادگی و راندمان کوره پخت</span>
            <div className="enms-kpi-icon-wrap">
              <Factory className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">{toPersianDigits(kilnAvailability.toFixed(1))}</span>
            <span className="enms-kpi-unit">٪</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">کارکرد: {toPersianDigits(Math.round(totalKilnRun))} ساعت</span>
            <span className={`enms-badge ${kilnAvailability >= 85 ? 'badge-success' : 'badge-warning'}`}>
              {kilnAvailability >= 85 ? 'هدف محقق شد' : 'نیازمند کاهش توقف'}
            </span>
          </div>
        </div>

        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">آمادگی آسیاب سیمان</span>
            <div className="enms-kpi-icon-wrap">
              <Wrench className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">{toPersianDigits(millAvailability.toFixed(1))}</span>
            <span className="enms-kpi-unit">٪</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">کارکرد: {toPersianDigits(Math.round(totalMillRun))} ساعت</span>
            <span className="enms-badge badge-info">خطوط ۱ و ۲</span>
          </div>
        </div>

        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">مجموع تولید کلینکر</span>
            <div className="enms-kpi-icon-wrap">
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">{toPersianDigits(formatPersianNumber(totalClinker))}</span>
            <span className="enms-kpi-unit">تن</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">دوره ۳۰ روزه</span>
            <span className="enms-badge badge-neutral">کلینکر مرغوب</span>
          </div>
        </div>

        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">مجموع تولید سیمان</span>
            <div className="enms-kpi-icon-wrap">
              <ShieldAlert className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">{toPersianDigits(formatPersianNumber(totalCement))}</span>
            <span className="enms-kpi-unit">تن</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">تیپ ۲ رده ۴۲.۵ و ۳۲.۵</span>
            <span className="enms-badge badge-purple">محصول نهایی</span>
          </div>
        </div>
      </div>

      {/* نمودار پارتوی علل توقفات اضطراری و دسته‌بندی ساعات */}
      <div className="enms-card">
        <div className="enms-card-header">
          <div>
            <h3 className="enms-card-title">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              نمودار دسته‌بندی ساعات توقفات خطوط تولید (Downtime Categories)
            </h3>
            <p className="enms-card-subtitle">
              تحلیل ساعات عدم تولید ناشی از محدودیت پیک شبکه برق، عیوب مکانیکی، برقی و فرایندی
            </p>
          </div>
          <span className="enms-badge badge-warning">تحلیل توقفات EnMS</span>
        </div>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={paretoData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="category" tick={{ fill: textColor, fontSize: 11 }} />
              <YAxis
                tick={{ fill: textColor, fontSize: 11 }}
                tickFormatter={(val) => toPersianDigits(val) + 'h'}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-xl text-xs text-[var(--color-text-primary)]">
                        <div className="font-bold text-amber-500 mb-1">{payload[0].payload.category}</div>
                        <div>ساعات توقف: {toPersianDigits(payload[0].value as number)} ساعت</div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="hours" name="مجموع ساعات توقف" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* جدول ثبت رویدادهای توقف */}
      <div className="enms-card">
        <div className="enms-card-header">
          <div>
            <h3 className="enms-card-title">
              <Factory className="w-5 h-5 text-[var(--color-primary)]" />
              لاگ روزانه وقایع بهره‌برداری و علل توقفات
            </h3>
            <p className="enms-card-subtitle">برگرفته از production-operations.json</p>
          </div>
        </div>

        <div className="enms-table-container">
          <table className="enms-table">
            <thead>
              <tr>
                <th>تاریخ</th>
                <th>واحد درگیر</th>
                <th>علت توقف / وضعیت</th>
                <th>دسته‌بندی توقف</th>
                <th>کارکرد کوره (h)</th>
                <th>توقف کوره (h)</th>
                <th>تولید کلینکر (تن)</th>
                <th>تولید سیمان (تن)</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(-15).reverse().map((row, idx) => (
                <tr key={idx}>
                  <td className="font-mono font-bold text-[var(--color-text-primary)]">{toPersianDigits(row.Date)}</td>
                  <td className="font-semibold text-[var(--color-text-secondary)]">{row.Department}</td>
                  <td className="text-[var(--color-text-secondary)]">{row.Stop_Reason}</td>
                  <td>
                    <span
                      className={`enms-badge ${
                        row.Stop_Category === 'عادی'
                          ? 'badge-success'
                          : row.Stop_Category === 'محدودیت برق'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {row.Stop_Category}
                    </span>
                  </td>
                  <td className="font-mono font-bold text-[var(--color-primary)]">{toPersianDigits(row.Kiln_Run_Hours)}</td>
                  <td className="font-mono text-rose-500">{toPersianDigits(row.Kiln_Stop_Hours)}</td>
                  <td className="font-mono text-[var(--color-text-primary)]">{toPersianDigits(formatPersianNumber(row.Clinker_Prod_ton))}</td>
                  <td className="font-mono text-[var(--color-text-primary)]">{toPersianDigits(formatPersianNumber(row.Cement_Prod_ton))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default OperationsDowntimeSubTab;
