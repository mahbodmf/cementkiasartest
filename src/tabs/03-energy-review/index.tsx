import React from 'react';
import { EnergyReviewLayout } from './EnergyReviewLayout';
import { EnergyReviewSubTabId } from '../../types';

interface EnergyReviewTabProps {
  activeSubTab?: EnergyReviewSubTabId;
  activeSubSection?: EnergyReviewSubTabId;
  onSubTabChange?: (subTab: EnergyReviewSubTabId) => void;
  onSubSectionChange?: (subSection: EnergyReviewSubTabId) => void;
}

export const EnergyReviewTab: React.FC<EnergyReviewTabProps> = (props) => {
  return <EnergyReviewLayout {...props} />;
};

export default EnergyReviewTab;