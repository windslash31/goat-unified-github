const { z } = require('zod');

const objectId = z.string().regex(/^[0-9]+$/, 'ID must be a valid number.');

const createRoleSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Role name must be at least 2 characters.'),
  }),
});

const updateRolePermissionsSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    permissionIds: z.array(z.number()).default([]),
  }),
});

const roleParamsSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

module.exports = {
  createRoleSchema,
  updateRolePermissionsSchema,
  roleParamsSchema,
};