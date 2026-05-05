import { getAiClient } from "./gemini";

export async function generateTileInsight(title: string, type: string, dataSummary: string) {
  try {
    const client = getAiClient();
    if (!client) {
      return "Error generating insight: GEMINI_API_KEY is missing.";
    }

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `You are an expert data analyst. 
      Generate 1 concise, actionable insight for a ${type} chart titled "${title}".
      Data summary: ${dataSummary}
      
      The insight should be 1-2 sentences maximum, highlighting an anomaly or trend.`,
      config: {
        systemInstruction: "You are a professional business analyst providing short insights on dashboard charts. Avoid jargon. Provide exactly one insight.",
        temperature: 0.5,
      }
    });
    return response.text;
  } catch (err) {
    console.error("Gemini API Error: ", err);
    return "Error generating insight. Please ensure the API key is configured.";
  }
}
