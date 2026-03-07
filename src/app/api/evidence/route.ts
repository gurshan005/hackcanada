import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  sectionId: z.string().min(1),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  studentId: z.string().optional(),
  limit: z.coerce.number().min(1).max(200).default(80),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    sectionId: url.searchParams.get("sectionId"),
    status: url.searchParams.get("status") ?? undefined,
    studentId: url.searchParams.get("studentId") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters." }, { status: 400 });
  }

  const evidence = await prisma.evidenceCard.findMany({
    where: {
      sectionId: parsed.data.sectionId,
      status: parsed.data.status,
      studentId: parsed.data.studentId,
    },
    include: {
      student: true,
      session: true,
      sourceSegment: true,
      reviewedBy: true,
    },
    orderBy: {
      observedAt: "desc",
    },
    take: parsed.data.limit,
  });

  return NextResponse.json({
    evidence,
  });
}
