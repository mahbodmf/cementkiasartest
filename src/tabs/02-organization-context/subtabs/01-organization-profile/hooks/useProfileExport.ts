import { useState, useRef } from 'react';
import { OrganizationProfile, BoundaryMatrixItem } from '../../../../../types';

export const useProfileExport = (
  profile: OrganizationProfile,
  boundaries: BoundaryMatrixItem[],
  onChange?: (updated: OrganizationProfile) => void
) => {
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EnMS_Scope_Boundaries_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setExportMenuOpen(false);
  };

  const exportExcelCSV = () => {
    let csv = '\uFEFFردیف,بخش/فرآیند,شرح محدوده,داخل EnMS,داخل مرز فیزیکی,وضعیت شمول,حامل‌های انرژی,تجهیزات اصلی,برون‌سپاری,وضعیت SEU\n';
    boundaries.forEach((b, i) => {
      csv += `"${b.row || i + 1}","${b.department}","${b.scopeDescription}","${b.insideEnMS}","${b.insidePhysical}","${b.status}","${b.energyCarriers}","${b.equipment}","${b.outsourced}","${b.seuStatus}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EnMS_Boundaries_Matrix.csv`;
    a.click();
    setExportMenuOpen(false);
  };

  const exportWordDoc = () => {
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>شناسنامه و دامنه کاربرد سیستم مدیریت انرژی</title></head>
      <body dir='rtl' style='font-family:Tahoma, Arial;'>
        <h2>شناسنامه و دامنه کاربرد سیستم مدیریت انرژی (ISO 50001:2018)</h2>
        <p><b>سازمان:</b> ${profile.companyName}</p>
        <p><b>موقعیت:</b> ${profile.plantLocation}</p>
        <p><b>ظرفیت کلینکر:</b> ${profile.clinkerCapacityTpd} تن/روز | <b>ظرفیت سیمان:</b> ${profile.cementCapacityTpd} تن/روز</p>
        <p><b>مرز فیزیکی:</b> ${profile.physicalBoundary}</p>
        <p><b>بیانیه دامنه:</b> ${profile.scopeStatement || ''}</p>
        <hr/>
        <h3>ماتریس تفصیلی مرزها و بخش‌های مشمول</h3>
        <table border='1' cellspacing='0' cellpadding='5' style='border-collapse:collapse;width:100%;font-size:11px;'>
          <tr style='background-color:#f2f2f2;'>
            <th>ردیف</th><th>دپارتمان</th><th>شرح محدوده</th><th>وضعیت شمول</th><th>حامل انرژی</th><th>تجهیزات</th><th>وضعیت SEU</th>
          </tr>
          ${boundaries.map((b, i) => `
            <tr>
              <td>${b.row || i + 1}</td><td>${b.department}</td><td>${b.scopeDescription}</td><td>${b.status}</td><td>${b.energyCarriers}</td><td>${b.equipment}</td><td>${b.seuStatus}</td>
            </tr>
          `).join('')}
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EnMS_Scope_Document.doc`;
    a.click();
    setExportMenuOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setExportMenuOpen(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.boundariesMatrix || parsed.companyName) {
          onChange?.(parsed);
          alert('اطلاعات شناسنامه با موفقیت بارگذاری شد.');
        } else {
          alert('قالب فایل با ساختار شناسنامه سیستم مطابقت ندارد.');
        }
      } catch (err) {
        alert('خطا در خواندن فایل واردشده.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return {
    exportMenuOpen,
    setExportMenuOpen,
    fileInputRef,
    exportJSON,
    exportExcelCSV,
    exportWordDoc,
    handlePrint,
    handleImportFile,
  };
};
