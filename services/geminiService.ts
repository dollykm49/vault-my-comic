
import { GoogleGenAI, Type } from "@google/genai";
import { GradingResult, ComicMetadata } from "../types";

const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env.API_KEY || process.env.GEMINI_API_KEY || '';
  }
  return '';
};

export const geminiService = {
  gradeComic: async (images: string[], comicTitle: string): Promise<GradingResult> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const imageParts = images.map(img => ({
      inlineData: {
        data: img.split(',')[1],
        mimeType: 'image/jpeg'
      }
    }));

    const prompt = `
      You are a professional comic book grader acting as a senior CGC (Certified Guaranty Company) evaluator. 
      ${comicTitle ? `Analyze the provided image(s) of "${comicTitle}"` : "Identify the comic book in the image(s) and analyze it"} using CGC grading standards and the 10-point universal grading scale.
      
      GRADING GUIDELINES:
      1. IMAGE QUALITY: Be as forgiving as possible with image quality. Even if slightly blurry or dimly lit, try to provide your best estimate of the grade based on visible details. Only refuse if the image is completely unreadable.
      2. RESTORATION: Check for obvious signs of restoration. If suspected, note it in the analysis but still provide a grade estimate.
      3. COMPLETENESS: Front, back, and interior pages are NOT required. Grade based on whatever views are provided (even if it's just one photo).
      4. ANALYSIS: Provide a helpful breakdown of defects (creases, spine stress, color breaks, etc.) that you can see.
      
      If you can provide a grade, set status to 'success'.
      
      Provide a final numerical grade (0.1 to 10.0) based on CGC's standard increments (e.g., 9.2, 9.4, 9.6, 9.8).
      Estimate the current fair market value in USD for this specific grade.
      
      If the comic title was not provided or is generic, please identify the specific title and issue number in the 'identifiedTitle' field.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts: [...imageParts, { text: prompt }] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { 
              type: Type.STRING, 
              description: "Must be 'success', 'refused_quality', 'refused_restoration', or 'refused_uncertain'" 
            },
            refusalMessage: { type: Type.STRING, description: "Required if status is not 'success'" },
            grade: { type: Type.NUMBER },
            estimatedValue: { type: Type.NUMBER },
            analysis: { type: Type.STRING },
            corners: { type: Type.STRING },
            edges: { type: Type.STRING },
            surface: { type: Type.STRING },
            centering: { type: Type.STRING },
            identifiedTitle: { type: Type.STRING, description: "The identified title and issue number of the comic." }
          },
          required: ["status", "grade", "estimatedValue", "analysis", "corners", "edges", "surface", "centering"],
        }
      }
    });

    try {
      const jsonStr = response.text?.trim() || "{}";
      return JSON.parse(jsonStr);
    } catch (e) {
      throw new Error("Grading failed.");
    }
  },

  autofillComicDetails: async (title: string, image?: string): Promise<ComicMetadata> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [{ text: `Identify this comic: "${title}". Return JSON with: publisher, issueNumber, publishYear, briefHistory.` }];
    
    if (image) {
      parts.push({
        inlineData: {
          data: image.split(',')[1],
          mimeType: 'image/jpeg'
        }
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            publisher: { type: Type.STRING },
            issueNumber: { type: Type.STRING },
            publishYear: { type: Type.INTEGER },
            briefHistory: { type: Type.STRING }
          },
          required: ["title", "publisher", "issueNumber", "publishYear", "briefHistory"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  },

  generateArt: async (prompt: string, aspectRatio: string): Promise<string> => {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            text: `Generate a high-quality comic book style illustration based on this prompt: "${prompt}". The style should be professional comic art, with dynamic lighting and detailed line work.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio as any,
          imageSize: "1K"
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  }
};
