import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Briefcase,
  DollarSign,
  PieChart,
  Send,
  Loader2,
  Sparkles,
  Building,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';

export function SendOfferModal({
  isOpen,
  onClose,
  candidate,
  currentUser,
  defaultRole = 'Founding AI & Systems Engineer',
  onOfferSent,
}) {
  const [roleName, setRoleName] = useState(defaultRole);
  const [teamName, setTeamName] = useState(currentUser?.company || 'Apex Robotics AI');
  const [equity, setEquity] = useState('1.5% - 2.5%');
  const [comp, setComp] = useState('$195,000 - $240,000');
  const [note, setNote] = useState(
    `We were impressed by your graph skill score and mutual connections in our network. We would love to have you build the core architecture with us!`
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [responseStatus, setResponseStatus] = useState(null);

  if (!isOpen || !candidate) return null;

  const handleSend = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const token = localStorage.getItem('startup_graph_token') || '';

    try {
      const payload = {
        candidateId: candidate.id,
        candidateName: candidate.name,
        candidateAvatar: candidate.avatarUrl,
        roleName: roleName.trim() || 'Core Engineer',
        teamName: teamName.trim() || 'Apex AI',
        equity: equity.trim(),
        comp: comp.trim(),
        note: note.trim(),
        recruiterId: currentUser?.id || 'p1',
        recruiterName: currentUser?.name || 'Elena Rostova',
        recruiterAvatar: currentUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      };

      const res = await api.sendTeamOffer(payload, token);

      if (res.success) {
        setSentSuccess(true);
        try {
          confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
        } catch (e) {}

        if (res.offer?.status === 'accepted') {
          setResponseStatus('accepted');
        }

        if (onOfferSent) {
          onOfferSent(res.offer);
        }

        setTimeout(() => {
          onClose();
          setSentSuccess(false);
        }, 2200);
      }
    } catch (err) {
      setError(err.message || 'Failed to send offer. Please try again.');
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
          className="relative w-full max-w-lg bg-white border-4 border-[#08123B] rounded-2xl shadow-[10px_10px_0px_#08123B] overflow-hidden my-6"
        >
          {/* Header */}
          <div className="bg-[#08123B] text-white p-5 flex items-center justify-between border-b-3 border-[#08123B]">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-lg bg-[#FF007A] flex items-center justify-center text-white font-bold border border-white/20">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="text-[10px] font-mono-code font-bold uppercase tracking-widest text-[#00D26A] block">
                  TEAM ROSTER EXTENSION
                </span>
                <h3 className="font-display text-xl font-extrabold tracking-tight">
                  Extend Team Offer
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

          {/* Candidate Profile Summary Banner */}
          <div className="p-4 bg-[#F4F6FB] border-b-2 border-[#08123B] flex items-center gap-3">
            <img
              src={candidate.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(candidate.name)}`}
              alt={candidate.name}
              className="h-12 w-12 rounded-xl border-2 border-[#08123B] object-cover shadow-[2px_2px_0px_#08123B]"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-display text-sm font-extrabold text-[#08123B] truncate">
                {candidate.name}
              </h4>
              <p className="text-xs font-mono-code text-[#4A5578] truncate">
                {candidate.title} {candidate.companyName ? `• ${candidate.companyName}` : ''}
              </p>
              {candidate.matchScore && (
                <span className="inline-block mt-0.5 rounded border border-[#0052FF] bg-[#EFF6FF] px-1.5 py-0.2 font-mono-code text-[10px] font-bold text-[#0052FF]">
                  Score: {candidate.matchScore} pts
                </span>
              )}
            </div>
          </div>

          {/* Form Body */}
          <div className="p-6">
            {sentSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 text-center space-y-3"
              >
                <div className="h-14 w-14 rounded-full bg-[#EBF7EE] border-2 border-[#008A3E] text-[#008A3E] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h4 className="font-display text-lg font-extrabold text-[#08123B]">
                  Offer Successfully Extended!
                </h4>
                <p className="text-xs font-mono-code text-[#4A5578] max-w-sm mx-auto">
                  {responseStatus === 'accepted'
                    ? `🎉 ${candidate.name} accepted your team offer! Check your notification center.`
                    : `Your offer has been delivered to ${candidate.name}. They will receive an instant notification to accept or decline.`}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSend} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-lg border-2 border-[#FF007A] bg-[#FFF0F5] text-[#FF007A] font-mono-code text-xs font-bold">
                    ⚠️ {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                      Offer Role / Title
                    </label>
                    <input
                      type="text"
                      required
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="e.g. Founding AI Systems Lead"
                      className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] px-3 py-2 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                    />
                  </div>

                  <div>
                    <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                      Team / Startup Name
                    </label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Apex Robotics AI"
                      className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] px-3 py-2 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                      Equity Grant
                    </label>
                    <div className="relative">
                      <PieChart className="absolute left-3 top-2.5 h-4 w-4 text-[#7382A6]" />
                      <input
                        type="text"
                        value={equity}
                        onChange={(e) => setEquity(e.target.value)}
                        placeholder="e.g. 1.5% - 2.5%"
                        className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] pl-9 pr-3 py-2 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                      Base Compensation
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-[#7382A6]" />
                      <input
                        type="text"
                        value={comp}
                        onChange={(e) => setComp(e.target.value)}
                        placeholder="e.g. $190k - $240k"
                        className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] pl-9 pr-3 py-2 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-mono-code text-xs font-bold uppercase text-[#08123B] mb-1">
                    Personal Intro Message & Team Pitch
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Describe why they are a great fit for your graph cluster..."
                    className="w-full rounded-lg border-2 border-[#08123B] bg-[#F4F6FB] p-3 text-xs font-mono-code font-bold focus:outline-none focus:bg-white shadow-[2px_2px_0px_#08123B]"
                  />
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 rounded-lg border-2 border-[#08123B] bg-white font-mono-code text-xs font-bold uppercase hover:bg-[#F4F6FB]"
                  >
                    CANCEL
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 brutal-btn bg-[#0052FF] text-white py-2.5 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9] flex items-center justify-center gap-2 shadow-[3px_3px_0px_#08123B]"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    <span>{loading ? 'TRANSMITTING OFFER...' : `SEND OFFER TO ${candidate.name.toUpperCase().split(' ')[0]}`}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
