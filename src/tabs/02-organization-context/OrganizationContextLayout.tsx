import React, { useState, useEffect } from 'react';
import {
  FileText,
  Compass,
  Users,
  Scale,
  ShieldCheck,
  BarChart,
  Download,
  Upload,
  Edit3,
} from 'lucide-react';
import {
  ContextSubTabId,
  OrganizationProfile,
  OrganizationSwot,
  OrganizationStakeholder,
  OrganizationLegalRequirement,
} from '../../types';

// ۱. ایمپورت قطعی کامپوننت‌های ۶ ساب‌تب موجود در پوشه‌های شماره‌گذاری‌شده
import OrganizationProfileView from './subtabs/01-organization-profile';
import InternalExternalIssuesView from './subtabs/02-internal-external-issues';
import StakeholdersView from './subtabs/03-stakeholders';
import LegalRequirementsView from './subtabs/04-legal-requirements';
import PolicyStrategyView from './subtabs/05-policy-strategy';
import StrategicObjectivesBscView from './subtabs/06-strategic-objectives-bsc';

import { safeFetchPublicJson } from '../../services/configService';

export interface OrganizationContextLayoutProps {
  activeSubTab?: ContextSubTabId | string;
  onSubTabChange?: (subTab: ContextSubTabId) => void;
}

const defaultProfile: OrganizationProfile = {
  companyName: 'شرکت صنایع سیمان کیاسر (سهامی عام)',
  plantLocation: 'مازندران، شهرستان ساری، بخش چهاردانگه، کیلومتر ۴۵ جاده ساری - سمنان، کیاسر',
  clinkerCapacityTpd: 2000,
  cementCapacityTpd: 2300,
  scopeStatement: 'دامنه سیستم مدیریت انرژی شرکت سیمان کیاسر، دربرگیرنده کلیه فرآیندها، فعالیت‌ها، تجهیزات و تأسیسات پشتیبان مرتبط با تولید سیمان تیپ ۲ در بخش صنعتی کارخانه می‌باشد.',
  physicalBoundary: 'محدوده فنس کارخانه سیمان کیاسر به مساحت ۴۵ هکتار، ابنیه صنعتی خط تولید، سیلوها، ایستگاه تقلیل فشار گاز CGS، پست‌های برق ۱ تا ۵، دپوی مواد اولیه و بارگیرخانه',
  processBoundary: 'کلیه فرآیندهای صنعتی از ورود سنگ‌آهک به سنگ‌شکن تا سایش مواد خام، پیش‌گرمکن و خط پخت کلینکر، سایش سیمان، ذخیره‌سازی در سیلوها و بارگیری فله و پاکتی',
  boundariesMatrix: [],
  energySources: [],
  departments: [],
};

const defaultSwot: OrganizationSwot = {
  internalStrengths: [],
  internalWeaknesses: [],
  externalOpportunities: [],
  externalThreats: [],
};

export const OrganizationContextLayout: React.FC<OrganizationContextLayoutProps> = ({
  activeSubTab = 'scope',
  onSubTabChange,
}) => {
  // ۲. جدول جامع تبدیل تمامی شناسه‌های احتمالی سایدبار و نوار افقی
  const normalizeTabKey = (key: string): string => {
    switch (key) {
      case 'org-profile':
      case 'profile':
      case '01':
      case '01-organization-profile':
        return 'profile';

      case 'scope':
      case 'context':
      case 'context-analysis':
      case '02':
      case '02-internal-external-issues':
        return 'context';

      case 'stakeholders':
      case '03':
      case '03-stakeholders':
        return 'stakeholders';

      case 'legal-requirements':
      case 'legal':
      case '04':
      case '04-legal-requirements':
        return 'legal';

      case 'energy-policy':
      case 'policy':
      case '05':
      case '05-policy-strategy':
        return 'policy';

      case 'bsc':
      case 'strategic-objectives-bsc':
      case '06':
      case '06-strategic-objectives-bsc':
        return 'bsc';

      default:
        return 'context';
    }
  };

  const [currentTab, setCurrentTab] = useState<string>(() => normalizeTabKey(activeSubTab as string));
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // استیت‌های داده‌ای ساب‌تب‌ها با مقادیر اولیه ایمن و بارگذاری مستقیم از public/data/02-organization-context/
  const [profile, setProfile] = useState<OrganizationProfile>(defaultProfile);
  const [swot, setSwot] = useState<OrganizationSwot>(defaultSwot);
  const [stakeholders, setStakeholders] = useState<OrganizationStakeholder[]>([]);
  const [requirements, setRequirements] = useState<OrganizationLegalRequirement[]>([]);

  // بارگذاری ایمن داده‌ها از فایل‌های JSON مسیر public/data/02-organization-context/
  useEffect(() => {
    let isMounted = true;

    safeFetchPublicJson<any>('/data/02-organization-context/profile.json', defaultProfile, {
      storageKey: 'enms_org_profile_v1',
    }).then((data) => {
      if (isMounted && data) {
        setProfile((prev) => ({
          ...prev,
          ...data,
          companyName: data.companyName || data.scope?.companyName || prev.companyName,
          plantLocation: data.plantLocation || data.scope?.plantLocation || prev.plantLocation,
          clinkerCapacityTpd: data.clinkerCapacityTpd || data.scope?.clinkerCapacityTpd || prev.clinkerCapacityTpd,
          cementCapacityTpd: data.cementCapacityTpd || data.scope?.cementCapacityTpd || prev.cementCapacityTpd,
          physicalBoundary: data.physicalBoundary || data.scope?.physicalBoundary || prev.physicalBoundary,
          processBoundary: data.processBoundary || data.scope?.processBoundary || prev.processBoundary,
          boundariesMatrix: data.boundariesMatrix || prev.boundariesMatrix,
          energySources: data.energySources || prev.energySources,
          departments: data.departments || prev.departments,
        }));
      }
    });

    safeFetchPublicJson<any>('/data/02-organization-context/organization-context.json', { swotAnalysis: defaultSwot }, {
      storageKey: 'enms_org_context_v1',
    }).then((data) => {
      if (isMounted && data?.swotAnalysis) {
        setSwot(data.swotAnalysis);
      }
    });

    safeFetchPublicJson<any>('/data/02-organization-context/stakeholders.json', [], {
      storageKey: 'enms_org_stakeholders_v1',
    }).then((data) => {
      if (!isMounted) return;
      if (Array.isArray(data)) setStakeholders(data);
      else if (data?.stakeholders) setStakeholders(data.stakeholders);
    });

    safeFetchPublicJson<any>('/data/02-organization-context/legal-requirements.json', [], {
      storageKey: 'enms_org_legal_v1',
    }).then((data) => {
      if (!isMounted) return;
      if (Array.isArray(data)) setRequirements(data);
      else if (data?.requirements) setRequirements(data.requirements);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // ۳. همگام‌سازی فوری استیت صفحه با کلیک‌های سایدبار
  useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(normalizeTabKey(activeSubTab as string));
    }
  }, [activeSubTab]);

  // ۴. مدیریت کلیک روی نوار افقی داخل صفحه و ارسال به سایدبار
  const handleTabClick = (tabKey: string) => {
    setCurrentTab(tabKey);

    const reverseMap: Record<string, ContextSubTabId> = {
      profile: 'org-profile',
      context: 'scope',
      stakeholders: 'stakeholders',
      legal: 'legal-requirements',
      policy: 'energy-policy',
      bsc: 'bsc',
    };

    if (onSubTabChange) {
      onSubTabChange(reverseMap[tabKey] || (tabKey as ContextSubTabId));
    }
  };

  const handleSave = () => {
    localStorage.setItem('enms_org_profile', JSON.stringify(profile));
    localStorage.setItem('enms_org_swot', JSON.stringify(swot));
    localStorage.setItem('enms_org_stakeholders', JSON.stringify(stakeholders));
    localStorage.setItem('enms_org_legal', JSON.stringify(requirements));
    setIsEditing(false);
  };

  const handleExportJson = () => {
    const fullData = {
      profile,
      swotAnalysis: swot,
      stakeholders,
      legalRequirements: requirements,
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'kiasar-organization-context.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="w-full flex flex-col gap-4 text-xs animate-fadeIn" dir="rtl">
      {/* سربرگ معرفی بند ۴ و ۵ و اکشن‌های بارگذاری / خروجی */}
      <div className="enms-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="enms-badge badge-success text-[10px]">بند ۴، ۵ و ۶ استاندارد ISO 50001:2018</span>
              <span className="text-[var(--color-text-muted)] font-mono text-[11px]">Context & Leadership</span>
            </div>
            <h2 className="text-sm font-bold text-[var(--color-text-primary)] mt-1">
              بافت سازمان، خط‌مشی و اهداف استراتژیک مدیریت انرژی
            </h2>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              مدیریت یکپارچه مشخصات، مرزها، عوامل محیطی، ذینفعان، بیانیه خط‌مشی و کارت امتیازی متوازن (BSC) سیمان کیاسر
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="enms-button enms-button-secondary text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span>خروجی JSON</span>
            </button>
            <button
              onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
              className={`enms-button ${
                isEditing
                  ? 'enms-button-primary'
                  : 'enms-button-secondary text-[var(--color-primary)]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'ذخیره تغییرات' : 'حالت ویرایش'}</span>
            </button>
          </div>
        </div>

        {/* نوار افقی دکمه‌های ۶ گانه (دقیقاً هماهنگ با طراحی قبلی) */}
        <div className="enms-tab-pills mt-3" role="tablist">
          <button
            onClick={() => handleTabClick('profile')}
            className={`enms-tab-pill ${currentTab === 'profile' ? 'active' : ''}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>مشخصات و مرزهای سیستم ۴.۳</span>
          </button>

          <button
            onClick={() => handleTabClick('context')}
            className={`enms-tab-pill ${currentTab === 'context' ? 'active' : ''}`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>تحلیل بافت سازمان ۴.۱</span>
          </button>

          <button
            onClick={() => handleTabClick('stakeholders')}
            className={`enms-tab-pill ${currentTab === 'stakeholders' ? 'active' : ''}`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>نیازها و انتظارات ذینفعان ۴.۲</span>
          </button>

          <button
            onClick={() => handleTabClick('legal')}
            className={`enms-tab-pill ${currentTab === 'legal' ? 'active' : ''}`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>الزامات قانونی و مقرراتی ۴.۲ / ۴.۲</span>
          </button>

          <button
            onClick={() => handleTabClick('policy')}
            className={`enms-tab-pill ${currentTab === 'policy' ? 'active' : ''}`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>خط‌‌مشی و چشم‌انداز انرژی ۵.۲</span>
          </button>

          <button
            onClick={() => handleTabClick('bsc')}
            className={`enms-tab-pill ${currentTab === 'bsc' ? 'active' : ''}`}
          >
            <BarChart className="w-3.5 h-3.5" />
            <span>اهداف کلان و استراتژی‌های BSC ۶.۲</span>
          </button>
        </div>
      </div>

      {/* ۵. ناحیه رندر قطعی ساب‌تب فعال بدون خالی ماندن صفحه */}
      <div className="w-full">
        {currentTab === 'profile' && (
          <OrganizationProfileView
            profile={profile}
            onChange={setProfile}
            isEditing={isEditing}
          />
        )}
        {currentTab === 'context' && (
          <InternalExternalIssuesView
            swot={swot}
            onChange={setSwot}
            isEditing={isEditing}
          />
        )}
        {currentTab === 'stakeholders' && (
          <StakeholdersView
            stakeholders={stakeholders}
            onChange={setStakeholders}
            isEditing={isEditing}
          />
        )}
        {currentTab === 'legal' && (
          <LegalRequirementsView
            requirements={requirements}
            onChange={setRequirements}
            isEditing={isEditing}
          />
        )}
        {currentTab === 'policy' && <PolicyStrategyView isEditing={isEditing} />}
        {currentTab === 'bsc' && <StrategicObjectivesBscView />}
      </div>
    </div>
  );
};

export default OrganizationContextLayout;