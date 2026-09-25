/**
 * NexaGlobalConfig Controller
 * Singleton config: get (public) and update (admin only).
 */

const { prisma } = require('../config/prisma');

// GET /api/v1/nexa-global-config — public
async function getConfig(req, res) {
  try {
    const config = await prisma.nexaGlobalConfig.findUnique({ where: { key: 'SYSTEM' } });
    if (!config) {
      // Auto-create default on first access
      const created = await prisma.nexaGlobalConfig.create({
        data: { key: 'SYSTEM' },
      });
      return res.status(200).json({ success: true, statusCode: 200, message: 'Config retrieved.', data: created });
    }
    return res.status(200).json({ success: true, statusCode: 200, message: 'Config retrieved.', data: config });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// PUT /api/v1/nexa-global-config — admin only
async function updateConfig(req, res) {
  try {
    const { name, avatarUrl, tagline, defaultOfflineMessage, welcomeMessage, primaryColor, widgetPosition, enabled } = req.body;

    const existing = await prisma.nexaGlobalConfig.findUnique({ where: { key: 'SYSTEM' } });
    if (!existing) {
      return res.status(404).json({ success: false, statusCode: 404, message: 'Config not found.' });
    }

    const updated = await prisma.nexaGlobalConfig.update({
      where: { key: 'SYSTEM' },
      data: {
        ...(name !== undefined && { name }),
        ...(avatarUrl !== undefined && { avatarUrl }),
        ...(tagline !== undefined && { tagline }),
        ...(defaultOfflineMessage !== undefined && { defaultOfflineMessage }),
        ...(welcomeMessage !== undefined && { welcomeMessage }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(widgetPosition !== undefined && { widgetPosition }),
        ...(enabled !== undefined && { enabled }),
      },
    });
    return res.status(200).json({ success: true, statusCode: 200, message: 'Config updated.', data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

module.exports = { getConfig, updateConfig };
