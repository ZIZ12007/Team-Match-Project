import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Building2,
  MapPin,
  Mail,
  Network,
  GitMerge,
  Award,
  Briefcase,
  Users,
  GraduationCap,
  Loader2,
  Sparkles,
  Send,
  UserPlus,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';
import { SendOfferModal } from './SendOfferModal';

export function PersonProfileModal({ personId, onClose, onExploreGraph, onFindPath, currentUser }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Multi-hop network preview tab
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'multihop'
  const [multiHopSkill, setMultiHopSkill] = useState('');
  const [multiHopCandidates, setMultiHopCandidates] = useState([]);
  const [loadingMultiHop, setLoadingMultiHop] = useState(false);

  // Offer modal & connection request state
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [connectStatus, setConnectStatus] = useState(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!personId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    api
      .getPersonProfile(personId)
      .then((data) => {
        if (isMounted) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load person profile.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [personId]);

  // Load multi-hop candidates
  const loadMultiHop = async (skillFilter = '') => {
    if (!personId) return;
    setLoadingMultiHop(true);
    try {
      const res = await api.getPersonNetwork(personId, skillFilter, 12);
      setMultiHopCandidates(res.candidates || []);
    } catch (err) {
      console.error('Multi-hop network error:', err);
    } finally {
      setLoadingMultiHop(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'multihop') {
      loadMultiHop(multiHopSkill);
    }
  }, [activeTab, multiHopSkill, personId]);

  if (!personId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop with fade and subtle blur */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-[#08123B]/80 backdrop-blur-xs"
      />

      {/* Modal Dialog Card with Emil Kowalski spring physics */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
        className="brutal-card relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#FFFFFF] rounded-2xl overflow-hidden my-auto border-2 border-[#08123B] shadow-[8px_8px_0px_#08123B] z-10"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#08123B] bg-[#08123B] px-6 py-4 text-white">
          <div className="flex items-center gap-2">
            <span className="font-mono-code text-xs font-bold uppercase tracking-wider bg-[#FF007A] text-white px-2 py-0.5 rounded border border-white">
              TALENT_NODE // {personId}
            </span>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            onClick={onClose}
            className="rounded-lg border-2 border-white bg-white p-1 text-[#08123B] hover:bg-[#FF007A] hover:text-white transition-colors"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </motion.button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 flex-1">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 font-mono-code">
              <Loader2 className="h-8 w-8 animate-spin text-[#0052FF]" />
              <p className="text-sm font-bold uppercase text-[#08123B]">TRAVERSING COGNODB GRAPH...</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border-2 border-[#08123B] bg-[#FF007A] text-white p-4 font-mono-code text-sm shadow-[3px_3px_0px_#08123B]">
              <p className="font-bold uppercase">[ERROR] {error}</p>
            </div>
          )}

          {profile && !loading && (
            <div>
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b-2 border-[#08123B]/15">
                <motion.div
                  whileHover={{ scale: 1.04 }}
                  className="relative h-20 w-20 shrink-0 rounded-2xl border-2 border-[#08123B] bg-[#F4F6FB] overflow-hidden shadow-[3px_3px_0px_#08123B]"
                >
                  <img
                    src={profile.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80`}
                    alt={profile.name}
                    className="h-full w-full object-cover contrast-110"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=08123B&color=fff&bold=true`;
                    }}
                  />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#08123B]">
                      {profile.name}
                    </h2>
                    {profile.experienceYears && (
                      <span className="rounded-md border border-[#08123B] bg-[#0052FF] text-white font-mono-code text-xs font-bold px-2 py-0.5">
                        {profile.experienceYears} YRS EXP
                      </span>
                    )}
                  </div>

                  <p className="font-mono-code text-sm font-semibold text-[#4A5578] mb-2">
                    {profile.title}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs font-mono-code text-[#4A5578]">
                    {profile.company && profile.company.name && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-[#0052FF]" />
                        <span className="font-bold text-[#08123B]">{profile.company.name}</span>
                        {profile.company.role && <span className="text-[#7382A6]">({profile.company.role})</span>}
                      </div>
                    )}
                    {profile.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-[#7382A6]" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    {profile.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-[#7382A6]" />
                        <span>{profile.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setIsOfferModalOpen(true)}
                    className="brutal-btn bg-[#FF007A] text-white px-3.5 py-2 text-xs font-display font-extrabold uppercase flex items-center justify-center gap-1.5 hover:bg-[#E6006E] shadow-[2px_2px_0px_#08123B]"
                  >
                    <Send className="h-4 w-4" />
                    <span>EXTEND OFFER</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    disabled={connecting}
                    onClick={async () => {
                      setConnecting(true);
                      try {
                        const token = localStorage.getItem('startup_graph_token') || '';
                        await api.sendConnectionRequest(
                          {
                            receiverId: profile.id,
                            context: 'Profile discovery connection',
                            senderId: currentUser?.id || 'p1',
                            senderName: currentUser?.name || 'Elena Rostova',
                          },
                          token
                        );
                        setConnectStatus('Request sent!');
                        try {
                          confetti({ particleCount: 40, spread: 50, origin: { y: 0.7 } });
                        } catch (e) {}
                      } catch (err) {
                        setConnectStatus('Sent.');
                      } finally {
                        setConnecting(false);
                      }
                    }}
                    className="brutal-btn bg-[#008A3E] text-white px-3 py-2 text-xs font-display font-extrabold uppercase flex items-center justify-center gap-1 hover:bg-[#007032]"
                  >
                    {connectStatus ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    <span>{connectStatus || 'CONNECT'}</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      onClose();
                      onExploreGraph(profile.id);
                    }}
                    className="brutal-btn bg-[#0052FF] text-white px-3.5 py-2 text-xs font-display font-extrabold uppercase flex items-center justify-center gap-1.5 hover:bg-[#0042D9]"
                  >
                    <Network className="h-4 w-4" />
                    <span>GRAPH</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      onClose();
                      onFindPath(profile.id);
                    }}
                    className="brutal-btn bg-[#08123B] text-white px-3.5 py-2 text-xs font-display font-extrabold uppercase flex items-center justify-center gap-1.5 hover:bg-[#202E5C]"
                  >
                    <GitMerge className="h-4 w-4" />
                    <span>PATH</span>
                  </motion.button>
                </div>
              </div>

              {/* Bio block */}
              {profile.bio && (
                <div className="my-5 rounded-xl border-l-4 border-[#0052FF] bg-[#F4F6FB] p-4 text-sm text-[#08123B] leading-relaxed">
                  <p className="font-editorial italic text-base sm:text-lg">{profile.bio}</p>
                </div>
              )}

              {/* Tab Navigation inside Profile Modal with Animated Pill */}
              <div className="flex border-b-2 border-[#08123B] mb-5 gap-2 font-display text-xs font-extrabold uppercase relative">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`relative px-4 py-2 rounded-t-lg transition-colors z-10 ${
                    activeTab === 'overview'
                      ? 'text-white'
                      : 'text-[#08123B] hover:bg-[#F4F6FB]'
                  }`}
                >
                  {activeTab === 'overview' && (
                    <motion.div
                      layoutId="profileTabPill"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-t-lg border-t-2 border-x-2 border-[#08123B] bg-[#08123B] shadow-[2px_-2px_0px_#0052FF] -z-10"
                    />
                  )}
                  OVERVIEW & SKILLS
                </button>
                <button
                  onClick={() => setActiveTab('multihop')}
                  className={`relative px-4 py-2 rounded-t-lg transition-colors flex items-center gap-1.5 z-10 ${
                    activeTab === 'multihop'
                      ? 'text-white'
                      : 'text-[#08123B] hover:bg-[#F4F6FB]'
                  }`}
                >
                  {activeTab === 'multihop' && (
                    <motion.div
                      layoutId="profileTabPill"
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 rounded-t-lg border-t-2 border-x-2 border-[#08123B] bg-[#08123B] shadow-[2px_-2px_0px_#FF007A] -z-10"
                    />
                  )}
                  <Sparkles className="h-3.5 w-3.5 text-[#FF007A]" />
                  <span>WARM INTRO NETWORK (2-HOP)</span>
                </button>
              </div>

              {/* TAB 1: OVERVIEW & RELATIONS */}
              <AnimatePresence mode="wait">
                {activeTab === 'overview' ? (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-6"
                  >
                    {/* Skills Grid */}
                    <div>
                      <h3 className="font-mono-code text-xs font-bold uppercase text-[#08123B] mb-3 flex items-center gap-1.5">
                        <Award className="h-4 w-4 text-[#0052FF]" />
                        SKILL MASTERY GRAPH (:HAS_SKILL)
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {(profile.skills || []).map((sk, idx) => (
                          <motion.div
                            key={idx}
                            whileHover={{ y: -2 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            className="rounded-xl border-2 border-[#08123B] bg-[#FFFFFF] p-3 flex items-center justify-between shadow-[2px_2px_0px_#08123B]"
                          >
                            <div>
                              <p className="text-xs font-bold text-[#08123B] font-display">{sk.name}</p>
                              <p className="text-[10px] text-[#7382A6] font-mono-code">{sk.category}</p>
                            </div>
                            <div className="text-right">
                              <span className="rounded border border-[#08123B] bg-[#F4F6FB] text-[#0052FF] px-1.5 py-0.5 font-mono-code text-[10px] font-bold">
                                LVL {sk.level || 3}/5
                              </span>
                              {sk.years && (
                                <p className="text-[9px] font-mono-code text-[#4A5578] mt-0.5">{sk.years} yrs</p>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Projects Worked On */}
                    {profile.projects && profile.projects.length > 0 && (
                      <div>
                        <h3 className="font-mono-code text-xs font-bold uppercase text-[#08123B] mb-3 flex items-center gap-1.5">
                          <Briefcase className="h-4 w-4 text-[#FF007A]" />
                          PROJECT ENGAGEMENTS (:WORKED_ON)
                        </h3>
                        <div className="space-y-2.5">
                          {profile.projects.map((proj, idx) => (
                            <motion.div
                              key={idx}
                              whileHover={{ y: -2 }}
                              className="rounded-xl border-2 border-[#08123B] bg-[#FFFFFF] p-3.5 shadow-[2px_2px_0px_#08123B]"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-display text-sm font-extrabold text-[#08123B]">{proj.name}</h4>
                                <span className="rounded border border-[#08123B] bg-[#F4F6FB] text-[#08123B] font-mono-code text-[10px] font-bold px-1.5 py-0.5">
                                  {proj.status}
                                </span>
                              </div>
                              <p className="text-xs text-[#4A5578] mb-2 leading-relaxed">{proj.summary}</p>
                              <div className="flex items-center gap-4 text-[11px] font-mono-code text-[#7382A6]">
                                <span>Role: <strong className="text-[#08123B]">{proj.role || 'Contributor'}</strong></span>
                                {proj.companyName && <span>Built for: <strong className="text-[#08123B]">{proj.companyName}</strong></span>}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Direct 1-Hop Connections & Mentorship */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Direct Connections */}
                      <div className="rounded-xl border-2 border-[#08123B] p-4 bg-[#F4F6FB]">
                        <h3 className="font-mono-code text-xs font-bold uppercase text-[#08123B] mb-3 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Users className="h-4 w-4 text-[#0052FF]" />
                            1-HOP NETWORK (:KNOWS)
                          </span>
                          <span className="rounded bg-[#08123B] text-white px-1.5 py-0.2 text-[10px]">
                            {profile.connections?.length || 0}
                          </span>
                        </h3>
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {(profile.connections || []).map((conn, idx) => (
                            <motion.div
                              key={idx}
                              whileHover={{ scale: 1.01 }}
                              className="flex items-center justify-between rounded-lg border border-[#08123B] bg-white p-2 text-xs shadow-[1px_1px_0px_#08123B]"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <img
                                  src={conn.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(conn.name)}`}
                                  alt={conn.name}
                                  className="h-7 w-7 rounded-md border border-[#08123B] object-cover shrink-0"
                                />
                                <div className="truncate">
                                  <p className="font-bold text-[#08123B] truncate font-display">{conn.name}</p>
                                  <p className="text-[10px] text-[#7382A6] truncate">{conn.context || conn.companyName}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  onClose();
                                  onFindPath(conn.id);
                                }}
                                className="rounded border border-[#08123B] bg-[#0052FF] text-white px-2 py-0.5 text-[10px] font-mono-code font-bold hover:bg-[#0042D9] transition-colors"
                              >
                                PATH
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Mentorship Lineage */}
                      <div className="rounded-xl border-2 border-[#08123B] p-4 bg-[#F4F6FB]">
                        <h3 className="font-mono-code text-xs font-bold uppercase text-[#08123B] mb-3 flex items-center gap-1.5">
                          <GraduationCap className="h-4 w-4 text-[#FF007A]" />
                          MENTORSHIP (:MENTORED_BY)
                        </h3>
                        <div className="space-y-3 text-xs">
                          {profile.mentors && profile.mentors.length > 0 && (
                            <div>
                              <p className="font-mono-code text-[10px] font-bold text-[#7382A6] uppercase mb-1">Mentored By:</p>
                              {profile.mentors.map((m, idx) => (
                                <div key={idx} className="flex items-center gap-2 rounded-lg border border-[#08123B] bg-white p-2">
                                  <img src={m.avatarUrl} alt={m.name} className="h-6 w-6 rounded border border-[#08123B] object-cover" />
                                  <div>
                                    <p className="font-bold text-[#08123B] font-display">{m.name}</p>
                                    <p className="text-[10px] text-[#7382A6]">{m.title}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {profile.mentees && profile.mentees.length > 0 && (
                            <div>
                              <p className="font-mono-code text-[10px] font-bold text-[#7382A6] uppercase mb-1">Mentees:</p>
                              <div className="space-y-1.5">
                                {profile.mentees.map((m, idx) => (
                                  <div key={idx} className="flex items-center gap-2 rounded-lg border border-[#08123B] bg-white p-1.5">
                                    <img src={m.avatarUrl} alt={m.name} className="h-5 w-5 rounded border border-[#08123B] object-cover" />
                                    <p className="font-bold text-[#08123B] font-display">{m.name}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {(!profile.mentors?.length && !profile.mentees?.length) && (
                            <p className="text-xs font-mono-code text-[#7382A6] italic p-4 text-center">
                              No explicit mentorship links recorded in the graph.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* TAB 2: MULTI-HOP SKILL TRAVERSAL */
                  <motion.div
                    key="multihop"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-4"
                  >
                    <div className="rounded-xl border-2 border-[#08123B] bg-[#08123B] text-white p-4 shadow-[3px_3px_0px_#0052FF]">
                      <h4 className="font-mono-code text-xs font-bold uppercase mb-1 flex items-center gap-1.5 text-[#FF007A]">
                        <Network className="h-4 w-4" />
                        EXTENDED GRAPH SEARCH (2-3 HOP DISCOVERY)
                      </h4>
                      <p className="text-xs text-white/90 leading-relaxed font-mono-code">
                        Cypher traverses 2 to 3 hops through <code className="bg-black text-[#00D26A] px-1 font-mono-code">(:Person)-[:KNOWS*1..3]-(:Person)</code> to discover warm-connected specialists.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={multiHopSkill}
                        onChange={(e) => setMultiHopSkill(e.target.value)}
                        placeholder="Filter by skill (e.g. PyTorch, Cypher & Graph DBs, Rust)..."
                        className="rounded-lg border-2 border-[#08123B] bg-white px-3 py-2 text-xs font-mono-code flex-1 focus:outline-none shadow-[2px_2px_0px_#08123B]"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => loadMultiHop(multiHopSkill)}
                        className="brutal-btn bg-[#0052FF] text-white px-4 py-2 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9]"
                      >
                        TRAVERSE
                      </motion.button>
                    </div>

                    {loadingMultiHop ? (
                      <div className="py-12 flex justify-center items-center gap-2 font-mono-code text-xs text-[#08123B]">
                        <Loader2 className="h-5 w-5 animate-spin text-[#0052FF]" />
                        <span>EVALUATING MULTI-HOP GRAPH PATHS...</span>
                      </div>
                    ) : multiHopCandidates.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-[#08123B]/40 p-8 text-center font-mono-code text-xs text-[#7382A6]">
                        No candidates found within 3 hops for this skill filter.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {multiHopCandidates.map((cand, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className="rounded-xl border-2 border-[#08123B] bg-white p-3.5 shadow-[2px_2px_0px_#08123B] flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="rounded border border-[#08123B] bg-[#FF007A] text-white px-1.5 py-0.5 font-mono-code text-[10px] font-bold">
                                  {cand.hops} HOPS AWAY
                                </span>
                                <span className="font-mono-code text-[10px] text-[#7382A6]">
                                  {cand.companyName || 'Tech'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <img
                                  src={cand.avatarUrl}
                                  alt={cand.name}
                                  className="h-8 w-8 rounded-lg border border-[#08123B] object-cover shrink-0"
                                />
                                <div>
                                  <p className="font-bold text-sm text-[#08123B] font-display">{cand.name}</p>
                                  <p className="text-[10px] text-[#7382A6]">{cand.title}</p>
                                </div>
                              </div>
                              <div className="rounded border border-[#08123B] bg-[#F4F6FB] p-2 text-[11px] font-mono-code">
                                Skill: <strong className="text-[#0052FF]">{cand.skillName}</strong> (L{cand.skillLevel}/5)
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-zinc-200 flex justify-end">
                              <button
                                onClick={() => {
                                  onClose();
                                  onFindPath(cand.id);
                                }}
                                className="rounded border border-[#08123B] bg-[#08123B] text-white px-2.5 py-1 text-[10px] font-display font-extrabold uppercase hover:bg-[#0052FF] transition-colors"
                              >
                                VIEW INTRO PATH &rarr;
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t-2 border-[#08123B] bg-[#F4F6FB] px-6 py-3.5 flex items-center justify-between">
          <span className="font-mono-code text-[11px] text-[#7382A6]">
            DATA_SOURCE: COGNODB_GRAPH_NODE
          </span>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="brutal-btn bg-white text-[#08123B] px-4 py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#08123B] hover:text-white"
          >
            CLOSE
          </motion.button>
        </div>
      </motion.div>

      {/* Offer Modal */}
      {isOfferModalOpen && profile && (
        <SendOfferModal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          candidate={profile}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
