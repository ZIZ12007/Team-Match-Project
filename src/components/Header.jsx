import React from 'react';
import { motion } from 'motion/react';
import { Network, Search, Users, GitMerge, Terminal, Database, RefreshCw, Sparkles, Activity } from 'lucide-react';

export function Header({
  activeTab,
  onSelectTab,
  health,
  checkingHealth,
  onRefreshHealth,
  onOpenMatch,
}) {
  const isDbConnected = health?.connected ?? false;

  const navItems = [
    { id: 'search', label: 'People Search', icon: Search },
    { id: 'graph', label: 'Network Graph', icon: Network },
    { id: 'match', label: 'Team Matcher', icon: Users },
    { id: 'path', label: 'Shortest Path', icon: GitMerge },
    { id: 'cypher', label: 'Cypher Query Lab', icon: Terminal },
    { id: 'database', label: 'Telemetry & Stats', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-[#08123B] bg-[#FFFFFF] shadow-[0_4px_0_0_#08123B]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectTab('search')}
            className="group flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-[#08123B]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#08123B] bg-[#08123B] text-white shadow-[2px_2px_0px_#FF007A] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform">
              <Network className="h-5 w-5 stroke-[2.5] text-[#0052FF]" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-[#08123B] leading-none whitespace-nowrap">
                STARTUP<span className="text-[#0052FF]">GRAPH</span>
              </span>
              <span className="text-[9px] font-mono-code font-bold uppercase tracking-widest text-[#FF007A] leading-none mt-1">
                FINTECH INTEL
              </span>
            </div>
          </motion.button>
        </div>

        {/* Zone 2: Navigation Links with Emil Kowalski Fluid Spring Pill Indicator */}
        <nav className="hidden md:flex items-center gap-1.5 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                whileHover={{ y: -1 }}
                whileTap={{ y: 1, scale: 0.97 }}
                className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold uppercase tracking-wider font-display whitespace-nowrap transition-colors z-10 ${
                  isActive
                    ? 'text-[#FFFFFF]'
                    : 'text-[#08123B] hover:text-[#0052FF]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavPill"
                    transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                    className="absolute inset-0 rounded-lg border-2 border-[#08123B] bg-[#08123B] shadow-[2px_2px_0px_#0052FF] -z-10"
                  />
                )}
                <Icon className={`h-4 w-4 stroke-[2.2] relative z-10 transition-colors ${isActive ? 'text-[#FF007A]' : 'text-[#08123B]'}`} />
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            );
          })}
        </nav>

        {/* Zone 3: Actions & Database Status Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Documentation PDF Download */}
          <motion.a
            href="/api/docs/pdf"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            title="Download Full Technical PDF Documentation Manual"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-mono-code font-bold uppercase border-2 border-[#08123B] bg-[#F4F6FB] text-[#08123B] shadow-[2px_2px_0px_#08123B] hover:bg-[#08123B] hover:text-white transition-all whitespace-nowrap"
          >
            <span>DOCS PDF</span>
          </motion.a>

          {/* DB Status Stamp */}
          <motion.button
            onClick={onRefreshHealth}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            title="Click to refresh CognoDB connection status"
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-mono-code font-bold uppercase border-2 border-[#08123B] shadow-[2px_2px_0px_#08123B] transition-transform ${
              isDbConnected
                ? 'bg-[#EBF7EE] text-[#08123B]'
                : 'bg-[#FF007A] text-white'
            }`}
          >
            <span className={`h-2 w-2 rounded-full border border-[#08123B] ${isDbConnected ? 'bg-[#00D26A] animate-pulse' : 'bg-white'}`} />
            <span className="hidden sm:inline">
              {checkingHealth ? 'CHECKING...' : isDbConnected ? 'COGNO_DB: LIVE' : 'DB: OFFLINE'}
            </span>
            <span className="sm:hidden">{isDbConnected ? 'LIVE' : 'OFF'}</span>
            <RefreshCw className={`h-3 w-3 ${checkingHealth ? 'animate-spin' : ''}`} />
          </motion.button>

          {/* Primary CTA */}
          <motion.button
            onClick={onOpenMatch}
            whileHover={{ y: -1, scale: 1.03 }}
            whileTap={{ scale: 0.97, y: 1 }}
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#08123B] bg-[#0052FF] px-3.5 py-1.5 text-xs sm:text-sm font-display font-extrabold uppercase text-white shadow-[3px_3px_0px_#08123B] hover:bg-[#0042D9] active:shadow-[1px_1px_0px_#08123B] whitespace-nowrap transition-all"
          >
            <Users className="h-4 w-4 stroke-[2.5]" />
            <span>MATCH TEAM</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}
