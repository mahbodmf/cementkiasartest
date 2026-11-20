// =============================================================================
// Re-export of all domain, project, and navigation types for the EnMS Platform
// =============================================================================

export * from './types/index';

export interface EnMSMasterDataset {
  energyPerformance: any[];
  electricalEnergy: any[];
  productionOperations: any[];
  dispatchSales: any[];
  inventorySilos: any[];
}