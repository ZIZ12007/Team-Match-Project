export const CYPHER_SHOWCASE_QUERIES = [
  {
    id: 'multi-hop-skill',
    title: 'Multi-Hop Skill Search (Friend of Friend)',
    category: 'Traversals',
    description: 'Find people in my extended 1-2 hop network who possess a specific required skill, ordered by connection proximity and skill proficiency.',
    cypher: `MATCH (me:Person {id: $personId})
MATCH (candidate:Person)-[hs:HAS_SKILL]->(s:Skill {name: $skillName})
WHERE me <> candidate
MATCH path = shortestPath((me)-[:KNOWS*1..2]-(candidate))
RETURN DISTINCT candidate.name AS name,
       candidate.title AS title,
       hs.level AS skillLevel,
       hs.years AS skillYears,
       length(path) AS hops
ORDER BY hops ASC, skillLevel DESC
LIMIT 10`,
    defaultParams: {
      personId: 'p1',
      skillName: 'PyTorch',
    },
    sqlEquivalent: `-- Requires multiple self-joins with UNION or recursive CTE
WITH RECURSIVE network AS (
  SELECT target_id, 1 AS depth FROM knows WHERE source_id = 'p1'
  UNION
  SELECT k.target_id, n.depth + 1 FROM knows k
  JOIN network n ON k.source_id = n.target_id
  WHERE n.depth < 2
)
SELECT DISTINCT p.name, p.title, ps.level, ps.years, n.depth AS hops
FROM network n
JOIN people p ON p.id = n.target_id
JOIN person_skills ps ON ps.person_id = p.id
JOIN skills s ON s.id = ps.skill_id
WHERE s.name = 'PyTorch' AND p.id != 'p1'
ORDER BY hops ASC, ps.level DESC LIMIT 10;`,
    whyGraphWins: 'In Cypher, `[:KNOWS*1..2]` natively traverses pointer-chased relationships without constructing large intermediate cross-product join tables in memory.',
  },
  {
    id: 'variable-shortest-path',
    title: 'Variable-Length Shortest Path (Six Degrees)',
    category: 'Graph Algorithms',
    description: 'Calculates the shortest chain of mutual acquaintances between any two people in the network without pre-specifying depth.',
    cypher: `MATCH (a:Person {id: $personA}), (b:Person {id: $personB})
MATCH path = shortestPath((a)-[:KNOWS*..6]-(b))
RETURN [n IN nodes(path) | n.name] AS chain,
       [r IN relationships(path) | r.context] AS contexts,
       length(path) AS degreesOfSeparation`,
    defaultParams: {
      personA: 'p1',
      personB: 'p14',
    },
    sqlEquivalent: `-- Requires unbounded recursive CTE with loop detection & path tracking
WITH RECURSIVE path_cte AS (
  SELECT source_id, target_id, ARRAY[source_id, target_id] AS path, 1 AS depth
  FROM knows WHERE source_id = 'p1'
  UNION ALL
  SELECT p.source_id, k.target_id, p.path || k.target_id, p.depth + 1
  FROM knows k
  JOIN path_cte p ON k.source_id = p.target_id
  WHERE NOT (k.target_id = ANY(p.path)) AND p.depth < 6
)
SELECT path, depth FROM path_cte
WHERE target_id = 'p14'
ORDER BY depth ASC LIMIT 1;`,
    whyGraphWins: 'In SQL, recursive CTEs quickly suffer combinatorial explosion and require manual cycle detection array checks. In Cypher, `shortestPath()` uses bidirectional BFS (Breadth-First Search) directly on node pointers in O(V + E) time.',
  },
  {
    id: 'pattern-exclusion',
    title: '3-Hop Skill & Project Pattern with Exclusion',
    category: 'Pattern Matching',
    description: 'Discover people who worked on projects with someone sharing my skills, but whom I do not already know (warm introductory candidates).',
    cypher: `MATCH (me:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)<-[:HAS_SKILL]-(peer:Person)
MATCH (peer)-[:WORKED_ON]->(proj:Project)<-[:WORKED_ON]-(candidate:Person)
WHERE me <> peer 
  AND me <> candidate 
  AND peer <> candidate
  AND NOT (me)-[:KNOWS]-(candidate)
RETURN DISTINCT candidate.name AS candidateName,
       candidate.title AS candidateTitle,
       s.name AS sharedSkill,
       peer.name AS intermediaryPeer,
       proj.name AS sharedProject
LIMIT 8`,
    defaultParams: {
      personId: 'p1',
    },
    sqlEquivalent: `-- Requires 5 table joins plus a NOT EXISTS correlated subquery
SELECT DISTINCT c.name AS candidate_name, s.name AS shared_skill,
       peer.name AS peer_name, pr.name AS project_name
FROM people me
JOIN person_skills ps1 ON ps1.person_id = me.id
JOIN skills s ON s.id = ps1.skill_id
JOIN person_skills ps2 ON ps2.skill_id = s.id AND ps2.person_id != me.id
JOIN people peer ON peer.id = ps2.person_id
JOIN project_members pm1 ON pm1.project_id = peer.id
JOIN projects pr ON pr.id = pm1.project_id
JOIN project_members pm2 ON pm2.project_id = pr.id AND pm2.person_id NOT IN (me.id, peer.id)
JOIN people c ON c.id = pm2.person_id
WHERE me.id = 'p1'
  AND NOT EXISTS (
    SELECT 1 FROM knows k 
    WHERE (k.source_id = me.id AND k.target_id = c.id)
       OR (k.source_id = c.id AND k.target_id = me.id)
  )
LIMIT 8;`,
    whyGraphWins: 'ASCII-art graph syntax `(me)-[]->(s)<-[]-(peer)-[]->(proj)<-[]-(candidate)` expresses multi-entity topologies concisely. The engine executes graph pattern matching in single-digit milliseconds without join thrashing.',
  },
  {
    id: 'shared-mentorship-cluster',
    title: 'Mentorship Lineage & Skill Inheritance',
    category: 'Hierarchy & Mentorship',
    description: 'Find mentors and their downstream mentees who share mastery in frontend or AI engineering.',
    cypher: `MATCH (mentor:Person)<-[:MENTORED_BY]-(mentee:Person)
MATCH (mentor)-[hs1:HAS_SKILL]->(s:Skill)<-[hs2:HAS_SKILL]-(mentee)
WHERE hs1.level >= 4 AND hs2.level >= 3
RETURN mentor.name AS mentorName,
       mentee.name AS menteeName,
       s.name AS inheritedSkill,
       hs1.level AS mentorLevel,
       hs2.level AS menteeLevel
ORDER BY mentor.name, s.name
LIMIT 10`,
    defaultParams: {},
    sqlEquivalent: `SELECT m.name AS mentor_name, me.name AS mentee_name,
       s.name AS inherited_skill, ps1.level AS mentor_level, ps2.level AS mentee_level
FROM mentorships ms
JOIN people m ON m.id = ms.mentor_id
JOIN people me ON me.id = ms.mentee_id
JOIN person_skills ps1 ON ps1.person_id = m.id AND ps1.level >= 4
JOIN person_skills ps2 ON ps2.person_id = me.id AND ps2.level >= 3 AND ps2.skill_id = ps1.skill_id
JOIN skills s ON s.id = ps1.skill_id
ORDER BY m.name, s.name LIMIT 10;`,
    whyGraphWins: 'Graph relationships have first-class properties and direction, making hierarchical workflows, team trees, and knowledge transfer easy to express.',
  },
];
