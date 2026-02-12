import { test, expect } from '@playwright/test';
import {
  registerUser,
  loginUser,
  logoutUser,
  generateUniqueUser,
} from '../helpers/auth-helper';

/**
 * TEAMS FLOW TESTS
 *
 * End-to-end tests for the team management system:
 * - Create a team
 * - List teams
 * - Invite a member via the invitations endpoint
 * - List team members
 * - Delete a team
 *
 * Tests create real data and clean up after themselves using
 * the DELETE /api/teams/[id] endpoint.
 */

test.describe('Teams Flow - CRUD Operations', () => {
  let testUser: { email: string; password: string; name: string };
  const createdTeamIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    testUser = generateUniqueUser();
    await registerUser(request, testUser.email, testUser.password, testUser.name);
  });

  test.beforeEach(async ({ request }) => {
    await loginUser(request, testUser.email, testUser.password);
  });

  test.afterAll(async ({ request }) => {
    await loginUser(request, testUser.email, testUser.password);
    for (const teamId of createdTeamIds) {
      try {
        await request.delete(`/api/teams/${teamId}`);
      } catch {
        // Team may already be deleted
      }
    }
  });

  test('Create team with valid name succeeds', async ({ request }) => {
    const teamName = `E2E Team ${Date.now()}`;

    const response = await request.post('/api/teams', {
      data: { name: teamName },
    });

    expect(response.status()).toBe(200);
    const team = await response.json();

    expect(team.id).toBeTruthy();
    expect(team.name).toBe(teamName);
    expect(team.slug).toBeTruthy();
    expect(team.members).toBeDefined();
    expect(Array.isArray(team.members)).toBe(true);

    // Creator should be the owner
    expect(team.members.length).toBeGreaterThanOrEqual(1);
    const ownerMember = team.members.find(
      (m: { role: string }) => m.role === 'owner'
    );
    expect(ownerMember).toBeTruthy();

    createdTeamIds.push(team.id);
  });

  test('Create team with empty name returns 400', async ({ request }) => {
    const response = await request.post('/api/teams', {
      data: { name: '' },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('name');
  });

  test('Create team with very long name returns 400', async ({ request }) => {
    const longName = 'A'.repeat(101);

    const response = await request.post('/api/teams', {
      data: { name: longName },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('100 characters');
  });

  test('List teams includes newly created team', async ({ request }) => {
    const teamName = `E2E List Team ${Date.now()}`;

    // Create a team
    const createResponse = await request.post('/api/teams', {
      data: { name: teamName },
    });
    const team = await createResponse.json();
    createdTeamIds.push(team.id);

    // List teams
    const listResponse = await request.get('/api/teams');

    expect(listResponse.status()).toBe(200);
    const teams = await listResponse.json();

    expect(Array.isArray(teams)).toBe(true);
    expect(teams.length).toBeGreaterThanOrEqual(1);

    // Find our team in the list
    const foundTeam = teams.find(
      (t: { id: string }) => t.id === team.id
    );
    expect(foundTeam).toBeTruthy();
    expect(foundTeam.name).toBe(teamName);
    expect(foundTeam.myRole).toBe('owner');
  });

  test('List teams without auth returns 401', async ({ request }) => {
    await logoutUser(request);

    const response = await request.get('/api/teams');

    expect(response.status()).toBe(401);
  });

  test('Get team details returns full information', async ({ request }) => {
    const teamName = `E2E Detail Team ${Date.now()}`;

    const createResponse = await request.post('/api/teams', {
      data: { name: teamName },
    });
    const team = await createResponse.json();
    createdTeamIds.push(team.id);

    // Get team details
    const detailResponse = await request.get(`/api/teams/${team.id}`);

    expect(detailResponse.status()).toBe(200);
    const detail = await detailResponse.json();

    expect(detail.id).toBe(team.id);
    expect(detail.name).toBe(teamName);
    expect(detail.myRole).toBe('owner');
    expect(detail.members).toBeDefined();
    expect(detail.teamProjects).toBeDefined();
  });

  test('Get non-existent team returns 404', async ({ request }) => {
    const response = await request.get('/api/teams/non-existent-team-id');

    expect(response.status()).toBe(404);
  });

  test('Delete team as owner succeeds', async ({ request }) => {
    const teamName = `E2E Delete Team ${Date.now()}`;

    // Create team
    const createResponse = await request.post('/api/teams', {
      data: { name: teamName },
    });
    const team = await createResponse.json();

    // Delete team
    const deleteResponse = await request.delete(`/api/teams/${team.id}`);

    expect(deleteResponse.status()).toBe(200);
    const data = await deleteResponse.json();
    expect(data.success).toBe(true);

    // Verify team is gone
    const getResponse = await request.get(`/api/teams/${team.id}`);
    expect(getResponse.status()).toBe(404);
  });

  test('Delete team creates success and list no longer includes it', async ({ request }) => {
    const teamName = `E2E Delete List Team ${Date.now()}`;

    // Create team
    const createResponse = await request.post('/api/teams', {
      data: { name: teamName },
    });
    const team = await createResponse.json();

    // Delete team
    await request.delete(`/api/teams/${team.id}`);

    // List teams should not include deleted team
    const listResponse = await request.get('/api/teams');
    const teams = await listResponse.json();

    const found = teams.find((t: { id: string }) => t.id === team.id);
    expect(found).toBeUndefined();
  });
});

test.describe('Teams Flow - Invitations', () => {
  let ownerUser: { email: string; password: string; name: string };
  let inviteeUser: { email: string; password: string; name: string };
  let teamId: string;

  test.beforeAll(async ({ request }) => {
    ownerUser = generateUniqueUser();
    inviteeUser = generateUniqueUser();

    await registerUser(request, ownerUser.email, ownerUser.password, ownerUser.name);
    await registerUser(request, inviteeUser.email, inviteeUser.password, inviteeUser.name);

    // Create a team as the owner
    await loginUser(request, ownerUser.email, ownerUser.password);
    const createResponse = await request.post('/api/teams', {
      data: { name: `E2E Invitation Team ${Date.now()}` },
    });
    const team = await createResponse.json();
    teamId = team.id;
  });

  test.afterAll(async ({ request }) => {
    await loginUser(request, ownerUser.email, ownerUser.password);
    try {
      await request.delete(`/api/teams/${teamId}`);
    } catch {
      // Team may already be deleted
    }
  });

  test('Invite member via invitations endpoint succeeds', async ({ request }) => {
    await loginUser(request, ownerUser.email, ownerUser.password);

    const response = await request.post(`/api/teams/${teamId}/invitations`, {
      data: {
        email: inviteeUser.email,
        role: 'member',
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.invitation).toBeDefined();
    expect(data.invitation.email).toBe(inviteeUser.email.toLowerCase());
    expect(data.invitation.role).toBe('member');
    expect(data.invitation.id).toBeTruthy();
    expect(data.invitation.expiresAt).toBeTruthy();
  });

  test('Invite with invalid email format returns 400', async ({ request }) => {
    await loginUser(request, ownerUser.email, ownerUser.password);

    const response = await request.post(`/api/teams/${teamId}/invitations`, {
      data: {
        email: 'not-an-email',
        role: 'member',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error.toLowerCase()).toContain('email');
  });

  test('Invite with invalid role returns 400', async ({ request }) => {
    await loginUser(request, ownerUser.email, ownerUser.password);

    const response = await request.post(`/api/teams/${teamId}/invitations`, {
      data: {
        email: 'newuser@test.com',
        role: 'superadmin', // Invalid role
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error.toLowerCase()).toContain('role');
  });

  test('Duplicate invitation returns 400', async ({ request }) => {
    await loginUser(request, ownerUser.email, ownerUser.password);

    // First invitation was already sent in the previous test
    const response = await request.post(`/api/teams/${teamId}/invitations`, {
      data: {
        email: inviteeUser.email,
        role: 'member',
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error.toLowerCase()).toContain('already');
  });

  test('List pending invitations returns invitation list', async ({ request }) => {
    await loginUser(request, ownerUser.email, ownerUser.password);

    const response = await request.get(`/api/teams/${teamId}/invitations`);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.invitations).toBeDefined();
    expect(Array.isArray(data.invitations)).toBe(true);
    expect(data.invitations.length).toBeGreaterThanOrEqual(1);

    // Check invitation fields
    const invitation = data.invitations[0];
    expect(invitation.id).toBeTruthy();
    expect(invitation.email).toBeTruthy();
    expect(invitation.role).toBeTruthy();
    expect(invitation.invitedBy).toBeDefined();
    expect(invitation.expiresAt).toBeTruthy();
  });
});

test.describe('Teams Flow - Members', () => {
  let ownerUser: { email: string; password: string; name: string };
  let teamId: string;

  test.beforeAll(async ({ request }) => {
    ownerUser = generateUniqueUser();
    await registerUser(request, ownerUser.email, ownerUser.password, ownerUser.name);

    await loginUser(request, ownerUser.email, ownerUser.password);
    const createResponse = await request.post('/api/teams', {
      data: { name: `E2E Members Team ${Date.now()}` },
    });
    const team = await createResponse.json();
    teamId = team.id;
  });

  test.afterAll(async ({ request }) => {
    await loginUser(request, ownerUser.email, ownerUser.password);
    try {
      await request.delete(`/api/teams/${teamId}`);
    } catch {
      // Team may already be deleted
    }
  });

  test('List team members shows the owner', async ({ request }) => {
    await loginUser(request, ownerUser.email, ownerUser.password);

    // Get team details which includes members
    const response = await request.get(`/api/teams/${teamId}`);

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.members).toBeDefined();
    expect(Array.isArray(data.members)).toBe(true);
    expect(data.members.length).toBeGreaterThanOrEqual(1);

    // Owner should be in the member list
    const owner = data.members.find(
      (m: { role: string }) => m.role === 'owner'
    );
    expect(owner).toBeTruthy();
    expect(owner.user).toBeDefined();
    expect(owner.user.email).toBe(ownerUser.email.toLowerCase());
  });
});

test.describe('Teams Flow - Access Control', () => {
  let user1: { email: string; password: string; name: string };
  let user2: { email: string; password: string; name: string };
  let user1TeamId: string;

  test.beforeAll(async ({ request }) => {
    user1 = generateUniqueUser();
    user2 = generateUniqueUser();

    await registerUser(request, user1.email, user1.password, user1.name);
    await registerUser(request, user2.email, user2.password, user2.name);

    // User1 creates a team
    await loginUser(request, user1.email, user1.password);
    const createResponse = await request.post('/api/teams', {
      data: { name: `E2E ACL Team ${Date.now()}` },
    });
    const team = await createResponse.json();
    user1TeamId = team.id;
  });

  test.afterAll(async ({ request }) => {
    await loginUser(request, user1.email, user1.password);
    try {
      await request.delete(`/api/teams/${user1TeamId}`);
    } catch {
      // Team may already be deleted
    }
  });

  test('Non-member cannot access team details', async ({ request }) => {
    await loginUser(request, user2.email, user2.password);

    const response = await request.get(`/api/teams/${user1TeamId}`);

    expect(response.status()).toBe(404);
  });

  test('Non-owner cannot delete team', async ({ request }) => {
    await loginUser(request, user2.email, user2.password);

    const response = await request.delete(`/api/teams/${user1TeamId}`);

    // Should be either 403 (not authorized) or 404 (not found/not a member)
    expect([403, 404]).toContain(response.status());
  });

  test('Non-member cannot invite to team', async ({ request }) => {
    await loginUser(request, user2.email, user2.password);

    const response = await request.post(`/api/teams/${user1TeamId}/invitations`, {
      data: {
        email: 'someone@test.com',
        role: 'member',
      },
    });

    // Should be denied - either 403 or 404
    expect([403, 404]).toContain(response.status());
  });

  test('User only sees their own teams in the list', async ({ request }) => {
    await loginUser(request, user2.email, user2.password);

    const response = await request.get('/api/teams');
    const teams = await response.json();

    // User2 should not see user1's team
    const found = teams.find((t: { id: string }) => t.id === user1TeamId);
    expect(found).toBeUndefined();
  });
});
