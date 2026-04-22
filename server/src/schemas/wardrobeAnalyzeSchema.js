const { z } = require('zod');

// OpenAI-анализатор гардероба: возвращает структурные подсказки,
// которые затем использует writer (GigaChat) для финального текста.
const wardrobeAnalyzeSchema = z
  .object({
    referenced_cloth_ids: z.array(z.coerce.number().int().positive()).max(80).default([]),
    notes_for_writer: z.string().trim().min(1).max(2000).nullable().optional().default(null),
  })
  .strict();

module.exports = {
  wardrobeAnalyzeSchema,
};

