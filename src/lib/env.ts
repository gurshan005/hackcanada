import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DEMO_INSTITUTION_NAME: z.string().default("HackCanada University"),
  DEMO_TEACHER_EMAIL: z.string().email().default("teacher@hackcanada.edu"),
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_STT_MODEL: z.string().default("scribe_v1"),
  SPONSORED_RAG_ENDPOINT: z.string().optional(),
  SPONSORED_RAG_API_KEY: z.string().optional(),
  SPONSORED_RAG_INDEX: z.string().default("teacher-evidence"),
  LLM_API_KEY: z.string().optional(),
  LLM_BASE_URL: z.string().optional(),
  LLM_MODEL: z.string().default("gpt-4.1-mini"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  DEMO_INSTITUTION_NAME: process.env.DEMO_INSTITUTION_NAME,
  DEMO_TEACHER_EMAIL: process.env.DEMO_TEACHER_EMAIL,
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY,
  ELEVENLABS_STT_MODEL: process.env.ELEVENLABS_STT_MODEL,
  SPONSORED_RAG_ENDPOINT: process.env.SPONSORED_RAG_ENDPOINT,
  SPONSORED_RAG_API_KEY: process.env.SPONSORED_RAG_API_KEY,
  SPONSORED_RAG_INDEX: process.env.SPONSORED_RAG_INDEX,
  LLM_API_KEY: process.env.LLM_API_KEY,
  LLM_BASE_URL: process.env.LLM_BASE_URL,
  LLM_MODEL: process.env.LLM_MODEL,
});
