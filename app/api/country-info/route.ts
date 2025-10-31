import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { country } = await req.json();

    if (!country) {
      return NextResponse.json({ error: "Missing 'country' parameter" }, { status: 400 });
    }

    if (!process.env.API_KEY) {
        return NextResponse.json({ error: "API key not configured" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Provide a brief, one-paragraph summary of ${country}, highlighting its most famous cultural aspects or landmarks. Keep it concise, engaging, and suitable for a travel enthusiast. Focus on what makes the country unique.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });

    const info = response.text;

    return NextResponse.json({ info });

  } catch (e: any) {
    console.error("Country info error:", e);
    return NextResponse.json({ error: e?.message || "Failed to get country info" }, { status: 500 });
  }
}
