const { z } = require('zod');

/**
 * Единый контракт ответа AI-чата (стилист-чат, не генерация лука).
 * - replyText обязателен
 * - imagePrompt допускаем, но для "обычного чата" чаще null
 * - referenced_cloth_ids — опционально, только если чат работает с гардеробом
 */
const chatAiResponseSchema = z
  .object({
    replyText: z.string().trim().min(1).max(8000),
    imagePrompt: z.string().trim().min(1).max(2000).nullable().optional().default(null),
    referenced_cloth_ids: z.array(z.coerce.number().int().positive()).max(80).optional().default([]),
  })
  .strict();

module.exports = {
  chatAiResponseSchema,
};

