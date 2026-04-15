import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { IDimension } from '../models/Job';
import { UmuravaProfile } from '../types';

dotenv.config();

export interface IEvaluationResult {
  score: number;
  justification: string;
  strengths?: string[];
  gaps?: string[];
}
export interface IComparisonResult {
  narrative: string;
  dimensionBreakdown: {
    dimension: string;
    winner: string;
    analysis: string;
  }[];
  recommendation: string;
}

export interface IAIGeneratedRubric {
  dimensions: IDimension[];
  dealbreakers: string[];
  niceToHave: string[];
}

// 1. Initialize the SDK
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is missing in the environment variables');
}
const genAI = new GoogleGenerativeAI(apiKey);

// 2. The Generation Function
export const generateRubricFromJD = async (rawJD: string): Promise<IAIGeneratedRubric> => {  try {
    // 1. The Magic Bullet: Force the SDK to only allow valid JSON
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      You are a recruitment analyst preparing a structured scoring rubric 
    for AI-based candidate evaluation.

    IMPORTANT CONTEXT: The rubric you produce will be used to score 
    candidate profiles. The keywords you extract will be matched directly 
    against candidate skill names, job titles, technologies used in 
    projects, and experience descriptions. Extract keywords that are 
    specific, matchable, and directly present in the job description.


    YOUR TASK:
    Analyze the job description and fill in the description and keywords 
    for each dimension below. The dimension names and weights are fixed -- 
    do not change them. Your only job is to write accurate, JD-specific 
    descriptions and extract precise keywords.

    DESCRIPTION QUALITY RULES:
    - Each description must be 2-3 sentences
    - Must reference specific requirements from this JD, not generic statements
    - Must be specific enough to guide an AI scoring a candidate profile
    - Bad example: "Technical skills relevant to the role"
    - Good example: "Candidate must demonstrate proficiency in React and 
      TypeScript with evidence of production deployments. Node.js backend 
      experience and familiarity with REST API design are strongly 
      preferred. Cloud platform exposure (AWS or GCP) is a bonus."

    KEYWORD EXTRACTION RULES:
    - Extract only terms explicitly mentioned or strongly implied in the JD
    - For Technical Skills: extract specific technologies, frameworks, 
      languages, tools (e.g. "React", "TypeScript", "PostgreSQL", "Docker")
    - For Experience Relevance: extract role titles, domains, seniority 
      signals (e.g. "frontend engineer", "4 years", "production", "shipped")
    - For Education Alignment: extract degrees, fields, certifications 
      mentioned. If JD does not mention education, return ["not specified"]
    - For Profile Fit: extract portfolio signals mentioned 
      (e.g. "GitHub", "portfolio", "open source", "side projects")
    - For Red Flag Indicators: extract explicit warnings plus infer 
      common mismatches for this role type 
      (e.g. "no frontend experience", "only backend", "career gap")
    - Each keywords array must have between 3 and 12 items
    - Keywords must be lowercase strings

    FALLBACK RULE: If the JD provides no information for a dimension, 
    write a sensible default description for the role type inferred 
    from the JD and note "(inferred)" at the end of the description.

    Return ONLY the following JSON. No markdown, no explanation, 
    no preamble. The JSON must be valid and parseable.

    {
      "dimensions": [
        {
          "name": "Technical Skills Match",
          "description": "YOUR 2-3 SENTENCE JD-SPECIFIC DESCRIPTION",
          "weight": 30,
          "keywords": ["specific", "tech", "terms", "from", "JD"]
        },
        {
          "name": "Experience Relevance",
          "description": "YOUR 2-3 SENTENCE JD-SPECIFIC DESCRIPTION",
          "weight": 25,
          "keywords": ["role", "titles", "seniority", "domain", "signals"]
        },
        {
          "name": "Education Alignment",
          "description": "YOUR 2-3 SENTENCE JD-SPECIFIC DESCRIPTION",
          "weight": 15,
          "keywords": ["degree", "field", "certifications"]
        },
        {
          "name": "Profile Fit",
          "description": "YOUR 2-3 SENTENCE JD-SPECIFIC DESCRIPTION",
          "weight": 15,
          "keywords": ["portfolio", "github", "projects", "contributions"]
        },
        {
          "name": "Red Flag Indicators",
          "description": "YOUR 2-3 SENTENCE JD-SPECIFIC DESCRIPTION",
          "weight": 15,
          "keywords": ["gap", "mismatch", "overqualified", "unrelated"]
        }
      ],
      "dealbreakers": [
        "list only hard requirements explicitly stated in the JD",
        "if none stated, return empty array"
      ],
      "niceToHave": [
        "list only nice-to-haves explicitly stated in the JD",
        "if none stated, return empty array"
      ]
    }

    Weights must sum to exactly 100. Do not change the weights.
    Do not add or remove dimensions.
    
    You must return a single, valid JSON object with exactly three root keys. Do not return loose arrays. Use this exact structure: 
{ 
  "dimensions": [ { "name": "...", "description": "...", "weight": 0, "keywords": ["..."] } ], 
  "dealbreakers": ["..."], 
  "niceToHave": ["..."] 
}
      
      Job Description:
      """
      ${rawJD}
      """
    `;

   const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

    // 1. Find the start of the master object
    const startIndex = cleanText.indexOf('{');
    if (startIndex === -1) {
      throw new Error("No master JSON object found in AI response");
    }

    // 2. The Brace Counter: isolates the master object
    let depth = 0;
    let endIndex = -1;

    for (let i = startIndex; i < cleanText.length; i++) {
      if (cleanText[i] === '{') depth++;
      else if (cleanText[i] === '}') depth--;

      // When depth returns to 0, we found the final closing brace
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }

    if (endIndex === -1) {
      throw new Error("Unclosed JSON object in AI response");
    }

    // 3. Extract and parse
    const pureJson = cleanText.substring(startIndex, endIndex + 1);
    
    // Notice we removed the strict IDimension[] type here because 
    // it's now an object containing multiple arrays.
    const rubric = JSON.parse(pureJson); 
    
    return rubric;
    
  } catch (error) {
    console.error('Error generating rubric from Gemini:', error);
    throw new Error('Failed to generate rubric via AI');
  }
};

export const evaluateCandidate = async (applicantProfile: any, rubric: any[]): Promise<any> => {
  try {
    // 1. Initialize the model with the bulletproof JSON configuration
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json' }
    });

    // 2. The Strict Prompt Engineering
    const prompt = `
      You are an expert technical recruiter AI.
      Evaluate the following candidate profile strictly against the provided grading rubric.
      
      Rules:
      1. Calculate a total score from 0 to 100 based on how well the candidate meets the rubric's dimensions and their specific weights.
      2. Write a 2-3 sentence justification explaining exactly why they received this score.
      3. Return strictly valid JSON using this exact structure:
      {
        "score": 85,
        "justification": "Overall reasoning here...",
        "strengths": ["List up to 3 specific strengths"],
        "gaps": ["List up to 3 specific missing skills or red flags"]
      }
      
      Grading Rubric:
      ${JSON.stringify(rubric, null, 2)}
      
      Candidate Profile:
      ${JSON.stringify(applicantProfile, null, 2)}
    `;

    // 3. Execution
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // 4. Parsing and Safety Guard
    const parsedResult = JSON.parse(responseText);
    
    return {
      score: parsedResult.score,
      justification: parsedResult.justification,
      strengths: parsedResult.strengths || [],
      gaps: parsedResult.gaps || []
    };

  } catch (error) {
    console.error('Error evaluating candidate:', error);
    throw new Error('Failed to evaluate candidate via AI');
  }
};

export const compareCandidates = async (jobTitle: string, rubric: any, candidates: any[]): Promise<IComparisonResult> => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      Compare these candidates for the following role and recommend which to prioritize.
      
      JOB: ${jobTitle}
      RUBRIC: ${JSON.stringify(rubric, null, 2)}
      CANDIDATES AND THEIR RESULTS: ${JSON.stringify(candidates, null, 2)}
      
      Structure your response as JSON:
      {
        "narrative": "2-3 paragraph overall comparison",
        "dimensionBreakdown": [
          {
            "dimension": "Technical Skills Match",
            "winner": "candidateId",
            "analysis": "one sentence per candidate"
          }
        ],
        "recommendation": "which candidate to prioritize and why in 2 sentences"
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText) as IComparisonResult;

  } catch (error) {
    console.error('Error generating candidate comparison:', error);
    throw new Error('Failed to generate comparison via AI');
  }
};

export const streamCandidateQA = async (question: string, profile: UmuravaProfile, rubric: IAIGeneratedRubric) => {
  try {
    // We stick to lite for high-speed, reliable streaming
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    const prompt = `
      You are an expert, objective technical recruiter assisting a hiring manager.
      You have been asked a specific question about a candidate's fit for a role.
      
      You must answer the question strictly based on the provided Candidate Profile 
      and the Job Rubric below. Do NOT invent or hallucinate information. If the 
      answer cannot be determined from the provided data, state that explicitly.
      Keep your answer concise, professional, and directly address the recruiter's question.

      === JOB RUBRIC ===
      ${JSON.stringify(rubric, null, 2)}

      === CANDIDATE PROFILE ===
      ${JSON.stringify(profile, null, 2)}

      === RECRUITER'S QUESTION ===
      ${question}
    `;

    // The Magic: We use generateContentStream instead of generateContent
    const result = await model.generateContentStream(prompt);
    
    // We return the raw stream object directly to the controller
    return result.stream;
    
  } catch (error) {
    console.error('Error streaming Candidate Q&A from Gemini:', error);
    throw new Error('Failed to stream Q&A response');
  }
};

export const generateIntelligenceInsights = async (sessionsSummary: any) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      Analyze these recruitment screening sessions and identify patterns in the talent pool.
      
      SESSIONS SUMMARY: 
      ${JSON.stringify(sessionsSummary, null, 2)}
      
      Return strictly valid JSON using this exact structure:
      { 
        "totalSessionsAnalyzed": number,
        "overallMatchRate": number,
        "matchRatesByRole": [
          { "roleTitle": "string", "averageMatchRate": number }
        ],
        "matchRateTrend": [
          { "date": "YYYY-MM", "roleTitle": "string", "matchRate": number }
        ],
        "topSkillGaps": ["skill1", "skill2", "skill3"],
        "insights": [
          {
            "type": "skill_gap" | "match_rate" | "requirement_mismatch",
            "title": "short insight title",
            "description": "2-3 sentences of analysis",
            "affectedRoles": ["role types"],
            "affectedSessionCount": number,
            "recommendation": "one actionable suggestion"
          }
        ]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);
  } catch (error) {
    console.error('Error generating intelligence insights:', error);
    throw new Error('Failed to generate intelligence from AI');
  }
};

export const parseResumeToProfile = async (rawResumeText: string) => {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash-lite',
      generationConfig: { responseMimeType: 'application/json' }
    });

    const prompt = `
      You are an expert recruitment data extraction AI.
      Read the following raw, unstructured text extracted from a candidate's PDF resume.
      
      Your job is to extract their information and format it STRICTLY into the JSON structure below.
      
      CRITICAL RULES:
      1. You must use the EXACT key names provided, including those with spaces (e.g., "First Name", "Start Date").
      2. If a piece of information is missing, use an empty string "", an empty array [], or omit the optional field entirely. Do NOT invent data.
      3. For ENUM fields (level, proficiency, status, type), you MUST choose one of the exact string options provided in the schema comments.
      4. Dates should generally be formatted as "YYYY-MM" or "YYYY" depending on the section context. If a job is current, "End Date" should be "Present".
      
      EXPECTED JSON SCHEMA:
      {
        "First Name": "string",
        "Last Name": "string",
        "Email": "string",
        "Headline": "string (create a short professional summary based on experience)",
        "Bio": "string (optional detailed summary)",
        "Location": "string (City, Country)",
        "skills": [
          {
            "name": "string",
            "level": "MUST BE EXACTLY ONE OF: Beginner | Intermediate | Advanced | Expert",
            "yearsOfExperience": number
          }
        ],
        "languages": [
          {
            "name": "string",
            "proficiency": "MUST BE EXACTLY ONE OF: Basic | Conversational | Fluent | Native"
          }
        ],
        "experience": [
          {
            "company": "string",
            "role": "string",
            "Start Date": "YYYY-MM",
            "End Date": "YYYY-MM | Present",
            "description": "string (key responsibilities and achievements)",
            "technologies": ["string"],
            "Is Current": boolean
          }
        ],
        "education": [
          {
            "institution": "string",
            "degree": "string",
            "Field of Study": "string",
            "Start Year": number (YYYY),
            "End Year": number (YYYY)
          }
        ],
        "certifications": [
          {
            "name": "string",
            "issuer": "string",
            "Issue Date": "YYYY-MM"
          }
        ],
        "projects": [
          {
            "name": "string",
            "description": "string",
            "technologies": ["string"],
            "role": "string",
            "link": "string (optional)",
            "Start Date": "YYYY-MM",
            "End Date": "YYYY-MM"
          }
        ],
        "availability": {
          "status": "MUST BE EXACTLY ONE OF: Available | Open to Opportunities | Not Available",
          "type": "MUST BE EXACTLY ONE OF: Full-time | Part-time | Contract",
          "Start Date": "YYYY-MM-DD (optional)"
        },
        "socialLinks": {
          "linkedin": "string (optional)",
          "github": "string (optional)",
          "portfolio": "string (optional)"
        }
      }

      RAW RESUME TEXT:
      """
      ${rawResumeText}
      """
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    return JSON.parse(responseText);

  } catch (error) {
    console.error('Error parsing resume via AI:', error);
    throw new Error('Failed to parse resume into official profile schema');
  }
};