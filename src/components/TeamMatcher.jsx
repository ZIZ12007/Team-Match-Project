import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Sparkles,
  Sliders,
  CheckCircle2,
  XCircle,
  GitMerge,
  Shield,
  Loader2,
  Award,
  Plus,
  X,
  Building2,
  Network,
  Send,
  Briefcase,
  Trash2,
  BookmarkPlus,
  Search,
} from 'lucide-react';
import { api } from '../api/client';
import { SendOfferModal } from './SendOfferModal';

const INITIAL_PRESET_ROLES = [
  {
    id: 'role_1',
    role: 'AI Agent & Graph Architect',
    skills: ['LLM Fine-tuning', 'RAG Architecture', 'Cypher & Graph DBs', 'PyTorch'],
    isDefault: true,
  },
  {
    id: 'role_2',
    role: 'High-Performance Graph Core Engineer',
    skills: ['Cypher & Graph DBs', 'Distributed Systems', 'Rust', 'Neo4j / CognoDB'],
    isDefault: true,
  },
  {
    id: 'role_3',
    role: 'Full-Stack Canvas & Observability Lead',
    skills: ['React & Next.js', 'Canvas & D3 / Graph Viz', 'TypeScript & JavaScript', 'Tailwind CSS'],
    isDefault: true,
  },
  {
    id: 'role_4',
    role: 'AI Alignment & Data Engine Specialist',
    skills: ['LLM Fine-tuning', 'PostgreSQL & pgvector', 'PyTorch', 'Vector Embeddings'],
    isDefault: true,
  },
];

export function TeamMatcher({
  allSkills = [],
  currentUser,
  onViewProfile,
  onExploreGraph,
  onFindPath,
}) {
  const [selectedSkills, setSelectedSkills] = useState([
    'Cypher & Graph DBs',
    'LLM Fine-tuning',
    'RAG Architecture',
  ]);
  const [seekerId, setSeekerId] = useState(currentUser?.id || 'p1');
  const [minLevel, setMinLevel] = useState(2);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Custom role preset state
  const [rolePresets, setRolePresets] = useState(() => {
    const saved = localStorage.getItem('startup_graph_custom_roles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_PRESET_ROLES;
  });

  const [isAddingCustomRole, setIsAddingCustomRole] = useState(false);
  const [customRoleTitle, setCustomRoleTitle] = useState('');
  const [skillSearchQuery, setSkillSearchQuery] = useState('');

  // Offer modal state
  const [selectedCandidateForOffer, setSelectedCandidateForOffer] = useState(null);
  const [activeOffers, setActiveOffers] = useState({}); // { [candidateId]: offerObj }

  // Sync live outgoing offers from server notifications
  const fetchLiveOffers = async () => {
    try {
      const token = localStorage.getItem('startup_graph_token') || '';
      const res = await api.getNotifications(token, currentUser?.id);
      if (res?.outgoingOffers) {
        const map = {};
        res.outgoingOffers.forEach((o) => {
          map[o.candidateId] = o;
        });
        setActiveOffers(map);
      }
    } catch (err) {
      console.warn('Could not sync outgoing offers in TeamMatcher:', err);
    }
  };

  useEffect(() => {
    fetchLiveOffers();
    const interval = setInterval(fetchLiveOffers, 4000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Persist custom roles
  useEffect(() => {
    localStorage.setItem('startup_graph_custom_roles', JSON.stringify(rolePresets));
  }, [rolePresets]);

  // Sync seekerId with currentUser if provided
  useEffect(() => {
    if (currentUser?.id) {
      setSeekerId(currentUser.id);
    }
  }, [currentUser]);

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
  }, [seekerId]);

  const toggleSkill = (skillName) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
    }
  };

  // Save current skill selection as custom role template
  const handleSaveCustomRole = (e) => {
    e?.preventDefault();
    if (!customRoleTitle.trim()) return;
    if (selectedSkills.length === 0) {
      alert('Please select at least one skill to create a role template.');
      return;
    }

    const newRole = {
      id: `custom_${Date.now()}`,
      role: customRoleTitle.trim(),
      skills: [...selectedSkills],
      isDefault: false,
    };

    setRolePresets((prev) => [newRole, ...prev]);
    setCustomRoleTitle('');
    setIsAddingCustomRole(false);
  };

  // Delete custom role template
  const handleDeleteRole = (id, e) => {
    e.stopPropagation();
    setRolePresets((prev) => prev.filter((r) => r.id !== id));
  };

  const handleOfferSentSuccess = (offer) => {
    if (offer && offer.candidateId) {
      setActiveOffers((prev) => ({
        ...prev,
        [offer.candidateId]: offer,
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="brutal-card p-6 bg-[#08123B] text-white border-2 border-[#08123B] shadow-[6px_6px_0px_#FF007A]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="rounded-md border border-white bg-[#FF007A] text-white px-2.5 py-0.5 font-mono-code text-xs font-bold uppercase">
                DREAM TEAM BUILDER // SKILL + MUTUAL FRIEND MATCHER
              </span>
              <span className="rounded-md border border-white/20 bg-white/10 text-white px-2 py-0.5 font-mono-code text-xs">
                HIGH TRUST HIRING
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
              Smart Team Matcher & Offer Center
            </h2>
            <p className="text-xs sm:text-sm text-white/80 font-mono-code mt-1 max-w-2xl leading-relaxed">
              Finds candidates who have the exact skills you need <strong>and</strong> already know people in your network for instant trust and easy introductions. Extend official offers directly to candidates.
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97, y: 1 }}
            onClick={runMatch}
            disabled={loading || selectedSkills.length === 0}
            className="brutal-btn bg-[#0052FF] text-white px-6 py-3 font-display text-sm font-extrabold uppercase shadow-[3px_3px_0px_#FFFFFF] hover:bg-[#0042D9] self-start sm:self-center shrink-0"
          >
            {loading ? 'RANKING CANDIDATES...' : 'FIND BEST MATCHES →'}
          </motion.button>
        </div>
      </motion.div>

      {/* Non-Technical Quick Guide Card */}
      <div className="p-4 rounded-xl border-2 border-[#08123B] bg-[#F4F6FB] text-[#08123B] space-y-1.5 shadow-[3px_3px_0px_#08123B]">
        <div className="flex items-center gap-2 font-display text-xs font-extrabold uppercase text-[#0052FF]">
          <Sparkles className="h-4 w-4" />
          <span>How to scout talent & extend offers in 3 simple steps:</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono-code text-[#4A5578] pt-1">
          <div className="p-2.5 bg-white rounded-lg border border-[#08123B]/15">
            <strong>1. Pick or Define a Role</strong> (e.g. AI Architect or create your own custom role).
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-[#08123B]/15">
            <strong>2. Click "Find Best Matches"</strong> to rank candidates by skill and graph proximity.
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-[#08123B]/15">
            <strong>3. Click "Extend Team Offer"</strong> on any candidate to send compensation & equity package!
          </div>
        </div>
      </div>

      {/* Query Builder Config Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Preset & Custom Role Templates */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="brutal-card p-5 bg-white space-y-5 shadow-[4px_4px_0px_#08123B]"
        >
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-mono-code text-xs font-bold uppercase text-[#08123B] flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-[#0052FF]" />
                1. ROLE TEMPLATES
              </h3>

              <button
                onClick={() => setIsAddingCustomRole(!isAddingCustomRole)}
                className="font-mono-code text-[11px] font-bold text-[#0052FF] hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                <span>{isAddingCustomRole ? 'CLOSE' : '+ CUSTOM ROLE'}</span>
              </button>
            </div>

            {/* Custom Role Input Box */}
            <AnimatePresence>
              {isAddingCustomRole && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleSaveCustomRole}
                  className="p-3 mb-3 bg-[#EFF6FF] border-2 border-[#0052FF] rounded-xl space-y-2 overflow-hidden shadow-[2px_2px_0px_#0052FF]"
                >
                  <label className="block font-mono-code text-[10px] font-extrabold uppercase text-[#0052FF]">
                    New Custom Role Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={customRoleTitle}
                    onChange={(e) => setCustomRoleTitle(e.target.value)}
                    placeholder="e.g. Lead Distributed Rust Specialist"
                    className="w-full rounded-lg border border-[#0052FF] bg-white px-2.5 py-1.5 text-xs font-mono-code font-bold focus:outline-none"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono-code text-[#4A5578]">
                      Includes {selectedSkills.length} selected skills
                    </span>
                    <button
                      type="submit"
                      className="brutal-btn bg-[#0052FF] text-white px-3 py-1 text-[11px] font-display font-extrabold uppercase hover:bg-[#0042D9]"
                    >
                      SAVE TEMPLATE
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {rolePresets.map((preset) => (
                <motion.div
                  key={preset.id || preset.role}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedSkills(preset.skills)}
                  className="w-full text-left p-2.5 rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] hover:bg-[#0052FF] hover:text-white transition-all group shadow-[2px_2px_0px_#08123B] cursor-pointer flex items-center justify-between gap-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-extrabold font-display group-hover:text-white truncate">
                        {preset.role}
                      </p>
                      {!preset.isDefault && (
                        <span className="rounded bg-[#08123B] group-hover:bg-white text-white group-hover:text-[#08123B] px-1 py-0.2 text-[9px] font-mono-code font-bold uppercase shrink-0">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#4A5578] font-mono-code group-hover:text-white/80 line-clamp-1 mt-0.5">
                      {preset.skills.join(' • ')}
                    </p>
                  </div>

                  {!preset.isDefault && (
                    <button
                      onClick={(e) => handleDeleteRole(preset.id, e)}
                      className="p-1 rounded text-red-500 hover:text-red-700 group-hover:text-white hover:bg-black/10 transition-colors shrink-0"
                      title="Delete custom role"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Seeker Identity Selector */}
          <div className="pt-4 border-t-2 border-[#08123B]/15">
            <h3 className="font-mono-code text-xs font-bold uppercase text-[#08123B] mb-2 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-[#FF007A]" />
              2. RECRUITER / SEEKER ANCHOR
            </h3>
            <p className="text-[11px] text-[#4A5578] font-mono-code mb-2">
              Proximity scores and introduction paths are computed relative to this person node.
            </p>
            <select
              value={seekerId}
              onChange={(e) => setSeekerId(e.target.value)}
              className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] p-2.5 font-mono-code text-xs font-bold focus:outline-none shadow-[2px_2px_0px_#08123B]"
            >
              <option value="p1">Elena Rostova (Founder & CEO @ Apex Robotics AI)</option>
              <option value="p2">Marcus Vance (CTO & Co-Founder @ GraphForge AI)</option>
              <option value="p3">Chloe Dubois (VP of AI Product)</option>
              <option value="p7">Siddharth Menon (Founding Engineer @ CognoDB)</option>
              <option value="p10">Kenji Takahashi (Principal Security Lead)</option>
              <option value="p14">Aleksei Volkov (Principal Distributed Systems)</option>
            </select>
          </div>

          {/* Skill Proficiency Level Slider */}
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
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAddingCustomRole(true)}
                className="text-xs font-mono-code font-bold text-[#0052FF] hover:underline flex items-center gap-1"
              >
                <BookmarkPlus className="h-3.5 w-3.5" />
                <span>SAVE AS ROLE</span>
              </button>
              <span className="text-[#7382A6]">|</span>
              <button
                onClick={() => setSelectedSkills([])}
                className="text-xs font-mono-code font-bold text-[#FF007A] hover:underline"
              >
                [CLEAR ALL]
              </button>
            </div>
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
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono-code text-xs font-bold uppercase text-[#08123B]">
                Graph Skill Library:
              </p>
              <div className="relative w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[#7382A6]" />
                <input
                  type="text"
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  placeholder="Filter skills..."
                  className="w-full pl-7 pr-6 py-1 rounded-md border border-[#08123B]/30 bg-[#F4F6FB] font-mono-code text-[11px] focus:outline-none focus:border-[#0052FF]"
                />
                {skillSearchQuery && (
                  <button
                    onClick={() => setSkillSearchQuery('')}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[#7382A6] hover:text-[#08123B]"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
              {allSkills
                .filter(
                  (s) =>
                    !skillSearchQuery.trim() ||
                    s.name.toLowerCase().includes(skillSearchQuery.toLowerCase().trim()) ||
                    (s.category && s.category.toLowerCase().includes(skillSearchQuery.toLowerCase().trim()))
                )
                .map((s) => {
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

      {/* MATCH RESULTS SECTION */}
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
              const sentOffer = activeOffers[cand.id];

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
                  className="brutal-card p-5 bg-white flex flex-col justify-between hover:shadow-[6px_6px_0px_#08123B] transition-shadow border-2 border-[#08123B]"
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

                    {/* Sent Offer Status Badge if extended */}
                    {sentOffer && (
                      <div className="mb-3">
                        {sentOffer.status === 'accepted' ? (
                          <div className="p-2 bg-[#EBF7EE] border-2 border-[#008A3E] rounded-lg font-mono-code text-xs font-bold text-[#008A3E] flex items-center justify-between shadow-[2px_2px_0px_#008A3E]">
                            <span className="flex items-center gap-1.5">
                              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#008A3E]" />
                              <span>Offer Accepted! On Team Roster</span>
                            </span>
                            <span className="text-[10px] bg-[#008A3E] text-white px-1.5 py-0.2 rounded font-mono-code font-bold">
                              ACCEPTED 🎉
                            </span>
                          </div>
                        ) : sentOffer.status === 'declined' ? (
                          <div className="p-2 bg-[#FFF0F5] border-2 border-[#FF007A] rounded-lg font-mono-code text-xs font-bold text-[#FF007A] flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <XCircle className="h-3.5 w-3.5 shrink-0 text-[#FF007A]" />
                              <span>Offer was declined</span>
                            </span>
                            <span className="text-[10px] bg-[#FF007A] text-white px-1.5 py-0.2 rounded font-mono-code font-bold">
                              DECLINED ✕
                            </span>
                          </div>
                        ) : sentOffer.status === 'withdrawn' ? (
                          <div className="p-2 bg-zinc-100 border border-zinc-300 rounded-lg font-mono-code text-xs font-bold text-zinc-600 flex items-center justify-between">
                            <span>Offer was withdrawn</span>
                            <span className="text-[10px] bg-zinc-200 px-1.5 py-0.2 rounded">WITHDRAWN</span>
                          </div>
                        ) : (
                          <div className="p-2 bg-[#FFFBEB] border-2 border-[#FFC700] rounded-lg font-mono-code text-xs font-bold text-[#92400E] flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-[#FFC700] animate-ping" />
                              <span>Offer sent: waiting for response</span>
                            </span>
                            <span className="text-[10px] bg-[#FFC700] text-[#08123B] px-1.5 py-0.2 rounded font-mono-code font-bold border border-[#08123B]">
                              PENDING
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Primary Offer and Profile Actions */}
                  <div className="space-y-2 pt-3 border-t-2 border-[#08123B]/15">
                    {/* Send Offer Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedCandidateForOffer(cand)}
                      className={`w-full brutal-btn py-2 text-xs font-display font-extrabold uppercase flex items-center justify-center gap-1.5 shadow-[3px_3px_0px_#08123B] ${
                        sentOffer?.status === 'accepted'
                          ? 'bg-[#008A3E] text-white hover:bg-[#007032]'
                          : sentOffer?.status === 'declined'
                          ? 'bg-[#0052FF] text-white hover:bg-[#0042D9]'
                          : 'bg-[#FF007A] text-white hover:bg-[#E6006E]'
                      }`}
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>
                        {sentOffer?.status === 'accepted'
                          ? 'MANAGE / UPDATE TEAM OFFER'
                          : sentOffer?.status === 'declined'
                          ? 'SEND REVISED OFFER'
                          : sentOffer?.status === 'pending'
                          ? 'UPDATE PENDING OFFER'
                          : 'EXTEND TEAM OFFER'}
                      </span>
                    </motion.button>

                    <div className="flex items-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onViewProfile(cand.id)}
                        className="brutal-btn flex-1 bg-[#08123B] text-white py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#0052FF]"
                      >
                        PROFILE
                      </motion.button>
                      {hops < 99 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => onFindPath(cand.id)}
                          className="brutal-btn bg-[#0052FF] text-white px-2.5 py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9]"
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
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Offer Extension Modal */}
      {selectedCandidateForOffer && (
        <SendOfferModal
          isOpen={Boolean(selectedCandidateForOffer)}
          onClose={() => setSelectedCandidateForOffer(null)}
          candidate={selectedCandidateForOffer}
          currentUser={currentUser}
          defaultRole={rolePresets[0]?.role || 'Core AI Engineer'}
          onOfferSent={handleOfferSentSuccess}
        />
      )}
    </div>
  );
}
