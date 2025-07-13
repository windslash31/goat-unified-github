const { z } = require('zod');

const objectId = z.string().regex(/^[0-9]+$/, 'ID must be a valid number.');

const createApplicationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Application name is required.'),
  }),
});

const updateApplicationSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    name: z.string().min(2, 'Application name is required.'),
  }),
});

const applicationParamsSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

module.exports = {
  createApplicationSchema,
  updateApplicationSchema,
  applicationParamsSchema,
};