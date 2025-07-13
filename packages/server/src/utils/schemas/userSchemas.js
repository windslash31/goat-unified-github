const { z } = require('zod');
const { validatePassword } = require('../passwordValidator');

const objectId = z.string().regex(/^[0-9]+$/, 'ID must be a valid number.');

const createUserSchema = z.object({
  body: z.object({
    fullName: z.string({
      required_error: 'Full name is required.',
    }).min(2, 'Full name must be at least 2 characters long.'),
    email: z.string({
      required_error: 'Email is required.',
    }).email('Please provide a valid email address.'),
    roleId: z.number({
      required_error: 'Role ID is required.',
      invalid_type_error: 'Role ID must be a number.',
    }),
  }),
});

// Schema for changing a password
const changePasswordSchema = z.object({
  body: z.object({
    oldPassword: z.string().min(1, 'Old password is required.'),
    newPassword: z.string().refine(
        (val) => validatePassword(val).valid, 
        { message: 'New password does not meet complexity requirements.' }
    ),
  }),
});

// Schema for updating a user's role
const updateUserRoleSchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    roleId: z.number().int().positive('A valid Role ID is required.'),
  }),
});

// Generic schema
const userParamsSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

// Schema for generating an API key
const generateApiKeySchema = z.object({
  params: z.object({
    id: objectId,
  }),
  body: z.object({
    description: z.string().min(3, 'Description is required.'),
    expiresInDays: z.number().int().optional().nullable(),
  }),
});

// Schema for routes that use an API key ID parameter
const apiKeyParamsSchema = z.object({
  params: z.object({
    keyId: objectId,
  }),
});

module.exports = {
  createUserSchema,
  changePasswordSchema,
  updateUserRoleSchema,
  userParamsSchema,
  generateApiKeySchema,
  apiKeyParamsSchema,
};