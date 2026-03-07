import { DraftStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  finalText: z.string().min(20).max(5000),
  status: z.nativeEnum(DraftStatus).optional(),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const updated = await prisma.reportDraft.update({
    where: { id },
    data: {
      finalText: parsed.data.finalText,
      status: parsed.data.status ?? DraftStatus.FINALIZED,
    },
  });

  return NextResponse.json({ draft: updated });
}
