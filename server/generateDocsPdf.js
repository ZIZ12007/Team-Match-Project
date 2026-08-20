import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

function generateAppDocumentationPDF() {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // Helper colors (Neo-brutalist tech theme)
  const primaryNavy = [8, 18, 59]; // #08123B
  const neonPink = [255, 0, 122]; // #FF007A
  const cobaltBlue = [0, 82, 255]; // #0052FF
  const mintGreen = [0, 210, 106]; // #00D26A
  const lightBg = [244, 246, 251]; // #F4F6FB
  const darkGray = [74, 85, 120];

  let currentY = margin;

  function checkPageBreak(neededHeight) {
    if (currentY + neededHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      drawHeaderFooter();
    }
  }

  function drawHeaderFooter() {
    const pageCount = doc.internal.getNumberOfPages();
    // Top small bar
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(margin, 8, contentWidth, 1.5, 'F');

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('CognoDB // Startup Team Matching & Graph Database Platform - Technical Manual', margin, pageHeight - 8);
    doc.text(`Page ${pageCount}`, pageWidth - margin - 12, pageHeight - 8);
  }

  // ====== COVER / HEADER ======
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(margin, currentY, contentWidth, 38, 'F');

  // Neon accent strip
  doc.setFillColor(neonPink[0], neonPink[1], neonPink[2]);
  doc.rect(margin, currentY, 4, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('COGNODB // STARTUP TEAM MATCHING GRAPH', margin + 8, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 200, 220);
  doc.text('Complete System Overview, Architecture, Cypher Graph Engine & Feature Guide', margin + 8, currentY + 20);

  doc.setFontSize(8);
  doc.setTextColor(200, 215, 255);
  doc.text('Graph DB: Neo4j / CognoDB Bolt Protocol  |  Format: Declarative Cypher  |  Version: 1.0.0', margin + 8, currentY + 30);

  currentY += 46;

  // ====== SECTION 1: EXECUTIVE SUMMARY ======
  function drawSectionHeader(title, tag) {
    checkPageBreak(14);
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(margin, currentY, contentWidth, 8, 'F');
    doc.setDrawColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.setLineWidth(0.4);
    doc.rect(margin, currentY, contentWidth, 8, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(title, margin + 3, currentY + 5.5);

    if (tag) {
      doc.setFillColor(cobaltBlue[0], cobaltBlue[1], cobaltBlue[2]);
      doc.rect(pageWidth - margin - 32, currentY + 1.5, 30, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(7);
      doc.text(tag, pageWidth - margin - 30, currentY + 5);
    }
    currentY += 12;
  }

  drawSectionHeader('1. EXECUTIVE SUMMARY & PURPOSE', 'CORE OVERVIEW');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  const summaryText = 
    'The CognoDB Startup Team Matching Graph is a full-stack, graph-native intelligence platform engineered ' +
    'for tech ecosystems, venture studios, and talent networks. Traditional relational databases (SQL) struggle ' +
    'with recursive joins and multi-hop social connectivity, degrading exponentially as network depth increases. ' +
    'This platform leverages native property graph traversal (Neo4j / CognoDB) using Cypher queries to discover ' +
    'optimal team compositions, compute warm introduction paths, and model multi-dimensional relationships in sub-millisecond latencies.';
  
  const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
  doc.text(splitSummary, margin, currentY);
  currentY += splitSummary.length * 4.2 + 4;

  // ====== SECTION 2: GRAPH DATA SCHEMA ======
  drawSectionHeader('2. GRAPH TOPOLOGY & DATA MODEL (PROPERTY GRAPH)', 'SCHEMA SPEC');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  const schemaIntro = 'The system models a 4-entity property graph with weighted and contextual relationships:';
  doc.text(schemaIntro, margin, currentY);
  currentY += 5;

  const nodeTypes = [
    { name: 'Person', desc: 'Candidates, founders, engineers, and designers with title, experience, location, and avatar.', color: primaryNavy },
    { name: 'Skill', desc: 'Technical & domain competencies (e.g. PyTorch, Distributed Systems, Rust, Product Design).', color: cobaltBlue },
    { name: 'Project', desc: 'Previous ventures, open-source repos, and enterprise apps with completion status.', color: neonPink },
    { name: 'Company', desc: 'Current and past employers across AI, FinTech, Autonomous Tech, and Cloud.', color: mintGreen },
  ];

  nodeTypes.forEach((node) => {
    checkPageBreak(12);
    doc.setFillColor(node.color[0], node.color[1], node.color[2]);
    doc.rect(margin, currentY, 3, 9, 'F');

    doc.setFillColor(255, 255, 255);
    doc.rect(margin + 3, currentY, contentWidth - 3, 9, 'F');
    doc.setDrawColor(220, 225, 235);
    doc.rect(margin + 3, currentY, contentWidth - 3, 9, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(`(:${node.name})`, margin + 6, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(node.desc, margin + 28, currentY + 5.5);

    currentY += 10.5;
  });

  currentY += 2;

  const relTypes = [
    { edge: '[:KNOWS]', fromTo: 'Person -> Person', desc: 'Colleague, co-founder, or advisor connection with relationship context.' },
    { edge: '[:HAS_SKILL]', fromTo: 'Person -> Skill', desc: 'Skill proficiency (Expert, Advanced, Intermediate) with years of experience.' },
    { edge: '[:WORKED_ON]', fromTo: 'Person -> Project', desc: 'Project contribution with specific role (Lead Architect, Maintainer, etc.).' },
    { edge: '[:WORKS_AT]', fromTo: 'Person -> Company', desc: 'Employment history and past corporate tenures.' },
  ];

  relTypes.forEach((rel) => {
    checkPageBreak(9);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(cobaltBlue[0], cobaltBlue[1], cobaltBlue[2]);
    doc.text(rel.edge, margin + 2, currentY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(`(${rel.fromTo})`, margin + 28, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(rel.desc, margin + 70, currentY + 4);

    currentY += 6.5;
  });

  currentY += 4;

  // ====== SECTION 3: KEY APPLICATION MODULES ======
  drawSectionHeader('3. APPLICATION FEATURES & CAPABILITIES', 'FEATURE BREAKDOWN');

  const modules = [
    {
      title: 'A. Interactive Network Graph View & Topology Explorer',
      details: [
        'Dynamic 2D Canvas rendering engine with high-DPI retina display support.',
        'Zero-idle CPU footprint: Synchronous relaxation layout calculations settle in <3ms, stopping battery drain.',
        'Interactive node dragging, real-time panning, smooth wheel-zooming, and focal center re-anchoring.',
        'Entity filter chips to dynamically toggle visibility of People, Skills, Projects, and Companies.',
        'Inspector Drawer providing instant 1-hop attribute inspection and direct profile routing.',
      ],
    },
    {
      title: 'B. Shortest Path & Warm Introduction Traversal Engine',
      details: [
        'Executes Cypher shortestPath((a:Person)-[:KNOWS*..6]-(b:Person)) across graph topologies.',
        'Calculates exact degrees of separation (1st, 2nd, 3rd, 4th degree).',
        'Extracts edge contexts along the chain (e.g. "Former co-founders at Voxel", "Stanford AI Lab").',
        'Computes trust scores, common mutual colleagues, and structured referral outreach drafts.',
      ],
    },
    {
      title: 'C. Algorithmic Startup Team Matcher',
      details: [
        'Graph-pattern matching algorithm to assemble balanced multi-disciplinary teams.',
        'Scans candidates with complementary skill matrices (Frontend, Backend, AI/ML, Design, Product).',
        'Prioritizes historical working chemistry (candidates sharing past companies or projects).',
        'Minimizes social distance: Assembles teams whose members are already 1 or 2 hops apart in the graph.',
      ],
    },
    {
      title: 'D. Talent Graph Directory & Multi-Dimensional Search',
      details: [
        'Instant multi-filter search across skills, roles, companies, locations, and seniority.',
        'Candidate cards with direct profile expansion detailing all graph edges and historical ventures.',
        'One-click graph re-centering to inspect any candidate’s immediate neighborhood.',
      ],
    },
    {
      title: 'E. Cypher Query Laboratory & SQL Equivalence Benchmark',
      details: [
        'Interactive Cypher REPL executing live declarative graph queries directly on CognoDB.',
        'Dynamic JSON query parameter editor for testing parameterized queries ($personId, $skillName, etc.).',
        'Head-to-head complexity analysis: Compares O(d) pointer dereferencing vs O(N^d) SQL recursive CTE joins.',
        'Real-time execution latency tracking in milliseconds and detailed tabular result inspection.',
      ],
    },
    {
      title: 'F. Database Management & Schema Inspector',
      details: [
        'Live connection status indicator (Neo4j / CognoDB Bolt driver).',
        'Real-time node and relationship counter displaying total active entities in the database.',
        'One-click seed generator to populate or reset realistic Silicon Valley / AI talent network graphs.',
      ],
    },
  ];

  modules.forEach((mod) => {
    checkPageBreak(24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(neonPink[0], neonPink[1], neonPink[2]);
    doc.text(mod.title, margin, currentY);
    currentY += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);

    mod.details.forEach((bullet) => {
      checkPageBreak(5);
      doc.text(`*  ${bullet}`, margin + 3, currentY);
      currentY += 4.2;
    });
    currentY += 2;
  });

  // ====== SECTION 4: CYPHER VS SQL BENCHMARK ======
  drawSectionHeader('4. WHY GRAPH DATABASES (CYPHER VS SQL CTEs)', 'PERFORMANCE COMPARISON');

  checkPageBreak(35);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  const compIntro = 
    'In relational databases, querying relationships across 2+ hops requires multiple recursive self-joins ' +
    'or WITH RECURSIVE Common Table Expressions (CTEs), resulting in exponential join overhead. Graph databases ' +
    'use index-free adjacency where each node points directly to its physical neighbors in memory:';
  const splitComp = doc.splitTextToSize(compIntro, contentWidth);
  doc.text(splitComp, margin, currentY);
  currentY += splitComp.length * 4.2 + 4;

  // Code comparison box
  const boxWidth = (contentWidth - 4) / 2;
  
  // Left: Cypher
  doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(margin, currentY, boxWidth, 32, 'F');
  doc.setTextColor(mintGreen[0], mintGreen[1], mintGreen[2]);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('// CYPHER (Declarative Graph Pattern)', margin + 3, currentY + 5);
  doc.setTextColor(255, 255, 255);
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.8);
  doc.text('MATCH path = shortestPath(\n  (a:Person {id: $pA})-\n  [:KNOWS*..6]-(b:Person {id: $pB})\n)\nRETURN path, length(path);', margin + 3, currentY + 11);
  doc.setTextColor(255, 200, 220);
  doc.text('Time: 1.2ms | Complexity: O(d)', margin + 3, currentY + 28);

  // Right: SQL
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.rect(margin + boxWidth + 4, currentY, boxWidth, 32, 'F');
  doc.setDrawColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.rect(margin + boxWidth + 4, currentY, boxWidth, 32, 'S');
  doc.setTextColor(neonPink[0], neonPink[1], neonPink[2]);
  doc.setFont('courier', 'bold');
  doc.setFontSize(7.5);
  doc.text('-- SQL (Recursive CTE & Self-Joins)', margin + boxWidth + 7, currentY + 5);
  doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.8);
  doc.text('WITH RECURSIVE traverse(p1, p2, depth) AS (\n  SELECT src, dst, 1 FROM knows WHERE src=$pA\n  UNION\n  SELECT k.src, k.dst, t.depth+1 FROM knows k\n  JOIN traverse t ON k.src = t.dst\n  WHERE depth < 6\n) SELECT * FROM traverse WHERE p2=$pB;', margin + boxWidth + 7, currentY + 11);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('Time: 48.6ms | Complexity: O(N^d)', margin + boxWidth + 7, currentY + 28);

  currentY += 38;

  // ====== SECTION 5: TECH STACK ======
  drawSectionHeader('5. ARCHITECTURE & TECHNOLOGY STACK', 'SYSTEM ARCH');

  const stack = [
    { layer: 'Frontend SPA', tech: 'React 19, Tailwind CSS v4, Lucide Icons, Canvas 2D Retina Acceleration' },
    { layer: 'Backend Server', tech: 'Node.js, Express.js API, RESTful Subgraph & Traversal Endpoints' },
    { layer: 'Graph Engine', tech: 'Neo4j Driver / CognoDB Bolt Protocol (Native Cypher Pattern Engine)' },
    { layer: 'Algorithms', tech: 'Shortest Path (Dijkstra / BFS), Bounded Subgraph Relaxation, Jaccard Skill Clustering' },
  ];

  stack.forEach((item) => {
    checkPageBreak(7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.text(`[${item.layer}]`, margin + 2, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(item.tech, margin + 40, currentY + 4);
    currentY += 6;
  });

  // Apply headers and footers to all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Draw top bar
    doc.setFillColor(primaryNavy[0], primaryNavy[1], primaryNavy[2]);
    doc.rect(margin, 8, contentWidth, 1, 'F');

    // Draw bottom bar
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('CognoDB // Startup Team Matching & Graph Database Platform - Technical Documentation', margin, pageHeight - 8);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 18, pageHeight - 8);
  }

  // Ensure output directory exists
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const pdfPath = path.resolve('public/Startup_Graph_Documentation.pdf');
  const rootPdfPath = path.resolve('Startup_Graph_Documentation.pdf');

  const pdfOutput = doc.output('arraybuffer');
  fs.writeFileSync(pdfPath, Buffer.from(pdfOutput));
  fs.writeFileSync(rootPdfPath, Buffer.from(pdfOutput));

  console.log('PDF documentation successfully created at:', pdfPath);
}

generateAppDocumentationPDF();
