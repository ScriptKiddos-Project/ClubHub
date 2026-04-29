/**
 * ClubHub — Master Seed File
 * Covers: Phase 1 (Auth, Clubs, Events, Attendance, Notifications, Analytics)
 *         Phase 2 (Rankings, Suggestions, Featured Events)
 *         Phase 3 (Badges, Certificates, AICTE multipliers, Geo-fence)
 *         Phase 4 (Chat, Announcements, Recruitment, Interviews)
 *         Phase 5 (AI Recommendations test data, Trends, Engagement Scores)
 *
 * Run:  npx ts-node prisma/seed.ts
 *   or: npx prisma db seed
 *
 * After seeding, log in with any of the TEST CREDENTIALS printed at the end.
 * All passwords are:  Password123!
 */

import {
  PrismaClient,
  Prisma,
  Role,
  ClubMemberRole,
  DegreeType,
  AttendanceStatus,
  AttendanceMethod,
  ClubStatus,
  ClubCategory,
  EventType,
  NotificationType,
  BadgeType,
  RoomType,
  ApplicationStatus,
  InterviewResult,
  suggestion_status,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

// ─── Types ────────────────────────────────────────────────────────────────────

type DbRecord = Record<string, { id: string; [key: string]: unknown }>;

// ─── Constants ────────────────────────────────────────────────────────────────

const BCRYPT_ROUNDS = 10;
const PLAIN_PASSWORD = 'Password123!';

// AICTE multipliers per membership role
const AICTE_MULTIPLIERS: Record<string, number> = {
  non_member: 1.0,
  member: 1.1,
  secretary: 2.0,       // Working Committee
  event_manager: 2.0,   // Working Committee
  core: 3.0,            // Core Member
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function hashPassword(plain: string) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

function hashToken(plain: string) {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

function hmacSign(payload: string, secret = 'seed-secret') {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function hoursFromNow(n: number) {
  return new Date(Date.now() + n * 60 * 60 * 1000);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱  ClubHub — seeding all phases…\n');

  // ── 0. Wipe (safe for dev only) ──────────────────────────────────────────
  await wipeDatabase();

  // ── 1. Users ─────────────────────────────────────────────────────────────
  const users = await seedUsers();

  // ── 2. Clubs ─────────────────────────────────────────────────────────────
  const clubs = await seedClubs(users);

  // ── 3. Communities & Access Codes ────────────────────────────────────────
  const codes = await seedCommunitiesAndCodes(clubs, users);

  // ── 4. Club Memberships ───────────────────────────────────────────────────
  await seedMemberships(users, clubs);

  // ── 5. Events ────────────────────────────────────────────────────────────
  const events = await seedEvents(clubs, users);

  // ── 6. Registrations & Attendance ────────────────────────────────────────
  await seedRegistrationsAndAttendance(users, events, clubs);

  // ── 7. Notifications ─────────────────────────────────────────────────────
  await seedNotifications(users, events, clubs);

  // ── 8. Points History ────────────────────────────────────────────────────
  await seedPointsHistory(users, events);

  // ── 9. Audit Log ─────────────────────────────────────────────────────────
  await seedAuditLog(users, clubs, events);

  // ── Phase 2: Rankings & Suggestions ──────────────────────────────────────
  await seedRankingSnapshots(clubs);
  await seedSuggestions(users, clubs);

  // ── Phase 3: Badges & Certificates ───────────────────────────────────────
  await seedBadges(users);
  await seedCertificates(users, events, clubs);

  // ── Phase 4: Chat, Announcements, Recruitment ─────────────────────────────
  await seedChatRooms(clubs, events, users);
  await seedAnnouncements(clubs, users);
  await seedRecruitment(clubs, users);
  await seedNotificationPreferences(users);

  // ── Phase 5: Extra analytics data ────────────────────────────────────────
  await seedPhase5ExtraHistory(users, events, clubs);

  // ─────────────────────────────────────────────────────────────────────────
  printCredentials(users, codes);
  console.log('\n✅  Seed complete.\n');
}

// ─── 0. Wipe ──────────────────────────────────────────────────────────────────

async function wipeDatabase() {
  const tables = [
    'interviews', 'recruitment_applications', 'announcements',
    'chat_messages', 'chat_rooms',
    'notification_preferences', 'notifications',
    'certificates', 'badges',
    'access_code_usages', 'community_access_codes', 'communities',
    'points_history', 'attendance_logs', 'event_registrations',
    'event_qr_codes', 'events',
    'suggestions', 'club_ranking_snapshots',
    'audit_log', 'user_clubs', 'clubs',
    'users',
  ];
  for (const t of tables) {
    await prisma.$executeRawUnsafe(`DELETE FROM "${t}"`);
  }
  console.log('  🗑️  Database wiped\n');
}

// ─── 1. Users ─────────────────────────────────────────────────────────────────

async function seedUsers(): Promise<DbRecord> {
  const hash = await hashPassword(PLAIN_PASSWORD);

  const definitions = [
    // Super Admin
    {
      key: 'superAdmin',
      email: 'admin@clubhub.app',
      name: 'Arjun Mehta',
      role: Role.super_admin,
      department: 'Administration',
      enrollment_year: 2020,
      degree_type: DegreeType.masters,
      total_points: 0,
      total_volunteer_hours: 0,
    },
    // Club Admins (2)
    {
      key: 'clubAdminTech',
      email: 'clubadmin1@clubhub.app',
      name: 'Priya Sharma',
      role: Role.club_admin,
      department: 'Computer Science',
      enrollment_year: 2021,
      degree_type: DegreeType.bachelors,
      total_points: 340,
      total_volunteer_hours: 28,
    },
    {
      key: 'clubAdminCulture',
      email: 'clubadmin2@clubhub.app',
      name: 'Riya Patel',
      role: Role.club_admin,
      department: 'Arts & Humanities',
      enrollment_year: 2021,
      degree_type: DegreeType.bachelors,
      total_points: 210,
      total_volunteer_hours: 18,
    },
    // Event Managers (2)
    {
      key: 'eventMgr1',
      email: 'eventmanager1@clubhub.app',
      name: 'Karan Nair',
      role: Role.event_manager,
      department: 'Computer Science',
      enrollment_year: 2022,
      degree_type: DegreeType.bachelors,
      total_points: 280,
      total_volunteer_hours: 22,
    },
    {
      key: 'eventMgr2',
      email: 'eventmanager2@clubhub.app',
      name: 'Sneha Rao',
      role: Role.event_manager,
      department: 'Business',
      enrollment_year: 2022,
      degree_type: DegreeType.bachelors,
      total_points: 190,
      total_volunteer_hours: 14,
    },
    // Secretaries (2)
    {
      key: 'secretary1',
      email: 'secretary1@clubhub.app',
      name: 'Aarav Joshi',
      role: Role.secretary,
      department: 'Mechanical Engineering',
      enrollment_year: 2022,
      degree_type: DegreeType.bachelors,
      total_points: 260,
      total_volunteer_hours: 20,
    },
    {
      key: 'secretary2',
      email: 'secretary2@clubhub.app',
      name: 'Divya Menon',
      role: Role.secretary,
      department: 'Electronics',
      enrollment_year: 2023,
      degree_type: DegreeType.bachelors,
      total_points: 150,
      total_volunteer_hours: 12,
    },
    // Members (3)
    {
      key: 'member1',
      email: 'member1@clubhub.app',
      name: 'Rohan Verma',
      role: Role.member,
      department: 'Computer Science',
      enrollment_year: 2023,
      degree_type: DegreeType.bachelors,
      total_points: 120,
      total_volunteer_hours: 8,
    },
    {
      key: 'member2',
      email: 'member2@clubhub.app',
      name: 'Ananya Singh',
      role: Role.member,
      department: 'Data Science',
      enrollment_year: 2023,
      degree_type: DegreeType.bachelors,
      total_points: 95,
      total_volunteer_hours: 6,
    },
    {
      key: 'member3',
      email: 'member3@clubhub.app',
      name: 'Ishaan Gupta',
      role: Role.member,
      department: 'Computer Science',
      enrollment_year: 2024,
      degree_type: DegreeType.bachelors,
      total_points: 60,
      total_volunteer_hours: 4,
    },
    // Students (5) — plain students, not yet core members
    {
      key: 'student1',
      email: 'student1@clubhub.app',
      name: 'Tanvi Kapoor',
      role: Role.student,
      department: 'Computer Science',
      enrollment_year: 2024,
      degree_type: DegreeType.bachelors,
      total_points: 40,
      total_volunteer_hours: 2,
    },
    {
      key: 'student2',
      email: 'student2@clubhub.app',
      name: 'Vikram Das',
      role: Role.student,
      department: 'Electrical Engineering',
      enrollment_year: 2024,
      degree_type: DegreeType.bachelors,
      total_points: 30,
      total_volunteer_hours: 2,
    },
    {
      key: 'student3',
      email: 'student3@clubhub.app',
      name: 'Meera Iyer',
      role: Role.student,
      department: 'Business',
      enrollment_year: 2024,
      degree_type: DegreeType.bachelors,
      total_points: 20,
      total_volunteer_hours: 1,
    },
    {
      key: 'student4',
      email: 'student4@clubhub.app',
      name: 'Aditya Kumar',
      role: Role.student,
      department: 'Mechanical Engineering',
      enrollment_year: 2023,
      degree_type: DegreeType.bachelors,
      total_points: 55,
      total_volunteer_hours: 3,
    },
    {
      key: 'student5',
      email: 'student5@clubhub.app',
      name: 'Pooja Reddy',
      role: Role.student,
      department: 'Data Science',
      enrollment_year: 2023,
      degree_type: DegreeType.bachelors,
      total_points: 75,
      total_volunteer_hours: 5,
    },
  ];

  const records: DbRecord = {};
  for (const d of definitions) {
    const { key, ...data } = d;
    const user = await prisma.user.create({
      data: {
        ...data,
        password_hash: hash,
        is_verified: true,
        is_active: true,
        avatar_url: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      },
    });
    records[key] = user;
  }

  console.log(`  👤  Created ${definitions.length} users`);
  return records;
}

// ─── 2. Clubs ─────────────────────────────────────────────────────────────────

async function seedClubs(users: DbRecord): Promise<DbRecord> {
  const defs = [
    {
      key: 'techClub',
      name: 'CodeCraft Society',
      slug: 'codecraft-society',
      description: 'The premier technical club for competitive programming, open source, and software development.',
      category: ClubCategory.technical,
      status: ClubStatus.approved,
      created_by: users.clubAdminTech.id,
      approved_by: users.superAdmin.id,
      approved_at: daysFromNow(-60),
      ranking_score: 87.4,
      ranking_tier: 'gold',
      ranking_rank: 1,
      skill_areas: ['programming', 'web development', 'algorithms', 'open source'],
      tags: ['coding', 'hackathon', 'tech', 'competitive'],
      is_featured: true,
      engagement_score: 0.82,
      member_count: 6,
    },
    {
      key: 'cultureClub',
      name: 'Rang Manch Cultural Club',
      slug: 'rang-manch',
      description: 'Celebrating arts, dance, music, and cultural diversity on campus.',
      category: ClubCategory.cultural,
      status: ClubStatus.approved,
      created_by: users.clubAdminCulture.id,
      approved_by: users.superAdmin.id,
      approved_at: daysFromNow(-55),
      ranking_score: 72.1,
      ranking_tier: 'silver',
      ranking_rank: 2,
      skill_areas: ['dance', 'music', 'drama', 'fine arts'],
      tags: ['culture', 'arts', 'performance'],
      is_featured: true,
      engagement_score: 0.68,
      member_count: 5,
    },
    {
      key: 'entrepreneurClub',
      name: 'Startup Nexus',
      slug: 'startup-nexus',
      description: 'Connecting aspiring entrepreneurs, founders, and investors on campus.',
      category: ClubCategory.entrepreneurship,
      status: ClubStatus.approved,
      created_by: users.eventMgr2.id,
      approved_by: users.superAdmin.id,
      approved_at: daysFromNow(-40),
      ranking_score: 63.5,
      ranking_tier: 'bronze',
      ranking_rank: 3,
      skill_areas: ['entrepreneurship', 'business', 'pitching', 'finance'],
      tags: ['startup', 'business', 'networking'],
      is_featured: false,
      engagement_score: 0.55,
      member_count: 4,
    },
    {
      key: 'volunteerClub',
      name: 'GreenCampus Volunteers',
      slug: 'greencampus-volunteers',
      description: 'Making campus and community more sustainable through volunteer-driven initiatives.',
      category: ClubCategory.volunteer,
      status: ClubStatus.approved,
      created_by: users.secretary1.id,
      approved_by: users.superAdmin.id,
      approved_at: daysFromNow(-30),
      ranking_score: 55.0,
      ranking_tier: 'bronze',
      ranking_rank: 4,
      skill_areas: ['volunteering', 'sustainability', 'community'],
      tags: ['volunteer', 'environment', 'social impact'],
      is_featured: false,
      engagement_score: 0.48,
      member_count: 3,
    },
    // One pending club — to test approval flow
    {
      key: 'pendingClub',
      name: 'Robotics & AI Lab',
      slug: 'robotics-ai-lab',
      description: 'Building robots and AI projects for national competitions.',
      category: ClubCategory.technical,
      status: ClubStatus.pending,
      created_by: users.student4.id,
      ranking_score: 0,
      ranking_tier: 'unranked',
      ranking_rank: null,
      skill_areas: ['robotics', 'AI', 'hardware'],
      tags: ['robotics', 'AI', 'engineering'],
      is_featured: false,
      engagement_score: 0,
      member_count: 0,
    },
  ];

  const records: DbRecord = {};
  for (const d of defs) {
    const { key, ...data } = d;
    const club = await prisma.club.create({ data });
    records[key] = club;
  }

  console.log(`  🏛️   Created ${defs.length} clubs (4 approved, 1 pending)`);
  return records;
}

// ─── 3. Communities & Access Codes ────────────────────────────────────────────

async function seedCommunitiesAndCodes(clubs: DbRecord, users: DbRecord): Promise<Record<string, string>> {
  const plainCodes: Record<string, string> = {};

  // CodeCraft — two communities: current batch & alumni
  const techCommunity = await prisma.community.create({
    data: {
      club_id: clubs.techClub.id,
      name: 'CodeCraft Core 2024-25',
      tenure_start: new Date('2024-06-01'),
      tenure_end: new Date('2025-05-31'),
      created_by: users.superAdmin.id,
    },
  });

  const secretaryCode = 'TECH-SEC-2024';
  const eventMgrCode  = 'TECH-EM-2024';
  const memberCode    = 'TECH-MEM-2024';

  await prisma.communityAccessCode.createMany({
    data: [
      {
        community_id: techCommunity.id,
        code_hash: hashToken(secretaryCode),
        assigned_role: ClubMemberRole.secretary,
        max_uses: 3,
        usage_count: 1,
      },
      {
        community_id: techCommunity.id,
        code_hash: hashToken(eventMgrCode),
        assigned_role: ClubMemberRole.event_manager,
        max_uses: 3,
        usage_count: 1,
      },
      {
        community_id: techCommunity.id,
        code_hash: hashToken(memberCode),
        assigned_role: ClubMemberRole.member,
        max_uses: 20,
        usage_count: 3,
      },
    ],
  });

  plainCodes['techClub_secretary']     = secretaryCode;
  plainCodes['techClub_event_manager'] = eventMgrCode;
  plainCodes['techClub_member']        = memberCode;

  // Rang Manch community
  const cultureCommunity = await prisma.community.create({
    data: {
      club_id: clubs.cultureClub.id,
      name: 'Rang Manch Core 2024-25',
      tenure_start: new Date('2024-06-01'),
      tenure_end: new Date('2025-05-31'),
      created_by: users.superAdmin.id,
    },
  });

  const cultureCode = 'CULT-MEM-2024';
  await prisma.communityAccessCode.create({
    data: {
      community_id: cultureCommunity.id,
      code_hash: hashToken(cultureCode),
      assigned_role: ClubMemberRole.member,
      max_uses: 15,
      usage_count: 2,
    },
  });
  plainCodes['cultureClub_member'] = cultureCode;

  // Startup Nexus community — one revoked code to test revocation
  const nexusCommunity = await prisma.community.create({
    data: {
      club_id: clubs.entrepreneurClub.id,
      name: 'Startup Nexus Core 2024-25',
      tenure_start: new Date('2024-06-01'),
      tenure_end: new Date('2025-05-31'),
      created_by: users.superAdmin.id,
    },
  });

  const revokedCode = 'NEXUS-OLD-2023';
  const activeCode  = 'NEXUS-MEM-2024';

  await prisma.communityAccessCode.createMany({
    data: [
      {
        community_id: nexusCommunity.id,
        code_hash: hashToken(revokedCode),
        assigned_role: ClubMemberRole.member,
        is_revoked: true,
        revoked_at: daysFromNow(-10),
        revoked_by: users.superAdmin.id,
        max_uses: 10,
        usage_count: 2,
      },
      {
        community_id: nexusCommunity.id,
        code_hash: hashToken(activeCode),
        assigned_role: ClubMemberRole.member,
        max_uses: 10,
        usage_count: 1,
      },
    ],
  });
  plainCodes['entrepreneurClub_member']         = activeCode;
  plainCodes['entrepreneurClub_member_revoked'] = revokedCode;

  console.log('  🔑  Created 3 communities + 6 access codes (1 revoked)');
  return plainCodes;
}

// ─── 4. Memberships ───────────────────────────────────────────────────────────

async function seedMemberships(users: DbRecord, clubs: DbRecord) {
  const memberships = [
    // CodeCraft
    { user_id: users.clubAdminTech.id, club_id: clubs.techClub.id, role: ClubMemberRole.event_manager },
    { user_id: users.eventMgr1.id,     club_id: clubs.techClub.id, role: ClubMemberRole.event_manager },
    { user_id: users.secretary1.id,    club_id: clubs.techClub.id, role: ClubMemberRole.secretary },
    { user_id: users.member1.id,       club_id: clubs.techClub.id, role: ClubMemberRole.member },
    { user_id: users.member2.id,       club_id: clubs.techClub.id, role: ClubMemberRole.member },
    { user_id: users.student1.id,      club_id: clubs.techClub.id, role: ClubMemberRole.member },

    // Rang Manch
    { user_id: users.clubAdminCulture.id, club_id: clubs.cultureClub.id, role: ClubMemberRole.event_manager },
    { user_id: users.secretary2.id,       club_id: clubs.cultureClub.id, role: ClubMemberRole.secretary },
    { user_id: users.member3.id,          club_id: clubs.cultureClub.id, role: ClubMemberRole.member },
    { user_id: users.student2.id,         club_id: clubs.cultureClub.id, role: ClubMemberRole.member },
    { user_id: users.student3.id,         club_id: clubs.cultureClub.id, role: ClubMemberRole.member },

    // Startup Nexus
    { user_id: users.eventMgr2.id,  club_id: clubs.entrepreneurClub.id, role: ClubMemberRole.event_manager },
    { user_id: users.member1.id,    club_id: clubs.entrepreneurClub.id, role: ClubMemberRole.member },
    { user_id: users.student4.id,   club_id: clubs.entrepreneurClub.id, role: ClubMemberRole.member },
    { user_id: users.student5.id,   club_id: clubs.entrepreneurClub.id, role: ClubMemberRole.member },

    // GreenCampus
    { user_id: users.secretary1.id, club_id: clubs.volunteerClub.id, role: ClubMemberRole.secretary },
    { user_id: users.student3.id,   club_id: clubs.volunteerClub.id, role: ClubMemberRole.member },
    { user_id: users.student5.id,   club_id: clubs.volunteerClub.id, role: ClubMemberRole.member },
  ];

  await prisma.userClub.createMany({ data: memberships });
  console.log(`  🤝  Created ${memberships.length} club memberships`);
}

// ─── 5. Events ────────────────────────────────────────────────────────────────

async function seedEvents(clubs: DbRecord, users: DbRecord): Promise<DbRecord> {
  const defs = [
    // ── Past events (attendance can be marked) ──────────────────────────
    {
      key: 'hackathon',
      club_id: clubs.techClub.id,
      created_by: users.eventMgr1.id,
      title: 'HackSprint 2024 — 24hr Hackathon',
      description: 'A 24-hour hackathon open to all students. Build something incredible from scratch.',
      date: daysFromNow(-30),
      end_date: daysFromNow(-29),
      venue: 'Main Auditorium, Block A',
      venue_lat: 19.0760,
      venue_lng: 72.8777,
      geo_fence_radius: 100,
      capacity: 80,
      registration_count: 12,
      event_type: EventType.hackathon,
      is_published: true,
      points_reward: 50,
      volunteer_hours: 24,
      tags: ['coding', 'hackathon', 'prizes'],
      skill_areas: ['programming', 'design', 'teamwork'],
      qr_attendance_enabled: true,
      pin_attendance_enabled: true,
      geo_attendance_enabled: true,
      is_featured: true,
      engagement_score: 0.85,
    },
    {
      key: 'workshop',
      club_id: clubs.techClub.id,
      created_by: users.eventMgr1.id,
      title: 'React & TypeScript Deep Dive',
      description: 'Hands-on workshop covering React 18 hooks, TypeScript generics, and component patterns.',
      date: daysFromNow(-14),
      end_date: daysFromNow(-14),
      venue: 'Lab 301, CS Building',
      venue_lat: 19.0762,
      venue_lng: 72.8779,
      geo_fence_radius: 50,
      capacity: 40,
      registration_count: 8,
      event_type: EventType.workshop,
      is_published: true,
      points_reward: 20,
      volunteer_hours: 4,
      tags: ['react', 'typescript', 'frontend', 'web development'],
      skill_areas: ['web development', 'programming'],
      qr_attendance_enabled: true,
      pin_attendance_enabled: true,
      geo_attendance_enabled: true,
      is_featured: false,
      engagement_score: 0.72,
    },
    {
      key: 'culturalNight',
      club_id: clubs.cultureClub.id,
      created_by: users.clubAdminCulture.id,
      title: 'Festive Cultural Night 2024',
      description: 'An evening of dance, music, and drama celebrating campus diversity.',
      date: daysFromNow(-7),
      end_date: daysFromNow(-7),
      venue: 'Open Air Amphitheatre',
      venue_lat: 19.0755,
      venue_lng: 72.8770,
      geo_fence_radius: 150,
      capacity: 200,
      registration_count: 10,
      event_type: EventType.cultural,
      is_published: true,
      points_reward: 15,
      volunteer_hours: 3,
      tags: ['dance', 'music', 'drama', 'culture'],
      skill_areas: ['dance', 'music', 'drama'],
      qr_attendance_enabled: true,
      pin_attendance_enabled: false,
      geo_attendance_enabled: false,
      is_featured: true,
      engagement_score: 0.78,
    },
    {
      key: 'pitchNight',
      club_id: clubs.entrepreneurClub.id,
      created_by: users.eventMgr2.id,
      title: 'Startup Pitch Night — Season 3',
      description: 'Students pitch their startup ideas to a panel of mentors and investors.',
      date: daysFromNow(-3),
      end_date: daysFromNow(-3),
      venue: 'Seminar Hall B',
      venue_lat: 19.0758,
      venue_lng: 72.8772,
      geo_fence_radius: 75,
      capacity: 60,
      registration_count: 7,
      event_type: EventType.seminar,
      is_published: true,
      points_reward: 25,
      volunteer_hours: 3,
      tags: ['startup', 'pitching', 'entrepreneurship', 'business'],
      skill_areas: ['pitching', 'business', 'finance'],
      qr_attendance_enabled: true,
      pin_attendance_enabled: true,
      geo_attendance_enabled: false,
      is_featured: false,
      engagement_score: 0.60,
    },
    {
      key: 'cleanupDrive',
      club_id: clubs.volunteerClub.id,
      created_by: users.secretary1.id,
      title: 'Campus Green Cleanup Drive',
      description: 'Quarterly volunteer cleanup of campus grounds and lake area.',
      date: daysFromNow(-2),
      end_date: daysFromNow(-2),
      venue: 'Campus Lake Front',
      venue_lat: 19.0750,
      venue_lng: 72.8765,
      geo_fence_radius: 200,
      capacity: 50,
      registration_count: 5,
      event_type: EventType.volunteer,
      is_published: true,
      points_reward: 10,
      volunteer_hours: 5,
      tags: ['volunteer', 'environment', 'community'],
      skill_areas: ['volunteering', 'sustainability'],
      qr_attendance_enabled: false,
      pin_attendance_enabled: false,
      geo_attendance_enabled: true,
      is_featured: false,
      engagement_score: 0.50,
    },

    // ── Ongoing / very soon (live QR/PIN testing) ───────────────────────
    {
      key: 'liveSeminar',
      club_id: clubs.techClub.id,
      created_by: users.eventMgr1.id,
      title: 'AI in Production — Live Seminar',
      description: 'Industry experts discuss deploying ML models at scale in production environments.',
      date: hoursFromNow(-1),   // started 1 hour ago → QR/PIN still valid
      end_date: hoursFromNow(2),
      venue: 'Lab 201, CS Building',
      venue_lat: 19.0763,
      venue_lng: 72.8780,
      geo_fence_radius: 60,
      capacity: 50,
      registration_count: 6,
      event_type: EventType.seminar,
      is_published: true,
      points_reward: 20,
      volunteer_hours: 3,
      tags: ['AI', 'machine learning', 'industry'],
      skill_areas: ['AI', 'programming'],
      qr_attendance_enabled: true,
      pin_attendance_enabled: true,
      geo_attendance_enabled: true,
      is_featured: true,
      engagement_score: 0.70,
    },

    // ── Upcoming events ─────────────────────────────────────────────────
    {
      key: 'openMic',
      club_id: clubs.cultureClub.id,
      created_by: users.clubAdminCulture.id,
      title: 'Open Mic Night — Winter Edition',
      description: 'Student performers showcase poetry, music, standup, and more.',
      date: daysFromNow(7),
      end_date: daysFromNow(7),
      venue: 'Student Activity Centre',
      venue_lat: 19.0756,
      venue_lng: 72.8771,
      geo_fence_radius: 80,
      capacity: 100,
      registration_count: 3,
      registration_deadline: daysFromNow(5),
      event_type: EventType.cultural,
      is_published: true,
      points_reward: 10,
      volunteer_hours: 2,
      tags: ['music', 'poetry', 'performance', 'open mic'],
      skill_areas: ['music', 'drama'],
      qr_attendance_enabled: true,
      pin_attendance_enabled: false,
      geo_attendance_enabled: false,
      is_featured: false,
      engagement_score: 0,
    },
    {
      key: 'webDevBootcamp',
      club_id: clubs.techClub.id,
      created_by: users.eventMgr1.id,
      title: 'Full Stack Web Dev Bootcamp',
      description: '3-day intensive bootcamp covering Node.js, React, PostgreSQL and deployment.',
      date: daysFromNow(14),
      end_date: daysFromNow(16),
      venue: 'Lab 302 & 303, CS Building',
      venue_lat: 19.0764,
      venue_lng: 72.8781,
      geo_fence_radius: 60,
      capacity: 30,
      registration_count: 5,
      registration_deadline: daysFromNow(12),
      event_type: EventType.workshop,
      is_published: true,
      points_reward: 40,
      volunteer_hours: 18,
      tags: ['fullstack', 'react', 'nodejs', 'bootcamp'],
      skill_areas: ['web development', 'programming'],
      qr_attendance_enabled: true,
      pin_attendance_enabled: true,
      geo_attendance_enabled: false,
      is_featured: true,
      engagement_score: 0,
    },
    {
      key: 'startupWeekend',
      club_id: clubs.entrepreneurClub.id,
      created_by: users.eventMgr2.id,
      title: 'Startup Weekend — Build in 48hrs',
      description: 'Form a team, validate an idea, and build a working prototype in 48 hours.',
      date: daysFromNow(21),
      end_date: daysFromNow(23),
      venue: 'Innovation Hub',
      venue_lat: 19.0759,
      venue_lng: 72.8773,
      geo_fence_radius: 100,
      capacity: 60,
      registration_count: 2,
      registration_deadline: daysFromNow(19),
      event_type: EventType.hackathon,
      is_published: true,
      points_reward: 45,
      volunteer_hours: 20,
      tags: ['startup', 'hackathon', 'entrepreneurship'],
      skill_areas: ['entrepreneurship', 'business', 'pitching'],
      qr_attendance_enabled: true,
      pin_attendance_enabled: true,
      geo_attendance_enabled: false,
      is_featured: false,
      engagement_score: 0,
    },
    // Draft event — should NOT appear in public listing
    {
      key: 'draftEvent',
      club_id: clubs.techClub.id,
      created_by: users.eventMgr1.id,
      title: '[DRAFT] NodeJS Microservices Workshop',
      description: 'Draft — not yet published.',
      date: daysFromNow(30),
      venue: 'TBD',
      capacity: 40,
      registration_count: 0,
      event_type: EventType.workshop,
      is_published: false,
      points_reward: 20,
      volunteer_hours: 4,
      tags: ['nodejs', 'microservices'],
      skill_areas: ['programming'],
      qr_attendance_enabled: true,
      pin_attendance_enabled: false,
      geo_attendance_enabled: false,
      is_featured: false,
      engagement_score: 0,
    },
  ];

  const records: DbRecord = {};
  for (const d of defs) {
    const { key, ...data } = d;
    const event = await prisma.event.create({ data });
    records[key] = event;
  }

  console.log(`  📅  Created ${defs.length} events (5 past, 1 live, 3 upcoming, 1 draft)`);
  return records;
}

// ─── 6. Registrations & Attendance ───────────────────────────────────────────

async function seedRegistrationsAndAttendance(
  users: DbRecord,
  events: DbRecord,
  _clubs: DbRecord
) {
  // Helper: get AICTE multiplier for a user in a club
  const getMultiplier = async (userId: string, clubId: string): Promise<number> => {
    const uc = await prisma.userClub.findUnique({
      where: { user_id_club_id: { user_id: userId, club_id: clubId } },
    });
    if (!uc) return AICTE_MULTIPLIERS.non_member;
    if (uc.role === 'secretary' || uc.role === 'event_manager') return AICTE_MULTIPLIERS.secretary;
    return AICTE_MULTIPLIERS.member;
  };

  type RegEntry = { user_key: string; status: AttendanceStatus; method?: AttendanceMethod };
  type RegDef = { event_key: string; entries: RegEntry[] };

  // ── HackSprint (past, fully attended) ────────────────────────────────
  const hackathonRegs: RegDef = {
    event_key: 'hackathon',
    entries: [
      { user_key: 'member1',       status: AttendanceStatus.present,    method: AttendanceMethod.qr },
      { user_key: 'member2',       status: AttendanceStatus.present,    method: AttendanceMethod.qr },
      { user_key: 'member3',       status: AttendanceStatus.late,       method: AttendanceMethod.pin },
      { user_key: 'student1',      status: AttendanceStatus.present,    method: AttendanceMethod.qr },
      { user_key: 'student2',      status: AttendanceStatus.absent,     method: AttendanceMethod.manual },
      { user_key: 'student3',      status: AttendanceStatus.present,    method: AttendanceMethod.geo },
      { user_key: 'student4',      status: AttendanceStatus.left_early, method: AttendanceMethod.qr },
      { user_key: 'student5',      status: AttendanceStatus.present,    method: AttendanceMethod.qr },
      { user_key: 'secretary1',    status: AttendanceStatus.present,    method: AttendanceMethod.manual },
      { user_key: 'eventMgr1',     status: AttendanceStatus.present,    method: AttendanceMethod.manual },
      { user_key: 'clubAdminTech', status: AttendanceStatus.present,    method: AttendanceMethod.manual },
      { user_key: 'eventMgr2',     status: AttendanceStatus.no_show,    method: AttendanceMethod.manual },
    ],
  };

  // ── React Workshop (past) ────────────────────────────────────────────
  const workshopRegs: RegDef = {
    event_key: 'workshop',
    entries: [
      { user_key: 'member1',   status: AttendanceStatus.present, method: AttendanceMethod.pin },
      { user_key: 'member2',   status: AttendanceStatus.present, method: AttendanceMethod.pin },
      { user_key: 'student1',  status: AttendanceStatus.present, method: AttendanceMethod.qr },
      { user_key: 'student4',  status: AttendanceStatus.absent,  method: AttendanceMethod.manual },
      { user_key: 'student5',  status: AttendanceStatus.present, method: AttendanceMethod.geo },
      { user_key: 'secretary1',status: AttendanceStatus.present, method: AttendanceMethod.qr },
      { user_key: 'eventMgr1', status: AttendanceStatus.present, method: AttendanceMethod.manual },
      { user_key: 'student2',  status: AttendanceStatus.late,    method: AttendanceMethod.pin },
    ],
  };

  // ── Cultural Night (past) ─────────────────────────────────────────────
  const culturalRegs: RegDef = {
    event_key: 'culturalNight',
    entries: [
      { user_key: 'member3',          status: AttendanceStatus.present, method: AttendanceMethod.qr },
      { user_key: 'student2',         status: AttendanceStatus.present, method: AttendanceMethod.qr },
      { user_key: 'student3',         status: AttendanceStatus.present, method: AttendanceMethod.qr },
      { user_key: 'secretary2',       status: AttendanceStatus.present, method: AttendanceMethod.manual },
      { user_key: 'clubAdminCulture', status: AttendanceStatus.present, method: AttendanceMethod.manual },
      { user_key: 'student1',         status: AttendanceStatus.late,    method: AttendanceMethod.qr },
      { user_key: 'member1',          status: AttendanceStatus.present, method: AttendanceMethod.qr },
      { user_key: 'student4',         status: AttendanceStatus.present, method: AttendanceMethod.qr },
      { user_key: 'member2',          status: AttendanceStatus.absent,  method: AttendanceMethod.manual },
      { user_key: 'student5',         status: AttendanceStatus.present, method: AttendanceMethod.qr },
    ],
  };

  // ── Pitch Night (past) ────────────────────────────────────────────────
  const pitchRegs: RegDef = {
    event_key: 'pitchNight',
    entries: [
      { user_key: 'student4',  status: AttendanceStatus.present, method: AttendanceMethod.qr },
      { user_key: 'student5',  status: AttendanceStatus.present, method: AttendanceMethod.qr },
      { user_key: 'member1',   status: AttendanceStatus.present, method: AttendanceMethod.pin },
      { user_key: 'eventMgr2', status: AttendanceStatus.present, method: AttendanceMethod.manual },
      { user_key: 'student1',  status: AttendanceStatus.absent,  method: AttendanceMethod.manual },
      { user_key: 'student3',  status: AttendanceStatus.present, method: AttendanceMethod.qr },
      { user_key: 'member2',   status: AttendanceStatus.present, method: AttendanceMethod.qr },
    ],
  };

  // ── Cleanup Drive (past) ──────────────────────────────────────────────
  const cleanupRegs: RegDef = {
    event_key: 'cleanupDrive',
    entries: [
      { user_key: 'student3',  status: AttendanceStatus.present, method: AttendanceMethod.geo },
      { user_key: 'student5',  status: AttendanceStatus.present, method: AttendanceMethod.geo },
      { user_key: 'secretary1',status: AttendanceStatus.present, method: AttendanceMethod.manual },
      { user_key: 'member2',   status: AttendanceStatus.present, method: AttendanceMethod.geo },
      { user_key: 'student2',  status: AttendanceStatus.absent,  method: AttendanceMethod.manual },
    ],
  };

  // ── Live Seminar — registered, not yet attended ───────────────────────
  const liveSeminarRegs: RegDef = {
    event_key: 'liveSeminar',
    entries: [
      { user_key: 'member1',  status: AttendanceStatus.registered },
      { user_key: 'member2',  status: AttendanceStatus.registered },
      { user_key: 'student1', status: AttendanceStatus.registered },
      { user_key: 'student2', status: AttendanceStatus.registered },
      { user_key: 'student4', status: AttendanceStatus.registered },
      { user_key: 'student5', status: AttendanceStatus.registered },
    ],
  };

  // ── Upcoming events — a few pre-registrations ─────────────────────────
  const openMicRegs: RegDef = {
    event_key: 'openMic',
    entries: [
      { user_key: 'student2', status: AttendanceStatus.registered },
      { user_key: 'student3', status: AttendanceStatus.registered },
      { user_key: 'member3',  status: AttendanceStatus.registered },
    ],
  };

  const bootcampRegs: RegDef = {
    event_key: 'webDevBootcamp',
    entries: [
      { user_key: 'member1',  status: AttendanceStatus.registered },
      { user_key: 'member2',  status: AttendanceStatus.registered },
      { user_key: 'student1', status: AttendanceStatus.registered },
      { user_key: 'student4', status: AttendanceStatus.registered },
      { user_key: 'student5', status: AttendanceStatus.registered },
    ],
  };

  const allDefs = [
    hackathonRegs, workshopRegs, culturalRegs, pitchRegs,
    cleanupRegs, liveSeminarRegs, openMicRegs, bootcampRegs,
  ];

  let totalRegs = 0;
  let totalLogs = 0;

  for (const def of allDefs) {
    const event = events[def.event_key];
    const clubId = event.club_id as string;

    for (const entry of def.entries) {
      const user = users[entry.user_key];
      // Fixed: use explicit comparisons instead of .includes() to satisfy TS narrowing
      const isAttended =
        entry.status === AttendanceStatus.present ||
        entry.status === AttendanceStatus.late ||
        entry.status === AttendanceStatus.left_early;

      const multiplier = await getMultiplier(user.id, clubId);
      const pointsAwarded = isAttended ? (event.points_reward as number) * multiplier : 0;
      const hoursAwarded  = isAttended ? (event.volunteer_hours as number) * multiplier : 0;

      await prisma.eventRegistration.create({
        data: {
          event_id: event.id,
          user_id: user.id,
          status: entry.status,
          attended: isAttended,
          points_awarded: pointsAwarded,
          hours_awarded: hoursAwarded,
        },
      });
      totalRegs++;

      // Write attendance log for any non-registered status
      if (entry.status !== AttendanceStatus.registered && entry.method) {
        // Fixed: use Prisma.JsonNull instead of null for Json? field
        let metadata: Prisma.InputJsonValue | typeof Prisma.JsonNull = Prisma.JsonNull;
        if (entry.method === AttendanceMethod.geo) {
          metadata = { lat: event.venue_lat as number, lng: event.venue_lng as number };
        } else if (entry.method === AttendanceMethod.qr) {
          metadata = { qr_code_id: 'seed-qr-placeholder' };
        }

        await prisma.attendanceLog.create({
          data: {
            event_id: event.id,
            user_id: user.id,
            changed_by: users.secretary1.id,
            old_status: AttendanceStatus.registered,
            new_status: entry.status,
            method: entry.method,
            metadata,
          },
        });
        totalLogs++;
      }
    }
  }

  // ── QR Codes for past + live events ──────────────────────────────────
  for (const [key, event] of Object.entries(events) as [string, DbRecord[string]][]) {
    if (!(event.is_published as boolean) || key === 'draftEvent') continue;
    const payload = `${event.id}:seed-qr`;
    const eventDate = event.date as Date;
    const eventEndDate = event.end_date as Date | null;
    await prisma.eventQrCode.create({
      data: {
        event_id: event.id,
        valid_from: eventDate,
        valid_until: eventEndDate ?? new Date(new Date(eventDate).getTime() + 4 * 60 * 60 * 1000),
        hmac_signature: hmacSign(payload),
        scan_count: key === 'hackathon' ? 6 : key === 'workshop' ? 3 : 0,
        is_active: key === 'liveSeminar',
        created_by: users.secretary1.id,
      },
    });
  }

  console.log(`  ✅  Created ${totalRegs} registrations, ${totalLogs} attendance logs, ${Object.keys(events).length - 1} QR codes`);
}

// ─── 7. Notifications ─────────────────────────────────────────────────────────

async function seedNotifications(
  users: DbRecord,
  events: DbRecord,
  clubs: DbRecord
) {
  const notifs = [
    // Unread — student1
    {
      user_id: users.student1.id,
      title: 'Attendance Confirmed ✅',
      body: 'Your attendance at HackSprint 2024 has been marked. You earned 50 points!',
      type: NotificationType.attendance_marked,
      is_read: false,
      metadata: { event_id: events.hackathon.id },
    },
    {
      user_id: users.student1.id,
      title: 'Points Awarded 🎉',
      body: 'You have been awarded 20 points for attending the React & TypeScript Deep Dive workshop.',
      type: NotificationType.points_awarded,
      is_read: false,
      metadata: { event_id: events.workshop.id },
    },
    {
      user_id: users.student1.id,
      title: 'Reminder: AI in Production Seminar starts in 1 hour',
      body: 'Get ready! The AI in Production seminar starts at Lab 201 in 1 hour.',
      type: NotificationType.event_reminder,
      is_read: false,
      metadata: { event_id: events.liveSeminar.id },
    },
    // Read — student2
    {
      user_id: users.student2.id,
      title: 'Registration Confirmed',
      body: 'You are registered for the Full Stack Web Dev Bootcamp. See you on the 14th!',
      type: NotificationType.event_registration,
      is_read: true,
      metadata: { event_id: events.webDevBootcamp.id },
    },
    // Super admin
    {
      user_id: users.superAdmin.id,
      title: 'New Club Pending Approval',
      body: 'Robotics & AI Lab has submitted a club creation request and is awaiting your review.',
      type: NotificationType.club_approved,
      is_read: false,
      metadata: { club_id: clubs.pendingClub.id },
    },
    // Club admin
    {
      user_id: users.clubAdminTech.id,
      title: 'CodeCraft Society Approved ✅',
      body: 'Your club CodeCraft Society has been approved by the super admin.',
      type: NotificationType.club_approved,
      is_read: true,
      metadata: { club_id: clubs.techClub.id },
    },
    // member1 — multiple
    {
      user_id: users.member1.id,
      title: 'Access Code Activated',
      body: 'Your core member access code for CodeCraft Society has been activated. Welcome aboard!',
      type: NotificationType.access_code_activated,
      is_read: true,
      metadata: { club_id: clubs.techClub.id },
    },
    {
      user_id: users.member1.id,
      title: 'Reminder: Full Stack Bootcamp in 14 days',
      body: 'The Full Stack Web Dev Bootcamp is coming up. Make sure you have your laptop ready!',
      type: NotificationType.event_reminder,
      is_read: false,
      metadata: { event_id: events.webDevBootcamp.id },
    },
    // student5
    {
      user_id: users.student5.id,
      title: 'Points Awarded 🎉',
      body: 'You earned 25 points for attending Startup Pitch Night — Season 3.',
      type: NotificationType.points_awarded,
      is_read: false,
      metadata: { event_id: events.pitchNight.id },
    },
  ];

  await prisma.notification.createMany({ data: notifs });
  console.log(`  🔔  Created ${notifs.length} notifications`);
}

// ─── 8. Points History ────────────────────────────────────────────────────────

async function seedPointsHistory(users: DbRecord, events: DbRecord) {
  const entries = [
    // member1 — CS member (1.1x), secretary in tech club (2x) — mix
    { user_id: users.member1.id,   event_id: events.hackathon.id,   points: 55,   hours: 26.4, reason: 'Attended HackSprint 2024',            multiplier: AICTE_MULTIPLIERS.member },
    { user_id: users.member1.id,   event_id: events.workshop.id,    points: 22,   hours: 4.4,  reason: 'Attended React & TypeScript Workshop', multiplier: AICTE_MULTIPLIERS.member },
    { user_id: users.member1.id,   event_id: events.pitchNight.id,  points: 27.5, hours: 3.3,  reason: 'Attended Startup Pitch Night',         multiplier: AICTE_MULTIPLIERS.member },

    // member2
    { user_id: users.member2.id,   event_id: events.hackathon.id,   points: 55,   hours: 26.4, reason: 'Attended HackSprint 2024',            multiplier: AICTE_MULTIPLIERS.member },
    { user_id: users.member2.id,   event_id: events.workshop.id,    points: 22,   hours: 4.4,  reason: 'Attended React & TypeScript Workshop', multiplier: AICTE_MULTIPLIERS.member },
    { user_id: users.member2.id,   event_id: events.pitchNight.id,  points: 27.5, hours: 3.3,  reason: 'Attended Startup Pitch Night',         multiplier: AICTE_MULTIPLIERS.member },

    // secretary1 — 2x multiplier
    { user_id: users.secretary1.id, event_id: events.hackathon.id,    points: 100, hours: 48,  reason: 'Attended HackSprint 2024 (WC)',             multiplier: AICTE_MULTIPLIERS.secretary },
    { user_id: users.secretary1.id, event_id: events.workshop.id,     points: 40,  hours: 8,   reason: 'Attended React & TypeScript Workshop (WC)',  multiplier: AICTE_MULTIPLIERS.secretary },
    { user_id: users.secretary1.id, event_id: events.cleanupDrive.id, points: 20,  hours: 10,  reason: 'Attended Campus Green Cleanup (WC)',         multiplier: AICTE_MULTIPLIERS.secretary },

    // student1
    { user_id: users.student1.id,  event_id: events.hackathon.id,   points: 50,  hours: 24,   reason: 'Attended HackSprint 2024',            multiplier: AICTE_MULTIPLIERS.non_member },
    { user_id: users.student1.id,  event_id: events.workshop.id,    points: 20,  hours: 4,    reason: 'Attended React & TypeScript Workshop', multiplier: AICTE_MULTIPLIERS.non_member },

    // student2
    { user_id: users.student2.id,  event_id: events.culturalNight.id, points: 15, hours: 3,  reason: 'Attended Cultural Night 2024',         multiplier: AICTE_MULTIPLIERS.non_member },

    // student3
    { user_id: users.student3.id,  event_id: events.culturalNight.id, points: 15, hours: 3,  reason: 'Attended Cultural Night 2024',         multiplier: AICTE_MULTIPLIERS.non_member },
    { user_id: users.student3.id,  event_id: events.cleanupDrive.id,  points: 10, hours: 5,  reason: 'Attended Campus Green Cleanup',        multiplier: AICTE_MULTIPLIERS.non_member },

    // student4
    { user_id: users.student4.id,  event_id: events.pitchNight.id,  points: 25,  hours: 3,   reason: 'Attended Startup Pitch Night',         multiplier: AICTE_MULTIPLIERS.non_member },

    // student5
    { user_id: users.student5.id,  event_id: events.hackathon.id,   points: 50,  hours: 24,  reason: 'Attended HackSprint 2024',             multiplier: AICTE_MULTIPLIERS.non_member },
    { user_id: users.student5.id,  event_id: events.pitchNight.id,  points: 25,  hours: 3,   reason: 'Attended Startup Pitch Night',         multiplier: AICTE_MULTIPLIERS.non_member },
    { user_id: users.student5.id,  event_id: events.cleanupDrive.id,points: 10,  hours: 5,   reason: 'Attended Campus Green Cleanup',        multiplier: AICTE_MULTIPLIERS.non_member },
  ];

  await prisma.pointsHistory.createMany({ data: entries });
  console.log(`  📊  Created ${entries.length} points history entries`);
}

// ─── 9. Audit Log ─────────────────────────────────────────────────────────────

async function seedAuditLog(
  users: DbRecord,
  clubs: DbRecord,
  events: DbRecord
) {
  const entries = [
    { action: 'club.approved',     actor_id: users.superAdmin.id,  target_type: 'club',       target_id: clubs.techClub.id,         club_id: clubs.techClub.id,         metadata: { reason: 'All docs verified' } },
    { action: 'club.approved',     actor_id: users.superAdmin.id,  target_type: 'club',       target_id: clubs.cultureClub.id,      club_id: clubs.cultureClub.id,      metadata: { reason: 'Approved' } },
    { action: 'club.approved',     actor_id: users.superAdmin.id,  target_type: 'club',       target_id: clubs.entrepreneurClub.id, club_id: clubs.entrepreneurClub.id, metadata: { reason: 'Approved' } },
    { action: 'club.approved',     actor_id: users.superAdmin.id,  target_type: 'club',       target_id: clubs.volunteerClub.id,    club_id: clubs.volunteerClub.id,    metadata: { reason: 'Approved' } },
    { action: 'event.created',     actor_id: users.eventMgr1.id,   target_type: 'event',      target_id: events.hackathon.id,       club_id: clubs.techClub.id },
    { action: 'event.published',   actor_id: users.eventMgr1.id,   target_type: 'event',      target_id: events.hackathon.id,       club_id: clubs.techClub.id },
    { action: 'attendance.bulk',   actor_id: users.secretary1.id,  target_type: 'event',      target_id: events.hackathon.id,       club_id: clubs.techClub.id,         metadata: { count: 12 } },
    { action: 'code.generated',    actor_id: users.superAdmin.id,  target_type: 'community',  target_id: clubs.techClub.id,         club_id: clubs.techClub.id },
    { action: 'code.revoked',      actor_id: users.superAdmin.id,  target_type: 'access_code',target_id: 'NEXUS-OLD-2023',          club_id: clubs.entrepreneurClub.id },
    { action: 'user.role_upgrade', actor_id: users.member1.id,     target_type: 'user',       target_id: users.member1.id,          club_id: clubs.techClub.id,         metadata: { new_role: 'member', code: 'TECH-MEM-2024' } },
  ];

  await prisma.auditLog.createMany({ data: entries });
  console.log(`  📋  Created ${entries.length} audit log entries`);
}

// ─── Phase 2: Rankings ─────────────────────────────────────────────────────────

async function seedRankingSnapshots(clubs: DbRecord) {
  const snapshots: Prisma.club_ranking_snapshotsCreateManyInput[] = [];
  const approvedClubs = [
    { club: clubs.techClub,         base: 87.4, attendance: 0.78, events: 0.90, engagement: 0.82, feedback: 0.85, social: 0.70 },
    { club: clubs.cultureClub,      base: 72.1, attendance: 0.70, events: 0.72, engagement: 0.68, feedback: 0.75, social: 0.65 },
    { club: clubs.entrepreneurClub, base: 63.5, attendance: 0.62, events: 0.60, engagement: 0.55, feedback: 0.65, social: 0.58 },
    { club: clubs.volunteerClub,    base: 55.0, attendance: 0.55, events: 0.50, engagement: 0.48, feedback: 0.60, social: 0.45 },
  ];

  for (let i = 0; i < approvedClubs.length; i++) {
    const { club, base, attendance, events, engagement, feedback, social } = approvedClubs[i];
    for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
      const jitter = (Math.random() - 0.5) * 4;
      snapshots.push({
        club_id: club.id,
        ranking_score: base + jitter,
        rank: i + 1,
        attendance_rate: attendance,
        events_held: events,
        member_engagement: engagement,
        feedback_score: feedback,
        social_activity: social,
        tier: base >= 80 ? 'gold' : base >= 65 ? 'silver' : 'bronze',
        computed_at: daysFromNow(-30 * monthsAgo),
      });
    }
  }

  await prisma.club_ranking_snapshots.createMany({ data: snapshots });
  console.log(`  🏆  Created ${snapshots.length} ranking snapshots`);
}

// ─── Phase 2: Suggestions ─────────────────────────────────────────────────────

async function seedSuggestions(users: DbRecord, clubs: DbRecord) {
  const suggestions = [
    {
      club_id: clubs.techClub.id,
      user_id: users.student1.id,
      title: 'Add a monthly competitive programming contest',
      body: 'It would be great to have a monthly in-house coding contest on Codeforces-style problems. Many students want to practise for ICPC.',
      status: suggestion_status.planned,
      admin_note: 'Great idea — we will schedule this starting next month.',
    },
    {
      club_id: clubs.techClub.id,
      user_id: users.member2.id,
      title: 'Open source contribution sprint',
      body: 'Organise a sprint where club members pick beginner-friendly GitHub issues and contribute together.',
      status: suggestion_status.under_consideration,
      admin_note: null,
    },
    {
      club_id: clubs.cultureClub.id,
      user_id: users.student3.id,
      title: 'Inter-college dance competition',
      body: 'We should host an inter-college classical and western dance competition. It would bring more visibility to the club.',
      status: suggestion_status.pending,
      admin_note: null,
    },
    {
      club_id: clubs.entrepreneurClub.id,
      user_id: users.student4.id,
      title: 'Alumni mentorship sessions',
      body: 'Monthly one-hour sessions with startup founders from the alumni network would be invaluable.',
      status: suggestion_status.rejected,
      admin_note: 'Good idea but we currently lack the alumni network infrastructure. Will revisit in Phase 2.',
    },
    {
      club_id: clubs.techClub.id,
      user_id: users.student4.id,
      title: 'Machine Learning study group',
      body: 'A weekly ML paper reading group where members present papers and discuss. Would complement the AI seminar track.',
      status: suggestion_status.pending,
      admin_note: null,
    },
  ];

  await prisma.suggestions.createMany({ data: suggestions });
  console.log(`  💡  Created ${suggestions.length} suggestions`);
}

// ─── Phase 3: Badges ──────────────────────────────────────────────────────────

async function seedBadges(users: DbRecord) {
  const badges = [
    // member1 — attended 3 events → first_event, has core access → core_member
    { user_id: users.member1.id, badge_type: BadgeType.first_event, event_id: null },
    { user_id: users.member1.id, badge_type: BadgeType.core_member, event_id: null },

    // secretary1 — organiser of multiple events
    { user_id: users.secretary1.id, badge_type: BadgeType.first_event,     event_id: null },
    { user_id: users.secretary1.id, badge_type: BadgeType.core_member,     event_id: null },
    { user_id: users.secretary1.id, badge_type: BadgeType.volunteer_star,  event_id: null },
    { user_id: users.secretary1.id, badge_type: BadgeType.event_organiser, event_id: null },

    // clubAdminTech
    { user_id: users.clubAdminTech.id, badge_type: BadgeType.first_event,     event_id: null },
    { user_id: users.clubAdminTech.id, badge_type: BadgeType.core_member,     event_id: null },
    { user_id: users.clubAdminTech.id, badge_type: BadgeType.event_organiser, event_id: null },

    // student5 — active student
    { user_id: users.student5.id, badge_type: BadgeType.first_event, event_id: null },

    // member2
    { user_id: users.member2.id, badge_type: BadgeType.first_event, event_id: null },
    { user_id: users.member2.id, badge_type: BadgeType.core_member, event_id: null },
  ];

  await prisma.badge.createMany({ data: badges });
  console.log(`  🏅  Created ${badges.length} badges`);
}

// ─── Phase 3: Certificates ────────────────────────────────────────────────────

async function seedCertificates(
  users: DbRecord,
  events: DbRecord,
  clubs: DbRecord
) {
  const certs = [
    { user_id: users.member1.id,    event_id: events.hackathon.id,    club_id: clubs.techClub.id,          points_awarded: 55,  hours_awarded: 26.4, multiplier_used: AICTE_MULTIPLIERS.member },
    { user_id: users.member1.id,    event_id: events.workshop.id,     club_id: clubs.techClub.id,          points_awarded: 22,  hours_awarded: 4.4,  multiplier_used: AICTE_MULTIPLIERS.member },
    { user_id: users.secretary1.id, event_id: events.hackathon.id,    club_id: clubs.techClub.id,          points_awarded: 100, hours_awarded: 48,   multiplier_used: AICTE_MULTIPLIERS.secretary },
    { user_id: users.secretary1.id, event_id: events.cleanupDrive.id, club_id: clubs.volunteerClub.id,     points_awarded: 20,  hours_awarded: 10,   multiplier_used: AICTE_MULTIPLIERS.secretary },
    { user_id: users.student1.id,   event_id: events.hackathon.id,    club_id: clubs.techClub.id,          points_awarded: 50,  hours_awarded: 24,   multiplier_used: AICTE_MULTIPLIERS.non_member },
    { user_id: users.student3.id,   event_id: events.culturalNight.id,club_id: clubs.cultureClub.id,       points_awarded: 15,  hours_awarded: 3,    multiplier_used: AICTE_MULTIPLIERS.non_member },
    { user_id: users.student5.id,   event_id: events.hackathon.id,    club_id: clubs.techClub.id,          points_awarded: 50,  hours_awarded: 24,   multiplier_used: AICTE_MULTIPLIERS.non_member },
    { user_id: users.student5.id,   event_id: events.pitchNight.id,   club_id: clubs.entrepreneurClub.id,  points_awarded: 25,  hours_awarded: 3,    multiplier_used: AICTE_MULTIPLIERS.non_member },
    { user_id: users.member2.id,    event_id: events.hackathon.id,    club_id: clubs.techClub.id,          points_awarded: 55,  hours_awarded: 26.4, multiplier_used: AICTE_MULTIPLIERS.member },
  ];

  await prisma.certificate.createMany({ data: certs });
  console.log(`  📜  Created ${certs.length} certificates`);
}

// ─── Phase 4: Chat Rooms & Messages ───────────────────────────────────────────

async function seedChatRooms(
  clubs: DbRecord,
  events: DbRecord,
  users: DbRecord
) {
  // Club chat rooms
  const techRoom = await prisma.chatRoom.create({
    data: { type: RoomType.club, ref_id: clubs.techClub.id },
  });
  const cultureRoom = await prisma.chatRoom.create({
    data: { type: RoomType.club, ref_id: clubs.cultureClub.id },
  });
  // Created but not used further in seed — suppressed with void
  void await prisma.chatRoom.create({
    data: { type: RoomType.club, ref_id: clubs.entrepreneurClub.id },
  });

  // Event chat room for live seminar
  const seminarRoom = await prisma.chatRoom.create({
    data: { type: RoomType.event, ref_id: events.liveSeminar.id },
  });

  // Archived event chat (hackathon ended > 48hrs ago)
  await prisma.chatRoom.create({
    data: { type: RoomType.event, ref_id: events.hackathon.id, is_archived: true },
  });

  // Seed messages
  const techMessages = [
    { room_id: techRoom.id, sender_id: users.clubAdminTech.id, content: 'Welcome to the CodeCraft Society chat! 🚀 Use this space for discussions, resource sharing, and questions.' },
    { room_id: techRoom.id, sender_id: users.member1.id,       content: 'Hey everyone! Super excited to be part of this club. Any resources to get started with competitive programming?' },
    { room_id: techRoom.id, sender_id: users.secretary1.id,    content: 'Check out Codeforces and AtCoder for practice. The club also has a shared Google Drive with past problem sets — I will share the link.' },
    { room_id: techRoom.id, sender_id: users.member2.id,       content: 'Can someone explain the difference between BFS and DFS for shortest path problems?' },
    { room_id: techRoom.id, sender_id: users.eventMgr1.id,     content: 'BFS gives shortest path in unweighted graphs. DFS is generally used for traversal but not optimal path. I can make a short explainer video if needed!' },
    { room_id: techRoom.id, sender_id: users.student1.id,      content: 'That would be amazing Karan! Please do 🙏' },
    { room_id: techRoom.id, sender_id: users.clubAdminTech.id, content: 'Reminder: Full Stack Bootcamp registration closes in 2 days. Only 5 seats left!', is_announcement: false },
  ];

  const cultureMessages = [
    { room_id: cultureRoom.id, sender_id: users.clubAdminCulture.id, content: 'Hey Rang Manch fam! Open Mic Night sign-ups are open. DM me or fill out the form in the pinned post.' },
    { room_id: cultureRoom.id, sender_id: users.student2.id,         content: 'I want to perform a spoken word piece! How long can each slot be?' },
    { room_id: cultureRoom.id, sender_id: users.secretary2.id,       content: 'Each performer gets 5 minutes. You can sign up for two consecutive slots if you need more time.' },
    { room_id: cultureRoom.id, sender_id: users.member3.id,          content: 'Are we doing a group dance piece for Festive Night? I can choreograph if needed!' },
  ];

  const seminarMessages = [
    { room_id: seminarRoom.id, sender_id: users.member1.id,    content: 'Just arrived — which lab did it shift to?' },
    { room_id: seminarRoom.id, sender_id: users.secretary1.id, content: 'Still Lab 201, 3rd floor CS Building. Speaker is setting up.' },
    { room_id: seminarRoom.id, sender_id: users.student4.id,   content: 'The slides are really good! Any way to get a copy after?' },
    { room_id: seminarRoom.id, sender_id: users.eventMgr1.id,  content: 'Slides will be shared on the club drive by tonight 🙌' },
  ];

  await prisma.chatMessage.createMany({ data: [...techMessages, ...cultureMessages, ...seminarMessages] });
  console.log(`  💬  Created 5 chat rooms + ${techMessages.length + cultureMessages.length + seminarMessages.length} messages`);
}

// ─── Phase 4: Announcements ───────────────────────────────────────────────────

async function seedAnnouncements(clubs: DbRecord, users: DbRecord) {
  const announcements = [
    {
      club_id: clubs.techClub.id,
      posted_by: users.clubAdminTech.id,
      title: '📣 Full Stack Bootcamp — Final Registration Reminder',
      body: 'Only 5 seats remaining for the Full Stack Web Dev Bootcamp (14–16th). Register now via the Events page. Priority given to existing CodeCraft members. See you there!',
    },
    {
      club_id: clubs.techClub.id,
      posted_by: users.eventMgr1.id,
      title: 'HackSprint 2024 — Results Announced',
      body: 'Congratulations to Team ByteForce for winning HackSprint 2024! All participants will receive certificates by end of week. Thank you to all 80 participants — you made it incredible.',
    },
    {
      club_id: clubs.cultureClub.id,
      posted_by: users.clubAdminCulture.id,
      title: '🎭 Open Mic Night — Performer Registration Open',
      body: 'Sign-ups for Open Mic Night (Winter Edition) are now open. 5-minute performance slots available for music, poetry, stand-up comedy, and spoken word. Fill out the form linked in bio.',
    },
    {
      club_id: clubs.entrepreneurClub.id,
      posted_by: users.eventMgr2.id,
      title: 'Startup Weekend — Team Formation Starts Now',
      body: 'Startup Weekend is 3 weeks away. Start thinking about your ideas! We will have a team formation mixer the week before. Details to follow.',
    },
  ];

  await prisma.announcement.createMany({ data: announcements });
  console.log(`  📢  Created ${announcements.length} announcements`);
}

// ─── Phase 4: Recruitment ─────────────────────────────────────────────────────

async function seedRecruitment(clubs: DbRecord, users: DbRecord) {
  const app1 = await prisma.recruitmentApplication.create({
    data: {
      club_id: clubs.techClub.id,
      user_id: users.student1.id,
      form_data: {
        why_join: 'I want to deepen my DSA skills and contribute to club hackathons.',
        skills: ['React', 'Python', 'C++'],
        availability: '10 hours/week',
        preferred_role: 'Event Manager',
        linkedin: 'https://linkedin.com/in/tanvi-kapoor-dev',
      },
      status: ApplicationStatus.shortlisted,
    },
  });

  // Created but result not used further — suppressed with void
  void await prisma.recruitmentApplication.create({
    data: {
      club_id: clubs.techClub.id,
      user_id: users.student2.id,
      form_data: {
        why_join: 'Passionate about open source and want to contribute to club projects.',
        skills: ['Vue.js', 'Node.js', 'PostgreSQL'],
        availability: '8 hours/week',
        preferred_role: 'Secretary',
      },
      status: ApplicationStatus.pending,
    },
  });

  // Created but result not used further — suppressed with void
  void await prisma.recruitmentApplication.create({
    data: {
      club_id: clubs.cultureClub.id,
      user_id: users.student4.id,
      form_data: {
        why_join: 'I have 5 years of Bharatanatyam training and want to help organise dance events.',
        skills: ['Classical dance', 'Event coordination', 'Stage management'],
        availability: '6 hours/week',
        preferred_role: 'Event Manager',
      },
      status: ApplicationStatus.rejected,
    },
  });

  const app4 = await prisma.recruitmentApplication.create({
    data: {
      club_id: clubs.entrepreneurClub.id,
      user_id: users.student5.id,
      form_data: {
        why_join: 'I am working on a fintech startup and want to connect with other founders.',
        skills: ['Business development', 'Product management', 'Fundraising'],
        availability: '12 hours/week',
        preferred_role: 'Member',
      },
      status: ApplicationStatus.accepted,
    },
  });

  // Interviews
  await prisma.interview.createMany({
    data: [
      {
        application_id: app1.id,
        club_id: clubs.techClub.id,
        candidate_id: users.student1.id,
        slot_time: daysFromNow(3),
        result: null,
      },
      {
        application_id: app4.id,
        club_id: clubs.entrepreneurClub.id,
        candidate_id: users.student5.id,
        slot_time: daysFromNow(-5),
        result: InterviewResult.accepted,
      },
    ],
  });

  console.log('  🎯  Created 4 recruitment applications + 2 interviews');
}

// ─── Phase 4: Notification Preferences ───────────────────────────────────────

async function seedNotificationPreferences(users: DbRecord) {
  const prefs = [
    { user_id: users.student1.id,   email_enabled: true,  push_enabled: true,  types: ['event_reminder', 'attendance_marked', 'points_awarded'] },
    { user_id: users.student2.id,   email_enabled: true,  push_enabled: false, types: ['event_reminder', 'event_registration'] },
    { user_id: users.member1.id,    email_enabled: true,  push_enabled: true,  types: ['event_reminder', 'attendance_marked', 'club_announcement', 'points_awarded'] },
    { user_id: users.secretary1.id, email_enabled: true,  push_enabled: true,  types: ['event_reminder', 'attendance_marked', 'club_announcement', 'system'] },
    { user_id: users.superAdmin.id, email_enabled: true,  push_enabled: true,  types: ['club_approved', 'system'] },
  ];

  await prisma.notificationPreference.createMany({ data: prefs });
  console.log(`  ⚙️   Created ${prefs.length} notification preferences`);
}

// ─── Phase 5: Extra History for AI Recommendations ───────────────────────────

async function seedPhase5ExtraHistory(
  users: DbRecord,
  events: DbRecord,
  _clubs: DbRecord
) {
  const extraHistory = [
    { user_id: users.student1.id, event_id: events.workshop.id,     points: 20, hours: 4,  reason: 'Phase 5 seeded history', multiplier: 1.0 },
    { user_id: users.student2.id, event_id: events.workshop.id,     points: 20, hours: 4,  reason: 'Phase 5 seeded history', multiplier: 1.0 },
    { user_id: users.student2.id, event_id: events.hackathon.id,    points: 50, hours: 24, reason: 'Phase 5 seeded history', multiplier: 1.0 },
    { user_id: users.student4.id, event_id: events.cleanupDrive.id, points: 10, hours: 5,  reason: 'Phase 5 seeded history', multiplier: 1.0 },
  ];

  for (const entry of extraHistory) {
    const exists = await prisma.pointsHistory.findFirst({
      where: { user_id: entry.user_id, event_id: entry.event_id },
    });
    if (!exists) {
      await prisma.pointsHistory.create({ data: entry });
    }
  }

  const extraRegs = [
    { event_id: events.workshop.id,     user_id: users.student2.id },
    { event_id: events.hackathon.id,    user_id: users.student2.id },
    { event_id: events.cleanupDrive.id, user_id: users.student4.id },
  ];

  for (const reg of extraRegs) {
    const exists = await prisma.eventRegistration.findUnique({
      where: { event_id_user_id: reg },
    });
    if (!exists) {
      await prisma.eventRegistration.create({
        data: {
          ...reg,
          status: AttendanceStatus.present,
          attended: true,
          points_awarded: 20,
          hours_awarded: 4,
        },
      });
    }
  }

  console.log('  🤖  Seeded Phase 5 AI recommendation training data');
}

// ─── Print Credentials ────────────────────────────────────────────────────────

function printCredentials(users: DbRecord, codes: Record<string, string>) {
  console.log('\n' + '═'.repeat(70));
  console.log('  🔐  TEST CREDENTIALS  (password for all: Password123!)');
  console.log('═'.repeat(70));

  const rows: [string, string, string][] = [
    ['super_admin',   users.superAdmin.email as string,        'Full platform control'],
    ['club_admin',    users.clubAdminTech.email as string,     'CodeCraft Society admin'],
    ['club_admin',    users.clubAdminCulture.email as string,  'Rang Manch admin'],
    ['event_manager', users.eventMgr1.email as string,         'Tech event manager'],
    ['event_manager', users.eventMgr2.email as string,         'Nexus event manager'],
    ['secretary',     users.secretary1.email as string,        'Tech secretary (QR/PIN)'],
    ['secretary',     users.secretary2.email as string,        'Culture secretary'],
    ['member',        users.member1.email as string,           'Core tech member'],
    ['member',        users.member2.email as string,           'Core tech + nexus member'],
    ['member',        users.member3.email as string,           'Culture member'],
    ['student',       users.student1.email as string,          'Active student'],
    ['student',       users.student2.email as string,          'Culture + tech student'],
    ['student',       users.student3.email as string,          'Culture + volunteer'],
    ['student',       users.student4.email as string,          'Nexus student + pending club'],
    ['student',       users.student5.email as string,          'Multi-club student'],
  ];

  const maxEmail = Math.max(...rows.map((r) => r[1].length));
  for (const [role, email, note] of rows) {
    console.log(`  ${role.padEnd(14)} ${email.padEnd(maxEmail + 2)} ${note}`);
  }

  console.log('\n' + '─'.repeat(70));
  console.log('  🔑  ACCESS CODES  (use at /core/join)');
  console.log('─'.repeat(70));
  for (const [key, code] of Object.entries(codes)) {
    console.log(`  ${key.padEnd(38)} ${code}`);
  }

  console.log('\n' + '─'.repeat(70));
  console.log('  📌  QUICK TEST SCENARIOS');
  console.log('─'.repeat(70));
  console.log('  Phase 1 — Auth:         Register new user → verify → login → refresh → logout');
  console.log('  Phase 1 — Attendance:   Login as secretary1, go to "AI in Production" (live event)');
  console.log('                          Generate QR or PIN → login as student1 → scan/enter → see points');
  console.log('  Phase 1 — Analytics:    Login as superAdmin → /admin/analytics for global stats');
  console.log('  Phase 2 — Rankings:     View /clubs → see gold/silver/bronze badges on cards');
  console.log('                          Club detail → ranking breakdown modal');
  console.log('  Phase 2 — Suggestions:  Login as student4 → club detail → submit suggestion');
  console.log('  Phase 3 — Certificates: Login as member1 → /profile → certificates list');
  console.log('                          Download resume PDF from profile page');
  console.log('  Phase 3 — Geo-fence:    Login as student3 → "Campus Cleanup" event → tap geo attend');
  console.log('  Phase 4 — Chat:         Login as member1 → CodeCraft chat → send message');
  console.log('  Phase 4 — Recruitment:  Login as student2 → apply to CodeCraft');
  console.log('                          Login as clubAdminTech → review applications → shortlist');
  console.log('  Phase 5 — AI Recs:      Login as student1 → dashboard → "Events You Might Like"');
  console.log('  Phase 5 — Trends:       Any user → homepage → Campus Trends section');
  console.log('  Phase 5 — LinkedIn:     Login as member1 → profile → certificates → Share on LinkedIn');
  console.log('  Approval flow:          Login as superAdmin → /admin/clubs/pending → approve Robotics club');
  console.log('  Access code revoked:    Use code NEXUS-OLD-2023 at /core/join → expect rejection');
  console.log('═'.repeat(70) + '\n');
}

// ─── Run ──────────────────────────────────────────────────────────────────────

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());