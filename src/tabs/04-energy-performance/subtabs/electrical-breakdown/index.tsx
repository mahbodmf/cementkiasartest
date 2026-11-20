import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Zap, Factory, BarChart3, AlertCircle } from 'lucide-react';
import { ElectricalEnergy } from '../../../../types';
import { useData } from '../../../../context/DataContext';
import { useTheme } from '../../../../context/ThemeContext';
import { toPersianDigits, formatPersianNumber } from '../../../../utils/persianUtils';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

export const ElectricalBreakdownSubTab: React.FC = () => {
  const { getFilteredData } = useData();
  const { isDark } = useTheme();
  const data = getFilteredData<ElectricalEnergy>('electrical-energy');

  const totalPlantKwh = data.reduce((acc, d) => acc + d.Factory_Total_kWh, 0);
  const totalCrusher = data.reduce((acc, d) => acc + d.Crusher_Total_kWh, 0);
  const totalRawMill = data.reduce((acc, d) => acc + d.RawMill_Total_kWh, 0);
  const totalKiln = data.reduce((acc, d) => acc + d.Kiln_Total_kWh, 0);
  const totalCementMill = data.reduce((acc, d) => acc + d.CementMill_Total_kWh, 0);

  const pieData = [
    { name: 'آسیاب سیمان', value: totalCementMill, color: '#ec4899', dotClass: 'dot-cementmill' },
    { name: 'آسیاب مواد خام', value: totalRawMill, color: '#3b82f6', dotClass: 'dot-rawmill' },
    { name: 'کوره و خنک‌کن', value: totalKiln, color: '#f59e0b', dotClass: 'dot-kiln' },
    { name: 'سنگ‌شکن', value: totalCrusher, color: '#10b981', dotClass: 'dot-crusher' },
  ];

  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const textColor = isDark ? '#94a3b8' : '#64748b';

  return (
    <div className="flex flex-col gap-6">
      {/* کارت‌های خلاصه مصرف برق دپارتمان‌ها */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">مجموع مصرف برق کارخانه</span>
            <div className="enms-kpi-icon-wrap">
              <Zap className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">
              {toPersianDigits((totalPlantKwh / 1000000).toFixed(2))}
            </span>
            <span className="enms-kpi-unit">GWh</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">مجموع دوره</span>
            <span className="enms-badge badge-neutral">پست ۶۳ کیلوولت</span>
          </div>
        </div>

        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">آسیاب سیمان (Mill)</span>
            <span className="text-xs font-mono font-bold text-pink-400">
              {toPersianDigits(((totalCementMill / (totalPlantKwh || 1)) * 100).toFixed(1))}٪
            </span>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">
              {toPersianDigits((totalCementMill / 1000000).toFixed(2))}
            </span>
            <span className="enms-kpi-unit">GWh</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">بزرگ‌ترین مصرف‌کننده بار</span>
            <span className="enms-badge badge-warning">بارزترین SEU</span>
          </div>
        </div>

        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">آسیاب مواد خام</span>
            <span className="text-xs font-mono font-bold text-blue-400">
              {toPersianDigits(((totalRawMill / (totalPlantKwh || 1)) * 100).toFixed(1))}٪
            </span>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">
              {toPersianDigits((totalRawMill / 1000000).toFixed(2))}
            </span>
            <span className="enms-kpi-unit">GWh</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">الکتروموتورهای ۶.۶ کیلوولت</span>
            <span className="enms-badge badge-info">SEU</span>
          </div>
        </div>

        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">کوره و خنک‌کن</span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {toPersianDigits(((totalKiln / (totalPlantKwh || 1)) * 100).toFixed(1))}٪
            </span>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">
              {toPersianDigits((totalKiln / 1000000).toFixed(2))}
            </span>
            <span className="enms-kpi-unit">GWh</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">فن‌های ID و کولر</span>
            <span className="enms-badge badge-success">بهینه‌شده</span>
          </div>
        </div>

        <div className="enms-kpi-card">
          <div className="enms-kpi-top">
            <span className="enms-kpi-title">سنگ‌شکن (Crusher)</span>
            <span className="text-xs font-mono font-bold text-[var(--color-primary)]">
              {toPersianDigits(((totalCrusher / (totalPlantKwh || 1)) * 100).toFixed(1))}٪
            </span>
          </div>
          <div className="enms-kpi-value-wrap">
            <span className="enms-kpi-value">
              {toPersianDigits((totalCrusher / 1000).toFixed(0))}
            </span>
            <span className="enms-kpi-unit">MWh</span>
          </div>
          <div className="enms-kpi-footer">
            <span className="text-[var(--color-text-muted)]">سنگ‌شکن فکی و چکشی</span>
            <span className="enms-badge badge-neutral">آماده‌سازی</span>
          </div>
        </div>
      </div>

      {/* نمودار مساحتی و دایره‌ای تفکیک مصرف برق */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="enms-card lg:col-span-2">
          <div className="enms-card-header">
            <div>
              <h3 className="enms-card-title">
                <BarChart3 className="w-5 h-5 text-[var(--color-primary)]" />
                روند روزانه مصرف برق به تفکیک دپارتمان‌ها (Stacked Area)
              </h3>
              <p className="enms-card-subtitle">
                تغییرات بار روزانه در طول دوره بر اساس electrical-energy.json
              </p>
            </div>
            <span className="enms-badge badge-neutral">واحد: kWh</span>
          </div>

          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
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
                  tickFormatter={(val) => toPersianDigits((val / 1000).toFixed(0) + 'k')}
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
                                {toPersianDigits(formatPersianNumber(Number(entry.value)))} kWh
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
                <Area
                  type="monotone"
                  dataKey="Crusher_Total_kWh"
                  name="سنگ‌شکن"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="RawMill_Total_kWh"
                  name="آسیاب مواد خام"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="Kiln_Total_kWh"
                  name="کوره و خنک‌کن"
                  stackId="1"
                  stroke="#f59e0b"
                  fill="#f59e0b"
                  fillOpacity={0.8}
                />
                <Area
                  type="monotone"
                  dataKey="CementMill_Total_kWh"
                  name="آسیاب سیمان"
                  stackId="1"
                  stroke="#ec4899"
                  fill="#ec4899"
                  fillOpacity={0.8}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="enms-card">
          <div className="enms-card-header">
            <div>
              <h3 className="enms-card-title">
                <Factory className="w-5 h-5 text-[var(--color-primary)]" />
                سهم کل مصرف برق دوره
              </h3>
              <p className="enms-card-subtitle">توزیع درصدی انرژی اکتیو دپارتمان‌ها</p>
            </div>
          </div>

          <div className="w-full h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [
                    `${toPersianDigits(formatPersianNumber(Number(val)))} kWh`,
                    'مصرف کل',
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-[var(--color-border)]">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${item.dotClass}`} />
                  <span className="text-[var(--color-text-secondary)] font-semibold">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-[var(--color-text-primary)]">
                  {toPersianDigits(((item.value / (totalPlantKwh || 1)) * 100).toFixed(1))}٪
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ElectricalBreakdownSubTab;
