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
import { HowToUseModal } from './components/HowToUseModal';
import { OnboardingTourModal } from './components/OnboardingTourModal';
import { AuthModal } from './components/AuthModal';
import { NotificationBubble } from './components/NotificationBubble';
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
  Lightbulb,
  GitMerge,
  Compass,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  UserPlus,
  LogIn,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'graph' | 'match' | 'path' | 'cypher' | 'database'

  // Non-technical Guide modal state
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [showGettingStarted, setShowGettingStarted] = useState(true);

  // Introductory Onboarding Tour state
  const [isTourOpen, setIsTourOpen] = useState(() => {
    return !localStorage.getItem('has_completed_startup_graph_tour');
  });

  // Authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('startup_graph_token') || '');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); // 'login' | 'signup' | 'verify'

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
  const [allDirectoryPeople, setAllDirectoryPeople] = useState([]);
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

  // Fetch current user if token exists
  useEffect(() => {
    async function restoreSession() {
      const token = localStorage.getItem('startup_graph_token');
      if (!token) return;
      try {
        const res = await api.getMe(token);
        if (res?.authenticated && res.user) {
          setCurrentUser(res.user);
          setPathPair((prev) => ({ ...prev, fromId: res.user.id }));
        }
      } catch (err) {
        console.warn('Session restore failed:', err);
        localStorage.removeItem('startup_graph_token');
      }
    }
    restoreSession();
  }, []);

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

      // Save initial comprehensive directory when no filters are active
      if (!searchQuery && !selectedSkillFilter && !selectedCompanyFilter && uniquePeople.length > 0) {
        setAllDirectoryPeople(uniquePeople);
      }

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

  // Auth Handlers
  const handleOpenAuth = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user, token) => {
    setCurrentUser(user);
    setAuthToken(token);
    setPathPair((prev) => ({ ...prev, fromId: user.id }));
    // Refresh directory & database health to reflect new node
    loadPeople();
    checkHealth();
    loadSkills();
  };

  const handleLogout = async () => {
    try {
      if (authToken) await api.logout(authToken);
    } catch (err) {}
    localStorage.removeItem('startup_graph_token');
    setCurrentUser(null);
    setAuthToken('');
    setPathPair((prev) => ({ ...prev, fromId: 'p1' }));
  };

  const handleCloseTour = () => {
    localStorage.setItem('has_completed_startup_graph_tour', 'true');
    setIsTourOpen(false);
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
      fromId: currentUser?.id || 'p1',
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
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenTour={() => setIsTourOpen(true)}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
        onLogout={handleLogout}
        onViewProfile={handleViewProfile}
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
                      TALENT INTELLIGENCE // WARM INTRO NETWORK
                    </span>
                    <span className="hidden sm:inline rounded-md border border-[#08123B] bg-[#F4F6FB] px-2 py-0.5 font-mono-code text-xs font-semibold text-[#08123B]">
                      NO COLD OUTREACH
                    </span>
                  </div>

                  <h1 className="font-editorial italic text-3xl sm:text-5xl lg:text-6xl text-[#08123B] leading-none mb-3">
                    Discover Top Talent & Find Warm Introductions
                  </h1>

                  <p className="font-mono-code text-xs sm:text-sm text-[#4A5578] max-w-2xl leading-relaxed">
                    Search verified engineers, executives, and specialists. Trace exact mutual colleagues who can introduce you, or match an entire team by required skills.
                  </p>
                </div>

                {/* Decorative Fintech Callout Badge */}
                <div className="hidden lg:block absolute right-8 top-8 rounded-xl border-2 border-[#08123B] bg-[#08123B] text-white p-4 font-mono-code text-xs max-w-xs shadow-[4px_4px_0px_#FF007A]">
                  <p className="font-bold uppercase text-[#FF007A] mb-1 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>MUTUAL NETWORK POWERED</span>
                  </p>
                  <p className="text-[11px] text-white/80 leading-relaxed">
                    Reach out through trusted friends and colleagues instead of messaging cold strangers.
                  </p>
                </div>
              </div>

              {/* Beginner Friendly Quick Start Card (Collapsible) */}
              <div className="brutal-card p-5 bg-[#F4F6FB] border-2 border-[#08123B] shadow-[4px_4px_0px_#08123B] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#FFCC00] border-2 border-[#08123B] flex items-center justify-center text-[#08123B]">
                      <Lightbulb className="h-4 w-4 fill-[#08123B]" />
                    </div>
                    <span className="font-display text-sm font-extrabold text-[#08123B] uppercase">
                      New here? How this works in 3 easy steps
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsGuideOpen(true)}
                      className="text-xs font-mono-code font-bold text-[#0052FF] hover:underline uppercase flex items-center gap-1"
                    >
                      <span>Full Guide & FAQ</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => setShowGettingStarted((prev) => !prev)}
                      className="p-1 rounded border border-[#08123B]/30 hover:bg-white text-[#08123B]"
                      title="Toggle quick start guide"
                    >
                      {showGettingStarted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {showGettingStarted && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl border border-[#08123B]/20 bg-white space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#0052FF] text-white font-mono-code text-xs font-bold flex items-center justify-center">1</span>
                        <h4 className="font-display text-xs font-extrabold text-[#08123B] uppercase">Search Talent</h4>
                      </div>
                      <p className="text-xs font-mono-code text-[#4A5578] leading-relaxed">
                        Filter candidates below by skills (e.g. PyTorch, React) or past company (e.g. Stripe, Revolut).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[#08123B]/20 bg-white space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#FF007A] text-white font-mono-code text-xs font-bold flex items-center justify-center">2</span>
                        <h4 className="font-display text-xs font-extrabold text-[#08123B] uppercase">Find Warm Intros</h4>
                      </div>
                      <p className="text-xs font-mono-code text-[#4A5578] leading-relaxed">
                        Click "PATH" on any profile to see the mutual connections who can introduce you.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[#08123B]/20 bg-white space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-5 rounded-full bg-[#00D26A] text-[#08123B] font-mono-code text-xs font-bold flex items-center justify-center">3</span>
                        <h4 className="font-display text-xs font-extrabold text-[#08123B] uppercase">Match a Dream Team</h4>
                      </div>
                      <p className="text-xs font-mono-code text-[#4A5578] leading-relaxed">
                        Click "MATCH TEAM" at top to pick required skills and rank candidates by skill + trust.
                      </p>
                    </div>
                  </div>
                )}
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
                        currentUserId={currentUser?.id}
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
                currentUser={currentUser}
                onSelectPerson={(id) => setExplorerFocusPersonId(id)}
                onViewProfile={handleViewProfile}
                onFindPath={handleFindPath}
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
                currentUser={currentUser}
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
                peopleList={allDirectoryPeople.length > 0 ? allDirectoryPeople : people}
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
            currentUser={currentUser}
            onClose={() => setSelectedPersonId(null)}
            onExploreGraph={handleExploreGraph}
            onFindPath={handleFindPath}
          />
        )}
      </AnimatePresence>

      {/* Non-Technical & Beginner How To Use Interactive Guide Modal */}
      <AnimatePresence>
        {isGuideOpen && (
          <HowToUseModal
            isOpen={isGuideOpen}
            onClose={() => setIsGuideOpen(false)}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              setIsGuideOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Introductory Step-by-Step Onboarding Walkthrough */}
      <AnimatePresence>
        {isTourOpen && (
          <OnboardingTourModal
            isOpen={isTourOpen}
            onClose={handleCloseTour}
            onOpenAuth={handleOpenAuth}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              handleCloseTour();
            }}
          />
        )}
      </AnimatePresence>

      {/* Authentication & Email Verification Modal */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <AuthModal
            isOpen={isAuthModalOpen}
            initialMode={authModalMode}
            onClose={() => setIsAuthModalOpen(false)}
            onAuthSuccess={handleAuthSuccess}
            peopleList={allDirectoryPeople.length > 0 ? allDirectoryPeople : people}
          />
        )}
      </AnimatePresence>

      {/* Floating Bottom-Right Notifications Bubble for Team Offers & Warm Requests */}
      <NotificationBubble
        currentUser={currentUser}
        onViewProfile={handleViewProfile}
        onExploreGraph={handleExploreGraph}
        onOpenTeamMatcher={() => setActiveTab('match')}
      />

      {/* Footer */}
      <footer className="border-t-2 border-[#08123B] bg-[#FFFFFF] py-6 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 font-mono-code text-xs text-[#4A5578]">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-[#08123B]">STARTUP GRAPH</span>
            <span>// TALENT & TEAM MATCHING ENGINE</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="text-[#0052FF] font-bold hover:underline flex items-center gap-1 uppercase"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              <span>How To Use Guide & FAQ</span>
            </button>
            <a
              href="/api/docs/pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#08123B] hover:underline"
            >
              System Specs (PDF)
            </a>
            <span>COGNO_DB BOLT SECURE</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
