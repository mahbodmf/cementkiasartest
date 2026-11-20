export interface CommitteeMember {
  id: string;
  name: string;
  role: string;
  department: string;
  committeeRole: string;
  phone?: string;
  email?: string;
  signatureStatus?: string;
}

export interface CommitteeActionItem {
  id: string;
  minuteId?: string;
  title: string;
  responsible: string;
  department: string;
  deadline: string;
  status: 'در حال اقدام' | 'انجام‌شده' | 'معوق' | 'متوقف';
  progressPct: number;
  relatedSeu?: string;
}

export interface MeetingMinute {
  id: string;
  meetingNumber: string;
  date: string;
  fiscalQuarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  fiscalYear: number;
  agenda: string[];
  attendees: string[];
  summary: string;
  actionItems: CommitteeActionItem[];
  attachments?: string[];
}

export interface CommitteeCharter {
  charterTitle: string;
  standardClause: string;
  purpose: string;
  authorities: string[];
  meetingFrequency: string;
  approvalDate: string;
  rules: string[];
}