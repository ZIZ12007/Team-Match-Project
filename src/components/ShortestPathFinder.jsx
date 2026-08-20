import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  GitMerge,
  ArrowRight,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Sparkles,
  Zap,
  Mail,
  Copy,
  Users,
  Compass,
  Check,
} from 'lucide-react';
import { api } from '../api/client';

export function ShortestPathFinder({
  initialFromId = 'p1',
  initialToId = 'p14',
  peopleList = [],
  onViewProfile,
}) {
  const [fromId, setFromId] = useState(initialFromId);
  const [toId, setToId] = useState(initialToId);
  const [directory, setDirectory] = useState(peopleList || []);
  const [pathResult, setPathResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  // Always fetch full directory if peopleList is short or empty
  useEffect(() => {
    let isMounted = true;
    async function loadDirectory() {
      try {
        const res = await api.getPeople({ limit: 100 });
        if (isMounted && res?.people?.length > 0) {
          setDirectory(res.people);
        }
      } catch (err) {
        console.warn('Could not fetch full directory for path finder:', err);
      }
    }
    if (!peopleList || peopleList.length < 15) {
      loadDirectory();
    } else {
      setDirectory(peopleList);
    }
    return () => {
      isMounted = false;
    };
  }, [peopleList]);

  // Guarantee unique people for select dropdown options
  const uniquePeople = useMemo(() => {
    const map = new Map();
    for (const p of directory || []) {
      if (p && p.id && !map.has(p.id)) {
        map.set(p.id, p);
      }
    }
    for (const p of peopleList || []) {
      if (p && p.id && !map.has(p.id)) {
        map.set(p.id, p);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [directory, peopleList]);

  // Sync initial props if changed from parent
  useEffect(() => {
    if (initialFromId) setFromId(initialFromId);
  }, [initialFromId]);

  useEffect(() => {
    if (initialToId) setToId(initialToId);
  }, [initialToId]);

  const findPath = async (overrideFrom = null, overrideTo = null) => {
    const fId = overrideFrom || fromId;
    const tId = overrideTo || toId;

    if (!fId || !tId) return;
    if (fId === tId) {
      setError('Please select two distinct people to calculate a warm introduction path.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.getShortestPath(fId, tId);
      setPathResult(res);
    } catch (err) {
      setError(err.message || 'Failed to calculate shortest path.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    findPath();
  }, [fromId, toId]);

  const handleSwap = () => {
    const prevFrom = fromId;
    const prevTo = toId;
    setFromId(prevTo);
    setToId(prevFrom);
  };

  const handleSelectPreset = (pFrom, pTo) => {
    setFromId(pFrom);
    setToId(pTo);
    findPath(pFrom, pTo);
  };

  const handleCopyIntroTemplate = (connectorName, targetName, idx) => {
    const text = `Hi ${connectorName},\n\nHope you're doing well! I saw you're connected with ${targetName}. We're currently looking for expertise in this domain at our team, and I’d love to connect with them.\n\nWould you be open to introducing us?\n\nThanks so much!`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="brutal-card p-6 bg-[#08123B] text-white border-2 border-[#08123B] shadow-[6px_6px_0px_#0052FF]"
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="rounded-md border border-white bg-[#0052FF] text-white px-2.5 py-0.5 font-mono-code text-xs font-bold uppercase">
            WARM INTRO FINDER // SIX DEGREES OF CONNECTION
          </span>
          <span className="rounded-md border border-white/20 bg-white/10 text-white px-2 py-0.5 font-mono-code text-xs">
            NO COLD EMAILS
          </span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
          Warm Introduction & Referral Path Finder
        </h2>
        <p className="text-xs sm:text-sm font-mono-code text-white/80 mt-1 max-w-2xl leading-relaxed">
          Never send a cold email. Select who you are (or someone on your team) and who you want to meet — we trace the exact chain of mutual friends and colleagues who can introduce you.
        </p>
      </motion.div>

      {/* Comprehensive Plain-English Breakdown Card */}
      <div className="brutal-card p-5 bg-[#F4F6FB] border-2 border-[#08123B] shadow-[4px_4px_0px_#08123B] space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-[#0052FF] text-white flex items-center justify-center font-bold text-xs">
            💡
          </div>
          <h3 className="font-display text-sm font-extrabold text-[#08123B] uppercase">
            How Warm Introductions Work Here (Non-Technical Breakdown)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="p-3.5 bg-white rounded-xl border border-[#08123B]/15 space-y-1">
            <span className="inline-block px-2 py-0.5 rounded bg-[#EBF7EE] text-[#008A3E] font-mono-code text-[11px] font-bold">
              1. Why This Matters
            </span>
            <p className="text-xs font-mono-code text-[#4A5578] leading-relaxed">
              Cold InMails have a <strong>&lt;5% reply rate</strong>. Warm introductions via mutual coworkers have a <strong>&gt;60% reply rate</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#08123B]/15 space-y-1">
            <span className="inline-block px-2 py-0.5 rounded bg-[#EFF6FF] text-[#0052FF] font-mono-code text-[11px] font-bold">
              2. What the Engine Does
            </span>
            <p className="text-xs font-mono-code text-[#4A5578] leading-relaxed">
              It searches all past companies, projects, and mentorship ties to find the shortest bridge between two people in under <strong>5ms</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#08123B]/15 space-y-1">
            <span className="inline-block px-2 py-0.5 rounded bg-[#FFFBEB] text-[#D97706] font-mono-code text-[11px] font-bold">
              3. What You Do Next
            </span>
            <p className="text-xs font-mono-code text-[#4A5578] leading-relaxed">
              Look at <strong>Step 2 (The Connector)</strong> in the chain below. Message them to ask for a warm introduction to your target candidate.
            </p>
          </div>
        </div>

        {/* Quick 1-Click Example Presets */}
        <div className="pt-2 border-t border-[#08123B]/15 flex flex-wrap items-center gap-2">
          <span className="font-mono-code text-[11px] font-bold text-[#7382A6] uppercase">
            ⚡ Quick Test Presets:
          </span>
          <button
            onClick={() => handleSelectPreset('p1', 'p14')}
            className="px-2.5 py-1 rounded-md border border-[#08123B] bg-white hover:bg-[#0052FF] hover:text-white text-[11px] font-mono-code font-bold text-[#08123B] transition-colors"
          >
            Founder (Elena) → AI Principal (Aleksei)
          </button>
          <button
            onClick={() => handleSelectPreset('p2', 'p18')}
            className="px-2.5 py-1 rounded-md border border-[#08123B] bg-white hover:bg-[#0052FF] hover:text-white text-[11px] font-mono-code font-bold text-[#08123B] transition-colors"
          >
            CTO (Marcus) → Algorithms Lead (Kavita)
          </button>
          <button
            onClick={() => handleSelectPreset('p3', 'p10')}
            className="px-2.5 py-1 rounded-md border border-[#08123B] bg-white hover:bg-[#0052FF] hover:text-white text-[11px] font-mono-code font-bold text-[#08123B] transition-colors"
          >
            VP Product (Chloe) → Security Lead (Kenji)
          </button>
        </div>
      </div>

      {/* Origin & Destination Selectors */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="brutal-card p-6 bg-white space-y-4 shadow-[4px_4px_0px_#08123B]"
      >
        <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
          {/* FROM PERSON */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="font-mono-code text-xs font-bold uppercase text-[#08123B] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-[#0052FF]" />
                1. STARTING PERSON (YOU / TEAM)
              </span>
              <span className="text-[10px] text-[#7382A6] font-normal">Origin</span>
            </label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] p-2.5 font-mono-code text-xs font-bold focus:outline-none shadow-[2px_2px_0px_#08123B] transition-shadow cursor-pointer"
            >
              {uniquePeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.title})
                </option>
              ))}
            </select>
          </div>

          {/* SWAP BUTTON */}
          <div className="md:col-span-1 flex justify-center pt-4 md:pt-0">
            <motion.button
              whileHover={{ scale: 1.15, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              onClick={handleSwap}
              className="brutal-btn bg-[#FF007A] text-white p-2.5 hover:bg-[#E6006E]"
              title="Swap Origin and Destination"
            >
              <RefreshCw className="h-4 w-4 stroke-[2.5]" />
            </motion.button>
          </div>

          {/* TO PERSON */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="font-mono-code text-xs font-bold uppercase text-[#08123B] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GitMerge className="h-4 w-4 text-[#FF007A]" />
                2. TARGET PERSON (WHO YOU WANT TO MEET)
              </span>
              <span className="text-[10px] text-[#7382A6] font-normal">Destination</span>
            </label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] p-2.5 font-mono-code text-xs font-bold focus:outline-none shadow-[2px_2px_0px_#08123B] transition-shadow cursor-pointer"
            >
              {uniquePeople.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.title})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#08123B]/10">
          <p className="text-xs font-mono-code text-[#7382A6]">
            Selecting any person will instantly re-calculate the connection chain in real time.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => findPath()}
            disabled={loading}
            className="brutal-btn bg-[#0052FF] text-white px-5 py-2 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9] flex items-center gap-2 shrink-0"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>{loading ? 'TRAVERSING GRAPH...' : 'RE-CALCULATE PATH'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ERROR MESSAGE */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border-2 border-[#08123B] bg-[#FF007A] text-white p-4 font-mono-code text-xs shadow-[3px_3px_0px_#08123B] flex items-center gap-2"
          >
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PATH RESULT DISPLAY */}
      {pathResult && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {pathResult.found === false ? (
            <div className="brutal-card p-8 bg-white text-center font-mono-code space-y-2">
              <p className="text-sm font-bold uppercase text-[#FF007A] mb-1">NO DIRECT OR MUTUAL PATH FOUND</p>
              <p className="text-xs text-[#7382A6]">
                {pathResult.message || 'No direct or mutual connections found within 6 degrees of separation.'}
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stat Card */}
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="brutal-card p-5 bg-[#F4F6FB] flex flex-wrap items-center justify-between gap-4 shadow-[4px_4px_0px_#08123B]"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-md border border-[#08123B] bg-[#0052FF] text-white px-2 py-0.5 font-mono-code text-xs font-bold uppercase">
                      STATUS: WARM PATH FOUND
                    </span>
                    <span className="font-mono-code text-xs text-[#4A5578]">
                      {(pathResult.degrees ?? pathResult.distance ?? 0) === 1
                        ? '1 DIRECT CONNECTION'
                        : `${pathResult.degrees ?? pathResult.distance ?? 0} HANDSHAKES APART`}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-extrabold text-[#08123B] flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#FF007A]" />
                    {(pathResult.degrees ?? pathResult.distance) === 1
                      ? '1st Degree Connection (Direct Colleagues)'
                      : (pathResult.degrees ?? pathResult.distance) === 2
                      ? '2nd Degree Connection (1 Mutual Introduction Needed)'
                      : `${pathResult.degrees ?? pathResult.distance} Degrees of Separation`}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="rounded-lg border-2 border-[#08123B] bg-white p-2.5 font-mono-code shadow-[2px_2px_0px_#08123B]">
                    <p className="text-[10px] text-[#7382A6] uppercase font-bold">TOTAL BRIDGE NODES</p>
                    <p className="text-sm font-extrabold text-[#08123B]">
                      {(pathResult.chain || pathResult.path || []).length} PEOPLE IN CHAIN
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Sequential Path Chain Stepper */}
              <div className="space-y-3">
                <h4 className="font-mono-code text-xs font-bold uppercase text-[#08123B] flex items-center gap-1.5">
                  <Compass className="h-4 w-4 text-[#0052FF]" />
                  <span>STEP-BY-STEP INTRODUCTION CHAIN:</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(pathResult.chain || pathResult.path || []).map((node, idx, arr) => {
                    const isFirst = idx === 0;
                    const isLast = idx === arr.length - 1;
                    const contexts = pathResult.relationshipContexts || pathResult.relationships || [];
                    const edge = contexts[idx];

                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          type: 'spring',
                          stiffness: 380,
                          damping: 24,
                          delay: idx * 0.08,
                        }}
                        className="flex flex-col justify-between"
                      >
                        <motion.div
                          whileHover={{ y: -3 }}
                          className={`brutal-card p-4 h-full flex flex-col justify-between transition-all ${
                            isFirst
                              ? 'border-2 border-[#08123B] bg-[#EBF7EE]'
                              : isLast
                              ? 'border-2 border-[#08123B] bg-[#EFF6FF]'
                              : 'bg-white'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`rounded px-1.5 py-0.5 font-mono-code text-[10px] font-bold border ${
                                  isFirst
                                    ? 'bg-[#008A3E] text-white border-[#008A3E]'
                                    : isLast
                                    ? 'bg-[#0052FF] text-white border-[#0052FF]'
                                    : 'bg-[#FF007A] text-white border-[#FF007A]'
                                }`}
                              >
                                STEP {idx + 1} {isFirst ? '(YOU)' : isLast ? '(TARGET)' : '(THE CONNECTOR)'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2.5 mb-2">
                              <img
                                src={node.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(node.name)}`}
                                alt={node.name}
                                className="h-10 w-10 rounded-xl border-2 border-[#08123B] object-cover shrink-0"
                              />
                              <div>
                                <h5 className="font-display font-extrabold text-sm text-[#08123B]">
                                  {node.name}
                                </h5>
                                <p className="text-[11px] font-mono-code text-[#4A5578] line-clamp-1">{node.title}</p>
                              </div>
                            </div>

                            {node.companyName && (
                              <p className="text-[11px] font-mono-code text-[#7382A6]">
                                Company: <strong className="text-[#08123B]">{node.companyName}</strong>
                              </p>
                            )}
                          </div>

                          <div className="mt-3 pt-2 border-t border-[#08123B]/15 flex items-center justify-between gap-2">
                            {!isFirst && !isLast && (
                              <button
                                onClick={() => handleCopyIntroTemplate(node.name, arr[arr.length - 1].name, idx)}
                                className="text-[10px] font-mono-code font-bold uppercase text-[#008A3E] hover:underline flex items-center gap-1"
                                title="Copy a pre-filled introduction email asking this person for an intro"
                              >
                                {copiedIndex === idx ? (
                                  <>
                                    <Check className="h-3 w-3 text-[#008A3E]" />
                                    <span>COPIED!</span>
                                  </>
                                ) : (
                                  <>
                                    <Mail className="h-3 w-3" />
                                    <span>ASK FOR INTRO</span>
                                  </>
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => onViewProfile(node.id)}
                              className="text-[10px] font-mono-code font-bold uppercase text-[#0052FF] hover:underline ml-auto"
                            >
                              VIEW PROFILE →
                            </button>
                          </div>
                        </motion.div>

                        {/* Edge Connection Context arrow between cards */}
                        {edge && idx < arr.length - 1 && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: idx * 0.08 + 0.04 }}
                            className="my-2 p-2 rounded-lg border border-dashed border-[#08123B] bg-white text-[11px] font-mono-code text-center shadow-[1px_1px_0px_#08123B]"
                          >
                            <span className="text-[#0052FF] font-bold">🤝 HOW THEY KNOW EACH OTHER:</span>
                            <div className="text-[#08123B] font-semibold mt-0.5">
                              {typeof edge === 'string' ? edge : edge.context || 'Former Colleagues & Project Collaborators'}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

