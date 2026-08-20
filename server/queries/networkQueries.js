/**
 * Parameterized Cypher queries for multi-hop network traversal,
 * variable-length shortest paths, and visual graph exploration.
 */

// Multi-hop traversal (2+ hops)
// "Who in my extended network (friend-of-friend) has a skill my project needs?"
export const MULTI_HOP_SKILL_QUERY = `
MATCH (me:Person {id: $personId})
MATCH (candidate:Person)-[hs:HAS_SKILL]->(s:Skill)
WHERE me <> candidate
  AND ($skillName IS NULL OR $skillName = '' OR s.name = $skillName)
MATCH path = shortestPath((me)-[:KNOWS*1..3]-(candidate))
WITH me, candidate, s, hs, length(path) AS hops, [n in nodes(path) | { id: n.id, name: n.name, title: n.title, avatarUrl: n.avatarUrl }] AS pathNodes
OPTIONAL MATCH (candidate)-[wa:WORKS_AT]->(c:Company)
RETURN candidate.id AS id,
       candidate.name AS name,
       candidate.title AS title,
       candidate.avatarUrl AS avatarUrl,
       candidate.location AS location,
       c.name AS companyName,
       s.name AS skillName,
       hs.level AS skillLevel,
       hs.years AS skillYears,
       hops,
       pathNodes
ORDER BY hops ASC, hs.level DESC
LIMIT $limit
`;

// Variable-length shortest path between two people
// Returns full node chain, relationship details, and degrees of separation
export const SHORTEST_PATH_QUERY = `
MATCH (a:Person {id: $personA}), (b:Person {id: $personB})
MATCH path = shortestPath((a)-[:KNOWS*..6]-(b))
RETURN [n IN nodes(path) | {
         id: n.id,
         name: n.name,
         title: n.title,
         avatarUrl: n.avatarUrl,
         location: n.location
       }] AS chain,
       [r IN relationships(path) | {
         type: type(r),
         context: r.context
       }] AS relationshipContexts,
       length(path) AS degrees
`;

// 3-hop pattern match with NOT EXISTS exclusion
// "Find people who share a project with someone who shares a skill with me, but whom I don't already know"
export const AWKWARD_SQL_PATTERN_QUERY = `
MATCH (me:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)<-[:HAS_SKILL]-(peer:Person)
MATCH (peer)-[:WORKED_ON]->(proj:Project)<-[:WORKED_ON]-(candidate:Person)
WHERE me <> peer 
  AND me <> candidate 
  AND peer <> candidate
  AND NOT (me)-[:KNOWS]-(candidate)
OPTIONAL MATCH (candidate)-[:WORKS_AT]->(comp:Company)
OPTIONAL MATCH (candidate)-[chs:HAS_SKILL]->(cs:Skill)
WITH me, s, peer, proj, candidate, comp, collect(DISTINCT cs.name)[0..4] as candidateSkills
RETURN candidate.id AS id,
       candidate.name AS name,
       candidate.title AS title,
       candidate.avatarUrl AS avatarUrl,
       comp.name AS companyName,
       s.name AS sharedBridgeSkill,
       peer.name AS intermediaryPeer,
       proj.name AS sharedProject,
       candidateSkills
LIMIT 12
`;

// Subgraph extractor for Interactive Graph Canvas (1-2 hop focused neighborhood around target node)
export const GRAPH_EXPLORER_SUBGRAPH_QUERY = `
MATCH (center:Person {id: $centerId})

// 1-hop direct connections (up to 12 direct peers)
OPTIONAL MATCH (center)-[k1:KNOWS]-(p1:Person)
WITH center, [p IN collect(DISTINCT p1)[0..12] WHERE p IS NOT NULL] AS directPeers

// 2-hop connections through direct peers (up to 8 mutual connections)
OPTIONAL MATCH (p:Person)-[k2:KNOWS]-(p2:Person)
WHERE p IN directPeers AND p2 <> center AND NOT p2 IN directPeers
WITH center, directPeers, [p IN collect(DISTINCT p2)[0..8] WHERE p IS NOT NULL] AS secondPeers

WITH [center] + directPeers + secondPeers AS people, center

// Skills connected to the focused subgraph (capped to prevent DOM/canvas overload)
OPTIONAL MATCH (person:Person)-[hs:HAS_SKILL]->(s:Skill)
WHERE person IN people AND s IS NOT NULL
WITH people, center, [s IN collect(DISTINCT s)[0..25] WHERE s IS NOT NULL] AS skills

// Projects connected to the focused subgraph
OPTIONAL MATCH (person:Person)-[wo:WORKED_ON]->(pr:Project)
WHERE person IN people AND pr IS NOT NULL
WITH people, center, skills, [pr IN collect(DISTINCT pr)[0..12] WHERE pr IS NOT NULL] AS projects

// Companies connected to the focused subgraph
OPTIONAL MATCH (person:Person)-[wa:WORKS_AT]->(c:Company)
WHERE person IN people AND c IS NOT NULL
WITH people, center, skills, projects, [c IN collect(DISTINCT c)[0..8] WHERE c IS NOT NULL] AS companies

// Inter-person KNOWS relationships within the subgraph
OPTIONAL MATCH (p1:Person)-[k:KNOWS]-(p2:Person)
WHERE p1 IN people AND p2 IN people AND p1.id < p2.id AND k IS NOT NULL
WITH people, center, skills, projects, companies,
     [link IN collect(DISTINCT CASE WHEN k IS NOT NULL AND p1 IS NOT NULL AND p2 IS NOT NULL THEN { source: p1.id, target: p2.id, type: 'KNOWS', label: 'knows', context: k.context } ELSE null END) WHERE link IS NOT NULL] AS knowsLinks

// HAS_SKILL relationships within the subgraph
OPTIONAL MATCH (p:Person)-[hs:HAS_SKILL]->(s:Skill)
WHERE p IN people AND s IN skills AND hs IS NOT NULL
WITH people, center, skills, projects, companies, knowsLinks,
     [link IN collect(DISTINCT CASE WHEN hs IS NOT NULL AND p IS NOT NULL AND s IS NOT NULL THEN { source: p.id, target: s.id, type: 'HAS_SKILL', label: 'has_skill', level: hs.level } ELSE null END) WHERE link IS NOT NULL] AS skillLinks

// WORKED_ON relationships within the subgraph
OPTIONAL MATCH (p:Person)-[wo:WORKED_ON]->(pr:Project)
WHERE p IN people AND pr IN projects AND wo IS NOT NULL
WITH people, center, skills, projects, companies, knowsLinks, skillLinks,
     [link IN collect(DISTINCT CASE WHEN wo IS NOT NULL AND p IS NOT NULL AND pr IS NOT NULL THEN { source: p.id, target: pr.id, type: 'WORKED_ON', label: 'worked_on', role: wo.role } ELSE null END) WHERE link IS NOT NULL] AS projectLinks

// WORKS_AT relationships within the subgraph
OPTIONAL MATCH (p:Person)-[wa:WORKS_AT]->(c:Company)
WHERE p IN people AND c IN companies AND wa IS NOT NULL
WITH people, center, skills, projects, companies, knowsLinks, skillLinks, projectLinks,
     [link IN collect(DISTINCT CASE WHEN wa IS NOT NULL AND p IS NOT NULL AND c IS NOT NULL THEN { source: p.id, target: c.id, type: 'WORKS_AT', label: 'works_at', role: wa.role } ELSE null END) WHERE link IS NOT NULL] AS companyLinks

RETURN [p IN people WHERE p IS NOT NULL AND p.id IS NOT NULL | { id: p.id, name: p.name, label: 'Person', title: p.title, avatarUrl: p.avatarUrl, isCenter: (p.id = $centerId) }] AS personNodes,
       [s IN skills WHERE s IS NOT NULL AND s.id IS NOT NULL | { id: s.id, name: s.name, label: 'Skill', category: s.category }] AS skillNodes,
       [pr IN projects WHERE pr IS NOT NULL AND pr.id IS NOT NULL | { id: pr.id, name: pr.name, label: 'Project', status: pr.status }] AS projectNodes,
       [c IN companies WHERE c IS NOT NULL AND c.id IS NOT NULL | { id: c.id, name: c.name, label: 'Company', industry: c.industry }] AS companyNodes,
       [l IN (knowsLinks + skillLinks + projectLinks + companyLinks) WHERE l IS NOT NULL AND l.source IS NOT NULL AND l.target IS NOT NULL] AS links
`;
