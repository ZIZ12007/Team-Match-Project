import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Sparkles,
  Sliders,
  CheckCircle2,
  GitMerge,
  Shield,
  Loader2,
  Award,
  Plus,
  X,
  Building2,
  Network,
} from 'lucide-react';
import { api } from '../api/client';

const PRESET_ROLES = [
  {
    role: 'AI Agent & Graph Architect',
    skills: ['LLM Fine-tuning', 'RAG Architecture', 'Cypher & Graph DBs', 'PyTorch'],
  },
  {
    role: 'High-Performance Graph Core Engineer',
    skills: ['Cypher & Graph DBs', 'Distributed Systems', 'Rust', 'Neo4j / CognoDB'],
  },
  {
    role: 'Full-Stack Canvas & Observability Lead',
    skills: ['React & Next.js', 'Canvas & D3 / Graph Viz', 'TypeScript & JavaScript', 'Tailwind CSS'],
  },
  {
    role: 'AI Alignment & Data Engine Specialist',
    skills: ['LLM Fine-tuning', 'PostgreSQL & pgvector', 'PyTorch', 'Vector Embeddings'],
  },
];

export function TeamMatcher({
  allSkills = [],
  onViewProfile,
  onExploreGraph,
  onFindPath,
}) {
  const [selectedSkills, setSelectedSkills] = useState([
    'Cypher & Graph DBs',
    'LLM Fine-tuning',
    'RAG Architecture',
  ]);
  const [seekerId, setSeekerId] = useState('p1'); // Elena Rostova by default
  const [minLevel, setMinLevel] = useState(2);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Run Match API call
  const runMatch = async () => {
    if (selectedSkills.length === 0) return;
    setLoading(true);
    try {
      const res = await api.matchTeam({
        skills: selectedSkills,
        seekerId: seekerId || null,
        minLevel: Number(minLevel),
        limit: 15,
      });
      setResults(res.results || []);
      setHasSearched(true);
    } catch (err) {
      console.error('Match error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial match
  useEffect(() => {
    runMatch();
  }, []);

  const toggleSkill = (skillName) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with deliberate fintech editorial styling */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="brutal-card p-6 bg-[#08123B] text-white border-2 border-[#08123B] shadow-[6px_6px_0px_#FF007A]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-md border border-white bg-[#FF007A] text-white px-2.5 py-0.5 font-mono-code text-xs font-bold uppercase">
                GRAPH ALGORITHMS // MATCH_ENGINE_V2
              </span>
              <span className="rounded-md border border-white/20 bg-white/10 text-white px-2 py-0.5 font-mono-code text-xs">
                WEIGHTED PROXIMITY
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Graph-Augmented Team Matcher
            </h2>
            <p className="text-xs sm:text-sm text-white/80 font-mono-code mt-1 max-w-2xl leading-relaxed">
              Ranks candidates by combining required skill overlap with real network proximity (1-hop, 2-hop shortest paths) to eliminate cold outreach.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97, y: 1 }}
            onClick={runMatch}
            disabled={loading || selectedSkills.length === 0}
            className="brutal-btn bg-[#0052FF] text-white px-6 py-3 font-display text-sm font-extrabold uppercase shadow-[3px_3px_0px_#FFFFFF] hover:bg-[#0042D9] self-start sm:self-center shrink-0"
          >
            {loading ? 'CALCULATING GRAPH SCORES...' : 'FIND CANDIDATES →'}
          </motion.button>
        </div>
      </motion.div>

      {/* Query Builder Config Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Preset Templates & Seeker Configuration */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="brutal-card p-5 bg-white space-y-5 shadow-[4px_4px_0px_#08123B]"
        >
          <div>
            <h3 className="font-mono-code text-xs font-bold uppercase text-[#08123B] mb-2.5 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-[#0052FF]" />
              1. PRESET ROLE TEMPLATES
            </h3>
            <div className="space-y-2">
              {PRESET_ROLES.map((preset, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSkills(preset.skills)}
                  className="w-full text-left p-2.5 rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] hover:bg-[#0052FF] hover:text-white transition-all group shadow-[2px_2px_0px_#08123B]"
                >
                  <p className="text-xs font-extrabold font-display group-hover:text-white">{preset.role}</p>
                  <p className="text-[10px] text-[#4A5578] font-mono-code group-hover:text-white/80 line-clamp-1 mt-0.5">
                    {preset.skills.join(' • ')}
                  </p>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t-2 border-[#08123B]/15">
            <h3 className="font-mono-code text-xs font-bold uppercase text-[#08123B] mb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#FF007A]" />
              2. SEEKER IDENTITY (ANCHOR)
            </h3>
            <p className="text-[11px] text-[#4A5578] font-mono-code mb-2">
              Proximity scores and introduction paths are computed relative to this person node.
            </p>
            <select
              value={seekerId}
              onChange={(e) => setSeekerId(e.target.value)}
              className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] p-2.5 font-mono-code text-xs font-bold focus:outline-none shadow-[2px_2px_0px_#08123B]"
            >
              <option value="p1">Elena Rostova (Founder & CEO @ NeoGraph Labs)</option>
              <option value="p2">Marcus Vance (CTO & Co-Founder @ GraphForge AI)</option>
              <option value="p7">Siddharth Menon (Founding Engineer @ CognoDB)</option>
              <option value="p14">Aleksei Volkov (Principal Distributed Systems Engineer)</option>
              <option value="p18">Kavita Sharma (Lead Graph Algorithms Researcher)</option>
            </select>
          </div>

          <div className="pt-4 border-t-2 border-[#08123B]/15">
            <div className="flex items-center justify-between mb-1.5">
              <h3 className="font-mono-code text-xs font-bold uppercase text-[#08123B] flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-[#0052FF]" />
                MINIMUM SKILL LEVEL: L{minLevel}
              </h3>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={minLevel}
              onChange={(e) => setMinLevel(Number(e.target.value))}
              className="w-full accent-[#0052FF] cursor-pointer transition-all"
            />
            <div className="flex justify-between text-[10px] font-mono-code text-[#7382A6] mt-1">
              <span>L1: Beginner</span>
              <span>L3: Proficient</span>
              <span>L5: Principal</span>
            </div>
          </div>
        </motion.div>

        {/* Center & Right Column: Interactive Skill Selector Grid */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="lg:col-span-2 brutal-card p-5 bg-white space-y-4 shadow-[4px_4px_0px_#08123B]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-[#08123B]/15">
            <div>
              <h3 className="font-display text-base font-extrabold text-[#08123B]">
                Selected Requirements ({selectedSkills.length})
              </h3>
              <p className="text-xs text-[#4A5578] font-mono-code">
                Select target graph skills to evaluate multi-skill compatibility
              </p>
            </div>
            <button
              onClick={() => setSelectedSkills([])}
              className="text-xs font-mono-code font-bold text-[#FF007A] hover:underline"
            >
              [CLEAR ALL]
            </button>
          </div>

          {/* Active Skills Chips */}
          <div className="flex flex-wrap gap-2 min-h-10 p-2.5 rounded-lg border-2 border-[#08123B] bg-[#F4F6FB]">
            {selectedSkills.length === 0 ? (
              <span className="text-xs font-mono-code text-[#7382A6] italic">
                Click any skill below to add to matching query...
              </span>
            ) : (
              selectedSkills.map((sk) => (
                <motion.span
                  key={sk}
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  className="inline-flex items-center gap-1.5 rounded-md border-2 border-[#08123B] bg-[#0052FF] text-white px-2.5 py-1 text-xs font-mono-code font-bold shadow-[1.5px_1.5px_0px_#08123B]"
                >
                  {sk}
                  <button
                    onClick={() => toggleSkill(sk)}
                    className="hover:text-[#FF007A] transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </motion.span>
              ))
            )}
          </div>

          {/* Available Skills Grid */}
          <div className="space-y-2">
            <p className="font-mono-code text-xs font-bold uppercase text-[#08123B]">
              Graph Skill Library:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {allSkills.map((s) => {
                const isSelected = selectedSkills.includes(s.name);
                return (
                  <motion.button
                    key={s.id || s.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => toggleSkill(s.name)}
                    className={`p-2 rounded-lg border text-left text-xs font-mono-code transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-2 border-[#08123B] bg-[#08123B] text-white font-bold shadow-[2px_2px_0px_#0052FF]'
                        : 'border-[#08123B]/30 bg-white text-[#08123B] hover:border-[#08123B] hover:bg-[#F4F6FB]'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    {isSelected ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#00D26A] shrink-0" />
                    ) : (
                      <Plus className="h-3.5 w-3.5 text-[#7382A6] shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* MATCH RESULTS SECTION WITH EMIL KOWALSKI STAGGER & HOVER */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-extrabold text-[#08123B]">
            Matched Candidate Rankings ({results.length})
          </h3>
          <span className="font-mono-code text-xs text-[#4A5578]">
            SORT: SKILL COVERAGE → GRAPH PROXIMITY → PROFICIENCY
          </span>
        </div>

        {loading ? (
          <div className="brutal-card p-12 bg-white flex flex-col items-center justify-center gap-3 font-mono-code">
            <Loader2 className="h-8 w-8 animate-spin text-[#0052FF]" />
            <p className="text-sm font-bold uppercase text-[#08123B]">COMPUTING CYPHER SHORTEST PATHS & WEIGHTS...</p>
          </div>
        ) : results.length === 0 && hasSearched ? (
          <div className="brutal-card p-12 bg-white text-center font-mono-code">
            <p className="text-sm font-bold text-[#08123B] uppercase mb-1">NO CANDIDATES MATCH THIS COMBINATION</p>
            <p className="text-xs text-[#7382A6]">Try reducing minimum skill level or selecting broader skill sets.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((cand, idx) => {
              const hops = cand.hopsToSeeker;
              const isDirect = hops === 1;
              const isWarm = hops === 2;

              return (
                <motion.div
                  key={cand.id}
                  initial={{ opacity: 0, y: 16, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 350,
                    damping: 26,
                    delay: idx * 0.04,
                  }}
                  whileHover={{ y: -4 }}
                  className="brutal-card p-5 bg-white flex flex-col justify-between hover:shadow-[6px_6px_0px_#08123B] transition-shadow"
                >
                  <div>
                    {/* Header Score & Proximity Badge */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <motion.img
                          whileHover={{ scale: 1.05 }}
                          src={cand.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(cand.name)}`}
                          alt={cand.name}
                          className="h-12 w-12 rounded-xl border-2 border-[#08123B] object-cover shrink-0 shadow-[2px_2px_0px_#08123B]"
                        />
                        <div>
                          <h4 className="font-display font-extrabold text-base text-[#08123B] leading-tight">
                            {cand.name}
                          </h4>
                          <p className="text-xs font-semibold text-[#4A5578] line-clamp-1">{cand.title}</p>
                        </div>
                      </div>

                      {/* Match Score Stamp */}
                      <div className="text-right shrink-0">
                        <motion.div
                          whileHover={{ scale: 1.08 }}
                          className="rounded-md border-2 border-[#08123B] bg-[#0052FF] text-white px-2 py-0.5 font-mono-code text-xs font-extrabold shadow-[1.5px_1.5px_0px_#08123B]"
                        >
                          {cand.matchScore} PTS
                        </motion.div>
                      </div>
                    </div>

                    {/* Proximity Tag */}
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 font-mono-code text-[11px] font-bold border ${
                          isDirect
                            ? 'bg-[#EBF7EE] text-[#008A3E] border-[#008A3E]'
                            : isWarm
                            ? 'bg-[#EFF6FF] text-[#0052FF] border-[#0052FF]'
                            : hops < 99
                            ? 'bg-[#F4F6FB] text-[#08123B] border-[#08123B]'
                            : 'bg-zinc-100 text-zinc-500 border-zinc-300'
                        }`}
                      >
                        {hops === 1
                          ? '⚡ 1-HOP (DIRECT CONNECTION)'
                          : hops === 2
                          ? '🤝 2-HOP (MUTUAL INTRODUCTION)'
                          : hops < 99
                          ? `🔗 ${hops}-HOP PATH`
                          : '❄️ NO GRAPH PATH (COLD)'}
                      </span>
                    </div>

                    {/* Company */}
                    {cand.companyName && (
                      <p className="text-xs font-mono-code text-[#4A5578] mb-2.5 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5 text-[#0052FF]" />
                        <strong className="text-[#08123B]">{cand.companyName}</strong>
                      </p>
                    )}

                    {/* Matched Skills */}
                    <div className="mb-3 space-y-1">
                      <p className="font-mono-code text-[10px] font-bold uppercase text-[#7382A6]">
                        MATCHED SKILLS ({cand.matchedSkills?.length || 0}):
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(cand.matchedSkills || []).map((sk, sIdx) => (
                          <span
                            key={sIdx}
                            className="rounded border border-[#08123B] bg-[#F4F6FB] px-1.5 py-0.5 text-[10px] font-mono-code font-bold text-[#08123B]"
                          >
                            {sk.skillName} (L{sk.level})
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Mutual Connection names if 2-hop */}
                    {cand.mutualNames && cand.mutualNames.length > 0 && (
                      <div className="rounded-lg border border-[#08123B]/30 bg-[#F4F6FB] p-2 text-[11px] font-mono-code mb-3">
                        <span>Intro via: <strong className="text-[#08123B]">{cand.mutualNames.join(', ')}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t-2 border-[#08123B]/15 flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => onViewProfile(cand.id)}
                      className="brutal-btn flex-1 bg-[#08123B] text-white py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#0052FF]"
                    >
                      VIEW PROFILE
                    </motion.button>
                    {hops < 99 && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => onFindPath(cand.id)}
                        className="brutal-btn bg-[#FF007A] text-white px-2.5 py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#E6006E]"
                        title="View shortest path chain"
                      >
                        <GitMerge className="h-3.5 w-3.5" />
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.94 }}
                      onClick={() => onExploreGraph(cand.id)}
                      className="brutal-btn bg-white text-[#08123B] px-2.5 py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#F4F6FB]"
                      title="Inspect graph neighborhood"
                    >
                      <Network className="h-3.5 w-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
