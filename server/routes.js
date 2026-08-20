import { Router } from 'express';
import { executeReadQuery, executeWriteQuery, verifyConnection, getDriver } from './db.js';
import { SEARCH_PEOPLE_QUERY, GET_PERSON_PROFILE_QUERY } from './queries/peopleQueries.js';
import {
  MULTI_HOP_SKILL_QUERY,
  SHORTEST_PATH_QUERY,
  AWKWARD_SQL_PATTERN_QUERY,
  GRAPH_EXPLORER_SUBGRAPH_QUERY,
} from './queries/networkQueries.js';
import { TEAM_MATCH_QUERY } from './queries/matchQueries.js';
import { GET_ALL_SKILLS_QUERY, GET_SKILL_EXPERTS_QUERY } from './queries/skillQueries.js';
import { CYPHER_SHOWCASE_QUERIES } from './queries/cypherShowcase.js';
import { seedDatabase } from './seed.js';
import {
  initiateRegistration,
  completeVerification,
  resendVerificationCode,
  authenticateUser,
  getUserByToken,
  removeSession,
  DEMO_ACCOUNTS,
} from './auth.js';
import {
  getNotifications,
  sendTeamOffer,
  respondToTeamOffer,
  sendConnectionRequest,
  respondToConnectionRequest,
  markAlertsRead,
} from './notifications.js';

export const apiRouter = Router();

/**
 * Health check endpoint (PRD Section 7 & 10.3)
 * Polled on load to decide whether to show a DB-down banner
 * Returns 503 if DB is unreachable.
 */
apiRouter.get('/health', async (req, res) => {
  try {
    const health = await verifyConnection();
    if (!health.ok) {
      return res.status(503).json({
        status: 'error',
        error: 'graph_unreachable',
        message: health.message,
        details: health.error,
      });
    }

    // Fetch live node and relationship counts
    const countData = await executeReadQuery(`
      MATCH (p:Person)
      WITH count(p) AS peopleCount
      MATCH (s:Skill)
      WITH peopleCount, count(s) AS skillsCount
      MATCH (pr:Project)
      WITH peopleCount, skillsCount, count(pr) AS projectsCount
      MATCH (c:Company)
      WITH peopleCount, skillsCount, projectsCount, count(c) AS companiesCount
      MATCH ()-[r]->()
      RETURN peopleCount, skillsCount, projectsCount, companiesCount, count(r) AS relationshipsCount
    `);

    const stats = countData[0] || {
      peopleCount: 0,
      skillsCount: 0,
      projectsCount: 0,
      companiesCount: 0,
      relationshipsCount: 0,
    };

    return res.json({
      status: 'ok',
      connected: true,
      database: 'CognoDB Cloud (Neo4j-compatible)',
      stats: {
        people: stats.peopleCount,
        skills: stats.skillsCount,
        projects: stats.projectsCount,
        companies: stats.companiesCount,
        relationships: stats.relationshipsCount,
      },
    });
  } catch (err) {
    console.error('Health check error:', err);
    return res.status(503).json({
      status: 'error',
      error: 'graph_unreachable',
      message: 'CognoDB database is unreachable',
      details: err.message,
    });
  }
});

/**
 * GET /api/stats
 * High-level analytics and distributions
 */
apiRouter.get('/stats', async (req, res) => {
  try {
    const [counts] = await executeReadQuery(`
      MATCH (p:Person)
      WITH count(p) AS peopleCount
      MATCH (s:Skill)
      WITH peopleCount, count(s) AS skillsCount
      MATCH (pr:Project)
      WITH peopleCount, skillsCount, count(pr) AS projectsCount
      MATCH (c:Company)
      WITH peopleCount, skillsCount, projectsCount, count(c) AS companiesCount
      MATCH ()-[r]->()
      RETURN peopleCount, skillsCount, projectsCount, companiesCount, count(r) AS relationshipsCount
    `);

    const topSkills = await executeReadQuery(`
      MATCH (s:Skill)<-[:HAS_SKILL]-(p:Person)
      RETURN s.name AS name, s.category AS category, count(p) AS count
      ORDER BY count DESC
      LIMIT 8
    `);

    const companyDist = await executeReadQuery(`
      MATCH (c:Company)<-[:WORKS_AT]-(p:Person)
      RETURN c.name AS name, c.industry AS industry, count(p) AS headcount
      ORDER BY headcount DESC
      LIMIT 8
    `);

    return res.json({
      counts: counts || {},
      topSkills,
      companyDist,
    });
  } catch (err) {
    console.error('Stats error:', err);
    return res.status(503).json({ error: 'graph_unreachable', message: err.message });
  }
});

/**
 * POST /api/seed
 * Run idempotent seed script to populate CognoDB
 */
apiRouter.post('/seed', async (req, res) => {
  try {
    const result = await seedDatabase();
    return res.json(result);
  } catch (err) {
    console.error('Seeding error:', err);
    return res.status(500).json({
      success: false,
      error: 'seeding_failed',
      message: err.message,
    });
  }
});

/**
 * GET /api/people
 * Search people by name, multi-skills, or company/title (PRD Section 7)
 */
apiRouter.get('/people', async (req, res) => {
  try {
    const { q, skill, skills, skillMode = 'any', company, limit = '48' } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 48));

    // Handle multiple skills (comma-separated or single)
    let skillList = [];
    if (skills) {
      skillList = String(skills)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (skill) {
      skillList = [String(skill).trim()];
    }

    const rawRecords = await executeReadQuery(SEARCH_PEOPLE_QUERY, {
      q: q ? String(q).trim() : null,
      skills: skillList.length > 0 ? skillList : null,
      skillMode: skillMode === 'all' ? 'all' : 'any',
      company: company ? String(company).trim() : null,
      limit: limitNum,
    });

    // Deduplicate by person ID to guarantee 100% unique React keys
    const seenIds = new Set();
    const records = [];
    for (const r of rawRecords) {
      if (r && r.id && !seenIds.has(r.id)) {
        seenIds.add(r.id);
        records.push(r);
      }
    }

    return res.json({
      people: records,
      total: records.length,
    });
  } catch (err) {
    console.error('People search error:', err);
    return res.status(503).json({ error: 'graph_unreachable', message: err.message });
  }
});

/**
 * GET /api/people/:id
 * Person profile: skills, projects, company, direct connections, mentors (PRD Section 7)
 */
apiRouter.get('/people/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const records = await executeReadQuery(GET_PERSON_PROFILE_QUERY, { personId: id });

    if (!records || records.length === 0) {
      return res.status(404).json({ error: 'person_not_found', message: `Person with ID "${id}" was not found.` });
    }

    return res.json(records[0]);
  } catch (err) {
    console.error('Person profile error:', err);
    return res.status(503).json({ error: 'graph_unreachable', message: err.message });
  }
});

/**
 * GET /api/people/:id/network
 * Multi-hop: people reachable within N hops with shared skills (PRD Section 7 & 8.1)
 */
apiRouter.get('/people/:id/network', async (req, res) => {
  try {
    const { id } = req.params;
    const { skill, limit = '15' } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 15));

    const records = await executeReadQuery(MULTI_HOP_SKILL_QUERY, {
      personId: id,
      skillName: skill ? String(skill).trim() : null,
      limit: limitNum,
    });

    return res.json({
      personId: id,
      skill: skill || 'All skills',
      candidates: records,
    });
  } catch (err) {
    console.error('Multi-hop network error:', err);
    return res.status(503).json({ error: 'graph_unreachable', message: err.message });
  }
});

/**
 * GET /api/people/:id/graph
 * Subgraph extraction for visual network explorer centered around a person
 */
apiRouter.get('/people/:id/graph', async (req, res) => {
  try {
    const { id } = req.params;
    const records = await executeReadQuery(GRAPH_EXPLORER_SUBGRAPH_QUERY, { centerId: id });

    if (!records || records.length === 0) {
      return res.status(404).json({ error: 'person_not_found', message: `Person with ID "${id}" was not found.` });
    }

    const data = records[0];
    const rawNodes = [
      ...(data.personNodes || []),
      ...(data.skillNodes || []),
      ...(data.projectNodes || []),
      ...(data.companyNodes || []),
    ];

    // Deduplicate and filter valid nodes
    const nodeMap = new Map();
    for (const n of rawNodes) {
      if (n && n.id && !nodeMap.has(n.id)) {
        nodeMap.set(n.id, n);
      }
    }
    const nodes = Array.from(nodeMap.values());

    // Sanitize links: ensure both endpoints exist in the nodeMap
    const validLinks = (data.links || []).filter(
      (l) => l && l.source && l.target && nodeMap.has(l.source) && nodeMap.has(l.target)
    );

    return res.json({
      centerId: id,
      nodes,
      links: validLinks,
    });
  } catch (err) {
    console.error('Graph explorer error:', err);
    return res.status(503).json({ error: 'graph_unreachable', message: err.message });
  }
});

/**
 * GET /api/skills
 * List all skills with usage counts
 */
apiRouter.get('/skills', async (req, res) => {
  try {
    const skills = await executeReadQuery(GET_ALL_SKILLS_QUERY);
    return res.json({ skills });
  } catch (err) {
    console.error('Skills error:', err);
    return res.status(503).json({ error: 'graph_unreachable', message: err.message });
  }
});

/**
 * GET /api/skills/:name/experts
 * People with a skill, ranked by level and connection strength (PRD Section 7)
 */
apiRouter.get('/skills/:name/experts', async (req, res) => {
  try {
    const { name } = req.params;
    const { limit = '15' } = req.query;
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 15));

    const records = await executeReadQuery(GET_SKILL_EXPERTS_QUERY, {
      skillName: decodeURIComponent(name),
      limit: limitNum,
    });

    return res.json({
      skillName: decodeURIComponent(name),
      experts: records,
    });
  } catch (err) {
    console.error('Skill experts error:', err);
    return res.status(503).json({ error: 'graph_unreachable', message: err.message });
  }
});

/**
 * POST /api/match
 * Given a required skill set, find the best-connected candidates (PRD Section 7)
 */
apiRouter.post('/match', async (req, res) => {
  try {
    const { skills, seekerId = null, minLevel = 1, limit = 12 } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'invalid_request', message: 'Please provide at least one required skill.' });
    }

    const records = await executeReadQuery(TEAM_MATCH_QUERY, {
      skills,
      seekerId: seekerId || null,
      minLevel: Number(minLevel) || 1,
      limit: Number(limit) || 12,
    });

    return res.json({
      requiredSkills: skills,
      seekerId,
      results: records,
    });
  } catch (err) {
    console.error('Match error:', err);
    return res.status(503).json({ error: 'graph_unreachable', message: err.message });
  }
});

/**
 * GET /api/path
 * Shortest path between two people (PRD Section 8.2)
 */
apiRouter.get('/path', async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: 'missing_parameters', message: 'Both "from" and "to" person IDs are required.' });
    }

    if (String(from) === String(to)) {
      const records = await executeReadQuery('MATCH (p:Person {id: $personId}) RETURN p.id AS id, p.name AS name, p.title AS title, p.avatarUrl AS avatarUrl, p.location AS location', { personId: String(from) });
      const p = records?.[0];
      return res.json({
        found: true,
        chain: p ? [p] : [],
        relationshipContexts: [],
        degrees: 0,
      });
    }

    const records = await executeReadQuery(SHORTEST_PATH_QUERY, {
      personA: String(from),
      personB: String(to),
    });

    if (!records || records.length === 0 || !records[0].chain) {
      return res.json({
        found: false,
        message: 'No path found between these two people within 6 degrees of separation.',
        chain: [],
        degrees: 0,
      });
    }

    return res.json({
      found: true,
      chain: records[0].chain,
      relationshipContexts: records[0].relationshipContexts || [],
      degrees: records[0].degrees,
    });
  } catch (err) {
    console.error('Shortest path error:', err);
    return res.status(503).json({ error: 'graph_unreachable', message: err.message });
  }
});

/**
 * GET /api/cypher/showcase
 * Predefined queries comparing Cypher with SQL equivalents
 */
apiRouter.get('/cypher/showcase', (req, res) => {
  return res.json({ queries: CYPHER_SHOWCASE_QUERIES });
});

/**
 * POST /api/cypher/run
 * Execute a Cypher query (read-only) with timing metrics for live showcase
 */
apiRouter.post('/cypher/run', async (req, res) => {
  try {
    const { queryId, customCypher, params = {} } = req.body;
    let cypherToRun = customCypher;
    let queryParams = params;

    if (queryId) {
      const showcaseItem = CYPHER_SHOWCASE_QUERIES.find((q) => q.id === queryId);
      if (showcaseItem) {
        cypherToRun = showcaseItem.cypher;
        queryParams = { ...showcaseItem.defaultParams, ...params };
      }
    }

    if (!cypherToRun) {
      return res.status(400).json({ error: 'missing_query', message: 'No Cypher query specified.' });
    }

    // Safety check: only allow read queries
    const lower = cypherToRun.toLowerCase().trim();
    if (lower.startsWith('delete') || lower.startsWith('drop') || lower.includes(' detach delete ')) {
      return res.status(403).json({ error: 'unsafe_query', message: 'Destructive Cypher queries are disabled in the showcase.' });
    }

    const startTime = Date.now();
    const records = await executeReadQuery(cypherToRun, queryParams);
    const executionMs = Date.now() - startTime;

    return res.json({
      success: true,
      records,
      recordCount: records.length,
      executionMs,
      cypher: cypherToRun,
      params: queryParams,
    });
  } catch (err) {
    console.error('Cypher run error:', err);
    return res.status(500).json({
      success: false,
      error: 'query_execution_failed',
      message: err.message,
    });
  }
});

/**
 * PDF Documentation Download endpoint
 */
apiRouter.get('/docs/pdf', (req, res) => {
  const filePath = new URL('../public/Startup_Graph_Documentation.pdf', import.meta.url).pathname;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'inline; filename="Startup_Graph_Documentation.pdf"');
  res.sendFile(filePath);
});

// ==========================================
// AUTHENTICATION & USER REGISTRATION ROUTES
// ==========================================

/**
 * GET /api/auth/demo-accounts
 */
apiRouter.get('/auth/demo-accounts', (req, res) => {
  return res.json({ success: true, accounts: DEMO_ACCOUNTS });
});

/**
 * POST /api/auth/register
 * Step 1: Submit profile details, generates email verification code
 */
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const result = await initiateRegistration(req.body);
    return res.json(result);
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(400).json({
      success: false,
      error: 'registration_failed',
      message: err.message || 'Failed to initiate registration.',
    });
  }
});

/**
 * POST /api/auth/verify-email
 * Step 2: Validates code, creates Graph Person node with skills and edges, returns session
 */
apiRouter.post('/auth/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'missing_fields',
        message: 'Email and 6-digit verification code are required.',
      });
    }
    const result = await completeVerification({ email, code });
    return res.json(result);
  } catch (err) {
    console.error('Verification error:', err);
    return res.status(400).json({
      success: false,
      error: 'verification_failed',
      message: err.message || 'Verification failed.',
    });
  }
});

/**
 * POST /api/auth/resend-code
 */
apiRouter.post('/auth/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'missing_email',
        message: 'Email is required to resend code.',
      });
    }
    const result = await resendVerificationCode(email);
    return res.json(result);
  } catch (err) {
    console.error('Resend code error:', err);
    return res.status(400).json({
      success: false,
      error: 'resend_failed',
      message: err.message || 'Failed to resend verification code.',
    });
  }
});

/**
 * POST /api/auth/login
 * Log in via email/password or 1-Click Demo Account
 */
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const result = await authenticateUser(req.body);
    return res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    return res.status(401).json({
      success: false,
      error: 'login_failed',
      message: err.message || 'Invalid credentials.',
    });
  }
});

/**
 * GET /api/auth/me
 * Fetch current authenticated user
 */
apiRouter.get('/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const user = getUserByToken(token);

    if (!user) {
      return res.status(401).json({ success: false, authenticated: false, user: null });
    }

    return res.json({
      success: true,
      authenticated: true,
      user,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/auth/logout
 */
apiRouter.post('/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  removeSession(token);
  return res.json({ success: true, message: 'Logged out successfully.' });
});

/**
 * GET /api/notifications
 * Fetch live notification badges, incoming team offers, and connection requests
 */
apiRouter.get('/notifications', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const user = getUserByToken(token);
    const userId = user?.id || req.query.userId || 'default';

    const data = getNotifications(userId);
    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/notifications/mark-read
 */
apiRouter.post('/notifications/mark-read', (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const user = getUserByToken(token);
    const userId = user?.id || req.body.userId || 'default';

    markAlertsRead(userId);
    return res.json({ success: true, message: 'Alerts marked as read.' });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/offers/send
 * Recruiter or Founder extends a formal team offer to a candidate
 */
apiRouter.post('/offers/send', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const user = getUserByToken(token);

    const recruiter = user || {
      id: req.body.recruiterId || 'p1',
      name: req.body.recruiterName || 'Founding Lead',
      company: req.body.teamName || 'Apex AI',
      avatarUrl: req.body.recruiterAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    };

    const {
      candidateId,
      candidateName,
      candidateAvatar,
      roleName,
      teamName,
      equity,
      comp,
      note,
    } = req.body;

    const result = await sendTeamOffer({
      recruiter,
      candidateId,
      candidateName,
      candidateAvatar,
      roleName,
      teamName,
      equity,
      comp,
      note,
    });

    return res.json(result);
  } catch (err) {
    console.error('Error sending team offer:', err);
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/offers/:offerId/respond
 * Candidate accepts or declines a team offer
 */
apiRouter.post('/offers/:offerId/respond', async (req, res) => {
  try {
    const { offerId } = req.params;
    const { status } = req.body; // 'accepted' | 'declined'
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const user = getUserByToken(token);

    const result = await respondToTeamOffer({ offerId, status, user });
    return res.json(result);
  } catch (err) {
    console.error('Error responding to offer:', err);
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/offers/:offerId/withdraw
 * Recruiter cancels a pending sent offer
 */
apiRouter.post('/offers/:offerId/withdraw', async (req, res) => {
  try {
    const { offerId } = req.params;
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const user = getUserByToken(token);

    const result = await withdrawTeamOffer({ offerId, user });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/connections/request
 * Send a warm graph connection request
 */
apiRouter.post('/connections/request', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const user = getUserByToken(token);

    const sender = user || {
      id: req.body.senderId || 'p1',
      name: req.body.senderName || 'Elena Rostova',
      title: 'Founder & CEO',
      company: 'Apex Robotics AI',
    };

    const { receiverId, context } = req.body;
    const result = await sendConnectionRequest({ sender, receiverId, context });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/connections/:reqId/respond
 * Accept or decline a connection request
 */
apiRouter.post('/connections/:reqId/respond', async (req, res) => {
  try {
    const { reqId } = req.params;
    const { status } = req.body; // 'accepted' | 'declined'
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    const user = getUserByToken(token);

    const result = await respondToConnectionRequest({ reqId, status, user });
    return res.json(result);
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});


