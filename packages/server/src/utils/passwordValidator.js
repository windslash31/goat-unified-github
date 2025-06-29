const z = require('zod');

// Define the password complexity rules
const passwordSchema = z.string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
    .regex(/[^a-zA-Z0-9]/, { message: "Password must contain at least one special character" });

const validatePassword = (password) => {
    try {
        passwordSchema.parse(password);
        return { valid: true };
    } catch (error) {
        return { valid: false, issues: error.errors.map(e => e.message) };
    }
};

module.exports = {
    validatePassword,
};