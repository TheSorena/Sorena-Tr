
import { GoogleGenAI, Type } from "@google/genai";
import { SubtitleBlock, TargetLanguage } from "../types";

const MAX_RETRIES = 3;

/**
 * Professional Translation Service.
 * Robust handling of environment variables and rate limits.
 */
export const translateChunk = async (
  blocks: SubtitleBlock[], 
  targetLang: TargetLanguage,
  tone: 'formal' | 'conversational' = 'conversational'
): Promise<SubtitleBlock[]> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING: متغیر محیطی تنظیم نشده است.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const langMap: Record<TargetLanguage, string> = {
    fa: 'Persian (Farsi)',
    en: 'English',
    es: 'Spanish',
    ar: 'Arabic',
    fr: 'French',
    de: 'German',
    tr: 'Turkish',
    ru: 'Russian'
  };

  const targetLangName = langMap[targetLang] || 'Persian';
  const toneContext = tone === 'formal' ? "Formal & Cinematic" : "Natural & Conversational";

  const systemInstruction = `You are a professional cinematic translator. 
Target Language: ${targetLangName}. 
Tone: ${toneContext}.
CRITICAL RULES:
1. Input is JSON array of exactly ${blocks.length} strings.
2. Return JSON object: {"list": ["translation1", ...]} with exactly ${blocks.length} items.
3. Keep technical tags [music, tags] unchanged.`;

  const attemptTranslation = async (retryCount: number = 0): Promise<string[]> => {
    try {
      const inputTexts = blocks.map(b => b.text);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: `Translate: ${JSON.stringify(inputTexts)}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              list: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["list"]
          }
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response");
      const parsed = JSON.parse(text);
      
      if (!parsed.list || parsed.list.length !== blocks.length) {
        throw new Error("COUNT_MISMATCH");
      }
      return parsed.list;
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isQuota = errorMsg.includes("429") || errorMsg.includes("RESOURCE_EXHAUSTED");
      
      if (isQuota) throw new Error("RATE_LIMIT");

      if (retryCount < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, Math.pow(2, retryCount) * 2000));
        return attemptTranslation(retryCount + 1);
      }
      throw error;
    }
  };

  const translations = await attemptTranslation();
  return blocks.map((block, i) => ({
    ...block,
    text: translations[i] || block.text
  }));
};
