const { z } = require('zod');

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('A valid email is required.'),
    password: z.string().min(1, 'Password is required.'),
  }),
});

module.exports = { loginSchema };