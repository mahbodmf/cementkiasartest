export interface EnMSScopeBoundary {
  physicalBoundary: string;
  facilitiesIncluded: string[];
  energyCarriers: {
    name: string;
    type: string;
    unit: string;
    annualConsumption: string;
    meteringPoint: string;
    criticality: 'بحرانی' | 'متوسط' | 'پشتیبان';
  }[];
  exclusions: string[];
  enmsRepresentative: string;
  certificationStatus: string;
}

export interface SWOTIssue {
  id: string;
  category: 'قوت (Strengths)' | 'ضعف (Weaknesses)' | 'فرصت (Opportunities)' | 'تهدید (Threats)';
  type: 'درون‌سازمانی' | 'برون‌سازمانی';
  factor: string;
  impactOnEnMS: string;
  strategicAction: string;
  riskLevel: 'بالا' | 'متوسط' | 'پایین';
}

export interface InterestedParty {
  id: string;
  partyName: string;
  stakeholderType: 'قانونی و حاکمیتی' | 'تأمین‌کننده' | 'مشتری' | 'داخلی و پرسنل' | 'سهامداران';
  needsAndExpectations: string;
  complianceRequirement: string;
  monitoringMechanism: string;
  responsibleUnit: string;
}

export interface SEUEquipment {
  id: string;
  tagNumber: string;
  department: string;
  equipmentName: string;
  ratedPowerKW: number;
  energyCarrier: 'برق ۶۳kV' | 'گاز طبیعی' | 'مازوت' | 'هوای فشرده';
  meterTag: string;
  affectingVariables: string;
  baselineSEC: string;
  currentSEC: string;
  improvementPotentialPct: number;
  seuRank: number; // رتبه اهمیت بارز انرژی
  status: 'عادی' | 'پایش ویژه' | 'هشدار افزایش مصرف';
}

export interface EnergyActionPlan {
  id: string;
  code: string;
  title: string;
  department: string;
  targetSEU: string;
  objective: string;
  responsibleLead: string;
  startDate: string;
  targetDate: string;
  progressPct: number;
  estimatedSavingAnnual: string;
  achievedSavingAnnual: string;
  estimatedCapexRials: string;
  roiMonths: number;
  status: 'در حال اجرا' | 'تکمیل‌شده' | 'برنامه‌ریزی‌شده' | 'پایش اثربخشی';
}

export const contextData: {
  scopeBoundary: EnMSScopeBoundary;
  swotIssues: SWOTIssue[];
  interestedParties: InterestedParty[];
  seuRegistry: SEUEquipment[];
  actionPlans: EnergyActionPlan[];
} = {
  scopeBoundary: {
    physicalBoundary: 'محدوده جغرافیایی و صنعتی کارخانه سیمان به مساحت ۶۸ هکتار واقع در اراضی معدنی، شامل تمامی دپارتمان‌های فرآیندی از سنگ‌شکن تا بارگیرخانه و تأسیسات پشتیبانی.',
    facilitiesIncluded: [
      'معدن و واحد سنگ‌شکن فکی و چکشی (Crusher)',
      'سالن اختلاط و دپوی مواد اولیه (Pre-blending Bed)',
      'آسیاب مواد خام گلوله‌ای و غلطکی عمودی (VRM Raw Mill)',
      'سیلوهای همگن‌سازی مواد خام (Homogenizing Silos)',
      'برج پیش‌گرمکن (Preheater) ۵ مرحله‌ای با کلساینر و کوره دوار پخت کلینکر (Rotary Kiln)',
      'کولر خنک‌کن کلینکر گریت (Grate Cooler)',
      'محوطه دپوی کلینکر و سیلوی ۴۰ هزار تنی کلینکر',
      'آسیاب‌های سیمان مدارهای ۱ و ۲ (Cement Ball Mills)',
      'سیلوهای چهارگانه سیمان و سامانه‌های بارگیری فله و پاکتی (Packing & Dispatch)',
      'پست برق اختصاصی ۶۳ به ۶.۶ کیلوولت و ایستگاه تقلیل فشار گاز CGS'
    ],
    energyCarriers: [
      {
        name: 'انرژی الکتریکی (شبکه سراسری)',
        type: 'برق فشارقوی ۶۳kV',
        unit: 'MWh / سال',
        annualConsumption: '۱۱۵،۰۰۰ مگاوات‌ساعت',
        meteringPoint: 'کنتور دیسپاچینگ پست ۶۳kV (تگ M-E-01)',
        criticality: 'بحرانی'
      },
      {
        name: 'گاز طبیعی (خط لوله فشار قوی)',
        type: 'سوخت اصلی کوره و پیش‌گرمکن',
        unit: 'میلیون مترمکعب Nm³',
        annualConsumption: '۷۸.۵ میلیون مترمکعب',
        meteringPoint: 'کنتور التراسونیک CGS کارخانه (تگ M-G-01)',
        criticality: 'بحرانی'
      },
      {
        name: 'نفت کوره / مازوت (سوخت جایگزین)',
        type: 'سوخت اضطراری فصول سرد',
        unit: 'هزار لیتر',
        annualConsumption: '۸،۵۰۰ مترمکعب (رزرو پدافندی)',
        meteringPoint: 'فلومتر مس کورینولیس دپوی مازوت (تگ M-FO-01)',
        criticality: 'پشتیبان'
      },
      {
        name: 'هوای فشرده صنعتی',
        type: 'انرژی ثانویه محرک غبارگیرها و شیرها',
        unit: 'Nm³ / ساعت',
        annualConsumption: '۴ کمپرسور اسکرو مداوم (۲۵۰kW)',
        meteringPoint: 'فلومتر ورودی خط اصلی هدر هوا (تگ M-CA-01)',
        criticality: 'متوسط'
      }
    ],
    exclusions: [
      'استخراج و بارگیری مواد اولیه در سینه کار معدن توسط ماشین‌آلات دیزلی پیمانکار',
      'ناوگان حمل و نقل سنگین جاده‌ای خارج از گیت کارخانه'
    ],
    enmsRepresentative: 'مهندس ارشد مدیریت انرژی و مدیر امور فنی کارخانه',
    certificationStatus: 'دارای گواهینامه معتبر ISO 50001:2018 با ممیزی مراقبتی سالیانه'
  },
  swotIssues: [
    {
      id: 'SWOT-01',
      category: 'قوت (Strengths)',
      type: 'درون‌سازمانی',
      factor: 'بهره‌برداری از درایوهای فرکانس متغیر (VFD) روی فن‌های اصلی اگزاست کوره و آسیاب مواد',
      impactOnEnMS: 'کاهش ۱۸ درصدی مصرف برق دپارتمان کوره در شرایط تغییرات دبی هوای فرایند',
      strategicAction: 'توسعه استفاده از اینورترهای MV برای فن‌های دمنده هوای خنک‌کن کلینکر',
      riskLevel: 'پایین'
    },
    {
      id: 'SWOT-02',
      category: 'قوت (Strengths)',
      type: 'درون‌سازمانی',
      factor: 'نصب سیستم پایش آنلاین و کنتورهای هوشمند تفکیکی انرژی در تمام تابلوهای ۶.۶kV و ۴۰۰V',
      impactOnEnMS: 'شفافیت کامل خطاهای تراز انرژی، امکان محاسبه لحظه‌ای EnPI و CUSUM',
      strategicAction: 'یکپارچه‌سازی پایگاه داده اسکادا و لاگ‌های PLC با داشبورد مدیریتی لوکر استودیو',
      riskLevel: 'پایین'
    },
    {
      id: 'SWOT-03',
      category: 'ضعف (Weaknesses)',
      type: 'درون‌سازمانی',
      factor: 'افت راندمان آسیاب گلوله‌ای سیمان خط ۱ به دلیل استهلاک دیافراگم و زره‌ها',
      impactOnEnMS: 'افزایش مصرف ویژه برق آسیاب سیمان به بالای ۳۹ kWh/t',
      strategicAction: 'اجرای پروژه بهینه‌سازی بار گلوله، تعویض لاینرها و نصب سیستم رول‌پرس پیش‌خردایش',
      riskLevel: 'بالا'
    },
    {
      id: 'SWOT-04',
      category: 'ضعف (Weaknesses)',
      type: 'درون‌سازمانی',
      factor: 'نشت هوای کاذب در داکت‌های ورودی به پری‌هیتر و سیل‌های ورودی/خروجی کوره دوار',
      impactOnEnMS: 'افزایش مصرف ویژه حرارتی کوره تا حدود ۲۰ kcal/kg.cl به علت گرم کردن هوای سرد نفوذی',
      strategicAction: 'نوسازی آب‌بندی سر و ته کوره (Kiln Inlet/Outlet Seals) در شات‌دان اورهال پاییزه',
      riskLevel: 'متوسط'
    },
    {
      id: 'SWOT-05',
      category: 'فرصت (Opportunities)',
      type: 'برون‌سازمانی',
      factor: 'استفاده از گرمای اتلافی کولر کلینکر و پری‌هیتر برای احداث سامانه بازیافت حرارت (WHR - WHR Power Plant)',
      impactOnEnMS: 'امکان تولید مستقل تا ۲۵٪ از توان الکتریکی مصرفی کل کارخانه بدون سوزاندن سوخت اضافی',
      strategicAction: 'تکمیل امکان‌سنجی فنی-اقتصادی و عقد قرارداد BOT با سرمایه‌گذار نیروگاه WHR',
      riskLevel: 'متوسط'
    },
    {
      id: 'SWOT-06',
      category: 'فرصت (Opportunities)',
      type: 'برون‌سازمانی',
      factor: 'سیاست‌های تشویقی دیسپاچینگ وزارت نیرو برای طرح‌های پاسخگویی بار (Demand Response)',
      impactOnEnMS: 'کسب پاداش مالی و جبران هزینه‌های توقف آسیاب‌های سیمان در ۴ ساعت پیک مصرف روزانه',
      strategicAction: 'انتقال ۱۰۰٪ برنامه کارکرد آسیاب‌های سیمان به ساعات کم‌باری شبانه (۲۳ الی ۷ صبح)',
      riskLevel: 'پایین'
    },
    {
      id: 'SWOT-07',
      category: 'تهدید (Threats)',
      type: 'برون‌سازمانی',
      factor: 'محدودیت‌های ناخواسته دیسپاچینگ برق در اوج بار تابستان و اعمال سهمیه‌بندی مصرف',
      impactOnEnMS: 'توقف‌های اضطراری، افزایش تلفات راه‌اندازی و افت شدید شاخص OEE و بهره‌وری انرژی',
      strategicAction: 'هماهنگی ظرفیت تولید کلینکر با حداکثر دپوی مجاز و اورهال خطوط در دوره پیک',
      riskLevel: 'بالا'
    },
    {
      id: 'SWOT-08',
      category: 'تهدید (Threats)',
      type: 'برون‌سازمانی',
      factor: 'افت فشار یا قطعی گاز طبیعی در فصول سرد و الزام به استفاده از مازوت',
      impactOnEnMS: 'افزایش هزینه انرژی، نیاز به پیش‌گرمایش مازوت و چالش‌های زیست‌محیطی SOx',
      strategicAction: 'نگهداری بهینه مشعل دوگانه‌سوز کوره، عایق‌کاری مخازن سوخت مایع و پایش کیفیت اگزاست',
      riskLevel: 'بالا'
    }
  ],
  interestedParties: [
    {
      id: 'IP-01',
      partyName: 'شرکت مدیریت شبکه برق ایران (توانیر / برق منطقه‌ای)',
      stakeholderType: 'قانونی و حاکمیتی',
      needsAndExpectations: 'رعایت سقف دیماند قراردادی (۲۵ مگاوات)، مدیریت ضریب بار، مشارکت در برنامه‌های کاهش اوج بار تابستان',
      complianceRequirement: 'قانون مانع‌زدایی از توسعه صنعت برق، مصوبات پیک‌سایی هیئت دولت',
      monitoringMechanism: 'داده‌های تله‌متری کنتور هوشمند بازار برق، لاگ‌های روزانه اپراتور پست',
      responsibleUnit: 'امور انرژی و مدیریت نگهداری و تعمیرات برق'
    },
    {
      id: 'IP-02',
      partyName: 'شرکت ملی گاز ایران (منطقه انتقال و گاز استانی)',
      stakeholderType: 'تأمین‌کننده',
      needsAndExpectations: 'رعایت تعهدات برداشت روزانه گاز بر مبنای قرارداد صنعتی و مدیریت مصرف در دوره سرما',
      complianceRequirement: 'قرارداد تأمین خوراک گاز صنعتی، دستورالعمل‌های مدیریت بحران انرژی',
      monitoringMechanism: 'کنتور التراسونیک CGS، ثبت آنلاین دبی، فشار و دمای گاز ورودی',
      responsibleUnit: 'مدیریت بهره‌برداری و رئیس ایستگاه گاز'
    },
    {
      id: 'IP-03',
      partyName: 'سازمان حفاظت محیط زیست و سازمان ملی استاندارد',
      stakeholderType: 'قانونی و حاکمیتی',
      needsAndExpectations: 'کنترل غلظت آلاینده‌های خروجی دودکش (CO, NOx, SO2, گردوغبار) و رعایت استاندارد ملی معیار مصرف انرژی (استاندارد ۷۸۷۳)',
      complianceRequirement: 'استاندارد ملی معیار مصرف ویژه انرژی در صنعت سیمان (INSO 7873)، سیستم پایش لحظه‌ای CEMS',
      monitoringMechanism: 'نمونه‌برداری دوره‌ای آزمایشگاه معتمد، سامانه آنلاین پایش دودکش',
      responsibleUnit: 'واحد HSE و آزمایشگاه کنترل کیفیت و محیط زیست'
    },
    {
      id: 'IP-04',
      partyName: 'هیئت مدیره و سهامداران شرکت سیمان',
      stakeholderType: 'سهامداران',
      needsAndExpectations: 'کاهش بهای تمام‌شده کلینکر و سیمان از طریق صرفه‌جویی هزینه‌های انرژی و بازگشت سرمایه پروژه‌ها',
      complianceRequirement: 'تعهدات بودجه سالانه مصوب، گزارش‌های ادواری بازنگری مدیریت EnMS',
      monitoringMechanism: 'شاخص‌های EnPI ماهانه، نسبت هزینه انرژی به درآمد کل، گزارشات حسابرسی انرژی',
      responsibleUnit: 'کمیته راهبری مدیریت انرژی و معاونت مالی-اقتصادی'
    },
    {
      id: 'IP-05',
      partyName: 'پرسنل و اپراتورهای اتاق کنترل مرکزی (CCR)',
      stakeholderType: 'داخلی و پرسنل',
      needsAndExpectations: 'ارتقای آموزش‌های حرفه‌ای اپراتوری انرژی‌محور، تثبیت پارامترهای پایدار کوره، پاداش‌های بهره‌وری انرژی',
      complianceRequirement: 'آیین‌نامه‌های عملیاتی بهره‌برداری بهینه کوره و آسیاب‌ها بر مبنای ISO 50001',
      monitoringMechanism: 'ارزیابی مستمر شیفت‌های کاری، مسابقات صرفه‌جویی انرژی و کاهش توقفات',
      responsibleUnit: 'امور آموزش و منابع انسانی و مدیر تولید'
    }
  ],
  seuRegistry: [
    {
      id: 'SEU-01',
      tagNumber: 'K-01-M01',
      department: 'پخت و کوره (Pyroprocessing)',
      equipmentName: 'کوره دوار پخت کلینکر و مشعل اصلی چندکاناله (Rotary Kiln & Main Burner)',
      ratedPowerKW: 680,
      energyCarrier: 'گاز طبیعی',
      meterTag: 'FIC-GAS-K01 / M-E-KILN',
      affectingVariables: 'تناژ خوراک کوره (t/h)، ارزش حرارتی گاز، درصد اکسیژن ورودی/خروجی، کیفیت مواد خام (LSF, SM)',
      baselineSEC: '۸۸۸.۰ kcal/kg.cl',
      currentSEC: '۸۷۸.۴ kcal/kg.cl',
      improvementPotentialPct: 3.2,
      seuRank: 1,
      status: 'عادی'
    },
    {
      id: 'SEU-02',
      tagNumber: 'CM-01-M01',
      department: 'آسیای سیمان (Cement Grinding)',
      equipmentName: 'الکتروموتور اصلی آسیاب گلوله‌ای سیمان خط ۱ (Cement Ball Mill Motor)',
      ratedPowerKW: 3800,
      energyCarrier: 'برق ۶۳kV',
      meterTag: 'M-E-CM01',
      affectingVariables: 'نرمی سیمان (بلین cm²/g)، درصد کلینکر به پوزولان، رطوبت گچ، نرخ تغذیه تناژ بر ساعت',
      baselineSEC: '۳۸.۵ kWh/t',
      currentSEC: '۳۹.۲ kWh/t',
      improvementPotentialPct: 4.8,
      seuRank: 2,
      status: 'هشدار افزایش مصرف'
    },
    {
      id: 'SEU-03',
      tagNumber: 'CM-02-M01',
      department: 'آسیای سیمان (Cement Grinding)',
      equipmentName: 'الکتروموتور اصلی آسیاب سیمان خط ۲ (Cement Ball Mill 2 Motor)',
      ratedPowerKW: 3800,
      energyCarrier: 'برق ۶۳kV',
      meterTag: 'M-E-CM02',
      affectingVariables: 'تیپ سیمان (تیپ ۲، پوزولانی)، ضریب پرشدگی گلوله‌ها، سایش زره‌ها، جریان برگشتی سپراتور',
      baselineSEC: '۳۷.۰ kWh/t',
      currentSEC: '۳۶.۴ kWh/t',
      improvementPotentialPct: 2.5,
      seuRank: 3,
      status: 'عادی'
    },
    {
      id: 'SEU-04',
      tagNumber: 'RM-01-M01',
      department: 'آسیای مواد خام (Raw Material Grinding)',
      equipmentName: 'آسیاب غلتکی عمودی مواد خام (VRM Raw Mill Motor)',
      ratedPowerKW: 3200,
      energyCarrier: 'برق ۶۳kV',
      meterTag: 'M-E-RM01',
      affectingVariables: 'سختی سنگ آهک (Hardgrove Index)، رطوبت ورودی، فشار غلتک‌های هیدرولیک، دمای گاز ورودی از کوره',
      baselineSEC: '۲۴.۵ kWh/t',
      currentSEC: '۲۳.۹ kWh/t',
      improvementPotentialPct: 3.0,
      seuRank: 4,
      status: 'عادی'
    },
    {
      id: 'SEU-05',
      tagNumber: 'ID-01-M01',
      department: 'پخت و کوره (Pyroprocessing)',
      equipmentName: 'فن مکنده اصلی اگزاست کوره (Preheater ID Fan)',
      ratedPowerKW: 2400,
      energyCarrier: 'برق ۶۳kV',
      meterTag: 'M-E-IDFAN',
      affectingVariables: 'دبی گازهای خروجی (m³/h)، افت فشار سیکلون‌های پری‌هیتر، دور درایو VFD، افت دمای سیستم',
      baselineSEC: '۸.۵ kWh/t cl',
      currentSEC: '۸.۱ kWh/t cl',
      improvementPotentialPct: 4.0,
      seuRank: 5,
      status: 'عادی'
    },
    {
      id: 'SEU-06',
      tagNumber: 'GC-01-M01',
      department: 'خنک‌کن کلینکر (Clinker Cooler)',
      equipmentName: 'فن‌های زیر گریت خنک‌کن کلینکر (Cooler Under-grate Fans)',
      ratedPowerKW: 1650,
      energyCarrier: 'برق ۶۳kV',
      meterTag: 'M-E-COOLER',
      affectingVariables: 'ضخامت بستر کلینکر، دمای هوای ثانویه و ترشری بازیافتی به کوره و کلساینر',
      baselineSEC: '۵.۵ kWh/t cl',
      currentSEC: '۵.۶ kWh/t cl',
      improvementPotentialPct: 5.5,
      seuRank: 6,
      status: 'پایش ویژه'
    },
    {
      id: 'SEU-07',
      tagNumber: 'CR-01-M01',
      department: 'سنگ‌شکن (Limestone Crusher)',
      equipmentName: 'سنگ‌شکن چکشی ثانویه سنگ آهک و بوکسیت (Limestone Crusher)',
      ratedPowerKW: 1100,
      energyCarrier: 'برق ۶۳kV',
      meterTag: 'M-E-CRUSH',
      affectingVariables: 'ابعاد ورودی سنگ معدن، سایش چکش‌ها و گریت‌بارها، نرخ خوراک‌دهی هاپر ورودی',
      baselineSEC: '۲.۲ kWh/t',
      currentSEC: '۲.۱ kWh/t',
      improvementPotentialPct: 4.5,
      seuRank: 7,
      status: 'عادی'
    },
    {
      id: 'SEU-08',
      tagNumber: 'UT-CA-01',
      department: 'یوتیلیتی و بارگیرخانه (Utilities & Dispatch)',
      equipmentName: 'سامانه تأمین هوای فشرده و غبارگیرهای بگ‌هاوس (Compressors & Baghouses)',
      ratedPowerKW: 1400,
      energyCarrier: 'هوای فشرده',
      meterTag: 'M-E-UTIL',
      affectingVariables: 'نشتی اتصالات خطوط هوا، افت فشار دیفرانسیلی کیسه‌ها (Delta-P)، زمان پالس تمیزکاری',
      baselineSEC: '۳.۲ kWh/t',
      currentSEC: '۳.۴ kWh/t',
      improvementPotentialPct: 8.0,
      seuRank: 8,
      status: 'پایش ویژه'
    }
  ],
  actionPlans: [
    {
      id: 'AP-01',
      code: 'EnOP-1405-01',
      title: 'بهینه‌سازی سیستم هوادهی و تعویض پره‌های فن اگزاست پری‌هیتر با مدل فوق‌کم‌مصرف',
      department: 'پخت و کوره',
      targetSEU: 'فن مکنده اصلی اگزاست کوره (ID-01-M01)',
      objective: 'کاهش ۰.۶ kWh به ازای هر تن کلینکر از طریق ارتقای ایرودینامیک پره‌ها و کاهش افت اصطکاکی',
      responsibleLead: 'رئیس تعمیرات مکانیک و سرپرست بهینه‌سازی فرایند',
      startDate: '۱۴۰۵/۰۲/۱۵',
      targetDate: '۱۴۰۵/۰۷/۳۰',
      progressPct: 85,
      estimatedSavingAnnual: '۸۵۰ مگاوات‌ساعت / سال (معادل ۴.۲ میلیارد ریال)',
      achievedSavingAnnual: '۷۲۰ مگاوات‌ساعت (تحقق‌یافته تا این مرحله)',
      estimatedCapexRials: '۵،۵۰۰،۰۰۰،۰۰۰ ریال',
      roiMonths: 15,
      status: 'در حال اجرا'
    },
    {
      id: 'AP-02',
      code: 'EnOP-1405-02',
      title: 'اصلاح الگوی شارژ گلوله‌های فولادی و تنظیم شیب دیافراگم آسیاب سیمان خط ۱',
      department: 'آسیای سیمان',
      targetSEU: 'الکتروموتور اصلی آسیاب سیمان ۱ (CM-01-M01)',
      objective: 'کاهش مصرف ویژه برق از ۳۹.۲ به ۳۷.۵ kWh/t سیمان تولیدی',
      responsibleLead: 'مدیر تولید سیمان و کارشناس متالورژی سایش',
      startDate: '۱۴۰۵/۰۳/۰۱',
      targetDate: '۱۴۰۵/۰۵/۲۰',
      progressPct: 100,
      estimatedSavingAnnual: '۱،۲۰۰ مگاوات‌ساعت / سال (معادل ۶.۱ میلیارد ریال)',
      achievedSavingAnnual: '۱،۲۵۰ مگاوات‌ساعت / سال (فراتر از تارگت)',
      estimatedCapexRials: '۲،۱۰۰،۰۰۰،۰۰۰ ریال',
      roiMonths: 4,
      status: 'تکمیل‌شده'
    },
    {
      id: 'AP-03',
      code: 'EnOP-1405-03',
      title: 'نصب سیل‌های دوبل مکانیکی گرافیتی در ورودی و خروجی کوره دوار جهت حذف نفوذ هوای کاذب',
      department: 'پخت و کوره',
      targetSEU: 'کوره دوار پخت کلینکر (K-01-M01)',
      objective: 'کاهش ۱۵ kcal/kg.cl در مصرف سوخت گاز طبیعی کوره با جلوگیری از ورود هوای محیط',
      responsibleLead: 'سرپرست تعمیرات خط پخت و مهندسی احتراق',
      startDate: '۱۴۰۵/۰۴/۱۰',
      targetDate: '۱۴۰۵/۰۸/۱۵',
      progressPct: 60,
      estimatedSavingAnnual: '۱.۴ میلیون مترمکعب گاز طبیعی (معادل ۵.۸ میلیارد ریال)',
      achievedSavingAnnual: 'در مرحله نصب مکانیکی',
      estimatedCapexRials: '۷،۸۰۰،۰۰۰،۰۰۰ ریال',
      roiMonths: 16,
      status: 'در حال اجرا'
    },
    {
      id: 'AP-04',
      code: 'EnOP-1405-04',
      title: 'پویش جامع نشت‌یابی التراسونیک شبکه هوای فشرده و تعویض رگلاتورها و شیرهای بادی فرسوده',
      department: 'یوتیلیتی و بارگیرخانه',
      targetSEU: 'سامانه تأمین هوای فشرده (UT-CA-01)',
      objective: 'رفع ۱۲ فقره نشتی هوای فشرده در واحد بارگیرخانه و غبارگیرها و کاهش ۲۰٪ بار کمپرسورها',
      responsibleLead: 'مهندس ارشد تأسیسات و ابزاردقیق',
      startDate: '۱۴۰۵/۰۵/۰۱',
      targetDate: '۱۴۰۵/۰۶/۱۵',
      progressPct: 100,
      estimatedSavingAnnual: '۲۸۰ مگاوات‌ساعت / سال (معادل ۱.۴ میلیارد ریال)',
      achievedSavingAnnual: '۳۱۰ مگاوات‌ساعت / سال',
      estimatedCapexRials: '۶۵۰،۰۰۰،۰۰۰ ریال',
      roiMonths: 6,
      status: 'پایش اثربخشی'
    },
    {
      id: 'AP-05',
      code: 'EnOP-1405-05',
      title: 'پروژه استقرار سیستم بازیافت حرارت اتلافی (Waste Heat Recovery - WHR Power Plant)',
      department: 'پروژه‌های مهندسی و توسعه',
      targetSEU: 'کولر کلینکر و اگزاست پری‌هیتر',
      objective: 'تولید ۵.۵ مگاوات برق پاک از گازهای داغ اگزاست و تأمین ۲۵٪ برق کارخانه',
      responsibleLead: 'مدیر فنی، معاونت پروژه‌ها و مشاور ارشد انرژی',
      startDate: '۱۴۰۵/۰۱/۱۵',
      targetDate: '۱۴۰۶/۰۴/۳۰',
      progressPct: 35,
      estimatedSavingAnnual: '۲۸،۰۰۰ مگاوات‌ساعت / سال (معادل ۱۴۰ میلیارد ریال)',
      achievedSavingAnnual: 'در مرحله مهندسی تفصیلی و خرید بویلرها',
      estimatedCapexRials: '۸۵۰،۰۰۰،۰۰۰،۰۰۰ ریال',
      roiMonths: 42,
      status: 'برنامه‌ریزی‌شده'
    }
  ]
};
