import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Lock,
  Mail,
  User,
  Building,
  MapPin,
  Sparkles,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  KeyRound,
  Zap,
  Users,
  Code2,
  Eye,
  EyeOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';

const POPULAR_SKILLS = [
  'React',
  'TypeScript',
  'PyTorch',
  'Rust',
  'Distributed Systems',
  'Go',
  'Python',
  'Kubernetes',
  'System Architecture',
  'GraphQL',
  'Machine Learning',
  'Next.js',
  'PostgreSQL',
  'Neo4j',
];

export function AuthModal({ isOpen, initialMode = 'login', onClose, onAuthSuccess, peopleList = [] }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'signup' | 'verify'
  const [signupStep, setSignupStep] = useState(1); // 1: Basics, 2: Skills, 3: Network

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('employee'); // 'employee' | 'recruiter'
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('San Francisco, CA');
  const [bio, setBio] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([
    { name: 'React & Next.js', level: 4 },
    { name: 'TypeScript & JavaScript', level: 4 },
  ]);
  const [selectedConnections, setSelectedConnections] = useState(['p1']);

  // Verification state
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [previewCode, setPreviewCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputsRef = useRef([]);

  // Demo accounts
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
  }, [initialMode, isOpen]);

  // Load demo accounts
  useEffect(() => {
    async function loadDemos() {
      try {
        const res = await api.getDemoAccounts();
        if (res?.accounts) setDemoAccounts(res.accounts);
      } catch (err) {
        console.warn('Could not load demo accounts:', err);
      }
    }
    loadDemos();
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Toggle skill selection
  const handleToggleSkill = (skillName) => {
    const exists = selectedSkills.find((s) => s.name === skillName);
    if (exists) {
      setSelectedSkills(selectedSkills.filter((s) => s.name !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, { name: skillName, level: 4 }]);
    }
  };

  // Adjust skill proficiency level
  const handleSkillLevelChange = (skillName, newLevel) => {
    setSelectedSkills(
      selectedSkills.map((s) => (s.name === skillName ? { ...s, level: Number(newLevel) } : s))
    );
  };

  // Toggle connection selection
  const handleToggleConnection = (personId) => {
    if (selectedConnections.includes(personId)) {
      setSelectedConnections(selectedConnections.filter((id) => id !== personId));
    } else {
      setSelectedConnections([...selectedConnections, personId]);
    }
  };

  // Handle OTP input typing
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.slice(0, 6).split('');
      const newOtp = [...verificationCode];
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setVerificationCode(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...verificationCode];
    newOtp[index] = value;
    setVerificationCode(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Auto fill code for demo testing
  const handleAutoFillCode = () => {
    if (!previewCode) return;
    const digits = previewCode.split('');
    setVerificationCode(digits);
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ email, password });
      if (res.requiresVerification) {
        setPreviewCode(res.previewCode || '');
        setMode('verify');
        setLoading(false);
        return;
      }
      if (res.token && res.user) {
        localStorage.setItem('startup_graph_token', res.token);
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}
        onAuthSuccess(res.user, res.token);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  // Handle 1-Click Demo Login
  const handleDemoLogin = async (demoId) => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ demoAccountId: demoId });
      if (res.token && res.user) {
        localStorage.setItem('startup_graph_token', res.token);
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } catch (e) {}
        onAuthSuccess(res.user, res.token);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup Submit (Step 1 -> 2 -> 3 -> API)
  const handleSignupSubmit = async () => {
    setError(null);
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Please provide your name, email, and password.');
      setSignupStep(1);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name,
        email,
        password,
        accountType,
        title: title || (accountType === 'recruiter' ? 'Founding Partner & Recruiter' : 'Software Engineer'),
        company: company || 'Stealth AI Startup',
        location,
        bio,
        skills: selectedSkills,
        connections: selectedConnections,
      };

      const res = await api.register(payload);
      if (res.requiresVerification) {
        setPreviewCode(res.previewCode || '');
        setResendCooldown(60);
        setMode('verify');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Resend Verification Code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    try {
      const res = await api.resendCode(email);
      setPreviewCode(res.previewCode || '');
      setResendCooldown(60);
      setSuccessMsg(`New code sent to ${email}`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  // Handle Verify Code Submit
  const handleVerifySubmit = async (e) => {
    if (e) e.preventDefault();
    const codeStr = verificationCode.join('');
    if (codeStr.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await api.verifyEmail({ email, code: codeStr });
      if (res.token && res.user) {
        localStorage.setItem('startup_graph_token', res.token);
        try {
          confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
        } catch (e) {}
        onAuthSuccess(res.user, res.token);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08123B]/80 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="relative w-full max-w-lg bg-white border-4 border-[#08123B] rounded-2xl shadow-[10px_10px_0px_#08123B] overflow-hidden my-6"
        >
          {/* Header */}
          <div className="bg-[#08123B] text-white p-5 flex items-center justify-between border-b-3 border-[#08123B]">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-[#0052FF] flex items-center justify-center text-white font-bold border border-white/20">
                {mode === 'verify' ? (
                  <ShieldCheck className="h-5 w-5 text-white" />
                ) : (
                  <Lock className="h-4 w-4 text-white" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-[#FF007A] block">
                  {mode === 'login'
                    ? 'ACCOUNT ACCESS'
                    : mode === 'signup'
                    ? `JOIN GRAPH // STEP ${signupStep} OF 3`
                    : 'EMAIL VERIFICATION'}
                </span>
                <h3 className="font-display text-xl font-extrabold tracking-tight">
                  {mode === 'login'
                    ? 'Log In to Startup Graph'
                    : mode === 'signup'
                    ? 'Register Your Talent Node'
                    : 'Verify Your Email'}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mode Switch Tabs (Login / Signup) */}
          {mode !== 'verify' && (
            <div className="grid grid-cols-2 bg-[#F4F6FB] border-b-2 border-[#08123B]">
              <button
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`py-3 font-display text-xs font-extrabold uppercase transition-colors ${
                  mode === 'login'
                    ? 'bg-white text-[#0052FF] border-b-2 border-[#0052FF]'
                    : 'text-[#7382A6] hover:text-[#08123B]'
                }`}
              >
                LOG IN
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setError(null);
                }}
                className={`py-3 font-display text-xs font-extrabold uppercase transition-colors ${
                  mode === 'signup'
                    ? 'bg-white text-[#0052FF] border-b-2 border-[#0052FF]'
                    : 'text-[#7382A6] hover:text-[#08123B]'
                }`}
              >
                CREATE ACCOUNT / SIGN UP
              </button>
            </div>
          )}

          {/* Content Area */}
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg border-2 border-[#FF007A] bg-[#FFF0F5] text-[#FF007A] font-mono-code text-xs font-bold flex items-start gap-2 shadow-[2px_2px_0px_#FF007A]"
              >
                <span className="shrink-0 font-bold">⚠️</span>
                <span>{error}</span>
              </motion.div>
            )}

            {/* Success Message */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg border-2 border-[#008A3E] bg-[#EBF7EE] text-[#008A3E] font-mono-code text-xs font-bold flex items-start gap-2 shadow-[2px_2px_0px_#008A3E]"
              >
                <Check className="h-4 w-4 shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            {/* ========================================= */}
            {/* MODE 1: LOGIN */}
            {/* ========================================= */}
            {mode === 'login' && (
              <div className="space-y-4">
                <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                  <div>
                    <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                      Work Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#7382A6]" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@startup.com"
                        className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] pl-9 pr-3 py-2 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#7382A6]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] pl-9 pr-10 py-2 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-[#7382A6] hover:text-[#08123B] transition-colors focus:outline-none cursor-pointer"
                        title={showPassword ? 'Hide password' : 'Show password'}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full brutal-btn bg-[#0052FF] text-white py-2.5 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9] flex items-center justify-center gap-2 shadow-[3px_3px_0px_#08123B]"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    <span>{loading ? 'AUTHENTICATING...' : 'LOG IN TO GRAPH'}</span>
                  </button>
                </form>

                {/* 1-Click Demo Profiles Divider */}
                <div className="pt-2 border-t border-[#08123B]/15 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code text-[11px] font-extrabold text-[#7382A6] uppercase">
                      ⚡ 1-Click Executive Demo Logins:
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {demoAccounts.map((demo) => (
                      <button
                        key={demo.id}
                        onClick={() => handleDemoLogin(demo.id)}
                        disabled={loading}
                        className="p-2.5 rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] hover:bg-[#08123B] hover:text-white transition-all text-left group shadow-[2px_2px_0px_#08123B] flex items-center gap-2.5"
                      >
                        <img
                          src={demo.avatarUrl}
                          alt={demo.name}
                          className="h-7 w-7 rounded-full border border-[#08123B] object-cover shrink-0"
                        />
                        <div className="truncate">
                          <p className="font-display text-xs font-extrabold truncate leading-tight">
                            {demo.name}
                          </p>
                          <p className="font-mono-code text-[10px] text-[#7382A6] group-hover:text-white/80 truncate">
                            {demo.title}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================= */}
            {/* MODE 2: SIGN UP */}
            {/* ========================================= */}
            {mode === 'signup' && (
              <div className="space-y-4">
                {/* STEP 1: BASICS */}
                {signupStep === 1 && (
                  <div className="space-y-3">
                    {/* Account Type Choice (Employee vs Recruiter) */}
                    <div>
                      <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1.5">
                        I am joining as: *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAccountType('employee');
                            if (!title || title.includes('Recruiter')) setTitle('Senior Software Engineer');
                          }}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            accountType === 'employee'
                              ? 'border-[#0052FF] bg-[#0052FF]/10 shadow-[3px_3px_0px_#0052FF]'
                              : 'border-[#08123B]/20 bg-white hover:border-[#08123B]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base">💼</span>
                            <span className="font-display text-xs font-extrabold uppercase text-[#08123B]">
                              Employee / Talent
                            </span>
                          </div>
                          <p className="text-[11px] font-mono-code text-[#4A5578] leading-tight">
                            Showcase verified skills, join startup teams, receive warm offers.
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAccountType('recruiter');
                            if (!title || title.includes('Engineer')) setTitle('Founding Partner & Recruiter');
                          }}
                          className={`p-3 rounded-xl border-2 text-left transition-all ${
                            accountType === 'recruiter'
                              ? 'border-[#FF007A] bg-[#FF007A]/10 shadow-[3px_3px_0px_#FF007A]'
                              : 'border-[#08123B]/20 bg-white hover:border-[#08123B]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-base">🎯</span>
                            <span className="font-display text-xs font-extrabold uppercase text-[#08123B]">
                              Recruiter / Founder
                            </span>
                          </div>
                          <p className="text-[11px] font-mono-code text-[#4A5578] leading-tight">
                            Scout top candidates, match dream teams, send official job offers.
                          </p>
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-[#7382A6]" />
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Alex Morgan"
                          className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] pl-9 pr-3 py-2 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                          Work Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#7382A6]" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="alex@startup.ai"
                            className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] pl-9 pr-3 py-2 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                          Password *
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#7382A6]" />
                          <input
                            type={showSignupPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] pl-9 pr-10 py-2 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                            className="absolute right-3 top-2.5 text-[#7382A6] hover:text-[#08123B] transition-colors focus:outline-none cursor-pointer"
                            title={showSignupPassword ? 'Hide password' : 'Show password'}
                            aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                          >
                            {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                          Job Title / Role
                        </label>
                        <input
                          type="text"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder="e.g. Lead AI Systems Engineer"
                          className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] px-3 py-2 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                        />
                      </div>

                      <div>
                        <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                          Current Company
                        </label>
                        <input
                          type="text"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="e.g. Anthropic, OpenAI, or Stealth"
                          className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] px-3 py-2 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                        Short Bio / Engineering Focus
                      </label>
                      <textarea
                        rows={2}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="e.g. Building distributed graph databases and LLM inference pipelines."
                        className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] px-3 py-2 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!name || !email || !password) {
                          setError('Please fill in your name, email, and password.');
                          return;
                        }
                        setError(null);
                        setSignupStep(2);
                      }}
                      className="w-full brutal-btn bg-[#0052FF] text-white py-2.5 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9] flex items-center justify-center gap-2 shadow-[3px_3px_0px_#08123B]"
                    >
                      <span>CONTINUE: SELECT SKILLS</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* STEP 2: SKILLS */}
                {signupStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-display text-sm font-extrabold text-[#08123B] uppercase">
                        Select Your Core Technologies
                      </h4>
                      <p className="text-xs font-mono-code text-[#7382A6]">
                        These will form your <code className="text-[#0052FF]">[:HAS_SKILL]</code> relationships in the graph.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 border border-[#08123B]/10 rounded-lg">
                      {POPULAR_SKILLS.map((skill) => {
                        const isSelected = selectedSkills.some((s) => s.name === skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => handleToggleSkill(skill)}
                            className={`px-2.5 py-1 rounded-md text-xs font-mono-code font-bold transition-colors border ${
                              isSelected
                                ? 'bg-[#0052FF] text-white border-[#0052FF]'
                                : 'bg-[#F4F6FB] text-[#08123B] border-[#08123B]/20 hover:border-[#08123B]'
                            }`}
                          >
                            {isSelected ? `✓ ${skill}` : `+ ${skill}`}
                          </button>
                        );
                      })}
                    </div>

                    {/* Skill Proficiency Sliders */}
                    <div className="space-y-2 pt-2 border-t border-[#08123B]/15">
                      <label className="block font-mono-code text-[11px] font-extrabold uppercase text-[#08123B]">
                        Skill Proficiency Levels (1-5):
                      </label>
                      <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                        {selectedSkills.map((s) => (
                          <div
                            key={s.name}
                            className="flex items-center justify-between gap-3 p-2 bg-[#F4F6FB] rounded-lg border border-[#08123B]/15"
                          >
                            <span className="font-mono-code text-xs font-bold text-[#08123B]">
                              {s.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <input
                                type="range"
                                min="1"
                                max="5"
                                value={s.level}
                                onChange={(e) => handleSkillLevelChange(s.name, e.target.value)}
                                className="w-24 accent-[#0052FF] cursor-pointer"
                              />
                              <span className="font-mono-code text-xs font-extrabold text-[#0052FF] w-4 text-right">
                                L{s.level}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSignupStep(1)}
                        className="px-3.5 py-2 rounded-lg border-2 border-[#08123B] bg-white font-mono-code text-xs font-bold uppercase hover:bg-[#F4F6FB]"
                      >
                        BACK
                      </button>

                      <button
                        type="button"
                        onClick={() => setSignupStep(3)}
                        className="brutal-btn bg-[#0052FF] text-white px-5 py-2 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9] flex items-center gap-2"
                      >
                        <span>NEXT: CONNECT NETWORK</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: NETWORK CONNECTIONS */}
                {signupStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-display text-sm font-extrabold text-[#08123B] uppercase">
                        Select People You Know In The Graph
                      </h4>
                      <p className="text-xs font-mono-code text-[#7382A6]">
                        Connect with initial colleagues to establish your <code className="text-[#008A3E]">[:KNOWS]</code> graph edges.
                      </p>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(peopleList.length > 0 ? peopleList.slice(0, 10) : demoAccounts).map((p) => {
                        const isConnected = selectedConnections.includes(p.id);
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleToggleConnection(p.id)}
                            className={`p-2.5 rounded-lg border-2 cursor-pointer transition-all flex items-center justify-between ${
                              isConnected
                                ? 'border-[#008A3E] bg-[#EBF7EE]'
                                : 'border-[#08123B]/20 bg-[#F4F6FB] hover:border-[#08123B]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <img
                                src={p.avatarUrl}
                                alt={p.name}
                                className="h-8 w-8 rounded-full border border-[#08123B] object-cover shrink-0"
                              />
                              <div className="truncate">
                                <p className="font-display text-xs font-extrabold text-[#08123B] truncate">
                                  {p.name}
                                </p>
                                <p className="font-mono-code text-[10px] text-[#7382A6] truncate">
                                  {p.title}
                                </p>
                              </div>
                            </div>

                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono-code font-bold uppercase ${
                                isConnected
                                  ? 'bg-[#008A3E] text-white'
                                  : 'bg-white text-[#08123B] border border-[#08123B]/30'
                              }`}
                            >
                              {isConnected ? '✓ CONNECTED' : '+ CONNECT'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSignupStep(2)}
                        className="px-3.5 py-2 rounded-lg border-2 border-[#08123B] bg-white font-mono-code text-xs font-bold uppercase hover:bg-[#F4F6FB]"
                      >
                        BACK
                      </button>

                      <button
                        type="button"
                        onClick={handleSignupSubmit}
                        disabled={loading}
                        className="brutal-btn bg-[#008A3E] text-white px-5 py-2.5 text-xs font-display font-extrabold uppercase hover:bg-[#007233] flex items-center gap-2 shadow-[3px_3px_0px_#08123B]"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShieldCheck className="h-4 w-4" />
                        )}
                        <span>{loading ? 'SENDING CODE...' : 'SUBMIT & SEND VERIFICATION'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================= */}
            {/* MODE 3: EMAIL VERIFICATION */}
            {/* ========================================= */}
            {mode === 'verify' && (
              <div className="space-y-4">
                <div className="text-center space-y-1.5">
                  <div className="inline-flex h-12 w-12 rounded-2xl border-2 border-[#08123B] bg-[#EBF7EE] items-center justify-center shadow-[3px_3px_0px_#08123B] mb-1">
                    <Mail className="h-6 w-6 text-[#008A3E]" />
                  </div>
                  <h4 className="font-display text-lg font-black text-[#08123B]">
                    Enter 6-Digit Verification Code
                  </h4>
                  <p className="text-xs font-mono-code text-[#4A5578]">
                    We sent a security code to <strong className="text-[#08123B]">{email}</strong>.
                  </p>
                </div>

                {/* 6 OTP Input Boxes */}
                <form onSubmit={handleVerifySubmit} className="space-y-4">
                  <div className="flex justify-center gap-2 sm:gap-2.5">
                    {verificationCode.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="h-12 w-11 sm:h-14 sm:w-12 text-center font-mono-code text-xl font-extrabold rounded-xl border-2 border-[#08123B] bg-[#F4F6FB] focus:bg-white focus:border-[#0052FF] focus:outline-none shadow-[2px_2px_0px_#08123B] transition-all"
                      />
                    ))}
                  </div>

                  {/* 1-Click Auto Fill Demo Helper */}
                  {previewCode && (
                    <div className="p-3 bg-[#FFFBEB] rounded-xl border-2 border-[#08123B] flex items-center justify-between gap-2 shadow-[2px_2px_0px_#08123B]">
                      <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-[#D97706]" />
                        <span className="font-mono-code text-xs font-bold text-[#78350F]">
                          Demo Code: <span className="underline">{previewCode}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleAutoFillCode}
                        className="px-2.5 py-1 rounded bg-[#08123B] text-white font-mono-code text-[11px] font-bold uppercase hover:bg-[#0052FF] transition-colors"
                      >
                        Auto-Fill
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || verificationCode.join('').length !== 6}
                    className="w-full brutal-btn bg-[#008A3E] text-white py-3 text-xs font-display font-extrabold uppercase hover:bg-[#007233] flex items-center justify-center gap-2 shadow-[3px_3px_0px_#08123B] disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>{loading ? 'CREATING GRAPH NODE...' : 'VERIFY & ENTER GRAPH'}</span>
                  </button>
                </form>

                {/* Resend Code Section */}
                <div className="pt-2 border-t border-[#08123B]/15 flex items-center justify-between text-xs font-mono-code">
                  <button
                    type="button"
                    onClick={() => setMode('signup')}
                    className="text-[#7382A6] hover:text-[#08123B] font-bold uppercase"
                  >
                    ← Edit Details
                  </button>

                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={resendCooldown > 0}
                    className={`font-bold uppercase ${
                      resendCooldown > 0
                        ? 'text-[#7382A6] cursor-not-allowed'
                        : 'text-[#0052FF] hover:underline'
                    }`}
                  >
                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
