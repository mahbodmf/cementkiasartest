import React, { createContext, useContext, useState, useEffect } from 'react';
import { aiService } from '../services/ai/aiService';
import {
  AIRequestPayload,
  AIResponsePayload,
  AIProviderConfig,
} from '../services/ai/types';

interface AIContextType {
  config: AIProviderConfig;
  updateConfig: (newCfg: Partial<AIProviderConfig>) => void;
  resetDailyTokens: () => void;
  requestAI: <T = any>(payload: AIRequestPayload) => Promise<AIResponsePayload<T>>;
  isProcessing: boolean;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<AIProviderConfig>(aiService.getConfig());
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setConfig(aiService.getConfig());
  }, []);

  const updateConfig = (newCfg: Partial<AIProviderConfig>) => {
    aiService.saveConfig(newCfg);
    setConfig(aiService.getConfig());
  };

  const resetDailyTokens = () => {
    aiService.saveConfig({ tokensConsumedToday: 0 });
    setConfig(aiService.getConfig());
  };

  const requestAI = async <T = any>(payload: AIRequestPayload): Promise<AIResponsePayload<T>> => {
    setIsProcessing(true);
    try {
      const res = await aiService.executePrompt<T>(payload);
      setConfig(aiService.getConfig());
      return res;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AIContext.Provider
      value={{
        config,
        updateConfig,
        resetDailyTokens,
        requestAI,
        isProcessing,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = (): AIContextType => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI باید داخل <AIProvider> استفاده شود');
  }
  return context;
};