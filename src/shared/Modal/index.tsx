import React, { useState } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Search,
  Key,
  CheckCircle2,
  Database,
} from 'lucide-react';
import { EnMSMasterDataset, ThemeMode } from '../../types';
import { toPersianDigits } from '../../utils/persianUtils';
import { contextData } from '../../data/contextSeuData';

interface DatasetViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: EnMSMasterDataset;
  theme?: ThemeMode;
}

type SheetKey =
  | 'Energy_Performance_EnPI'
  | 'Electrical_Energy'
  | 'Production_Operations'
  | 'Dispatch_Sales'
  | 'Inventory_Silos'
  | 'Context_SEU_Data';

export const DatasetViewerModal: React.FC<DatasetViewerModalProps> = ({
  isOpen,
  onClose,
  dataset,
  theme = 'dark',
}) => {
  const [activeSheet, setActiveSheet] = useState<SheetKey>('Energy_Performance_EnPI');
  const [searchFilter, setSearchFilter] = useState('');

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const sheets: { id: SheetKey; titleFa: string; sheetName: string; descriptionFa: string; count: number }[] = [
    {
      id: 'Energy_Performance_EnPI',
      titleFa: '۱. کارایی انرژی و شاخص‌های EnPI',
      sheetName: 'Energy_Performance_EnPI',
      descriptionFa: 'مصرف ویژه برق (SEC Electric)، مصرف ویژه حرارتی (SEC Thermal)، اهداف، گاز طبیعی و انحرافات CUSUM',
      count: (dataset?.energyPerformance || []).length,
    },
    {
      id: 'Electrical_Energy',
      titleFa: '۲. مصارف تفکیکی برق دپارتمان‌ها',
      sheetName: 'Electrical_Energy',
      descriptionFa: 'مصرف برق روزانه (کیلووات‌ساعت) به تفکیک سنگ‌شکن، آسیاب مواد خام، کوره، آسیاب سیمان و مجموع کارخانه',
      count: (dataset?.electricalEnergy || []).length,
    },
    {
      id: 'Production_Operations',
      titleFa: '۳. پایش عملیات، کارکرد و توقفات',
      sheetName: 'Production_Operations',
      descriptionFa: 'ساعات کارکرد و توقف کوره و آسیاب سیمان، تناژ تولید کلینکر و سیمان، دسته‌بندی و شرح علل توقفات',
      count: (dataset?.productionOperations || []).length,
    },
    {
      id: 'Dispatch_Sales',
      titleFa: '۴. آمار تحویل و فروش سیمان',
      sheetName: 'Dispatch_Sales',
      descriptionFa: 'تحویل روزانه سیمان فله و پاکتی تیپ‌های ۴۲.۵ و ۳۲.۵، مجموع بارگیری و مقایسه با تارگت روزانه ۴۵۰۰ تن',
      count: (dataset?.dispatchSales || []).length,
    },
    {
      id: 'Inventory_Silos',
      titleFa: '۵. موجودی سیلوها و دپوی کلینکر',
      sheetName: 'Inventory_Silos',
      descriptionFa: 'درصد موجودی سیلوی مواد خام، سیلوی کلینکر، سیلوهای سیمان ۱ و ۲ و موجودی باز دپوی کلینکر (تن)',
      count: (dataset?.inventorySilos || []).length,
    },
    {
      id: 'Context_SEU_Data',
      titleFa: '۶. شناسنامه مصارف بارز انرژی (SEU)',
      sheetName: 'Context_SEU_Data',
      descriptionFa: 'تجهیزات بارز، توان نامی (kW)، حامل انرژی، متغیرهای اثرگذار، پتانسیل‌های بهبود و کدهای کنتور',
      count: (contextData?.seuRegistry || []).length,
    },
  ];

  const getSheetData = (): any[] => {
    switch (activeSheet) {
      case 'Energy_Performance_EnPI':
        return dataset?.energyPerformance || [];
      case 'Electrical_Energy':
        return dataset?.electricalEnergy || [];
      case 'Production_Operations':
        return dataset?.productionOperations || [];
      case 'Dispatch_Sales':
        return dataset?.dispatchSales || [];
      case 'Inventory_Silos':
        return dataset?.inventorySilos || [];
      case 'Context_SEU_Data':
        return contextData?.seuRegistry || [];
      default:
        return [];
    }
  };

  const rawRows: any[] = getSheetData() || [];
  const columns = rawRows.length > 0 ? Object.keys(rawRows[0] || {}) : [];

  const filteredRows = (rawRows || []).filter((row) => {
    if (!searchFilter) return true;
    return Object.values(row || {}).some((val) =>
      String(val).toLowerCase().includes(searchFilter.toLowerCase())
    );
  });

  const exportCSV = () => {
    if (!rawRows.length) return;
    const header = columns.join(',');
    const rows = rawRows.map((r) =>
      columns.map((c) => JSON.stringify(r[c] ?? '')).join(',')
    );
    const csvContent = '\uFEFF' + [header, ...rows].join('\n'); // Add BOM for Excel UTF-8 Persian
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeSheet}_EnMS_Master_Dataset.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="rounded-2xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] overflow-hidden transition-colors">
        {/* هدر پنجره */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-bg)] text-[var(--color-primary)] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="enms-badge badge-success">
                  پایگاه داده توزیع‌شده رابطه‌ای (Relational Schema Connected)
                </span>
                <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-500" />
                  کلید ارتباط رابطه‌ای: <strong className="font-mono text-[var(--color-primary)]">تاریخ</strong> (YYYY/MM/DD)
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black mt-0.5 text-[var(--color-text-primary)]">
                پایگاه داده جامع مدیریت انرژی EnMS_Master_Dataset
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportCSV}
              className="enms-button enms-button-primary text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>دریافت فایل CSV</span>
            </button>
            <button
              onClick={onClose}
              className="enms-button-icon"
              aria-label="بستن پنجره"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* برگه ۵ شیت رابطه‌ای */}
        <div className="px-4 sm:px-6 py-2 border-b border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] overflow-x-auto flex items-center gap-2">
          <div className="enms-tab-pills !bg-transparent !border-0 flex items-center gap-2">
            {sheets.map((sheet) => {
              const isActive = activeSheet === sheet.id;
              return (
                <button
                  key={sheet.id}
                  onClick={() => {
                    setActiveSheet(sheet.id);
                    setSearchFilter('');
                  }}
                  className={`enms-tab-pill ${isActive ? 'active' : ''}`}
                >
                  <span>{sheet.titleFa}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono opacity-80">
                    {toPersianDigits(sheet.count)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* فیلد جستجو و توضیحات برگه */}
        <div className="p-3 sm:px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] text-xs">
          <div className="text-[var(--color-text-muted)] text-xs">
            {sheets.find((s) => s.id === activeSheet)?.descriptionFa}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="جستجو در مقادیر این برگه..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="enms-input w-full pr-8"
            />
          </div>
        </div>

        {/* جدول نمایش داده‌ها */}
        <div className="flex-1 overflow-auto p-4 sm:px-6">
          <div className="enms-table-container">
            <table className="enms-table">
              <thead>
                <tr className="sticky top-0 z-10">
                  <th className="text-[var(--color-primary)]">ردیف</th>
                  {columns.map((col) => (
                    <th key={col}>
                      {col === 'Date' ? (
                        <span className="flex items-center gap-1 text-amber-500">
                          <Key className="w-3 h-3" /> تاریخ (کلید اصلی)
                        </span>
                      ) : (
                        col
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono">
                {filteredRows.slice(0, 100).map((row, idx) => (
                  <tr key={idx}>
                    <td className="text-[var(--color-text-muted)] text-[10px] font-sans">
                      {toPersianDigits(idx + 1)}
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col}
                        className={
                          col === 'Date'
                            ? 'font-bold text-amber-500 font-sans'
                            : typeof row[col] === 'string'
                            ? 'font-sans'
                            : ''
                        }
                      >
                        {typeof row[col] === 'number'
                          ? toPersianDigits(row[col].toLocaleString())
                          : toPersianDigits(String(row[col]))}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRows.length > 100 && (
            <div className="text-center py-3 text-xs text-[var(--color-text-muted)] font-sans">
              نمایش ۱۰۰ ردیف اول. برای دانلود تمام داده‌ها از دکمه «دریافت فایل CSV» استفاده نمایید.
            </div>
          )}
        </div>

        {/* فوتر پنجره */}
        <div className="p-3 sm:px-6 border-t border-[var(--color-border)] bg-[var(--color-bg-card-subtle)] flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" />
            <span>اتصال پایگاه داده توزیع‌شده برقرار است (کلید یکتای تاریخ)</span>
          </div>
          <span className="font-sans font-bold text-[var(--color-text-primary)]">
            {toPersianDigits(filteredRows.length)} ردیف تطابق یافته
          </span>
        </div>
      </div>
    </div>
  );
};

export default DatasetViewerModal;
