import React, { useState } from 'react';
import { OrganizationProfile, BoundaryMatrixItem, EnergySourceItem } from '../../../../types';
import { useProfileExport } from './hooks/useProfileExport';
import { ProfileHeader } from './components/ProfileHeader';
import { ScopeStatementSummary } from './components/ScopeStatementSummary';
import { BoundariesMatrixTable } from './components/BoundariesMatrixTable';
import { EnergyCarriersAndLocation } from './components/EnergyCarriersAndLocation';
import { CementProcessSchematic } from './components/CementProcessSchematic';

export interface ProfileViewProps {
  profile?: OrganizationProfile;
  onChange?: (updated: OrganizationProfile) => void;
  isEditing?: boolean;
}

const defaultProfile: OrganizationProfile = {
  companyName: 'شرکت صنایع سیمان کیاسر (سهامی عام)',
  plantLocation: 'مازندران، شهرستان ساری، بخش چهاردانگه، کیلومتر ۴۵ جاده ساری - سمنان، کیاسر',
  clinkerCapacityTpd: 2000,
  cementCapacityTpd: 2300,
  physicalBoundary: 'محدوده فنس کارخانه سیمان کیاسر به مساحت ۴۵ هکتار',
  processBoundary: 'از دریافت مواد اولیه معدنی تا تحویل و خروج انواع سیمان',
  scopeStatement: 'سیستم مدیریت انرژی شرکت سیمان کیاسر کلیه فرآیندهای مرتبط با تولید انواع کلینکر و سیمان، پشتیبانی و بهره‌برداری از حامل‌های انرژی گاز طبیعی، مازوت و برق را در محدوده فیزیکی ۴۵ هکتاری سایت صنعتی پوشش می‌دهد.',
  boundariesMatrix: [],
  energySources: [],
  departments: [],
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile = defaultProfile,
  onChange,
  isEditing = false,
}) => {
  const currentProfile = profile || defaultProfile;
  const boundaries = currentProfile?.boundariesMatrix || [];
  const energySources = currentProfile?.energySources || [];

  const [selectedDeptHighlight, setSelectedDeptHighlight] = useState<string | null>(null);

  // هوک مدیریت بارگذاری و انواع خروجی‌ها (Excel, Word, JSON, Print)
  const exportControls = useProfileExport(currentProfile, boundaries, onChange);

  const handleFieldChange = (field: keyof OrganizationProfile, value: any) => {
    onChange?.({ ...currentProfile, [field]: value });
  };

  const handleBoundaryChange = (index: number, field: keyof BoundaryMatrixItem, value: any) => {
    const updated = [...boundaries];
    updated[index] = { ...updated[index], [field]: value };
    onChange?.({ ...currentProfile, boundariesMatrix: updated });
  };

  const handleAddBoundaryRow = () => {
    const newRow: BoundaryMatrixItem = {
      row: boundaries.length + 1,
      department: '',
      scopeDescription: '',
      insideEnMS: 'بلی',
      insidePhysical: 'بلی',
      status: 'مشمول',
      energyCarriers: '',
      equipment: '',
      outsourced: 'خیر',
      seuStatus: '',
    };
    onChange?.({ ...currentProfile, boundariesMatrix: [...boundaries, newRow] });
  };

  const handleDeleteBoundaryRow = (index: number) => {
    const updated = boundaries
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, row: idx + 1 }));
    onChange?.({ ...currentProfile, boundariesMatrix: updated });
  };

  const handleEnergySourceChange = (index: number, field: keyof EnergySourceItem, value: any) => {
    const updated = [...energySources];
    updated[index] = { ...updated[index], [field]: value };
    onChange?.({ ...currentProfile, energySources: updated });
  };

  const handleAddEnergySource = () => {
    const newSource: EnergySourceItem = {
      id: `es-${Date.now()}`,
      name: '',
      type: '',
      unit: '',
      applications: '',
    };
    onChange?.({ ...currentProfile, energySources: [...energySources, newSource] });
  };

  const handleDeleteEnergySource = (index: number) => {
    const updated = energySources.filter((_, i) => i !== index);
    onChange?.({ ...currentProfile, energySources: updated });
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn" dir="rtl">
      {/* سربرگ مشخصات شرکت، ظرفیت‌ها و ابزارهای جامع ورودی/خروجی */}
      <div className="enms-card">
        <ProfileHeader
          profile={currentProfile}
          isEditing={isEditing}
          onFieldChange={handleFieldChange}
          exportControls={exportControls}
        />

        {/* بیانیه رسمی دامنه و کارت‌های خلاصه آماری */}
        <ScopeStatementSummary
          profile={currentProfile}
          boundaries={boundaries}
          isEditing={isEditing}
          onFieldChange={handleFieldChange}
        />
      </div>

      {/* جدول ماتریس تفصیلی مرز سیستم */}
      <BoundariesMatrixTable
        boundaries={boundaries}
        isEditing={isEditing}
        selectedDeptHighlight={selectedDeptHighlight}
        onClearHighlight={() => setSelectedDeptHighlight(null)}
        onBoundaryChange={handleBoundaryChange}
        onAddRow={handleAddBoundaryRow}
        onDeleteRow={handleDeleteBoundaryRow}
      />

      {/* حامل‌های انرژی و موقعیت جغرافیایی/مرز فیزیکی */}
      <EnergyCarriersAndLocation
        profile={currentProfile}
        energySources={energySources}
        isEditing={isEditing}
        onFieldChange={handleFieldChange}
        onEnergySourceChange={handleEnergySourceChange}
        onAddEnergySource={handleAddEnergySource}
        onDeleteEnergySource={handleDeleteEnergySource}
      />

      {/* شماتیک تعاملی خط تولید کارخانه سیمان و موازنه جریان‌های انرژی */}
      <CementProcessSchematic
        selectedDeptHighlight={selectedDeptHighlight}
        onSelectDeptHighlight={setSelectedDeptHighlight}
      />
    </div>
  );
};

export default ProfileView;