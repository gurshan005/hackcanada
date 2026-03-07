import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  sectionId: z.string().min(1),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    sectionId: url.searchParams.get("sectionId"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Missing sectionId." }, { status: 400 });
  }

  const sectionId = parsed.data.sectionId;

  const enrollments = await prisma.enrollment.findMany({
    where: { sectionId },
    include: {
      student: true,
    },
    orderBy: {
      student: {
        fullName: "asc",
      },
    },
  });

  return NextResponse.json({
    students: enrollments.map((enrollment) => ({
      id: enrollment.student.id,
      fullName: enrollment.student.fullName,
      email: enrollment.student.email,
      externalStudentId: enrollment.student.externalStudentId,
    })),
  });
}
