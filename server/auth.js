import crypto from 'crypto';
import { executeWriteQuery, executeReadQuery } from './db.js';

// In-memory pending verifications and active users store
// Key: email -> { email, passwordHash, name, title, company, location, bio, skills, connections, code, codeExpiresAt, createdAt }
const pendingVerifications = new Map();

// Active registered users (key: email or userId)
const registeredUsers = new Map();

// Active sessions (token -> user)
const sessions = new Map();

// Built-in demo accounts linked to existing graph nodes
export const DEMO_ACCOUNTS = [
  {
    id: 'p1',
    name: 'Elena Rostova',
    email: 'elena@startup.ai',
    title: 'Founder & CEO',
    company: 'Apex Robotics AI',
    accountType: 'recruiter', // Recruiter / Founder
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    bio: 'Serial AI founder, ex-DeepMind researcher building next-gen autonomous systems.',
  },
  {
    id: 'p2',
    name: 'Marcus Vance',
    email: 'marcus@startup.ai',
    title: 'CTO & Co-Founder',
    company: 'Apex Robotics AI',
    accountType: 'employee', // Talent / Candidate
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    bio: 'Distributed systems architect, Rust & C++ low latency specialist.',
  },
  {
    id: 'p3',
    name: 'Chloe Dubois',
    email: 'chloe@startup.ai',
    title: 'VP of AI Product',
    company: 'Apex Robotics AI',
    accountType: 'recruiter',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
    bio: 'Product strategist scaling generative AI models to millions of users.',
  },
  {
    id: 'p10',
    name: 'Kenji Takahashi',
    email: 'kenji@startup.ai',
    title: 'Principal Security Lead',
    company: 'CyberShield Systems',
    accountType: 'employee',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    bio: 'Zero-trust architecture, cryptography, and graph database access control.',
  },
];

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateVerificationCode() {
  // Generate random 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Register a new user intent and generate email verification code
 */
export async function initiateRegistration({
  name,
  email,
  password,
  title,
  company,
  accountType = 'employee', // 'employee' or 'recruiter'
  location = 'San Francisco, CA',
  bio = '',
  skills = [],
  connections = [],
}) {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !name || !password) {
    throw new Error('Name, valid email, and password are required.');
  }

  // Check if email already registered in system
  const existing = registeredUsers.get(normalizedEmail);
  if (existing) {
    throw new Error('An account with this email already exists. Please log in.');
  }

  // Check if person exists in graph by email
  const graphCheck = await executeReadQuery(
    `MATCH (p:Person) WHERE toLower(p.email) = $email RETURN p.id AS id`,
    { email: normalizedEmail }
  );
  if (graphCheck.length > 0) {
    throw new Error('An account with this email is already registered in the graph.');
  }

  const code = generateVerificationCode();
  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  const pendingData = {
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    title: title?.trim() || (accountType === 'recruiter' ? 'Founding Partner & Recruiter' : 'Software Engineer'),
    company: company?.trim() || 'Stealth AI Startup',
    accountType: accountType === 'recruiter' ? 'recruiter' : 'employee',
    location: location.trim(),
    bio: bio.trim() || `Passionate ${title || (accountType === 'recruiter' ? 'technical recruiter & founder' : 'engineer')} in modern tech stacks.`,
    skills: skills && skills.length > 0 ? skills : [{ name: 'React & Next.js', level: 4 }, { name: 'TypeScript & JavaScript', level: 4 }],
    connections: connections || [],
    code,
    expiresAt,
    createdAt: Date.now(),
  };

  pendingVerifications.set(normalizedEmail, pendingData);

  console.log(`[AUTH] Verification code for ${normalizedEmail}: ${code}`);

  return {
    success: true,
    email: normalizedEmail,
    requiresVerification: true,
    previewCode: code, // Provided for smooth demonstration/testing
    message: `Verification code sent to ${normalizedEmail}`,
  };
}

/**
 * Resend verification code
 */
export async function resendVerificationCode(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const pending = pendingVerifications.get(normalizedEmail);

  if (!pending) {
    throw new Error('No pending registration found for this email. Please sign up again.');
  }

  const newCode = generateVerificationCode();
  pending.code = newCode;
  pending.expiresAt = Date.now() + 15 * 60 * 1000;

  console.log(`[AUTH] New verification code for ${normalizedEmail}: ${newCode}`);

  return {
    success: true,
    email: normalizedEmail,
    previewCode: newCode,
    message: `New verification code generated for ${normalizedEmail}`,
  };
}

/**
 * Verify email and insert user into Graph Database
 */
export async function completeVerification({ email, code }) {
  const normalizedEmail = email.trim().toLowerCase();
  const pending = pendingVerifications.get(normalizedEmail);

  if (!pending) {
    throw new Error('No pending verification found for this email.');
  }

  if (Date.now() > pending.expiresAt) {
    pendingVerifications.delete(normalizedEmail);
    throw new Error('Verification code has expired. Please request a new code.');
  }

  if (pending.code !== code.trim()) {
    throw new Error('Invalid 6-digit verification code. Please check and try again.');
  }

  // Create unique ID for new person
  const newPersonId = `user_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
  const avatarUrl = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80`;

  // 1. Create Person node in CognoDB graph
  await executeWriteQuery(
    `
    MERGE (p:Person {email: $email})
    ON CREATE SET 
      p.id = $id,
      p.name = $name,
      p.title = $title,
      p.accountType = $accountType,
      p.bio = $bio,
      p.location = $location,
      p.avatarUrl = $avatarUrl,
      p.experienceYears = 5,
      p.emailVerified = true,
      p.isCurrentUser = true,
      p.createdAt = timestamp()
    ON MATCH SET
      p.name = $name,
      p.title = $title,
      p.accountType = $accountType,
      p.bio = $bio,
      p.emailVerified = true
    RETURN p.id AS id
    `,
    {
      id: newPersonId,
      name: pending.name,
      email: normalizedEmail,
      title: pending.title,
      accountType: pending.accountType || 'employee',
      bio: pending.bio,
      location: pending.location,
      avatarUrl,
    }
  );

  // 2. Link or create Company
  if (pending.company) {
    const compId = `comp_${pending.company.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await executeWriteQuery(
      `
      MATCH (p:Person {id: $personId})
      MERGE (c:Company {name: $companyName})
      ON CREATE SET c.id = $compId, c.industry = 'Artificial Intelligence & Software', c.location = $location
      MERGE (p)-[wa:WORKS_AT]->(c)
      ON CREATE SET wa.role = $title, wa.since = 2024
      `,
      {
        personId: newPersonId,
        companyName: pending.company,
        compId,
        title: pending.title,
        location: pending.location,
      }
    );
  }

  // 3. Link Skills
  for (const s of pending.skills) {
    const skillName = typeof s === 'string' ? s : s.name;
    const skillLevel = typeof s === 'object' && s.level ? Number(s.level) : 4;
    const sId = `skill_${skillName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    await executeWriteQuery(
      `
      MATCH (p:Person {id: $personId})
      MERGE (sk:Skill {name: $skillName})
      ON CREATE SET sk.id = $sId, sk.category = 'Technical'
      MERGE (p)-[hs:HAS_SKILL]->(sk)
      SET hs.level = $level, hs.years = 4
      `,
      {
        personId: newPersonId,
        skillName,
        sId,
        level: skillLevel,
      }
    );
  }

  // 4. Link Initial Network Connections (KNOWS)
  if (pending.connections && pending.connections.length > 0) {
    for (const connId of pending.connections) {
      await executeWriteQuery(
        `
        MATCH (p:Person {id: $personId}), (target:Person {id: $targetId})
        MERGE (p)-[k:KNOWS]->(target)
        ON CREATE SET k.context = 'Connected during onboarding', k.strength = 4
        `,
        {
          personId: newPersonId,
          targetId: connId,
        }
      );
    }
  } else {
    // Connect to 2 default network anchors so new user is never an isolated island
    await executeWriteQuery(
      `
      MATCH (p:Person {id: $personId}), (elena:Person {id: 'p1'})
      MERGE (p)-[k:KNOWS]->(elena)
      ON CREATE SET k.context = 'Ecosystem Welcome Connection', k.strength = 3
      `,
      { personId: newPersonId }
    );
  }

  // Store active user record
  const userRecord = {
    id: newPersonId,
    name: pending.name,
    email: normalizedEmail,
    passwordHash: pending.passwordHash,
    title: pending.title,
    accountType: pending.accountType || 'employee',
    company: pending.company,
    location: pending.location,
    bio: pending.bio,
    avatarUrl,
    emailVerified: true,
    createdAt: Date.now(),
  };

  registeredUsers.set(normalizedEmail, userRecord);
  pendingVerifications.delete(normalizedEmail);

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, userRecord);

  return {
    success: true,
    token,
    user: {
      id: userRecord.id,
      name: userRecord.name,
      email: userRecord.email,
      title: userRecord.title,
      accountType: userRecord.accountType,
      company: userRecord.company,
      location: userRecord.location,
      bio: userRecord.bio,
      avatarUrl: userRecord.avatarUrl,
      emailVerified: true,
    },
    message: 'Email verified successfully! Welcome to Startup Graph.',
  };
}

/**
 * Log in a user (or Demo login)
 */
export async function authenticateUser({ email, password, demoAccountId }) {
  // Handle 1-Click Demo Login
  if (demoAccountId) {
    const demo = DEMO_ACCOUNTS.find((d) => d.id === demoAccountId);
    if (!demo) throw new Error('Invalid demo account selected.');

    const token = crypto.randomBytes(32).toString('hex');
    const user = {
      ...demo,
      emailVerified: true,
      isDemo: true,
    };
    sessions.set(token, user);

    return {
      success: true,
      token,
      user,
      message: `Logged in as demo user ${demo.name}`,
    };
  }

  if (!email || !password) {
    throw new Error('Please provide email and password.');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check demo accounts by email
  const demoByEmail = DEMO_ACCOUNTS.find((d) => d.email.toLowerCase() === normalizedEmail);
  if (demoByEmail) {
    const token = crypto.randomBytes(32).toString('hex');
    const user = { ...demoByEmail, emailVerified: true, isDemo: true };
    sessions.set(token, user);
    return {
      success: true,
      token,
      user,
      message: `Logged in as ${demoByEmail.name}`,
    };
  }

  // Check pending unverified
  if (pendingVerifications.has(normalizedEmail)) {
    const pending = pendingVerifications.get(normalizedEmail);
    return {
      success: false,
      requiresVerification: true,
      email: normalizedEmail,
      previewCode: pending.code,
      message: 'Please verify your email address to complete registration.',
    };
  }

  const user = registeredUsers.get(normalizedEmail);
  if (!user) {
    throw new Error('No account found with this email. Please sign up.');
  }

  const hashed = hashPassword(password);
  if (user.passwordHash !== hashed) {
    throw new Error('Incorrect password. Please try again.');
  }

  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, user);

  return {
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      title: user.title,
      accountType: user.accountType || 'employee',
      company: user.company,
      location: user.location,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      emailVerified: true,
    },
    message: `Welcome back, ${user.name}!`,
  };
}

/**
 * Get user by session token
 */
export function getUserByToken(token) {
  if (!token) return null;
  return sessions.get(token) || null;
}

/**
 * Destroy session
 */
export function removeSession(token) {
  if (token) {
    sessions.delete(token);
  }
  return true;
}
