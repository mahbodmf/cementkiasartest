export interface EnergySourceItem {
  id: string;
  name: string;
  type: string;
  unit: string;
  applications: string;
}

export interface DepartmentItem {
  id: string;
  name: string;
  manager: string;
  description: string;
}

export interface BoundaryMatrixItem {
  row: number;
  department: string;
  scopeDescription: string;
  insideEnMS: string;
  insidePhysical: string;
  status: 'مشمول' | 'مشمول غیرمستقیم' | 'مستثنی' | string;
  energyCarriers: string;
  equipment: string;
  outsourced: string;
  seuStatus: string;
}

export interface OrganizationProfile {
  companyName: string;
  plantLocation: string;
  clinkerCapacityTpd: number;
  cementCapacityTpd: number;
  scopeStatement?: string;
  physicalBoundary: string;
  processBoundary: string;
  boundariesMatrix?: BoundaryMatrixItem[];
  energySources: EnergySourceItem[];
  departments: DepartmentItem[];
}

export interface SwotItem {
  code: string;
  description: string;
  weight: number;
  score: number;
  weightedScore: number;
}

export interface OrganizationSwot {
  internalStrengths: (SwotItem | string)[];
  internalWeaknesses: (SwotItem | string)[];
  externalOpportunities: (SwotItem | string)[];
  externalThreats: (SwotItem | string)[];
}

export interface OrganizationStakeholder {
  id: string;
  name: string;
  group?: string;
  type?: 'نیاز' | 'انتظار' | string;
  description: string;
  impactOnIMS?: string;
  risks?: string;
  opportunities?: string;
  monitoringMethod?: string;
  monitoringPeriod?: string;
  monitoringResponsible?: string;
  reviewPeriod?: string;
  reviewResponsible?: string;
  category?: string;
  requirements?: string;
  complianceMechanism?: string;
}

export interface OrganizationLegalRequirement {
  id?: string;
  row?: number;
  category: string;
  reference: string;
  sourceLink?: string;
  scopeDescription: string;
  complianceStatus:
    | 'منطبق'
    | 'عدم انطباق'
    | 'در حال پیاده‌سازی'
    | 'در دست بررسی (برای پروژه‌های جدید)'
    | 'منطبق - نیازمند پایش'
    | string;
  evidences: string;
  responsible: string;
  monitoringFrequency: string;
  nonComplianceRisk: string;
  severity: number;
  probability: number;
  rpn: number;
  actionThreshold: string;
  preventiveAction: string;
  title?: string;
  authority?: string;
  description?: string;
  status?: string;
  lastAuditDate?: string;
}

export interface StrategyKpi {
  bscPerspective: 'فرآیندهای داخلی' | 'مشتری' | 'مالی' | 'یادگیری و رشد' | string;
  kpiName: string;
  formula: string;
  unit: string;
  target: string;
  reportingPeriod: 'ماهانه' | 'فصلی' | 'سالانه' | string;
  responsible: string;
}

export interface StrategyItem {
  code: string;
  title: string;
  description: string;
  kpis: StrategyKpi[];
}

export interface CpmFactor {
  factor: string;
  weight: number;
  kiasarScore: number;
  kiasarWeighted: number;
  nekaScore?: number;
  nekaWeighted: number;
  farazScore?: number;
  farazWeighted: number;
  firoozkoohScore?: number;
  firoozkoohWeighted: number;
}

export interface OrganizationStrategicPlan {
  cpmAnalysis?: CpmFactor[];
  strategies: StrategyItem[];
}

export interface OrganizationStrategicTarget {
  id: string;
  indicator: string;
  baseline: string;
  target: string;
  deadline: string;
}

export interface OrganizationPolicyAndStrategy {
  policyStatement: string;
  approvalDate: string;
  approvedBy: string;
  strategicTargets?: OrganizationStrategicTarget[];
}

export interface OrganizationContextData {
  profile: OrganizationProfile;
  swotAnalysis: OrganizationSwot;
  stakeholders: OrganizationStakeholder[];
  legalRequirements: OrganizationLegalRequirement[];
  policyAndStrategy?: OrganizationPolicyAndStrategy;
  strategicPlan?: OrganizationStrategicPlan;
}