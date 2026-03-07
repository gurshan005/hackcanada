import { EvidenceStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { syncEvidenceToRag } from "@/lib/ai/rag";
import { prisma } from "@/lib/prisma";
import { getDemoUser } from "@/lib/server/auth";

const updateSchema = z.object({
  status: z.nativeEnum(EvidenceStatus),
  aiSummary: z.string().min(5).max(400).optional(),
  studentId: z.string().nullable().optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const user = await getDemoUser();

  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const payload = parsed.data;

  const updated = await prisma.evidenceCard.update({
    where: { id },
    data: {
      status: payload.status,
      aiSummary: payload.aiSummary,
      studentId: payload.studentId,
      reviewedById: user.id,
      reviewedAt: new Date(),
    },
  });

  if (updated.status === EvidenceStatus.APPROVED) {
    await syncEvidenceToRag(updated);
  }

  await prisma.auditEvent.create({
    data: {
      institutionId: user.institutionId,
      actorUserId: user.id,
      action: "EVIDENCE_STATUS_CHANGED",
      entityType: "EVIDENCE_CARD",
      entityId: id,
      afterState: {
        status: payload.status,
      },
    },
  });

  return NextResponse.json({ evidence: updated });
}
