import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Database,
  RefreshCw,
  Server,
  Layers,
  Users,
  Award,
  Briefcase,
  Building2,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api } from '../api/client';

export function DatabaseManager({ onRefreshAll }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);
  const [error, setError] = useState(null);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch graph database statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const res = await api.seedDatabase();
      setSeedResult(res);
      await loadStats();
      if (onRefreshAll) onRefreshAll();
    } catch (err) {
      setError('Seeding error: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const counts = stats?.counts || {
    peopleCount: 0,
    skillsCount: 0,
    projectsCount: 0,
    companiesCount: 0,
    relationshipsCount: 0,
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="brutal-card p-6 bg-[#08123B] text-white border-2 border-[#08123B] shadow-[6px_6px_0px_#FF007A]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-md border border-white bg-[#FF007A] text-white px-2.5 py-0.5 font-mono-code text-xs font-bold uppercase">
                COGNO_DB METRICS // LIVE TELEMETRY
              </span>
              <span className="rounded-md border border-white/20 bg-white/10 text-white px-2 py-0.5 font-mono-code text-xs">
                BOLT+S CLOUD PROTOCOL
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Graph Database Telemetry & Topology Stats
            </h2>
            <p className="text-xs sm:text-sm font-mono-code text-white/80 mt-1 max-w-2xl leading-relaxed">
              Real-time node cardinality, relationship distribution, and idempotent seeding controls connected directly to CognoDB instance.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={loadStats}
              disabled={loading}
              className="brutal-btn bg-white text-[#08123B] px-4 py-2.5 text-xs font-display font-extrabold uppercase flex items-center gap-1.5 hover:bg-[#F4F6FB]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>REFRESH STATS</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleSeedDatabase}
              disabled={seeding}
              className="brutal-btn bg-[#0052FF] text-white px-4 py-2.5 text-xs font-display font-extrabold uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#FFFFFF] hover:bg-[#0042D9]"
            >
              {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
              <span>{seeding ? 'SEEDING...' : 'RE-SEED GRAPH'}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ERROR NOTICE */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl border-2 border-[#08123B] bg-[#FF007A] text-white p-4 font-mono-code text-xs shadow-[3px_3px_0px_#08123B]"
          >
            <p className="font-bold uppercase">[TELEMETRY ERROR] {error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SEED SUCCESS NOTICE */}
      <AnimatePresence>
        {seedResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl border-2 border-[#08123B] bg-[#00D26A] text-[#08123B] p-4 font-mono-code text-xs shadow-[3px_3px_0px_#08123B] space-y-1"
          >
            <p className="font-bold uppercase">[SEEDING COMPLETED] Idempotent graph entities verified and successfully populated!</p>
            {seedResult.message && <p className="text-[11px] font-semibold">{seedResult.message}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friendly Non-Technical Metrics Breakdown */}
      <div className="brutal-card p-5 bg-[#F4F6FB] border-2 border-[#08123B] shadow-[4px_4px_0px_#08123B] space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-[#0052FF] text-white flex items-center justify-center font-bold text-xs">
            📊
          </div>
          <h3 className="font-display text-sm font-extrabold text-[#08123B] uppercase">
            What these Database Metrics Mean (Plain English)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-xs font-mono-code text-[#4A5578]">
          <div className="p-3 bg-white rounded-xl border border-[#08123B]/15 space-y-1">
            <span className="font-bold text-[#0052FF] block">👥 Talent & Skills Indexed</span>
            <p>
              Every person, skill, company, and project is stored as a <strong>"Node"</strong> with verified career history and proficiency levels.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#08123B]/15 space-y-1">
            <span className="font-bold text-[#008A3E] block">🔗 Relationships (Edges)</span>
            <p>
              Connections between people (*"Worked together"*, *"Mentored"*, *"Has skill"*). These relationships power the 1-hop &amp; 2-hop warm referrals.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-[#08123B]/15 space-y-1">
            <span className="font-bold text-[#FF007A] block">🌱 "Re-Seed Graph" Button</span>
            <p>
              Click this anytime to safely restore or refresh the complete demo dataset of 85+ engineers, 30+ skills, and 450+ relationship links.
            </p>
          </div>
        </div>
      </div>

      {/* GRAPH TOPOLOGY STAT CARDS WITH STAGGER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* PEOPLE NODES */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          whileHover={{ y: -3 }}
          className="brutal-card p-5 bg-white space-y-1 shadow-[4px_4px_0px_#08123B]"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-[11px] font-bold text-[#7382A6] uppercase">TALENT NODES</span>
            <Users className="h-4 w-4 text-[#0052FF]" />
          </div>
          <p className="font-display text-3xl font-extrabold text-[#08123B]">
            {loading ? '...' : counts.peopleCount}
          </p>
          <p className="text-[10px] font-mono-code text-[#4A5578]">:Person</p>
        </motion.div>

        {/* SKILLS NODES */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          whileHover={{ y: -3 }}
          className="brutal-card p-5 bg-white space-y-1 shadow-[4px_4px_0px_#08123B]"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-[11px] font-bold text-[#7382A6] uppercase">SKILL NODES</span>
            <Award className="h-4 w-4 text-[#0052FF]" />
          </div>
          <p className="font-display text-3xl font-extrabold text-[#08123B]">
            {loading ? '...' : counts.skillsCount}
          </p>
          <p className="text-[10px] font-mono-code text-[#4A5578]">:Skill</p>
        </motion.div>

        {/* PROJECTS NODES */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          whileHover={{ y: -3 }}
          className="brutal-card p-5 bg-white space-y-1 shadow-[4px_4px_0px_#08123B]"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-[11px] font-bold text-[#7382A6] uppercase">PROJECTS</span>
            <Briefcase className="h-4 w-4 text-[#FF007A]" />
          </div>
          <p className="font-display text-3xl font-extrabold text-[#08123B]">
            {loading ? '...' : counts.projectsCount}
          </p>
          <p className="text-[10px] font-mono-code text-[#4A5578]">:Project</p>
        </motion.div>

        {/* COMPANIES NODES */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.11 }}
          whileHover={{ y: -3 }}
          className="brutal-card p-5 bg-white space-y-1 shadow-[4px_4px_0px_#08123B]"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-[11px] font-bold text-[#7382A6] uppercase">COMPANIES</span>
            <Building2 className="h-4 w-4 text-[#00D26A]" />
          </div>
          <p className="font-display text-3xl font-extrabold text-[#08123B]">
            {loading ? '...' : counts.companiesCount}
          </p>
          <p className="text-[10px] font-mono-code text-[#4A5578]">:Company</p>
        </motion.div>

        {/* RELATIONSHIP EDGES */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          whileHover={{ y: -3 }}
          className="brutal-card p-5 bg-[#08123B] text-white space-y-1 shadow-[4px_4px_0px_#0052FF]"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-[11px] font-bold text-[#00D26A] uppercase">TOTAL EDGES</span>
            <Layers className="h-4 w-4 text-[#0052FF]" />
          </div>
          <p className="font-display text-3xl font-extrabold text-white">
            {loading ? '...' : counts.relationshipsCount}
          </p>
          <p className="text-[10px] font-mono-code text-white/70">Graph Relationships</p>
        </motion.div>
      </div>

      {/* CLOUD CONNECTION SPECIFICATIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="brutal-card p-5 bg-white space-y-3 shadow-[4px_4px_0px_#08123B]"
        >
          <h3 className="font-mono-code text-xs font-bold uppercase text-[#08123B] flex items-center gap-1.5 pb-2 border-b-2 border-[#08123B]/15">
            <Server className="h-4 w-4 text-[#0052FF]" />
            ACTIVE COGNODB CONNECTION DETAILS
          </h3>

          <div className="space-y-2 font-mono-code text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-[#F4F6FB]">
              <span className="text-[#7382A6]">BOLT ENDPOINT:</span>
              <span className="font-bold text-[#08123B]">db-c83cb839.bravo.databases.cognodb.com</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-[#F4F6FB]">
              <span className="text-[#7382A6]">DATABASE USER:</span>
              <span className="font-bold text-[#08123B]">cognodb</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-[#F4F6FB]">
              <span className="text-[#7382A6]">TLS / ENCRYPTION:</span>
              <span className="font-bold text-[#00D26A]">ENABLED (bolt+s)</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-[#F4F6FB]">
              <span className="text-[#7382A6]">BACKEND DRIVER:</span>
              <span className="font-bold text-[#08123B]">neo4j-driver v6.2.0</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          className="brutal-card p-5 bg-white space-y-3 shadow-[4px_4px_0px_#08123B]"
        >
          <h3 className="font-mono-code text-xs font-bold uppercase text-[#08123B] flex items-center gap-1.5 pb-2 border-b-2 border-[#08123B]/15">
            <Layers className="h-4 w-4 text-[#FF007A]" />
            GRAPH SCHEMA LABELS & RELATIONSHIP TYPES
          </h3>

          <div className="space-y-2 font-mono-code text-xs">
            <div className="p-2 rounded-lg bg-[#F4F6FB] flex items-center justify-between">
              <span>(:Person)-[:KNOWS]-(:Person)</span>
              <span className="rounded bg-[#08123B] text-white px-2 py-0.5 text-[10px] font-bold">Colleague & Peers</span>
            </div>
            <div className="p-2 rounded-lg bg-[#F4F6FB] flex items-center justify-between">
              <span>(:Person)-[:HAS_SKILL]->(:Skill)</span>
              <span className="rounded bg-[#0052FF] text-white px-2 py-0.5 text-[10px] font-bold">L1..L5 Level</span>
            </div>
            <div className="p-2 rounded-lg bg-[#F4F6FB] flex items-center justify-between">
              <span>(:Person)-[:WORKS_AT]->(:Company)</span>
              <span className="rounded bg-[#00D26A] text-[#08123B] px-2 py-0.5 text-[10px] font-bold">Employment</span>
            </div>
            <div className="p-2 rounded-lg bg-[#F4F6FB] flex items-center justify-between">
              <span>(:Person)-[:WORKED_ON]->(:Project)</span>
              <span className="rounded bg-[#FF007A] text-white px-2 py-0.5 text-[10px] font-bold">Production Apps</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* PDF Documentation Manual Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="brutal-card p-6 bg-[#FFFFFF] border-2 border-[#08123B] shadow-[5px_5px_0px_#0052FF] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-[#0052FF] text-white px-2 py-0.5 font-mono-code text-[10px] font-bold uppercase">
              TECHNICAL SPECIFICATION
            </span>
            <span className="font-mono-code text-xs text-[#7382A6]">PDF MANUAL AVAILABLE</span>
          </div>
          <h3 className="font-display text-lg font-extrabold text-[#08123B]">
            Complete System Architecture & Feature Guide (PDF)
          </h3>
          <p className="font-mono-code text-xs text-[#4A5578] max-w-2xl">
            Detailed breakdown of property graph models, 1-to-2 hop Cypher pattern algorithms, Dijkstra shortest-path queries, team balance heuristics, and Cypher vs SQL benchmarks.
          </p>
        </div>

        <motion.a
          whileHover={{ scale: 1.05, x: 2 }}
          whileTap={{ scale: 0.95 }}
          href="/api/docs/pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="brutal-btn bg-[#08123B] text-white px-5 py-2.5 text-xs font-display font-extrabold uppercase hover:bg-[#FF007A] flex items-center gap-2 shrink-0 shadow-[3px_3px_0px_#0052FF]"
        >
          <span>OPEN / DOWNLOAD PDF</span>
          <ArrowUpRight className="h-4 w-4" />
        </motion.a>
      </motion.div>
    </div>
  );
}
