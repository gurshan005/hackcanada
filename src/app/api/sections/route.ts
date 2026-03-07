import { NextResponse } from "next/server";

import { getDemoUser } from "@/lib/server/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getDemoUser();

  const assignments = await prisma.teachingAssignment.findMany({
    where: {
      userId: user.id,
    },
    include: {
      section: {
        include: {
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      },
    },
    orderBy: {
      section: {
        createdAt: "asc",
      },
    },
  });

  const sectionIds = assignments.map((assignment) => assignment.sectionId);

  const pendingBySection = await prisma.evidenceCard.groupBy({
    by: ["sectionId"],
    where: {
      sectionId: {
        in: sectionIds,
      },
      status: "PENDING",
    },
    _count: {
      _all: true,
    },
  });

  const pendingMap = new Map(pendingBySection.map((row) => [row.sectionId, row._count._all]));

  return NextResponse.json({
    sections: assignments.map((assignment) => ({
      id: assignment.section.id,
      courseCode: assignment.section.courseCode,
      title: assignment.section.title,
      term: assignment.section.term,
      name: assignment.section.name,
      studentCount: assignment.section._count.enrollments,
      pendingEvidenceCount: pendingMap.get(assignment.section.id) ?? 0,
    })),
  });
}
