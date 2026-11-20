import React, { useState, useEffect } from 'react';
import { DailyProductionRecord } from '../types';
import { toPersianDigits } from '../../../../../utils/persianUtils';

interface ProductionEditModalProps {
  record: DailyProductionRecord | null;
  onClose: () => void;
  onSave: (updatedRecord: DailyProductionRecord) => void;
}

export const ProductionEditModal: React.FC<ProductionEditModalProps> = ({ record, onClose, onSave }) => {
  const [formData, setFormData] = useState<DailyProductionRecord | null>(record);

  useEffect(() => {
    setFormData(record ? { ...record } : null);
  }, [record]);

  if (!formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" dir="rtl">
      <div className="enms-card max-w-lg w-full p-5 bg-[var(--color-bg-surface)] border border-[var(--color-border)] shadow-2xl animate-scaleUp">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)] mb-4">
          <h4 className="font-bold text-sm text-[var(--color-text-primary)]">
            ویرایش تناژ تولید روز {toPersianDigits(formData.dayNumber)} ({toPersianDigits(formData.jalaliDate)})
          </h4>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-rose-500 text-base font-bold">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1">خوراک کوره (تن):</label>
              <input
                type="number"
                step="any"
                value={formData.kilnFeedTon}
                onChange={(e) => setFormData({ ...formData, kilnFeedTon: Number(e.target.value) })}
                className="enms-input w-full text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">تولید کلینکر (تن):</label>
              <input
                type="number"
                step="any"
                value={formData.clinkerTon}
                onChange={(e) => setFormData({ ...formData, clinkerTon: Number(e.target.value) })}
                className="enms-input w-full text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1">سیمان تیپ ۲ (تن):</label>
              <input
                type="number"
                step="any"
                value={formData.cementType2Ton}
                onChange={(e) => {
                  const t2 = Number(e.target.value);
                  setFormData({
                    ...formData,
                    cementType2Ton: t2,
                    totalCementTon: t2 + formData.cementPuzzolanicTon,
                  });
                }}
                className="enms-input w-full text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">سیمان پوزولانی (تن):</label>
              <input
                type="number"
                step="any"
                value={formData.cementPuzzolanicTon}
                onChange={(e) => {
                  const pz = Number(e.target.value);
                  setFormData({
                    ...formData,
                    cementPuzzolanicTon: pz,
                    totalCementTon: formData.cementType2Ton + pz,
                  });
                }}
                className="enms-input w-full text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1">SEC حرارتی (kcal/kg):</label>
              <input
                type="number"
                step="any"
                value={formData.secThermalKcalKg}
                onChange={(e) => setFormData({ ...formData, secThermalKcalKg: Number(e.target.value) })}
                className="enms-input w-full text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1">SEC الکتریکی (kWh/t):</label>
              <input
                type="number"
                step="any"
                value={formData.secElectricalKwhTon}
                onChange={(e) => setFormData({ ...formData, secElectricalKwhTon: Number(e.target.value) })}
                className="enms-input w-full text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1">توضیحات فرآیندی روزانه:</label>
            <input
              type="text"
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="enms-input w-full text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
            <button type="button" onClick={onClose} className="enms-button enms-button-secondary text-xs">
              انصراف
            </button>
            <button type="submit" className="enms-button enms-button-primary text-xs">
              ذخیره تغییرات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};