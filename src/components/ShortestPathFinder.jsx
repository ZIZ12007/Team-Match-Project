import React, { useState, useEffect } from 'react';
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
  const [pathResult, setPathResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Guarantee unique people for select dropdown options
  const uniquePeople = React.useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const p of peopleList || []) {
      if (p && p.id && !seen.has(p.id)) {
        seen.add(p.id);
        result.push(p);
      }
    }
    return result;
  }, [peopleList]);

  // Sync initial props
  useEffect(() => {
    if (initialFromId) setFromId(initialFromId);
    if (initialToId) setToId(initialToId);
  }, [initialFromId, initialToId]);

  const findPath = async () => {
    if (!fromId || !toId) return;
    if (fromId === toId) {
      setError('Please select two distinct people to calculate shortest path.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.getShortestPath(fromId, toId);
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
    setFromId(toId);
    setToId(fromId);
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
            GRAPH ALGORITHMS // SIX DEGREES OF SEPARATION
          </span>
          <span className="rounded-md border border-white/20 bg-white/10 text-white px-2 py-0.5 font-mono-code text-xs">
            BIDIRECTIONAL BFS
          </span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight">
          Variable-Length Shortest Path Finder
        </h2>
        <p className="text-xs sm:text-sm font-mono-code text-white/80 mt-1 max-w-2xl leading-relaxed">
          Computes the shortest network path <code className="bg-black text-[#00D26A] px-1.5 py-0.5 rounded font-mono-code">shortestPath((p1)-[:KNOWS*1..6]-(p2))</code> between any two startup individuals in milliseconds.
        </p>
      </motion.div>

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
            <label className="font-mono-code text-xs font-bold uppercase text-[#08123B] flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-[#0052FF]" />
              ORIGIN NODE (A)
            </label>
            <select
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
              className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] p-2.5 font-mono-code text-xs font-bold focus:outline-none shadow-[2px_2px_0px_#08123B] transition-shadow"
            >
              {uniquePeople.length > 0 ? (
                uniquePeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.title})
                  </option>
                ))
              ) : (
                <>
                  <option value="p1">Elena Rostova (Founder & CEO)</option>
                  <option value="p2">Marcus Vance (CTO)</option>
                  <option value="p3">Chloe Dubois (VP of AI Product)</option>
                  <option value="p7">Siddharth Menon (Founding Engineer)</option>
                  <option value="p14">Aleksei Volkov (Principal Engineer)</option>
                </>
              )}
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
            <label className="font-mono-code text-xs font-bold uppercase text-[#08123B] flex items-center gap-1.5">
              <GitMerge className="h-4 w-4 text-[#FF007A]" />
              DESTINATION NODE (B)
            </label>
            <select
              value={toId}
              onChange={(e) => setToId(e.target.value)}
              className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] p-2.5 font-mono-code text-xs font-bold focus:outline-none shadow-[2px_2px_0px_#08123B] transition-shadow"
            >
              {uniquePeople.length > 0 ? (
                uniquePeople.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.title})
                  </option>
                ))
              ) : (
                <>
                  <option value="p14">Aleksei Volkov (Principal Systems Engineer)</option>
                  <option value="p18">Kavita Sharma (Lead Algorithms Researcher)</option>
                  <option value="p10">Kenji Takahashi (Principal Security Lead)</option>
                  <option value="p7">Siddharth Menon (Founding Engineer)</option>
                  <option value="p2">Marcus Vance (CTO)</option>
                </>
              )}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={findPath}
            disabled={loading}
            className="brutal-btn bg-[#0052FF] text-white px-5 py-2 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9] flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span>{loading ? 'TRAVERSING GRAPH...' : 'RE-CALCULATE SHORTEST PATH'}</span>
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

      {/* PATH RESULT DISPLAY WITH TRANSITIONS.DEV SEQUENTIAL STAGGER */}
      {pathResult && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {pathResult.found === false ? (
            <div className="brutal-card p-8 bg-white text-center font-mono-code space-y-2">
              <p className="text-sm font-bold uppercase text-[#FF007A] mb-1">NO GRAPH PATH FOUND</p>
              <p className="text-xs text-[#7382A6]">
                {pathResult.message || 'No direct or mutual connections found within 6 degrees of separation.'}
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stat Card with spring bounce */}
              <motion.div
                initial={{ scale: 0.98, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="brutal-card p-5 bg-[#F4F6FB] flex flex-wrap items-center justify-between gap-4 shadow-[4px_4px_0px_#08123B]"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-md border border-[#08123B] bg-[#0052FF] text-white px-2 py-0.5 font-mono-code text-xs font-bold uppercase">
                      STATUS: PATH RESOLVED
                    </span>
                    <span className="font-mono-code text-xs text-[#4A5578]">
                      HOPS: {pathResult.degrees ?? pathResult.distance ?? 0} // NODES: {(pathResult.chain || pathResult.path || []).length}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-extrabold text-[#08123B] flex items-center gap-2">
                    <Zap className="h-5 w-5 text-[#FF007A]" />
                    {(pathResult.degrees ?? pathResult.distance) === 1
                      ? '1st Degree Connection (Direct Colleagues)'
                      : (pathResult.degrees ?? pathResult.distance) === 2
                      ? '2nd Degree Connection (1 Mutual Introduction)'
                      : `${pathResult.degrees ?? pathResult.distance} Degrees of Separation`}
                  </h3>
                </div>

                <div className="text-right">
                  <div className="rounded-lg border-2 border-[#08123B] bg-white p-2.5 font-mono-code shadow-[2px_2px_0px_#08123B]">
                    <p className="text-[10px] text-[#7382A6] uppercase font-bold">CYPHER PATH COST</p>
                    <p className="text-sm font-extrabold text-[#08123B]">
                      {pathResult.degrees ?? pathResult.distance ?? 0} RELATIONSHIPS
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Sequential Path Chain Stepper with Transitions.dev flow */}
              <div className="space-y-3">
                <h4 className="font-mono-code text-xs font-bold uppercase text-[#08123B]">
                  INTRODUCTION CHAIN & CONTEXTUAL EDGES:
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
                                    : 'bg-[#08123B] text-white border-[#08123B]'
                                }`}
                              >
                                STEP {idx + 1} {isFirst ? '(ORIGIN)' : isLast ? '(TARGET)' : '(CONNECTOR)'}
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

                          <div className="mt-3 pt-2 border-t border-[#08123B]/15 flex justify-end">
                            <button
                              onClick={() => onViewProfile(node.id)}
                              className="text-[10px] font-mono-code font-bold uppercase text-[#0052FF] hover:underline"
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
                            <span className="text-[#0052FF] font-bold">[:KNOWS]</span>{' '}
                            {typeof edge === 'string' ? edge : edge.context || 'Industry Peers & Collaborators'}
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
