// =============================================================================
// تایپ‌های معماری مرکزی هوش مصنوعی، مدیریت توکن و RAG دامنه‌ای
// پلتفرم مدیریت انرژی ISO 50001:2018
// =============================================================================

export type AIScope =
  | 'opportunity-analysis' // تحلیل و غربالگری فرصت‌های بهینه‌سازی (بند ۶.۲)
  | 'ahp-scoring'          // پیشنهاد نمرات مقایسات زوجی و اولویت‌بندی AHP
  | 'seu-audit'            // ممیزی مصرف‌کننده‌های بارز انرژی (بند ۶.۳)
  | 'enpi-forecast'        // پیش‌بینی شاخص‌ها و تحلیل انحرافات CUSUM (بند ۶.۴ و ۹.۱)
  | 'action-planning'      // تدوین WBS و گانت پروژه‌ها
  | 'general-enms';        // پاسخ به سؤالات عمومی استاندارد

export interface AITokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCostUSD: number;
}

export interface AIRequestPayload {
  scope: AIScope;
  prompt: string;
  departmentContext?: string;
  targetEquipment?: string;
  parameters?: Record<string, any>;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponsePayload<T = any> {
  success: boolean;
  data?: T;
  rawText?: string;
  tokensUsed?: AITokenUsage;
  latencyMs: number;
  provider: 'local-rag-heuristic' | 'gemini-api' | 'openai-api' | 'claude-api';
  error?: string;
}

export interface AIRagKnowledgeChunk {
  id: string;
  scope: AIScope;
  category: string;
  department?: string;
  title: string;
  content: string;
  keywords: string[];
  benchmarks?: Record<string, any>;
  targetSEU?: string;
  carrier?: string;
  type?: any;
  description?: string;
  estSavingMillionRials?: number;
  estCapexMillionRials?: number;
  estSavingGJ?: number;
  estSavingMWh?: number;
}

export type CementBatRecommendation = AIRagKnowledgeChunk;

export interface AIProviderConfig {
  activeProvider: 'local-heuristic' | 'gemini' | 'openai';
  apiKey?: string;
  modelName: string;
  maxDailyTokens: number;
  tokensConsumedToday: number;
}