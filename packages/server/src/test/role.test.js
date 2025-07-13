const request = require('supertest');
const express = require('express');
const roleRoutes = require('../api/routes/roles');

// Mock dependencies with correct relative paths
jest.mock('../services/roleService', () => ({
  createRole: jest.fn(() => Promise.resolve({ id: 1, name: 'New Role' })),
  updateRolePermissions: jest.fn(() => Promise.resolve({ message: 'Success' })),
  deleteRole: jest.fn(() => Promise.resolve({ message: 'Success' })),
}));
jest.mock('../api/middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => { req.user = { permissions: ['admin:view_roles', 'role:manage'] }; next(); },
  authorize: () => (req, res, next) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/roles', roleRoutes);

describe('Role Routes Validation', () => {
  it('POST /api/roles should return 201 for valid data', async () => {
    const res = await request(app).post('/api/roles').send({ name: 'Editors' });
    expect(res.statusCode).toEqual(201);
  });

  it('PUT /api/roles/:id/permissions should return 200 for valid data', async () => {
    const res = await request(app).put('/api/roles/1/permissions').send({ permissionIds: [1, 2] });
    expect(res.statusCode).toEqual(200);
  });
});