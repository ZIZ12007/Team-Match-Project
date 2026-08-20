export class ApiError extends Error {
  constructor(message, status, isDbDown = false, details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isDbDown = isDbDown;
    this.details = details;
  }
}

async function fetchJson(url, options = {}) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (res.status === 503) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(
        data.message || 'CognoDB graph database is currently unreachable or starting up.',
        503,
        true,
        data
      );
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.message || `Request failed with status ${res.status}`, res.status, false, data);
    }

    return await res.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network connection error', 0, false);
  }
}

export const api = {
  checkHealth: () => fetchJson('/api/health'),
  getHealth: () => fetchJson('/api/health'),

  getStats: () => fetchJson('/api/stats'),

  seedDatabase: () => fetchJson('/api/seed', { method: 'POST' }),

  searchPeople: (params = {}) => {
    const query = new URLSearchParams();
    if (params.q) query.set('q', params.q);
    if (params.skills && Array.isArray(params.skills) && params.skills.length > 0) {
      query.set('skills', params.skills.join(','));
    } else if (params.skill) {
      query.set('skill', params.skill);
    }
    if (params.skillMode) query.set('skillMode', params.skillMode);
    if (params.company) query.set('company', params.company);
    if (params.limit) query.set('limit', String(params.limit));
    return fetchJson(`/api/people?${query.toString()}`);
  },

  getPersonProfile: (id) => fetchJson(`/api/people/${id}`),

  getPersonNetwork: (id, skill, limit = 15) => {
    const query = new URLSearchParams();
    if (skill) query.set('skill', skill);
    query.set('limit', String(limit));
    return fetchJson(`/api/people/${id}/network?${query.toString()}`);
  },

  getPersonGraph: (id) => fetchJson(`/api/people/${id}/graph`),

  getSkills: () => fetchJson('/api/skills'),

  getSkillExperts: (skillName, limit = 15) =>
    fetchJson(`/api/skills/${encodeURIComponent(skillName)}/experts?limit=${limit}`),

  matchTeam: (payload) =>
    fetchJson('/api/match', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getShortestPath: (fromId, toId) =>
    fetchJson(`/api/path?from=${encodeURIComponent(fromId)}&to=${encodeURIComponent(toId)}`),

  getCypherShowcase: () => fetchJson('/api/cypher/showcase'),

  runCypherQuery: (payload) =>
    fetchJson('/api/cypher/run', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Authentication & Registration API
  getDemoAccounts: () => fetchJson('/api/auth/demo-accounts'),

  register: (payload) =>
    fetchJson('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyEmail: (payload) =>
    fetchJson('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resendCode: (email) =>
    fetchJson('/api/auth/resend-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  login: (payload) =>
    fetchJson('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: (token) =>
    fetchJson('/api/auth/me', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  logout: (token) =>
    fetchJson('/api/auth/logout', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  // Notifications & Interactive Offer / Connection System
  getNotifications: (token, userId) =>
    fetchJson(`/api/notifications${userId ? `?userId=${userId}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  markAlertsRead: (token, userId) =>
    fetchJson('/api/notifications/mark-read', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ userId }),
    }),

  sendTeamOffer: (payload, token) =>
    fetchJson('/api/offers/send', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(payload),
    }),

  respondToOffer: (offerId, status, token) =>
    fetchJson(`/api/offers/${encodeURIComponent(offerId)}/respond`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ status }),
    }),

  withdrawOffer: (offerId, token) =>
    fetchJson(`/api/offers/${encodeURIComponent(offerId)}/withdraw`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }),

  sendConnectionRequest: (payload, token) =>
    fetchJson('/api/connections/request', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify(payload),
    }),

  respondToConnectionRequest: (reqId, status, token) =>
    fetchJson(`/api/connections/${encodeURIComponent(reqId)}/respond`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: JSON.stringify({ status }),
    }),
};

