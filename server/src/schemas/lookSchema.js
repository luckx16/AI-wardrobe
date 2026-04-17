const { z } = require('zod');

// Ответ от AI, который мы сохраняем и отдаём клиенту.
// Важно: максимально строгая форма, чтобы не сохранять мусор в БД.
const lookItemSchema = z.object({
  cloth_id: z.coerce.number().int().positive(),
  role: z.string().min(1).max(80),
  reason: z.string().min(1).max(400).optional(),
});

const generatedLookSchema = z.object({
  look_name: z.string().min(1).max(140),
  occasion: z.string().min(1).max(140).default(''),
  items: z.array(lookItemSchema).min(1).max(12),
});

// JSON Schema для Gemini response_schema (строгий JSON, без лишних полей).
// Gemini ожидает JSON Schema вида draft-2020-12 (достаточно базовых ограничений).
const geminiGeneratedLookJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['look_name', 'occasion', 'items'],
  properties: {
    look_name: { type: 'string', minLength: 1, maxLength: 140 },
    occasion: { type: 'string', minLength: 1, maxLength: 140 },
    items: {
      type: 'array',
      minItems: 1,
      maxItems: 12,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['cloth_id', 'role'],
        properties: {
          cloth_id: { type: 'integer', minimum: 1 },
          role: { type: 'string', minLength: 1, maxLength: 80 },
          reason: { type: 'string', minLength: 1, maxLength: 400 },
        },
      },
    },
  },
};

module.exports = {
  generatedLookSchema,
  geminiGeneratedLookJsonSchema,
};

