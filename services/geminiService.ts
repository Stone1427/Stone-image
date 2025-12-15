import { GoogleGenAI } from "@google/genai";

export async function editImageWithPrompt(
  base64ImageData: string,
  mimeType: string,
  prompt: string,
  apiKey: string
): Promise<string | null> {
  
  if (!apiKey) {
    throw new Error("Clé API manquante. Veuillez configurer votre clé dans App.tsx ou via l'interface.");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  const imagePart = {
    inlineData: {
      data: base64ImageData,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: prompt,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [imagePart, textPart],
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return part.inlineData.data;
        }
    }
    return null;

  } catch (error) {
    console.error("Error calling AI API:", error);
    if (error instanceof Error) {
        throw new Error(`API Error: ${error.message}`);
    }
    throw new Error('An unknown error occurred while communicating with the API.');
  }
}