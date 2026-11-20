import React, { useState, useMemo } from 'react';
import { DailyProductionRecord, DepartmentFilterMode } from '../types';
import { toPersianDigits } from '../../../../../utils/persianUtils';
import { TrendingUp, Target, Flame, Zap, Hammer, Factory } from 'lucide-react';

interface ProductionSecTrendChartProps {
  records: DailyProductionRecord[];
  periodTitle: string;
  activeDept: DepartmentFilterMode;
  onDeptChange: (dept: DepartmentFilterMode) => void;
}

type ChartMetricKey = 'kilnThermal' | 'kilnElec' | 'rawMill' | 'cementMill' | 'crusher';

interface MetricConfig {
  key: ChartMetricKey;
  dept: DepartmentFilterMode;
  label: string;
  unit: string;
  target: number;
  color: string;
  extractValue: (r: DailyProductionRecord) => number;
}

const METRICS_CONFIG: Record<ChartMetricKey, MetricConfig> = {
  kilnThermal: {
    key: 'kilnThermal',
    dept: 'kiln',
    label: 'واحد پخت - مصرف ویژه انرژی حرارتی',
    unit: 'kcal/kg',
    target: 900.0,
    color: '#f43f5e', // Rose
    extractValue: (r) => r.secThermalKcalKg,
  },
  kilnElec: {
    key: 'kilnElec',
    dept: 'kiln',
    label: 'واحد پخت - مصرف ویژه برق کل',
    unit: 'kWh/t',
    target: 34.0,
    color: '#a855f7', // Purple
    extractValue: (r) => r.kilnElecSecKwhTon,
  },
  rawMill: {
    key: 'rawMill',
    dept: 'rawMill',
    label: 'آسیاب مواد خام - مصرف ویژه برق',
    unit: 'kWh/t',
    target: 24.0,
    color: '#06b6d4', // Cyan
    extractValue: (r) => r.rawMillSecKwhTon,
  },
  cementMill: {
    key: 'cementMill',
    dept: 'cementMill',
    label: 'آسیاب سیمان - مصرف ویژه برق',
    unit: 'kWh/t',
    target: 38.0,
    color: '#f59e0b', // Amber
    extractValue: (r) => r.cementMillSecKwhTon,
  },
  crusher: {
    key: 'crusher',
    dept: 'crusher',
    label: 'واحد سنگ‌شکن - مصرف ویژه برق',
    unit: 'kWh/t',
    target: 1.14,
    color: '#10b981', // Emerald
    extractValue: (r) => r.crusherSecKwhTon,
  },
};

export const ProductionSecTrendChart: React.FC<ProductionSecTrendChartProps> = ({
  records,
  periodTitle,
  activeDept,
  onDeptChange,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetricKey>('kilnThermal');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // همگام‌سازی خودکار متریک نمودار با تب دپارتمان انتخابی کاربر
  React.useEffect(() => {
    if (activeDept === 'crusher') setSelectedMetric('crusher');
    else if (activeDept === 'rawMill') setSelectedMetric('rawMill');
    else if (activeDept === 'cementMill') setSelectedMetric('cementMill');
    else if (activeDept === 'kiln' && selectedMetric !== 'kilnElec') setSelectedMetric('kilnThermal');
  }, [activeDept]);

  const currentMetric = METRICS_CONFIG[selectedMetric];

  const chartPoints = useMemo(() => {
    return records
      .map((r) => ({
        dayNumber: r.dayNumber,
        jalaliDate: r.jalaliDate,
        value: currentMetric.extractValue(r),
      }))
      .filter((pt) => pt.value > 0);
  }, [records, currentMetric]);

  const stats = useMemo(() => {
    if (chartPoints.length === 0) {
      return { min: 0, max: currentMetric.target * 1.2, avg: 0, compliantCount: 0 };
    }
    const vals = chartPoints.map((p) => p.value);
    const maxVal = Math.max(...vals, currentMetric.target * 1.15);
    const minVal = Math.min(...vals, currentMetric.target * 0.85) * 0.9;
    const avgVal = vals.reduce((a, b) => a + b, 0) / vals.length;
    const compliantCount = vals.filter((v) => v <= currentMetric.target).length;
    return { min: minVal, max: maxVal, avg: avgVal, compliantCount };
  }, [chartPoints, currentMetric]);

  // ابعاد بوم SVG
  const width = 960;
  const height = 270;
  const padLeft = 58;
  const padRight = 28;
  const padTop = 26;
  const padBottom = 36;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const getY = (val: number) => {
    const range = stats.max - stats.min || 1;
    return padTop + plotH - ((val - stats.min) / range) * plotH;
  };

  const getX = (index: number) => {
    if (chartPoints.length <= 1) return padLeft + plotW / 2;
    return padLeft + (index / (chartPoints.length - 1)) * plotW;
  };

  const targetY = getY(currentMetric.target);

  const polylinePoints = chartPoints
    .map((pt, idx) => `${getX(idx)},${getY(pt.value)}`)
    .join(' ');

  return (
    <div className="enms-card p-4 space-y-4" dir="rtl">
      {/* هدر نمودار و انتخاب‌گر شاخص‌های ۵گانه */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--color-primary)]" />
          <div>
            <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
              نمودار روند شاخص عملکرد انرژی (SEC Trend vs. Stage 1 Target) - {periodTitle}
            </h3>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              پایش انحراف روزانه مصرف ویژه انرژی در برابر خط هدف مصوب مرحله اول ({toPersianDigits(currentMetric.target)} {currentMetric.unit})
            </p>
          </div>
        </div>

        {/* دکمه‌های انتخاب شاخص‌های ۵گانه */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(Object.values(METRICS_CONFIG) as MetricConfig[]).map((m) => {
            const isActive = selectedMetric === m.key;
            return (
              <button
                key={m.key}
                onClick={() => {
                  setSelectedMetric(m.key);
                  onDeptChange(m.dept);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[var(--color-primary-bg)] text-[var(--color-primary)] border-[var(--color-primary)] shadow-xs'
                    : 'bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {m.key === 'kilnThermal' && <Flame className="w-3 h-3 text-rose-500" />}
                {m.key === 'kilnElec' && <Zap className="w-3 h-3 text-purple-500" />}
                {m.key === 'rawMill' && <Factory className="w-3 h-3 text-cyan-500" />}
                {m.key === 'cementMill' && <Zap className="w-3 h-3 text-amber-500" />}
                {m.key === 'crusher' && <Hammer className="w-3 h-3 text-emerald-500" />}
                <span>{m.label.split(' - ')[0]} ({m.key === 'kilnThermal' ? 'حرارتی' : 'برق'})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* نوار خلاصه وضعیت انطباق در دوره */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-2.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
          <span className="text-[var(--color-text-muted)]">هدف مرحله اول:</span>
          <strong className="font-mono text-emerald-500">
            {toPersianDigits(currentMetric.target.toFixed(2))} {currentMetric.unit}
          </strong>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
          <span className="text-[var(--color-text-muted)]">میانگین محقق‌شده:</span>
          <strong className={`font-mono ${stats.avg <= currentMetric.target ? 'text-emerald-500' : 'text-rose-500'}`}>
            {chartPoints.length > 0 ? `${toPersianDigits(stats.avg.toFixed(2))} ${currentMetric.unit}` : '---'}
          </strong>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
          <span className="text-[var(--color-text-muted)]">روزهای منطبق با هدف:</span>
          <strong className="font-mono text-[var(--color-primary)]">
            {toPersianDigits(stats.compliantCount)} از {toPersianDigits(chartPoints.length)} روز
          </strong>
        </div>
        <div className="p-2.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-center justify-between">
          <span className="text-[var(--color-text-muted)]">نقطه بازرسی فعال:</span>
          <strong className="font-mono text-[var(--color-text-primary)]">
            {hoveredIdx !== null && chartPoints[hoveredIdx]
              ? `روز ${toPersianDigits(chartPoints[hoveredIdx].dayNumber)}: ${toPersianDigits(chartPoints[hoveredIdx].value.toFixed(2))}`
              : 'نشانگر را روی نقاط ببرید'}
          </strong>
        </div>
      </div>

      {/* بوم ترسیم نمودار برداری SVG */}
      {chartPoints.length === 0 ? (
        <div className="p-10 rounded-xl bg-[var(--color-bg-card-subtle)] border border-dashed border-[var(--color-border)] text-center text-xs text-[var(--color-text-muted)]">
          برای این دپارتمان در دوره انتخابی ({periodTitle})، قرائت کنتور تفکیکی ثبت نشده است. لطفاً دوره دیگری (مانند فروردین ۱۴۰۵ یا بهمن/اسفند ۱۴۰۴) را انتخاب کنید.
        </div>
      ) : (
        <div className="w-full overflow-x-auto rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] p-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[680px] h-auto select-none">
            {/* خطوط راهنمای افقی محور Y */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
              const val = stats.min + ratio * (stats.max - stats.min);
              const y = getY(val);
              return (
                <g key={i}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={width - padRight}
                    y2={y}
                    stroke="var(--color-border)"
                    strokeWidth="1"
                    strokeDasharray="2 4"
                  />
                  <text
                    x={padLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="var(--color-text-muted)"
                    fontSize="10"
                    fontFamily="monospace"
                  >
                    {val.toFixed(currentMetric.target < 5 ? 2 : 0)}
                  </text>
                </g>
              );
            })}

            {/* ناحیه مجاز زیر خط هدف (سبز ملایم) */}
            <rect
              x={padLeft}
              y={targetY}
              width={plotW}
              height={Math.max(0, padTop + plotH - targetY)}
              fill="#10b981"
              opacity="0.06"
            />

            {/* خط هدف مصوب مرحله اول (Target Benchmark Line) */}
            <line
              x1={padLeft}
              y1={targetY}
              x2={width - padRight}
              y2={targetY}
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <rect
              x={width - padRight - 135}
              y={targetY - 18}
              width="135"
              height="16"
              rx="4"
              fill="#10b981"
            />
            <text
              x={width - padRight - 67}
              y={targetY - 7}
              textAnchor="middle"
              fill="#022c22"
              fontSize="9.5"
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              هدف مرحله ۱: {toPersianDigits(currentMetric.target)}
            </text>

            {/* خط روند مقادیر واقعی */}
            <polyline
              fill="none"
              stroke={currentMetric.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              points={polylinePoints}
            />

            {/* نقاط داده و برچسب‌های روزانه */}
            {chartPoints.map((pt, idx) => {
              const cx = getX(idx);
              const cy = getY(pt.value);
              const isCompliant = pt.value <= currentMetric.target;
              const isHovered = hoveredIdx === idx;
              const labelStep = chartPoints.length > 35 ? Math.ceil(chartPoints.length / 25) : 1;
              const showXLabel = idx % labelStep === 0 || idx === chartPoints.length - 1 || isHovered;

              return (
                <g
                  key={`${pt.jalaliDate || pt.dayNumber}-${idx}`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  className="cursor-pointer"
                >
                  {/* خط راهنمای عمودی هنگام هاور */}
                  {isHovered && (
                    <line
                      x1={cx}
                      y1={padTop}
                      x2={cx}
                      y2={padTop + plotH}
                      stroke="var(--color-text-muted)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                    />
                  )}

                  {/* دایره نقطه داده (سبز برای انطباق، قرمز برای انحراف) */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 6 : 4}
                    fill={isCompliant ? '#10b981' : '#f43f5e'}
                    stroke="var(--color-bg-surface)"
                    strokeWidth="1.5"
                  />

                  {/* برچسب شماره روز روی محور X */}
                  {showXLabel && (
                    <text
                      x={cx}
                      y={height - 12}
                      textAnchor="middle"
                      fill={isHovered ? 'var(--color-primary)' : 'var(--color-text-muted)'}
                      fontSize="9.5"
                      fontWeight={isHovered ? 'bold' : 'normal'}
                      fontFamily="monospace"
                    >
                      {toPersianDigits(pt.dayNumber)}
                    </text>
                  )}

                  {/* تولتیپ روی نقطه فعال */}
                  {isHovered && (
                    <g transform={`translate(${Math.min(width - 135, Math.max(padLeft, cx - 55))}, ${Math.max(6, cy - 36)})`}>
                      <rect
                        width="115"
                        height="26"
                        rx="6"
                        fill="var(--color-bg-surface)"
                        stroke={isCompliant ? '#10b981' : '#f43f5e'}
                        strokeWidth="1.5"
                      />
                      <text
                        x="57"
                        y="16"
                        textAnchor="middle"
                        fill="var(--color-text-primary)"
                        fontSize="10"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        روز {toPersianDigits(pt.dayNumber)}: {toPersianDigits(pt.value.toFixed(2))}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

export default ProductionSecTrendChart;