const request = require('supertest');
const express = require('express');
const userRoutes = require('../api/routes/users');

// Mock dependencies with correct relative paths from `src/test/`
jest.mock('../services/userService', () => ({
  createUser: jest.fn(() => Promise.resolve({ id: 1 })),
}));
jest.mock('../api/middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => { req.user = { id: 1, permissions: ['user:create'] }; next(); },
  authorize: () => (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/users', userRoutes);

describe('POST /api/users - User Creation Validation', () => {
  it('should return 201 Created for a valid request', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ fullName: 'John Doe', email: 'john.doe@example.com', roleId: 2 });
    expect(res.statusCode).toEqual(201);
  });

  it('should return 400 Bad Request if email is invalid', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({ fullName: 'Jane Doe', email: 'not-an-email', roleId: 2 });
    expect(res.statusCode).toEqual(400);
  });
});