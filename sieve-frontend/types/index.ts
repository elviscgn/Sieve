// Umurava Talent Profile
export interface UmuravaProfile {
  "First Name": string;
  "Last Name": string;
  Email: string;
  Phone: string;
  Location: string;
  Summary: string;
  Skills: Skill[];
  "Work Experience": WorkExperience[];
  Education: Education[];
  Languages: Language[];
  Certifications: Certification[];
  Projects: Project[];
}

export interface Skill {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
}

export interface WorkExperience {
  "Job Title": string;
  Company: string;
  "Start Date": string;
  "End Date": string;
  Description: string;
}

export interface Education {
  Degree: string;
  Institution: string;
  "Start Date": string;
  "End Date": string;
}

export interface Language {
  name: string;
  proficiency: "Basic" | "Conversational" | "Fluent" | "Native";
}

export interface Certification {
  name: string;
  issuer: string;
  date: string;
}

export interface Project {
  name: string;
  description: string;
  url?: string;
}

// Job
export interface RubricDimension {
  name: string;
  description?: string;
  weight: number;
  keywords: string[];
}

export interface Rubric {
  dimensions: RubricDimension[];
  dealbreakers: string[];
  niceToHave: string[];
  confirmedBy?: string;
  confirmedAt?: string;
}

export interface Job {
  _id: string;
  title: string;
  rawJD: string;
  rubric?: Rubric;
  createdAt: string;
  updatedAt: string;
}

// Applicant
export interface ApplicantEvaluation {
  compositeScore: number;
  dimensions: {
    name: string;
    score: number;
    rationale: string;
  }[];
  strengths: string[];
  gaps: string[];
  flags: string[];
  recommendation: string;
  confidence: "high" | "medium" | "low";
}

export interface Applicant {
  _id: string;
  jobId: string;
  profile: UmuravaProfile;
  evaluation?: ApplicantEvaluation;
  recruiterRank?: number;
  createdAt: string;
}

// Screening Session
export interface ScreeningResult {
  applicantId: string;
  aiRank: number;
  recruiterRank?: number;
  compositeScore: number;
  dimensions: {
    name: string;
    score: number;
    rationale: string;
  }[];
  strengths: string[];
  gaps: string[];
  flags: string[];
  recommendation: string;
  confidence: "high" | "medium" | "low";
}

export interface ScreeningSession {
  _id: string;
  jobId: string;
  rubricSnapshot: Rubric;
  status: "pending" | "running" | "complete";
  results: ScreeningResult[];
  createdAt: string;
  completedAt?: string;
}

// Progress Event from SSE
export interface EvaluationProgressEvent {
  applicantId: string;
  name: string;
  score: number;
  totalApplicants: number;
  evaluatedCount: number;
}
