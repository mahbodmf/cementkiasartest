// =============================================================================
// تایپ‌های ناوبری، تب‌ها و ساب‌تب‌های پلتفرم سیستم مدیریت انرژی (ISO 50001:2018)
// =============================================================================

import { EnergyObjectivesSubTabId } from './projects';
export type { ThemeMode } from '../context/AppSettingsContext';

export type MainTabId =
  | 'executive'
  | 'context'
  | 'operations'
  | 'energy-review'
  | 'monitoring'
  | 'energy-committee'
  | 'energy-objectives'
  | '01-executive-dashboard'
  | '02-organization-context'
  | '02-5-operations'
  | '03-energy-review'
  | '04-energy-performance'
  | '05-energy-committee'
  | '06-energy-objectives-projects'
  | 'google-drive'
  | '07-google-drive';

export type OperationsSubTabId = 'production' | 'stops' | 'dispatch' | 'analytics' | 'intelligence';

export type MonitoringSubTabId =
  | 'cusum'
  | 'baseline'
  | 'enpi'
  | 'enpis'
  | 'electrical'
  | 'operations'
  | 'inventory'
  | 'cusum-deviations'
  | 'electrical-breakdown'
  | 'operations-downtime'
  | 'inventory-dispatch';

export type EnergyReviewSubTabId =
  | 'departments'
  | 'production-management'
  | 'production'
  | 'energy-ingestion'
  | 'seu'
  | 'stoppages-analysis'
  | 'stoppages'
  | 'dispatch-inventory'
  | 'dispatch'
  | 'variables'
  | 'efficiency-opportunities'
  | 'efficiency'
  | 'competence-persons'
  | 'personnel'
  | 'actions';

export type ContextSubTabId =
  | 'org-profile'
  | 'scope'
  | 'stakeholders'
  | 'legal-requirements'
  | 'energy-policy'
  | 'bsc'
  | 'org-swot'
  | 'org-stakeholders'
  | 'org-legal'
  | 'org-policy'
  | 'org-objectives-bsc';

export type CommitteeSubTabId =
  | 'charter'
  | 'members'
  | 'meetings'
  | 'minutes'
  | 'actions'
  | 'archive';

export type SubTabId =
  | MonitoringSubTabId
  | EnergyReviewSubTabId
  | ContextSubTabId
  | CommitteeSubTabId
  | EnergyObjectivesSubTabId
  | OperationsSubTabId;

export interface NavigationSubTab {
  id: string;
  code: string;
  title: string;
  description?: string;
  icon?: string;
}

export interface NavigationMainTab {
  id: MainTabId;
  number: number;
  title: string;
  shortTitle: string;
  description: string;
  clause: string;
  icon: string;
  badge?: string;
  type?: 'single' | 'accordion';
  defaultSubTab?: string;
  subTabs?: NavigationSubTab[];
}

export interface NavigationConfig {
  systemTitle: string;
  systemSubtitle: string;
  standardBadge: string;
  sidebarLogoTitle: string;
  sidebarLogoSubtitle: string;
  mainTabs: NavigationMainTab[];
}