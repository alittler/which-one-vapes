
import { GoogleGenAI, Type } from "@google/genai";
import { ManuscriptAnalysisResponse, Note, ProjectData, Character, Relationship, Artifact, LoreEntry, TimelineEvent, AnalysisOptions, Language, Plotline, MatrixCell, AppPrompts } from "../types";
import { getAppPrompts, generateId } from "./storageService";

/**
 * Helper to get an AI client instance on-demand.
 * Validates the API key at the moment of call rather than module load.
 */
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined' || apiKey.trim().length < 10) {
    throw new Error("AI_CONFIG_ERROR: No valid API Key detected. AI features are currently disabled.");
  }
  return new GoogleGenAI({ apiKey });
};

const safeJsonParse = (jsonString: string | undefined, defaultValue: any) => {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    const candidate = match ? match[1] : jsonString;
    try {
      return JSON.parse(candidate.trim());
    } catch (e2) {
      console.warn("AI JSON Parse Failure:", e2);
      return defaultValue;
    }
  }
};

const unifiedAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    coverDescription: { type: Type.STRING },
    themes: { type: Type.ARRAY, items: { type: Type.STRING } },
    characters: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          role: { type: Type.STRING },
          description: { type: Type.STRING },
          traits: { type: Type.ARRAY, items: { type: Type.STRING } },
          species: { type: Type.STRING },
          family: { type: Type.STRING },
          archetype: { type: Type.STRING },
          livingStatus: { type: Type.STRING },
          goals: { type: Type.STRING }
        },
        required: ["name", "role", "description"]
      }
    },
    minorCharacters: { type: Type.ARRAY, items: { type: Type.STRING } },
    timeline: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          date: { type: Type.STRING },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          charactersInvolved: { type: Type.ARRAY, items: { type: Type.STRING } },
          location: { type: Type.STRING }
        },
        required: ["date", "title", "description"]
      }
    },
    locations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          type: { type: Type.STRING }
        },
        required: ["name", "description"]
      }
    },
    artifacts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          type: { type: Type.STRING },
          description: { type: Type.STRING },
          significance: { type: Type.STRING }
        }
      }
    },
    lore: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          term: { type: Type.STRING },
          definition: { type: Type.STRING },
          category: { type: Type.STRING }
        }
      }
    }
  },
  required: ["title", "summary", "characters", "timeline", "locations"]
};

export const DEFAULT_PROMPTS: AppPrompts = {
  GENERAL_AND_CHARACTERS: "Extract title, summary, characters, and themes.",
  PLOT_MATRIX_ANALYSIS: "Identify major subplots from these events.",
  TIMELINE: "Construct a chronological timeline.",
  LOCATIONS: "Extract key locations.",
  ARTIFACTS: "Extract inanimate artifacts.",
  LORE: "Extract world-building terms.",
  NOTE_ENHANCEMENT: "Expand this brainstorming fragment into a vivid narrative paragraph. Focus on imagery and atmosphere.",
  PROCESS_RAW_NOTES: "Analyze the following prose and extract entities and plot directions.",
  STRUCTURAL_ANALYSIS: "Analyze for logical consistency and plot structure.",
  SENTIMENT: "Analyze emotional tone (-10 to 10) for events.",
  RELATIONSHIPS: "Identify relationships between characters.",
  PROJECT_QA: "Answer the question using the provided context.",
  MISSPELLINGS_SCAN: 'Find misspellings of "{name}".',
  TOOLBOX_URL_ANALYSIS: "Analyze this URL for creative writer utility.",
  GENERATE_CONLANG_WORD: 'Construct a word for "{word}" in "{langName}".',
  CONNECT_NOTES: "Synthesize these notes into a narrative thread."
};

const getCurrentPrompts = async (): Promise<AppPrompts> => {
  const saved = await getAppPrompts();
  return { ...DEFAULT_PROMPTS, ...saved };
};

export const analyzeManuscript = async (text: string, tokenLimit: number = 300000, options: AnalysisOptions): Promise<ManuscriptAnalysisResponse> => {
  const ai = getAiClient();
  const model = "gemini-3-pro-preview";
  
  const systemInstruction = `You are a story architect. Perform an exhaustive scan and return strictly JSON.`;
  const contextText = text.substring(0, tokenLimit);
  
  const res = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: contextText }] }],
    config: { 
      systemInstruction,
      responseMimeType: "application/json", 
      responseSchema: unifiedAnalysisSchema,
      thinkingConfig: { thinkingBudget: 8000 }
    }
  });

  const data = safeJsonParse(res.text, {});
  return {
    title: data.title || "Untitled Project",
    summary: data.summary || "Summary extraction incomplete.",
    coverDescription: data.coverDescription || "",
    themes: data.themes || [],
    characters: (data.characters || []).map((c: any) => ({ ...c, id: generateId(), source: 'ai' })),
    minorCharacters: data.minorCharacters || [],
    timeline: (data.timeline || []).map((e: any) => ({ ...e, id: generateId(), source: 'ai' })),
    locations: (data.locations || []).map((l: any) => ({ ...l, id: generateId(), source: 'ai' })),
    artifacts: (data.artifacts || []).map((a: any) => ({ ...a, id: generateId(), source: 'ai' })),
    lore: (data.lore || []).map((l: any) => ({ ...l, id: generateId(), source: 'ai' })),
    urls: []
  };
};

export const detectManuscriptStructure = async (snippet: string): Promise<{actPattern: string, chapterPattern: string, scenePattern: string}> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const systemInstruction = "Identify novel structure patterns (Acts, Chapters, Scenes) from the text. Return JSON with Javascript Regex strings (using ^ for start-of-line).";
  
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze this manuscript snippet and find the splitting patterns: ${snippet.substring(0, 10000)}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          actPattern: { type: Type.STRING, description: "Regex for Parts or Acts (e.g. ^Part [0-9]+)" },
          chapterPattern: { type: Type.STRING, description: "Regex for Chapters (e.g. ^Chapter [0-9]+)" },
          scenePattern: { type: Type.STRING, description: "Regex for Scene breaks (e.g. ^\\*\\*\\*)" }
        },
        required: ["actPattern", "chapterPattern", "scenePattern"]
      }
    }
  });
  
  return safeJsonParse(response.text, { actPattern: "^Part\\s+[0-9]+", chapterPattern: "^Chapter\\s+[0-9]+", scenePattern: "^\\*\\*\\*" });
};

export const getEvocativeTitles = async (scenes: {id: string, content: string}[]): Promise<{id: string, title: string}[]> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  
  const payload = scenes.map(s => `ID: ${s.id}\nCONTENT: ${s.content.substring(0, 500)}`).join('\n\n---\n\n');
  
  const response = await ai.models.generateContent({
    model,
    contents: `Generate 3-5 word evocative titles for these scenes:\n\n${payload}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING }
          },
          required: ["id", "title"]
        }
      }
    }
  });
  
  return safeJsonParse(response.text, []);
};

export const doubleProcessNote = async (rawNote: string): Promise<{ expanded: string, summary: string, tags: string[] }> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const prompts = await getCurrentPrompts();

  // Stage 1: Narrative Expansion
  const expansionRes = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: `${prompts.NOTE_ENHANCEMENT}\n\nNote: ${rawNote}` }] }]
  });
  const expandedText = expansionRes.text || rawNote;

  // Stage 2: Data Extraction
  const processingRes = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: `${prompts.PROCESS_RAW_NOTES}\n\nText: ${expandedText}` }] }],
    config: { 
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          insights: { type: Type.STRING }
        }
      }
    }
  });

  const meta = safeJsonParse(processingRes.text, { summary: "", tags: [] });
  return {
    expanded: expandedText,
    summary: meta.summary + (meta.insights ? `\n\nInsight: ${meta.insights}` : ""),
    tags: meta.tags || []
  };
};

export const generateBookCover = async (title: string, author: string, summary: string): Promise<string | null> => {
  const ai = getAiClient();
  const prompt = `Book cover for "${title}" by ${author}. Summary: ${summary}. Atmospheric, high quality, no text.`;
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [{ text: prompt }] },
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
};

export const processRawNotes = async (text: string): Promise<{content: string, category: string, tags: string[], analysis: string}[]> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze and extract entities: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            content: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            analysis: { type: Type.STRING }
          },
          required: ["content", "category", "tags", "analysis"]
        }
      }
    }
  });
  return safeJsonParse(response.text, []);
};

export const extractThemesFromNotes = async (notes: Note[]): Promise<string[]> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const text = notes.map(n => n.content).join('\n');
  const response = await ai.models.generateContent({
    model,
    contents: `Extract literary themes: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
    }
  });
  return safeJsonParse(response.text, []);
};

export const askProjectAI = async (prompt: string, projectData: ProjectData | null): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const context = projectData ? `Project Title: ${projectData.title}` : "No project context.";
  const response = await ai.models.generateContent({
    model,
    contents: `${context}\n\nUser Question: ${prompt}`,
  });
  return response.text || "No response generated.";
};

export const analyzeRelationships = async (text: string, characters: Character[]): Promise<Relationship[]> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const charNames = characters.map(c => c.name).join(', ');
  const response = await ai.models.generateContent({
    model,
    contents: `Identify relationships between (${charNames}) in: ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sourceId: { type: Type.STRING },
            targetId: { type: Type.STRING },
            type: { type: Type.STRING },
            description: { type: Type.STRING }
          }
        }
      }
    }
  });
  const data = safeJsonParse(response.text, []);
  return data.map((rel: any) => ({
    id: generateId(),
    sourceId: characters.find(c => c.name === rel.sourceId)?.id || rel.sourceId,
    targetId: characters.find(c => c.name === rel.targetId)?.id || rel.targetId,
    type: rel.type,
    description: rel.description
  }));
};

export const analyzeUrlForToolbox = async (url: string): Promise<{label: string, category: string, description: string}> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze website utility for a writer: ${url}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { label: { type: Type.STRING }, category: { type: Type.STRING }, description: { type: Type.STRING } }
      }
    }
  });
  return safeJsonParse(response.text, { label: url, category: 'General', description: '' });
};

export const generateConlangWord = async (language: Language, word: string): Promise<{translation: string, etymology: string}> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: `Construct word for "${word}" based on phonology rules of ${language.name}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { translation: { type: Type.STRING }, etymology: { type: Type.STRING } }
      }
    }
  });
  return safeJsonParse(response.text, { translation: word, etymology: '' });
};

export const analyzeConlangPhonology = async (dictionary: string): Promise<string> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const prompt = `
    You are an expert computational linguist specializing in phonology and conlanging.
    Analyze the following fictional dictionary and deduce a set of plausible phonological rules in IPA notation.
    
    Dictionary Data:
    ---
    ${dictionary}
    ---

    Return a Markdown report including:
    1. A descriptive name for detected rules.
    2. The rule in standard format (A → B / X _ Y).
    3. Concise linguistic explanation.
    4. Examples from the provided data.
  `;
  const response = await ai.models.generateContent({
    model,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  });
  return response.text || "Phonological analysis inconclusive.";
};

export const analyzePlotMatrix = async (events: TimelineEvent[]): Promise<{ plotlines: Plotline[], cells: MatrixCell[] }> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";
  const eventData = events.map(e => e.title).join(', ');
  const response = await ai.models.generateContent({
    model,
    contents: `Identify major subplots and development beats: ${eventData}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plotlines: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, color: { type: Type.STRING } } } },
          cells: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { eventTitle: { type: Type.STRING }, plotlineTitle: { type: Type.STRING }, content: { type: Type.STRING } } } }
        }
      }
    }
  });

  const data = safeJsonParse(response.text, { plotlines: [], cells: [] });
  const plotlines: Plotline[] = (data.plotlines || []).map((p: any) => ({ ...p, id: generateId() }));
  const cells: MatrixCell[] = (data.cells || []).map((c: any) => {
    const event = events.find(e => e.title === c.eventTitle);
    const plotline = plotlines.find(p => p.title === c.plotlineTitle);
    return { eventId: event?.id || '', plotlineId: plotline?.id || '', content: c.content };
  }).filter((c: MatrixCell) => c.eventId && c.plotlineId);

  return { plotlines, cells };
};
