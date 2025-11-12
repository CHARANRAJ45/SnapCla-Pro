
import { GoogleGenAI, Type } from "@google/genai";
import { NutritionInfo } from "../types";

const API_KEY = process.env.API_KEY;
const BACKUP_API_KEY = process.env.GEMINI_API_KEY_BACKUP;

const apiKeys = [API_KEY, BACKUP_API_KEY].filter(Boolean) as string[];

if (apiKeys.length === 0) {
  console.warn("No API keys configured. Gemini API calls will fail.");
}

const model = 'gemini-2.5-flash';

const nutritionSchema = {
    type: Type.OBJECT,
    properties: {
        foodName: {
            type: Type.STRING,
            description: "The name of the food item identified in the image."
        },
        calories: {
            type: Type.NUMBER,
            description: "Estimated number of calories."
        },
        protein: {
            type: Type.NUMBER,
            description: "Estimated grams of protein."
        },
        carbs: {
            type: Type.NUMBER,
            description: "Estimated grams of carbohydrates."
        },
        fat: {
            type: Type.NUMBER,
            description: "Estimated grams of fat."
        }
    },
    required: ["foodName", "calories", "protein", "carbs", "fat"],
};


const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRetryableError = (error: unknown): boolean => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        // Retry on 503 (Service Unavailable), 429 (Too Many Requests), and timeout errors
        return message.includes('503') || 
               message.includes('429') || 
               message.includes('overloaded') || 
               message.includes('unavailable') ||
               message.includes('timeout');
    }
    return false;
};

const analyzeWithKey = async (apiKey: string, base64Image: string): Promise<NutritionInfo> => {
    const ai = new GoogleGenAI({ apiKey });
    
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
        },
    };

    const textPart = {
        text: "Analyze this image of food and provide its nutritional information. Be as accurate as possible. If it's not food, return zeros for all nutritional values and 'Not a food item' as the name."
    };
    
    const response = await ai.models.generateContent({
        model: model,
        contents: { parts: [imagePart, textPart] },
        config: {
            responseMimeType: "application/json",
            responseSchema: nutritionSchema,
        }
    });

    const jsonString = response.text;
    const nutritionData = JSON.parse(jsonString) as NutritionInfo;

    return nutritionData;
};

export const analyzeFoodImage = async (base64Image: string): Promise<NutritionInfo> => {
    if (apiKeys.length === 0) {
        throw new Error("Gemini API key is not configured.");
    }
    
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    // Try with each API key
    for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
        const currentKey = apiKeys[keyIndex];
        console.log(`Attempting with API key ${keyIndex + 1}/${apiKeys.length}...`);
        
        // Retry logic for each key
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const result = await analyzeWithKey(currentKey, base64Image);
                return result;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                
                // If error is not retryable, try next key
                if (!isRetryableError(error)) {
                    console.warn(`API key ${keyIndex + 1} failed (non-retryable error), trying next key...`, error);
                    break; // Try next API key
                }
                
                // If this was the last attempt with this key, try next key
                if (attempt === maxRetries - 1) {
                    console.warn(`API key ${keyIndex + 1} failed after ${maxRetries} attempts, trying next key...`);
                    break; // Try next API key
                }
                
                // Exponential backoff: 1s, 2s, 4s
                const delayMs = Math.pow(2, attempt) * 1000;
                console.warn(`API key ${keyIndex + 1} - Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`, error);
                await sleep(delayMs);
            }
        }
    }
    
    console.error("All API keys exhausted:", lastError);
    throw new Error("Failed to analyze image with all available API keys. Please try again later.");
};
