import React from 'react';
import { Flame, Zap, Wind, Factory, MapPin, Plus, Trash2 } from 'lucide-react';
import { OrganizationProfile, EnergySourceItem } from '../../../../../types';

interface EnergyCarriersAndLocationProps {
  profile: OrganizationProfile;
  energySources: EnergySourceItem[];
  isEditing: boolean;
  onFieldChange: (field: keyof OrganizationProfile, value: any) => void;
  onEnergySourceChange: (index: number, field: keyof EnergySourceItem, value: any) => void;
  onAddEnergySource: () => void;
  onDeleteEnergySource: (index: number) => void;
}

export const EnergyCarriersAndLocation: React.FC<EnergyCarriersAndLocationProps> = ({
  profile,
  energySources,
  isEditing,
  onFieldChange,
  onEnergySourceChange,
  onAddEnergySource,
  onDeleteEnergySource,
}) => {
  const getEnergyIcon = (name: string) => {
    if (name.includes('برق')) return <Zap className="w-4 h-4 text-amber-500" />;
    if (name.includes('گاز')) return <Flame className="w-4 h-4 text-[var(--color-primary)]" />;
    if (name.includes('مازوت')) return <Flame className="w-4 h-4 text-rose-500" />;
    if (name.includes('هوا')) return <Wind className="w-4 h-4 text-sky-500" />;
    return <Factory className="w-4 h-4 text-[var(--color-text-muted)]" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* حامل‌های انرژی */}
      <div className="enms-card flex flex-col">
        <div className="enms-card-header">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h3 className="enms-card-title">حامل‌های انرژی تحت مدیریت (Energy Carriers)</h3>
          </div>
          {isEditing && (
            <button
              onClick={onAddEnergySource}
              className="enms-button enms-button-primary text-xs py-1 px-2.5 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>افزودن حامل</span>
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {energySources.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-xs py-4 text-center">حامل انرژی ثبت نشده است.</p>
          ) : (
            energySources.map((source, sIdx) => (
              <div
                key={source.id || sIdx}
                className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] flex flex-col gap-2 transition-all hover:border-[var(--color-primary-border)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1">
                    {getEnergyIcon(source.name)}
                    {isEditing ? (
                      <input
                        className="enms-input text-xs font-bold flex-1"
                        value={source.name}
                        onChange={(e) => onEnergySourceChange(sIdx, 'name', e.target.value)}
                        placeholder="نام حامل انرژی"
                      />
                    ) : (
                      <span className="font-bold text-[var(--color-text-primary)] text-xs">{source.name}</span>
                    )}

                    {isEditing ? (
                      <input
                        className="enms-input text-xs font-mono w-24"
                        value={source.unit}
                        onChange={(e) => onEnergySourceChange(sIdx, 'unit', e.target.value)}
                        placeholder="واحد سنجش"
                      />
                    ) : (
                      <span className="enms-badge badge-neutral text-[10px] font-mono">
                        {source.unit}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <input
                        className="enms-input text-xs text-[var(--color-primary)] font-mono w-36"
                        value={source.type}
                        onChange={(e) => onEnergySourceChange(sIdx, 'type', e.target.value)}
                        placeholder="نوع حامل"
                      />
                    ) : (
                      <span className="enms-badge badge-neutral text-[10px] font-mono shrink-0">
                        {source.type}
                      </span>
                    )}

                    {isEditing && (
                      <button
                        onClick={() => onDeleteEnergySource(sIdx)}
                        className="text-rose-500 hover:text-rose-600 p-1 cursor-pointer"
                        title="حذف حامل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <textarea
                    rows={2}
                    className="enms-textarea text-xs w-full resize-none"
                    value={source.applications}
                    onChange={(e) => onEnergySourceChange(sIdx, 'applications', e.target.value)}
                    placeholder="شرح مصارف و کاربرد در خط تولید..."
                  />
                ) : (
                  <p className="text-[var(--color-text-muted)] text-[11px] leading-relaxed pr-6">
                    {source.applications}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* موقعیت جغرافیایی و مرزهای فیزیکی */}
      <div className="enms-card flex flex-col justify-between">
        <div>
          <div className="enms-card-header">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              <h3 className="enms-card-title">مرزهای فیزیکی و موقعیت استقرار کارخانه</h3>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs leading-relaxed">
            <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
              <span className="font-bold text-[var(--color-text-primary)] block mb-1">موقعیت جغرافیایی:</span>
              {isEditing ? (
                <textarea
                  rows={2}
                  className="enms-textarea text-xs w-full resize-none"
                  value={profile.plantLocation || ''}
                  onChange={(e) => onFieldChange('plantLocation', e.target.value)}
                />
              ) : (
                <p className="text-[var(--color-text-muted)]">{profile.plantLocation || 'ثبت نشده'}</p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
              <span className="font-bold text-[var(--color-text-primary)] block mb-1">مرز فیزیکی سایت صنعتی:</span>
              {isEditing ? (
                <textarea
                  rows={2}
                  className="enms-textarea text-xs w-full resize-none"
                  value={profile.physicalBoundary || ''}
                  onChange={(e) => onFieldChange('physicalBoundary', e.target.value)}
                />
              ) : (
                <p className="text-[var(--color-text-muted)]">{profile.physicalBoundary || 'ثبت نشده'}</p>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)]">
              <span className="font-bold text-[var(--color-text-primary)] block mb-1">مرز فرآیندی:</span>
              {isEditing ? (
                <textarea
                  rows={2}
                  className="enms-textarea text-xs w-full resize-none"
                  value={profile.processBoundary || ''}
                  onChange={(e) => onFieldChange('processBoundary', e.target.value)}
                />
              ) : (
                <p className="text-[var(--color-text-muted)]">{profile.processBoundary || 'ثبت نشده'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
