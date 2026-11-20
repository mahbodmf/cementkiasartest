// =============================================================================
// تایپ‌های جامع آبشار اهداف، فرصت‌های بهبود، اولویت‌بندی AHP و پروژه‌های انرژی
// استاندارد ISO 50001:2018 بند ۶.۲ و ۶.۳
// =============================================================================

export type EnergyObjectivesSubTabId =
  | 'opportunities'
  | 'targets'
  | 'action-plans'
  | 'cascade'
  | 'tracker'
  | 'financial-mv';

// ۱. سیستم اولویت‌بندی چندمعیاره AHP (Analytical Hierarchy Process)
export interface AHPEvaluationData {
  energySavingScore: number;    // ۱ تا ۵ (پتانسیل کاهش مصرف ویژه کوره/آسیاب)
  economicScore: number;        // ۱ تا ۵ (دوره بازگشت سرمایه و توجیه مالی)
  feasibilityRiskScore: number; // ۱ تا ۵ (سهولت اجرا و عدم ریسک توقف خط)
  hseImpactScore: number;       // ۱ تا ۵ (اثرات زیست‌محیطی، غبار و ایمنی)
  supplyChainScore: number;     // ۱ تا ۵ (تأمین داخلی و عدم وابستگی به قطعات خاص)
  finalScore: number;           // نمره نرمال‌شده ۰ تا ۱۰۰
  priorityRank: 'اولویت الف (اقدام فوری)' | 'اولویت ب (کوتاه‌مدت)' | 'اولویت ج (مشروط/بلندمدت)';
}

export interface AHPWeightCriteria {
  energySavingWeight: number;    // پیش‌فرض: ۰.۳۵
  economicWeight: number;        // پیش‌فرض: ۰.۲۵
  feasibilityRiskWeight: number; // پیش‌فرض: ۰.۱۵
  hseImpactWeight: number;       // پیش‌فرض: ۰.۱۵
  supplyChainWeight: number;     // پیش‌فرض: ۰.۱۰
}

// ۲. فرصت‌های بهبود انرژی (Energy Opportunities)
export type OpportunityType = 'بدون هزینه / کم‌هزینه' | 'متوسط' | 'سرمایه‌ای (CAPEX)';
export type OpportunityStatus = 'شناسایی‌شده' | 'ارزیابی‌فنی' | 'تصویب‌شده (تبدیل به پروژه)' | 'رد‌شده';

export interface EnergyOpportunityItem {
  id: string; // e.g. OPP-KLN-01
  title: string;
  department: string;
  targetSEU: string;
  carrier: 'برق' | 'گاز طبیعی' | 'مازوت' | 'هوای فشرده' | string;
  type: OpportunityType;
  description: string;
  estimatedSavingMWh?: number;
  estimatedSavingGJ?: number;
  estimatedFinancialSavingMillionRials: number;
  estimatedCapexMillionRials: number;
  simplePaybackYears: number;
  status: OpportunityStatus;
  promotedToProjectId?: string | null;
  identifiedDate: string;
  identifiedBy: string;
  ahp?: AHPEvaluationData;
}

// ۳. آبشار اهداف کمّی (Goal Cascade با پشتیبانی از اتصال چند به چند و Rollup)
export interface CascadedTargetItem {
  id: string; // e.g. TGT-2026-KLN-01
  strategicCode: string; // کد اصلی (مانند WO-2)
  strategicCodes?: string[]; // پشتیبانی از چند استراتژی کلان همزمان (مانند ['WO-2', 'WO-8'])
  department: string;
  targetSeu: string;
  kpiTitle: string;
  baselineValue: number;
  baselineUnit: string;
  targetValue: number;
  targetUnit: string;
  expectedSavingPct: number;
  deadline: string;
  responsible: string;
  linkedProjectIds: string[]; // پروژه‌های اقدام پشتیبان این هدف
  progressPct?: number; // درصد تحقق محاسباتی خودکار از پایین به بالا (Rollup)
}

// ۴. کارتابل و گانت‌چارت پروژه‌های انرژی (Project & Action Tracker)
export type ProjectPhase = 'طراحی و تأمین' | 'اجرا و نصب' | 'راه‌اندازی و تست' | 'تحویل و صحه‌گذاری' | 'پایان‌یافته';
export type ProjectPriority = 'فوق بحرانی' | 'بالا' | 'متوسط';

export interface EnergyProjectItem {
  id: string; // e.g. PRJ-EN-01
  sourceOpportunityId?: string;
  targetId?: string;
  targetIds?: string[]; // پشتیبانی از اتصال یک پروژه به چند هدف خرد
  title: string;
  department: string;
  targetSEU: string;
  projectManager: string;
  contractor?: string;
  priority: ProjectPriority;
  phase: ProjectPhase;
  startDate: string;
  plannedEndDate: string;
  progressPct: number; // درصد پیشرفت واقعی پروژه (خوراک موتور Rollup)
  capexBudgetMillionRials: number;
  capexSpentMillionRials: number;
  financialVarianceMillionRials: number;
  status: 'در حال پیشرفت' | 'معوق' | 'تحت بررسی' | 'پایان‌یافته';
}

// ۵. ارزیابی مالی و M&V
export interface FinancialAndMVItem {
  projectId: string;
  projectTitle: string;
  mvOption: 'Option A (جداسازی تجهیز)' | 'Option B (اندازه‌گیری تمام پارامترها)' | 'Option C (کل کارخانه/CUSUM)' | 'Option D (شبیه‌سازی)';
  baselinePeriod: string;
  reportingPeriod: string;
  verifiedSavingMWhYear?: number;
  verifiedSavingGJYear?: number;
  verifiedFinancialSavingMillionRialsYear: number;
  npvMillionRials: number;
  irrPct: number;
  paybackActualYears: number;
  mvStatus: 'منطبق بر IPMVP' | 'در حال جمع‌آوری داده' | 'عدم تحقق فرضیات';
  verifier: string;
}

// دیتاست جامع ماژول
export interface EnergyProjectsMasterData {
  summary: {
    totalOpportunitiesCount: number;
    activeProjectsCount: number;
    totalCapexBudgetMillionRials: number;
    totalAnnualFinancialSavingMillionRials: number;
    achievedSavingPct: number;
  };
  opportunities: EnergyOpportunityItem[];
  targetsCascade: CascadedTargetItem[];
  projects: EnergyProjectItem[];
  financialAndMV: FinancialAndMVItem[];
}