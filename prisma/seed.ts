// prisma/seed.ts
import {
  PrismaClient,
  Role,
  ClubMemberRole,
  ClubCategory,
  ClubStatus,
  EventType,
  DegreeType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const futureDate = (daysFromNow: number, hour = 14): Date => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function main() {
  console.log("🌱 Seeding ClubHub Phase 1 data...\n");

  // ── Teardown in FK dependency order ────────────────────────────────────────
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.pointsHistory.deleteMany();
  await prisma.accessCodeUsage.deleteMany();
  await prisma.communityAccessCode.deleteMany();
  await prisma.community.deleteMany();
  await prisma.attendanceLog.deleteMany();
  await prisma.eventRegistration.deleteMany();
  await prisma.eventQrCode.deleteMany();
  await prisma.event.deleteMany();
  await prisma.userClub.deleteMany();
  await prisma.club.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // ── Users ──────────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@clubhub.app",
      password_hash: passwordHash,
      name: "Super Admin",
      role: Role.super_admin,
      is_verified: true,
      department: "Administration",
    },
  });

  const eventManager = await prisma.user.create({
    data: {
      email: "manager@clubhub.app",
      password_hash: passwordHash,
      name: "Alex Manager",
      role: Role.event_manager,
      is_verified: true,
      department: "Computer Science",
      enrollment_year: 2022,
      degree_type: DegreeType.bachelors,
    },
  });

  const secretary = await prisma.user.create({
    data: {
      email: "secretary@clubhub.app",
      password_hash: passwordHash,
      name: "Sam Secretary",
      role: Role.secretary,
      is_verified: true,
      department: "Electronics",
      enrollment_year: 2023,
      degree_type: DegreeType.bachelors,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: "student1@clubhub.app",
      password_hash: passwordHash,
      name: "Priya Sharma",
      role: Role.student,
      is_verified: true,
      department: "Computer Science",
      enrollment_year: 2023,
      degree_type: DegreeType.bachelors,
      total_points: 150,
      total_volunteer_hours: 8,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: "student2@clubhub.app",
      password_hash: passwordHash,
      name: "Rohan Mehta",
      role: Role.student,
      is_verified: true,
      department: "Mechanical Engineering",
      enrollment_year: 2024,
      degree_type: DegreeType.bachelors,
      total_points: 80,
      total_volunteer_hours: 3,
    },
  });

  console.log("✅ Created 5 users");

  // ── Clubs ──────────────────────────────────────────────────────────────────
  const techClub = await prisma.club.create({
    data: {
      name: "CodeCraft Society",
      slug: "codecraft-society",
      description: "Developers and designers who build, learn, and innovate together.",
      category: ClubCategory.technical,
      status: ClubStatus.approved,    // merged schema field
      member_count: 3,
      website_url: "https://codecraft.example.com",
      instagram_url: "https://instagram.com/codecraft",
      created_by: superAdmin.id,
      approved_by: superAdmin.id,
      approved_at: new Date(),
    },
  });

  const culturalClub = await prisma.club.create({
    data: {
      name: "Harmony Cultural Club",
      slug: "harmony-cultural",
      description: "Celebrating diversity through dance, music, drama, and art.",
      category: ClubCategory.cultural,
      status: ClubStatus.approved,
      member_count: 2,
      instagram_url: "https://instagram.com/harmonyculturalclub",
      created_by: superAdmin.id,
      approved_by: superAdmin.id,
      approved_at: new Date(),
    },
  });

  // Pending club — required for GET /admin/clubs/pending testing
  await prisma.club.create({
    data: {
      name: "Robotics Club",
      slug: "robotics-club",
      description: "Building the future, one robot at a time.",
      category: ClubCategory.technical,
      status: ClubStatus.pending,
      member_count: 0,
      created_by: student1.id,
    },
  });

  console.log("✅ Created 3 clubs (2 approved, 1 pending)");

  // ── Club Memberships ───────────────────────────────────────────────────────
  await prisma.userClub.createMany({
    data: [
      { user_id: eventManager.id, club_id: techClub.id,    role: ClubMemberRole.event_manager },
      { user_id: secretary.id,    club_id: techClub.id,    role: ClubMemberRole.secretary },
      { user_id: student1.id,     club_id: techClub.id,    role: ClubMemberRole.member },
      { user_id: student1.id,     club_id: culturalClub.id, role: ClubMemberRole.member },
      { user_id: student2.id,     club_id: culturalClub.id, role: ClubMemberRole.member },
    ],
  });

  console.log("✅ Created club memberships");

  // ── Community + Access Code (for Phase 1A core-join testing) ───────────────
  const techCommunity = await prisma.community.create({
    data: {
      club_id: techClub.id,
      name: "CodeCraft Core Team 2025",
      tenure_start: new Date("2025-01-01"),
      tenure_end: new Date("2025-12-31"),
      created_by: superAdmin.id,
    },
  });

  await prisma.communityAccessCode.create({
    data: {
      community_id: techCommunity.id,
      // SHA-256 of "CODECRAFT-2025-SEC" — plaintext printed below for Postman testing
      code_hash: "8e6b6e1a9c3f2d4b5a7e0c1f3d8b2e9a4c6f1d3b7e5a2c0f8d4b1e6a3c9f2d5b",
      assigned_role: ClubMemberRole.secretary,
      max_uses: 10,
    },
  });

  console.log("✅ Created community + access code");
  console.log("   Access code plaintext (for /auth/core-join testing): CODECRAFT-2025-SEC");

  // ── Events ─────────────────────────────────────────────────────────────────
  const hackathon = await prisma.event.create({
    data: {
      club_id: techClub.id,
      created_by: eventManager.id,
      title: "HackCraft 2025 — 24Hr Hackathon",
      description: "24-hour hackathon. Teams of 2-4. Prizes worth ₹50,000.",
      date: futureDate(14, 9),
      end_date: futureDate(15, 9),
      venue: "Main Auditorium, Block A",
      capacity: 200,
      registration_deadline: futureDate(12),
      event_type: EventType.hackathon,
      is_published: true,
      points_reward: 100,
      volunteer_hours: 24,
      tags: ["hackathon", "coding", "prize", "team"],
      qr_attendance_enabled: true,
      pin_attendance_enabled: true,
      registration_count: 2,
    },
  });

  const workshop = await prisma.event.create({
    data: {
      club_id: techClub.id,
      created_by: eventManager.id,
      title: "React 18 + TypeScript Workshop",
      description: "Hands-on workshop on React 18, custom hooks, Zustand, TypeScript.",
      date: futureDate(7, 10),
      end_date: futureDate(7, 13),
      venue: "Lab 204, CS Department",
      capacity: 40,
      registration_deadline: futureDate(6),
      event_type: EventType.workshop,
      is_published: true,
      points_reward: 30,
      volunteer_hours: 3,
      tags: ["react", "typescript", "frontend"],
      qr_attendance_enabled: true,
      pin_attendance_enabled: false,
      registration_count: 1,
    },
  });

  await prisma.event.create({
    data: {
      club_id: culturalClub.id,
      created_by: eventManager.id,
      title: "Annual Cultural Fest — Vividha 2025",
      description: "Dance, music, drama, art exhibitions, and food stalls.",
      date: futureDate(21, 16),
      end_date: futureDate(21, 21),
      venue: "College Grounds",
      capacity: 1000,
      registration_deadline: futureDate(19),
      event_type: EventType.cultural,
      is_published: true,
      points_reward: 50,
      volunteer_hours: 5,
      tags: ["cultural", "dance", "music", "fest"],
      qr_attendance_enabled: true,
      pin_attendance_enabled: false,
    },
  });

  // Draft event — required for is_published filter testing
  await prisma.event.create({
    data: {
      club_id: techClub.id,
      created_by: eventManager.id,
      title: "Open Source Contribution Drive (Draft)",
      description: "Learn Git workflow, PRs, and open source contribution.",
      date: futureDate(30, 11),
      venue: "Seminar Hall 1",
      capacity: 60,
      event_type: EventType.seminar,
      is_published: false,
      points_reward: 20,
      volunteer_hours: 2,
      tags: ["open-source", "git"],
    },
  });

  console.log("✅ Created 4 events (3 published, 1 draft)");

  // ── Event Registrations ────────────────────────────────────────────────────
  await prisma.eventRegistration.createMany({
    data: [
      { event_id: hackathon.id, user_id: student1.id, status: "registered" },
      { event_id: hackathon.id, user_id: student2.id, status: "registered" },
      { event_id: workshop.id,  user_id: student1.id, status: "registered" },
    ],
  });

  console.log("✅ Created event registrations");

  // ── Notifications ──────────────────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        user_id: student1.id,
        title: "Registration Confirmed 🎉",
        body: `You're registered for "${hackathon.title}"`,
        type: "event_registration",
        metadata: { event_id: hackathon.id },
      },
      {
        user_id: student1.id,
        title: "Registration Confirmed 🎉",
        body: `You're registered for "${workshop.title}"`,
        type: "event_registration",
        metadata: { event_id: workshop.id },
      },
      {
        user_id: student2.id,
        title: "Registration Confirmed 🎉",
        body: `You're registered for "${hackathon.title}"`,
        type: "event_registration",
        metadata: { event_id: hackathon.id },
      },
    ],
  });

  console.log("✅ Created notifications");

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n🌱 Seed complete!\n");
  console.log("📋 Test credentials (all passwords: Password123!):");
  console.log("   super_admin   → admin@clubhub.app");
  console.log("   event_manager → manager@clubhub.app");
  console.log("   secretary     → secretary@clubhub.app");
  console.log("   student       → student1@clubhub.app");
  console.log("   student       → student2@clubhub.app");
  console.log("\n🔑 Core-join test code: CODECRAFT-2025-SEC (secretary role, techClub)");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });