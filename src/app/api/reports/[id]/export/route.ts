import { ExportDestination, ExportStatus } from "@prisma/client";
import { stringify } from "csv-stringify/sync";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  const draft = await prisma.reportDraft.findUnique({
    where: { id },
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

  if (!draft) {
    return NextResponse.json({ error: "Draft not found." }, { status: 404 });
  }

  const rows: string[][] = [
    ["student_id", "student_name", "cycle", "draft_text", "citations"],
    [
      draft.student.id,
      draft.student.fullName,
      draft.cycle.name,
      draft.finalText ?? draft.draftText,
      draft.citations
        .map((citation) => `[${citation.sentenceIndex}] ${citation.evidenceCard.aiSummary}`)
        .join(" | "),
    ],
  ];

  const csv = stringify(rows);

  await prisma.lmsExport.create({
    data: {
      reportDraftId: draft.id,
      destination: ExportDestination.CSV,
      status: ExportStatus.SENT,
      payload: {
        rows,
      },
      exportedAt: new Date(),
    },
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="report-${draft.student.fullName.replace(/\s+/g, "-").toLowerCase()}.csv"`,
    },
  });
}
