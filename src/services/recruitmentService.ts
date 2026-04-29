import prisma from '../config/database';
import { emailQueue, EmailJobType } from '../config/queues'; // matches existing import pattern
import { generateICSFile } from '../utils/icsGenerator';
import { Prisma } from '@prisma/client';

export const submitApplication = async (
  clubId: string,
  userId: string,
  formData: Record<string, unknown>
) => {
  const existing = await prisma.recruitmentApplication.findUnique({
    where: { club_id_user_id: { club_id: clubId, user_id: userId } }, // matches @@unique([club_id, user_id])
  });
  if (existing) throw new Error('Already applied to this club');

  return prisma.recruitmentApplication.create({
    data: { club_id: clubId, user_id: userId, form_data: formData as Prisma.InputJsonValue},
    include: { applicant: { select: { id: true, name: true, email: true } } },
  });
};

export const getApplications = async (clubId: string) => {
  return prisma.recruitmentApplication.findMany({
    where: { club_id: clubId },
    include: {
      applicant: { select: { id: true, name: true, email: true, department: true } },
      interviews: true,
    },
    orderBy: { created_at: 'desc' },
  });
};

export const updateApplicationStatus = async (
  applicationId: string,
  status: 'shortlisted' | 'rejected'
) => {
  const application = await prisma.recruitmentApplication.update({
    where: { id: applicationId },
    data: { status },
    include: { applicant: true, club: true },
  });

  // Use existing emailQueue pattern from config/queues
  await emailQueue.add(EmailJobType.APPLICATION_STATUS, {
    to: application.applicant.email,
    userName: application.applicant.name,
    clubName: application.club.name,
    status,
  });

  return application;
};

export const scheduleInterview = async (
  clubId: string,
  applicationId: string,
  candidateId: string,
  slotTime: Date
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
  });

  return interview;
};

export const updateInterviewResult = async (
  interviewId: string,
  result: 'accepted' | 'rejected'
) => {
  const interview = await prisma.interview.update({
    where: { id: interviewId },
    data: { result },
    include: { candidate: true, club: true },
  });

  await emailQueue.add(EmailJobType.INTERVIEW_RESULT, {
    to: interview.candidate.email,
    userName: interview.candidate.name,
    clubName: interview.club.name,
    result,
  });

  return interview;
};