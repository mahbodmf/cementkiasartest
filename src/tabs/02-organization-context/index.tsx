import React from 'react';
import { ContextSubTabId, OrganizationProfile } from '../../types';
import { OrganizationContextLayout } from './OrganizationContextLayout';

// ایمپورت زیرتب‌های ۶ گانه از مسیرهای واقعی موجود
import { ProfileView } from './subtabs/01-organization-profile/ProfileView';
import { SwotView as ContextAnalysisView } from './subtabs/02-internal-external-issues/SwotView';
import { StakeholdersView as StakeholdersMatrixView } from './subtabs/03-stakeholders/StakeholdersView';
import { LegalView as LegalRequirementsView } from './subtabs/04-legal-requirements/LegalView';
import { PolicyView as EnergyPolicyView } from './subtabs/05-policy-strategy/PolicyView';
import { ObjectivesBscView as BalancedScorecardView } from './subtabs/06-strategic-objectives-bsc/ObjectivesBscView';

interface OrganizationContextTabProps {
  activeSubTab?: ContextSubTabId | string;
  subTab?: ContextSubTabId | string;
  onSubTabChange?: (subTab: ContextSubTabId) => void;
  isEditing?: boolean;
  profile?: OrganizationProfile;
  onProfileChange?: (updated: OrganizationProfile) => void;
}

export const OrganizationContextTab: React.FC<OrganizationContextTabProps> = (props) => {
  return <OrganizationContextLayout {...props} />;
};

export { OrganizationContextLayout };
export default OrganizationContextTab;