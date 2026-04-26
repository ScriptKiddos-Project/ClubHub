import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Build LinkedIn Certificate Share URL ─────────────────────────────────────

export async function buildLinkedInShareUrl(
  userId: string,
  certificateId: string
): Promise<string> {
  // Schema: Certificate has user_id, event_id, club_id but NO event/club relations defined.
  // Must query certificate first, then fetch event separately.
  const certificate = await prisma.certificate.findFirst({
    where: { id: certificateId, user_id: userId },
    select: { id: true, event_id: true, user_id: true },
  });

  if (!certificate) {
    throw new Error('Certificate not found or does not belong to user');
  }

  const [event, user] = await Promise.all([
    prisma.event.findUniqueOrThrow({
      where: { id: certificate.event_id },
      select: { title: true, date: true },
    }),
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true },
    }),
  ]);

  const appBaseUrl = process.env.APP_BASE_URL ?? 'https://clubhub.app';
  const certPublicUrl = `${appBaseUrl}/certificates/${certificate.id}`;

  const description =
    `${user.name} successfully participated in ${event.title} ` +
    `on ${new Date(event.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })} via ClubHub.`;

  const params = new URLSearchParams({
    mini: 'true',
    url: certPublicUrl,
    title: `${event.title} — Certificate of Participation`,
    summary: description,
    source: 'ClubHub',
  });

  return `https://www.linkedin.com/shareArticle?${params.toString()}`;
}

// ─── Build LinkedIn Achievement Share URL ─────────────────────────────────────

export async function buildAchievementShareUrl(
  userId: string,
  achievementType: 'certificate' | 'badge' | 'resume'
): Promise<string> {
  // Schema: User fields are total_points, total_volunteer_hours (snake_case)
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { name: true, total_points: true, total_volunteer_hours: true },
  });

  const appBaseUrl = process.env.APP_BASE_URL ?? 'https://clubhub.app';
  const profileUrl = `${appBaseUrl}/profile/${userId}`;

  const descriptions: Record<typeof achievementType, string> = {
    certificate: `${user.name} earned a certificate on ClubHub`,
    badge: `${user.name} unlocked a new badge on ClubHub with ${user.total_points} points`,
    resume: `${user.name}'s campus achievement profile — ${user.total_points} pts, ${user.total_volunteer_hours} volunteer hours`,
  };

  const params = new URLSearchParams({
    mini: 'true',
    url: profileUrl,
    title: `ClubHub Achievement — ${user.name}`,
    summary: descriptions[achievementType],
    source: 'ClubHub',
  });

  return `https://www.linkedin.com/shareArticle?${params.toString()}`;
}