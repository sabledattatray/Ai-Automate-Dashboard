import { GoogleGenAI, Type } from "@google/genai";
import { TileConfig } from "../store/canvasStore";

let aiClient: GoogleGenAI | null = null;
function getAiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.error("[AI] GEMINI_API_KEY is missing from environment");
      throw new Error("AI Configuration Error: GEMINI_API_KEY is missing. Please check your settings.");
    }
    console.log("[AI] Initializing GoogleGenAI client...");
    aiClient = new GoogleGenAI({ apiKey: key });
  }
  return aiClient;
}

export async function generateDashboardLayout(columns: string[], sampleData: any[], datasetId: string, datasetName: string): Promise<TileConfig[]> {
  const prompt = `
You are an expert Data Analyst and BI Dashboard Designer.
I have a dataset named "${datasetName}".
Here are the columns: ${columns.join(", ")}.
Here are a few sample rows:
${JSON.stringify(sampleData.slice(0, 5), null, 2)}

Design a professional, informative, and visually appealing dashboard layout using these columns.
Determine the data types and best chart types to represent the data.

CRITICAL LAYOUT REQUIREMENTS:
1. You MUST generate EXACTLY 10 tiles in total: 4 "KPI_CARD" tiles and 6 visual charts (BAR_CHART, LINE_CHART, PIE_CHART).
2. The 4 KPI cards MUST be placed horizontally in the top row (y=0):
   - Card 1: x=0, y=0, w=3, h=2
   - Card 2: x=3, y=0, w=3, h=2
   - Card 3: x=6, y=0, w=3, h=2
   - Card 4: x=9, y=0, w=3, h=2
3. The 6 visual charts MUST be placed below the KPI cards, with 2 charts per row across 3 rows:
   - Row 2 Charts (y=2): Chart 1 (x=0, w=6, h=4), Chart 2 (x=6, w=6, h=4)
   - Row 3 Charts (y=6): Chart 3 (x=0, w=6, h=4), Chart 4 (x=6, w=6, h=4)
   - Row 4 Charts (y=10): Chart 5 (x=0, w=6, h=4), Chart 6 (x=6, w=6, h=4)

Guidelines & Aggregations:
- For counting total rows (like "Total Orders", "Total Users"), YOU MUST SET \`aggregation: "count"\` and set \`yAxis\` to a valid primary key or ID column that isn't null. Do NOT use "sum" on a non-numeric column (it will result in 0).
- For calculating numerical totals (like "Total Revenue", "Total Cost"), use \`aggregation: "sum"\` and make SURE the \`yAxis\` column is genuinely numeric data.
- Ensure the 6 charts are diverse ("all different and most popular"), using a mix of Bar, Line, and Pie charts where appropriate.
- Use KPI cards for high-level summaries (Total count, Average revenue, etc).
- Use Bar charts for categorical comparisons.
- Use Line charts for trends over time if a date or time-like column exists.
- Use Pie charts for composition/percentages.
- Provide descriptive titles.

Return the layout as a JSON array of TileConfig objects.
Each TileConfig must have these fields:
- type: "BAR_CHART" | "LINE_CHART" | "PIE_CHART" | "KPI_CARD"
- title: string (descriptive)
- x: number (grid x position, each cell is 1 unit, max 12 units width)
- y: number (grid y position)
- w: number (width in units, e.g., 3 for KPI, 6 for Charts)
- h: number (height in units, e.g., 2 for KPI, 4 for Charts)
- xAxis?: string (required for BAR, LINE, PIE charts, the column name)
- yAxis?: string (the column name to aggregate, can be left undefined for simple COUNT)
- aggregation?: "sum" | "count" | "max" | "min" | "avg"
- prefix?: string (e.g. "$ ")
- decimals?: number
  
Ensure the x, y coordinates form a nice grid layout.
Do NOT use TEXT type.
Make sure xAxis and yAxis match the exact column names provided.
`;

  try {
    console.log(`[AI] Generating layout for dataset: ${datasetName} with ${columns.length} columns`);
    const response = await getAiClient().models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              type: { type: Type.STRING, enum: ["BAR_CHART", "LINE_CHART", "PIE_CHART", "KPI_CARD"] },
              title: { type: Type.STRING },
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER },
              w: { type: Type.NUMBER },
              h: { type: Type.NUMBER },
              xAxis: { type: Type.STRING },
              yAxis: { type: Type.STRING },
              aggregation: { type: Type.STRING, enum: ["sum", "count", "max", "min", "avg"] },
              prefix: { type: Type.STRING },
              decimals: { type: Type.NUMBER }
            },
            required: ["type", "title", "x", "y", "w", "h"]
          }
        }
      }
    });

    console.log("[AI] Response received:", response);
    let text = response.text;
    if (!text) throw new Error("AI returned empty response");
    
    // Remove markdown code blocks if present
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const tilesRaw = JSON.parse(text);
    
    // Add unique IDs and datasetId to each tile
    return tilesRaw.map((tile: any) => ({
      ...tile,
      id: Math.random().toString(36).substring(7),
      datasetId,
    }));
  } catch (error) {
    console.error("Failed to generate dashboard:", error);
    throw error;
  }
}
