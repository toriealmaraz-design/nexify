/**
 * Chatbot Reply Controller
 * CRUD for predefined chatbot responses + offline fallback matching.
 */

const { prisma } = require('../config/prisma');

// ─── Admin CRUD ───────────────────────────────────────────────────

// GET /api/v1/chatbot-replies — list all
async function listReplies(req, res) {
  try {
    const replies = await prisma.chatbotReply.findMany({ orderBy: [{ priority: 'desc' }, { key: 'asc' }] });
    return res.status(200).json({ success: true, statusCode: 200, message: 'Replies retrieved.', data: replies });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// GET /api/v1/chatbot-replies/public — public, enabled only (for NexaWidget)
async function listRepliesPublic(req, res) {
  try {
    const replies = await prisma.chatbotReply.findMany({
      where: { enabled: true },
      orderBy: [{ priority: 'desc' }],
    });
    return res.json({ success: true, statusCode: 200, message: 'Replies retrieved.', data: replies });
  } catch (err) {
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// POST /api/v1/chatbot-replies — create
async function createReply(req, res) {
  try {
    const { key, role, trigger, question, answer, priority, enabled } = req.body;
    if (!key || !trigger || !answer) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'key, trigger, and answer are required.' });
    }
    const existing = await prisma.chatbotReply.findUnique({ where: { key } });
    if (existing) {
      return res.status(409).json({ success: false, statusCode: 409, message: `Reply with key "${key}" already exists.` });
    }
    const reply = await prisma.chatbotReply.create({
      data: { key, role: role || 'ALL', trigger, question: question || null, answer, priority: priority || 0, enabled: enabled !== false },
    });
    return res.status(201).json({ success: true, statusCode: 201, message: 'Reply created.', data: reply });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// PUT /api/v1/chatbot-replies/:key — update
async function updateReply(req, res) {
  try {
    const { key } = req.params;
    const { role, trigger, question, answer, priority, enabled } = req.body;
    const existing = await prisma.chatbotReply.findUnique({ where: { key } });
    if (!existing) {
      return res.status(404).json({ success: false, statusCode: 404, message: 'Reply not found.' });
    }
    const reply = await prisma.chatbotReply.update({
      where: { key },
      data: {
        ...(role !== undefined && { role }),
        ...(trigger !== undefined && { trigger }),
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(priority !== undefined && { priority }),
        ...(enabled !== undefined && { enabled }),
      },
    });
    return res.status(200).json({ success: true, statusCode: 200, message: 'Reply updated.', data: reply });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, statusCode: 404, message: 'Reply not found.' });
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// DELETE /api/v1/chatbot-replies/:key
async function deleteReply(req, res) {
  try {
    const { key } = req.params;
    await prisma.chatbotReply.delete({ where: { key } });
    return res.status(200).json({ success: true, statusCode: 200, message: 'Reply deleted.' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ success: false, statusCode: 404, message: 'Reply not found.' });
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// POST /api/v1/chatbot-replies/seed — seed defaults
async function seedReplies(req, res) {
  try {
    const defaults = [
      {
        key: 'GREETING',
        role: 'ALL',
        trigger: 'hello,hi,hey,good morning,good afternoon,good evening',
        question: 'Hi there!',
        answer: "Hello! 👋 Welcome to Nexify. I'm Nexa, your AI assistant. How can I help you today? You can ask me about courses, affiliates, creators, or anything about the platform.",
        priority: 100,
        enabled: true,
      },
      {
        key: 'AFFILIATE_HOW_TO',
        role: 'AFFILIATE',
        trigger: 'affiliate,commission,earn,money,how to earn,start promoting',
        question: 'How does the affiliate program work?',
        answer: "Great question! As an affiliate on Nexify, you earn commission every time someone purchases a course through your link. Commission rates vary by course (typically 30-50%). You can generate your unique affiliate links in the 'My Links' section. Your earnings are paid out when you reach the minimum threshold. Want tips on promoting courses effectively?",
        priority: 80,
        enabled: true,
      },
      {
        key: 'CREATOR_HOW_TO',
        role: 'CREATOR',
        trigger: 'create course,make course,upload,publish,teach,start creating',
        question: 'How do I create a course?',
        answer: "To create a course on Nexify: 1) Go to 'Create Course' from your dashboard. 2) Add your course title, description, and price in GH₵. 3) Upload a 30-90 second teaser video. 4) Add modules and lessons. 5) Set your affiliate commission rate. 6) Submit for review. Your course goes live after Nexify admin approval. Need help with a specific step?",
        priority: 80,
        enabled: true,
      },
      {
        key: 'STUDENT_HOW_TO',
        role: 'STUDENT',
        trigger: 'enroll,buy,purchase,course,learn,start learning',
        question: 'How do I enroll in a course?',
        answer: "Enrolling in a course on Nexify is easy: browse the course catalog, click a course you like, and hit 'Enroll Now'. You can pay via Mobile Money (MTN, Telecel, AirtelTigo). Once payment is confirmed, your course appears in your dashboard under 'My Courses'. You get lifetime access!",
        priority: 80,
        enabled: true,
      },
      {
        key: 'COURSE_SUPPORT',
        role: 'ALL',
        trigger: 'support,help,problem,issue,refund,not working',
        question: 'I need help with an issue.',
        answer: "I'm sorry you're experiencing an issue. For immediate help, please contact our support team at support@nexify.io or use the live chat. For refunds, our policy allows requests within 7 days of purchase if you're not satisfied with the course content.",
        priority: 60,
        enabled: true,
      },
      {
        key: 'OFFLINE_MESSAGE',
        role: 'ALL',
        trigger: '',
        question: null,
        answer: "I'm currently offline, but I've noted your message! Our team typically responds within 24 hours. For urgent matters, please email support@nexify.io.",
        priority: 0,
        enabled: true,
      },
      {
        key: 'PLATFORM_INFO',
        role: 'ALL',
        trigger: 'what is nexify,about,about nexify,platform',
        question: 'What is Nexify?',
        answer: "Nexify is West Africa's digital economy learning platform — connecting course creators with students across Ghana and the broader continent. Creators earn from their knowledge, affiliates promote courses for commission, and students access practical, immediately applicable skills.",
        priority: 90,
        enabled: true,
      },
      {
        key: 'PAYMENT_METHODS',
        role: 'ALL',
        trigger: 'payment,payment methods,how to pay,mtn momo,vodafone cash,pay',
        question: 'What payment methods are accepted?',
        answer: "We accept Mobile Money payments:\n- MTN MoMo\n- Telecel Cash\n- AirtelTigo Money\n\nSimply choose your network at checkout and complete the payment via your mobile money app. Your access is granted as soon as payment is confirmed.",
        priority: 95,
        enabled: true,
      },
      {
        key: 'REFUND_POLICY',
        role: 'ALL',
        trigger: 'refund,money back,refund policy,cancel,cancellation',
        question: 'What is your refund policy?',
        answer: "We offer a 7-day refund window from the date of purchase. If you're not satisfied with a course, contact our support team within 7 days and we'll process your refund, provided you haven't completed more than 30% of the course content.",
        priority: 90,
        enabled: true,
      },
      {
        key: 'DEFAULT_FALLBACK',
        role: 'ALL',
        trigger: '',
        question: null,
        answer: "I'm not sure I understood that. Could you rephrase your question? You can ask me about:\n- How to get started as an affiliate or creator\n- How payments work\n- Our refund policy\n- Any specific feature on Nexify",
        priority: -1,
        enabled: true,
      },
    ];

    const results = [];
    for (const d of defaults) {
      const existing = await prisma.chatbotReply.findUnique({ where: { key: d.key } });
      if (!existing) {
        const created = await prisma.chatbotReply.create({ data: d });
        results.push(created.key);
      }
    }

    return res.status(201).json({ success: true, statusCode: 201, message: 'Seed complete.', data: { seeded: results } });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

module.exports = { listReplies, listRepliesPublic, createReply, updateReply, deleteReply, seedReplies };
