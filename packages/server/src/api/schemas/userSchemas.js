const { z } = require("zod");

const createUserSchema = z.object({
  fullName: z
    .string({ required_error: "Full name is required." })
    .min(1, { message: "Full name cannot be empty." }),
  email: z
    .string({ required_error: "Email is required." })
    .email({ message: "Must be a valid email address." }),
  roleId: z.number({ required_error: "Role is required." }).int(),
});

module.exports = {
  createUserSchema,
};
