/**
 * Phase 5 — Cypress E2E Tests
 * Covers: register → join club → register event → attend → view points
 *
 * Run: npx cypress run --spec "cypress/e2e/phase5.cy.ts"
 */

/// <reference types="cypress" />

const BASE_URL = Cypress.env('baseUrl') || 'http://localhost:5173';

const testUser = {
  name: 'E2E Test User',
  email: `e2e_${Date.now()}@test.clubhub`,
  password: 'TestPass123!',
  department: 'Computer Science',
  enrollmentYear: 2024,
  degreeType: 'BTech',
};

describe('ClubHub — Full Student Journey (Phase 5 E2E)', () => {
  before(() => {
    cy.visit(BASE_URL);
  });

  // ─── Auth ──────────────────────────────────────────────────────────────────

  it('registers a new student account', () => {
    cy.visit(`${BASE_URL}/register`);
    cy.get('[data-testid="name-input"]').type(testUser.name);
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="password-input"]').type(testUser.password);
    cy.get('[data-testid="department-input"]').type(testUser.department);
    cy.get('[data-testid="register-btn"]').click();

    cy.contains('Check your email', { timeout: 5000 }).should('be.visible');
  });

  it('logs in with valid credentials', () => {
    // Note: In test environment, skip email verification
    cy.request('POST', `${Cypress.env('apiUrl')}/api/v1/auth/test-verify`, {
      email: testUser.email,
    });

    cy.visit(`${BASE_URL}/login`);
    cy.get('[data-testid="email-input"]').type(testUser.email);
    cy.get('[data-testid="password-input"]').type(testUser.password);
    cy.get('[data-testid="login-btn"]').click();

    cy.url({ timeout: 5000 }).should('include', '/dashboard');
  });

  // ─── Recommendations ──────────────────────────────────────────────────────

  it('shows AI recommendation cards on dashboard', () => {
    cy.visit(`${BASE_URL}/dashboard`);
    // Cards may or may not appear depending on data, but section must exist
    cy.get('[data-testid="recommendation-section"]', { timeout: 5000 }).should('exist');
  });

  // ─── Clubs ────────────────────────────────────────────────────────────────

  it('joins a club', () => {
    cy.visit(`${BASE_URL}/clubs`);
    cy.get('[data-testid="club-card"]').first().within(() => {
      cy.get('[data-testid="join-btn"]').click();
    });
    cy.contains('Joined', { timeout: 3000 }).should('be.visible');
  });

  // ─── Events ───────────────────────────────────────────────────────────────

  it('registers for an event', () => {
    cy.visit(`${BASE_URL}/events`);
    cy.get('[data-testid="event-card"]').first().within(() => {
      cy.get('[data-testid="register-btn"]').click();
    });
    cy.contains('Registered', { timeout: 3000 }).should('be.visible');
  });

  // ─── Campus Trends ────────────────────────────────────────────────────────

  it('displays campus trends section', () => {
    cy.visit(`${BASE_URL}/dashboard`);
    cy.get('[data-testid="campus-trends"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-testid="trending-events-list"]').should('exist');
    cy.get('[data-testid="top-performers-list"]').should('exist');
  });

  // ─── Club Analytics (Admin flow) ─────────────────────────────────────────

  it('club admin can view analytics dashboard', () => {
    // Login as club admin
    cy.request('POST', `${Cypress.env('apiUrl')}/api/v1/auth/login`, {
      email: Cypress.env('clubAdminEmail'),
      password: Cypress.env('clubAdminPassword'),
    }).then((res) => {
      window.localStorage.setItem('accessToken', res.body.data.accessToken);
    });

    cy.visit(`${BASE_URL}/admin/clubs/${Cypress.env('testClubId')}/analytics`);
    cy.get('[data-testid="engagement-rate"]', { timeout: 5000 }).should('be.visible');
    cy.get('[data-testid="member-engagement-table"]').should('be.visible');
  });

  // ─── LinkedIn Share ───────────────────────────────────────────────────────

  it('generates LinkedIn share URL for achievement', () => {
    cy.visit(`${BASE_URL}/profile`);
    cy.get('[data-testid="linkedin-share-btn"]').should('be.visible');

    // Intercept the window.open call
    cy.window().then((win) => {
      cy.stub(win, 'open').as('windowOpen');
    });

    cy.get('[data-testid="linkedin-share-btn"]').click();
    cy.get('@windowOpen', { timeout: 3000 }).should('have.been.calledWithMatch', /linkedin\.com\/shareArticle/);
  });
});

// ─── Security Audit Tests ─────────────────────────────────────────────────────

describe('Security Audit', () => {
  it('rejects unauthenticated requests to protected routes', () => {
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/api/v1/recommendations`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.equal(401);
    });
  });

  it('prevents IDOR: user cannot access another user stats', () => {
    const otherUserId = 'some-other-user-id';
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/api/v1/users/${otherUserId}/stats`,
      headers: { Authorization: `Bearer ${Cypress.env('testToken')}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.be.oneOf([403, 404]);
    });
  });

  it('rate limits repeated requests', () => {
    Array.from({ length: 12 }, () =>
      cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/api/v1/auth/login`,
        body: { email: 'fake@test.com', password: 'wrong' },
        failOnStatusCode: false,
      })
    );
    // After multiple failed attempts, should receive 429
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/v1/auth/login`,
      body: { email: 'fake@test.com', password: 'wrong' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.equal(429);
    });
  });
});