// Defines a candidate's specific technical or professional skill, including proficiency level and years of experience.
export interface Skill {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  yearsOfExperience: number;
}

// Represents a spoken or written language and the candidate's corresponding level of fluency.
export interface Language {
  name: string;
  proficiency: "Basic" | "Conversational" | "Fluent" | "Native";
}

// Details a candidate's professional work history, including their role, tenure, responsibilities, and technologies used.
export interface Experience {
  company: string;
  role: string;
  "Start Date": string;
  "End Date": string;
  description: string;
  technologies: string[];
  "Is Current": boolean;
}

// Outlines a candidate's academic background, specifying the institution, degree, field of study, and timeframe.
export interface Education {
  institution: string;
  degree: string;
  "Field of Study": string;
  "Start Year": number;
  "End Year": number;
}

// Represents an official credential, course, or qualification earned by the candidate.
export interface Certification {
  name: string;
  issuer: string;
  "Issue Date": string;
}

// Describes a specific project the candidate contributed to, highlighting their role, timeline, and technologies utilized.
export interface Project {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  link?: string;
  "Start Date": string;
  "End Date": string;
}

// Indicates the candidate's current employment status, preferred work arrangement, and potential start date.
export interface Availability {
  status: "Available" | "Open to Opportunities" | "Not Available";
  type: "Full-time" | "Part-time" | "Contract";
  "Start Date"?: string;
}

// Contains optional URLs to the candidate's professional online profiles and portfolios.
export interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

// The master interface that aggregates all candidate personal information, experience, and skills into a unified, structured talent profile.
export interface UmuravaProfile {
  "First Name": string;
  "Last Name": string;
  Email: string;
  Headline: string;
  Bio?: string;
  Location: string;
  skills: Skill[];
  languages?: Language[];
  experience: Experience[];
  education: Education[];
  certifications?: Certification[];
  projects: Project[];
  availability: Availability;
  socialLinks?: SocialLinks;
}