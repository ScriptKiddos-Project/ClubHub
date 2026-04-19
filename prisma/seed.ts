// prisma/seed.ts
import { PrismaClient, Role, DegreeType, EventType, ClubStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── 1. Create Super Admin ──────────────────────────────────────────────────
  const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@clubhub.edu' },
    update: {},
    create: {
      email: 'superadmin@clubhub.edu',
      password_hash: superAdminPassword,
      name: 'Super Admin',
      role: Role.super_admin,
      is_verified: true,
      department: 'Administration',
      enrollment_year: 2020,
      degree_type: DegreeType.bachelors,
    },
  });

  // ── 2. Create Club Admin ───────────────────────────────────────────────────
  const clubAdminPassword = await bcrypt.hash('ClubAdmin@123', 12);
  const clubAdmin = await prisma.user.upsert({
    where: { email: 'clubadmin@clubhub.edu' },
    update: {},
    create: {
      email: 'clubadmin@clubhub.edu',
      password_hash: clubAdminPassword,
      name: 'John Doe',
      role: Role.club_admin,
      is_verified: true,
      department: 'Computer Science',
      enrollment_year: 2022,
      degree_type: DegreeType.bachelors,
    },
  });

  // ── 3. Create Student ──────────────────────────────────────────────────────
  const studentPassword = await bcrypt.hash('Student@123', 12);
  const student = await prisma.user.upsert({
    where: { email: 'student@clubhub.edu' },
    update: {},
    create: {
      email: 'student@clubhub.edu',
      password_hash: studentPassword,
      name: 'Jane Smith',
      role: Role.student,
      is_verified: true,
      department: 'Electronics',
      enrollment_year: 2023,
      degree_type: DegreeType.bachelors,
    },
  });

  // ── 4. Create Clubs ────────────────────────────────────────────────────────
  const techClub = await prisma.club.upsert({
    where: { slug: 'tech-innovators' },
    update: {},
    create: {
      name: 'Tech Innovators',
      slug: 'tech-innovators',
      description: 'A club for technology enthusiasts and innovators.',
      category: 'Technology',
      status: ClubStatus.approved,
      member_count: 2,
      created_by: clubAdmin.id,
      approved_by: superAdmin.id,
      approved_at: new Date(),
    },
  });

  const cultureClub = await prisma.club.upsert({
    where: { slug: 'cultural-society' },
    update: {},
    create: {
      name: 'Cultural Society',
      slug: 'cultural-society',
      description: 'Celebrating diversity through arts, culture, and heritage.',
      category: 'Cultural',
      status: ClubStatus.approved,
      member_count: 1,
      created_by: superAdmin.id,
      approved_by: superAdmin.id,
      approved_at: new Date(),
    },
  });

  // ── 5. Add Memberships ─────────────────────────────────────────────────────
  await prisma.userClub.upsert({
    where: { user_id_club_id: { user_id: clubAdmin.id, club_id: techClub.id } },
    update: {},
    create: {
      user_id: clubAdmin.id,
      club_id: techClub.id,
      role: Role.club_admin,
    },
  });

  await prisma.userClub.upsert({
    where: { user_id_club_id: { user_id: student.id, club_id: techClub.id } },
    update: {},
    create: {
      user_id: student.id,
      club_id: techClub.id,
      role: Role.member,
    },
  });

  await prisma.userClub.upsert({
    where: { user_id_club_id: { user_id: student.id, club_id: cultureClub.id } },
    update: {},
    create: {
      user_id: student.id,
      club_id: cultureClub.id,
      role: Role.member,
    },
  });

  // ── 6. Create Events ───────────────────────────────────────────────────────
  const event1 = await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      club_id: techClub.id,
      title: 'Web Dev Bootcamp',
      description: 'A full-day bootcamp covering React, Node.js, and PostgreSQL.',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      venue: 'Seminar Hall A',
      capacity: 50,
      event_type: EventType.workshop,
      points_reward: 10,
      volunteer_hours: 6,
      is_published: true,
      tags: ['react', 'nodejs', 'web'],
      created_by: clubAdmin.id,
    },
  });

  const event2 = await prisma.event.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      club_id: cultureClub.id,
      title: 'Annual Cultural Fest',
      description: 'Annual celebration of arts and culture across departments.',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      venue: 'Main Auditorium',
      capacity: 200,
      event_type: EventType.cultural,
      points_reward: 15,
      volunteer_hours: 8,
      is_published: true,
      tags: ['culture', 'arts', 'fest'],
      created_by: superAdmin.id,
    },
  });

  console.log('✅ Seed completed!');
  console.log('\n📋 Test Credentials:');
  console.log('  Super Admin  → superadmin@clubhub.edu / SuperAdmin@123');
  console.log('  Club Admin   → clubadmin@clubhub.edu  / ClubAdmin@123');
  console.log('  Student      → student@clubhub.edu    / Student@123');
  console.log(`\n📌 Created clubs: ${techClub.name}, ${cultureClub.name}`);
  console.log(`📌 Created events: ${event1.title}, ${event2.title}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
