/**
 * Nexa Controller
 * Role-scoped conversational AI — reads system context from DB and responds.
 *
 * Architecture:
 * 1. ALWAYS try keyword-matched ChatbotReply first (reads from system, no network)
 * 2. If a LLM config is enabled, optionally enhance the response via OpenAI-compatible API
 * 3. No "online/offline" concept — Nexa is always available via matching
 *
 * Supported LLM providers (all OpenAI-compatible unless noted):
 *   OPENAI   — api.openai.com/v1
 *   OLLAMA   — localhost (native /api/chat format)
 *   GROQ     — api.groq.com/openai/v1
 *   LMSTUDIO — localhost (local GGUF models)
 *   AZURE    — Azure OpenAI endpoint
 *   GEMINI   — Google AI API (non-OpenAI format)
 *   CLAUDE   — Anthropic API (non-OpenAI format)
 *
 * All requests come pre-scoped by nexaScopeMiddleware.
 * Reads NexaAIConfig from DB to determine provider, model, and system prompt.
 */

const { prisma } = require('../config/prisma');
const { NEXA_LLM_PROVIDERS, NEXA_PROVIDER_DEFAULTS } = require('../config/constants');

// ─── System Context Builder ─────────────────────────────────────────
// Builds real data snapshots per role so the LLM always sees current system state.

async function buildAdminContext() {
  const [
    pendingQueue,
    totalCourses,
    publishedCourses,
    totalUsers,
    totalOrders,
    totalRevenue,
    totalPlatformFees,
    totalCreatorEarnings,
    totalAffiliateEarnings,
    userRoleStats,
  ] = await Promise.all([
    prisma.course.findMany({
      where: { status: 'PENDING_APPROVAL' },
      select: { id: true, title: true, type: true, priceGhs: true, createdAt: true, creator: { select: { fullName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.course.count(),
    prisma.course.count({ where: { status: 'PUBLISHED' } }),
    prisma.user.count(),
    prisma.order.count({ where: { paymentStatus: 'SUCCESSFUL' } }),
    prisma.order.aggregate({ where: { paymentStatus: 'SUCCESSFUL' }, _sum: { totalAmountGhs: true } }),
    prisma.order.aggregate({ where: { paymentStatus: 'SUCCESSFUL' }, _sum: { platformFeeGhs: true } }),
    prisma.order.aggregate({ where: { paymentStatus: 'SUCCESSFUL' }, _sum: { creatorShareGhs: true } }),
    prisma.commission.aggregate({ where: { status: 'CLEARED' }, _sum: { amountGhs: true } }),
    prisma.user.groupBy({ by: ['role'], _count: { id: true } }),
  ]);

  const recentOrders = await prisma.order.findMany({
    where: { paymentStatus: 'SUCCESSFUL' },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      totalAmountGhs: true, paymentStatus: true, createdAt: true,
      course: { select: { title: true, slug: true } },
      student: { select: { fullName: true } },
      affiliateLink: { select: { affiliateCode: true } },
    },
  });

  const totalGmv = totalRevenue._sum.totalAmountGhs || 0;
  const totalFees = totalPlatformFees._sum.platformFeeGhs || 0;
  const margin = totalGmv > 0 ? parseFloat(((totalFees / totalGmv) * 100).toFixed(2)) : 0;

  return {
    role: 'ADMIN',
    summary: {
      totalCourses,
      publishedCourses,
      pendingCourses: pendingQueue.length,
      totalUsers,
      totalOrders,
      totalGMVGhs: totalGmv,
      platformFeesGhs: totalFees,
      creatorEarningsGhs: totalCreatorEarnings._sum.creatorShareGhs || 0,
      affiliateEarningsGhs: totalAffiliateEarnings._sum.amountGhs || 0,
      platformMarginPercent: margin,
    },
    pendingQueue,
    recentOrders,
    userRoleStats,
  };
}

async function buildCreatorContext(userId) {
  const courses = await prisma.course.findMany({
    where: { creatorId: userId },
    include: {
      orders: { where: { paymentStatus: 'SUCCESSFUL' }, select: { totalAmountGhs: true, createdAt: true, student: { select: { fullName: true } } } },
      modules: { include: { lessons: { select: { id: true } } } },
      reviews: { select: { rating: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const totalRevenue = courses.reduce((sum, c) => sum + c.orders.reduce((s, o) => s + o.totalAmountGhs, 0), 0);
  const totalSales = courses.reduce((sum, c) => sum + c.orders.length, 0);
  const totalEnrollments = courses.reduce((sum, c) => sum + c._count.enrollments, 0);
  const allRatings = courses.flatMap(c => c.reviews.map(r => r.rating));
  const avgRatingVal = allRatings.length ? (allRatings.reduce((s, r) => s + r, 0) / allRatings.length).toFixed(1) : null;
  const totalLessons = courses.reduce((sum, c) => sum + c.modules.reduce((s, m) => s + m.lessons.length, 0), 0);

  return {
    role: 'CREATOR',
    userId,
    summary: { totalCourses: courses.length, totalRevenue, totalSales, totalEnrollments, avgRating: avgRatingVal, totalLessons },
    courses: courses.map(c => ({
      id: c.id, title: c.title, status: c.status, priceGhs: c.priceGhs, type: c.type,
      salesCount: c.orders.length,
      revenueGhs: c.orders.reduce((s, o) => s + o.totalAmountGhs, 0),
      enrollmentCount: c._count.enrollments,
      reviewCount: c.reviews.length,
      moduleCount: c.modules.length,
      lessonCount: c.modules.reduce((s, m) => s + m.lessons.length, 0),
    })),
  };
}

async function buildAffiliateContext(userId) {
  const [links, commissions] = await Promise.all([
    prisma.affiliateLink.findMany({
      where: { affiliateId: userId },
      include: {
        course: { select: { id: true, title: true, slug: true, priceGhs: true, affiliateRate: true } },
        orders: { where: { paymentStatus: 'SUCCESSFUL' }, select: { totalAmountGhs: true, affiliateShareGhs: true, createdAt: true } },
      },
    }),
    prisma.commission.findMany({
      where: { affiliateId: userId },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);
  const totalConversions = links.reduce((sum, l) => sum + l.orders.length, 0);
  const clearedCommission = commissions.filter(c => c.status === 'CLEARED').reduce((sum, c) => sum + c.amountGhs, 0);
  const pendingCommission = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.amountGhs, 0);
  const conversionRate = totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : '0.00';

  return {
    role: 'AFFILIATE',
    userId,
    summary: {
      totalClicks, totalConversions, conversionRate,
      clearedCommissionGhs: clearedCommission,
      pendingCommissionGhs: pendingCommission,
    },
    links: links.map(l => ({
      code: l.affiliateCode,
      sourceTag: l.sourceTag,
      clickCount: l.clickCount,
      courseTitle: l.course.title,
      courseSlug: l.course.slug,
      salesCount: l.orders.length,
      revenueGhs: l.orders.reduce((s, o) => s + o.affiliateShareGhs, 0),
    })),
    commissionCount: commissions.length,
  };
}

async function buildStudentContext(userId) {
  const [orders, enrollments] = await Promise.all([
    prisma.order.findMany({
      where: { studentId: userId, paymentStatus: 'SUCCESSFUL' },
      include: { course: { select: { title: true, slug: true, coverImageUrl: true, creator: { select: { fullName: true } } } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.enrollment.findMany({
      where: { studentId: userId },
      include: { course: { select: { title: true, slug: true, coverImageUrl: true } }, order: { select: { totalAmountGhs: true } } },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmountGhs, 0);

  return {
    role: 'STUDENT',
    userId,
    summary: { totalOrders: orders.length, totalSpentGhs: totalSpent, totalEnrollments: enrollments.length },
    orders: orders.map(o => ({ courseTitle: o.course.title, amountGhs: o.totalAmountGhs, date: o.createdAt })),
    enrollments: enrollments.map(e => ({ courseTitle: e.course.title, progress: e.progress, accessGranted: e.accessGranted })),
  };
}

// ─── Keyword Reply Matcher ──────────────────────────────────────────
// Primary response mechanism — Nexa always matches first before considering LLM.
// This is the core "knowledge from system data" path — no network required.

async function matchReply(prompt, userRole, pageContext = null) {
  const normalized = prompt.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Optional page-specific trigger overrides (higher score when user is on that page)
  const pageBoostMap = pageContext ? {
    '/creator/courses':     ['upload', 'new course', 'create course', 'add course'],
    '/creator/course/new': ['upload', 'new course', 'create course', 'add lesson', 'add section'],
    '/creator/assets':     ['asset', 'media', 'upload', 'video', 'image', 'file'],
    '/creator/analytics':  ['analytics', 'stats', 'performance', 'revenue', 'students'],
    '/creator/earnings':   ['earning', 'payout', 'withdraw', 'commission', 'payment'],
    '/creator/staging':    ['staging', 'pending', 'review', 'approve', 'submit'],
    '/admin/staging':      ['staging', 'pending', 'review', 'approve', 'reject', 'course'],
    '/admin/users':        ['user', 'creator', 'student', 'affiliate', 'role'],
    '/admin/nexa':         ['nexa', 'chatbot', 'ai', 'prompt', 'widget', 'settings'],
    '/admin/analytics':    ['analytics', 'stats', 'metrics', 'platform'],
    '/student/courses':    ['course', 'enroll', 'my course', 'progress'],
    '/student/course':     ['lesson', 'video', 'watch', 'continue', 'course'],
    '/affiliate/tools':     ['script', 'whatsapp', 'tiktok', 'email', 'banner', 'promo', 'template'],
    '/affiliate/links':     ['link', 'affiliate', 'tracking', 'generate'],
    '/affiliate/earnings':  ['earning', 'commission', 'payout', 'withdraw'],
  } : {};

  const replies = await prisma.chatbotReply.findMany({
    where: {
      enabled: true,
      OR: [{ role: 'ALL' }, { role: userRole }],
    },
    orderBy: [{ priority: 'desc' }],
  });

  let best = null;
  let bestScore = 0;

  for (const reply of replies) {
    if (reply.key === 'DEFAULT_FALLBACK' || reply.key === 'OFFLINE_MESSAGE') continue;
    const triggers = reply.trigger.split(',').map(t => t.toLowerCase().trim()).filter(Boolean);
    for (const trigger of triggers) {
      if (normalized.includes(trigger)) {
        let score = trigger.length;
        // Page-specific boost: increase score if this trigger is page-relevant
        for (const [pagePath, pageTriggers] of Object.entries(pageBoostMap)) {
          if (pageContext?.route?.includes(pagePath) && pageTriggers.some(t => normalized.includes(t))) {
            score += 20; // Significant boost for page-contextual matches
            break;
          }
        }
        if (score > bestScore) { bestScore = score; best = reply; }
      }
    }
  }

  if (best) return { answer: best.answer, matchedReplyKey: best.key };

  // No keyword match — check default fallback
  const offlineReply = replies.find(r => r.key === 'OFFLINE_MESSAGE' && r.enabled);
  if (offlineReply) return { answer: offlineReply.answer, matchedReplyKey: 'OFFLINE_MESSAGE' };

  return {
    answer: "I'm not sure I understand that. Try asking about your courses, earnings, enrollments, or how the platform works.",
    matchedReplyKey: null,
  };
}

// ─── LLM Caller ────────────────────────────────────────────────────
// Calls OpenAI-compatible or provider-native APIs to enhance a matched reply.
// LLM is optional — keyword matching always works first.

async function callLLM(config, messages) {
  const { provider, baseUrl, model, apiKey } = config;

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    if (provider === NEXA_LLM_PROVIDERS.CLAUDE) {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
    } else if (provider === NEXA_LLM_PROVIDERS.GEMINI) {
      headers['x-goog-api-key'] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  // ── OLLAMA (native format, no /v1/chat/completions)
  if (provider === NEXA_LLM_PROVIDERS.OLLAMA || (baseUrl.includes('localhost') && !baseUrl.includes('/v1'))) {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, stream: false }),
    });
    if (!response.ok) throw new Error(`Ollama error: ${response.status} ${await response.text()}`);
    const data = await response.json();
    return (data.message && data.message.content) ? data.message.content : 'No response from model.';
  }

  // ── GEMINI (provider-native REST API)
  if (provider === NEXA_LLM_PROVIDERS.GEMINI) {
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));

    const systemInstruction = messages.find(m => m.role === 'system');
    const payload = {
      contents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction.content }] } } : {}),
      generationConfig: { maxOutputTokens: 800, temperature: 0.7 },
    };

    // Gemini uses query param for model name
    const geminiUrl = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text || 'No response from Gemini.';
  }

  // ── CLAUDE (Anthropic native API)
  if (provider === NEXA_LLM_PROVIDERS.CLAUDE) {
    const systemMsg = messages.find(m => m.role === 'system');
    const userMsgs = messages.filter(m => m.role !== 'system');

    const payload = {
      model,
      messages: userMsgs.map(m => ({ role: m.role, content: m.content })),
      max_tokens: 800,
      temperature: 0.7,
      ...(systemMsg ? { system: systemMsg.content } : {}),
    };

    const response = await fetch(`${baseUrl}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API error ${response.status}: ${errText}`);
    }
    const data = await response.json();
    return data.content?.[0]?.text || 'No response from Claude.';
  }

  // ── AZURE OPENAI
  if (provider === NEXA_LLM_PROVIDERS.AZURE) {
    // Azure uses deployment name as model, api-version query param
    const chatUrl = `${baseUrl}/chat/completions?api-version=2024-02-15-preview`;
    const response = await fetch(chatUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 800 }),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Azure OpenAI error ${response.status}: ${errText}`);
    }
    const data = await response.json();
    return (data.choices && data.choices[0]?.message?.content) || 'No response from Azure.';
  }

  // ── OPENAI / GROQ / LMSTUDIO (OpenAI-compatible)
  const chatUrl = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/v1/chat/completions`;
  const response = await fetch(chatUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 800 }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`${provider} API error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return (data.choices && data.choices[0]?.message?.content) || 'No response from model.';
}

// ─── Main Chat Handler ─────────────────────────────────────────────

async function chat(req, res) {
  try {
    const { prompt, enhanceWithLLM, pageContext } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (!prompt) {
      return res.status(400).json({ success: false, statusCode: 400, error: 'BAD_REQUEST', message: 'A prompt is required.' });
    }

    // ── 1. Always try keyword matching first (primary path — no network needed)
    const matchResult = await matchReply(prompt, userRole, pageContext);
    let responseText = matchResult.answer;
    let matchedReplyKey = matchResult.matchedReplyKey;
    let usedLLM = false;

    // ── 2. Optionally enhance with LLM if user requests it AND config exists
    const aiConfig = await prisma.nexaAIConfig.findUnique({ where: { key: 'DEFAULT' } });

    if (aiConfig?.enabled && (enhanceWithLLM === true || enhanceWithLLM === 'true')) {
      let systemContext;
      switch (userRole) {
        case 'ADMIN':     systemContext = await buildAdminContext(); break;
        case 'CREATOR':   systemContext = await buildCreatorContext(userId); break;
        case 'AFFILIATE': systemContext = await buildAffiliateContext(userId); break;
        case 'STUDENT':   systemContext = await buildStudentContext(userId); break;
        default:
          return res.status(403).json({ success: false, statusCode: 403, error: 'FORBIDDEN', message: 'Invalid role for Nexa.' });
      }

      // Build page-aware system message from frontend pageContext
      const pageContextMsg = pageContext
        ? `\n\nCURRENT PAGE CONTEXT (use this to give location-aware help):\n` +
          `User is on page: "${pageContext.page}"\n` +
          `Route: ${pageContext.route}\n` +
          `Page description: ${pageContext.note}\n` +
          `User role: ${pageContext.role}\n` +
          `User capabilities: ${(pageContext.roleCapabilities || []).join(', ')}`
        : '';

      const messages = [
        { role: 'system', content: `${aiConfig.systemPrompt}${pageContextMsg}\n\nYou have access to the current system state as JSON. Use it to give precise, data-driven answers. Format responses with clean Markdown.` },
        { role: 'system', content: `SYSTEM_STATE_JSON: ${JSON.stringify(systemContext, null, 2)}` },
        { role: 'user', content: prompt },
      ];

      try {
        responseText = await callLLM(aiConfig, messages);
        matchedReplyKey = null; // LLM response, not a keyword match
        usedLLM = true;
      } catch (llmError) {
        // LLM failed — keep the matched reply, log warning
        console.warn('[NEXA LLM enhance failed, using keyword match]', llmError.message);
      }
    }

    const providerLabel = usedLLM ? `${aiConfig?.provider} ${aiConfig?.model}` : 'keyword-match';

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: usedLLM ? 'Nexa LLM response generated.' : 'Nexa matched reply.',
      data: {
        reply: responseText,
        matchedReplyKey,
        usedLLM,
        provider: providerLabel,
      },
    });

  } catch (error) {
    console.error('[NEXA CHAT ERROR]', error.message);
    return res.status(500).json({ success: false, statusCode: 500, error: 'INTERNAL_SERVER_ERROR', message: 'Nexa processing failed.' });
  }
}

module.exports = { chat };
