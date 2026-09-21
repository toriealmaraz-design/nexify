/**
 * Nexify Database Seed Script
 * Populates initial system assets and an admin user for development.
 *
 * Run: npx prisma db seed
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
  console.log('[SEED] Starting database seed...');

  // ── Create default admin user ──
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexify.app' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: 'admin@nexify.app',
      passwordHash: adminPasswordHash,
      fullName: 'System Administrator',
      role: 'ADMIN',
      phone: '+233200000000',
    },
  });
  console.log(`[SEED] Admin user: ${admin.email} / admin123`);

  // ── Create sample creator ──
  const creatorPasswordHash = await bcrypt.hash('creator123', 10);
  const creator = await prisma.user.upsert({
    where: { email: 'creator@nexify.app' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: 'creator@nexify.app',
      passwordHash: creatorPasswordHash,
      fullName: 'Kofi Mensah',
      role: 'CREATOR',
      phone: '+233201234567',
    },
  });
  console.log(`[SEED] Creator user: ${creator.email} / creator123`);

  // ── Create sample affiliate ──
  const affiliatePasswordHash = await bcrypt.hash('affiliate123', 10);
  const affiliate = await prisma.user.upsert({
    where: { email: 'affiliate@nexify.app' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: 'affiliate@nexify.app',
      passwordHash: affiliatePasswordHash,
      fullName: 'Kwame Appiah',
      role: 'AFFILIATE',
      phone: '+233209876543',
    },
  });
  console.log(`[SEED] Affiliate user: ${affiliate.email} / affiliate123`);

  // ── Create sample student ──
  const studentPasswordHash = await bcrypt.hash('student123', 10);
  const student = await prisma.user.upsert({
    where: { email: 'student@nexify.app' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      email: 'student@nexify.app',
      passwordHash: studentPasswordHash,
      fullName: 'Ama Osei',
      role: 'STUDENT',
      phone: '+233205555555',
    },
  });
  console.log(`[SEED] Student user: ${student.email} / student123`);

  // ── Create sample course (DIGITAL) ──
  const course1 = await prisma.course.upsert({
    where: { slug: 'mastering-digital-marketing-ghana' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      creatorId: creator.id,
      title: 'Mastering Digital Marketing in Ghana',
      slug: 'mastering-digital-marketing-ghana',
      description: 'Comprehensive course on social media ads, SEO, and local marketing strategies for the Ghanaian market.',
      type: 'DIGITAL',
      status: 'PUBLISHED',
      priceGhs: 250.00,
      affiliateRate: 0.30,
      teaserUrl: 'https://cdn.nexify.app/trailers/digital-marketing.mp4',
      hasOrderBump: true,
      orderBumpTitle: 'Include VIP Copywriting Swipe Files',
      orderBumpPriceGhs: 35.00,
    },
  });
  console.log(`[SEED] Course: ${course1.title}`);

  // ── Create sample course (IN_PERSON_LAB) ──
  const course2 = await prisma.course.upsert({
    where: { slug: 'high-ticket-physical-sales-intensive' },
    update: {},
    create: {
      id: crypto.randomUUID(),
      creatorId: creator.id,
      title: 'High-Ticket Physical Sales Intensive',
      slug: 'high-ticket-physical-sales-intensive',
      description: '3-Day physical workshop in Accra covering direct sales strategy, closing techniques, and MoMo payment integration.',
      type: 'IN_PERSON_LAB',
      status: 'PUBLISHED',
      priceGhs: 800.00,
      affiliateRate: 0.25,
      teaserUrl: 'https://cdn.nexify.app/trailers/sales-intensive.mp4',
      hasOrderBump: true,
      orderBumpTitle: 'Add 1-on-1 Direct Consulting Call',
      orderBumpPriceGhs: 150.00,
      maxSeats: 30,
      bookedSeats: 22,
      venueLocation: 'Accra Digital Center, Ring Road West, Accra',
      labDates: 'October 15 - October 17, 2026',
      depositGhs: 200.00,
      balanceDueDays: 7,
    },
  });
  console.log(`[SEED] Course: ${course2.title}`);

  // ── Create module + lessons for course 1 ──
  const module1 = await prisma.module.create({
    data: {
      id: crypto.randomUUID(),
      courseId: course1.id,
      title: 'Module 1: Foundations of West African E-Commerce',
      orderIndex: 1,
    },
  });

  await prisma.lesson.createMany({
    data: [
      {
        id: crypto.randomUUID(),
        moduleId: module1.id,
        title: 'Lesson 1.1: Understanding Mobile Money Consumer Behavior',
        videoUrl: 'https://cdn.nexify.app/lessons/momo-behavior.mp4',
        content: '### Key Lecture Notes\n\nMobile Money accounts for over **80%** of online payments in Ghana. Understanding consumer behavior around MoMo is critical for any digital marketer.',
        orderIndex: 1,
        isFreePreview: true,
      },
      {
        id: crypto.randomUUID(),
        moduleId: module1.id,
        title: 'Lesson 1.2: The Ghanaian Digital Consumer Profile',
        videoUrl: 'https://cdn.nexify.app/lessons/consumer-profile.mp4',
        content: '### Lecture Notes\n\nGhana\'s digital consumer is mobile-first, social-media-engaged, and increasingly comfortable with online payments. This lesson explores demographics, spending patterns, and trust factors.',
        orderIndex: 2,
        isFreePreview: false,
      },
    ],
  });
  console.log(`[SEED] Module + 2 lessons created for ${course1.title}`);

  // ── Create affiliate link ──
  const affLink = await prisma.affiliateLink.create({
    data: {
      id: crypto.randomUUID(),
      affiliateId: affiliate.id,
      courseId: course1.id,
      affiliateCode: 'AFF-KWAME-77',
      clickCount: 342,
    },
  });
  console.log(`[SEED] Affiliate link: ${affLink.affiliateCode}`);

  // ── Create system assets ──
  const systemAssets = [
    { key: 'LOGO_MAIN', fileUrl: '/assets/branding/logo-main.svg', mimeType: 'image/svg+xml' },
    { key: 'LOGO_MAIN_LIGHT', fileUrl: '/assets/branding/logo-main-light.svg', mimeType: 'image/svg+xml' },
    { key: 'LOGO_NEXA', fileUrl: '/assets/branding/logo-nexa.svg', mimeType: 'image/svg+xml' },
    { key: 'PLACEHOLDER_COURSE', fileUrl: '/assets/branding/placeholder-course.jpg', mimeType: 'image/jpeg' },
    { key: 'PLACEHOLDER_AVATAR', fileUrl: '/assets/branding/placeholder-avatar.png', mimeType: 'image/png' },
  ];

  for (const asset of systemAssets) {
    await prisma.systemAsset.upsert({
      where: { key: asset.key },
      update: {},
      create: {
        id: crypto.randomUUID(),
        ...asset,
      },
    });
  }
  console.log(`[SEED] ${systemAssets.length} system assets seeded`);

  console.log('[SEED] Database seeding complete!');
}

main()
  .catch((e) => {
    console.error('[SEED ERROR]', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
