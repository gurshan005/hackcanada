import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export async function getDemoUser() {
  const user = await prisma.user.findFirst({
    where: {
      email: env.DEMO_TEACHER_EMAIL,
    },
    include: {
      teachingAssignments: true,
    },
  });

  if (!user) {
    throw new Error(
      `Demo teacher not found. Run database setup and seed first. Missing email: ${env.DEMO_TEACHER_EMAIL}`,
    );
  }

  return user;
}

export async function getPrimarySectionForUser(userId: string) {
  const assignment = await prisma.teachingAssignment.findFirst({
    where: {
      userId,
    },
    include: {
      section: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  if (!assignment) {
    throw new Error("No teaching assignment found for demo user.");
  }

  return assignment.section;
}
