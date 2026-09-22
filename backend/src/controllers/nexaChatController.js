const { prisma } = require('../config/prisma');
const axios = require('axios');
const { NEXA_PROVIDER_DEFAULTS, NEXA_LLM_PROVIDERS } = require('../config/constants');

// ── Persist a message to chat history ──────────────────────────
async function saveMessage(conversationId, role, content, extra = {}) {
  return prisma.nexaMessage.create({
    data: { conversationId, role, content, ...extra },
  });
}

// ── Build context from system ───────────────────────────────────
async function buildSystemContext(userId, role) {
  const lines = [`[SYSTEM] You are Nexa, an AI assistant on the Nexify platform. Role context: ${role}. Current time: ${new Date().toISOString()}.`];

  try {
    if (role === 'ADMIN') {
      const [userCount, courseCount, orderCount] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.order.count({ where: { paymentStatus: 'SUCCESSFUL' } }),
      ]);
      lines.push(`[PLATFORM] Total users: ${userCount}, Total courses: ${courseCount}, Successful orders: ${orderCount}.`);
    } else if (role === 'CREATOR') {
      const courses = await prisma.course.findMany({ where: { creatorId: userId }, select: { id: true, title: true, status: true, priceGhs: true, enrolledCount: { select: { _count: { select: { id: true } } } } } });
      const earnings = await prisma.order.aggregate({ where: { course: { creatorId: userId }, paymentStatus: 'SUCCESSFUL' }, _sum: { creatorShareGhs: true } });
      lines.push(`[COURSES] You have ${courses.length} course(s). Total earnings: GH₵${(earnings._sum.creatorShareGhs || 0).toFixed(2)}.`);
      for (const c of courses.slice(0, 5)) lines.push(` - "${c.title}" (${c.status}, GHS${c.priceGhs}, ${c._count?.id || 0} enrolled)`);
    } else if (role === 'AFFILIATE') {
      const links = await prisma.affiliateLink.findMany({ where: { affiliateId: userId }, select: { id: true, clickCount: true, _count: { select: { orders: { where: { paymentStatus: 'SUCCESSFUL' } } } } } });
      const commissions = await prisma.commission.aggregate({ where: { affiliateId: userId }, _sum: { amountGhs: true } });
      lines.push(`[AFFILIATE] Total links: ${links.length}. Total earned: GH₵${(commissions._sum.amountGhs || 0).toFixed(2)}.`);
      for (const l of links.slice(0, 3)) lines.push(` Link ${l.id.slice(0,8)}: ${l.clickCount} clicks, ${l._count.id} sales.`);
    } else if (role === 'STUDENT') {
      const enrollments = await prisma.enrollment.findMany({ where: { studentId: userId }, include: { course: { select: { title: true } } } });
      const completed = enrollments.filter(e => e.progress >= 100).length;
      lines.push(`[STUDENT] ${enrollments.length} enrolled course(s), ${completed} completed.`);
    }
  } catch { /* non-fatal */ }

  return lines.join('\n');
}

// ── Keyword reply match ────────────────────────────────────────
async function matchReply(prompt, role) {
  const replies = await prisma.chatbotReply.findMany({ where: { OR: [{ role }, { role: 'ALL' }], enabled: true } });
  const p = prompt.toLowerCase();
  const sorted = replies.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  for (const r of sorted) {
    if (!r.trigger) continue;
    const kws = r.trigger.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    if (kws.some(kw => kw && p.includes(kw))) return r.answer;
  }
  return null;
}

// ── LLM call ───────────────────────────────────────────────────
async function callLLM(config, messages, systemContext) {
  const { provider, baseUrl, model, apiKey } = config;
  if (!model) throw new Error('No model configured');

  const systemMsg = { role: 'system', content: systemContext };
  const body = { model, messages: [systemMsg, ...messages] };
  const headers = { 'Content-Type': 'application/json' };

  if (provider === NEXA_LLM_PROVIDERS.OPENAI || provider === NEXA_LLM_PROVIDERS.GROQ) {
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
    const res = await axios.post(`${baseUrl}/chat/completions`, body, { headers, timeout: 30000 });
    return { reply: res.data.choices[0].message.content, tokens: res.data.usage?.total_tokens };
  }

  if (provider === NEXA_LLM_PROVIDERS.OLLAMA || provider === NEXA_LLM_PROVIDERS.LMSTUDIO) {
    const res = await axios.post(`${baseUrl}/chat`, { model, messages: [systemMsg, ...messages] }, { headers, timeout: 30000 });
    return { reply: res.data.message?.content || res.data.response || '', tokens: null };
  }

  if (provider === NEXA_LLM_PROVIDERS.GEMINI) {
    const geminiBody = { contents: messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] })), systemInstruction: { parts: [{ text: systemContext }] }, generationConfig: {} };
    const res = await axios.post(`${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`, geminiBody, { headers, timeout: 30000 });
    return { reply: res.data.candidates?.[0]?.content?.parts?.[0]?.text || '', tokens: null };
  }

  if (provider === NEXA_LLM_PROVIDERS.CLAUDE) {
    const res = await axios.post(`${baseUrl}/v1/messages`, { model, system: systemContext, messages }, { headers: { ...headers, 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }, timeout: 30000 });
    return { reply: res.data.content?.[0]?.text || '', tokens: res.data.usage?.input_tokens || null };
  }

  throw new Error(`Unsupported provider: ${provider}`);
}

// ── Main chat endpoint ─────────────────────────────────────────
async function handleChat(req, res) {
  try {
    const { prompt, conversationId: existingConvId, courseId } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ message: 'prompt is required' });

    const role = req.user.role;

    // 1. Keyword match first
    const keywordReply = await matchReply(prompt, role);
    let reply, usedLLM = false, provider = null, model = null, tokensUsed = null;

    if (keywordReply) {
      reply = keywordReply;
    } else {
      // 2. Try LLM
      const config = await prisma.nexaAIConfig.findFirst({ where: { enabled: true } });
      if (config?.enabled && config.model) {
        try {
          const result = await callLLM(config, [{ role: 'user', content: prompt }], await buildSystemContext(req.user.id, role));
          reply = result.reply;
          usedLLM = true; provider = config.provider; model = config.model; tokensUsed = result.tokens;
        } catch (llmErr) {
          console.error('[Nexa LLM error]', llmErr.message);
          reply = "I'm sorry — Nexa is having trouble connecting. Please try again in a moment.";
        }
      } else {
        reply = "Nexa doesn't have an answer for that yet. Try rephrasing, or check the Keyword Responses in Nexa Settings.";
      }
    }

    // 3. Persist to chat history
    try {
      let convId = existingConvId;
      if (!convId) {
        const conv = await prisma.nexaConversation.create({ data: { userId: req.user.id, courseId: courseId || null, title: prompt.substring(0, 60) } });
        convId = conv.id;
      }
      await Promise.all([
        saveMessage(convId, 'user', prompt),
        saveMessage(convId, 'nexa', reply, { provider, model, usedLLM, tokensUsed }),
      ]);
      await prisma.nexaConversation.update({ where: { id: convId }, data: { updatedAt: new Date() } });
    } catch { /* non-fatal */ }

    res.json({ data: { reply, conversationId: convId, usedLLM, provider, model } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Chat failed' });
  }
}

// GET /api/v1/nexa/conversations — list user's conversations
async function listConversations(req, res) {
  try {
    const convs = await prisma.nexaConversation.findMany({
      where: { userId: req.user.id },
      include: { _count: { select: { messages: true } }, messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { content: true, createdAt: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    res.json({ data: convs });
  } catch (err) {
    res.status(500).json({ message: 'Failed to list conversations' });
  }
}

// GET /api/v1/nexa/conversations/:id — get messages in a conversation
async function getConversation(req, res) {
  try {
    const conv = await prisma.nexaConversation.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!conv) return res.status(404).json({ message: 'Not found' });
    const messages = await prisma.nexaMessage.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: 'asc' } });
    res.json({ data: { ...conv, messages } });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get conversation' });
  }
}

// DELETE /api/v1/nexa/conversations/:id
async function deleteConversation(req, res) {
  try {
    const conv = await prisma.nexaConversation.findFirst({ where: { id: req.params.id, userId: req.user.id } });
    if (!conv) return res.status(404).json({ message: 'Not found' });
    await prisma.nexaMessage.deleteMany({ where: { conversationId: conv.id } });
    await prisma.nexaConversation.delete({ where: { id: conv.id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete conversation' });
  }
}

module.exports = { handleChat, listConversations, getConversation, deleteConversation };
