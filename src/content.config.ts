import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

const locationSchema = z.object({
  address: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  countryCode: z.string().optional(),
  region: z.string().optional(),
});

const profileSchema = z.object({
  network: z.string(),
  username: z.string(),
  url: z.string(),
});

const basicsSchema = z.object({
  name: z.string().optional(),
  label: z.string().optional(),
  image: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  url: z.string().optional(),
  summary: z.string().optional(),
  location: locationSchema.optional(),
  profiles: z.array(profileSchema).optional(),
  pronouns: z.string().optional(),
  workPreferences: z.record(z.unknown()).optional(),
});

const workSchema = z.object({
  name: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  position: z.string().optional(),
  url: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  teamSize: z.number().optional(),
  roles: z.array(z.string()).optional(),
});

const volunteerSchema = z.object({
  organization: z.string().optional(),
  position: z.string().optional(),
  url: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  summary: z.string().optional(),
  highlights: z.array(z.string()).optional(),
});

const educationSchema = z.object({
  institution: z.string().optional(),
  url: z.string().optional(),
  area: z.string().optional(),
  studyType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  score: z.string().optional(),
  courses: z.array(z.string()).optional(),
});

const certificateSchema = z.object({
  name: z.string().optional(),
  date: z.string().optional(),
  url: z.string().optional(),
  issuer: z.string().optional(),
});

const publicationSchema = z.object({
  name: z.string().optional(),
  publisher: z.string().optional(),
  releaseDate: z.string().optional(),
  url: z.string().optional(),
  summary: z.string().optional(),
  status: z.string().optional(),
  workingTitle: z.boolean().optional(),
});

const skillSchema = z.object({
  name: z.string().optional(),
  level: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  practicalApplications: z.array(z.string()).optional(),
});

const languageSchema = z.object({
  language: z.string().optional(),
  fluency: z.string().optional(),
});

const interestSchema = z.object({
  name: z.string().optional(),
  keywords: z.array(z.string()).optional(),
});

const projectSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  url: z.string().optional(),
  roles: z.array(z.string()).optional(),
  entity: z.string().optional(),
  type: z.string().optional(),
});

const targetRoleSchema = z.object({
  label: z.string(),
  summaryFocus: z.string(),
  prioritySections: z.array(z.string()),
  yearsToInclude: z.number(),
});

const customExtensionsSchema = z.object({
  tagline: z.string().optional(),
  targetRoles: z.record(targetRoleSchema).optional(),
  companyPreferences: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
    })
    .optional(),
  coverLetterHooks: z.record(z.string()).optional(),
  keyAchievements: z.array(z.string()).optional(),
  quantifiableMetrics: z
    .object({
      yearsExperience: z.number().optional(),
      teamsLed: z.number().optional(),
      companyTypes: z.array(z.string()).optional(),
      remoteYears: z.number().optional(),
    })
    .optional(),
});

const resume = defineCollection({
  loader: file('src/content/resume/alex.json', {
    parser: (text) => {
      const data = JSON.parse(text);
      // file() expects an array or an object with id keys
      // Since this is a single entry, wrap it
      return [data];
    },
  }),
  schema: z.object({
    id: z.string(),
    $schema: z.string().optional(),
    meta: z
      .object({
        version: z.string().optional(),
        lastModified: z.string().optional(),
        theme: z.string().optional(),
        canonical: z.string().optional(),
      })
      .optional(),
    basics: basicsSchema.optional(),
    work: z.array(workSchema).optional(),
    volunteer: z.array(volunteerSchema).optional(),
    education: z.array(educationSchema).optional(),
    awards: z
      .array(
        z.object({
          title: z.string().optional(),
          date: z.string().optional(),
          awarder: z.string().optional(),
          summary: z.string().optional(),
        })
      )
      .optional(),
    certificates: z.array(certificateSchema).optional(),
    publications: z.array(publicationSchema).optional(),
    skills: z.array(skillSchema).optional(),
    languages: z.array(languageSchema).optional(),
    interests: z.array(interestSchema).optional(),
    references: z
      .array(
        z.object({
          name: z.string().optional(),
          reference: z.string().optional(),
        })
      )
      .optional(),
    projects: z.array(projectSchema).optional(),
    _custom: customExtensionsSchema.optional(),
  }),
});

export const collections = { resume };
