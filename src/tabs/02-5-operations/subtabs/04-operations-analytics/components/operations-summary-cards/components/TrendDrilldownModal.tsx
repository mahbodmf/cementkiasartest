import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Gauge,
  Flame,
  Truck,
  Layers,
  X,
  Calendar,
  Download,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  TrendingUp,
  Plus,
  Trash2,
  Sliders,
  Check,
} from 'lucide-react';
import {
  ModalType,
  MultiMonthDailyRecord,
  OperationsTargets,
  QuickFilterType,
} from '../types';
import { toPersianDigits, formatPersianNumber } from '../../../../../../utils/persianUtils';

export interface TrendDrilldownModalProps {
  activeModal: ModalType;
  targets: OperationsTargets;
  multiMonthDailyRecords: MultiMonthDailyRecord[];
  availableMonthKeys: string[];
  startPeriod: string;
  endPeriod: string;
  quickFilter: QuickFilterType | 'custom';
  onClose: () => void;
  onStartPeriodChange: (period: string) => void;
  onEndPeriodChange: (period: string) => void;
  onQuickFilterChange: (type: any) => void;
  onModalTypeChange?: (type: ModalType) => void;
  onExportExcel?: () => void;
}

interface MovingAverageConfig {
  id: string;
  windowSize: number;
  color: string;
  label: string;
  enabled: boolean;
}

export const TrendDrilldownModal: React.FC<TrendDrilldownModalProps> = ({
  activeModal,
  targets,
  multiMonthDailyRecords,
  availableMonthKeys,
  startPeriod,
  endPeriod,
  quickFilter,
  onClose,
  onStartPeriodChange,
  onEndPeriodChange,
  onQuickFilterChange,
  onModalTypeChange,
  onExportExcel,
}) => {
  const [windowSize, setWindowSize] = useState<'standard' | 'large' | 'fullscreen'>('large');
  const [dayBarWidth, setDayBarWidth] = useState<number>(28);

  // تقویم پاپ‌آپ انتخابی
  const [isCalendarPickerOpen, setIsCalendarPickerOpen] = useState<boolean>(false);
  const [pickerStart, setPickerStart] = useState<string>(startPeriod);
  const [pickerEnd, setPickerEnd] = useState<string>(endPeriod);

  // همگام‌سازی انتخابگر تقویم هنگام باز شدن
  useEffect(() => {
    if (isCalendarPickerOpen) {
      setPickerStart(startPeriod);
      setPickerEnd(endPeriod);
    }
  }, [isCalendarPickerOpen, startPeriod, endPeriod]);

  // خطوط میانگین متحرک سفارشی
  const [isSmaSettingsOpen, setIsSmaSettingsOpen] = useState<boolean>(false);
  const [smaConfigs, setSmaConfigs] = useState<MovingAverageConfig[]>([
    { id: 'sma-7', windowSize: 7, color: '#f59e0b', label: 'میانگین ۷ روزه', enabled: true },
    { id: 'sma-30', windowSize: 30, color: '#38bdf8', label: 'میانگین ۳۰ روزه', enabled: false },
  ]);
  const [newSmaDays, setNewSmaDays] = useState<number>(3);

  const [hoveredPoint, setHoveredPoint] = useState<{
    data: MultiMonthDailyRecord;
    x: number;
    y: number;
  } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // اسکرول خودکار به ابتدای نمودار هنگام تغییر بازه زمانی
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0;
    }
  }, [startPeriod, endPeriod]);

  if (!activeModal) return null;

  const getWindowDimensionsClass = () => {
    switch (windowSize) {
      case 'standard':
        return 'w-[80vw] h-[75vh] max-w-[1200px]';
      case 'fullscreen':
        return 'w-[98vw] h-[96vh] max-w-none';
      case 'large':
      default:
        return 'w-[94vw] h-[90vh] max-w-[1600px]';
    }
  };

  const handleZoomIn = () => setDayBarWidth((prev) => Math.min(80, prev + 8));
  const handleZoomOut = () => setDayBarWidth((prev) => Math.max(14, prev - 6));
  const handleResetZoom = () => setDayBarWidth(28);

  const calculateSMA = (records: MultiMonthDailyRecord[], windowSize: number, valExtractor: (r: MultiMonthDailyRecord) => number) => {
    const result: (number | null)[] = [];
    for (let i = 0; i < records.length; i++) {
      if (i < windowSize - 1) {
        result.push(null);
      } else {
        const slice = records.slice(i - windowSize + 1, i + 1);
        const sum = slice.reduce((acc, curr) => acc + valExtractor(curr), 0);
        result.push(sum / windowSize);
      }
    }
    return result;
  };

  const handleAddSma = () => {
    if (newSmaDays < 2) return;
    const colors = ['#ec4899', '#10b981', '#8b5cf6', '#f97316', '#14b8a6'];
    const nextColor = colors[smaConfigs.length % colors.length];
    setSmaConfigs((prev) => [
      ...prev,
      {
        id: `sma-${newSmaDays}-${Date.now()}`,
        windowSize: newSmaDays,
        color: nextColor,
        label: `میانگین ${newSmaDays} روزه`,
        enabled: true,
      },
    ]);
    setNewSmaDays(3);
  };

  // اعمال قطعی بازه بدون ریست شدن به کل تاریخچه
  const handleApplyCalendarRange = () => {
    let s = pickerStart;
    let e = pickerEnd;
    if (availableMonthKeys.indexOf(s) > availableMonthKeys.indexOf(e)) {
      const temp = s;
      s = e;
      e = temp;
    }

    onStartPeriodChange(s);
    onEndPeriodChange(e);
    onQuickFilterChange('custom');
    setIsCalendarPickerOpen(false);
  };

  const handleExportExcel = () => {
    if (multiMonthDailyRecords.length === 0) return;
    const rows = multiMonthDailyRecords.map((r) => ({
      'دوره': r.periodKey,
      'روز': r.dayNumber,
      'تاریخ شمسی': r.jalaliDate,
      'تولید کلینکر (تن)': r.clinkerTon,
      'تولید سیمان (تن)': r.cementTon,
      'توقف کوره (ساعت)': Number(r.kilnStopHours.toFixed(1)),
      'OEE کوره (٪)': Number(r.oee.toFixed(1)),
      'SEC حرارتی (kcal/kg)': r.secThermal,
      'SEC برق (kWh/t)': r.secElectrical,
      'موجودی دپو کلینکر (تن)': r.clinkerStockTon,
      'دیسپاچینگ (تن)': r.dispatchTon,
      'علت توقف': r.kilnStopCauses || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'روند_عملیات');
    XLSX.writeFile(wb, `روند_عملیات_${startPeriod}_تا_${endPeriod}.xlsx`);
  };

  const totalDays = multiMonthDailyRecords.length;
  const svgContentWidth = Math.max(1000, totalDays * dayBarWidth + 120);

  const renderChart = (type: 'oee' | 'thermal' | 'runway' | 'dispatch', height: number = 320) => {
    const chartHeight = height - 70;
    const yAxisBase = height - 40;

    const getVal = (r: MultiMonthDailyRecord) => {
      if (type === 'oee') return r.oee || 0;
      if (type === 'thermal') return r.secThermal || 0;
      if (type === 'runway') return r.clinkerStockTon || 0;
      return r.dispatchTon || 0;
    };

    return (
      <div className="relative w-full h-full flex flex-col">
        <div
          ref={scrollContainerRef}
          className="w-full flex-1 overflow-x-auto overflow-y-auto select-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] p-2"
        >
          <svg
            className="h-full"
            style={{ width: `${svgContentWidth}px`, minHeight: `${height}px` }}
            viewBox={`0 0 ${svgContentWidth} ${height}`}
          >
            <line x1="50" y1={yAxisBase} x2={svgContentWidth - 30} y2={yAxisBase} stroke="#374151" strokeWidth="1.5" />

            {/* خطوط شاخص پذیرش استاندارد */}
            {type === 'oee' && (
              <>
                <line
                  x1="50"
                  y1={yAxisBase - (targets.targetKilnOee / 100) * chartHeight}
                  x2={svgContentWidth - 30}
                  y2={yAxisBase - (targets.targetKilnOee / 100) * chartHeight}
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <text
                  x="60"
                  y={yAxisBase - (targets.targetKilnOee / 100) * chartHeight - 8}
                  fill="#10b981"
                  fontSize="11"
                  fontWeight="bold"
                >
                  شاخص هدف OEE کوره ({toPersianDigits(targets.targetKilnOee)}٪)
                </text>
              </>
            )}

            {type === 'thermal' && (
              <>
                <line
                  x1="50"
                  y1={yAxisBase - ((targets.secThermalMax - 600) / 900) * chartHeight}
                  x2={svgContentWidth - 30}
                  y2={yAxisBase - ((targets.secThermalMax - 600) / 900) * chartHeight}
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <text
                  x="60"
                  y={yAxisBase - ((targets.secThermalMax - 600) / 900) * chartHeight - 8}
                  fill="#10b981"
                  fontSize="11"
                  fontWeight="bold"
                >
                  سقف استاندارد مصرف ویژه حرارتی ({toPersianDigits(targets.secThermalMax)} kcal/kg)
                </text>
              </>
            )}

            {type === 'runway' && (
              <>
                <line
                  x1="50"
                  y1={yAxisBase - (targets.minClinkerSafetyStock / 80000) * chartHeight}
                  x2={svgContentWidth - 30}
                  y2={yAxisBase - (targets.minClinkerSafetyStock / 80000) * chartHeight}
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <text
                  x="60"
                  y={yAxisBase - (targets.minClinkerSafetyStock / 80000) * chartHeight - 8}
                  fill="#06b6d4"
                  fontSize="11"
                  fontWeight="bold"
                >
                  کف دپوی اطمینان ({toPersianDigits(formatPersianNumber(targets.minClinkerSafetyStock))} تن)
                </text>
              </>
            )}

            {type === 'dispatch' && (
              <>
                <line
                  x1="50"
                  y1={yAxisBase - (targets.targetDailyDispatch / 2000) * chartHeight}
                  x2={svgContentWidth - 30}
                  y2={yAxisBase - (targets.targetDailyDispatch / 2000) * chartHeight}
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <text
                  x="60"
                  y={yAxisBase - (targets.targetDailyDispatch / 2000) * chartHeight - 8}
                  fill="#a855f7"
                  fontSize="11"
                  fontWeight="bold"
                >
                  کف تعهد بارگیری روزانه ({toPersianDigits(formatPersianNumber(targets.targetDailyDispatch))} تن)
                </text>
              </>
            )}

            {/* رسم داده‌های روزانه */}
            {multiMonthDailyRecords.map((d, idx) => {
              const x = 70 + idx * dayBarWidth;
              const barWidth = Math.max(8, dayBarWidth * 0.65);

              if (type === 'oee') {
                const rawOeeH = ((d.oee || 0) / 100) * chartHeight;
                const oeeH = isNaN(rawOeeH) ? 2 : Math.min(chartHeight, rawOeeH);
                const isOk = (d.oee || 0) >= targets.targetKilnOee;
                return (
                  <g
                    key={`${d.periodKey}-${d.dayNumber}-${idx}`}
                    onMouseEnter={(e) => setHoveredPoint({ data: d, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer group"
                  >
                    <rect
                      x={x - barWidth / 2}
                      y={yAxisBase - Math.max(2, oeeH)}
                      width={barWidth}
                      height={Math.max(2, oeeH)}
                      fill={isOk ? '#10b981' : '#f43f5e'}
                      opacity={0.85}
                      rx="2"
                      className="group-hover:opacity-100 transition"
                    />
                    <text x={x} y={yAxisBase + 18} textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">
                      {toPersianDigits(d.dayNumber)}
                    </text>
                    {d.dayNumber === 1 && (
                      <text x={x} y={yAxisBase + 32} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="bold">
                        {toPersianDigits(d.periodKey)}
                      </text>
                    )}
                  </g>
                );
              }

              if (type === 'thermal') {
                const rawStopH = ((d.kilnStopHours || 0) / 24) * chartHeight;
                const stopH = isNaN(rawStopH) ? 0 : Math.min(chartHeight, rawStopH);
                const secClamped = Math.min(1500, Math.max(600, d.secThermal || 800));
                const secY = yAxisBase - ((secClamped - 600) / 900) * chartHeight;
                const isNonCompliant = (d.secThermal || 0) > targets.secThermalMax;

                return (
                  <g
                    key={`${d.periodKey}-${d.dayNumber}-${idx}`}
                    onMouseEnter={(e) => setHoveredPoint({ data: d, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer group"
                  >
                    {(d.kilnStopHours || 0) > 0 && (
                      <rect x={x - (barWidth + 2) / 2} y={yAxisBase - stopH} width={barWidth + 2} height={stopH} fill="#f43f5e" opacity={0.45} rx="2" />
                    )}
                    <circle cx={x} cy={isNaN(secY) ? yAxisBase : secY} r={Math.min(7, Math.max(3.5, barWidth * 0.35))} fill={isNonCompliant ? '#f43f5e' : '#10b981'} stroke="#070a10" strokeWidth="1" />
                    <text x={x} y={yAxisBase + 18} textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">
                      {toPersianDigits(d.dayNumber)}
                    </text>
                  </g>
                );
              }

              if (type === 'runway') {
                const rawStockH = ((d.clinkerStockTon || 60000) / 80000) * chartHeight;
                const stockH = isNaN(rawStockH) ? 0 : Math.min(chartHeight, rawStockH);
                const isSafe = (d.clinkerStockTon || 0) >= targets.minClinkerSafetyStock;
                return (
                  <g
                    key={`${d.periodKey}-${d.dayNumber}-${idx}`}
                    onMouseEnter={(e) => setHoveredPoint({ data: d, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setHoveredPoint(null)}
                    className="cursor-pointer group"
                  >
                    <rect x={x - barWidth / 2} y={yAxisBase - stockH} width={barWidth} height={stockH} fill={isSafe ? '#06b6d4' : '#f59e0b'} rx="2" />
                    <text x={x} y={yAxisBase + 18} textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">
                      {toPersianDigits(d.dayNumber)}
                    </text>
                  </g>
                );
              }

              const rawDispH = ((d.dispatchTon || 0) / 2000) * chartHeight;
              const dispH = isNaN(rawDispH) ? 0 : Math.min(chartHeight, rawDispH);
              const isMet = (d.dispatchTon || 0) >= targets.targetDailyDispatch;
              return (
                <g
                  key={`${d.periodKey}-${d.dayNumber}-${idx}`}
                  onMouseEnter={(e) => setHoveredPoint({ data: d, x: e.clientX, y: e.clientY })}
                  onMouseLeave={() => setHoveredPoint(null)}
                  className="cursor-pointer group"
                >
                  <rect x={x - barWidth / 2} y={yAxisBase - dispH} width={barWidth} height={dispH} fill={isMet ? '#a855f7' : '#f59e0b'} rx="2" />
                  <text x={x} y={yAxisBase + 18} textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">
                    {toPersianDigits(d.dayNumber)}
                  </text>
                </g>
              );
            })}

            {/* خطوط میانگین متحرک */}
            {smaConfigs
              .filter((c) => c.enabled)
              .map((cfg) => {
                const smaValues = calculateSMA(multiMonthDailyRecords, cfg.windowSize, getVal);
                const points = smaValues
                  .map((val, idx) => {
                    if (val === null) return null;
                    const x = 70 + idx * dayBarWidth;
                    let y = yAxisBase;
                    if (type === 'oee') y = yAxisBase - (val / 100) * chartHeight;
                    else if (type === 'thermal') y = yAxisBase - ((Math.min(1500, Math.max(600, val)) - 600) / 900) * chartHeight;
                    else if (type === 'runway') y = yAxisBase - (val / 80000) * chartHeight;
                    else y = yAxisBase - (val / 2000) * chartHeight;
                    return `${x},${y}`;
                  })
                  .filter(Boolean)
                  .join(' ');

                if (!points) return null;

                return (
                  <polyline
                    key={cfg.id}
                    fill="none"
                    stroke={cfg.color}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                );
              })}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn" dir="rtl">
      <div className={`enms-card border border-[var(--color-border)] rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col justify-between overflow-hidden transition-all duration-300 ${getWindowDimensionsClass()}`}>
        {/* ۱. سربرگ مودال */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-3 border-b border-[var(--color-border)] gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-emerald-400">
              {activeModal === 'oee' && <Gauge className="w-5 h-5 text-emerald-400" />}
              {activeModal === 'thermal' && <Flame className="w-5 h-5 text-rose-400" />}
              {activeModal === 'runway' && <Truck className="w-5 h-5 text-cyan-400" />}
              {activeModal === 'dispatch' && <Layers className="w-5 h-5 text-purple-400" />}
              {activeModal === 'all-quad' && <Grid className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[var(--color-text-primary)]">
                {activeModal === 'all-quad' && 'پایش هم‌زمان ماتریس ۴ گانه شاخص‌های کلیدی عملیات (Multi-Trend Quad Matrix)'}
                {activeModal === 'oee' && 'پایش تفصیلی و روند روزانه اثربخشی کلی کوره دوار (OEE Drill-down)'}
                {activeModal === 'thermal' && 'روند همبستگی ساعات توقف خط پخت با جهش مصرف ویژه حرارتی کوره'}
                {activeModal === 'runway' && 'روند تغییرات ذخایر دپوی کلینکر و ارزیابی پایداری تحویل بازار'}
                {activeModal === 'dispatch' && 'روند روزانه بارگیرخانه و دیسپاچینگ انواع سیمان فله و پاکتی'}
              </h3>
              <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                بازه فعال: <span className="text-emerald-400 font-mono font-bold">{toPersianDigits(startPeriod)}</span> تا <span className="text-emerald-400 font-mono font-bold">{toPersianDigits(endPeriod)}</span> ({toPersianDigits(multiMonthDailyRecords.length)} روز متوالی)
              </p>
            </div>
          </div>

          {/* ابزارهای تقویم پاپ‌آپ، فیلترهای سریع و تنظیمات SMA */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* دکمه‌های سریع دوره‌ای */}
            <div className="flex bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-lg p-0.5 text-xs">
              <button
                onClick={() => onQuickFilterChange('current')}
                className={`px-2.5 py-1 rounded-md transition ${quickFilter === 'current' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
              >
                ماه جاری
              </button>
              <button
                onClick={() => onQuickFilterChange('last3m')}
                className={`px-2.5 py-1 rounded-md transition ${quickFilter === 'last3m' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
              >
                فصل جاری (۳ ماه)
              </button>
              <button
                onClick={() => onQuickFilterChange('last6m')}
                className={`px-2.5 py-1 rounded-md transition ${quickFilter === 'last6m' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
              >
                ۶ ماه اخیر
              </button>
              <button
                onClick={() => onQuickFilterChange('all')}
                className={`px-2.5 py-1 rounded-md transition ${quickFilter === 'all' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'}`}
              >
                کل تاریخچه (۲۵ ماه)
              </button>
            </div>

            {/* دکمه بازکردن تقویم پاپ‌آپ انتخابی */}
            <button
              onClick={() => setIsCalendarPickerOpen(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition border ${
                quickFilter === 'custom'
                  ? 'bg-amber-600 text-white border-amber-500 font-bold'
                  : 'bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-card)] text-amber-400 border-[var(--color-border)]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>انتخاب بازه در تقویم</span>
            </button>

            {/* دکمه تنظیم میانگین متحرک X روزه */}
            <button
              onClick={() => setIsSmaSettingsOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-card)] text-cyan-400 border border-[var(--color-border)] text-xs flex items-center gap-1.5 transition"
              title="تنظیم خطوط میانگین متحرک"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>میانگین متحرک ({toPersianDigits(smaConfigs.filter((c) => c.enabled).length)})</span>
            </button>

            {/* سوئیچ بین حالت تکی و ۴ نمودار همزمان */}
            {onModalTypeChange && (
              <button
                onClick={() => onModalTypeChange(activeModal === 'all-quad' ? 'oee' : 'all-quad')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition border cursor-pointer ${
                  activeModal === 'all-quad'
                    ? 'bg-amber-600 text-white border-amber-500'
                    : 'bg-[var(--color-bg-card-subtle)] text-amber-400 border-[var(--color-border)] hover:bg-[var(--color-bg-card)]'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>{activeModal === 'all-quad' ? 'نمای تک‌نمودار' : 'نمایش ۴ نمودار همزمان'}</span>
              </button>
            )}

            {/* زوم و اسکیل افقی روزها */}
            <div className="flex items-center bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-lg p-0.5">
              <button onClick={handleZoomIn} className="p-1 hover:bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] rounded" title="بزرگ‌‌نمایی ستون‌ها">
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleZoomOut} className="p-1 hover:bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] rounded" title="کوچک‌‌نمایی ستون‌ها">
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleResetZoom} className="p-1 hover:bg-[var(--color-bg-card)] text-[var(--color-text-muted)] rounded" title="ریست مقیاس">
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* ابعاد داینامیک پنجره */}
            <div className="flex bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setWindowSize('standard')}
                className={`px-2 py-0.5 rounded transition ${windowSize === 'standard' ? 'bg-[var(--color-primary)] text-white font-bold' : 'text-[var(--color-text-muted)]'}`}
              >
                ۶۰٪
              </button>
              <button
                onClick={() => setWindowSize('large')}
                className={`px-2 py-0.5 rounded transition ${windowSize === 'large' ? 'bg-[var(--color-primary)] text-white font-bold' : 'text-[var(--color-text-muted)]'}`}
              >
                ۸۵٪
              </button>
              <button
                onClick={() => setWindowSize('fullscreen')}
                className={`px-2 py-0.5 rounded transition ${windowSize === 'fullscreen' ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-muted)]'}`}
              >
                ۱۰۰٪
              </button>
            </div>

            <button onClick={onExportExcel || handleExportExcel} className="p-1.5 rounded-lg bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-card)] text-emerald-400 border border-[var(--color-border)] transition" title="خروجی اکسل">
              <Download className="w-4 h-4" />
            </button>

            <button onClick={() => { onClose(); setHoveredPoint(null); }} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ۲. بدنه نمودار */}
        <div className="relative flex-1 w-full my-2 overflow-hidden flex flex-col justify-between">
          {activeModal === 'all-quad' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 h-full overflow-y-auto">
              <div className="bg-[var(--color-bg-card-subtle)] p-2.5 rounded-xl border border-[var(--color-border)] flex flex-col h-[280px]">
                <span className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5" /> ۱. اثربخشی کلی کوره (OEE)
                </span>
                <div className="flex-1">{renderChart('oee', 240)}</div>
              </div>

              <div className="bg-[var(--color-bg-card-subtle)] p-2.5 rounded-xl border border-[var(--color-border)] flex flex-col h-[280px]">
                <span className="text-xs font-bold text-rose-400 mb-1 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" /> ۲. انحراف حرارتی و توقفات خط پخت
                </span>
                <div className="flex-1">{renderChart('thermal', 240)}</div>
              </div>

              <div className="bg-[var(--color-bg-card-subtle)] p-2.5 rounded-xl border border-[var(--color-border)] flex flex-col h-[280px]">
                <span className="text-xs font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5" /> ۳. پایداری دپوی کلینکر (Runway)
                </span>
                <div className="flex-1">{renderChart('runway', 240)}</div>
              </div>

              <div className="bg-[var(--color-bg-card-subtle)] p-2.5 rounded-xl border border-[var(--color-border)] flex flex-col h-[280px]">
                <span className="text-xs font-bold text-purple-400 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> ۴. بارگیرخانه و دیسپاچینگ سیمان
                </span>
                <div className="flex-1">{renderChart('dispatch', 240)}</div>
              </div>
            </div>
          ) : (
            renderChart(activeModal, 480)
          )}
        </div>

        {/* ۳. نوار راهنمای پایین مودال */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[var(--color-text-muted)] px-2 pt-2 border-t border-[var(--color-border)] gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
              <Info className="w-4 h-4 text-emerald-400" />
              جهت مرور روزها، ماوس یا نوار اسکرول را به چپ و راست حرکت دهید.
            </span>
            {smaConfigs
              .filter((c) => c.enabled)
              .map((c) => (
                <span key={c.id} className="flex items-center gap-1 text-[11px] font-mono" style={{ color: c.color }}>
                  <span className="w-3 h-0.5 inline-block" style={{ backgroundColor: c.color }} />
                  {c.label}
                </span>
              ))}
          </div>
          <span className="font-mono text-emerald-400 text-[11px]">
            تعداد روزهای بازه فعال: {toPersianDigits(multiMonthDailyRecords.length)} روز | مقیاس افقی: {toPersianDigits(dayBarWidth)}px
          </span>
        </div>
      </div>

      {/* مودال تقویم پاپ‌آپ انتخابی دوره */}
      {isCalendarPickerOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] w-full max-w-xl rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm text-[var(--color-text-primary)]">انتخاب بازه زمانی ارزیابی در تقویم کارخانه</h4>
              </div>
              <button onClick={() => setIsCalendarPickerOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-muted)]">
              ماه آغازین و ماه پایانی مورد نظر خود را مشخص کنید:
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] block mb-1.5 font-bold">از ماه مبدأ:</label>
                <div className="max-h-52 overflow-y-auto space-y-1 bg-[var(--color-bg-card-subtle)] p-2 rounded-xl border border-[var(--color-border)]">
                  {availableMonthKeys.map((k) => (
                    <button
                      key={`start-${k}`}
                      onClick={() => setPickerStart(k)}
                      className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex justify-between ${
                        pickerStart === k ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]'
                      }`}
                    >
                      <span>دوره {toPersianDigits(k)}</span>
                      {pickerStart === k && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--color-text-secondary)] block mb-1.5 font-bold">تا ماه مقصد:</label>
                <div className="max-h-52 overflow-y-auto space-y-1 bg-[var(--color-bg-card-subtle)] p-2 rounded-xl border border-[var(--color-border)]">
                  {availableMonthKeys.map((k) => (
                    <button
                      key={`end-${k}`}
                      onClick={() => setPickerEnd(k)}
                      className={`w-full text-right px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex justify-between ${
                        pickerEnd === k ? 'bg-emerald-600 text-white font-bold' : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card)]'
                      }`}
                    >
                      <span>دوره {toPersianDigits(k)}</span>
                      {pickerEnd === k && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
              <span className="text-xs text-amber-400 font-mono">
                بازه انتخابی: {toPersianDigits(pickerStart)} تا {toPersianDigits(pickerEnd)}
              </span>
              <button
                onClick={handleApplyCalendarRange}
                className="enms-button enms-button-primary flex items-center gap-1.5 text-xs"
              >
                <Check className="w-4 h-4" />
                <span>اعمال بازه بر روی نمودارها</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* مودال تنظیم میانگین متحرک */}
      {isSmaSettingsOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" dir="rtl">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] w-full max-w-md rounded-2xl p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <h4 className="font-bold text-sm text-[var(--color-text-primary)]">تنظیم خطوط میانگین متحرک سفارشی (Moving Average)</h4>
              </div>
              <button onClick={() => setIsSmaSettingsOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {smaConfigs.map((cfg) => (
                <div key={cfg.id} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={cfg.enabled}
                      onChange={(e) => {
                        setSmaConfigs((prev) =>
                          prev.map((c) => (c.id === cfg.id ? { ...c, enabled: e.target.checked } : c))
                        );
                      }}
                      className="rounded accent-emerald-500 cursor-pointer"
                    />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cfg.color }} />
                    <span className="text-xs text-[var(--color-text-primary)]">{cfg.label}</span>
                  </div>
                  <button
                    onClick={() => setSmaConfigs((prev) => prev.filter((c) => c.id !== cfg.id))}
                    className="text-[var(--color-text-muted)] hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--color-border)] flex items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">افزودن میانگین:</span>
              <input
                type="number"
                min={2}
                max={90}
                value={newSmaDays}
                onChange={(e) => setNewSmaDays(Number(e.target.value))}
                className="enms-input w-16 text-center text-xs font-mono"
              />
              <span className="text-xs text-[var(--color-text-muted)]">روزه</span>
              <button
                onClick={handleAddSma}
                className="mr-auto enms-button enms-button-primary text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tooltip شناور با موس */}
      {hoveredPoint && (
        <div
          className="fixed z-[80] pointer-events-none p-3 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-2xl text-xs text-[var(--color-text-primary)] transform -translate-x-1/2 -translate-y-full mb-3"
          style={{ left: `${hoveredPoint.x}px`, top: `${hoveredPoint.y - 12}px` }}
          dir="rtl"
        >
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-[var(--color-border)] gap-4">
            <span className="font-bold text-emerald-400 font-mono">
              تاریخ: {toPersianDigits(hoveredPoint.data.jalaliDate)} (روز {toPersianDigits(hoveredPoint.data.dayNumber)})
            </span>
            <span className="text-[10px] text-[var(--color-text-muted)] font-mono">دوره: {hoveredPoint.data.periodKey}</span>
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)] font-sans">OEE کوره:</span>
              <span className={hoveredPoint.data.oee >= targets.targetKilnOee ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {toPersianDigits(hoveredPoint.data.oee.toFixed(1))}٪
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)] font-sans">SEC حرارتی:</span>
              <span className={hoveredPoint.data.secThermal > targets.secThermalMax ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {toPersianDigits(Math.round(hoveredPoint.data.secThermal))} kcal/kg
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)] font-sans">تولید کلینکر / توقف:</span>
              <span className="text-[var(--color-text-secondary)]">
                {toPersianDigits(formatPersianNumber(hoveredPoint.data.clinkerTon))} تن / {toPersianDigits(hoveredPoint.data.kilnStopHours.toFixed(1))}h
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[var(--color-text-muted)] font-sans">دپوی کلینکر / دیسپاچ:</span>
              <span className="text-cyan-400">
                {toPersianDigits(formatPersianNumber(hoveredPoint.data.clinkerStockTon))} تن / {toPersianDigits(formatPersianNumber(hoveredPoint.data.dispatchTon))} تن
              </span>
            </div>
            {hoveredPoint.data.kilnStopCauses && (
              <div className="pt-1 mt-1 border-t border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)] font-sans max-w-xs truncate">
                علت: {hoveredPoint.data.kilnStopCauses}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrendDrilldownModal;