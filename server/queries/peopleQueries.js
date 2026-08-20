/**
 * Parameterized Cypher queries for People searches and Profile views
 */

// Search people with filters (keyword, multi-skills, company, title)
export const SEARCH_PEOPLE_QUERY = `
MATCH (p:Person)
WHERE ($q IS NULL OR $q = '' OR 
       toLower(p.name) CONTAINS toLower($q) OR 
       toLower(p.title) CONTAINS toLower($q) OR 
       toLower(p.bio) CONTAINS toLower($q) OR 
       toLower(p.location) CONTAINS toLower($q))
  AND ($company IS NULL OR $company = '' OR ($company IS NOT NULL AND size([(p)-[:WORKS_AT]->(co:Company) WHERE co.name = $company | 1]) > 0))
  AND (
    $skills IS NULL OR size($skills) = 0 OR
    (
      $skillMode = 'all' AND
      size([skName IN $skills WHERE size([(p)-[:HAS_SKILL]->(sk:Skill) WHERE sk.name = skName | 1]) > 0 | 1]) = size($skills)
    ) OR
    (
      ($skillMode IS NULL OR $skillMode <> 'all') AND
      size([(p)-[:HAS_SKILL]->(sk:Skill) WHERE sk.name IN $skills | 1]) > 0
    )
  )

WITH DISTINCT p

// Primary Company
OPTIONAL MATCH (p)-[wa:WORKS_AT]->(c:Company)
WITH p, collect({
  name: c.name,
  industry: c.industry,
  role: wa.role,
  since: wa.since
}) AS companies

// Skills
OPTIONAL MATCH (p)-[hs:HAS_SKILL]->(s:Skill)
WITH p, companies[0] AS primaryCompany, collect(DISTINCT {
  name: s.name,
  category: s.category,
  level: hs.level,
  years: hs.years
}) AS skills

// Direct connections count & matching skills count
OPTIONAL MATCH (p)-[:KNOWS]-(conn:Person)
WITH p, primaryCompany, skills, count(DISTINCT conn) AS connectionCount,
     size([sk IN skills WHERE $skills IS NOT NULL AND sk.name IN $skills | 1]) AS matchedSkillsCount

RETURN p.id AS id,
       p.name AS name,
       p.title AS title,
       p.bio AS bio,
       p.location AS location,
       p.email AS email,
       p.avatarUrl AS avatarUrl,
       p.experienceYears AS experienceYears,
       primaryCompany.name AS companyName,
       primaryCompany.industry AS companyIndustry,
       primaryCompany.role AS companyRole,
       skills,
       connectionCount,
       matchedSkillsCount
ORDER BY matchedSkillsCount DESC, connectionCount DESC, p.name ASC
LIMIT $limit
`;

// Get full Person Profile with deep relations
export const GET_PERSON_PROFILE_QUERY = `
MATCH (p:Person {id: $personId})

// Skills
OPTIONAL MATCH (p)-[hs:HAS_SKILL]->(s:Skill)
WITH p, collect(DISTINCT {
  id: s.id,
  name: s.name,
  category: s.category,
  level: hs.level,
  years: hs.years
}) AS skills

// Current Company
OPTIONAL MATCH (p)-[wa:WORKS_AT]->(c:Company)
WITH p, skills, collect({
  id: c.id,
  name: c.name,
  industry: c.industry,
  location: c.location,
  role: wa.role,
  since: wa.since
}) AS companies
WITH p, skills, companies[0] AS company

// Projects
OPTIONAL MATCH (p)-[wo:WORKED_ON]->(pr:Project)
OPTIONAL MATCH (pr)-[:BUILT_FOR]->(prComp:Company)
WITH p, skills, company, collect(DISTINCT {
  id: pr.id,
  name: pr.name,
  summary: pr.summary,
  status: pr.status,
  role: wo.role,
  months: wo.months,
  companyName: prComp.name
}) AS rawProjects
WITH p, skills, company, [proj in rawProjects WHERE proj.id IS NOT NULL] AS projects

// Direct Connections (1-hop KNOWS)
OPTIONAL MATCH (p)-[k:KNOWS]-(conn:Person)
OPTIONAL MATCH (conn)-[cwa:WORKS_AT]->(connComp:Company)
WITH p, skills, company, projects, collect(DISTINCT {
  id: conn.id,
  name: conn.name,
  title: conn.title,
  avatarUrl: conn.avatarUrl,
  companyName: connComp.name,
  context: k.context
}) AS rawConnections
WITH p, skills, company, projects, [c in rawConnections WHERE c.id IS NOT NULL] AS connections

// Mentorship
OPTIONAL MATCH (p)-[:MENTORED_BY]->(mentor:Person)
OPTIONAL MATCH (mentee:Person)-[:MENTORED_BY]->(p)
WITH p, skills, company, projects, connections,
     [m in collect(DISTINCT { id: mentor.id, name: mentor.name, title: mentor.title, avatarUrl: mentor.avatarUrl }) WHERE m.id IS NOT NULL] AS mentors,
     [m in collect(DISTINCT { id: mentee.id, name: mentee.name, title: mentee.title, avatarUrl: mentee.avatarUrl }) WHERE m.id IS NOT NULL] AS mentees

RETURN p.id AS id,
       p.name AS name,
       p.title AS title,
       p.bio AS bio,
       p.location AS location,
       p.email AS email,
       p.avatarUrl AS avatarUrl,
       p.experienceYears AS experienceYears,
       company,
       skills,
       projects,
       connections,
       mentors,
       mentees
`;
