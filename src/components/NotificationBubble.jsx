import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bell,
  X,
  Users,
  Briefcase,
  Check,
  XCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Shield,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../api/client';

export function NotificationBubble({
  currentUser,
  onViewProfile,
  onExploreGraph,
  onOpenTeamMatcher,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('offers'); // 'offers' | 'connections' | 'alerts'
  const [data, setData] = useState({
    unreadCount: 0,
    offers: [],
    incomingOffers: [],
    connectionRequests: [],
    alerts: [],
  });
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const token = localStorage.getItem('startup_graph_token') || '';

  const fetchNotifications = async () => {
    try {
      const res = await api.getNotifications(token, currentUser?.id);
      if (res) {
        setData({
          unreadCount: res.unreadCount || 0,
          offers: res.offers || [],
          incomingOffers: res.incomingOffers || [],
          connectionRequests: res.connectionRequests || [],
          alerts: res.alerts || [],
        });
      }
    } catch (err) {
      console.warn('Could not fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 6000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Handle Accept / Decline Offer
  const handleOfferResponse = async (offerId, status) => {
    setProcessingId(offerId);
    try {
      const res = await api.respondToOffer(offerId, status, token);
      if (status === 'accepted') {
        try {
          confetti({ particleCount: 70, spread: 70, origin: { y: 0.7 } });
        } catch (e) {}
        showToast('🎉 Offer accepted! You are now part of the team roster.');
      } else {
        showToast('Offer declined.');
      }
      await fetchNotifications();
    } catch (err) {
      showToast(err.message || 'Action failed.');
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Accept / Decline Connection
  const handleConnectionResponse = async (reqId, status) => {
    setProcessingId(reqId);
    try {
      const res = await api.respondToConnectionRequest(reqId, status, token);
      if (status === 'accepted') {
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
        } catch (e) {}
        showToast('🤝 Connection established in CognoDB graph!');
      } else {
        showToast('Connection request declined.');
      }
      await fetchNotifications();
    } catch (err) {
      showToast(err.message || 'Action failed.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkRead = async () => {
    try {
      await api.markAlertsRead(token, currentUser?.id);
      setData((prev) => ({
        ...prev,
        unreadCount: prev.incomingOffers.length + prev.connectionRequests.length,
        alerts: prev.alerts.map((a) => ({ ...a, read: true })),
      }));
    } catch (e) {}
  };

  const totalActionable = data.incomingOffers.length + data.connectionRequests.length;

  return (
    <>
      {/* Toast Notification Alert */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-50 p-3.5 rounded-xl border-2 border-[#08123B] bg-[#08123B] text-white font-mono-code text-xs font-bold shadow-[4px_4px_0px_#0052FF] flex items-center gap-2 max-w-sm"
          >
            <Sparkles className="h-4 w-4 text-[#00D26A] shrink-0" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Bottom-Right Bubble Trigger */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) handleMarkRead();
          }}
          className="relative h-14 w-14 rounded-2xl border-3 border-[#08123B] bg-[#0052FF] text-white flex items-center justify-center shadow-[4px_4px_0px_#08123B] hover:bg-[#0042D9] transition-all cursor-pointer"
          title="Team Offers & Connection Alerts"
        >
          <Bell className="h-6 w-6 text-white" />

          {/* Red pulse notification badge */}
          {totalActionable > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#08123B] bg-[#FF007A] font-mono-code text-[11px] font-extrabold text-white animate-bounce shadow-[1px_1px_0px_#08123B]">
              {totalActionable}
            </span>
          )}
        </motion.button>
      </div>

      {/* Notification Modal Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[420px] max-h-[580px] bg-white border-3 border-[#08123B] rounded-2xl shadow-[8px_8px_0px_#08123B] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-[#08123B] text-white p-4 flex items-center justify-between border-b-2 border-[#08123B]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#FF007A] flex items-center justify-center border border-white/20">
                  <Bell className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-extrabold uppercase tracking-tight">
                    Inbox & Network Alerts
                  </h3>
                  <p className="text-[10px] font-mono-code text-[#4A5578] text-white/70">
                    Team offers, warm invites & updates
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-3 bg-[#F4F6FB] border-b-2 border-[#08123B] text-xs font-display font-extrabold uppercase">
              <button
                onClick={() => setActiveTab('offers')}
                className={`py-2.5 flex items-center justify-center gap-1.5 transition-colors border-r border-[#08123B]/20 ${
                  activeTab === 'offers'
                    ? 'bg-white text-[#0052FF] border-b-2 border-[#0052FF]'
                    : 'text-[#7382A6] hover:text-[#08123B]'
                }`}
              >
                <Briefcase className="h-3.5 w-3.5" />
                <span>OFFERS ({data.incomingOffers.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('connections')}
                className={`py-2.5 flex items-center justify-center gap-1.5 transition-colors border-r border-[#08123B]/20 ${
                  activeTab === 'connections'
                    ? 'bg-white text-[#0052FF] border-b-2 border-[#0052FF]'
                    : 'text-[#7382A6] hover:text-[#08123B]'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                <span>INVITES ({data.connectionRequests.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('alerts')}
                className={`py-2.5 flex items-center justify-center gap-1.5 transition-colors ${
                  activeTab === 'alerts'
                    ? 'bg-white text-[#0052FF] border-b-2 border-[#0052FF]'
                    : 'text-[#7382A6] hover:text-[#08123B]'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>ACTIVITY</span>
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-white">
              {/* TAB 1: TEAM OFFERS */}
              {activeTab === 'offers' && (
                <div className="space-y-3">
                  {data.offers.length === 0 ? (
                    <div className="py-8 text-center font-mono-code">
                      <Briefcase className="h-8 w-8 text-[#7382A6] mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold text-[#08123B] uppercase mb-1">
                        NO ACTIVE TEAM OFFERS
                      </p>
                      <p className="text-[11px] text-[#7382A6]">
                        When recruiters or founders scout you, offers appear here.
                      </p>
                    </div>
                  ) : (
                    data.offers.map((offer) => (
                      <div
                        key={offer.id}
                        className={`p-3.5 rounded-xl border-2 transition-all ${
                          offer.status === 'accepted'
                            ? 'border-[#008A3E] bg-[#EBF7EE]'
                            : offer.status === 'declined'
                            ? 'border-gray-300 bg-gray-50 opacity-70'
                            : 'border-[#08123B] bg-white shadow-[3px_3px_0px_#08123B]'
                        }`}
                      >
                        {/* Offer Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <img
                              src={offer.recruiterAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(offer.recruiterName)}`}
                              alt={offer.recruiterName}
                              className="h-9 w-9 rounded-lg border border-[#08123B] object-cover"
                            />
                            <div>
                              <p className="font-display text-xs font-extrabold text-[#08123B]">
                                {offer.recruiterName}
                              </p>
                              <p className="text-[10px] font-mono-code text-[#4A5578]">
                                {offer.recruiterCompany || 'Startup Team'}
                              </p>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded font-mono-code text-[10px] font-bold border ${
                              offer.status === 'accepted'
                                ? 'bg-[#008A3E] text-white border-[#008A3E]'
                                : offer.status === 'declined'
                                ? 'bg-gray-200 text-gray-700 border-gray-400'
                                : 'bg-[#FF007A] text-white border-[#FF007A]'
                            }`}
                          >
                            {offer.status.toUpperCase()}
                          </span>
                        </div>

                        {/* Offer Details */}
                        <div className="bg-[#F4F6FB] p-2.5 rounded-lg border border-[#08123B]/10 space-y-1 mb-2.5 font-mono-code text-xs">
                          <div className="flex justify-between">
                            <span className="text-[#7382A6]">Role:</span>
                            <span className="font-bold text-[#08123B]">{offer.roleName}</span>
                          </div>
                          {offer.equity && (
                            <div className="flex justify-between">
                              <span className="text-[#7382A6]">Package:</span>
                              <span className="font-bold text-[#0052FF]">{offer.equity} • {offer.comp}</span>
                            </div>
                          )}
                          {offer.note && (
                            <p className="text-[11px] text-[#4A5578] italic pt-1 border-t border-[#08123B]/10">
                              "{offer.note}"
                            </p>
                          )}
                        </div>

                        {/* Actions for Pending Offer */}
                        {offer.status === 'pending' ? (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              disabled={processingId === offer.id}
                              onClick={() => handleOfferResponse(offer.id, 'accepted')}
                              className="flex-1 brutal-btn bg-[#008A3E] text-white py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#007032] flex items-center justify-center gap-1 shadow-[2px_2px_0px_#08123B]"
                            >
                              {processingId === offer.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              <span>ACCEPT OFFER</span>
                            </button>

                            <button
                              disabled={processingId === offer.id}
                              onClick={() => handleOfferResponse(offer.id, 'declined')}
                              className="px-3 py-1.5 rounded-lg border-2 border-[#08123B] bg-white font-mono-code text-xs font-bold text-[#FF007A] hover:bg-[#FFF0F5] shadow-[2px_2px_0px_#08123B]"
                            >
                              DECLINE
                            </button>
                          </div>
                        ) : (
                          <p className="text-[10px] font-mono-code text-[#7382A6] text-right">
                            {offer.status === 'accepted' ? '✓ You joined this team!' : '✕ Offer declined'}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 2: CONNECTION REQUESTS */}
              {activeTab === 'connections' && (
                <div className="space-y-3">
                  {data.connectionRequests.length === 0 ? (
                    <div className="py-8 text-center font-mono-code">
                      <Users className="h-8 w-8 text-[#7382A6] mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold text-[#08123B] uppercase mb-1">
                        NO PENDING INVITATIONS
                      </p>
                      <p className="text-[11px] text-[#7382A6]">
                        Send warm handshakes from directory profiles to connect!
                      </p>
                    </div>
                  ) : (
                    data.connectionRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3.5 rounded-xl border-2 border-[#08123B] bg-white shadow-[3px_3px_0px_#08123B] space-y-2.5"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={req.senderAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(req.senderName)}`}
                            alt={req.senderName}
                            className="h-10 w-10 rounded-lg border border-[#08123B] object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-display text-xs font-extrabold text-[#08123B] truncate">
                              {req.senderName}
                            </h4>
                            <p className="text-[10px] font-mono-code text-[#4A5578] truncate">
                              {req.senderTitle} {req.senderCompany ? `@ ${req.senderCompany}` : ''}
                            </p>
                          </div>
                        </div>

                        {req.context && (
                          <p className="text-[11px] font-mono-code text-[#4A5578] bg-[#F4F6FB] p-2 rounded-lg border border-[#08123B]/10">
                            💬 "{req.context}"
                          </p>
                        )}

                        <div className="flex items-center gap-2 pt-1">
                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleConnectionResponse(req.id, 'accepted')}
                            className="flex-1 brutal-btn bg-[#0052FF] text-white py-1.5 text-xs font-display font-extrabold uppercase hover:bg-[#0042D9] flex items-center justify-center gap-1 shadow-[2px_2px_0px_#08123B]"
                          >
                            {processingId === req.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            <span>ACCEPT & CONNECT</span>
                          </button>

                          <button
                            disabled={processingId === req.id}
                            onClick={() => handleConnectionResponse(req.id, 'declined')}
                            className="px-3 py-1.5 rounded-lg border-2 border-[#08123B] bg-white font-mono-code text-xs font-bold text-[#7382A6] hover:bg-[#F4F6FB]"
                          >
                            IGNORE
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* TAB 3: ACTIVITY ALERTS */}
              {activeTab === 'alerts' && (
                <div className="space-y-2.5">
                  {data.alerts.length === 0 ? (
                    <div className="py-8 text-center font-mono-code">
                      <Sparkles className="h-8 w-8 text-[#7382A6] mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold text-[#08123B] uppercase mb-1">
                        ALL CAUGHT UP!
                      </p>
                    </div>
                  ) : (
                    data.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="p-3 rounded-lg border border-[#08123B]/20 bg-[#F4F6FB] space-y-1 font-mono-code"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#08123B]">
                            {alert.title}
                          </span>
                          <span className="text-[10px] text-[#7382A6]">Just now</span>
                        </div>
                        <p className="text-xs text-[#4A5578] leading-relaxed">
                          {alert.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer action */}
            <div className="p-3 bg-[#F4F6FB] border-t-2 border-[#08123B] flex items-center justify-between font-mono-code text-[11px]">
              <span className="text-[#7382A6]">CognoDB Live Relational Sync</span>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onOpenTeamMatcher) onOpenTeamMatcher();
                }}
                className="text-[#0052FF] font-bold hover:underline flex items-center gap-1"
              >
                <span>Team Matcher</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
