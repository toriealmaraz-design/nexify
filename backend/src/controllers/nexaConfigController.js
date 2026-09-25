/**
 * Nexa AI Config Controller
 * Admin CRUD for Nexa AI endpoint configuration.
 */

const { prisma } = require('../config/prisma');
const { NEXA_PROVIDER_DEFAULTS } = require('../config/constants');

// GET /api/v1/nexa-config — list all configs
async function listConfigs(req, res) {
  try {
    const configs = await prisma.nexaAIConfig.findMany({ orderBy: { key: 'asc' } });
    return res.status(200).json({
      success: true,
      statusCode: 200,
      message: 'Nexa AI configs retrieved.',
      data: configs,
    });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// GET /api/v1/nexa-config/:key — get one config
async function getConfig(req, res) {
  try {
    const config = await prisma.nexaAIConfig.findUnique({ where: { key: req.params.key } });
    if (!config) {
      return res.status(404).json({ success: false, statusCode: 404, message: 'Config not found.' });
    }
    return res.status(200).json({ success: true, statusCode: 200, message: 'Config retrieved.', data: config });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// POST /api/v1/nexa-config — create or update config
// Provider change auto-fills baseUrl and model from NEXA_PROVIDER_DEFAULTS
async function upsertConfig(req, res) {
  try {
    const { key, provider, baseUrl, model, apiKey, systemPrompt, enabled } = req.body;
    if (!key || !provider || !systemPrompt) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'key, provider, and systemPrompt are required.' });
    }

    const defaults = NEXA_PROVIDER_DEFAULTS[provider] || {};
    const resolvedBaseUrl = baseUrl || defaults.baseUrl || '';
    const resolvedModel = model || defaults.model || '';

    const config = await prisma.nexaAIConfig.upsert({
      where: { key },
      update: {
        provider,
        baseUrl: resolvedBaseUrl,
        model: resolvedModel,
        apiKey: apiKey || '',
        systemPrompt,
        enabled: enabled !== undefined ? enabled : true,
      },
      create: {
        key,
        provider,
        baseUrl: resolvedBaseUrl,
        model: resolvedModel,
        apiKey: apiKey || '',
        systemPrompt,
        enabled: enabled !== undefined ? enabled : true,
      },
    });
    return res.status(200).json({ success: true, statusCode: 200, message: 'Config saved.', data: config });
  } catch (error) {
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

// DELETE /api/v1/nexa-config/:key
async function deleteConfig(req, res) {
  try {
    await prisma.nexaAIConfig.delete({ where: { key: req.params.key } });
    return res.status(200).json({ success: true, statusCode: 200, message: 'Config deleted.' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, statusCode: 404, message: 'Config not found.' });
    }
    return res.status(500).json({ success: false, statusCode: 500, message: 'Internal server error.' });
  }
}

module.exports = { listConfigs, getConfig, upsertConfig, deleteConfig };
