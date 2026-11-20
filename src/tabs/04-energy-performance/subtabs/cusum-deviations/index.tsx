import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  Zap,
  Flame,
  Info,
} from 'lucide-react';
import { EnergyPerformanceEnPI } from '../../../../types';
import { useData } from '../../../../context/DataContext';
import { useTheme } from '../../../../context/ThemeContext';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';
import { useBaselinesConfig } from '../../../../services/configService';

export const CusumDeviationsSubTab: React.FC = () => {
  const { getFilteredData } = useData();
  const { isDark } = useTheme();
  const baselinesConfig = useBaselinesConfig();
  const data = getFilteredData<EnergyPerformanceEnPI>('enpi-performance');

  // محاسبات شاخص‌های عملکردی دوره
  const totalDays = data.length || 1;
  const avgElectricSEC = data.reduce((acc, d) => acc + d.SEC_Electric_Actual, 0) / totalDays;
  const avgThermalSEC = data.reduce((acc, d) => acc + d.SEC_Thermal_Actual, 0) / totalDays;
  const targetElectric = baselinesConfig.target_electric_kwh_ton;
  const targetThermal = baselinesConfig.target_thermal_kcal_kg;

  const latestRow = data[data.length - 1] || {
    CUSUM_Electric: 0,
    CUSUM_Thermal: 0,
    Electric_Deviation: 0,
    Thermal_Deviation: 0,
  };

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="flex flex-col gap-6">
      {/* ردیف سنجه‌های کارت KPI برای CUSUM و انحرافات */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* میانگین مصرف ویژه برق */}
        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">میانگین مصرف ویژه برق (SEC)</span>
            <div className="enms-kpi-icon-wrap">
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">{toPersianDigits(avgElectricSEC.toFixed(1))}</span>
            <span className="enms-kpi-unit">kWh/t</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">خط مبنای هدف (EnB): {toPersianDigits(targetElectric)}</span>
            <span
              className={`enms-badge ${
                avgElectricSEC <= targetElectric ? 'badge-success' : 'badge-danger'
              }`}
            >
              {avgElectricSEC <= targetElectric ? 'منطبق با هدف' : 'انحراف افزایشی'}
            </span>
          </div>
        </div>

        {/* میانگین مصرف ویژه حرارتی */}
        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">میانگین مصرف ویژه حرارتی کوره</span>
            <div className="enms-kpi-icon-wrap">
              <Flame className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">{toPersianDigits(Math.round(avgThermalSEC))}</span>
            <span className="enms-kpi-unit">kcal/kg.cl</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">خط مبنای هدف: {toPersianDigits(targetThermal)}</span>
            <span
              className={`enms-badge ${
                avgThermalSEC <= targetThermal ? 'badge-success' : 'badge-warning'
              }`}
            >
              {avgThermalSEC <= targetThermal ? 'بهینه' : 'نیازمند پایش'}
            </span>
          </div>
        </div>

        {/* خطای تجمعی برق CUSUM */}
        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">انحراف تجمعی برق (CUSUM)</span>
            <div className="enms-kpi-icon-wrap">
              <Gauge className="w-4 h-4 text-[var(--color-primary)]" />
            </div>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">
              {toPersianDigits(latestRow.CUSUM_Electric.toFixed(1))}
            </span>
            <span className="enms-kpi-unit">kWh/t</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">آخرین روز پایش</span>
            <span
              className={`enms-badge ${
                latestRow.CUSUM_Electric <= 0 ? 'badge-success' : 'badge-danger'
              }`}
            >
              {latestRow.CUSUM_Electric <= 0 ? 'صرفه‌جویی خالص' : 'اتلاف تجمعی'}
            </span>
          </div>
        </div>

        {/* خطای تجمعی حرارتی CUSUM */}
        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">انحراف تجمعی حرارت (CUSUM)</span>
            <div className="enms-kpi-icon-wrap">
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">
              {toPersianDigits(formatPersianNumber(Math.round(latestRow.CUSUM_Thermal)))}
            </span>
            <span className="enms-kpi-unit">kcal/kg</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">برگرفته از enpi-performance.json</span>
            <span
              className={`enms-badge ${
                latestRow.CUSUM_Thermal <= 0 ? 'badge-success' : 'badge-warning'
              }`}
            >
              {latestRow.CUSUM_Thermal <= 0 ? 'تثبیت مطلوب' : 'شیب انحراف مثبت'}
            </span>
          </div>
        </div>
      </div>

      {/* نمودار تحلیل انحرافات تجمعی برق (CUSUM Electric) */}
      <div className="enms-card">
        <div className="enms-card-header">
          <div>
            <h3 className="enms-card-title">
              <Zap className="w-5 h-5 text-[var(--color-primary)]" />
              روند خطای تجمعی مصرف برق (CUSUM Electric) در برابر انحرافات روزانه
            </h3>
            <p className="enms-card-subtitle">
              تحلیل شیب منحنی CUSUM: شیب نزولی نشانگر بهینه‌سازی و شیب صعودی نشانه انحراف منفی است.
            </p>
          </div>
          <span className="enms-badge badge-neutral">منبع: enpi-performance.json</span>
        </div>

        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="Date"
                tick={{ fill: textColor, fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                tickFormatter={(val) => toPersianDigits(val.substring(5))}
              />
              <YAxis
                yAxisId="cusum"
                orientation="right"
                tick={{ fill: '#10b981', fontSize: 11 }}
                tickFormatter={(val) => toPersianDigits(val)}
              />
              <YAxis
                yAxisId="dev"
                orientation="left"
                tick={{ fill: textColor, fontSize: 11 }}
                tickFormatter={(val) => toPersianDigits(val)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-3 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-lg shadow-xl text-xs font-sans text-[var(--color-text-primary)]">
                        <div className="font-bold text-[var(--color-primary)] mb-1 border-b border-[var(--color-border)] pb-1">
                          تاریخ: {toPersianDigits(label)}
                        </div>
                        {payload.map((entry, index) => (
                          <div key={index} className="flex justify-between gap-4 py-0.5">
                            <span className="text-[var(--color-text-muted)] font-semibold">{entry.name}:</span>
                            <span className="font-mono font-bold text-[var(--color-primary)]">
                              {toPersianDigits(Number(entry.value).toFixed(1))}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
              />
              <ReferenceLine yAxisId="cusum" y={0} stroke="#94a3b8" strokeDasharray="3 3" />
              <Bar
                yAxisId="dev"
                dataKey="Electric_Deviation"
                name="انحراف روزانه برق (kWh/t)"
                fill="#3b82f6"
                opacity={0.65}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="cusum"
                type="monotone"
                dataKey="CUSUM_Electric"
                name="مجموع تجمعی CUSUM برق"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 2 }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* جدول ثبت روزانه شاخص‌ها با قابلیت پیوند رابطه‌ای */}
      <div className="enms-card">
        <div className="enms-card-header">
          <div>
            <h3 className="enms-card-title">
              <TrendingUp className="w-5 h-5 text-[var(--color-primary)]" />
              جدول روزانه سنجه‌های EnPI و انحرافات CUSUM
            </h3>
            <p className="enms-card-subtitle">
              پایش همزمان مصرف ویژه برق، مصرف حرارتی کوره و حجم گاز مصرفی CGS
            </p>
          </div>
          <span className="text-xs text-[var(--color-text-muted)] font-mono">
            {toPersianDigits(data.length)} سطر ثبت‌شده
          </span>
        </div>

        <div className="enms-table-container">
          <table className="enms-table">
            <thead>
              <tr>
                <th>تاریخ خورشیدی</th>
                <th>مصرف ویژه برق (kWh/t)</th>
                <th>هدف برق</th>
                <th>انحراف روزانه برق</th>
                <th>CUSUM برق</th>
                <th>مصرف حرارتی (kcal/kg)</th>
                <th>هدف حرارت</th>
                <th>CUSUM حرارت</th>
                <th>گاز مصرفی (Nm³)</th>
                <th>وضعیت تطابق</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(-15).reverse().map((row) => {
                const isElecOk = row.SEC_Electric_Actual <= baselinesConfig.target_electric_kwh_ton;
                const isThermOk = row.SEC_Thermal_Actual <= baselinesConfig.target_thermal_kcal_kg;

                return (
                  <tr key={row.Date}>
                    <td className="font-mono font-bold text-[var(--color-text-primary)]">{toPersianDigits(row.Date)}</td>
                    <td className="font-mono font-bold text-[var(--color-primary)]">
                      {toPersianDigits(row.SEC_Electric_Actual.toFixed(1))}
                    </td>
                    <td className="font-mono text-[var(--color-text-muted)]">
                      {toPersianDigits(baselinesConfig.target_electric_kwh_ton)}
                    </td>
                    <td
                      className={`font-mono font-bold ${
                        row.Electric_Deviation <= 0 ? 'text-[var(--color-primary)]' : 'text-rose-500'
                      }`}
                    >
                      {toPersianDigits(row.Electric_Deviation.toFixed(1))}
                    </td>
                    <td className="font-mono text-[var(--color-text-secondary)]">
                      {toPersianDigits(row.CUSUM_Electric.toFixed(1))}
                    </td>
                    <td className="font-mono font-bold text-amber-500">
                      {toPersianDigits(row.SEC_Thermal_Actual)}
                    </td>
                    <td className="font-mono text-[var(--color-text-muted)]">
                      {toPersianDigits(baselinesConfig.target_thermal_kcal_kg)}
                    </td>
                    <td className="font-mono text-[var(--color-text-secondary)]">
                      {toPersianDigits(formatPersianNumber(row.CUSUM_Thermal))}
                    </td>
                    <td className="font-mono text-[var(--color-text-primary)]">
                      {toPersianDigits(formatPersianNumber(Math.round(row.Natural_Gas_Nm3)))}
                    </td>
                    <td>
                      <span
                        className={`enms-badge ${
                          isElecOk && isThermOk
                            ? 'badge-success'
                            : !isElecOk && !isThermOk
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {isElecOk && isThermOk
                          ? 'مطابق استاندارد'
                          : !isElecOk && !isThermOk
                          ? 'انحراف مضاعف'
                          : 'انحراف جزئی'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default CusumDeviationsSubTab;
