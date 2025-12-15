import { GoogleGenAI } from "@google/genai";

// ==============================================================================
// CONFIGURATION DE LA CLÉ API (POUR VOTRE PC)
// ==============================================================================
// Instructions :
// 1. Obtenez votre clé API sur https://aistudio.google.com/app/apikey
// 2. Collez-la ci-dessous entre les guillemets (ex: "AIzaSy...")
// 3. Sauvegardez ce fichier.
// ==============================================================================
const LOCAL_API_KEY = ""AIzaSyDWHcP2EuO-fmlwH0rQzoixv6KsdynXIwU; 
// ==============================================================================


export async function editImageWithPrompt(
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<string | null> {
  
  // Cette ligne permet au code de fonctionner :
  // 1. Sur votre PC (en utilisant LOCAL_API_KEY que vous allez remplir)
  // 2. Dans cette démo en ligne (en utilisant process.env.API_KEY)
  const apiKey = LOCAL_API_KEY || process.env.API_KEY;

  if (!apiKey) {
    throw new Error("Clé API manquante. Veuillez ouvrir 'services/geminiService.ts' et coller votre clé dans la variable LOCAL_API_KEY tout en haut du fichier.");
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