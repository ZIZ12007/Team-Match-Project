import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { HealthBanner } from './components/HealthBanner';
import { PersonCard } from './components/PersonCard';
import { PersonProfileModal } from './components/PersonProfileModal';
import { NetworkGraphView } from './components/NetworkGraphView';
import { TeamMatcher } from './components/TeamMatcher';
import { ShortestPathFinder } from './components/ShortestPathFinder';
import { CypherPlayground } from './components/CypherPlayground';
import { DatabaseManager } from './components/DatabaseManager';
import { api, ApiError } from './api/client';
import {
  Search,
  Filter,
  Sparkles,
  SlidersHorizontal,
  X,
  Users,
  Network,
  Activity,
  Layers,
  Zap,
  ArrowRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'graph' | 'match' | 'path' | 'cypher' | 'database'

  // Health state
  const [health, setHealth] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Search & Talent Directory state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkillFilter, setSelectedSkillFilter] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState('');
  const [allSkills, setAllSkills] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [people, setPeople] = useState([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [searchError, setSearchError] = useState(null);

  // Person Modal state
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  // Graph Explorer state
  const [explorerFocusPersonId, setExplorerFocusPersonId] = useState('p1');

  // Shortest Path state
  const [pathPair, setPathPair] = useState({
    fromId: 'p1',
    toId: 'p14',
  });

  // Check backend and DB health
  const checkHealth = useCallback(async () => {
    setCheckingHealth(true);
    try {
      const data = await api.checkHealth();
      setHealth(data);
    } catch (err) {
      setHealth({
        status: 'error',
        connected: false,
        error: err.message || 'Server offline',
      });
    } finally {
      setCheckingHealth(false);
    }
  }, []);

  // Load skills list
  const loadSkills = useCallback(async () => {
    try {
      const res = await api.getSkills();
      const raw = res.skills || [];
      const seen = new Set();
      const uniqueSkills = [];
      for (const s of raw) {
        const key = s.name || s.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueSkills.push(s);
        }
      }
      setAllSkills(uniqueSkills);
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  }, []);

  // Load people list based on filters
  const loadPeople = useCallback(async () => {
    setLoadingPeople(true);
    setSearchError(null);
    try {
      const res = await api.searchPeople({
        q: searchQuery,
        skill: selectedSkillFilter,
        company: selectedCompanyFilter,
        limit: 48,
      });
      const rawPeople = res.people || [];
      const seen = new Set();
      const uniquePeople = [];
      for (const p of rawPeople) {
        if (p && p.id && !seen.has(p.id)) {
          seen.add(p.id);
          uniquePeople.push(p);
        }
      }
      setPeople(uniquePeople);

      if (uniquePeople.length > 0) {
        const comps = Array.from(
          new Set(uniquePeople.map((p) => p.companyName).filter(Boolean))
        );
        setAllCompanies(comps);
      }
    } catch (err) {
      if (err instanceof ApiError && err.isDbDown) {
        setSearchError('CognoDB database is unreachable. Check connection status banner.');
      } else {
        setSearchError(err.message || 'Failed to search people.');
      }
    } finally {
      setLoadingPeople(false);
    }
  }, [searchQuery, selectedSkillFilter, selectedCompanyFilter]);

  // Initial load
  useEffect(() => {
    checkHealth();
    loadSkills();
  }, [checkHealth, loadSkills]);

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      loadPeople();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadPeople]);

  // Trigger Seeding from banner
  const handleSeed = async () => {
    setSeeding(true);
    try {
      await api.seedDatabase();
      await checkHealth();
      await loadSkills();
      await loadPeople();
    } catch (err) {
      console.error('Seed failed:', err);
    } finally {
      setSeeding(false);
    }
  };

  // Actions on cards
  const handleViewProfile = (person) => {
    const id = typeof person === 'string' ? person : person.id;
    setSelectedPersonId(id);
  };

  const handleExploreGraph = (person) => {
    const id = typeof person === 'string' ? person : person.id;
    setExplorerFocusPersonId(id);
    setActiveTab('graph');
  };

  const handleFindPath = (person) => {
    const id = typeof person === 'string' ? person : person.id;
    setPathPair((prev) => ({
      fromId: 'p1', // Elena Rostova
      toId: id,
    }));
    setActiveTab('path');
  };

  return (
    <div className="min-h-screen bg-[#F4F6FB] text-[#08123B] flex flex-col selection:bg-[#FF007A] selection:text-white">
      {/* Top Bar Contract: 3 zones */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        health={health}
        checkingHealth={checkingHealth}
        onRefreshHealth={checkHealth}
        onOpenMatch={() => setActiveTab('match')}
      />

      {/* Database Connection Alert Banner */}
      <HealthBanner
        health={health}
        onSeed={handleSeed}
        seeding={seeding}
        onRefresh={checkHealth}
      />

      {/* Fintech Live Telemetry Ticker */}
      <div className="border-b-2 border-[#08123B] bg-[#08123B] text-white py-1.5 px-4 overflow-x-auto select-none">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-6 font-mono-code text-[11px] whitespace-nowrap">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[#00D26A] font-bold">
              <Activity className="h-3.5 w-3.5" />
              <span>COGNO_DB: BOLT+S SECURE</span>
            </span>
            <span className="flex items-center gap-1.5 text-white/80">
              <Layers className="h-3.5 w-3.5 text-[#0052FF]" />
              <span>NODES: <strong className="text-white">{people.length || 24}+ INDEXED</strong></span>
            </span>
            <span className="flex items-center gap-1.5 text-white/80">
              <Zap className="h-3.5 w-3.5 text-[#FF007A]" />
              <span>QUERY ENGINE: <strong className="text-white">CYPHER 5.x</strong></span>
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-white/80">
              <Cpu className="h-3.5 w-3.5 text-[#0052FF]" />
              <span>BFS LATENCY: <strong className="text-[#00D26A]">&lt;4ms</strong></span>
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[#FF007A] font-bold">
            <span>STARTUP GRAPH INTELLIGENCE</span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF007A] animate-ping" />
          </div>
        </div>
      </div>

      {/* Main Content Area with Transitions.dev Smooth Fluid Switcher */}
      <main className={`mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full transition-all ${
        activeTab === 'graph' ? 'max-w-[1600px]' : 'max-w-7xl'
      }`}>
        <AnimatePresence mode="wait">
          {/* TAB 1: PEOPLE SEARCH & TALENT GRAPH DIRECTORY */}
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Hero Editorial Header */}
              <div className="brutal-card p-6 sm:p-8 bg-[#FFFFFF] border-2 border-[#08123B] relative overflow-hidden shadow-[6px_6px_0px_#08123B]">
                <div className="max-w-3xl">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="rounded-md border-2 border-[#08123B] bg-[#0052FF] text-white px-2.5 py-0.5 font-mono-code text-xs font-bold uppercase tracking-wider">
                      GRAPH_DATABASE // NEIGHBORHOOD_TRAVERSAL
                    </span>
                    <span className="hidden sm:inline rounded-md border border-[#08123B] bg-[#F4F6FB] px-2 py-0.5 font-mono-code text-xs font-semibold text-[#08123B]">
                      DIRECT POINTER SPEED
                    </span>
                  </div>

                  <h1 className="font-editorial italic text-3xl sm:text-5xl lg:text-6xl text-[#08123B] leading-none mb-3">
                    Graph-Powered Talent & Team Discovery
                  </h1>

                  <p className="font-mono-code text-xs sm:text-sm text-[#4A5578] max-w-2xl leading-relaxed">
                    Query high-density engineer networks, mentorship hierarchies, and multi-hop paths natively in milliseconds without recursive SQL self-joins.
                  </p>
                </div>

                {/* Decorative Fintech Callout Badge */}
                <div className="hidden lg:block absolute right-8 top-8 rounded-xl border-2 border-[#08123B] bg-[#08123B] text-white p-4 font-mono-code text-xs max-w-xs shadow-[4px_4px_0px_#FF007A]">
                  <p className="font-bold uppercase text-[#FF007A] mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>CYPHER ENGINE READY</span>
                  </p>
                  <p className="text-[11px] text-white/80 leading-relaxed">
                    Pointer-based BFS traversal eliminates cold outreach with warm social paths.
                  </p>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="brutal-card p-4 bg-white space-y-3 shadow-[4px_4px_0px_#08123B]">
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  {/* Search Text Input */}
                  <div className="sm:col-span-6 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7382A6]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, role, bio keywords, or location..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] font-mono-code text-xs font-semibold focus:outline-none shadow-[2px_2px_0px_#08123B]"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono-code font-bold text-[#FF007A] hover:text-[#08123B]"
                      >
                        [CLEAR]
                      </button>
                    )}
                  </div>

                  {/* Skill Filter Dropdown */}
                  <div className="sm:col-span-3">
                    <select
                      value={selectedSkillFilter}
                      onChange={(e) => setSelectedSkillFilter(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] font-mono-code text-xs font-semibold focus:outline-none shadow-[2px_2px_0px_#08123B]"
                    >
                      <option value="">All Skills ({allSkills.length})</option>
                      {allSkills.map((s) => (
                        <option key={s.id || s.name} value={s.name}>
                          {s.name} ({s.personCount || 0})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Company Filter Dropdown */}
                  <div className="sm:col-span-3">
                    <select
                      value={selectedCompanyFilter}
                      onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] font-mono-code text-xs font-semibold focus:outline-none shadow-[2px_2px_0px_#08123B]"
                    >
                      <option value="">All Companies</option>
                      {allCompanies.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Filter Chips */}
                {(selectedSkillFilter || selectedCompanyFilter || searchQuery) && (
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#08123B]/15">
                    <span className="font-mono-code text-[11px] text-[#7382A6] uppercase font-bold">
                      ACTIVE FILTERS:
                    </span>
                    {searchQuery && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#08123B] bg-[#F4F6FB] px-2 py-0.5 text-xs font-mono-code font-bold text-[#08123B]">
                        Query: "{searchQuery}"
                        <button onClick={() => setSearchQuery('')}><X className="h-3 w-3 text-[#FF007A]" /></button>
                      </span>
                    )}
                    {selectedSkillFilter && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#08123B] bg-[#0052FF] text-white px-2 py-0.5 text-xs font-mono-code font-bold">
                        Skill: {selectedSkillFilter}
                        <button onClick={() => setSelectedSkillFilter('')}><X className="h-3 w-3" /></button>
                      </span>
                    )}
                    {selectedCompanyFilter && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#08123B] bg-[#08123B] text-white px-2 py-0.5 text-xs font-mono-code font-bold">
                        Company: {selectedCompanyFilter}
                        <button onClick={() => setSelectedCompanyFilter('')}><X className="h-3 w-3" /></button>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {searchError && (
                <div className="rounded-xl border-2 border-[#08123B] bg-[#FF007A] text-white p-4 font-mono-code text-xs shadow-[3px_3px_0px_#08123B]">
                  <p className="font-bold uppercase">[QUERY STATUS] {searchError}</p>
                </div>
              )}

              {/* People Cards Grid */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display text-lg font-extrabold text-[#08123B]">
                    Discovered Talent ({people.length})
                  </h3>
                  <span className="font-mono-code text-xs text-[#7382A6]">
                    INDEXED IN COGNODB GRAPH
                  </span>
                </div>

                {loadingPeople ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="brutal-card p-5 bg-white animate-pulse space-y-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-slate-200" />
                          <div className="space-y-1.5 flex-1">
                            <div className="h-4 bg-slate-200 rounded w-3/4" />
                            <div className="h-3 bg-slate-200 rounded w-1/2" />
                          </div>
                        </div>
                        <div className="h-3 bg-slate-200 rounded w-full" />
                        <div className="h-8 bg-slate-200 rounded w-full" />
                      </div>
                    ))}
                  </div>
                ) : people.length === 0 ? (
                  <div className="brutal-card p-12 bg-white text-center font-mono-code space-y-2">
                    <p className="text-base font-bold text-[#08123B] uppercase">NO TALENT NODES FOUND</p>
                    <p className="text-xs text-[#7382A6]">
                      Try adjusting your search query or clear skill and company filters.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {people.map((person, idx) => (
                      <PersonCard
                        key={person.id}
                        person={person}
                        index={idx}
                        onViewProfile={handleViewProfile}
                        onExploreGraph={handleExploreGraph}
                        onFindPath={handleFindPath}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: INTERACTIVE NETWORK GRAPH CANVAS */}
          {activeTab === 'graph' && (
            <motion.div
              key="graph"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              transition={{ duration: 0.18 }}
            >
              <NetworkGraphView
                focusPersonId={explorerFocusPersonId}
                onSelectPerson={(id) => setExplorerFocusPersonId(id)}
                onViewProfile={handleViewProfile}
              />
            </motion.div>
          )}

          {/* TAB 3: GRAPH-AUGMENTED TEAM MATCHER */}
          {activeTab === 'match' && (
            <motion.div
              key="match"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <TeamMatcher
                allSkills={allSkills}
                onViewProfile={handleViewProfile}
                onExploreGraph={handleExploreGraph}
                onFindPath={handleFindPath}
              />
            </motion.div>
          )}

          {/* TAB 4: SHORTEST PATH FINDER */}
          {activeTab === 'path' && (
            <motion.div
              key="path"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <ShortestPathFinder
                initialFromId={pathPair.fromId}
                initialToId={pathPair.toId}
                peopleList={people}
                onViewProfile={handleViewProfile}
              />
            </motion.div>
          )}

          {/* TAB 5: CYPHER QUERY LAB */}
          {activeTab === 'cypher' && (
            <motion.div
              key="cypher"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <CypherPlayground />
            </motion.div>
          )}

          {/* TAB 6: DATABASE TELEMETRY & STATS */}
          {activeTab === 'database' && (
            <motion.div
              key="database"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <DatabaseManager
                onRefreshAll={() => {
                  checkHealth();
                  loadSkills();
                  loadPeople();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Person Detail Profile Modal with AnimatePresence */}
      <AnimatePresence>
        {selectedPersonId && (
          <PersonProfileModal
            personId={selectedPersonId}
            onClose={() => setSelectedPersonId(null)}
            onExploreGraph={handleExploreGraph}
            onFindPath={handleFindPath}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t-2 border-[#08123B] bg-[#FFFFFF] py-6 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono-code text-xs text-[#4A5578]">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-[#08123B]">STARTUP GRAPH</span>
            <span>// HIGH-FIDELITY FINTECH INTEL</span>
          </div>
          <div>
            <span>BACKED BY COGNODB BOLT ENGINE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
