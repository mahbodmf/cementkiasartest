import { AIScope, AIRagKnowledgeChunk } from './types';

// پایگاه دانش مرجع تخصصی صنعت سیمان مطابق Best Available Techniques (BAT)
export const DOMAIN_BAT_KNOWLEDGE: AIRagKnowledgeChunk[] = [
  {
    id: 'BAT-KLN-01',
    scope: 'opportunity-analysis',
    category: 'کوره و پیروپروسس',
    department: 'کوره و خنک‌کن',
    targetSEU: 'کوره دوار و کولر (SEU-01)',
    carrier: 'گاز طبیعی',
    type: 'سرمایه‌ای (CAPEX)',
    title: 'اصلاح هوابندی کولر و نسوزکاری پیش‌گرمکن',
    content: 'کاهش اتلاف حرارتی تشعشعی و مهار ورود هوای کاذب سرد با استفاده از سیل‌های فنری گرافیکی و عایق‌کاری سیکلون ۴ و ۵ کوره. کاهش ۵ تا ۸ درصدی مصرف ویژه حرارتی کلینکر.',
    description: 'کاهش اتلاف حرارتی تشعشعی و مهار ورود هوای کاذب سرد با استفاده از سیل‌های فنری گرافیکی و عایق‌کاری سیکلون ۴ و ۵ کوره. کاهش ۵ تا ۸ درصدی مصرف ویژه حرارتی کلینکر.',
    keywords: ['کوره', 'سیل', 'گریت کولر', 'گاز طبیعی', 'پیش‌گرمکن', 'هوای کاذب'],
    estCapexMillionRials: 85000,
    estSavingMillionRials: 62000,
    estSavingGJ: 125000,
    benchmarks: {
      typicalCapexRials: 85000,
      typicalSavingRials: 62000,
      paybackYears: 1.37,
      ahpScores: { saving: 5, eco: 4, risk: 4, hse: 4, supply: 4 },
    },
  },
  {
    id: 'BAT-RM-02',
    scope: 'opportunity-analysis',
    category: 'سایش مواد خام',
    department: 'آسیاب مواد خام',
    targetSEU: 'الکتروفن آسیاب مواد خام (SEU-03)',
    carrier: 'برق',
    type: 'متوسط',
    title: 'نصب اینورتر ولتاژ متوسط روی فن سیرکولاسیون آسیاب مواد',
    content: 'جایگزینی کنترل دبی مکانیکی دمپر با درایو فرکانس متغیر (VFD) توان ۱۶۰۰ کیلووات. جلوگیری از اتلاف فشار دینامیکی و افت ولتاژ شبکه برق.',
    description: 'جایگزینی کنترل دبی مکانیکی دمپر با درایو فرکانس متغیر (VFD) توان ۱۶۰۰ کیلووات. جلوگیری از اتلاف فشار دینامیکی و افت ولتاژ شبکه برق.',
    keywords: ['آسیاب مواد', 'VFD', 'اینورتر', 'برق', 'فن', 'دمپر'],
    estCapexMillionRials: 42000,
    estSavingMillionRials: 36000,
    estSavingMWh: 2400,
    benchmarks: {
      typicalCapexRials: 42000,
      typicalSavingRials: 36000,
      paybackYears: 1.16,
      ahpScores: { saving: 4, eco: 4, risk: 4, hse: 3, supply: 3 },
    },
  },
  {
    id: 'BAT-CM-03',
    scope: 'opportunity-analysis',
    category: 'سایش و دیسپاچینگ سیمان',
    department: 'آسیاب سیمان',
    targetSEU: 'آسیاب گلوله‌ای سیمان (SEU-04)',
    carrier: 'برق',
    type: 'بدون هزینه / کم‌هزینه',
    title: 'بهینه‌سازی طبقه‌بندی شارژ بار گلوله و دیافراگم میانی آسیاب سیمان',
    content: 'تنظیم دقیق گرادیان دانه‌بندی بار شارژ در محفظه ۱ و ۲ آسیاب گلوله‌ای، تعویض صفحات دیافراگم غربالی و بهبود راندمان سپراتور نسل سوم برای کاهش مصرف ویژه سایش سیمان به کمتر از ۳۴ کیلووات‌ساعت بر تن.',
    description: 'تنظیم دقیق گرادیان دانه‌بندی بار شارژ در محفظه ۱ و ۲ آسیاب گلوله‌ای، تعویض صفحات دیافراگم غربالی و بهبود راندمان سپراتور نسل سوم برای کاهش مصرف ویژه سایش سیمان به کمتر از ۳۴ کیلووات‌ساعت بر تن.',
    keywords: ['آسیاب سیمان', 'گلوله', 'دیافراگم', 'لاینر', 'سپراتور', 'برق'],
    estCapexMillionRials: 8000,
    estSavingMillionRials: 16500,
    estSavingMWh: 1100,
    benchmarks: {
      typicalCapexRials: 8000,
      typicalSavingRials: 16500,
      paybackYears: 0.48,
      ahpScores: { saving: 4, eco: 5, risk: 5, hse: 3, supply: 5 },
    },
  },
  {
    id: 'BAT-UTL-04',
    scope: 'opportunity-analysis',
    category: 'تاسیسات عمومی و هوای فشرده',
    department: 'تاسیسات و یوتیلیتی',
    targetSEU: 'ایستگاه کمپرسورهای اسکرو (SEU-05)',
    carrier: 'هوای فشرده',
    type: 'بدون هزینه / کم‌هزینه',
    title: 'نشت‌یابی و مدیریت فشار شبکه هوای فشرده مرکزی',
    content: 'بازرسی آکوستیک اولتراسونیک شبکه انتقال هوای فشرده، نوسازی اتصالات شیلنگ‌ها، نصب تله‌های میعانات اتوماتیک بدون اتلاف هوا و کاهش فشار خط از ۷.۵ به ۶.۲ بار.',
    description: 'بازرسی آکوستیک اولتراسونیک شبکه انتقال هوای فشرده، نوسازی اتصالات شیلنگ‌ها، نصب تله‌های میعانات اتوماتیک بدون اتلاف هوا و کاهش فشار خط از ۷.۵ به ۶.۲ بار.',
    keywords: ['هوای فشرده', 'کمپرسور', 'نشتی', 'یوتیلیتی', 'برق'],
    estCapexMillionRials: 3500,
    estSavingMillionRials: 9750,
    estSavingMWh: 650,
    benchmarks: {
      typicalCapexRials: 3500,
      typicalSavingRials: 9750,
      paybackYears: 0.35,
      ahpScores: { saving: 3, eco: 5, risk: 5, hse: 3, supply: 5 },
    },
  },
];

export const CEMENT_BAT_KNOWLEDGE_STORE = DOMAIN_BAT_KNOWLEDGE;

/**
 * موتور استخراج زمینه و تزریق محدودیت‌های دامنه‌ای (Context Guardrail)
 */
export class AIRagContextEngine {
  /**
   * بازخوانی تکه‌های دانش بر اساس حوزه سوال، دپارتمان و کلمات کلیدی
   */
  public static retrieveRelevantKnowledge(
    scope: AIScope,
    department?: string,
    queryText: string = ''
  ): AIRagKnowledgeChunk[] {
    const normalizedQuery = queryText.toLowerCase();

    return DOMAIN_BAT_KNOWLEDGE.filter((chunk) => {
      if (chunk.scope !== scope) return false;

      // فیلتر بر اساس دپارتمان در صورت تعیین شدن
      if (department && chunk.department && chunk.department !== department) {
        return false;
      }

      // جستجو در کلمات کلیدی
      const hasKeywordMatch = chunk.keywords.some((kw) =>
        normalizedQuery.includes(kw.toLowerCase())
      );

      return hasKeywordMatch || !queryText;
    });
  }

  /**
   * آماده‌سازی پرامپت مهندسی محافظت‌شده با گاردریل استاندارد ISO 50001
   */
  public static buildSystemPromptWithGuardrails(scope: AIScope, department?: string): string {
    return [
      'شما دستیار ارشد هوش مصنوعی و ممیز رسمی سیستم مدیریت انرژی (ISO 50001:2018) در کارخانه سیمان کیاسر هستید.',
      'قوانین و محدودیت‌های قطعی دامنه پاسخ‌دهی:',
      '۱. تمامی پیشنهادات و راهکارها باید منحصراً در چارچوب صنعت تولید کلینکر و سیمان باشد.',
      '۲. محاسبات مالی باید بر حسب میلیون ریال و دوره‌های بازگشت سرمایه بر حسب سال برآورد شوند.',
      '۳. معیارهای ارزیابی باید دقیقاً بر مبنای ۵ فاکتور AHP باشد: پتانسیل انرژی، بازگشت سرمایه، سهولت اجرا/عدم توقف، HSE و تأمین قطعات داخل.',
      department ? `۴. محدوده بررسی شما به طور خاص محدود به واحد: "${department}" است و نباید به دپارتمان‌های نامرتبط بپردازید.` : '',
      '۵. در پاسخ‌ها لحن مهندسی، عددی، ساختاریافته و بدون حاشیه‌پردازی داشته باشید.',
    ].filter(Boolean).join('\n');
  }
}