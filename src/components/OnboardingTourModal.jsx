import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Users,
  GitMerge,
  Network,
  Terminal,
  Compass,
  UserPlus,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

const TOUR_STEPS = [
  {
    step: 1,
    title: 'Welcome to Startup Graph',
    subtitle: 'THE TALENT NETWORK INTELLIGENCE ENGINE',
    badge: 'START HERE',
    badgeColor: 'bg-[#0052FF]',
    icon: Sparkles,
    heading: 'Stop cold messaging. Start unlocking warm referrals.',
    description:
      'Traditional hiring relies on cold InMails with less than 5% response rates. Startup Graph indexes candidate skill depth, past companies, and co-worker handshakes to give you instant 60%+ warm mutual introductions.',
    highlight: 'Powered by CognoDB: blazing-fast sub-5ms graph traversals.',
    demoActionLabel: 'Explore Key Features',
  },
  {
    step: 2,
    title: '1. Talent Search & Deep Profiling',
    subtitle: 'FILTER CANDIDATES BY EXPERTISE & ROLES',
    badge: 'DISCOVERY',
    badgeColor: 'bg-[#6366F1]',
    icon: Users,
    heading: 'Find proven engineers and leaders across top tech hubs.',
    description:
      'Search by specific technologies (e.g. PyTorch, Rust, Kubernetes, React) or past company pedigree (OpenAI, Stripe, Google). Click any card to inspect full career history, project contributions, and their 1-hop / 2-hop network.',
    highlight: 'Inspect verified skill proficiencies from 1 (Novice) to 5 (Principal Architect).',
    demoActionLabel: 'Next: Warm Intro Finder',
  },
  {
    step: 3,
    title: '2. Warm Intro Path (6 Degrees of Separation)',
    subtitle: 'FIND THE SHORTEST BRIDGE BETWEEN TWO PEOPLE',
    badge: 'ZERO COLD EMAILS',
    badgeColor: 'bg-[#008A3E]',
    icon: GitMerge,
    heading: 'Traces the exact chain of mutual friends and colleagues.',
    description:
      'Select yourself as the starting point and any target candidate you want to meet. The graph algorithm calculates the exact chain of trusted colleagues between you in milliseconds, complete with ready-to-send introduction email drafts!',
    highlight: 'One click gives you a pre-drafted intro request for your mutual contact.',
    demoActionLabel: 'Next: Dream Team Matcher',
  },
  {
    step: 4,
    title: '3. Dream Team Builder & Matcher',
    subtitle: 'AUTOMATICALLY ASSEMBLE COMPATIBLE FOUNDING TEAMS',
    badge: 'TEAM MATCHING',
    badgeColor: 'bg-[#FF007A]',
    icon: Zap,
    heading: 'Balance technical skills with high team social cohesion.',
    description:
      'Building a new startup or product pod? Select required roles and skills. The matching algorithm ranks candidates based on both skill mastery and their social proximity to you and each other, ensuring high cultural trust.',
    highlight: 'Includes 1-click presets for AI Agent, Full-Stack, and Robotics teams.',
    demoActionLabel: 'Next: Register Your Profile',
  },
  {
    step: 5,
    title: '4. Join the Graph Ecosystem',
    subtitle: 'REGISTER YOUR PROFILE & CONNECT YOUR NODES',
    badge: 'YOUR ACCOUNT',
    badgeColor: 'bg-[#FFCC00]',
    icon: UserPlus,
    heading: 'Become an active node in the talent graph.',
    description:
      'Sign up, verify your email with a secure 6-digit code, and list your top technical skills and past colleagues. Your profile is instantly inserted into the live graph database with real-time connection paths!',
    highlight: 'You can also log in instantly using one of our built-in 1-click demo executive accounts.',
    demoActionLabel: 'Get Started Now!',
  },
];

export function OnboardingTourModal({ isOpen, onClose, onOpenAuth, onSelectTab }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const current = TOUR_STEPS[currentStep];
  const Icon = current.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      try {
        confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
      } catch (e) {}
      onClose();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleOpenRegistration = () => {
    onClose();
    if (onOpenAuth) onOpenAuth('signup');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08123B]/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="relative w-full max-w-2xl bg-white border-4 border-[#08123B] rounded-2xl shadow-[10px_10px_0px_#08123B] overflow-hidden my-6"
        >
          {/* Top Header Bar */}
          <div className="bg-[#08123B] text-white p-4 sm:p-5 flex items-center justify-between border-b-3 border-[#08123B]">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#0052FF] flex items-center justify-center text-white font-bold border border-white/20">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-[#FF007A] block">
                  INTERACTIVE APP WALKTHROUGH
                </span>
                <h3 className="font-display text-lg sm:text-xl font-extrabold tracking-tight">
                  How To Use Startup Graph
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              title="Close tour"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Progress Indicator Bar */}
          <div className="bg-[#F4F6FB] px-6 py-3 border-b-2 border-[#08123B] flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((s, idx) => (
                <button
                  key={s.step}
                  onClick={() => setCurrentStep(idx)}
                  className={`h-2.5 rounded-full transition-all ${
                    idx === currentStep
                      ? 'w-8 bg-[#0052FF]'
                      : idx < currentStep
                      ? 'w-3 bg-[#008A3E]'
                      : 'w-3 bg-[#08123B]/20'
                  }`}
                  title={`Step ${idx + 1}: ${s.title}`}
                />
              ))}
            </div>

            <span className="font-mono-code text-xs font-bold text-[#08123B]">
              STEP {currentStep + 1} OF {TOUR_STEPS.length}
            </span>
          </div>

          {/* Slide Body */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-3">
              <span
                className={`inline-block px-2.5 py-1 rounded-md text-white font-mono-code text-[11px] font-extrabold uppercase ${current.badgeColor}`}
              >
                {current.badge}
              </span>
              <span className="font-mono-code text-xs text-[#7382A6] font-bold uppercase tracking-wider">
                {current.subtitle}
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-2xl border-2 border-[#08123B] bg-[#F4F6FB] flex items-center justify-center shrink-0 shadow-[3px_3px_0px_#08123B]">
                <Icon className="h-7 w-7 text-[#0052FF] stroke-[2.2]" />
              </div>

              <div className="space-y-2">
                <h4 className="font-display text-xl sm:text-2xl font-black text-[#08123B] leading-snug">
                  {current.heading}
                </h4>
                <p className="text-sm font-mono-code text-[#4A5578] leading-relaxed">
                  {current.description}
                </p>
              </div>
            </div>

            {/* Visual Highlight Pill */}
            <div className="p-3.5 rounded-xl border-2 border-[#08123B] bg-[#FFFBEB] text-[#08123B] flex items-center gap-2.5 shadow-[2px_2px_0px_#08123B]">
              <Zap className="h-4 w-4 text-[#D97706] shrink-0 fill-[#D97706]" />
              <p className="text-xs font-mono-code font-bold text-[#78350F]">
                {current.highlight}
              </p>
            </div>

            {/* Special Final Step Call to Action */}
            {isLast && (
              <div className="p-4 rounded-xl border-2 border-[#0052FF] bg-[#EFF6FF] text-[#08123B] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="space-y-0.5 text-center sm:text-left">
                  <span className="font-display text-xs font-extrabold uppercase text-[#0052FF]">
                    Ready to join the network?
                  </span>
                  <p className="text-xs font-mono-code text-[#4A5578]">
                    Create your profile with email verification or test with demo accounts.
                  </p>
                </div>
                <button
                  onClick={handleOpenRegistration}
                  className="brutal-btn bg-[#0052FF] text-white px-4 py-2 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9] whitespace-nowrap shadow-[3px_3px_0px_#08123B]"
                >
                  CREATE PROFILE / SIGN UP
                </button>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="bg-[#F4F6FB] px-6 py-4 border-t-2 border-[#08123B] flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-2 border-[#08123B] font-mono-code text-xs font-bold uppercase transition-all ${
                currentStep === 0
                  ? 'opacity-40 cursor-not-allowed bg-white text-[#7382A6]'
                  : 'bg-white text-[#08123B] hover:bg-[#08123B] hover:text-white shadow-[2px_2px_0px_#08123B]'
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>PREVIOUS</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                onClick={onClose}
                className="px-3 py-1.5 font-mono-code text-xs text-[#7382A6] hover:text-[#08123B] font-bold uppercase"
              >
                SKIP TOUR
              </button>

              <button
                onClick={handleNext}
                className="brutal-btn bg-[#08123B] text-white px-5 py-2 text-xs font-display font-extrabold uppercase hover:bg-[#0052FF] flex items-center gap-1.5 shadow-[3px_3px_0px_#0052FF]"
              >
                <span>{isLast ? 'START EXPLORING' : 'NEXT STEP'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
