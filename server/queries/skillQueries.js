/**
 * Parameterized Cypher queries for Skills and Skill Experts
 */

export const GET_ALL_SKILLS_QUERY = `
MATCH (s:Skill)
OPTIONAL MATCH (p:Person)-[:HAS_SKILL]->(s)
OPTIONAL MATCH (pr:Project)-[:REQUIRES_SKILL]->(s)
RETURN s.id AS id,
       s.name AS name,
       s.category AS category,
       count(DISTINCT p) AS personCount,
       count(DISTINCT pr) AS projectCount
ORDER BY personCount DESC, s.name ASC
`;

export const GET_SKILL_EXPERTS_QUERY = `
MATCH (s:Skill {name: $skillName})
MATCH (p:Person)-[hs:HAS_SKILL]->(s)
OPTIONAL MATCH (p)-[wa:WORKS_AT]->(c:Company)
OPTIONAL MATCH (p)-[:KNOWS]-(conn:Person)
WITH p, s, hs, c, count(DISTINCT conn) AS connectionCount
RETURN p.id AS id,
       p.name AS name,
       p.title AS title,
       p.bio AS bio,
       p.location AS location,
       p.avatarUrl AS avatarUrl,
       p.experienceYears AS experienceYears,
       c.name AS companyName,
       hs.level AS level,
       hs.years AS years,
       connectionCount
ORDER BY hs.level DESC, hs.years DESC, connectionCount DESC
LIMIT $limit
`;
