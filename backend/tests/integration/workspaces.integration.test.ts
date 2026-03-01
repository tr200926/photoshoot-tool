/**
 * Integration tests for the workspaces API endpoints.
 * Requires a running PostgreSQL database.
 */

import request from 'supertest';
import app from '../../src/index';

let adminToken: string;
let adminWorkspaceId: string;
let editorToken: string;
let editorUserId: string;

const adminEmail = `ws-admin-${Date.now()}@example.com`;
const editorEmail = `ws-editor-${Date.now()}@example.com`;

describe('Workspaces API', () => {
  beforeAll(async () => {
    // Create admin user
    const adminRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: adminEmail,
        name: 'Workspace Admin',
        password: 'adminpass123',
        workspaceName: 'Test Company Workspace',
      });

    adminToken = adminRes.body.token;
    adminWorkspaceId = adminRes.body.workspace?.id;

    // Create editor user (no workspace - they'll be invited)
    const editorRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: editorEmail,
        name: 'Workspace Editor',
        password: 'editorpass123',
        workspaceName: 'Editor Own Workspace',
      });

    editorToken = editorRes.body.token;
    editorUserId = editorRes.body.user?.id;
  });

  describe('GET /api/workspaces/current', () => {
    it('should return current workspace with members and projects', async () => {
      const res = await request(app)
        .get('/api/workspaces/current')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.workspace).toBeDefined();
      expect(res.body.workspace.name).toBe('Test Company Workspace');
      expect(Array.isArray(res.body.workspace.members)).toBe(true);
      expect(Array.isArray(res.body.workspace.projects)).toBe(true);
      expect(res.body.workspace._count).toBeDefined();
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/workspaces/current');
      expect(res.status).toBe(401);
    });
  });

  describe('PUT /api/workspaces/current', () => {
    it('should update workspace name as admin', async () => {
      const res = await request(app)
        .put('/api/workspaces/current')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Company Workspace' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.workspace.name).toBe('Updated Company Workspace');
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .put('/api/workspaces/current')
        .send({ name: 'No Auth' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/workspaces/current/analytics', () => {
    it('should return analytics data', async () => {
      const res = await request(app)
        .get('/api/workspaces/current/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.analytics).toBeDefined();
      expect(res.body.analytics.assets).toHaveProperty('total');
      expect(res.body.analytics.jobs).toHaveProperty('total');
      expect(res.body.analytics.jobs).toHaveProperty('successRate');
      expect(res.body.analytics.credits).toHaveProperty('monthly');
      expect(res.body.analytics.credits).toHaveProperty('used');
      expect(res.body.analytics.credits).toHaveProperty('remaining');
      expect(Array.isArray(res.body.analytics.recentJobs)).toBe(true);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/workspaces/current/analytics');
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/workspaces/current/members', () => {
    it('should list workspace members', async () => {
      const res = await request(app)
        .get('/api/workspaces/current/members')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.members)).toBe(true);
      expect(res.body.members.length).toBeGreaterThanOrEqual(1);

      const member = res.body.members[0];
      expect(member.role).toBeDefined();
      expect(member.user).toBeDefined();
      expect(member.user.email).toBeDefined();
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/workspaces/current/members');
      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/workspaces/current/members/invite', () => {
    it('should invite an existing user to workspace', async () => {
      const res = await request(app)
        .post('/api/workspaces/current/members/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: editorEmail, role: 'editor' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.member).toBeDefined();
      expect(res.body.member.role).toBe('editor');
      expect(res.body.member.user.email).toBe(editorEmail);
    });

    it('should reject duplicate membership', async () => {
      const res = await request(app)
        .post('/api/workspaces/current/members/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: editorEmail, role: 'viewer' });

      expect(res.status).toBe(409);
      expect(res.body.error?.code).toBe('ALREADY_MEMBER');
    });

    it('should reject invite for non-existent user', async () => {
      const res = await request(app)
        .post('/api/workspaces/current/members/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'ghost-user@nowhere.com', role: 'editor' });

      expect(res.status).toBe(404);
      expect(res.body.error?.code).toBe('USER_NOT_FOUND');
    });

    it('should require email field', async () => {
      const res = await request(app)
        .post('/api/workspaces/current/members/invite')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'editor' });

      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/workspaces/current/members/:userId', () => {
    it('should remove a member from the workspace', async () => {
      if (!editorUserId) return;

      const res = await request(app)
        .delete(`/api/workspaces/current/members/${editorUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('removed');
    });

    it('should not allow removing yourself', async () => {
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      const myId = meRes.body.user?.id;

      const res = await request(app)
        .delete(`/api/workspaces/current/members/${myId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error?.code).toBe('CANNOT_REMOVE_SELF');
    });
  });
});
