import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  Users,
  GitMerge,
  Network,
  Search,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  BookOpen,
  Zap,
  ShieldCheck,
  Compass,
  Briefcase,
  Terminal,
  ExternalLink,
  ChevronRight,
  Smile,
  HeartHandshake,
  Lightbulb,
} from 'lucide-react';

export function HowToUseModal({ isOpen, onClose, onSelectTab }) {
  const [activeGuideTab, setActiveGuideTab] = useState('overview'); // 'overview' | 'features' | 'glossary' | 'faq'

  if (!isOpen) return null;

  const features = [
    {
      id: 'search',
      tabKey: 'search',
      icon: Search,
      badge: 'Step 1: Explore',
      title: 'Talent Discovery & Search',
      tagline: 'Find skilled people in seconds',
      description:
        'Browse all verified startup founders, engineers, and specialists. Filter by specific technical skills (like PyTorch, React, Rust) or past companies (like Stripe, Google, Revolut).',
      whySpecial:
        'Unlike flat job boards, every profile shows exactly how many network connections they have and what projects they built.',
      actionText: 'Go to People Search',
      tip: 'Click "GRAPH" on any card to see who that person knows in real-time.',
    },
    {
      id: 'match',
      tabKey: 'match',
      icon: Users,
      badge: 'Step 2: Assemble',
      title: 'Dream Team Matcher',
      tagline: 'Combine skill fit + mutual trust',
      description:
        'Select the exact skills your startup or project needs (e.g. AI Specialist + Solidity + Full-Stack). Our graph engine ranks candidates based on both their skill proficiency and how close they are to your network.',
      whySpecial:
        'A 1-hop candidate (someone you or your colleague directly knows) is scored higher than a stranger with the same resume, eliminating cold outreach.',
      actionText: 'Try Team Matcher',
      tip: 'Use the pre-built roles like "AI FinTech MVP Team" for 1-click matches.',
    },
    {
      id: 'path',
      tabKey: 'path',
      icon: GitMerge,
      badge: 'Step 3: Connect',
      title: 'Warm Introduction Finder',
      tagline: 'Never send a cold email again',
      description:
        'Want to meet a specific investor, CTO, or top engineer? Pick yourself as Origin and the target person as Destination. The app reveals the exact chain of mutual friends and colleagues who can introduce you.',
      whySpecial:
        'Powered by the Six Degrees of Separation algorithm (BFS). It finds the fastest path with the highest trust level.',
      actionText: 'Find Warm Intro Path',
      tip: 'Warm intros have a 5x higher response rate than cold outreach.',
    },
    {
      id: 'graph',
      tabKey: 'graph',
      icon: Network,
      badge: 'Step 4: Visualize',
      title: 'Interactive Network Map',
      tagline: 'See the whole ecosystem at a glance',
      description:
        'Explore a living, interactive visual web of tech talent. Drag nodes around, zoom in/out, and click any bubble to inspect who they worked with, mentored, or co-founded with.',
      whySpecial:
        'See clusters of talent around leading companies and technologies that are invisible in simple lists or spreadsheets.',
      actionText: 'Open Interactive Map',
      tip: 'Hover over connection lines to see relationship types (e.g. "Colleague", "Mentor").',
    },
  ];

  const glossaryItems = [
    {
      term: 'Node (Bubble)',
      plainEnglish: 'An entity in the system — usually a Person, a Skill, or a Company.',
      analogy: 'Like a contact card in your phonebook.',
    },
    {
      term: 'Edge (Connection Line)',
      plainEnglish: 'A relationship linking two nodes (e.g., "Alice KNOWS Bob" or "Alice HAS_SKILL PyTorch").',
      analogy: 'Like a handshake or mutual friendship.',
    },
    {
      term: '1-Hop Connection',
      plainEnglish: 'Direct colleague or peer. You know them directly with 0 intermediaries.',
      analogy: '1st-degree connection on LinkedIn.',
    },
    {
      term: '2-Hop Connection',
      plainEnglish: 'Friend-of-a-friend. Someone who shares a mutual friend with you.',
      analogy: '2nd-degree connection — perfect for asking "Can you introduce me?"',
    },
    {
      term: 'Shortest Path',
      plainEnglish: 'The fewest handshakes needed to get from Person A to Person B.',
      analogy: 'The "Six Degrees of Kevin Bacon" path for tech startups.',
    },
    {
      term: 'Match Score',
      plainEnglish: 'A score from 0–100 calculated from: (1) Skill mastery level + (2) Network closeness.',
      analogy: 'High score = Has the exact skills you need AND is easily introduced through a friend.',
    },
  ];

  const faqs = [
    {
      q: 'Do I need any coding or graph database knowledge to use this?',
      a: 'No! Everything is point-and-click. The app handles all complex math and graph algorithms in the background and presents results in clean, visual cards and maps.',
    },
    {
      q: 'How is this different from a standard spreadsheet or LinkedIn?',
      a: 'Spreadsheets store flat rows that make it hard to see who knows who across 3 or 4 degrees. LinkedIn hides exact referral paths. This app computes instant multi-hop introduction paths so you can reach anyone through trusted mutual friends.',
    },
    {
      q: 'How does the Match Score work in the Team Matcher?',
      a: 'The algorithm combines two factors: (1) Skill fit — how many required skills the candidate has at senior levels, and (2) Social proximity — whether they are 1-hop (direct colleague), 2-hop (mutual friend), or 3-hop away. Closer connections get a trust bonus.',
    },
    {
      q: 'What are the colored bubbles on the interactive map?',
      a: 'Navy/Blue bubbles are People, Purple bubbles are Skills, and Green bubbles are Companies. Lines connecting them show who has what skill, who works where, and who knows each other.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto bg-[#08123B]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border-3 border-[#08123B] bg-white shadow-[10px_10px_0px_#08123B] overflow-hidden"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between p-5 bg-[#08123B] text-white border-b-3 border-[#08123B] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl border-2 border-white bg-[#0052FF] flex items-center justify-center text-white shadow-[2px_2px_0px_#FF007A]">
              <Lightbulb className="h-5 w-5 text-yellow-300 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#FF007A] text-white px-2 py-0.5 font-mono-code text-[10px] font-bold uppercase tracking-wider">
                  NON-TECHNICAL GUIDE
                </span>
                <span className="text-xs font-mono-code text-white/80">PLAIN ENGLISH EDITION</span>
              </div>
              <h2 className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                How StartupGraph Works
              </h2>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="rounded-lg border-2 border-white bg-white/10 p-2 text-white hover:bg-white hover:text-[#08123B] transition-colors"
            title="Close Guide"
          >
            <X className="h-5 w-5 stroke-[2.5]" />
          </motion.button>
        </div>

        {/* Navigation Tabs Inside Modal */}
        <div className="flex items-center gap-1.5 px-5 py-3 border-b-2 border-[#08123B]/15 bg-[#F4F6FB] overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveGuideTab('overview')}
            className={`px-3 py-1.5 rounded-lg font-display text-xs font-extrabold uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeGuideTab === 'overview'
                ? 'bg-[#08123B] text-white shadow-[2px_2px_0px_#0052FF]'
                : 'text-[#08123B] hover:bg-white'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>1. The Core Idea</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('features')}
            className={`px-3 py-1.5 rounded-lg font-display text-xs font-extrabold uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeGuideTab === 'features'
                ? 'bg-[#08123B] text-white shadow-[2px_2px_0px_#0052FF]'
                : 'text-[#08123B] hover:bg-white'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>2. Step-by-Step Walkthrough</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('glossary')}
            className={`px-3 py-1.5 rounded-lg font-display text-xs font-extrabold uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeGuideTab === 'glossary'
                ? 'bg-[#08123B] text-white shadow-[2px_2px_0px_#0052FF]'
                : 'text-[#08123B] hover:bg-white'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>3. Plain English Terms</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('faq')}
            className={`px-3 py-1.5 rounded-lg font-display text-xs font-extrabold uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeGuideTab === 'faq'
                ? 'bg-[#08123B] text-white shadow-[2px_2px_0px_#0052FF]'
                : 'text-[#08123B] hover:bg-white'
            }`}
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>4. FAQ</span>
          </button>
        </div>

        {/* Modal Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: THE CORE IDEA */}
          {activeGuideTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Metaphor Hero Card */}
              <div className="rounded-xl border-2 border-[#08123B] bg-[#F4F6FB] p-5 space-y-3 shadow-[4px_4px_0px_#08123B]">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-[#0052FF] text-white px-2 py-0.5 font-mono-code text-[10px] font-bold uppercase">
                    THE BIG PICTURE
                  </span>
                  <span className="font-display text-sm font-extrabold text-[#08123B]">
                    Think of this as a supercharged LinkedIn + Founder Matcher
                  </span>
                </div>

                <p className="text-sm text-[#08123B] leading-relaxed">
                  In traditional recruiting, you send cold messages to strangers on LinkedIn with low response rates.
                  <strong> StartupGraph maps relationships like a living social web</strong>: it connects who knows who, who worked at the same company, and who holds what technical skill.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="rounded-lg border-2 border-[#08123B] bg-white p-3.5 space-y-1 shadow-[2px_2px_0px_#08123B]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF007A] font-mono-code uppercase">
                      <X className="h-4 w-4" />
                      <span>Traditional Cold Outreach</span>
                    </div>
                    <p className="text-xs text-[#4A5578] leading-relaxed">
                      Messaging random candidates. Low trust, 5% reply rate, no insight into who can vouch for them.
                    </p>
                  </div>

                  <div className="rounded-lg border-2 border-[#08123B] bg-[#EBF7EE] p-3.5 space-y-1 shadow-[2px_2px_0px_#08123B]">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#00D26A] font-mono-code uppercase">
                      <CheckCircle2 className="h-4 w-4 text-[#00D26A]" />
                      <span>Graph-Powered Warm Intro</span>
                    </div>
                    <p className="text-xs text-[#08123B] leading-relaxed">
                      Seeing the exact mutual colleague who can introduce you. 50%+ reply rate and verified credibility.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3 Quick Beginner Missions */}
              <div className="space-y-3">
                <h3 className="font-display text-base font-extrabold text-[#08123B] uppercase tracking-wide">
                  Try a 10-Second Quick Mission:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onClose();
                      onSelectTab('match');
                    }}
                    className="p-4 text-left rounded-xl border-2 border-[#08123B] bg-white hover:bg-[#0052FF] hover:text-white transition-all group shadow-[3px_3px_0px_#08123B]"
                  >
                    <div className="h-8 w-8 rounded-lg bg-[#0052FF] text-white group-hover:bg-white group-hover:text-[#0052FF] flex items-center justify-center mb-2 font-mono-code font-bold text-xs">
                      1
                    </div>
                    <h4 className="font-display text-sm font-bold leading-tight mb-1">
                      Build a 3-Person Team
                    </h4>
                    <p className="text-xs text-[#4A5578] group-hover:text-white/80 line-clamp-2">
                      Select AI & Full-Stack skills to find connected teammates instantly.
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onClose();
                      onSelectTab('path');
                    }}
                    className="p-4 text-left rounded-xl border-2 border-[#08123B] bg-white hover:bg-[#FF007A] hover:text-white transition-all group shadow-[3px_3px_0px_#08123B]"
                  >
                    <div className="h-8 w-8 rounded-lg bg-[#FF007A] text-white group-hover:bg-white group-hover:text-[#FF007A] flex items-center justify-center mb-2 font-mono-code font-bold text-xs">
                      2
                    </div>
                    <h4 className="font-display text-sm font-bold leading-tight mb-1">
                      Find a Warm Intro
                    </h4>
                    <p className="text-xs text-[#4A5578] group-hover:text-white/80 line-clamp-2">
                      Pick two people and trace the exact chain of mutual friends between them.
                    </p>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onClose();
                      onSelectTab('graph');
                    }}
                    className="p-4 text-left rounded-xl border-2 border-[#08123B] bg-white hover:bg-[#08123B] hover:text-white transition-all group shadow-[3px_3px_0px_#08123B]"
                  >
                    <div className="h-8 w-8 rounded-lg bg-[#08123B] text-white group-hover:bg-white group-hover:text-[#08123B] flex items-center justify-center mb-2 font-mono-code font-bold text-xs">
                      3
                    </div>
                    <h4 className="font-display text-sm font-bold leading-tight mb-1">
                      Explore the Living Web
                    </h4>
                    <p className="text-xs text-[#4A5578] group-hover:text-white/80 line-clamp-2">
                      Drag and click nodes on the interactive canvas to explore relationships.
                    </p>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: STEP-BY-STEP WALKTHROUGH */}
          {activeGuideTab === 'features' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.id}
                    className="rounded-xl border-2 border-[#08123B] bg-white p-5 space-y-3 shadow-[4px_4px_0px_#08123B]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl border-2 border-[#08123B] bg-[#0052FF] text-white flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#08123B]">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="rounded bg-[#08123B] text-white px-2 py-0.5 font-mono-code text-[10px] font-bold uppercase">
                              {feat.badge}
                            </span>
                            <span className="text-xs font-mono-code text-[#7382A6]">{feat.tagline}</span>
                          </div>
                          <h3 className="font-display text-base sm:text-lg font-extrabold text-[#08123B]">
                            {feat.title}
                          </h3>
                        </div>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          onClose();
                          onSelectTab(feat.tabKey);
                        }}
                        className="brutal-btn bg-[#0052FF] text-white px-3.5 py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9] self-start sm:self-center flex items-center gap-1.5 shrink-0 shadow-[2px_2px_0px_#08123B]"
                      >
                        <span>{feat.actionText}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </motion.button>
                    </div>

                    <p className="text-xs sm:text-sm text-[#2A3453] leading-relaxed">
                      {feat.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="p-2.5 rounded-lg bg-[#F4F6FB] border border-[#08123B]/20 text-xs font-mono-code">
                        <span className="font-bold text-[#0052FF] uppercase block mb-0.5">Why it matters:</span>
                        <span className="text-[#4A5578]">{feat.whySpecial}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#FFFBEB] border border-[#F59E0B]/30 text-xs font-mono-code">
                        <span className="font-bold text-[#D97706] uppercase block mb-0.5">💡 Quick Tip:</span>
                        <span className="text-[#92400E]">{feat.tip}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* TAB 3: PLAIN ENGLISH TERMS */}
          {activeGuideTab === 'glossary' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-4 rounded-xl border-2 border-[#08123B] bg-[#F4F6FB] text-xs font-mono-code text-[#4A5578] leading-relaxed shadow-[3px_3px_0px_#08123B]">
                Graph databases use real-world relationship concepts. Here is a cheat sheet translating technical graph jargon into everyday words:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {glossaryItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="rounded-xl border-2 border-[#08123B] bg-white p-4 space-y-2 shadow-[3px_3px_0px_#08123B]"
                  >
                    <div className="flex items-center justify-between border-b border-[#08123B]/10 pb-1.5">
                      <h4 className="font-display text-sm font-extrabold text-[#08123B]">
                        {item.term}
                      </h4>
                      <span className="rounded bg-[#0052FF] text-white px-1.5 py-0.2 font-mono-code text-[10px] font-bold">
                        TERM #{idx + 1}
                      </span>
                    </div>

                    <p className="text-xs text-[#2A3453] leading-relaxed">
                      <strong>Meaning:</strong> {item.plainEnglish}
                    </p>

                    <div className="p-2 rounded bg-[#F4F6FB] text-[11px] font-mono-code text-[#0052FF]">
                      <strong>Real-world analogy:</strong> {item.analogy}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 4: FAQ */}
          {activeGuideTab === 'faq' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3.5"
            >
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border-2 border-[#08123B] bg-white p-4 space-y-2 shadow-[3px_3px_0px_#08123B]"
                >
                  <h4 className="font-display text-sm font-extrabold text-[#08123B] flex items-center gap-2">
                    <span className="h-5 w-5 rounded-full bg-[#08123B] text-white text-[11px] font-mono-code font-bold flex items-center justify-center shrink-0">
                      Q
                    </span>
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-xs text-[#4A5578] leading-relaxed pl-7">
                    {faq.a}
                  </p>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#F4F6FB] border-t-2 border-[#08123B] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1.5 text-xs font-mono-code text-[#4A5578]">
            <div className="flex items-center gap-1.5">
              <HeartHandshake className="h-4 w-4 text-[#0052FF]" />
              <span>Created by <strong className="text-[#08123B]">George Giovanni Zikoranibuchukwu</strong></span>
            </div>
            <span className="hidden sm:inline">•</span>
            <a href="mailto:georgezikora2@gmail.com" className="text-[#0052FF] font-bold hover:underline">
              georgezikora2@gmail.com
            </a>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onClose}
            className="brutal-btn w-full sm:w-auto bg-[#08123B] text-white px-6 py-2 text-xs font-display font-extrabold uppercase hover:bg-[#0052FF]"
          >
            GOT IT, LET'S EXPLORE! →
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
