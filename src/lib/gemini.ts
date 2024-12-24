import {GoogleGenerativeAI} from "@google/generative-ai"

export const genAi= new GoogleGenerativeAI(process.env.GEMINI_KEY || "")