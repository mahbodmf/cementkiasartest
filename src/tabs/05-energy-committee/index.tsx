import React, { useState } from 'react';
import { 
  FileText, 
  Users, 
  ClipboardList, 
  CheckSquare, 
  Archive, 
  Layers 
} from 'lucide-react';

// ایمپورت هر ۵ ساب‌تب موجود در پوشه subtabs
import { CommitteeCharterView } from './subtabs/01-charter/CommitteeCharterView';
import { CommitteeMembersView } from './subtabs/02-members/CommitteeMembersView';
import { MeetingMinutesView } from './subtabs/03-minutes/MeetingMinutesView';
import { ActionTrackerView } from './subtabs/04-actions/ActionTrackerView';
import { CommitteeArchiveView } from './subtabs/05-archive/CommitteeArchiveView';

import { CommitteeSubTabId } from '../../types';

interface EnergyCommitteeTabProps {
  activeSubTab?: CommitteeSubTabId | string;
  activeSubTabId?: string;
  onSubTabChange?: (subTab: CommitteeSubTabId) => void;
}

export const EnergyCommitteeTab: React.FC<EnergyCommitteeTabProps> = ({
  activeSubTab,
  activeSubTabId,
  onSubTabChange,
}) => {
  const initialTab = (activeSubTab || activeSubTabId || 'charter') as string;
  // مدیریت تب فعال داخلی در صورت تغییر از درون صفحه یا از سایدبار
  const [currentSubTab, setCurrentSubTab] = useState<string>(initialTab);

  // همگام‌سازی در صورت ارسال پروپ از سایدبار برنامه
  React.useEffect(() => {
    const rawTab = (activeSubTab || activeSubTabId) as string | undefined;
    if (rawTab) {
      // تطبیق شناسه‌ها
      if (rawTab.includes('minute') || rawTab === '03-minutes') setCurrentSubTab('minutes');
      else if (rawTab.includes('member') || rawTab === '02-members') setCurrentSubTab('members');
      else if (rawTab.includes('action') || rawTab === '04-actions') setCurrentSubTab('actions');
      else if (rawTab.includes('archive') || rawTab === '05-archive') setCurrentSubTab('archive');
      else setCurrentSubTab('charter');
    }
  }, [activeSubTab, activeSubTabId]);

  const handleSubTabClick = (tabId: string) => {
    setCurrentSubTab(tabId);
    if (onSubTabChange) {
      onSubTabChange(tabId as CommitteeSubTabId);
    }
  };

  const subTabs = [
    { id: 'charter', label: 'نظام‌نامه و آیین‌نامه کمیته', icon: FileText },
    { id: 'members', label: 'اعضای کمیته و ماتریس مسئولیت', icon: Users },
    { id: 'minutes', label: 'صورتجلسات کمیته انرژی', icon: ClipboardList },
    { id: 'actions', label: 'پیگیری مصوبات و اقدامات', icon: CheckSquare },
    { id: 'archive', label: 'آرشیو و مستندات پیوست', icon: Archive },
  ];

  return (
    <div className="flex flex-col gap-5 animate-fadeIn" dir="rtl">
      {/* نوار ناوبری افقی بالای تب (Sub-Tab Navigation Bar) */}
      <div className="enms-card p-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {subTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleSubTabClick(tab.id)}
                className={`flex items-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[var(--color-primary)] text-slate-950 shadow-sm'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ناحیه رندرینگ محتوای ساب‌تب انتخاب‌شده */}
      <div className="w-full">
        {currentSubTab === 'charter' && <CommitteeCharterView />}
        {currentSubTab === 'members' && <CommitteeMembersView />}
        {currentSubTab === 'minutes' && <MeetingMinutesView />}
        {currentSubTab === 'actions' && <ActionTrackerView />}
        {currentSubTab === 'archive' && <CommitteeArchiveView />}
      </div>
    </div>
  );
};

export default EnergyCommitteeTab;