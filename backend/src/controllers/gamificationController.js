/**
 * Gamification Controller
 * Handles points, levels, badges, rewards, and leaderboard.
 */

const { prisma } = require('../config/prisma');

// ─── Level Thresholds ──────────────────────────────────────
const LEVELS = [
  { level: 1, name: 'Newcomer', minPoints: 0, maxPoints: 99 },
  { level: 2, name: 'Explorer', minPoints: 100, maxPoints: 299 },
  { level: 3, name: 'Achiever', minPoints: 300, maxPoints: 599 },
  { level: 4, name: 'Expert', minPoints: 600, maxPoints: 999 },
  { level: 5, name: 'Master', minPoints: 1000, maxPoints: Infinity },
];

// ─── Point Values ──────────────────────────────────────────
const POINT_VALUES = {
  ENROLL: 10,
  COMPLETE_LESSON: 5,
  COMPLETE_COURSE: 50,
  REVIEW: 15,
  DAILY_LOGIN: 5,
};

// ─── Helper: Get or create user gamification record ────────
async function getOrCreateGamification(userId) {
  let record = await prisma.userGamification.findUnique({
    where: { userId },
  });

  if (!record) {
    record = await prisma.userGamification.create({
      data: { userId },
    });
  }

  return record;
}

// ─── Helper: Calculate level from points ───────────────────
function calculateLevel(points) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (points >= LEVELS[i].minPoints) {
      return LEVELS[i].level;
    }
  }
  return 1;
}

// ─── Helper: Get level info ────────────────────────────────
function getLevelInfo(points) {
  const level = calculateLevel(points);
  const info = LEVELS.find(l => l.level === level);
  const nextLevel = LEVELS.find(l => l.level === level + 1);
  return {
    level,
    name: info.name,
    minPoints: info.minPoints,
    maxPoints: info.maxPoints === Infinity ? null : info.maxPoints,
    pointsToNextLevel: nextLevel ? nextLevel.minPoints - points : null,
    nextLevelName: nextLevel ? nextLevel.name : null,
  };
}

// ─── Helper: Check and award badges ────────────────────────
async function checkAndAwardBadges(userId) {
  const gamification = await getOrCreateGamification(userId);
  const earnedBadges = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeId: true },
  });
  const earnedBadgeIds = new Set(earnedBadges.map(b => b.badgeId));

  // Count user actions
  const actionCounts = await prisma.pointTransaction.groupBy({
    by: ['action'],
    where: { userId },
    _count: { action: true },
  });
  const counts = {};
  actionCounts.forEach(a => { counts[a.action] = a._count.action; });

  // Find eligible badges not yet earned
  const eligibleBadges = await prisma.badge.findMany({
    where: {
      actionType: { not: null },
      requirement: { gt: 0 },
    },
  });

  const newBadges = [];
  for (const badge of eligibleBadges) {
    if (earnedBadgeIds.has(badge.id)) continue;
    const userCount = counts[badge.actionType] || 0;
    if (userCount >= badge.requirement) {
      const userBadge = await prisma.userBadge.create({
        data: { userId, badgeId: badge.id },
        include: { badge: true },
      });
      newBadges.push(userBadge);
    }
  }

  return newBadges;
}

// ─── AWARD POINTS ──────────────────────────────────────────
async function awardPoints(req, res) {
  try {
    const { action, description, referenceId } = req.body;
    const userId = req.user.userId;

    // Validate action
    if (!action || !POINT_VALUES[action]) {
      return res.status(400).json({
        success: false, statusCode: 400, error: 'BAD_REQUEST',
        message: `Invalid action. Valid actions: ${Object.keys(POINT_VALUES).join(', ')}.`,
      });
    }

    const points = POINT_VALUES[action];

    // Create point transaction
    const transaction = await prisma.pointTransaction.create({
      data: {
        userId,
        points,
        action,
        description: description || `Earned ${points} points for ${action}`,
        referenceId: referenceId || null,
      },
    });

    // Update or create gamification record
    const gamification = await getOrCreateGamification(userId);
    const newTotal = gamification.totalPoints + points;
    const newLevel = calculateLevel(newTotal);
    const leveledUp = newLevel > gamification.currentLevel;

    const updated = await prisma.userGamification.update({
      where: { userId },
      data: {
        totalPoints: newTotal,
        currentLevel: newLevel,
      },
    });

    // Check for new badges
    const newBadges = await checkAndAwardBadges(userId);

    return res.status(200).json({
      success: true, statusCode: 200,
      message: `Awarded ${points} points for ${action}.`,
      data: {
        transaction,
        totalPoints: updated.totalPoints,
        currentLevel: updated.currentLevel,
        leveledUp,
        newBadges: newBadges.map(b => ({
          id: b.id,
          badge: { id: b.badge.id, name: b.badge.name, description: b.badge.description, iconUrl: b.badge.iconUrl },
        })),
      },
    });
  } catch (error) {
    console.error('[AWARD POINTS ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to award points.',
    });
  }
}

// ─── GET USER POINTS ───────────────────────────────────────
async function getUserPoints(req, res) {
  try {
    const userId = req.user.userId;
    const gamification = await getOrCreateGamification(userId);

    // Get recent transactions
    const recentTransactions = await prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'User points retrieved.',
      data: {
        totalPoints: gamification.totalPoints,
        currentLevel: gamification.currentLevel,
        loginStreak: gamification.loginStreak,
        lastLoginDate: gamification.lastLoginDate,
        levelInfo: getLevelInfo(gamification.totalPoints),
        recentTransactions,
      },
    });
  } catch (error) {
    console.error('[GET USER POINTS ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve user points.',
    });
  }
}

// ─── GET USER LEVEL ────────────────────────────────────────
async function getUserLevel(req, res) {
  try {
    const userId = req.user.userId;
    const gamification = await getOrCreateGamification(userId);
    const levelInfo = getLevelInfo(gamification.totalPoints);

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'User level retrieved.',
      data: {
        currentLevel: gamification.currentLevel,
        totalPoints: gamification.totalPoints,
        ...levelInfo,
      },
    });
  } catch (error) {
    console.error('[GET USER LEVEL ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve user level.',
    });
  }
}

// ─── GET LEADERBOARD ───────────────────────────────────────
async function getLeaderboard(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const clampedLimit = Math.min(Math.max(limit, 1), 100);

    const leaderboard = await prisma.userGamification.findMany({
      orderBy: { totalPoints: 'desc' },
      take: clampedLimit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
            role: true,
          },
        },
      },
    });

    const ranked = leaderboard.map((entry, index) => ({
      rank: index + 1,
      userId: entry.userId,
      fullName: entry.user.fullName,
      avatarUrl: entry.user.avatarUrl,
      role: entry.user.role,
      totalPoints: entry.totalPoints,
      currentLevel: entry.currentLevel,
      levelName: getLevelInfo(entry.totalPoints).name,
    }));

    // If user is authenticated, find their rank
    let userRank = null;
    if (req.user) {
      const allAbove = await prisma.userGamification.count({
        where: { totalPoints: { gt: 0 } },
        orderBy: { totalPoints: 'desc' },
      });
      const userEntry = await prisma.userGamification.findUnique({
        where: { userId: req.user.userId },
      });
      if (userEntry && userEntry.totalPoints > 0) {
        const rank = await prisma.userGamification.count({
          where: { totalPoints: { gt: userEntry.totalPoints } },
        });
        userRank = {
          rank: rank + 1,
          totalPoints: userEntry.totalPoints,
          currentLevel: userEntry.currentLevel,
          levelName: getLevelInfo(userEntry.totalPoints).name,
        };
      }
    }

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Leaderboard retrieved.',
      data: {
        leaderboard: ranked,
        userRank,
      },
    });
  } catch (error) {
    console.error('[GET LEADERBOARD ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve leaderboard.',
    });
  }
}

// ─── CHECK AND LEVEL UP ────────────────────────────────────
async function checkAndLevelUp(req, res) {
  try {
    const userId = req.user.userId;
    const gamification = await getOrCreateGamification(userId);
    const currentLevel = calculateLevel(gamification.totalPoints);
    const leveledUp = currentLevel > gamification.currentLevel;

    if (leveledUp) {
      await prisma.userGamification.update({
        where: { userId },
        data: { currentLevel },
      });
    }

    const levelInfo = getLevelInfo(gamification.totalPoints);

    return res.status(200).json({
      success: true, statusCode: 200,
      message: leveledUp ? `Level up! You are now level ${currentLevel} (${levelInfo.name}).` : 'No level change.',
      data: {
        currentLevel,
        leveledUp,
        totalPoints: gamification.totalPoints,
        ...levelInfo,
      },
    });
  } catch (error) {
    console.error('[CHECK LEVEL UP ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to check level.',
    });
  }
}

// ─── GET REWARDS ───────────────────────────────────────────
async function getRewards(req, res) {
  try {
    const userId = req.user.userId;
    const gamification = await getOrCreateGamification(userId);

    // Get all active rewards
    const rewards = await prisma.reward.findMany({
      where: { active: true },
      orderBy: { unlockLevel: 'asc' },
    });

    // Get user's claimed rewards
    const claimed = await prisma.claimedReward.findMany({
      where: { userId },
      select: { rewardId: true, status: true },
    });
    const claimedMap = new Map(claimed.map(c => [c.rewardId, c.status]));

    const rewardsWithStatus = rewards.map(reward => ({
      id: reward.id,
      name: reward.name,
      description: reward.description,
      type: reward.type,
      pointsCost: reward.pointsCost,
      unlockLevel: reward.unlockLevel,
      couponCode: claimedMap.has(reward.id) ? reward.couponCode : null,
      discountPercent: reward.discountPercent,
      unlocked: gamification.currentLevel >= reward.unlockLevel,
      claimed: claimedMap.has(reward.id),
      claimStatus: claimedMap.get(reward.id) || null,
    }));

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Rewards retrieved.',
      data: {
        currentLevel: gamification.currentLevel,
        totalPoints: gamification.totalPoints,
        rewards: rewardsWithStatus,
      },
    });
  } catch (error) {
    console.error('[GET REWARDS ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve rewards.',
    });
  }
}

// ─── CLAIM REWARD ──────────────────────────────────────────
async function claimReward(req, res) {
  try {
    const { rewardId } = req.body;
    const userId = req.user.userId;

    if (!rewardId) {
      return res.status(400).json({
        success: false, statusCode: 400, error: 'BAD_REQUEST',
        message: 'rewardId is required.',
      });
    }

    const reward = await prisma.reward.findUnique({
      where: { id: rewardId },
    });

    if (!reward || !reward.active) {
      return res.status(404).json({
        success: false, statusCode: 404, error: 'NOT_FOUND',
        message: 'Reward not found.',
      });
    }

    // Check if already claimed
    const existingClaim = await prisma.claimedReward.findUnique({
      where: { userId_rewardId: { userId, rewardId } },
    });
    if (existingClaim) {
      return res.status(400).json({
        success: false, statusCode: 400, error: 'BAD_REQUEST',
        message: 'Reward already claimed.',
      });
    }

    const gamification = await getOrCreateGamification(userId);

    // Check level requirement
    if (gamification.currentLevel < reward.unlockLevel) {
      return res.status(403).json({
        success: false, statusCode: 403, error: 'FORBIDDEN',
        message: `You need to reach level ${reward.unlockLevel} to claim this reward.`,
      });
    }

    // Check points cost
    if (reward.pointsCost > 0 && gamification.totalPoints < reward.pointsCost) {
      return res.status(400).json({
        success: false, statusCode: 400, error: 'BAD_REQUEST',
        message: `You need ${reward.pointsCost} points to claim this reward. You have ${gamification.totalPoints}.`,
      });
    }

    // Deduct points if cost > 0
    if (reward.pointsCost > 0) {
      await prisma.pointTransaction.create({
        data: {
          userId,
          points: -reward.pointsCost,
          action: 'REWARD_CLAIM',
          description: `Spent ${reward.pointsCost} points on reward: ${reward.name}`,
          referenceId: rewardId,
        },
      });

      await prisma.userGamification.update({
        where: { userId },
        data: { totalPoints: gamification.totalPoints - reward.pointsCost },
      });
    }

    // Create claimed reward record
    const claimed = await prisma.claimedReward.create({
      data: {
        userId,
        rewardId,
        pointsSpent: reward.pointsCost,
      },
      include: { reward: true },
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: `Reward "${reward.name}" claimed successfully!`,
      data: {
        id: claimed.id,
        reward: {
          id: claimed.reward.id,
          name: claimed.reward.name,
          description: claimed.reward.description,
          type: claimed.reward.type,
          couponCode: claimed.reward.couponCode,
          discountPercent: claimed.reward.discountPercent,
        },
        pointsSpent: claimed.pointsSpent,
        claimedAt: claimed.claimedAt,
        status: claimed.status,
      },
    });
  } catch (error) {
    console.error('[CLAIM REWARD ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to claim reward.',
    });
  }
}

// ─── GET USER BADGES ───────────────────────────────────────
async function getUserBadges(req, res) {
  try {
    const userId = req.user.userId;

    const badges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    // Get all badges to show locked ones
    const allBadges = await prisma.badge.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const earnedIds = new Set(badges.map(b => b.badgeId));
    const allBadgesWithStatus = allBadges.map(badge => {
      const earned = badges.find(ub => ub.badgeId === badge.id);
      return {
        id: badge.id,
        name: badge.name,
        description: badge.description,
        iconUrl: badge.iconUrl,
        category: badge.category,
        requirement: badge.requirement,
        actionType: badge.actionType,
        earned: earnedIds.has(badge.id),
        earnedAt: earned ? earned.earnedAt : null,
      };
    });

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Badges retrieved.',
      data: {
        earned: badges.map(ub => ({
          id: ub.id,
          badge: {
            id: ub.badge.id,
            name: ub.badge.name,
            description: ub.badge.description,
            iconUrl: ub.badge.iconUrl,
            category: ub.badge.category,
          },
          earnedAt: ub.earnedAt,
        })),
        all: allBadgesWithStatus,
        earnedCount: badges.length,
        totalCount: allBadges.length,
      },
    });
  } catch (error) {
    console.error('[GET USER BADGES ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve badges.',
    });
  }
}

// ─── TRACK DAILY LOGIN ─────────────────────────────────────
async function trackDailyLogin(req, res) {
  try {
    const userId = req.user.userId;
    const gamification = await getOrCreateGamification(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastLogin = gamification.lastLoginDate
      ? new Date(gamification.lastLoginDate)
      : null;

    let newStreak = gamification.loginStreak;
    let awarded = false;

    if (lastLogin) {
      const lastLoginDay = new Date(lastLogin);
      lastLoginDay.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((today - lastLoginDay) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        // Already logged in today, no points
        return res.status(200).json({
          success: true, statusCode: 200,
          message: 'Already logged in today.',
          data: {
            loginStreak: gamification.loginStreak,
            pointsAwarded: 0,
            totalPoints: gamification.totalPoints,
          },
        });
      } else if (diffDays === 1) {
        // Consecutive day
        newStreak = gamification.loginStreak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    // Award daily login points
    const points = POINT_VALUES.DAILY_LOGIN;
    await prisma.pointTransaction.create({
      data: {
        userId,
        points,
        action: 'DAILY_LOGIN',
        description: `Daily login streak: ${newStreak} day(s)`,
      },
    });

    const newTotal = gamification.totalPoints + points;
    const newLevel = calculateLevel(newTotal);
    const leveledUp = newLevel > gamification.currentLevel;

    const updated = await prisma.userGamification.update({
      where: { userId },
      data: {
        totalPoints: newTotal,
        currentLevel: newLevel,
        loginStreak: newStreak,
        lastLoginDate: new Date(),
      },
    });

    // Check for new badges
    const newBadges = await checkAndAwardBadges(userId);

    return res.status(200).json({
      success: true, statusCode: 200,
      message: `Daily login recorded. +${points} points!`,
      data: {
        loginStreak: updated.loginStreak,
        pointsAwarded: points,
        totalPoints: updated.totalPoints,
        currentLevel: updated.currentLevel,
        leveledUp,
        newBadges: newBadges.map(b => ({
          id: b.id,
          badge: { id: b.badge.id, name: b.badge.name, description: b.badge.description, iconUrl: b.badge.iconUrl },
        })),
      },
    });
  } catch (error) {
    console.error('[TRACK DAILY LOGIN ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to track daily login.',
    });
  }
}

// ─── SEED DEFAULT REWARDS AND BADGES ───────────────────────
async function seedDefaults(req, res) {
  try {
    // Seed default badges
    const defaultBadges = [
      { name: 'First Steps', description: 'Enroll in your first course', iconUrl: null, category: 'MILESTONE', requirement: 1, actionType: 'ENROLL' },
      { name: 'Course Collector', description: 'Enroll in 5 courses', iconUrl: null, category: 'MILESTONE', requirement: 5, actionType: 'ENROLL' },
      { name: 'Knowledge Seeker', description: 'Complete 10 lessons', iconUrl: null, category: 'ACHIEVEMENT', requirement: 10, actionType: 'COMPLETE_LESSON' },
      { name: 'Course Finisher', description: 'Complete an entire course', iconUrl: null, category: 'MILESTONE', requirement: 1, actionType: 'COMPLETE_COURSE' },
      { name: 'Critic', description: 'Leave 3 reviews', iconUrl: null, category: 'ACHIEVEMENT', requirement: 3, actionType: 'REVIEW' },
      { name: 'Consistent Learner', description: 'Log in 7 days in a row', iconUrl: null, category: 'STREAK', requirement: 7, actionType: 'DAILY_LOGIN' },
    ];

    for (const badge of defaultBadges) {
      await prisma.badge.upsert({
        where: { name: badge.name },
        update: {},
        create: badge,
      });
    }

    // Seed default rewards
    const defaultRewards = [
      { name: '10% Discount Coupon', description: 'Get 10% off your next course purchase', type: 'DISCOUNT_COUPON', pointsCost: 50, unlockLevel: 2, couponCode: 'EXPLORER10', discountPercent: 10 },
      { name: 'Exclusive Explorer Badge', description: 'Unlock the exclusive Explorer badge for your profile', type: 'EXCLUSIVE_BADGE', pointsCost: 100, unlockLevel: 3, couponCode: null, discountPercent: null },
      { name: '20% Discount Coupon', description: 'Get 20% off your next course purchase', type: 'DISCOUNT_COUPON', pointsCost: 150, unlockLevel: 3, couponCode: 'ACHIEVER20', discountPercent: 20 },
      { name: 'Early Access Pass', description: 'Get early access to new courses before they are published', type: 'EARLY_ACCESS', pointsCost: 200, unlockLevel: 4, couponCode: null, discountPercent: null },
      { name: 'Master\'s 30% Discount', description: 'Get 30% off any course purchase', type: 'DISCOUNT_COUPON', pointsCost: 300, unlockLevel: 5, couponCode: 'MASTER30', discountPercent: 30 },
      { name: 'Master Early Access', description: 'Lifetime early access to all new courses', type: 'EARLY_ACCESS', pointsCost: 0, unlockLevel: 5, couponCode: null, discountPercent: null },
    ];

    for (const reward of defaultRewards) {
      const existing = await prisma.reward.findFirst({
        where: { name: reward.name },
      });
      if (!existing) {
        await prisma.reward.create({ data: reward });
      }
    }

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'Default badges and rewards seeded.',
      data: {
        badgesSeeded: defaultBadges.length,
        rewardsSeeded: defaultRewards.length,
      },
    });
  } catch (error) {
    console.error('[SEED DEFAULTS ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to seed defaults.',
    });
  }
}

module.exports = {
  awardPoints,
  getUserPoints,
  getUserLevel,
  getUserStats,
  getLeaderboard,
  checkAndLevelUp,
  getRewards,
  claimReward,
  getUserBadges,
  trackDailyLogin,
  seedDefaults,
};

// ─── Combined Stats (/me) ──────────────────────────────────
async function getUserStats(req, res) {
  try {
    const userId = req.user.userId;
    const pointsData = await prisma.userGamification.findUnique({ where: { userId } });
    const totalPoints = pointsData?.totalPoints || 0;

    const transactions = await prisma.pointTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const userBadges = await prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
    });

    // Determine level
    let levelName = 'Newcomer';
    let level = 1;
    if (totalPoints >= 1000) { levelName = 'Master'; level = 5; }
    else if (totalPoints >= 600) { levelName = 'Expert'; level = 4; }
    else if (totalPoints >= 300) { levelName = 'Achiever'; level = 3; }
    else if (totalPoints >= 100) { levelName = 'Explorer'; level = 2; }

    return res.status(200).json({
      success: true, statusCode: 200,
      message: 'User gamification stats retrieved.',
      data: {
        totalPoints,
        currentLevel: level,
        level: levelName,
        loginStreak: pointsData?.loginStreak || 0,
        lastLoginDate: pointsData?.lastLoginDate || null,
        badges: userBadges.map(ub => ub.badge),
        recentTransactions: transactions,
      },
    });
  } catch (error) {
    console.error('[GET USER STATS ERROR]', error.message);
    return res.status(500).json({
      success: false, statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve user stats.',
    });
  }
}
