/**
 * TypeScript types for JSON Resume v1.0.0 schema
 * Based on: https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json
 */

export type ISO8601Date = string; // Pattern: ^([1-2][0-9]{3}-[0-1][0-9]-[0-3][0-9]|[1-2][0-9]{3}-[0-1][0-9]|[1-2][0-9]{3})$

export interface Location {
  address?: string;
  postalCode?: string;
  city?: string;
  countryCode?: string; // ISO-3166-1 ALPHA-2
  region?: string;
}

export interface Profile {
  network: string;
  username: string;
  url: string;
}

export interface Basics {
  name?: string;
  label?: string;
  image?: string;
  email?: string;
  phone?: string;
  url?: string;
  summary?: string;
  location?: Location;
  profiles?: Profile[];
  pronouns?: string; // Custom extension
}

export interface Work {
  name?: string;
  location?: string;
  description?: string;
  position?: string;
  url?: string;
  startDate?: ISO8601Date;
  endDate?: ISO8601Date;
  summary?: string;
  highlights?: string[];
  keywords?: string[]; // Custom extension
  teamSize?: number; // Custom extension
  roles?: string[]; // Custom extension for role filtering
}

export interface Volunteer {
  organization?: string;
  position?: string;
  url?: string;
  startDate?: ISO8601Date;
  endDate?: ISO8601Date;
  summary?: string;
  highlights?: string[];
}

export interface Education {
  institution?: string;
  url?: string;
  area?: string;
  studyType?: string;
  startDate?: ISO8601Date;
  endDate?: ISO8601Date;
  score?: string;
  courses?: string[];
}

export interface Award {
  title?: string;
  date?: ISO8601Date;
  awarder?: string;
  summary?: string;
}

export interface Certificate {
  name?: string;
  date?: string;
  url?: string;
  issuer?: string;
}

export interface Publication {
  name?: string;
  publisher?: string;
  releaseDate?: ISO8601Date;
  url?: string;
  summary?: string;
  status?: string; // Custom extension
  workingTitle?: boolean; // Custom extension
}

export interface Skill {
  name?: string;
  level?: string;
  keywords?: string[];
  practicalApplications?: string[]; // Custom extension
}

export interface Language {
  language?: string;
  fluency?: string;
}

export interface Interest {
  name?: string;
  keywords?: string[];
}

export interface Reference {
  name?: string;
  reference?: string;
}

export interface Project {
  name?: string;
  description?: string;
  highlights?: string[];
  keywords?: string[];
  startDate?: ISO8601Date;
  endDate?: ISO8601Date;
  url?: string;
  roles?: string[];
  entity?: string;
  type?: string;
}

export interface Meta {
  canonical?: string;
  version?: string;
  lastModified?: string;
  theme?: string; // Custom extension
}

export interface TargetRole {
  label: string;
  summaryFocus: string;
  prioritySections: string[];
  yearsToInclude: number;
}

export interface CustomExtensions {
  tagline?: string;
  targetRoles?: Record<string, TargetRole>;
  companyPreferences?: {
    primary?: string;
    secondary?: string;
  };
  coverLetterHooks?: Record<string, string>;
  keyAchievements?: string[];
  quantifiableMetrics?: {
    yearsExperience?: number;
    teamsLed?: number;
    companyTypes?: string[];
    remoteYears?: number;
  };
}

export interface JSONResume {
  $schema?: string;
  meta?: Meta;
  basics?: Basics;
  work?: Work[];
  volunteer?: Volunteer[];
  education?: Education[];
  awards?: Award[];
  certificates?: Certificate[];
  publications?: Publication[];
  skills?: Skill[];
  languages?: Language[];
  interests?: Interest[];
  references?: Reference[];
  projects?: Project[];
  _custom?: CustomExtensions;
}
