import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET() {
  const [institutionCount, userCount, sectionCount, studentCount] = await Promise.all([
    prisma.institution.count(),
    prisma.user.count(),
    prisma.section.count(),
    prisma.student.count(),
  ]);

  return NextResponse.json({
    ready: institutionCount > 0 && userCount > 0 && sectionCount > 0,
    counts: {
      institutions: institutionCount,
      users: userCount,
      sections: sectionCount,
      students: studentCount,
    },
  });
}
