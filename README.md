# Teacher Evidence Assistant

A hackathon-ready web app that helps educators convert scattered observational notes into reviewable evidence cards and citation-backed student report drafts.

## Why this product

Teachers already use AI writing tools, but the evidence lives across notes, memory, LMS comments, and transcripts. This app creates one workflow:

1. Capture notes in natural language (text or audio).
2. Transcribe using ElevenLabs.
3. Extract structured evidence cards per student.
4. Require teacher approval before evidence becomes report-eligible.
5. Generate report drafts grounded in approved evidence and citations.
6. Export CSV for LMS/report workflows.

## Stack

- Frontend: Next.js 16, TypeScript, Tailwind CSS
- Backend: Next.js API routes (Node runtime)
- Database: PostgreSQL (Prisma ORM)
- Queue cache (prepared): Redis
- Speech-to-text: ElevenLabs API
- Retrieval: Sponsored RAG endpoint adapter + local SQL fallback

## Quick Start

1. Start infrastructure:
   ```bash
   docker compose up -d
   ```
2. Copy env file:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create schema:
   ```bash
   npm run db:push
   ```
5. Seed demo data:
   ```bash
   npm run db:seed
   ```
6. Run app:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string.
- `ELEVENLABS_API_KEY`: Enables real audio transcription.
- `ELEVENLABS_STT_MODEL`: Default `scribe_v1`.
- `SPONSORED_RAG_ENDPOINT`: Optional RAG HTTP endpoint.
- `SPONSORED_RAG_API_KEY`: Optional auth token for sponsored RAG.
- `SPONSORED_RAG_INDEX`: Index name used for sync/query.
- `LLM_API_KEY`: Optional report drafting model key.
- `LLM_BASE_URL`: Optional OpenAI-compatible base URL.
- `LLM_MODEL`: Default `gpt-4.1-mini`.

If external keys are missing, the app still works via deterministic local fallbacks.

## Product Flow

1. **Capture** (`/capture`)
   - Teacher enters notes or uploads an audio file.
   - App creates session + artifact + transcription.
   - AI extraction creates `PENDING` evidence cards.

2. **Evidence Inbox** (`/evidence`)
   - Teacher approves/rejects each card.
   - Approved cards sync into RAG index metadata.

3. **Report Studio** (`/reports`)
   - Choose section, cycle, student.
   - Generate citation-backed draft from approved evidence only.
   - Finalize and export CSV.

4. **Student Timeline** (`/students/:id`)
   - Longitudinal view of evidence and report drafts.

## Key API Routes

- `POST /api/capture`: Ingest note/audio and extract evidence cards.
- `GET /api/evidence`: Query evidence cards by section/status/student.
- `PATCH /api/evidence/:id`: Approve/reject and edit summary.
- `POST /api/reports/generate`: Generate citation-backed draft.
- `PATCH /api/reports/:id`: Finalize draft text.
- `GET /api/reports/:id/export`: Export CSV.

## Trust/Safety Guardrails

- No autonomous grading.
- Human-in-the-loop evidence approval.
- Citations attached to generated drafts.
- Audit events for key workflow changes.
- Local fallback if sponsored RAG is unavailable.

## Demo Credentials (seed)

- Teacher email: `teacher@hackcanada.edu`
- Institution: `HackCanada University`
- Course: `POLI-401 Section A`

## Notes

- This repository uses a demo auth model (single seeded teacher) for hackathon speed.
- Replace with SSO/OIDC and role-based access control for production.
