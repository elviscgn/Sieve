import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { IDimension } from '../models/Job'; // Importing our blueprint

dotenv.config();

// 1. Initialize the SDK
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is missing in the environment variables');
}
const genAI = new GoogleGenerativeAI(apiKey);

// 2. The Generation Function
export const generateRubricFromJD = async (rawJD: string): Promise<IDimension[]> => {
  try {
    // 1. The Magic Bullet: Force the SDK to only allow valid JSON
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      You are an expert technical recruiter and system evaluator. 
      Analyze the following raw job description and extract a 5-dimension grading rubric to evaluate candidates.
      
      Rules:
      1. You must create exactly 5 dimensions.
      2. Each dimension must have a "name" (string).
      3. Each dimension must have a "weight" (number). The sum of all 5 weights MUST equal 100.
      4. Each dimension must have a "keywords" array containing 5-10 specific technical or soft-skill keywords.
      
      Output an array of objects.
      
      Job Description:
      """
      ${rawJD}
      """
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // 2. The Safety Net: Find the exact start and end of the JSON array
    const startIndex = responseText.indexOf('[');
    const endIndex = responseText.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("AI did not return a valid JSON array structure.");
    }

    const cleanJson = responseText.substring(startIndex, endIndex + 1);
    
    const rubric: IDimension[] = JSON.parse(cleanJson);
    return rubric;

  } catch (error) {
    console.error('Error generating rubric from Gemini:', error);
    throw new Error('Failed to generate rubric via AI');
  }
};