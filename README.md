# Startup Team-Matching Graph
**Wexa AI — CognoDB Assignment**

A graph-powered talent search and startup team-matching platform backed by **CognoDB** (a Neo4j-compatible graph database over the Bolt protocol). The platform enables founders, hiring leads, and engineers to explore talent, staff project teams, and uncover warm introduction pathways using native Cypher traversals.

---

## 1. Use Case & Problem Statement

In startup hiring, who someone knows and who they have previously built with is often more predictive of success than a resume keyword match. Answering relationship- and skill-based queries:
- *"Who in my extended network (friend-of-friend) has a skill my project needs?"*
- *"What is the shortest chain of mutual introductions between two founders or engineers?"*
- *"Find engineers who worked on projects with someone sharing my skills, but whom I do not already know."*

In a traditional Relational Database (SQL), these queries require recursive Common Table Expressions (CTEs), multiple self-joins with Cartesian product explosion, and manual cycle detection arrays. In **CognoDB / Cypher**, these are natural, single-clause pointer-chasing graph traversals executed in milliseconds.

---

## 2. Why a Graph Database? (Awkward-in-SQL Analysis)

### 2.1 Multi-Hop Traversal (2+ Hops)
*Query: "Who in my extended network has PyTorch or Cypher experience?"*
- **Cypher:**
  ```cypher
  MATCH (me:Person {id: $personId})-[:KNOWS*1..2]-(candidate:Person)
  MATCH (candidate)-[hs:HAS_SKILL]->(s:Skill {name: $skillName})
  WHERE me <> candidate
  RETURN DISTINCT candidate.name AS name, candidate.title AS title, hs.level AS level,
         length((me)-[:KNOWS*1..2]-(candidate)) AS hops
  ORDER BY hops ASC, hs.level DESC LIMIT 10
  ```
- **Why SQL Struggles:** Requires an explicit `WITH RECURSIVE` CTE or multiple `UNION` self-joins against the `knows` join table, multiplying table rows at each depth and consuming exponential memory.

### 2.2 Variable-Length Shortest Path (Six Degrees of Separation)
*Query: "Find the shortest chain of introductions between Person A and Person B."*
- **Cypher:**
  ```cypher
  MATCH (a:Person {id: $personA}), (b:Person {id: $personB})
  MATCH path = shortestPath((a)-[:KNOWS*..6]-(b))
  RETURN [n IN nodes(path) | n.name] AS chain,
         [r IN relationships(path) | r.context] AS contexts,
         length(path) AS degrees
  ```
- **Why SQL Struggles:** In SQL, finding the shortest path across arbitrary depth requires unbounded recursion with array-based cycle tracking (`ARRAY[source_id, target_id]`) to prevent infinite loops, which degrades rapidly on graphs with dense cycles. Cypher uses bidirectional Breadth-First Search (BFS) directly on node pointers in $O(V + E)$ time.

### 2.3 3-Hop Pattern Match with Exclusion (Warm Introductions)
*Query: "Find people who worked on projects with someone sharing my skills, but whom I don't already know."*
- **Cypher:**
  ```cypher
  MATCH (me:Person {id: $personId})-[:HAS_SKILL]->(s:Skill)<-[:HAS_SKILL]-(peer:Person)
  MATCH (peer)-[:WORKED_ON]->(proj:Project)<-[:WORKED_ON]-(candidate:Person)
  WHERE me <> peer AND me <> candidate AND peer <> candidate
    AND NOT (me)-[:KNOWS]-(candidate)
  RETURN candidate.name, s.name AS sharedSkill, peer.name AS intermediary, proj.name AS sharedProject
  ```
- **Why SQL Struggles:** Requires 5 table joins (`people`, `person_skills`, `skills`, `project_members`, `projects`) combined with a `NOT EXISTS` correlated subquery. Cypher expresses multi-entity topologies concisely with ASCII-art arrow syntax without join thrashing.

---

## 3. Data Model Architecture

### Node Types
| Label | Key Properties | Description |
| :--- | :--- | :--- |
| `Person` | `id, name, title, bio, location, email, avatarUrl, experienceYears` | Founders, engineers, and researchers |
| `Skill` | `id, name, category` | E.g. React, Cypher, PyTorch, Rust, Distributed Systems |
| `Project` | `id, name, summary, status` | Built systems (Active, Completed, Beta) |
| `Company` | `id, name, industry, size, location` | Startups, scaleups, and AI labs |

### Relationships
| Relationship | Properties | Description |
| :--- | :--- | :--- |
| `(:Person)-[:HAS_SKILL]->(:Skill)` | `{level: 1..5, years: number}` | Skill proficiency and tenure |
| `(:Person)-[:WORKED_ON]->(:Project)` | `{role: string, months: number}` | Project role and duration |
| `(:Person)-[:KNOWS]->(:Person)` | `{context: string}` | Peer connections (queried bidirectionally) |
| `(:Person)-[:MENTORED_BY]->(:Person)` | - | Hierarchical mentorship links |
| `(:Project)-[:REQUIRES_SKILL]->(:Skill)` | - | Skills a project needs |
| `(:Project)-[:BUILT_FOR]->(:Company)` | - | Company project sponsorship |
| `(:Person)-[:WORKS_AT]->(:Company)` | `{role: string, since: number}` | Employment history |

---

## 4. Backend REST API Endpoints

| Method | Route | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | CognoDB connectivity check (returns 503 if unreachable, 200 with node stats if live) |
| `GET` | `/api/people?q=&skill=&company=` | Search people by keyword, title, bio, skill, or employer |
| `GET` | `/api/people/:id` | Full profile: skills (levels/years), projects, company, 1-hop connections, mentors |
| `GET` | `/api/people/:id/network?skill=` | Multi-hop traversal: people reachable in 1–3 hops with target skill |
| `GET` | `/api/people/:id/graph` | Subgraph extractor (nodes & links) for interactive visual graph canvas |
| `GET` | `/api/skills` | All skills with engineer and project counts |
| `GET` | `/api/skills/:name/experts` | Experts ranked by skill level, experience, and connection centrality |
| `POST` | `/api/match` | Multi-skill candidate ranker with "why matched" proximity breakdown |
| `GET` | `/api/path?from=:id1&to=:id2` | Shortest path between two people with relationship contexts |
| `POST` | `/api/cypher/run` | Safe Cypher runner with execution timing for the interactive Query Lab |
| `POST` | `/api/seed` | Idempotent database seeder (`MERGE` queries) |

---

## 5. Local Setup & Environment

### Prerequisites
- Node.js 18+
- CognoDB Cloud instance (Bolt URI, username, and password)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd wexa-team-graph
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
COGNODB_URI=bolt+s://db-c83cb839.bravo.databases.cognodb.com
COGNODB_USER=cognodb
COGNODB_PASSWORD=your_password_here
PORT=3000
```

### 3. Seed CognoDB (Idempotent)
```bash
npm run seed
```

### 4. Start Development Server
```bash
npm run dev
```
Visit `http://localhost:3000` to interact with the application.

---

## 6. Submission & Architecture Highlights
- **Resilient UI States:** Explicit loading skeletons, actionable empty states, and 503 downtime retry banners.
- **Zero Raw Cypher String Concatenation:** Every Cypher query is strictly parameterised with session cleanup in `finally` blocks.
- **Interactive Force-Directed Visualizer:** Physics simulation with draggable nodes, zoom/pan, and category filtering.
