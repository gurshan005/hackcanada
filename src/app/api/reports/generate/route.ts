import { NextResponse } from "next/server";
import { z } from "zod";

import { generateReportDraft } from "@/lib/ai/report";
import { prisma } from "@/lib/prisma";
import { getDemoUser } from "@/lib/server/auth";

const bodySchema = z.object({
  sectionId: z.string().min(1),
  cycleId: z.string().min(1),
  studentId: z.string().min(1),
});

export async function POST(request: Request) {
  const user = await getDemoUser();

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const draft = await generateReportDraft({
      sectionId: parsed.data.sectionId,
      cycleId: parsed.data.cycleId,
      studentId: parsed.data.studentId,
      generatedById: user.id,
    });

    const hydrated = await prisma.reportDraft.findUnique({
      where: { id: draft.id },
      include: {
        student: true,
        cycle: true,
        citations: {
          include: {
            evidenceCard: true,
          },
          orderBy: {
            sentenceIndex: "asc",
          },
        },
      },
    });

    return NextResponse.json({ draft: hydrated });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to generate report draft. Ensure approved evidence exists.",
      },
      { status: 400 },
    );
  }
}
