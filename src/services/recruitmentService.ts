import prisma from "../config/database";
import { emailQueue, EmailJobType } from "../config/queues"; // matches existing import pattern
import { generateICSFile } from "../utils/icsGenerator";
import { Prisma } from "@prisma/client";

export const submitApplication = async (
  clubId: string,
  userId: string,
  formData: Record<string, unknown>,
) => {
  const existing = await prisma.recruitmentApplication.findUnique({
    where: { club_id_user_id: { club_id: clubId, user_id: userId } }, // matches @@unique([club_id, user_id])
  });
  if (existing) throw new Error("Already applied to this club");

  return prisma.recruitmentApplication.create({
    data: {
      club_id: clubId,
      user_id: userId,
      form_data: formData as Prisma.InputJsonValue,
    },
    include: { applicant: { select: { id: true, name: true, email: true } } },
  });
};

export const getApplications = async (clubId: string) => {
  return prisma.recruitmentApplication.findMany({
    where: { club_id: clubId },
    include: {
      applicant: {
        select: { id: true, name: true, email: true, department: true },
      },
      interviews: true,
    },
    orderBy: { created_at: "desc" },
  });
};

export const updateApplicationStatus = async (
  applicationId: string,
  status: "shortlisted" | "rejected",
  notes?: string,
) => {
  const application = await prisma.recruitmentApplication.update({
    where: { id: applicationId },
    data: { status },
    include: { applicant: true, club: true },
  });

  await emailQueue.add(EmailJobType.APPLICATION_STATUS, {
    to: application.applicant.email,
    userName: application.applicant.name,
    clubName: application.club.name,
    status,
    notes,
  });

  return application;
};

export const scheduleInterview = async (
  clubId: string,
  applicationId: string,
  candidateId: string,
  slotTime: Date,
  durationMins?: number,
  location?: string,
  meetLink?: string,
) => {
  const interview = await prisma.interview.create({
    data: {
      application_id: applicationId,
      club_id: clubId,
      candidate_id: candidateId,
      slot_time: slotTime,
    },
    include: {
      candidate: true,
      club: true,
    },
  });

  const icsContent = generateICSFile({
    summary: `Interview — ${interview.club.name}`,
    start: slotTime,
    durationMinutes: 30,
    description: `Interview for ${interview.club.name} on ClubHub`,
  });

  await emailQueue.add(EmailJobType.INTERVIEW_SCHEDULED, {
    to: interview.candidate.email,
    userName: interview.candidate.name,
    clubName: interview.club.name,
    slotTime: slotTime.toISOString(),
    icsContent,
    durationMins: durationMins ?? 30,
    location: location,
    meetLink: meetLink,
  });

  return interview;
};

export const updateInterviewResult = async (
  interviewId: string,
  result: 'accepted' | 'rejected',
  notes?: string
) => {
  // Fetch interview first so we have application_id and club_id
  const interview = await prisma.interview.update({
    where: { id: interviewId },
    data:  { result },
    include: {
      candidate:   true,
      club:        true,
      application: true,   // needed for status update + duplicate guard
    },
  });

  if (result === 'accepted') {
    // Run status update + membership creation in a transaction so they're atomic
    await prisma.$transaction([
      // 1. Mark the application as accepted
      prisma.recruitmentApplication.update({
        where: { id: interview.application_id },
        data:  { status: 'accepted' },
      }),
      // 2. Create UserClub membership — skip if already a member (upsert)
      prisma.userClub.upsert({
        where: {
          user_id_club_id: {
            user_id: interview.candidate_id,
            club_id: interview.club_id,
          },
        },
        create: {
          user_id: interview.candidate_id,
          club_id: interview.club_id,
          role:    'member',
        },
        update: {
          // Already a member — leave role unchanged, just ensure record exists
          role: 'member',
        },
      }),
      // 3. Keep the cached member_count on Club in sync
      prisma.club.update({
        where: { id: interview.club_id },
        data:  { member_count: { increment: 1 } },
      }),
    ]);
  } else {
    // Rejected — just update application status, no membership created
    await prisma.recruitmentApplication.update({
      where: { id: interview.application_id },
      data:  { status: 'rejected' },
    });
  }

  await emailQueue.add(EmailJobType.INTERVIEW_RESULT, {
    to:       interview.candidate.email,
    userName: interview.candidate.name,
    clubName: interview.club.name,
    result,
    notes,
  });

  return interview;
};

export const getRecruitmentForm = async (clubId: string) => {
  return prisma.recruitmentForm.findUnique({
    where: { club_id: clubId },
  });
};

export const upsertRecruitmentForm = async (
  clubId: string,
  payload: {
    fields: Prisma.InputJsonValue;
    isOpen: boolean;
    deadline?: Date;
  },
) => {
  return prisma.recruitmentForm.upsert({
    where: { club_id: clubId },
    create: {
      club_id: clubId,
      fields: payload.fields,
      is_open: payload.isOpen,
      deadline: payload.deadline,
    },
    update: {
      fields: payload.fields,
      is_open: payload.isOpen,
      deadline: payload.deadline,
    },
  });
};

export const getInterviews = async (clubId: string) => {
  return prisma.interview.findMany({
    where: { club_id: clubId },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
    },
    orderBy: { slot_time: "asc" },
  });
};

export const getMyApplication = async (clubId: string, userId: string) => {
  return prisma.recruitmentApplication.findUnique({
    where: { club_id_user_id: { club_id: clubId, user_id: userId } },
    select: { id: true, status: true, created_at: true },
  });
};
