export type DatasetId =
  | 'electrical-energy'
  | 'enpi-performance'
  | 'production-operations'
  | 'dispatch-sales'
  | 'inventory-silos'
  | 'organization-context'
  | 'seu-registry';

export interface SchemaRegistryItem {
  id: DatasetId;
  title: string;
  description: string;
  filePath: string;
  primaryKey: string;
  indexedFields?: string[];
  updateFrequency?: string;
  unit?: string;
  schema?: Record<string, any>;
  joins?: Array<{
    targetDataset: string;
    on: string;
    relationship: string;
  }>;
}

export interface SchemaRegistry {
  registryVersion: string;
  standard: string;
  primaryKeyGlobal: string;
  dateKeyFormat: string;
  calendarType: string;
  datasets: Record<DatasetId, SchemaRegistryItem>;
}

export interface FilterState {
  startDate: string;
  endDate: string;
  selectedYear: string;
  selectedMonth: string;
  quickRange: '7d' | '30d' | 'month' | 'all';
}