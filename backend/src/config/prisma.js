/**
 * PrismaClient Singleton
 * Prevents multiple connection pools when controllers are imported
 * in the same process (Node --watch keeps the process alive).
 *
 * Usage: const prisma = require('../config/prisma').prisma;
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

module.exports = { prisma };
