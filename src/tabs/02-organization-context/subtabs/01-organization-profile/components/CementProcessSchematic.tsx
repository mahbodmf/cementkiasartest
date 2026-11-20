import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Flame,
  Wind,
  Layers,
  Sparkles,
  CheckCircle,
} from 'lucide-react';

interface CementProcessSchematicProps {
  selectedDeptHighlight: string | null;
  onSelectDeptHighlight: (dept: string | null) => void;
}

type LayerMode = 'all' | 'thermal' | 'electrical' | 'materials';

interface ProcessUnit {
  id: string;
  deptKey: string;
  name: string;
  subTitle: string;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'quarry' | 'crusher' | 'stockpile' | 'rawmill' | 'cfsilo' | 'preheater' | 'kiln' | 'cooler' | 'clinkersilo' | 'cementmill' | 'dispatch';
  electricLoad: string;
  thermalLoad: string;
  isSEU: boolean;
  notes: string;
}

const UNITS: ProcessUnit[] = [
  {
    id: 'u1',
    deptKey: 'معدن',
    name: 'معدن سنگ‌آهک و خاک',
    subTitle: 'استخراج، بارگیری و دامپ‌تراک',
    x: 3,
    y: 8,
    w: 12,
    h: 16,
    type: 'quarry',
    electricLoad: 'دیزل / ۳۰ kW',
    thermalLoad: '-',
    isSEU: false,
    notes: 'استخراج از معادن اختصاصی کارخانه کیاسر با فاصله ۵ کیلومتری',
  },
  {
    id: 'u2',
    deptKey: 'سنگ شکن',
    name: 'سنگ‌شکن چکشی (Crusher)',
    subTitle: 'خردایش اولیه تا زیر ۲۵ میلی‌متر',
    x: 18,
    y: 8,
    w: 13,
    h: 16,
    type: 'crusher',
    electricLoad: '۴۵۰ kW',
    thermalLoad: '-',
    isSEU: true,
    notes: 'ظرفیت خردایش ۸۰۰ تن در ساعت سنگ آهک و آلوویوم',
  },
  {
    id: 'u3',
    deptKey: 'سالن اختلاط',
    name: 'سالن اختلاط (Stockpile)',
    subTitle: 'انباشت و برداشت زیگزاگی مواد',
    x: 34,
    y: 8,
    w: 14,
    h: 16,
    type: 'stockpile',
    electricLoad: 'استاکر/ریکلایمر ۱۸۰ kW',
    thermalLoad: '-',
    isSEU: false,
    notes: 'یکنواخت‌سازی عیار شیمیایی LSF و مدول‌های سیلیسی',
  },
  {
    id: 'u4',
    deptKey: 'آسیای مواد',
    name: 'آسیای غلتکی مواد خام (VRM)',
    subTitle: 'سایش و خشکایش همزمان پودر مواد',
    x: 52,
    y: 8,
    w: 15,
    h: 16,
    type: 'rawmill',
    electricLoad: '۲,۸۰۰ kW (SEU برق)',
    thermalLoad: 'گاز داغ خروجی کوره',
    isSEU: true,
    notes: 'خشک‌کردن رطوبت با گاز ۳۲۰ درجه خروجی پری‌هیتر',
  },
  {
    id: 'u5',
    deptKey: 'سیلو مواد',
    name: 'سیلوهای خوراک کوره (CF Silo)',
    subTitle: 'همگن‌سازی پنوماتیک و ذخیره پودر',
    x: 70,
    y: 8,
    w: 13,
    h: 16,
    type: 'cfsilo',
    electricLoad: 'الواتور و بلوئر ۲۰۰ kW',
    thermalLoad: '-',
    isSEU: false,
    notes: 'سیلوی ذخیره با ظرفیت ۶,۰۰۰ تن خوراک همگن آماده پخت',
  },
  {
    id: 'u6',
    deptKey: 'کوره',
    name: 'برج پیش‌گرمکن و کلساینر',
    subTitle: 'سیکلون‌های ۵ مرحله‌ای + کلسایناسیون',
    x: 85,
    y: 18,
    w: 12,
    h: 34,
    type: 'preheater',
    electricLoad: 'فن اصلی ID Fan ۱,۲۵۰ kW',
    thermalLoad: 'سوخت کلساینر (~۶۰٪ حرارت)',
    isSEU: true,
    notes: 'کربنات‌زدایی تا ۹۰٪ قبل از ورود مواد به لوله کوره',
  },
  {
    id: 'u7',
    deptKey: 'کوره',
    name: 'کوره دوار پخت (Rotary Kiln)',
    subTitle: 'پخت کلینکر در دمای ۱۴۵۰°C',
    x: 48,
    y: 45,
    w: 34,
    h: 15,
    type: 'kiln',
    electricLoad: 'درایو کوره و فن‌ها ۴۸۰ kW',
    thermalLoad: 'مشعل اصلی (~۴۰٪ گاز/مازوت)',
    isSEU: true,
    notes: 'منطقه سینترینگ و تشکیل فازهای آلیت C3S و بلیت C2S',
  },
  {
    id: 'u8',
    deptKey: 'کولر',
    name: 'خنک‌کن گریت کولر (Cooler)',
    subTitle: 'کوئنچ سریع و بازیابی هوای ثانویه',
    x: 32,
    y: 44,
    w: 14,
    h: 17,
    type: 'cooler',
    electricLoad: 'فن‌های زیر گریت ۷۵۰ kW',
    thermalLoad: 'هوای ثانویه و ثالثیه بازیافتی',
    isSEU: true,
    notes: 'تثبیت فازهای کریستالی و انتقال هوای ۹۰۰°C به کلساینر',
  },
  {
    id: 'u9',
    deptKey: 'سیلو کلینکر',
    name: 'سیلو و دپوی کلینکر',
    subTitle: 'سیلوهای استوانه‌ای ۴۰,۰۰۰ تنی',
    x: 16,
    y: 45,
    w: 13,
    h: 16,
    type: 'clinkersilo',
    electricLoad: 'الواتورهای دیپ‌باکت ۹۰ kW',
    thermalLoad: '-',
    isSEU: false,
    notes: 'ذخیره‌سازی میانی کلینکر جهت تثبیت و خنک‌سازی نهایی',
  },
  {
    id: 'u10',
    deptKey: 'آسیای سیمان',
    name: 'آسیای گلوله‌ای و سپراتور',
    subTitle: 'سایش سیمان، پودر سنگ، گچ و پوزولان',
    x: 20,
    y: 74,
    w: 22,
    h: 17,
    type: 'cementmill',
    electricLoad: '۳,۲۰۰ kW (SEU اصلی برق)',
    thermalLoad: '-',
    isSEU: true,
    notes: 'بزرگ‌ترین مصرف‌کننده برق کارخانه (~۳۵٪ دیماند کل)',
  },
  {
    id: 'u11',
    deptKey: 'بارگیرخانه',
    name: 'سیلوهای سیمان و پکینگ',
    subTitle: 'بارگیری تانکر فله و کیسه ۵۰kg',
    x: 52,
    y: 74,
    w: 20,
    h: 17,
    type: 'dispatch',
    electricLoad: 'روتاری پکر و نوارها ۱۶۰ kW',
    thermalLoad: '-',
    isSEU: false,
    notes: '۴ خط پکینگ روتاری اتوماتیک و باسکول‌های تحویل جاده‌ای',
  },
];

export const CementProcessSchematic: React.FC<CementProcessSchematicProps> = ({
  selectedDeptHighlight,
  onSelectDeptHighlight,
}) => {
  const [activeLayer, setActiveLayer] = useState<LayerMode>('all');
  const [inspectedUnit, setInspectedUnit] = useState<ProcessUnit>(UNITS[6]);

  const handleUnitClick = (unit: ProcessUnit) => {
    setInspectedUnit(unit);
    if (selectedDeptHighlight === unit.deptKey) {
      onSelectDeptHighlight(null);
    } else {
      onSelectDeptHighlight(unit.deptKey);
    }
  };

  const showMaterials = activeLayer === 'all' || activeLayer === 'materials';
  const showThermal = activeLayer === 'all' || activeLayer === 'thermal';
  const showElectrical = activeLayer === 'all' || activeLayer === 'electrical';

  return (
    <div className="enms-card overflow-hidden">
      {/* سربرگ کنترل لایه‌ها */}
      <div className="enms-card-header flex-wrap gap-3 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[var(--color-primary-bg)] text-[var(--color-primary)] border border-[var(--color-primary-border)]">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="enms-card-title text-sm sm:text-base">
              نقشه سیناپتیک خط تولید سیمان کیاسر و دیاگرام جریان انرژی (Industrial Synoptic P&ID)
            </h3>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              جریان مواد، حلقه‌های حرارتی مشعل‌ها، کانال هوای ثالثیه و شبکه توان الکتریکی تجهیزات بارز (SEUs)
            </p>
          </div>
        </div>

        {/* فیلتر سوئیچ لایه‌ها */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-xs">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              activeLayer === 'all'
                ? 'bg-[var(--color-primary)] text-slate-950 shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            نمای جامع خط
          </button>
          <button
            onClick={() => setActiveLayer('thermal')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
              activeLayer === 'thermal'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-rose-500'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>مدار سوخت و حرارت</span>
          </button>
          <button
            onClick={() => setActiveLayer('electrical')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
              activeLayer === 'electrical'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-amber-500'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>شبکه برق و درایوها</span>
          </button>
          <button
            onClick={() => setActiveLayer('materials')}
            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer ${
              activeLayer === 'materials'
                ? 'bg-sky-500 text-slate-950 shadow-xs'
                : 'text-[var(--color-text-muted)] hover:text-sky-500'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>مسیر مواد</span>
          </button>
        </div>
      </div>

      {/* بوم اصلی داینامیک: رنگ پس‌زمینه متناسب با تم تغییر می‌کند */}
      <div className="relative w-full rounded-2xl bg-[var(--color-bg-viewport)] border border-[var(--color-border)] overflow-hidden shadow-inner p-2 sm:p-4 transition-colors">
        {/* گرید مهندسی پس‌زمینه که با رنگ حاشیه‌ها منطبق است */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, var(--color-border-strong, #64748b) 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* کادر شناور HUD وضعیت تجهیز بازرسی‌شده در گوشه بوم */}
        <div className="absolute top-3 left-3 z-30 max-w-xs p-3 rounded-xl bg-[var(--color-bg-surface)]/95 border border-[var(--color-border)] backdrop-blur-md shadow-xl text-xs space-y-1.5 hidden md:block transition-colors">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-1.5">
            <span className="font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              {inspectedUnit.name}
            </span>
            {inspectedUnit.isSEU ? (
              <span className="enms-badge badge-danger text-[9px] py-0 px-1.5">تجهیز SEU</span>
            ) : (
              <span className="enms-badge badge-neutral text-[9px] py-0 px-1.5">واحد جانبی</span>
            )}
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] leading-tight">{inspectedUnit.subTitle}</p>
          <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono pt-1">
            <div className="p-1.5 rounded bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
              <span className="text-amber-500 block font-sans">توان الکتریکی:</span>
              <span className="text-[var(--color-text-primary)] font-bold">{inspectedUnit.electricLoad}</span>
            </div>
            <div className="p-1.5 rounded bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
              <span className="text-rose-500 block font-sans">انرژی حرارتی:</span>
              <span className="text-[var(--color-text-primary)] font-bold">{inspectedUnit.thermalLoad}</span>
            </div>
          </div>
          <p className="text-[10px] text-[var(--color-text-muted)] italic pt-1 border-t border-[var(--color-border-subtle)]">
            {inspectedUnit.notes}
          </p>
        </div>

        {/* دیاگرام کامل گرافیکی SVG هماهنگ با تم تیره و روشن */}
        <div className="relative w-full aspect-[16/9] min-h-[460px] select-none">
          <svg className="w-full h-full" viewBox="0 0 1000 560" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* گرادینت شعله کوره */}
              <linearGradient id="kilnFlameGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.8" />
              </linearGradient>

              {/* گرادینت بدنه کوره دوار هماهنگ با تم */}
              <linearGradient id="kilnShellGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="var(--color-border-strong, #64748b)" />
                <stop offset="50%" stopColor="var(--color-bg-surface, #1e293b)" />
                <stop offset="100%" stopColor="var(--color-bg-card-subtle, #0f172a)" />
              </linearGradient>

              <style>{`
                @keyframes dashMove {
                  to { stroke-dashoffset: -40; }
                }
                .flow-dash-thermal {
                  stroke-dasharray: 6 6;
                  animation: dashMove 1.4s linear infinite;
                }
                .flow-dash-materials {
                  stroke-dasharray: 5 5;
                  animation: dashMove 2.2s linear infinite;
                }
                @keyframes pulseFlame {
                  0%, 100% { transform: scale(1); opacity: 0.9; }
                  50% { transform: scale(1.08) translateX(3px); opacity: 1; }
                }
                .flame-anim {
                  transform-origin: 750px 285px;
                  animation: pulseFlame 1s ease-in-out infinite;
                }
              `}</style>
            </defs>

            {/* ۱. لایه خطوط لوله‌کشی و جریان مواد خام و کلینکر */}
            {showMaterials && (
              <g id="materials-flow" opacity="0.85">
                <path d="M 140 85 L 340 85" stroke="var(--color-border-strong, #94a3b8)" strokeWidth="4" strokeLinecap="round" />
                <path d="M 140 85 L 340 85" stroke="#38bdf8" strokeWidth="2" className="flow-dash-materials" />

                <path d="M 480 85 L 530 85" stroke="var(--color-border-strong, #94a3b8)" strokeWidth="4" />
                <path d="M 480 85 L 530 85" stroke="#38bdf8" strokeWidth="2" className="flow-dash-materials" />

                <path d="M 670 85 L 710 85" stroke="var(--color-border-strong, #94a3b8)" strokeWidth="4" />
                <path d="M 670 85 L 710 85" stroke="#38bdf8" strokeWidth="2" className="flow-dash-materials" />

                <path d="M 830 85 L 890 85 L 890 130" stroke="var(--color-border-strong, #94a3b8)" strokeWidth="4" strokeLinejoin="round" />

                <path d="M 865 240 L 810 270" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />

                <path d="M 500 290 L 440 290" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" />

                <path d="M 330 290 L 270 290" stroke="var(--color-border-strong, #94a3b8)" strokeWidth="4" />
                <path d="M 330 290 L 270 290" stroke="#f59e0b" strokeWidth="2" className="flow-dash-materials" />

                <path d="M 210 330 L 210 420" stroke="var(--color-border-strong, #94a3b8)" strokeWidth="4" />
                <path d="M 210 330 L 210 420" stroke="#f59e0b" strokeWidth="2" className="flow-dash-materials" />

                <path d="M 420 440 L 530 440" stroke="var(--color-border-strong, #94a3b8)" strokeWidth="4" />
                <path d="M 420 440 L 530 440" stroke="#10b981" strokeWidth="2" className="flow-dash-materials" />
              </g>
            )}

            {/* ۲. لایه مدارهای حرارتی، سوخت و هوای ثالثیه */}
            {showThermal && (
              <g id="thermal-energy-loops">
                <path d="M 810 360 L 790 310 L 760 290" stroke="#ef4444" strokeWidth="3" strokeLinejoin="round" />
                <circle cx="810" cy="360" r="4" fill="#ef4444" />
                <text x="820" y="365" fill="#ef4444" fontSize="10" fontFamily="sans-serif" fontWeight="bold">گاز طبیعی مشعل</text>

                {/* کانال هوای ثالثیه (TAD) */}
                <path
                  d="M 400 240 L 400 200 L 840 200 L 850 220"
                  stroke="#f97316"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M 400 240 L 400 200 L 840 200 L 850 220"
                  stroke="#fde047"
                  strokeWidth="2"
                  className="flow-dash-thermal"
                />
                <rect x="570" y="185" width="130" height="18" rx="4" fill="var(--color-bg-surface)" stroke="#f97316" strokeWidth="1" />
                <text x="578" y="198" fill="#f97316" fontSize="10" fontWeight="bold">کانال هوای ثالثیه (TAD)</text>

                {/* گاز داغ کوره به آسیای مواد */}
                <path
                  d="M 890 120 L 890 40 L 610 40 L 610 65"
                  stroke="#0284c7"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <path
                  d="M 890 120 L 890 40 L 610 40 L 610 65"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  className="flow-dash-thermal"
                />
                <rect x="690" y="28" width="165" height="18" rx="4" fill="var(--color-bg-surface)" stroke="#0284c7" strokeWidth="1" />
                <text x="698" y="41" fill="#0284c7" fontSize="9.5" fontWeight="bold">گاز داغ کوره به آسیای مواد (۳۲۰°C)</text>
              </g>
            )}

            {/* ۳. لایه شبکه برق فشار متوسط و اتصالات درایوهای توان‌بالا (SEU) */}
            {showElectrical && (
              <g id="electrical-bus">
                <rect x="50" y="200" width="80" height="45" rx="6" fill="var(--color-bg-surface)" stroke="#eab308" strokeWidth="2" />
                <text x="58" y="222" fill="#ca8a04" fontSize="10" fontWeight="bold">پست برق ۶۳kV</text>
                <text x="63" y="236" fill="#eab308" fontSize="8" fontFamily="monospace">63 / 6.3 kV Sub</text>

                <path d="M 130 215 L 590 215 L 590 115" stroke="#eab308" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M 130 225 L 750 225 L 750 260" stroke="#eab308" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M 90 245 L 90 440 L 190 440" stroke="#eab308" strokeWidth="2" strokeDasharray="3 3" />
              </g>
            )}

            {/* ۴. ترسیم گرافیکی نمادین تجهیزات فرآیندی با استایل‌های تم‌محور */}
            
            {/* واحد کوره دوار پخت (Rotary Kiln) */}
            <g id="rotary-kiln-graphic">
              <rect x="540" y="305" width="22" height="25" fill="var(--color-border-strong)" rx="2" />
              <rect x="680" y="305" width="22" height="25" fill="var(--color-border-strong)" rx="2" />
              <circle cx="551" cy="305" r="7" fill="var(--color-border)" />
              <circle cx="691" cy="305" r="7" fill="var(--color-border)" />

              <g transform="rotate(-3.5 650 285)">
                <rect
                  x="480"
                  y="268"
                  width="330"
                  height="34"
                  rx="6"
                  fill="url(#kilnShellGrad)"
                  stroke="var(--color-border-strong)"
                  strokeWidth="2"
                />
                <rect x="535" y="264" width="12" height="42" rx="2" fill="var(--color-border)" />
                <rect x="675" y="264" width="12" height="42" rx="2" fill="var(--color-border)" />
                <rect x="760" y="264" width="12" height="42" rx="2" fill="var(--color-border)" />
                <rect x="610" y="263" width="14" height="44" rx="2" fill="#eab308" opacity="0.9" />

                <path
                  className="flame-anim"
                  d="M 750 285 Q 700 278 640 285 Q 700 292 750 285 Z"
                  fill="url(#kilnFlameGrad)"
                />
              </g>

              <path d="M 470 260 L 500 260 L 500 315 L 470 315 Z" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="2" />
              <path d="M 800 250 L 830 250 L 830 305 L 800 305 Z" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="2" />
            </g>

            {/* برج ۵ مرحله‌ای پیش‌گرمکن */}
            <g id="preheater-tower-graphic" transform="translate(850, 110)">
              <rect x="0" y="0" width="95" height="185" rx="8" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="2" />
              {[20, 50, 80, 110, 140].map((cy, idx) => (
                <g key={idx} transform={`translate(15, ${cy})`}>
                  <path d="M 10 0 L 55 0 L 45 18 L 20 18 Z" fill="var(--color-bg-card-subtle)" stroke="var(--color-border)" strokeWidth="1" />
                  <circle cx="32" cy="0" r="8" fill="var(--color-border)" />
                  <text x="28" y="4" fill="var(--color-text-secondary)" fontSize="7" fontWeight="bold">C{5 - idx}</text>
                </g>
              ))}
              <text x="14" y="175" fill="#ef4444" fontSize="9" fontWeight="bold">کلساینر SLC</text>
            </g>

            {/* خنک‌کن گریت کولر */}
            <g id="cooler-graphic" transform="translate(320, 270)">
              <path d="M 10 10 L 130 10 L 110 50 L 10 50 Z" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="2" />
              {[25, 55, 85].map((fx, i) => (
                <g key={i} transform={`translate(${fx}, 55)`}>
                  <circle cx="8" cy="8" r="8" fill="var(--color-bg-surface)" stroke="#0284c7" strokeWidth="1.5" />
                  <path d="M 8 3 L 8 13 M 3 8 L 13 8" stroke="#0284c7" strokeWidth="1.5" />
                </g>
              ))}
            </g>

            {/* آسیای سیمان گلوله‌ای و سپراتور */}
            <g id="cement-mill-graphic" transform="translate(200, 420)">
              <rect x="20" y="10" width="130" height="38" rx="8" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="2" />
              <line x1="85" y1="10" x2="85" y2="48" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="2 2" />
              <text x="35" y="32" fill="var(--color-text-muted)" fontSize="8">اتاقک ۱</text>
              <text x="95" y="32" fill="var(--color-text-muted)" fontSize="8">اتاقک ۲</text>

              <path d="M 160 5 L 195 5 L 185 45 L 170 45 Z" fill="var(--color-bg-card-subtle)" stroke="#eab308" strokeWidth="2" />
              <text x="162" y="28" fill="#ca8a04" fontSize="8" fontWeight="bold">سپراتور</text>
            </g>

            {/* آسیای عمودی مواد خام */}
            <g id="rawmill-graphic" transform="translate(530, 50)">
              <rect x="10" y="10" width="75" height="50" rx="6" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="2" />
              <circle cx="35" cy="35" r="14" fill="var(--color-bg-card-subtle)" stroke="#eab308" strokeWidth="2" />
              <circle cx="60" cy="35" r="14" fill="var(--color-bg-card-subtle)" stroke="#eab308" strokeWidth="2" />
              <text x="22" y="55" fill="#ca8a04" fontSize="8" fontWeight="bold">غلتک‌های سایش</text>
            </g>

            {/* سیلوهای ذخیره */}
            <g id="silos-graphic">
              <g transform="translate(710, 60)">
                <rect x="5" y="5" width="55" height="55" rx="5" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="2" />
                <path d="M 5 50 L 32 68 L 60 50 Z" fill="var(--color-bg-card-subtle)" />
                <text x="12" y="32" fill="var(--color-text-primary)" fontSize="9" fontWeight="bold">سیلوی CF</text>
              </g>
              <g transform="translate(170, 260)">
                <rect x="5" y="5" width="55" height="55" rx="6" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="2" />
                <path d="M 5 50 L 32 68 L 60 50 Z" fill="var(--color-bg-card-subtle)" />
                <text x="10" y="32" fill="var(--color-text-primary)" fontSize="8.5" fontWeight="bold">سیلوی کلینکر</text>
              </g>
              <g transform="translate(540, 420)">
                <rect x="5" y="5" width="45" height="55" rx="4" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="2" />
                <rect x="55" y="5" width="45" height="55" rx="4" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="2" />
                <text x="12" y="32" fill="var(--color-text-primary)" fontSize="8" fontWeight="bold">تیپ ۲</text>
                <text x="62" y="32" fill="var(--color-text-primary)" fontSize="8" fontWeight="bold">پوزولانی</text>
              </g>
            </g>

            {/* بارگیرخانه */}
            <g id="dispatch-truck" transform="translate(660, 435)">
              <rect x="5" y="10" width="45" height="25" rx="3" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="1.5" />
              <rect x="50" y="18" width="16" height="17" rx="2" fill="#0284c7" />
              <circle cx="20" cy="38" r="5" fill="var(--color-border-strong)" />
              <circle cx="40" cy="38" r="5" fill="var(--color-border-strong)" />
              <circle cx="58" cy="38" r="5" fill="var(--color-border-strong)" />
              <text x="10" y="26" fill="var(--color-text-primary)" fontSize="7.5" fontWeight="bold">سیمان فله</text>
            </g>

            {/* پایل اختلاط مواد */}
            <g id="stockpile-graphic" transform="translate(340, 60)">
              <path d="M 10 55 Q 70 5 130 55 Z" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="2" />
              <line x1="70" y1="5" x2="70" y2="55" stroke="#eab308" strokeWidth="2" />
              <text x="35" y="45" fill="var(--color-text-primary)" fontSize="9" fontWeight="bold">پایل اختلاط مواد</text>
            </g>

            {/* سنگ‌شکن */}
            <g id="crusher-graphic" transform="translate(180, 60)">
              <polygon points="10,10 60,10 50,55 20,55" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="2" />
              <circle cx="35" cy="32" r="10" fill="var(--color-bg-card-subtle)" stroke="#eab308" strokeWidth="1.5" />
              <text x="18" y="28" fill="var(--color-text-primary)" fontSize="7.5">Crusher</text>
            </g>
          </svg>

          {/* لایه نقاط قابل کلیک با رنگ‌بندی داینامیک */}
          {UNITS.map((unit) => {
            const isHighlighted = selectedDeptHighlight === unit.deptKey;
            const isInspected = inspectedUnit.id === unit.id;

            return (
              <div
                key={unit.id}
                onClick={() => handleUnitClick(unit)}
                style={{
                  left: `${unit.x}%`,
                  top: `${unit.y}%`,
                  width: `${unit.w}%`,
                  height: `${unit.h}%`,
                }}
                className={`absolute z-20 rounded-xl cursor-pointer transition-all duration-300 p-1 flex flex-col justify-between ${
                  isHighlighted
                    ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary-bg)] shadow-md'
                    : isInspected
                    ? 'ring-2 ring-sky-500 bg-sky-500/10'
                    : 'hover:ring-1 hover:ring-[var(--color-border-strong)] bg-[var(--color-bg-card)]/60'
                }`}
                title={`کلیک برای تحلیل: ${unit.name}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[9px] font-mono px-1 rounded bg-[var(--color-bg-card-subtle)] text-[var(--color-text-muted)] border border-[var(--color-border-subtle)]">
                    {unit.id.toUpperCase()}
                  </span>
                  {unit.isSEU && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="مصرف‌کننده بارز انرژی (SEU)" />
                  )}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-[var(--color-text-primary)] block truncate">
                    {unit.name}
                  </span>
                  <div className="flex items-center gap-1 text-[8.5px] font-mono text-[var(--color-text-muted)]">
                    {unit.electricLoad !== '-' && <Zap className="w-2.5 h-2.5 text-amber-500" />}
                    {unit.thermalLoad !== '-' && <Flame className="w-2.5 h-2.5 text-rose-500" />}
                    <span className="truncate">{unit.electricLoad}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* نوار پایین: سنجه‌های موازنه انرژی */}
      <div className="mt-4 pt-3 border-t border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] block">انرژی حرارتی کوره و کلساینر:</span>
            <strong className="text-rose-500 font-mono text-sm block mt-0.5">۷۹۸.۲ kcal/kg</strong>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-sans">منطبق بر استاندارد ملی ۷۸۷۳ (معیار ۸۲۰)</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] block">مصرف ویژه برق کل کارخانه:</span>
            <strong className="text-amber-500 font-mono text-sm block mt-0.5">۱۰۲.۴ kWh/ton</strong>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-sans">بهبود ۲.۵٪ نسبت به خط مبنای انرژی</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500 shrink-0">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] block">بازیافت حرارت هوای ثالثیه:</span>
            <strong className="text-sky-500 font-mono text-sm block mt-0.5">~۹۰۰ °C ورودی کلساینر</strong>
            <span className="text-[10px] text-[var(--color-text-muted)] block font-sans">کاهش ۲۲٪ در مصرف سوخت مشعل اصلی</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-[var(--color-primary-bg)] text-[var(--color-primary)] shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[11px] text-[var(--color-text-muted)] block">انطباق دامنه شمول ISO 50001:</span>
            <strong className="text-[var(--color-primary)] font-mono text-sm block mt-0.5">۱۰۰٪ تجهیزات بارز (SEU)</strong>
            <span className="text-[10px] text-[var(--color-text-muted)] block font-sans">پوشش کامل خط پخت و آسیاها</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CementProcessSchematic;