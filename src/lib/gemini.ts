import { GoogleGenerativeAI } from "@google/generative-ai";

console.log("Gemini Key:", process.env.GEMINI_KEY);
export const genAi = new GoogleGenerativeAI(process.env.GEMINI_KEY || "");
