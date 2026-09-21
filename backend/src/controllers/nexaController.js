/**
 * Nexa Controller
 * Handles role-scoped conversational queries.
 *
 * All requests come pre-scoped by nexaScopeMiddleware.
 * This controller formats the scoped context and returns a response.
 *
 * Reference: 07_NEXA.md
 */

const { prisma } = require('../config/prisma');
const constants = require('../config/constants');

/**
 * Nexa Chat Endpoint
 * Receives a user prompt + pre-fetched scoped context, returns a response.
 *
 * In production, this would call an LLM (Ollama local / Gemini API).
 * For the initial scaffold, it returns a structured summary of the
 * scoped data with a placeholder for LLM integration.
 */
async function chat(req, res) {
  try {
    const { prompt } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const scopedContext = req.nexaScopedContext;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        error: 'BAD_REQUEST',
        message: 'A prompt is required.',
      });
    }

    // Build role-scope identifier
    const roleScopeMap = {
      ADMIN: 'ROLE_ADMIN',
      CREATOR: 'ROLE_CREATOR',
      AFFILIATE: 'ROLE_AFFILIATE',
      STUDENT: 'ROLE_STUDENT',
    };

    // ── For the initial scaffold, we return a structured summary
    //    of what the LLM would see. The actual LLM call is wired
    //    as a placeholder below. ──

    let responseText = '';
    let executedContext = '';

    switch (userRole) {
      case 'ADMIN': {
        const { pendingQueue = [], globalFinancials = {}, orderCount = 0, userStats = [] } = scopedContext;
        const totalGmv = globalFinancials.totalAmountGhs || 0;
        const totalFees = globalFinancials.platformFeeGhs || 0;
        const totalUsers = userStats.reduce((s, u) => s + u._count.id, 0);

        responseText = `Hello! Here's your Nexa Executive Dashboard summary:

**Platform Overview:**
- Total Orders: ${orderCount}
- Gross Merchandise Value (GMV): GH₵ ${(totalGmv || 0).toFixed(2)}
- Platform Fees Collected: GH₵ ${(totalFees || 0).toFixed(2)}
- Total Registered Users: ${totalUsers}
- Pending Course Reviews: ${pendingQueue.length}

${pendingQueue.length > 0 ? `\**Staging Queue:**\n${pendingQueue.map(c => `  - "${c.title}" by ${c.creator.fullName} (${c.type}) — GH₵ ${c.priceGhs.toFixed(2)}`).join('\n')}` : 'No courses awaiting review.'}`;

        executedContext = 'Global platform analytics, staging queue, user directory.';
        break;
      }

      case 'CREATOR': {
        const courses = scopedContext;
        if (!courses || courses.length === 0) {
          responseText = 'Hello! I don\'t see any courses associated with your account yet. Create your first course to get started!';
          executedContext = 'No courses found.';
        } else {
          const totalRevenue = courses.reduce((sum, c) =>
            sum + (c.orders || []).reduce((s, o) => s + o.totalAmountGhs, 0), 0);
          const totalSales = courses.reduce((sum, c) => sum + (c.orders || []).length, 0);

          responseText = `Hello! Here's your Nexa Creator Dashboard:

**Your Courses (${courses.length}):**
${courses.map(c => `  • **${c.title}** — GH₵ ${c.priceGhs.toFixed(2)} | ${c.status.replace('_', ' ')} | ${c.orders ? c.orders.length : 0} sales | GH₵ ${(c.orders || []).reduce((s, o) => s + o.totalAmountGhs, 0).toFixed(2)} revenue`).join('\n')}

**Summary:**
- Total Sales: ${totalSales}
- Total Revenue: GH₵ ${totalRevenue.toFixed(2)}`;

          executedContext = `Courses owned by user ${userId}.`;
        }
        break;
      }

      case 'AFFILIATE': {
        const { commissionSummary = [] } = scopedContext;
        const links = scopedContext || [];
        const totalClicks = links.reduce((sum, l) => sum + l.clickCount, 0);
        const totalConversions = links.reduce((sum, l) => sum + (l.orders || []).length, 0);
        const clearedCommissions = commissionSummary
          .filter(c => c.status === 'CLEARED')
          .reduce((sum, c) => sum + c.amountGhs, 0);

        responseText = `Hello! Here's your Nexa Affiliate Dashboard:

**Performance Summary:**
- Total Clicks: ${totalClicks}
- Total Conversions: ${totalConversions}
- Conversion Rate: ${totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : 0}%
- Cleared Commissions: GH₵ ${clearedCommissions.toFixed(2)}`;

        if (links.length > 0) {
          responseText += `\n\n**Your Links:**\n${links.map(l =>
            `  • "${l.course.title}" — ${l.clickCount} clicks, ${l.orders ? l.orders.length : 0} sales, code: ${l.affiliateCode}`
          ).join('\n')}`;
        }

        executedContext = `Affiliate links and commissions for user ${userId}.`;
        break;
      }

      case 'STUDENT': {
        const orders = scopedContext || [];
        const totalSpent = orders.reduce((sum, o) => sum + o.totalAmountGhs, 0);

        responseText = `Hello! Here's your Nexa Learning Assistant summary:

**Your Orders (${orders.length}):**
${orders.map(o => `  • "${o.course.title}" — GH₵ ${o.totalAmountGhs.toFixed(2)} (${o.paymentStatus.replace('_', ' ')})${o.enrollment ? ` | Progress: ${o.enrollment.progress}%` : ''}`).join('\n') || '  No orders yet.'}`;

        if (totalSpent > 0) {
          responseText += `\n\n**Total Spent:** GH₵ ${totalSpent.toFixed(2)}`;
        }

        executedContext = `Enrolled courses and order history for user ${userId}.`;
        break;
      }

      default:
        return res.status(403).json({
          success: false,
          statusCode: 403,
          error: 'FORBIDDEN',
          message: 'Invalid role for Nexa access.',
        });
    }

    // ── LLM Integration Placeholder ──
    // In production, the prompt + scopedContext + system prompt
    // would be sent to the LLM provider (Ollama/Gemini) here.
    // For the scaffold, we return the structured summary above.

    /* FUTURE LLM INTEGRATION:
    const { nexa } = require('../config/env');
    const systemPrompt = getSystemPromptForRole(userRole);
    const llmResponse = await callLLM(systemPrompt, prompt, scopedContext);
    responseText = llmResponse;
    */

    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Nexa intelligence response generated.',
      data: {
        roleScope: roleScopeMap[userRole],
        executedContext,
        prompt,
        response: responseText,
      },
    });

  } catch (error) {
    console.error('[NEXA CHAT ERROR]', error.message);
    return res.status(500).json({
      success: false,
      statusCode: 500,
      error: 'INTERNAL_SERVER_ERROR',
      message: 'Nexa processing failed.',
    });
  }
}

// ─── Helper: Get system prompt for role ────────────────────
function getSystemPromptForRole(role) {
  const prompts = {
    STUDENT: `You are Nexa, the dedicated learning assistant on the Nexify Platform. Help students with course materials, clarify topics, and navigate enrolled courses. Address the student by name. Never reveal platform financials or other users' data. Use clean Markdown formatting.`,

    CREATOR: `You are Nexa, the Creator Course & Funnel Strategist. Assist course authors with curriculum structuring, conversion optimization, and earnings analysis. Explain financials in GH₵. Remind creators about the 30-90s trailer requirement. Use clean Markdown formatting.`,

    AFFILIATE: `You are Nexa, the Affiliate Network Promotional Coach. Help affiliates maximize conversions, write promotional copy, and analyze metrics. Use GH₵ for all figures. Always append referral links to generated copy. Never expose other affiliates' data. Use clean Markdown formatting.`,

    ADMIN: `You are Nexa, operating in Executive Administrative Mode. Provide platform-wide summaries, staging queue insights, and revenue analytics. Maintain an authoritative, concise tone. Use clean Markdown formatting.`,
  };

  return prompts[role] || prompts.STUDENT;
}

module.exports = { chat };
