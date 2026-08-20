import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Network,
  Search,
  Users,
  GitMerge,
  Terminal,
  Database,
  RefreshCw,
  Sparkles,
  Lightbulb,
  User,
  LogOut,
  Compass,
  ChevronDown,
  UserPlus,
  LogIn,
} from 'lucide-react';

export function Header({
  activeTab,
  onSelectTab,
  health,
  checkingHealth,
  onRefreshHealth,
  onOpenMatch,
  onOpenGuide,
  onOpenTour,
  currentUser,
  onOpenAuth,
  onLogout,
  onViewProfile,
}) {
  const isDbConnected = health?.connected ?? false;
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = [
    { id: 'search', label: 'Talent Search', icon: Search },
    { id: 'graph', label: 'Network Map', icon: Network },
    { id: 'match', label: 'Team Matcher', icon: Users },
    { id: 'path', label: 'Warm Intro Path', icon: GitMerge },
    { id: 'cypher', label: 'Cypher Lab', icon: Terminal },
    { id: 'database', label: 'Database Stats', icon: Database },
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
                TALENT NETWORK INTEL
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
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* App Tour / Intro Walkthrough Button */}
          <motion.button
            onClick={onOpenTour}
            whileHover={{ y: -1, scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 rounded-lg border-2 border-[#08123B] bg-[#FFCC00] text-[#08123B] px-3 py-1.5 text-xs font-display font-extrabold uppercase shadow-[2.5px_2.5px_0px_#08123B] hover:bg-[#FFE066] transition-all whitespace-nowrap"
            title="Open step-by-step introduction tour"
          >
            <Compass className="h-3.5 w-3.5 fill-[#08123B]" />
            <span className="hidden sm:inline">APP TOUR</span>
            <span className="sm:hidden">TOUR</span>
          </motion.button>

          {/* User Auth Section */}
          {currentUser ? (
            <div className="relative">
              <motion.button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-lg border-2 border-[#08123B] bg-[#EBF7EE] p-1.5 sm:px-2.5 sm:py-1.5 font-mono-code text-xs font-bold text-[#08123B] shadow-[2px_2px_0px_#08123B]"
              >
                <img
                  src={
                    currentUser.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
                  }
                  alt={currentUser.name}
                  className="h-6 w-6 rounded-full border border-[#08123B] object-cover"
                />
                <span className="hidden sm:inline font-extrabold text-[#08123B] truncate max-w-[110px]">
                  {currentUser.name}
                </span>
                <span className="hidden lg:inline-block px-1.5 py-0.2 rounded bg-[#008A3E] text-white text-[9px] uppercase font-bold">
                  YOU
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#08123B]" />
              </motion.button>

              {/* User Dropdown Menu */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 rounded-xl border-3 border-[#08123B] bg-white p-2 shadow-[4px_4px_0px_#08123B] z-50 space-y-1 font-mono-code text-xs"
                  >
                    <div className="p-2 border-b border-[#08123B]/15 mb-1">
                      <p className="font-display font-black text-[#08123B] truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[10px] text-[#7382A6] truncate">{currentUser.title}</p>
                      <p className="text-[10px] text-[#0052FF] font-bold truncate">
                        {currentUser.company || 'Active in Startup Graph'}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        if (currentUser.id && onViewProfile) onViewProfile(currentUser.id);
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-[#F4F6FB] text-[#08123B] font-bold flex items-center gap-2"
                    >
                      <User className="h-3.5 w-3.5 text-[#0052FF]" />
                      <span>View My Graph Node</span>
                    </button>

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left p-2 rounded-lg hover:bg-[#FFF0F5] text-[#FF007A] font-bold flex items-center gap-2"
                    >
                      <LogOut className="h-3.5 w-3.5 text-[#FF007A]" />
                      <span>Sign Out</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <motion.button
                onClick={() => onOpenAuth('login')}
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1 rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] px-2.5 py-1.5 text-xs font-mono-code font-bold uppercase text-[#08123B] shadow-[2px_2px_0px_#08123B] hover:bg-[#08123B] hover:text-white transition-all whitespace-nowrap"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>LOG IN</span>
              </motion.button>

              <motion.button
                onClick={() => onOpenAuth('signup')}
                whileHover={{ y: -1, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1 rounded-lg border-2 border-[#08123B] bg-[#008A3E] px-2.5 py-1.5 text-xs font-display font-extrabold uppercase text-white shadow-[2px_2px_0px_#08123B] hover:bg-[#007233] transition-all whitespace-nowrap"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>SIGN UP</span>
              </motion.button>
            </div>
          )}

          {/* Primary CTA */}
          <motion.button
            onClick={onOpenMatch}
            whileHover={{ y: -1, scale: 1.03 }}
            whileTap={{ scale: 0.97, y: 1 }}
            className="hidden sm:flex items-center gap-1.5 rounded-lg border-2 border-[#08123B] bg-[#0052FF] px-3.5 py-1.5 text-xs sm:text-sm font-display font-extrabold uppercase text-white shadow-[3px_3px_0px_#08123B] hover:bg-[#0042D9] active:shadow-[1px_1px_0px_#08123B] whitespace-nowrap transition-all"
          >
            <Users className="h-4 w-4 stroke-[2.5]" />
            <span>MATCH TEAM</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
}

