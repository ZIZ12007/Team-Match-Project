import { getDriver, executeWriteQuery, executeReadQuery } from './db.js';
import {
  ANCHOR_PEOPLE,
  COMPANIES,
  SKILLS,
  PROJECTS,
} from './data.js';

const FIRST_NAMES = [
  'Liam', 'Olivia', 'Noah', 'Emma', 'Oliver', 'Ava', 'Elijah', 'Charlotte', 'William', 'Sophia',
  'James', 'Amelia', 'Benjamin', 'Isabella', 'Lucas', 'Mia', 'Henry', 'Evelyn', 'Alexander', 'Harper',
  'Mason', 'Camila', 'Michael', 'Gianna', 'Ethan', 'Abigail', 'Daniel', 'Luna', 'Jacob', 'Ella',
  'Logan', 'Elizabeth', 'Jackson', 'Sofia', 'Levi', 'Emily', 'Sebastian', 'Avery', 'Mateo', 'Mila',
  'Jack', 'Aria', 'Owen', 'Scarlett', 'Theodore', 'Penelope', 'Aiden', 'Layla', 'Samuel', 'Chloe',
  'John', 'Victoria', 'David', 'Madison', 'Wyatt', 'Eleanor', 'Matthew', 'Grace', 'Luke', 'Nora',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
];

const TECH_ROLES = [
  'Frontend Engineer', 'Full Stack Developer', 'Backend Architect', 'Machine Learning Engineer',
  'AI Research Associate', 'Data Platform Engineer', 'DevOps & SRE Specialist', 'Product Designer',
  'Graph Systems Engineer', 'Distributed Systems Specialist', 'Developer Advocate', 'Engineering Manager',
  'Security Engineer', 'Cloud Infrastructure Engineer', 'Mobile App Developer',
];

const LOCATIONS = [
  'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Boston, MA',
  'London, UK', 'Berlin, Germany', 'Toronto, Canada', 'Paris, France', 'Tokyo, Japan',
  'Dublin, Ireland', 'Remote, US', 'Remote, Europe',
];

const CONNECTION_CONTEXTS = [
  'Ex-colleagues at Stripe',
  'Co-authored open source graph repository',
  'Met at NeurIPS Conference',
  'Former Stanford CS classmates',
  'Collaborated on Wexa AI hackathon',
  'Pair-programmed on distributed consensus engine',
  'Frequent tech podcast co-hosts',
  'Advisory board peer at CognoDB',
  'Mentorship connection via Graph Fellowship',
  'Worked on Vercel Edge Runtime migration',
  'Met at GraphQL & Cypher Summit',
  'Early team member at AI startup accelerator',
];

export function generateAllPeople() {
  const people = [...ANCHOR_PEOPLE];
  let idCounter = 21;

  for (let i = 0; i < 65; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i * 3 + 7) % LAST_NAMES.length];
    const name = `${fn} ${ln}`;
    const role = TECH_ROLES[i % TECH_ROLES.length];
    const loc = LOCATIONS[i % LOCATIONS.length];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}@${i % 2 === 0 ? 'startup' : 'tech'}.io`;
    const exp = 2 + (i % 12);
    const id = `p${idCounter++}`;
    const avatarUrl = `https://images.unsplash.com/photo-${1530000000000 + (i * 1234567) % 900000000}?w=150&auto=format&fit=crop&q=80`;

    people.push({
      id,
      email,
      name,
      title: `${exp > 7 ? 'Staff ' : exp > 4 ? 'Senior ' : ''}${role}`,
      bio: `Passionate about scalable systems, graph-centric data modeling, and modern developer tooling. ${exp}+ years building software.`,
      location: loc,
      avatarUrl,
      experienceYears: exp,
    });
  }

  return people;
}

export async function seedDatabase() {
  console.log('🌱 Starting CognoDB graph database seeding...');
  const driver = getDriver();
  const session = driver.session();

  try {
    // 1. Create Unique Constraints / Indices for fast MERGE
    try {
      await session.run(`CREATE CONSTRAINT person_id_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE`);
      await session.run(`CREATE CONSTRAINT skill_name_unique IF NOT EXISTS FOR (s:Skill) REQUIRE s.name IS UNIQUE`);
      await session.run(`CREATE CONSTRAINT project_id_unique IF NOT EXISTS FOR (pr:Project) REQUIRE pr.id IS UNIQUE`);
      await session.run(`CREATE CONSTRAINT company_id_unique IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE`);
    } catch (constraintErr) {
      console.log('Index / constraint notice:', constraintErr.message);
    }

    // 2. Seed Skills
    console.log(`Seeding ${SKILLS.length} skills...`);
    for (const skill of SKILLS) {
      await session.run(
        `MERGE (s:Skill {id: $id})
         SET s.name = $name, s.category = $category`,
        { id: skill.id, name: skill.name, category: skill.category }
      );
    }

    // 3. Seed Companies
    console.log(`Seeding ${COMPANIES.length} companies...`);
    for (const comp of COMPANIES) {
      await session.run(
        `MERGE (c:Company {id: $id})
         SET c.name = $name, c.industry = $industry, c.size = $size, c.location = $location`,
        { id: comp.id, name: comp.name, industry: comp.industry, size: comp.size, location: comp.location }
      );
    }

    // 4. Seed Projects & Project-to-Company / Project-to-Skill relationships
    console.log(`Seeding ${PROJECTS.length} projects...`);
    for (const proj of PROJECTS) {
      await session.run(
        `MERGE (pr:Project {id: $id})
         SET pr.name = $name, pr.summary = $summary, pr.status = $status`,
        { id: proj.id, name: proj.name, summary: proj.summary, status: proj.status }
      );

      // Link Project -> Company
      await session.run(
        `MATCH (pr:Project {id: $projId}), (c:Company {id: $compId})
         MERGE (pr)-[:BUILT_FOR]->(c)`,
        { projId: proj.id, compId: proj.companyId }
      );

      // Link Project -> Required Skills
      for (const skillName of proj.requiredSkills) {
        await session.run(
          `MATCH (pr:Project {id: $projId}), (s:Skill {name: $skillName})
           MERGE (pr)-[:REQUIRES_SKILL]->(s)`,
          { projId: proj.id, skillName }
        );
      }
    }

    // 5. Seed People
    const allPeople = generateAllPeople();
    console.log(`Seeding ${allPeople.length} people...`);

    for (let i = 0; i < allPeople.length; i++) {
      const p = allPeople[i];
      await session.run(
        `MERGE (person:Person {id: $id})
         SET person.name = $name,
             person.email = $email,
             person.title = $title,
             person.bio = $bio,
             person.location = $location,
             person.avatarUrl = $avatarUrl,
             person.experienceYears = $experienceYears`,
        {
          id: p.id,
          name: p.name,
          email: p.email,
          title: p.title,
          bio: p.bio,
          location: p.location,
          avatarUrl: p.avatarUrl,
          experienceYears: p.experienceYears,
        }
      );

      // Assign Company: Anchor people have defined companies; generated people get matched
      const comp = p.companyId
        ? COMPANIES.find((c) => c.id === p.companyId)
        : COMPANIES[i % COMPANIES.length];

      if (comp) {
        await session.run(
          `MATCH (person:Person {id: $pId}), (comp:Company {id: $cId})
           MERGE (person)-[wa:WORKS_AT]->(comp)
           SET wa.role = $role, wa.since = $since`,
          {
            pId: p.id,
            cId: comp.id,
            role: p.companyRole || p.title,
            since: p.companySince || `${2019 + (i % 6)}`,
          }
        );
      }

      // Assign Skills: Anchor skills or generated skills
      if (p.skills && p.skills.length > 0) {
        for (const sk of p.skills) {
          await session.run(
            `MATCH (person:Person {id: $pId}), (s:Skill {name: $sName})
             MERGE (person)-[hs:HAS_SKILL]->(s)
             SET hs.level = $level, hs.years = $years`,
            { pId: p.id, sName: sk.name, level: sk.level, years: sk.years }
          );
        }
      } else {
        // Assign 3-6 skills procedurally based on index
        const numSkills = 3 + (i % 4);
        for (let sIdx = 0; sIdx < numSkills; sIdx++) {
          const skillObj = SKILLS[(i * 3 + sIdx) % SKILLS.length];
          const level = 2 + ((i + sIdx) % 4);
          const years = 1 + ((i + sIdx * 2) % 9);
          await session.run(
            `MATCH (person:Person {id: $pId}), (s:Skill {id: $sId})
             MERGE (person)-[hs:HAS_SKILL]->(s)
             SET hs.level = $level, hs.years = $years`,
            { pId: p.id, sId: skillObj.id, level, years }
          );
        }
      }

      // Assign Projects
      if (p.projectIds && p.projectIds.length > 0) {
        for (const prId of p.projectIds) {
          await session.run(
            `MATCH (person:Person {id: $pId}), (pr:Project {id: $prId})
             MERGE (person)-[wo:WORKED_ON]->(pr)
             SET wo.role = 'Core Contributor', wo.months = 14`,
            { pId: p.id, prId }
          );
        }
      } else if (i % 2 === 0) {
        const pr = PROJECTS[i % PROJECTS.length];
        await session.run(
          `MATCH (person:Person {id: $pId}), (pr:Project {id: $prId})
           MERGE (person)-[wo:WORKED_ON]->(pr)
           SET wo.role = 'Engineer', wo.months = $months`,
          { pId: p.id, prId: pr.id, months: 6 + (i % 18) }
        );
      }

      // Explicit mentorship
      if (p.mentorId) {
        await session.run(
          `MATCH (mentee:Person {id: $menteeId}), (mentor:Person {id: $mentorId})
           MERGE (mentee)-[:MENTORED_BY]->(mentor)`,
          { menteeId: p.id, mentorId: p.mentorId }
        );
      }
      if (p.mentees && p.mentees.length > 0) {
        for (const menteeId of p.mentees) {
          await session.run(
            `MATCH (mentee:Person {id: $menteeId}), (mentor:Person {id: $mentorId})
             MERGE (mentee)-[:MENTORED_BY]->(mentor)`,
            { menteeId, mentorId: p.id }
          );
        }
      }
    }

    // 6. Generate Realistic Social Graph KNOWS relationships
    console.log('🔗 Wiring rich multi-hop KNOWS graph connections...');

    // A. Anchor hub interconnects (Elena, Marcus, Aria, Devon, Tariq, etc.)
    const anchorIds = ANCHOR_PEOPLE.map((p) => p.id);
    for (let a = 0; a < anchorIds.length; a++) {
      for (let b = a + 1; b < anchorIds.length; b++) {
        if ((a + b) % 2 === 0 || Math.abs(a - b) <= 2) {
          const ctx = CONNECTION_CONTEXTS[(a * 3 + b) % CONNECTION_CONTEXTS.length];
          await session.run(
            `MATCH (p1:Person {id: $id1}), (p2:Person {id: $id2})
             MERGE (p1)-[k:KNOWS]-(p2)
             SET k.context = $ctx, k.strength = $strength`,
            { id1: anchorIds[a], id2: anchorIds[b], ctx, strength: 4 + ((a + b) % 2) }
          );
        }
      }
    }

    // B. Intra-company connections (colleagues know each other)
    await session.run(`
      MATCH (p1:Person)-[:WORKS_AT]->(c:Company)<-[:WORKS_AT]-(p2:Person)
      WHERE p1.id < p2.id
      MERGE (p1)-[k:KNOWS]-(p2)
      ON CREATE SET k.context = 'Colleagues at ' + c.name, k.strength = 4
    `);

    // C. Project teammates know each other
    await session.run(`
      MATCH (p1:Person)-[:WORKED_ON]->(pr:Project)<-[:WORKED_ON]-(p2:Person)
      WHERE p1.id < p2.id
      MERGE (p1)-[k:KNOWS]-(p2)
      ON CREATE SET k.context = 'Collaborated on ' + pr.name, k.strength = 5
    `);

    // D. Small-world network links (connect anchor hubs to general population)
    for (let i = 0; i < allPeople.length; i++) {
      const p = allPeople[i];
      // Connect each person to 2-4 other people to guarantee multi-hop graph connectivity
      const target1 = anchorIds[i % anchorIds.length];
      const target2 = allPeople[(i * 7 + 3) % allPeople.length].id;
      const target3 = allPeople[(i * 13 + 5) % allPeople.length].id;

      for (const targetId of [target1, target2, target3]) {
        if (p.id !== targetId) {
          const ctx = CONNECTION_CONTEXTS[(i + targetId.charCodeAt(1)) % CONNECTION_CONTEXTS.length];
          await session.run(
            `MATCH (p1:Person {id: $id1}), (p2:Person {id: $id2})
             MERGE (p1)-[k:KNOWS]-(p2)
             ON CREATE SET k.context = $ctx, k.strength = 3`,
            { id1: p.id, id2: targetId, ctx }
          );
        }
      }
    }

    // 7. Verify Counts
    const countsResult = await session.run(`
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

    const record = countsResult.records[0];
    const counts = {
      people: Number(record.get('peopleCount')),
      skills: Number(record.get('skillsCount')),
      projects: Number(record.get('projectsCount')),
      companies: Number(record.get('companiesCount')),
      relationships: Number(record.get('relationshipsCount')),
    };

    console.log('✅ Graph database seeding complete:', counts);

    return {
      success: true,
      message: `Successfully seeded graph with ${counts.people} people, ${counts.skills} skills, ${counts.projects} projects, and ${counts.relationships} relationships.`,
      counts,
    };
  } catch (err) {
    console.error('❌ Error during CognoDB seeding:', err);
    throw err;
  } finally {
    await session.close();
  }
}
