/**
 * Parameterized Cypher queries for Team-Matching & Candidate Ranking
 */

export const TEAM_MATCH_QUERY = `
UNWIND $skills AS reqSkill
MATCH (candidate:Person)-[hs:HAS_SKILL]->(s:Skill {name: reqSkill})
WHERE ($minLevel IS NULL OR hs.level >= $minLevel)
  AND ($seekerId IS NULL OR candidate.id <> $seekerId)

// Compute distance to seeker (if seekerId provided)
OPTIONAL MATCH pToSeeker = shortestPath((candidate)-[:KNOWS*1..4]-(seeker:Person {id: $seekerId}))
OPTIONAL MATCH (candidate)-[wa:WORKS_AT]->(c:Company)

WITH candidate,
     collect(DISTINCT c.name)[0] AS companyName,
     collect(DISTINCT {
       skillName: s.name,
       category: s.category,
       level: hs.level,
       years: hs.years
     }) AS matchedSkills,
     avg(hs.level) AS avgSkillLevel,
     min(CASE WHEN pToSeeker IS NOT NULL THEN length(pToSeeker) ELSE 99 END) AS hopsToSeeker,
     collect(CASE WHEN pToSeeker IS NOT NULL THEN [n in nodes(pToSeeker) | n.name] ELSE [] END)[0] AS pathChain

// Mutual connections count with seeker
OPTIONAL MATCH (candidate)-[:KNOWS]-(mutual:Person)-[:KNOWS]-(seeker:Person {id: $seekerId})
WHERE candidate.id <> seeker.id

WITH candidate, companyName, matchedSkills, avgSkillLevel, hopsToSeeker, pathChain,
     count(DISTINCT mutual) AS mutualCount,
     collect(DISTINCT mutual.name)[0..3] AS mutualNames

// Calculate match score: weighted by skill count, avg level, and network proximity
WITH candidate, companyName, matchedSkills, avgSkillLevel, hopsToSeeker, pathChain, mutualCount, mutualNames,
     size(matchedSkills) AS matchedSkillCount,
     (size(matchedSkills) * 35.0) + (avgSkillLevel * 10.0) + (CASE WHEN hopsToSeeker = 1 THEN 30.0 WHEN hopsToSeeker = 2 THEN 20.0 WHEN hopsToSeeker = 3 THEN 10.0 ELSE 0.0 END) + (mutualCount * 5.0) AS matchScore

RETURN candidate.id AS id,
       candidate.name AS name,
       candidate.title AS title,
       candidate.bio AS bio,
       candidate.avatarUrl AS avatarUrl,
       candidate.location AS location,
       candidate.experienceYears AS experienceYears,
       companyName,
       matchedSkills,
       matchedSkillCount,
       avgSkillLevel,
       hopsToSeeker,
       pathChain,
       mutualCount,
       mutualNames,
       round(matchScore) AS matchScore
ORDER BY matchedSkillCount DESC, matchScore DESC, avgSkillLevel DESC
LIMIT $limit
`;
