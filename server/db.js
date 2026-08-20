import neo4j from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.COGNODB_URI || 'bolt+s://db-c83cb839.bravo.databases.cognodb.com';
const user = process.env.COGNODB_USER || 'cognodb';
const password = process.env.COGNODB_PASSWORD || '69428aaa11bf5a69a688beead1952efc';

let driverInstance = null;

export function getDriver() {
  if (!driverInstance) {
    driverInstance = neo4j.driver(
      uri,
      neo4j.auth.basic(user, password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 20000,
        disableLosslessIntegers: true, // Automatically converts Neo4j Integers to JS numbers
      }
    );
  }
  return driverInstance;
}

export async function verifyConnection() {
  const driver = getDriver();
  try {
    await driver.verifyConnectivity();
    return { ok: true, message: 'Connected to CognoDB Cloud successfully' };
  } catch (err) {
    console.error('CognoDB connectivity verification failed:', err.message);
    return { ok: false, message: 'Failed to connect to CognoDB Cloud', error: err.message };
  }
}

/**
 * Execute a read Cypher query with automatic session management
 */
export async function executeReadQuery(cypher, params = {}) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.executeRead(async (tx) => {
      const queryResult = await tx.run(cypher, params);
      return queryResult.records.map((record) => {
        const obj = {};
        record.keys.forEach((key) => {
          const val = record.get(key);
          obj[String(key)] = normalizeNeo4jValue(val);
        });
        return obj;
      });
    });
    return result;
  } finally {
    await session.close();
  }
}

/**
 * Execute a write Cypher query with automatic session management
 */
export async function executeWriteQuery(cypher, params = {}) {
  const driver = getDriver();
  const session = driver.session();
  try {
    const result = await session.executeWrite(async (tx) => {
      const queryResult = await tx.run(cypher, params);
      return queryResult.records.map((record) => {
        const obj = {};
        record.keys.forEach((key) => {
          const val = record.get(key);
          obj[String(key)] = normalizeNeo4jValue(val);
        });
        return obj;
      });
    });
    return result;
  } finally {
    await session.close();
  }
}

/**
 * Helper to safely convert Neo4j types (Integers, Nodes, Relationships, Paths) to plain JSON
 */
export function normalizeNeo4jValue(val) {
  if (val === null || val === undefined) return val;

  // Neo4j Integer
  if (neo4j.isInt(val)) {
    return val.toNumber();
  }

  // Array
  if (Array.isArray(val)) {
    return val.map(normalizeNeo4jValue);
  }

  // Neo4j Node
  if (val && typeof val === 'object' && 'labels' in val && 'properties' in val) {
    return {
      _id: val.identity ? normalizeNeo4jValue(val.identity) : val.elementId,
      labels: val.labels,
      properties: normalizeNeo4jValue(val.properties),
    };
  }

  // Neo4j Relationship
  if (val && typeof val === 'object' && 'type' in val && 'properties' in val && 'start' in val && 'end' in val) {
    return {
      _id: val.identity ? normalizeNeo4jValue(val.identity) : val.elementId,
      type: val.type,
      start: normalizeNeo4jValue(val.start),
      end: normalizeNeo4jValue(val.end),
      properties: normalizeNeo4jValue(val.properties),
    };
  }

  // Neo4j Path
  if (val && typeof val === 'object' && 'segments' in val && 'start' in val && 'end' in val) {
    return {
      length: val.length,
      start: normalizeNeo4jValue(val.start),
      end: normalizeNeo4jValue(val.end),
      segments: val.segments.map((seg) => ({
        start: normalizeNeo4jValue(seg.start),
        relationship: normalizeNeo4jValue(seg.relationship),
        end: normalizeNeo4jValue(seg.end),
      })),
    };
  }

  // Plain object
  if (typeof val === 'object') {
    const res = {};
    for (const key of Object.keys(val)) {
      res[key] = normalizeNeo4jValue(val[key]);
    }
    return res;
  }

  return val;
}
