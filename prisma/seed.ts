import {
  ArtifactType,
  EvidenceStatus,
  ObservationType,
  PrismaClient,
  SectionRole,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();

async function resetDatabase() {
  await prisma.lmsExport.deleteMany();
  await prisma.criterionScore.deleteMany();
  await prisma.reportCitation.deleteMany();
  await prisma.reportDraft.deleteMany();
  await prisma.reportCycle.deleteMany();
  await prisma.ragIndexItem.deleteMany();
  await prisma.evidenceCard.deleteMany();
  await prisma.transcriptSegment.deleteMany();
  await prisma.transcription.deleteMany();
  await prisma.artifact.deleteMany();
  await prisma.classSession.deleteMany();
  await prisma.rubricCriterion.deleteMany();
  await prisma.rubric.deleteMany();
  await prisma.dataConsent.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teachingAssignment.deleteMany();
  await prisma.section.deleteMany();
  await prisma.user.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.institution.deleteMany();
}

async function seed() {
  await resetDatabase();

  const institution = await prisma.institution.create({
    data: {
      name: "HackCanada University",
      timezone: "America/Toronto",
    },
  });

  const instructor = await prisma.user.create({
    data: {
      institutionId: institution.id,
      email: "teacher@hackcanada.edu",
      fullName: "Dr. Maya Bennett",
      role: UserRole.INSTRUCTOR,
    },
  });

  const section = await prisma.section.create({
    data: {
      institutionId: institution.id,
      courseCode: "POLI-401",
      title: "Socratic Seminar in Political Theory",
      term: "Winter 2026",
      name: "Section A",
      lmsSectionRef: "BB-POLI-401-A",
    },
  });

  await prisma.teachingAssignment.create({
    data: {
      sectionId: section.id,
      userId: instructor.id,
      role: SectionRole.LEAD,
    },
  });

  const rubric = await prisma.rubric.create({
    data: {
      institutionId: institution.id,
      sectionId: section.id,
      name: "Socratic Participation Rubric",
      createdById: instructor.id,
      criteria: {
        create: [
          {
            code: "CLAIM",
            title: "Quality of Claim",
            description: "States a clear, defensible thesis in discussion.",
            position: 1,
            weight: 1,
          },
          {
            code: "EVIDENCE",
            title: "Use of Evidence",
            description: "Supports points with readings or examples.",
            position: 2,
            weight: 1,
          },
          {
            code: "DIALOGUE",
            title: "Engagement in Dialogue",
            description: "Builds on peers and asks productive follow-ups.",
            position: 3,
            weight: 1,
          },
        ],
      },
    },
    include: {
      criteria: true,
    },
  });

  const students = await prisma.$transaction(
    [
      { name: "Ava Thompson", sid: "U1001" },
      { name: "Noah Patel", sid: "U1002" },
      { name: "Liam Chen", sid: "U1003" },
      { name: "Sophia Williams", sid: "U1004" },
      { name: "Ethan Rivera", sid: "U1005" },
      { name: "Mia Johnson", sid: "U1006" },
      { name: "Lucas Ahmed", sid: "U1007" },
      { name: "Isabella Park", sid: "U1008" },
    ].map((entry) =>
      prisma.student.create({
        data: {
          institutionId: institution.id,
          externalStudentId: entry.sid,
          fullName: entry.name,
          email: `${entry.sid.toLowerCase()}@students.hackcanada.edu`,
        },
      }),
    ),
  );

  await prisma.enrollment.createMany({
    data: students.map((student) => ({
      sectionId: section.id,
      studentId: student.id,
    })),
  });

  await prisma.dataConsent.createMany({
    data: students.map((student) => ({
      sectionId: section.id,
      studentId: student.id,
      audioAllowed: true,
      aiProcessingAllowed: true,
      effectiveFrom: new Date("2026-01-05T00:00:00.000Z"),
      recordedById: instructor.id,
    })),
  });

  const cycle = await prisma.reportCycle.create({
    data: {
      institutionId: institution.id,
      sectionId: section.id,
      name: "Midterm Narrative Feedback",
      periodStart: new Date("2026-01-05T00:00:00.000Z"),
      periodEnd: new Date("2026-03-15T00:00:00.000Z"),
      dueDate: new Date("2026-03-20T00:00:00.000Z"),
      createdById: instructor.id,
    },
  });

  const session = await prisma.classSession.create({
    data: {
      sectionId: section.id,
      title: "Socratic Seminar: Rawls and Justice",
      startedAt: new Date("2026-02-18T14:00:00.000Z"),
      endedAt: new Date("2026-02-18T15:20:00.000Z"),
      createdById: instructor.id,
    },
  });

  const artifact = await prisma.artifact.create({
    data: {
      sectionId: section.id,
      sessionId: session.id,
      createdById: instructor.id,
      type: ArtifactType.TEXT_NOTE,
      storageUri: "note://seed/session-rawls-1",
      rawText:
        "Ava linked distributive justice to current tuition policy and asked a follow-up question to Liam. Noah referenced chapter 3 but needed prompting to connect to peers.",
    },
  });

  const transcription = await prisma.transcription.create({
    data: {
      artifactId: artifact.id,
      provider: "seed",
      status: "COMPLETED",
      fullText: artifact.rawText,
      confidence: 0.99,
    },
  });

  const segment1 = await prisma.transcriptSegment.create({
    data: {
      transcriptionId: transcription.id,
      seqNo: 1,
      speakerLabel: "Teacher Note",
      startMs: 0,
      endMs: 14000,
      text: "Ava linked distributive justice to current tuition policy and asked a follow-up question to Liam.",
      confidence: 0.99,
      speakerStudentId: students[0]?.id,
    },
  });

  const segment2 = await prisma.transcriptSegment.create({
    data: {
      transcriptionId: transcription.id,
      seqNo: 2,
      speakerLabel: "Teacher Note",
      startMs: 14000,
      endMs: 28000,
      text: "Noah referenced chapter 3 but needed prompting to connect his point to peers.",
      confidence: 0.98,
      speakerStudentId: students[1]?.id,
    },
  });

  const approvedCards = await prisma.$transaction([
    prisma.evidenceCard.create({
      data: {
        sectionId: section.id,
        sessionId: session.id,
        studentId: students[0]?.id,
        sourceSegmentId: segment1.id,
        observationType: ObservationType.REASONING,
        evidenceText: segment1.text,
        aiSummary: "Connected Rawls to a current policy example and deepened dialogue with a follow-up.",
        observedAt: new Date("2026-02-18T14:15:00.000Z"),
        confidence: 0.94,
        status: EvidenceStatus.APPROVED,
        reviewedById: instructor.id,
        reviewedAt: new Date("2026-02-18T15:30:00.000Z"),
        createdById: instructor.id,
      },
    }),
    prisma.evidenceCard.create({
      data: {
        sectionId: section.id,
        sessionId: session.id,
        studentId: students[1]?.id,
        sourceSegmentId: segment2.id,
        observationType: ObservationType.PARTICIPATION,
        evidenceText: segment2.text,
        aiSummary: "Brought in reading evidence but needed support to connect ideas in discussion.",
        observedAt: new Date("2026-02-18T14:22:00.000Z"),
        confidence: 0.89,
        status: EvidenceStatus.APPROVED,
        reviewedById: instructor.id,
        reviewedAt: new Date("2026-02-18T15:30:00.000Z"),
        createdById: instructor.id,
      },
    }),
  ]);

  await prisma.ragIndexItem.createMany({
    data: approvedCards.map((card) => ({
      evidenceCardId: card.id,
      ragDocumentId: `seed-${card.id}`,
      ragChunkIds: [card.id],
      syncStatus: "SYNCED",
      indexedAt: new Date(),
    })),
  });

  const draft = await prisma.reportDraft.create({
    data: {
      cycleId: cycle.id,
      studentId: students[0].id,
      generatedById: instructor.id,
      modelName: "seed-model",
      draftText:
        "Ava consistently contributes high-quality claims in Socratic dialogue and extends discussion with strong follow-up questions.",
      finalText:
        "Ava consistently contributes high-quality claims in Socratic dialogue and extends discussion with strong follow-up questions.",
    },
  });

  await prisma.reportCitation.create({
    data: {
      reportDraftId: draft.id,
      sentenceIndex: 0,
      evidenceCardId: approvedCards[0].id,
      snippet: approvedCards[0].evidenceText,
      relevanceScore: 0.92,
    },
  });

  await prisma.criterionScore.createMany({
    data: rubric.criteria.map((criterion) => ({
      reportDraftId: draft.id,
      criterionId: criterion.id,
      suggestedScore: 3.5,
      suggestedRationale: "Strong participation trend with cited evidence.",
      approvedScore: 3.5,
      approvedById: instructor.id,
      approvedAt: new Date(),
    })),
  });

  await prisma.auditEvent.create({
    data: {
      institutionId: institution.id,
      actorUserId: instructor.id,
      action: "SEED_BOOTSTRAP",
      entityType: "SYSTEM",
      afterState: {
        sectionId: section.id,
        studentCount: students.length,
      },
    },
  });

  console.info("Seed complete");
  console.info(`Institution: ${institution.name}`);
  console.info(`Instructor: ${instructor.email}`);
  console.info(`Section: ${section.courseCode} ${section.name}`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
