import React, { useState } from 'react';
import {
  Bot,
  Copy,
  Check,
  Cpu,
  Clock,
  Coins,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AIResponsePayload } from '../../../../../services/ai/types';
import { toPersianDigits, formatPersianNumber } from '../../../../../utils/persianUtils';

export interface OperationsAiPanelProps {
  aiResponse?: AIResponsePayload | null;
  aiAnalysis?: AIResponsePayload | string | null;
  aiAnalysisText?: string;
  isLoading?: boolean;
}

export const OperationsAiPanel: React.FC<OperationsAiPanelProps> = ({
  aiResponse: propResponse,
  aiAnalysis,
  aiAnalysisText,
  isLoading = false,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const effectiveResponse = propResponse || (typeof aiAnalysis === 'object' && aiAnalysis !== null ? aiAnalysis : null);
  const aiResponse = effectiveResponse;
  const rawText =
    effectiveResponse?.rawText ||
    (typeof aiAnalysis === 'string' ? aiAnalysis : '') ||
    aiAnalysisText ||
    '';
  const data = effectiveResponse?.data as any;

  if (!rawText && !isLoading && !effectiveResponse) return null;

  const handleCopy = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="enms-card border border-purple-800/40 bg-[var(--color-bg-card)] rounded-2xl p-5 shadow-xl text-xs animate-fadeIn"
      dir="rtl"
    >
      {/* سربرگ پنل با نشانگرهای متادیتای سیستم مرکزی */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[var(--color-border)] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-purple-300">
                گزارش ممیزی تشخیصی هوش مصنوعی (EnMS AI Copilot - RAG Engine)
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-700/50">
                دامنه: ISO 50001 (۶.۴ و ۹.۱)
              </span>
            </div>
            <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
              مبتنی بر مدل استنتاجی خطوط پخت و پایگاه دانش تکنیک‌های دردسترس (BAT)
            </p>
          </div>
        </div>

        {/* متادیتای توکن، تاخیر و دکمه کپی */}
        <div className="flex items-center gap-2 flex-wrap">
          {aiResponse?.tokensUsed && (
            <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-secondary)] bg-[var(--color-bg-card-subtle)] px-2.5 py-1 rounded-lg border border-[var(--color-border)] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <Coins className="w-3 h-3" />
                {toPersianDigits(aiResponse.tokensUsed.totalTokens)} توکن
              </span>
              <span className="text-[var(--color-text-muted)]">|</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Clock className="w-3 h-3" />
                {toPersianDigits(aiResponse.latencyMs)} ms
              </span>
              <span className="text-[var(--color-text-muted)]">|</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <Cpu className="w-3 h-3" />
                {aiResponse.provider}
              </span>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition"
            title="کپی متن گزارش"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-[var(--color-bg-card-subtle)] hover:bg-[var(--color-bg-card)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)] transition"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* وضعیت لودینگ */}
      {isLoading && (
        <div className="py-8 flex flex-col items-center justify-center gap-2 text-purple-300">
          <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">در حال واکشی الگوهای BAT و انطباق با معیارهای پایش انرژی...</span>
        </div>
      )}

      {/* محتوای بازشو گزارش */}
      {!isLoading && isExpanded && (
        <div className="mt-4 space-y-3.5 animate-fadeIn">
          {/* کارت ساختاریافته استخراج‌شده از پایگاه دانش RAG */}
          {data && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-purple-900/40">
              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] block">عنوان راهکار و مداخله پیشنهادی:</span>
                <span className="font-bold text-[var(--color-text-primary)] text-xs mt-0.5 block">{data.title}</span>
                <span className="text-[10px] text-purple-400 font-mono mt-1 block">تجهیز هدف: {data.targetSEU}</span>
              </div>

              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] block">برآورد سرمایه‌گذاری و صرفه‌جویی سالانه:</span>
                <div className="flex items-center gap-3 mt-1 font-mono text-xs">
                  <span className="text-rose-400">
                    CAPEX: {toPersianDigits(formatPersianNumber(data.estimatedCapexMillionRials || data.estCapexMillionRials || 0))} م.ر
                  </span>
                  <span className="text-emerald-400">
                    صرفه‌جویی: {toPersianDigits(formatPersianNumber(data.estimatedFinancialSavingMillionRials || data.estSavingMillionRials || 0))} م.ر
                  </span>
                </div>
                <span className="text-[10px] text-cyan-400 font-mono mt-0.5 block">
                  دوره بازگشت ساده: {toPersianDigits(data.simplePaybackYears || 1.2)} سال
                </span>
              </div>

              <div>
                <span className="text-[10px] text-[var(--color-text-muted)] block">امتیاز شاخص‌های پنج‌گانه AHP:</span>
                {data.ahpScores ? (
                  <div className="grid grid-cols-5 gap-1 mt-1 text-center font-mono text-[10px]">
                    <div className="p-1 rounded bg-purple-950/60 border border-purple-800/40">
                      <span className="block text-[var(--color-text-muted)] text-[8px]">انرژی</span>
                      <span className="text-purple-300 font-bold">{toPersianDigits(data.ahpScores.saving)}/5</span>
                    </div>
                    <div className="p-1 rounded bg-purple-950/60 border border-purple-800/40">
                      <span className="block text-[var(--color-text-muted)] text-[8px]">مالی</span>
                      <span className="text-purple-300 font-bold">{toPersianDigits(data.ahpScores.eco)}/5</span>
                    </div>
                    <div className="p-1 rounded bg-purple-950/60 border border-purple-800/40">
                      <span className="block text-[var(--color-text-muted)] text-[8px]">ریسک</span>
                      <span className="text-purple-300 font-bold">{toPersianDigits(data.ahpScores.risk)}/5</span>
                    </div>
                    <div className="p-1 rounded bg-purple-950/60 border border-purple-800/40">
                      <span className="block text-[var(--color-text-muted)] text-[8px]">HSE</span>
                      <span className="text-purple-300 font-bold">{toPersianDigits(data.ahpScores.hse)}/5</span>
                    </div>
                    <div className="p-1 rounded bg-purple-950/60 border border-purple-800/40">
                      <span className="block text-[var(--color-text-muted)] text-[8px]">تأمین</span>
                      <span className="text-purple-300 font-bold">{toPersianDigits(data.ahpScores.supply)}/5</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-[var(--color-text-muted)] mt-1 block">ارزیابی کامل در دسترس است</span>
                )}
              </div>
            </div>
          )}

          {/* متن تشریحی گزارش */}
          <div className="p-3.5 rounded-xl bg-[var(--color-bg-card-subtle)] border border-[var(--color-border)] text-[var(--color-text-primary)] leading-relaxed font-sans whitespace-pre-line text-[11px]">
            {rawText}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsAiPanel;