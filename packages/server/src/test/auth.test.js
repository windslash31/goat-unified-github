const request = require('supertest');
const express = require('express');
const authRoutes = require('../api/routes/auth');

// Mock dependencies with correct relative paths
jest.mock('../services/authService', () => ({
  login: jest.fn(() => Promise.resolve({ accessToken: 'mock_token' })),
}));
jest.mock('express-rate-limit', () => () => (req, res, next) => next());
jest.mock('../api/middleware/authMiddleware', () => ({
    authenticateToken: (req, res, next) => next(),
    authorize: () => (req, res, next) => next(),
}));


const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('POST /api/auth/login', () => {
  it('should return 200 OK with a token for a valid request', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('should return 400 Bad Request if email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' });
    expect(res.statusCode).toEqual(400);
  });
});