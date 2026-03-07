import { EvidenceStatus, type EvidenceCard } from "@prisma/client";

import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import type { CitationCandidate } from "@/lib/types";

type RagFilter = {
  sectionId: string;
  studentId?: string;
  from?: Date;
  to?: Date;
};

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function lexicalScore(query: string, text: string): number {
  const q = normalizeText(query).split(" ").filter(Boolean);
  const t = normalizeText(text);
  if (q.length === 0) {
    return 0;
  }
  const hits = q.filter((token) => t.includes(token)).length;
  return Number((hits / q.length).toFixed(5));
}

async function localRetrieve(query: string, filters: RagFilter, topK = 8): Promise<CitationCandidate[]> {
  const rows = await prisma.evidenceCard.findMany({
    where: {
      sectionId: filters.sectionId,
      studentId: filters.studentId,
      status: EvidenceStatus.APPROVED,
      observedAt: {
        gte: filters.from,
        lte: filters.to,
      },
    },
    orderBy: {
      observedAt: "desc",
    },
    take: Math.max(topK * 3, 12),
  });

  return rows
    .map((row) => ({
      evidenceCardId: row.id,
      snippet: row.evidenceText,
      relevanceScore: lexicalScore(query, `${row.aiSummary} ${row.evidenceText}`),
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);
}

export async function syncEvidenceToRag(card: EvidenceCard): Promise<void> {
  if (card.status !== EvidenceStatus.APPROVED) {
    return;
  }

  if (!env.SPONSORED_RAG_ENDPOINT || !env.SPONSORED_RAG_API_KEY) {
    await prisma.ragIndexItem.upsert({
      where: { evidenceCardId: card.id },
      update: {
        ragDocumentId: `local-${card.id}`,
        ragChunkIds: [card.id],
        syncStatus: "SYNCED",
        indexedAt: new Date(),
      },
      create: {
        evidenceCardId: card.id,
        ragDocumentId: `local-${card.id}`,
        ragChunkIds: [card.id],
        syncStatus: "SYNCED",
        indexedAt: new Date(),
      },
    });
    return;
  }

  const payload = {
    index: env.SPONSORED_RAG_INDEX,
    operation: "upsert",
    document: {
      id: card.id,
      text: `${card.aiSummary}\n${card.evidenceText}`,
      metadata: {
        sectionId: card.sectionId,
        studentId: card.studentId,
        observationType: card.observationType,
        observedAt: card.observedAt.toISOString(),
      },
    },
  };

  const response = await fetch(env.SPONSORED_RAG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.SPONSORED_RAG_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const reason = await response.text();
    throw new Error(`RAG sync failed: ${response.status} ${reason}`);
  }

  await prisma.ragIndexItem.upsert({
    where: { evidenceCardId: card.id },
    update: {
      ragDocumentId: card.id,
      ragChunkIds: [card.id],
      syncStatus: "SYNCED",
      indexedAt: new Date(),
    },
    create: {
      evidenceCardId: card.id,
      ragDocumentId: card.id,
      ragChunkIds: [card.id],
      syncStatus: "SYNCED",
      indexedAt: new Date(),
    },
  });
}

export async function retrieveEvidence(query: string, filters: RagFilter, topK = 8): Promise<CitationCandidate[]> {
  if (!env.SPONSORED_RAG_ENDPOINT || !env.SPONSORED_RAG_API_KEY) {
    return localRetrieve(query, filters, topK);
  }

  const payload = {
    index: env.SPONSORED_RAG_INDEX,
    operation: "query",
    query,
    topK,
    filters: {
      sectionId: filters.sectionId,
      studentId: filters.studentId,
      from: filters.from?.toISOString(),
      to: filters.to?.toISOString(),
    },
  };

  const response = await fetch(env.SPONSORED_RAG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.SPONSORED_RAG_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return localRetrieve(query, filters, topK);
  }

  const data = (await response.json()) as {
    results?: Array<{
      id?: string;
      metadata?: { evidenceCardId?: string };
      snippet?: string;
      score?: number;
    }>;
  };

  const mapped = (data.results ?? [])
    .map((result) => ({
      evidenceCardId: result.metadata?.evidenceCardId ?? result.id ?? "",
      snippet: result.snippet ?? "",
      relevanceScore: Number((result.score ?? 0.5).toFixed(5)),
    }))
    .filter((result) => result.evidenceCardId);

  if (mapped.length === 0) {
    return localRetrieve(query, filters, topK);
  }

  return mapped;
}
