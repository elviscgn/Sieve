export interface Skill {
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  yearsOfExperience: number;
}

export interface Language {
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

export interface Experience {
  company: string;
  role: string;
  "Start Date": string;
  "End Date": string;
  description: string;
  technologies: string[];
  "Is Current": boolean;
}

export interface Education {
  institution: string;
  degree: string;
  "Field of Study": string;
  "Start Year": number;
  "End Year": number;
}

export interface Certification {
  name: string;
  issuer: string;
  "Issue Date": string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  role: string;
  link?: string;
  "Start Date": string;
  "End Date": string;
}

export interface Availability {
  status: 'Available' | 'Open to Opportunities' | 'Not Available';
  type: 'Full-time' | 'Part-time' | 'Contract';
  "Start Date"?: string;
}

export interface SocialLinks {
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

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