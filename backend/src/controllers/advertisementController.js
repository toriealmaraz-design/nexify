/**
 * Advertisement Controller
 * CRUD + seed for advertisements.
 */

const { prisma } = require('../config/prisma');

// GET /api/v1/advertisements — public, list active ads
async function listAds(req, res) {
  try {
    const { placement } = req.query;
    const now = new Date();

    const where = {
      active: true,
      ...(placement && { placement }),
      // Only ads within their date window (if set)
      ...{
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
      },
    };

    // Filter out expired ads manually
    const ads = await prisma.advertisement.findMany({
      where: {
        active: true,
        ...(placement && { placement }),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    const filtered = ads.filter(ad => {
      if (ad.startDate && ad.startDate > now) return false;
      if (ad.endDate && ad.endDate < now) return false;
      return true;
    });

    return res.status(200).json({ success: true, statusCode: 200, message: 'Ads retrieved.', data: filtered });
  } catch (error) {
    console.error('[AD LIST ERROR]', error.message);
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// POST /api/v1/advertisements — admin only
async function createAd(req, res) {
  try {
    const { title, body, imageUrl, linkUrl, ctaText, placement, targetRoles, priority, active, startDate, endDate } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'title is required.' });
    }

    const ad = await prisma.advertisement.create({
      data: {
        title,
        body: body || null,
        imageUrl: imageUrl || null,
        linkUrl: linkUrl || null,
        ctaText: ctaText || 'Learn More',
        placement: placement || 'LANDING_BANNER',
        targetRoles: targetRoles || '',
        priority: priority || 0,
        active: active !== false,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });
    return res.status(201).json({ success: true, statusCode: 201, message: 'Ad created.', data: ad });
  } catch (error) {
    console.error('[AD CREATE ERROR]', error.message);
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// PUT /api/v1/advertisements/:id — admin only
async function updateAd(req, res) {
  try {
    const { id } = req.params;
    const { title, body, imageUrl, linkUrl, ctaText, placement, targetRoles, priority, active, startDate, endDate } = req.body;

    const existing = await prisma.advertisement.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, statusCode: 404, message: 'Ad not found.' });
    }

    const updated = await prisma.advertisement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(body !== undefined && { body }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(linkUrl !== undefined && { linkUrl }),
        ...(ctaText !== undefined && { ctaText }),
        ...(placement !== undefined && { placement }),
        ...(targetRoles !== undefined && { targetRoles }),
        ...(priority !== undefined && { priority }),
        ...(active !== undefined && { active }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    });
    return res.status(200).json({ success: true, statusCode: 200, message: 'Ad updated.', data: updated });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, statusCode: 404, message: 'Ad not found.' });
    console.error('[AD UPDATE ERROR]', error.message);
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// DELETE /api/v1/advertisements/:id — admin only
async function deleteAd(req, res) {
  try {
    const { id } = req.params;
    await prisma.advertisement.delete({ where: { id } });
    return res.status(200).json({ success: true, statusCode: 200, message: 'Ad deleted.' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, statusCode: 404, message: 'Ad not found.' });
    console.error('[AD DELETE ERROR]', error.message);
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// POST /api/v1/advertisements/seed — admin only, creates 3 sample ads
async function seedAds(req, res) {
  try {
    const defaults = [
      {
        title: 'Master Mobile Photography',
        body: 'Learn to capture stunning photos with your smartphone. Perfect for creators and small business owners.',
        imageUrl: null,
        linkUrl: '/courses/mobile-photography',
        ctaText: 'Enroll Now',
        placement: 'LANDING_HERO',
        targetRoles: '',
        priority: 100,
        active: true,
      },
      {
        title: 'Start Earning as an Affiliate',
        body: 'Promote courses you love and earn up to 30% commission on every sale. No following required.',
        imageUrl: null,
        linkUrl: '/affiliate',
        ctaText: 'Become an Affiliate',
        placement: 'LANDING_BANNER',
        targetRoles: '',
        priority: 90,
        active: true,
      },
      {
        title: 'Create & Sell Your First Course',
        body: 'Share your expertise with thousands of learners across Ghana and West Africa. Approval in 24 hours.',
        imageUrl: null,
        linkUrl: '/creator/start',
        ctaText: 'Start Creating',
        placement: 'SIDEBAR',
        targetRoles: 'CREATOR',
        priority: 80,
        active: true,
      },
    ];

    const results = [];
    for (const d of defaults) {
      const created = await prisma.advertisement.create({ data: d });
      results.push(created.id);
    }

    return res.status(201).json({ success: true, statusCode: 201, message: 'Seed complete.', data: { seeded: results } });
  } catch (error) {
    console.error('[AD SEED ERROR]', error.message);
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

module.exports = { listAds, createAd, updateAd, deleteAd, seedAds };
