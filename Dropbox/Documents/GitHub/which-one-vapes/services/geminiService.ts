
import { GoogleGenAI, Type } from "@google/genai";
import { VerdictResponse } from "../types";

export const getComparativeVerdict = async (name1: string, name2: string): Promise<VerdictResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a satirical social scientist. Compare ${name1} and ${name2}. Determine which one of them is more likely to own a high-tech vaporizer in the modern era. 
      Provide a funny, creative reasoning for the comparison. 
      Identify a 'vape leader' between the two and a short vibe summary.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            comparisonReasoning: { type: Type.STRING, description: "Humorous comparison of the two candidates' vape energy." },
            vapeLeader: { type: Type.STRING, description: "The name of the candidate most likely to be the vaper." },
            vibeSummary: { type: Type.STRING, description: "A 5-word summary of the matchup energy." }
          },
          required: ["comparisonReasoning", "vapeLeader", "vibeSummary"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    return JSON.parse(text) as VerdictResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      comparisonReasoning: "The humidity in the room is too high to tell. Both candidates are currently obscured by a thick, strawberry-scented cloud.",
      vapeLeader: name1,
      vibeSummary: "Cloudy with a chance of pods."
    };
  }
};
