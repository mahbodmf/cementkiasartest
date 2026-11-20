import React, { useState } from 'react';
import { BarChart3, Flame, Factory, Zap, Truck } from 'lucide-react';
import { DailyIntegratedRecord, ChartTabType, ACCEPTANCE_CRITERIA } from '../types';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';

export interface OperationsSpcChartsProps {
  records: DailyIntegratedRecord[];
}

export const OperationsSpcCharts: React.FC<OperationsSpcChartsProps> = ({ records }) => {
  const [activeChartTab, setActiveChartTab] = useState<ChartTabType>('thermal');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  const hoveredRecord = hoveredDay !== null ? records.find((x) => x.dayNumber === hoveredDay) : null;

  return (
    <div className="enms-card" dir="rtl">
      {/* سربرگ کنترل چارت‌ها */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4 gap-3">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>پایش نموداری و شماتیک انحرافات عملیات نسبت به شاخص‌های پذیرش (Acceptance Criteria SPC)</span>
          </h3>
          <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
            مقایسه پیوسته روزانه عملکرد خطوط با حدود آستانه استاندارد، خطوط مبنا و ظرفیت‌های نامی
          </p>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveChartTab('thermal')}
            className={`px-2.5 py-1 rounded-md transition text-xs flex items-center gap-1 whitespace-nowrap ${
              activeChartTab === 'thermal'
                ? 'bg-amber-600 text-white font-bold'
                : 'bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>انحراف حرارتی کوره</span>
          </button>
          <button
            onClick={() => setActiveChartTab('production')}
            className={`px-2.5 py-1 rounded-md transition text-xs flex items-center gap-1 whitespace-nowrap ${
              activeChartTab === 'production'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>انحراف تولید از ظرفیت</span>
          </button>
          <button
            onClick={() => setActiveChartTab('electrical')}
            className={`px-2.5 py-1 rounded-md transition text-xs flex items-center gap-1 whitespace-nowrap ${
              activeChartTab === 'electrical'
                ? 'bg-cyan-600 text-white font-bold'
                : 'bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>کنترل‌چارت برق (SPC)</span>
          </button>
          <button
            onClick={() => setActiveChartTab('dispatch')}
            className={`px-2.5 py-1 rounded-md transition text-xs flex items-center gap-1 whitespace-nowrap ${
              activeChartTab === 'dispatch'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>دیسپاچ در برابر کف فروش</span>
          </button>
        </div>
      </div>

      {/* چارت شماتیک فعال */}
      <div className="w-full h-64 overflow-x-auto">
        <svg className="w-full h-full min-w-[720px]" viewBox="0 0 800 220">
          {activeChartTab === 'thermal' && (
            <>
              <line x1="50" y1="120" x2="780" y2="120" stroke="#10b981" strokeWidth="2" strokeDasharray="5 3" />
              <text x="55" y="115" fill="#10b981" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                شاخص پذیرش مجاز: ۸۲۰ kcal/kg (معیار ISIRI 7873)
              </text>
              {records.map((d, idx) => {
                const x = 70 + idx * (700 / (records.length || 1));
                const stopHours = Number(d.kilnStopHours || 0);
                const stopHeight = isNaN(stopHours) ? 0 : Math.min(130, (stopHours / 24) * 130);
                const maxSec = 1500;
                const secVal = Number(d.secThermal || 800);
                const secClamped = Math.min(maxSec, Math.max(600, isNaN(secVal) ? 800 : secVal));
                const secY = 190 - ((secClamped - 600) / (maxSec - 600)) * 140;
                const isNonCompliant = (d.secThermal || 0) > ACCEPTANCE_CRITERIA.secThermalMax;
                const isHovered = hoveredDay === d.dayNumber;

                return (
                  <g
                    key={`${d.jalaliDate || d.dayNumber}-${idx}`}
                    onMouseEnter={() => setHoveredDay(d.dayNumber)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="cursor-pointer"
                  >
                    {stopHours > 0 && (
                      <rect
                        x={x - 7}
                        y={190 - (isNaN(stopHeight) ? 0 : stopHeight)}
                        width="14"
                        height={isNaN(stopHeight) ? 0 : stopHeight}
                        fill="#f43f5e"
                        opacity={isHovered ? 0.8 : 0.45}
                        rx="2"
                      />
                    )}
                    {(d.secThermal || 0) > 0 && (
                      <>
                        <circle
                          cx={x}
                          cy={isNaN(secY) ? 190 : secY}
                          r={isHovered ? '6' : '4'}
                          fill={isNonCompliant ? '#f43f5e' : '#10b981'}
                          stroke="var(--color-bg-card)"
                          strokeWidth="1.5"
                        />
                        {isNonCompliant && (
                          <text
                            x={x}
                            y={(isNaN(secY) ? 190 : secY) - 8}
                            textAnchor="middle"
                            fill="#f43f5e"
                            fontSize="8"
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            +{toPersianDigits(Math.round(d.thermalDeviation || (d.secThermal - 820)))}
                          </text>
                        )}
                      </>
                    )}
                    <text x={x} y="208" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">
                      {toPersianDigits(d.dayNumber)}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {activeChartTab === 'production' && (
            <>
              <line x1="50" y1="110" x2="780" y2="110" stroke="#eab308" strokeWidth="1.5" strokeDasharray="4 4" />
              <text x="55" y="104" fill="#eab308" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                خط مبنای ظرفیت نامی کوره (۲,۰۰۰ تن کلینکر در روز)
              </text>
              {records.map((d, idx) => {
                const x = 70 + idx * (700 / (records.length || 1));
                const deficit = Number(d.clinkerDeficit ?? (Number(d.clinkerTon || 0) - 2000));
                const safeDeficit = isNaN(deficit) ? 0 : deficit;
                const isPositive = safeDeficit >= 0;
                const diffClamped = Math.min(1000, Math.abs(safeDeficit));
                const rawBarHeight = (diffClamped / 1000) * 70;
                const barHeight = Math.max(2, isNaN(rawBarHeight) ? 2 : rawBarHeight);
                const y = isPositive ? 110 - barHeight : 110;
                const isHovered = hoveredDay === d.dayNumber;

                return (
                  <g
                    key={`${d.jalaliDate || d.dayNumber}-${idx}`}
                    onMouseEnter={() => setHoveredDay(d.dayNumber)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x - 7}
                      y={isNaN(y) ? 110 : y}
                      width="14"
                      height={barHeight}
                      fill={isPositive ? '#10b981' : '#f43f5e'}
                      opacity={isHovered ? 1 : 0.8}
                      rx="2"
                    />
                    <text x={x} y="208" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">
                      {toPersianDigits(d.dayNumber)}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {activeChartTab === 'electrical' && (
            <>
              <line x1="50" y1="110" x2="780" y2="110" stroke="#06b6d4" strokeWidth="2" strokeDasharray="5 3" />
              <text x="55" y="105" fill="#06b6d4" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                سقف مجاز پذیرش: ۱۰۵ kWh/t سیمان
              </text>
              {records.map((d, idx) => {
                const x = 70 + idx * (700 / (records.length || 1));
                const maxSec = 150;
                const secClamped = Math.min(maxSec, Math.max(70, d.secElectrical || 100));
                const secY = 190 - ((secClamped - 70) / (maxSec - 70)) * 140;
                const isNonCompliant = d.secElectrical > ACCEPTANCE_CRITERIA.secElectricMax;
                const isHovered = hoveredDay === d.dayNumber;

                return (
                  <g
                    key={`${d.jalaliDate || d.dayNumber}-${idx}`}
                    onMouseEnter={() => setHoveredDay(d.dayNumber)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="cursor-pointer"
                  >
                    <line x1={x} y1="190" x2={x} y2={secY} stroke="var(--color-border)" strokeDasharray="2 2" strokeWidth="1" />
                    <circle
                      cx={x}
                      cy={secY}
                      r={isHovered ? '6' : '4'}
                      fill={isNonCompliant ? '#f43f5e' : '#06b6d4'}
                      stroke="var(--color-bg-card)"
                      strokeWidth="1.5"
                    />
                    <text x={x} y="208" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">
                      {toPersianDigits(d.dayNumber)}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          {activeChartTab === 'dispatch' && (
            <>
              <line x1="50" y1="110" x2="780" y2="110" stroke="#a855f7" strokeWidth="2" strokeDasharray="5 3" />
              <text x="55" y="105" fill="#a855f7" fontSize="10" fontFamily="sans-serif" fontWeight="bold">
                کف تعهد تحویل روزانه: ۱,۰۰۰ تن سیمان
              </text>
              {records.map((d, idx) => {
                const x = 70 + idx * (700 / (records.length || 1));
                const dispVal = Number(d.dispatchTon || 0);
                const barH = isNaN(dispVal) ? 0 : Math.min(140, (dispVal / 1600) * 140);
                const safeBarH = isNaN(barH) ? 0 : barH;
                const isUnder = (d.dispatchTon || 0) < ACCEPTANCE_CRITERIA.targetDailyDispatch;
                const isHovered = hoveredDay === d.dayNumber;

                return (
                  <g
                    key={`${d.jalaliDate || d.dayNumber}-${idx}`}
                    onMouseEnter={() => setHoveredDay(d.dayNumber)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x - 7}
                      y={190 - safeBarH}
                      width="14"
                      height={safeBarH}
                      fill={isUnder ? '#f59e0b' : '#a855f7'}
                      opacity={isHovered ? 1 : 0.8}
                      rx="2"
                    />
                    <text x={x} y="208" textAnchor="middle" fill="#9ca3af" fontSize="9" fontFamily="monospace">
                      {toPersianDigits(d.dayNumber)}
                    </text>
                  </g>
                );
              })}
            </>
          )}

          <line x1="50" y1="190" x2="780" y2="190" stroke="var(--color-border)" strokeWidth="1" />
        </svg>
      </div>

      {/* پنل Tooltip شناور در صورت Hover */}
      {hoveredRecord && (
        <div className="mt-2.5 p-3 rounded-lg bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="font-bold text-[var(--color-text-primary)]">
              روز {toPersianDigits(hoveredRecord.dayNumber)} ({hoveredRecord.jalaliDate})
            </span>
            <span className="text-amber-400 font-mono">
              SEC حرارتی: {toPersianDigits(Math.round(hoveredRecord.secThermal))} kcal/kg
            </span>
            <span className="text-cyan-400 font-mono">
              SEC برق: {toPersianDigits(hoveredRecord.secElectrical.toFixed(1))} kWh/t
            </span>
            <span className="text-emerald-400 font-mono">
              OEE: {toPersianDigits(hoveredRecord.kilnOEE.toFixed(1))}٪
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-mono">
              کلینکر: {toPersianDigits(formatPersianNumber(hoveredRecord.clinkerTon))} تن
            </span>
            <span className="text-rose-400 font-mono">
              توقف کوره: {toPersianDigits(hoveredRecord.kilnStopHours.toFixed(1))} h
            </span>
          </div>
          <div className="text-[11px] text-[var(--color-text-muted)] truncate max-w-full">
            علت: {hoveredRecord.kilnStopCauses || 'عملکرد مداوم و بدون وقفه ثبت‌شده'}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsSpcCharts;
