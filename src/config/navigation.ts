export interface SubTabConfig {
  id: string;
  title: string;
  iconName: string;
}

export interface MainTabConfig {
  id: string;
  title: string;
  shortTitle: string;
  iconName: string;
  subTabs?: SubTabConfig[];
}

export const NAVIGATION_CONFIG: {
  systemTitle?: string;
  systemSubtitle?: string;
  standardBadge?: string;
  sidebarLogoTitle?: string;
  sidebarLogoSubtitle?: string;
  mainTabs: MainTabConfig[];
} = {
  systemTitle: 'سامانه جامع پایش و مدیریت انرژی',
  systemSubtitle: 'کارخانه سیمان کیاسر (ISO 50001:2018)',
  standardBadge: 'ISO 50001:2018 EnMS',
  sidebarLogoTitle: 'سیمان کیاسر',
  sidebarLogoSubtitle: 'مدیریت استراتژیک انرژی',
  mainTabs: [
    {
      id: 'executive',
      title: 'داشبورد کلان مدیریتی',
      shortTitle: 'داشبورد مدیریتی',
      iconName: 'LayoutDashboard',
    },
    {
      id: '02-organization-context',
      title: 'بافت سازمان و راهبرد کلان',
      shortTitle: 'بافت سازمان',
      iconName: 'Building2',
      subTabs: [
        { id: 'org-profile', title: 'شناسنامه و محدوده شمول', iconName: 'FileText' },
        { id: 'scope', title: 'تحلیل بافت سازمان', iconName: 'Compass' },
        { id: 'stakeholders', title: 'ماتریس ذینفعان انرژی', iconName: 'Users' },
        { id: 'legal-requirements', title: 'الزامات قانونی و مقرراتی', iconName: 'Scale' },
        { id: 'energy-policy', title: 'خط‌مشی جامع انرژی', iconName: 'ShieldCheck' },
        { id: 'bsc', title: 'کارت امتیازی متوازن (BSC)', iconName: 'BarChart' },
      ],
    },
    {
      id: 'operations',
      title: 'عملیات تولید و بهره‌برداری',
      shortTitle: 'عملیات کارخانه',
      iconName: 'Factory',
      subTabs: [
        { id: 'production', title: 'پایش و مدیریت تولید', iconName: 'LineChart' },
        { id: 'stops', title: 'پایش توقفات و کارکرد خطوط', iconName: 'Clock' },
        { id: 'dispatch', title: 'تحویل، دیسپاچ و بارگیرخانه', iconName: 'Truck' },
        { id: 'intelligence', title: 'هوش عملیات و تحلیل OEE', iconName: 'Activity' },
      ],
    },
    {
      id: '03-energy-review',
      title: 'بازنگری انرژی و تحلیل SEU',
      shortTitle: 'بازنگری انرژی',
      iconName: 'Zap',
      subTabs: [
        { id: 'departments', title: 'دپارتمان‌ها و شناسنامه تجهیزات', iconName: 'Layers' },
        { id: 'energy-ingestion', title: 'ورودی مصارف انرژی', iconName: 'Fuel' },
        { id: 'variables', title: 'متغیرهای مرتبط و همبستگی', iconName: 'BarChart2' },
        { id: 'efficiency-opportunities', title: 'راندمان و فرصت‌های بهینه‌سازی', iconName: 'TrendingUp' },
        { id: 'competence-persons', title: 'افراد کلیدی و شایستگی', iconName: 'UserCheck' },
      ],
    },
    {
      id: '04-energy-performance',
      title: 'پایش عملکرد، خطوط مبنا و تحلیل',
      shortTitle: 'پایش عملکرد',
      iconName: 'Activity',
      subTabs: [
        { id: 'cusum', title: 'پایش انحرافات و CUSUM', iconName: 'TrendingDown' },
        { id: 'enpis', title: 'شاخص‌های عملکرد انرژی (EnPIs)', iconName: 'Gauge' },
        { id: 'electrical', title: 'تفکیک مصارف برق دپارتمان‌ها', iconName: 'Zap' },
        { id: 'operations', title: 'بهره‌برداری و توقفات اضطراری', iconName: 'Factory' },
        { id: 'inventory', title: 'سیلوها و تحویل سیمان', iconName: 'Database' },
        { id: 'baseline', title: 'خطوط مبنا و تحلیل رگرسیون', iconName: 'GitCommit' },
      ],
    },
    {
      id: '05-energy-committee',
      title: 'کمیته عالی انرژی و بازنگری مدیریت',
      shortTitle: 'کمیته انرژی',
      iconName: 'Users2',
      subTabs: [
        { id: 'charter', title: 'نظام‌نامه و آیین‌نامه کمیته', iconName: 'BookOpen' },
        { id: 'members', title: 'اعضای کمیته و ماتریس مسئولیت', iconName: 'ShieldCheck' },
      ],
    },
    {
      id: '06-energy-objectives-projects',
      title: 'اهداف، فرصت‌ها و پروژه‌های انرژی',
      shortTitle: 'پروژه‌های بهبود',
      iconName: 'Target',
      subTabs: [
        { id: 'opportunities', title: 'بانک فرصت‌های بهبود', iconName: 'Lightbulb' },
        { id: 'targets', title: 'آبشار و شکست اهداف', iconName: 'GitPullRequest' },
      ],
    },
    {
      id: '07-google-drive',
      title: 'اسناد ابری و Google Drive',
      shortTitle: 'Google Drive',
      iconName: 'HardDrive',
    },
  ],
};