import {
  AIRequestPayload,
  AIResponsePayload,
  AIProviderConfig,
  AITokenUsage,
} from './types';
import { AIRagContextEngine } from './ragContextEngine';

const STORAGE_KEY_CONFIG = 'enms_ai_provider_config_v1';

export class AIService {
  private static instance: AIService;
  private config: AIProviderConfig = {
    activeProvider: 'local-heuristic',
    modelName: 'enms-rule-based-engine-v1',
    maxDailyTokens: 100000,
    tokensConsumedToday: 0,
  };

  private constructor() {
    this.loadConfig();
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {
      // استفاده از مقادیر پیش‌فرض
    }
  }

  public saveConfig(newConfig: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(this.config));
  }

  public getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  /**
   * پردازش مرکزی درخواست‌های AI از سراسر سیستم با رعایت Guardrail و سهمیه توکن
   */
  public async executePrompt<T = any>(payload: AIRequestPayload): Promise<AIResponsePayload<T>> {
    const startTime = performance.now();

    // استخراج تکه‌های مرتبط از RAG
    const ragChunks = AIRagContextEngine.retrieveRelevantKnowledge(
      payload.scope,
      payload.departmentContext,
      payload.prompt
    );

    // بررسی سهمیه روزانه توکن
    if (this.config.tokensConsumedToday >= this.config.maxDailyTokens) {
      return {
        success: false,
        latencyMs: Math.round(performance.now() - startTime),
        provider: 'local-rag-heuristic',
        error: 'سقف مجاز مصرف روزانه توکن هوش مصنوعی به پایان رسیده است.',
      };
    }

    // شبیه‌سازی مصرف توکن و هزینه بر اساس طول پرامپت
    const simulatedPromptTokens = Math.ceil(payload.prompt.length / 3) + 120;
    const simulatedCompletionTokens = 180;
    const totalTokens = simulatedPromptTokens + simulatedCompletionTokens;

    const tokenUsage: AITokenUsage = {
      promptTokens: simulatedPromptTokens,
      completionTokens: simulatedCompletionTokens,
      totalTokens,
      estimatedCostUSD: totalTokens * 0.000002,
    };

    this.config.tokensConsumedToday += totalTokens;
    this.saveConfig(this.config);

    // پاسخ‌یابی از پایگاه دانش RAG
    if (ragChunks.length > 0) {
      const bestMatch = ragChunks[0];
      const resultData = {
        title: bestMatch.title,
        department: bestMatch.department || payload.departmentContext,
        targetSEU: bestMatch.category,
        description: bestMatch.content,
        estimatedCapexMillionRials: bestMatch.benchmarks?.typicalCapexRials || 25000,
        estimatedFinancialSavingMillionRials: bestMatch.benchmarks?.typicalSavingRials || 18000,
        simplePaybackYears: bestMatch.benchmarks?.paybackYears || 1.38,
        ahpScores: bestMatch.benchmarks?.ahpScores || { saving: 4, eco: 4, risk: 4, hse: 3, supply: 4 },
      } as unknown as T;

      return {
        success: true,
        data: resultData,
        rawText: bestMatch.content,
        latencyMs: Math.round(performance.now() - startTime),
        provider: 'local-rag-heuristic',
        tokensUsed: tokenUsage,
      };
    }

    // تولید سناریوی هوشمند هیوریستیک در صورت عدم تطابق مستقیم
    const isThermal = payload.prompt.includes('کوره') || payload.prompt.includes('گاز') || payload.departmentContext?.includes('کوره');
    const genericObj = {
      title: `بهینه‌سازی مصرف انرژی ${payload.targetEquipment || payload.prompt.slice(0, 30)}`,
      department: payload.departmentContext || 'کوره و خنک‌کن',
      targetSEU: payload.targetEquipment || (isThermal ? 'کوره دوار (SEU-01)' : 'آسیاب سیمان (SEU-04)'),
      description: `اقدام اصلاحی جهت پایش و بهینه‌سازی نقاط عملکردی حامل ${isThermal ? 'گاز طبیعی' : 'برق'} و کاهش هدررفت با بهره‌گیری از تجهیزات پایش آنلاین.`,
      estimatedCapexMillionRials: isThermal ? 48000 : 22000,
      estimatedFinancialSavingMillionRials: isThermal ? 39000 : 19000,
      simplePaybackYears: isThermal ? 1.23 : 1.15,
      ahpScores: { saving: 4, eco: 4, risk: 3, hse: 3, supply: 4 },
    };

    return {
      success: true,
      data: genericObj as unknown as T,
      rawText: genericObj.description,
      latencyMs: Math.round(performance.now() - startTime),
      provider: 'local-rag-heuristic',
      tokensUsed: tokenUsage,
    };
  }
}

export const aiService = AIService.getInstance();