const request = require('supertest');
const express = require('express');
const applicationRoutes = require('../api/routes/applications');

// Mock dependencies with correct relative paths
jest.mock('../services/applicationService', () => ({
  createApplication: jest.fn(() => Promise.resolve({ id: 1, name: 'New App' })),
  updateApplication: jest.fn(() => Promise.resolve({ id: 1, name: 'Updated App' })),
}));
jest.mock('../api/middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => { req.user = { permissions: ['admin:manage_applications'] }; next(); },
  authorize: () => (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/applications', applicationRoutes);

describe('Application Routes Validation', () => {
  it('POST /api/applications should return 201 for valid data', async () => {
    const res = await request(app).post('/api/applications').send({ name: 'SuperApp' });
    expect(res.statusCode).toEqual(201);
  });

  it('PUT /api/applications/:id should return 200 for valid data', async () => {
    const res = await request(app).put('/api/applications/1').send({ name: 'SuperAppV2' });
    expect(res.statusCode).toEqual(200);
  });
});