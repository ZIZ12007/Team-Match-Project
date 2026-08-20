import { executeWriteQuery } from './db.js';

// In-memory store for notifications, offers, and connection requests
const teamOffers = [];
const connectionRequests = [];
const activityAlerts = [];

// Seed realistic starter incoming items
teamOffers.push({
  id: 'offer_seed_1',
  recruiterId: 'p1',
  recruiterName: 'Elena Rostova',
  recruiterAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  recruiterCompany: 'Apex Robotics AI',
  candidateId: 'default', // matches any current active user / p2
  candidateName: 'Marcus Vance',
  roleName: 'Founding Lead Graph Systems Architect',
  teamName: 'Apex Core Intelligence Pod',
  equity: '1.2% - 2.0% Equity',
  comp: '$210k - $245k Base',
  note: 'We reviewed your technical graph background and 2-hop mutual colleagues. We would love for you to lead our distributed data infrastructure!',
  status: 'pending',
  createdAt: Date.now() - 3600000 * 2,
});

connectionRequests.push({
  id: 'conn_seed_1',
  senderId: 'p3',
  senderName: 'Chloe Dubois',
  senderAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
  senderTitle: 'VP of AI Product',
  senderCompany: 'Apex Robotics AI',
  receiverId: 'default',
  context: 'Worked on AI hackathon showcase & Graph UI models together.',
  status: 'pending',
  createdAt: Date.now() - 3600000 * 5,
});

activityAlerts.push({
  id: 'alert_seed_1',
  userId: 'default',
  type: 'info',
  title: 'Network Intelligence Update',
  message: '3 new engineers with PyTorch & Rust joined your 2-hop graph neighborhood.',
  createdAt: Date.now() - 3600000 * 8,
});

/**
 * Get all notifications relevant to a user
 */
export function getNotifications(userId = 'default') {
  const matchingOffers = teamOffers.filter(
    (o) => o.candidateId === userId || o.candidateId === 'default' || (userId && o.recruiterId === userId)
  );

  const incomingOffers = teamOffers.filter(
    (o) => o.candidateId === userId || o.candidateId === 'default'
  );

  const outgoingOffers = teamOffers.filter(
    (o) => o.recruiterId === userId || (userId === 'default' && o.recruiterId === 'p1') || o.recruiterId === 'default'
  );

  const incomingConns = connectionRequests.filter(
    (c) => c.receiverId === userId || c.receiverId === 'default'
  );

  const outgoingConns = connectionRequests.filter(
    (c) => c.senderId === userId || (userId === 'default' && c.senderId === 'p1')
  );

  const userAlerts = activityAlerts.filter(
    (a) => a.userId === userId || a.userId === 'default'
  );

  const unreadPendingIncoming = incomingOffers.filter(o => o.status === 'pending').length +
                                incomingConns.filter(c => c.status === 'pending').length;
  const unreadAlerts = userAlerts.filter(a => !a.read).length;
  const unreadCount = unreadPendingIncoming + unreadAlerts;

  return {
    unreadCount,
    offers: matchingOffers,
    incomingOffers,
    outgoingOffers,
    connectionRequests: incomingConns,
    outgoingRequests: outgoingConns,
    alerts: userAlerts,
  };
}

/**
 * Send a formal team offer to a candidate
 */
export async function sendTeamOffer({
  recruiter,
  candidateId,
  candidateName,
  candidateAvatar,
  roleName,
  teamName,
  equity = '1.0% Equity',
  comp = '$190,000 / yr',
  note = '',
}) {
  if (!candidateId) throw new Error('Candidate ID is required to send a team offer.');

  const offerId = `offer_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newOffer = {
    id: offerId,
    recruiterId: recruiter.id || 'p1',
    recruiterName: recruiter.name || 'Hiring Lead',
    recruiterAvatar: recruiter.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    recruiterCompany: recruiter.company || 'Autonomous Systems',
    candidateId,
    candidateName: candidateName || 'Candidate',
    candidateAvatar: candidateAvatar || '',
    roleName: roleName || 'Core Team Member',
    teamName: teamName || (recruiter.company ? `${recruiter.company} Team` : 'Founding Pod'),
    equity,
    comp,
    note: note || `We want you to join our team as ${roleName}!`,
    status: 'pending',
    createdAt: Date.now(),
  };

  teamOffers.unshift(newOffer);

  // If candidate is a demo user, simulate an AI response after a short delay for interactive delight
  if (['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'].includes(candidateId)) {
    setTimeout(async () => {
      // 85% chance accept
      const willAccept = Math.random() > 0.15;
      const offer = teamOffers.find((o) => o.id === offerId);
      if (offer && offer.status === 'pending') {
        offer.status = willAccept ? 'accepted' : 'declined';
        
        if (willAccept) {
          // Add graph connection edge
          try {
            await executeWriteQuery(
              `
              MATCH (p1:Person {id: $recId}), (p2:Person {id: $candId})
              MERGE (p1)-[k:KNOWS]->(p2)
              ON CREATE SET k.context = 'Teammates at ' + $team, k.strength = 5
              `,
              { recId: offer.recruiterId, candId: offer.candidateId, team: offer.teamName }
            );
          } catch (e) {
            console.warn('Could not write graph edge on simulated offer accept:', e.message);
          }
        }

        activityAlerts.unshift({
          id: `alert_${Date.now()}`,
          userId: offer.recruiterId,
          type: willAccept ? 'offer_accepted' : 'offer_declined',
          title: willAccept ? '🎉 Team Offer Accepted!' : 'Team Offer Update',
          message: willAccept
            ? `${offer.candidateName} accepted your offer to join as ${offer.roleName}!`
            : `${offer.candidateName} was unable to accept your offer for ${offer.roleName} at this time.`,
          createdAt: Date.now(),
        });
      }
    }, 4000);
  }

  return {
    success: true,
    offer: newOffer,
    message: `Team offer sent to ${candidateName}!`,
  };
}

/**
 * Candidate responds to a team offer (Accept or Decline/Reject)
 */
export async function respondToTeamOffer({ offerId, status, user }) {
  const offer = teamOffers.find((o) => o.id === offerId);
  if (!offer) throw new Error('Offer not found.');

  const normalizedStatus = status === 'rejected' ? 'declined' : status;

  if (!['accepted', 'declined'].includes(normalizedStatus)) {
    throw new Error('Invalid status. Must be "accepted" or "declined"/"rejected".');
  }

  offer.status = normalizedStatus;
  offer.respondedAt = Date.now();

  if (normalizedStatus === 'accepted') {
    // 1. Establish strong KNOWS / Teammate edge in Graph Database
    try {
      const recId = offer.recruiterId;
      const candId = user?.id || offer.candidateId;

      await executeWriteQuery(
        `
        MATCH (p1:Person {id: $recId}), (p2:Person {id: $candId})
        MERGE (p1)-[k:KNOWS]->(p2)
        ON CREATE SET k.context = 'Teammates on ' + $team, k.strength = 5
        ON MATCH SET k.context = 'Teammates on ' + $team, k.strength = 5
        `,
        { recId, candId, team: offer.teamName }
      );
    } catch (err) {
      console.warn('Error linking accepted team in graph:', err.message);
    }

    // 2. Send notification to Recruiter
    activityAlerts.unshift({
      id: `alert_${Date.now()}`,
      userId: offer.recruiterId,
      type: 'offer_accepted',
      title: '🎉 Team Offer Accepted!',
      message: `${user?.name || offer.candidateName} accepted your team offer for ${offer.roleName}! They are now in your team roster.`,
      createdAt: Date.now(),
    });
  } else {
    // Declined notification
    activityAlerts.unshift({
      id: `alert_${Date.now()}`,
      userId: offer.recruiterId,
      type: 'offer_declined',
      title: 'Offer Declined',
      message: `${user?.name || offer.candidateName} rejected/declined your team offer for ${offer.roleName}.`,
      createdAt: Date.now(),
    });
  }

  return {
    success: true,
    offer,
    message: normalizedStatus === 'accepted' ? 'You joined the team!' : 'Offer declined.',
  };
}

/**
 * Recruiter cancels or withdraws a sent offer
 */
export async function withdrawTeamOffer({ offerId, user }) {
  const index = teamOffers.findIndex((o) => o.id === offerId);
  if (index === -1) throw new Error('Offer not found.');

  const offer = teamOffers[index];
  offer.status = 'withdrawn';
  offer.respondedAt = Date.now();

  return {
    success: true,
    offer,
    message: 'Offer withdrawn successfully.',
  };
}

/**
 * Send a warm connection request
 */
export async function sendConnectionRequest({ sender, receiverId, context = '' }) {
  if (!receiverId) throw new Error('Receiver ID is required.');

  const reqId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newReq = {
    id: reqId,
    senderId: sender.id || 'p1',
    senderName: sender.name || 'Startup Peer',
    senderAvatar: sender.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    senderTitle: sender.title || 'Tech Specialist',
    senderCompany: sender.company || 'Tech Ecosystem',
    receiverId,
    context: context || 'Wants to establish a warm graph connection.',
    status: 'pending',
    createdAt: Date.now(),
  };

  connectionRequests.unshift(newReq);

  // If receiver is a demo node, simulate automatic acceptance after short delay
  if (['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'].includes(receiverId)) {
    setTimeout(async () => {
      const conn = connectionRequests.find((c) => c.id === reqId);
      if (conn && conn.status === 'pending') {
        conn.status = 'accepted';
        try {
          await executeWriteQuery(
            `
            MATCH (p1:Person {id: $id1}), (p2:Person {id: $id2})
            MERGE (p1)-[k:KNOWS]->(p2)
            ON CREATE SET k.context = 'Connected via Startup Graph', k.strength = 4
            `,
            { id1: conn.senderId, id2: conn.receiverId }
          );
        } catch (e) {}

        activityAlerts.unshift({
          id: `alert_${Date.now()}`,
          userId: conn.senderId,
          type: 'connection_accepted',
          title: '🤝 Connection Request Accepted!',
          message: `Your connection request to ${conn.receiverId} was accepted! You can now request warm introductions through them.`,
          createdAt: Date.now(),
        });
      }
    }, 3500);
  }

  return {
    success: true,
    request: newReq,
    message: 'Connection request sent successfully!',
  };
}

/**
 * Respond to connection request (Accept or Decline)
 */
export async function respondToConnectionRequest({ reqId, status, user }) {
  const conn = connectionRequests.find((c) => c.id === reqId);
  if (!conn) throw new Error('Connection request not found.');

  conn.status = status;
  conn.respondedAt = Date.now();

  if (status === 'accepted') {
    const p1Id = conn.senderId;
    const p2Id = user?.id || conn.receiverId;

    try {
      await executeWriteQuery(
        `
        MATCH (p1:Person {id: $p1Id}), (p2:Person {id: $p2Id})
        MERGE (p1)-[k:KNOWS]->(p2)
        ON CREATE SET k.context = 'Mutual Graph Connection', k.strength = 4
        ON MATCH SET k.context = 'Mutual Graph Connection', k.strength = 4
        `,
        { p1Id, p2Id }
      );
    } catch (err) {
      console.warn('Error creating KNOWS edge in graph:', err.message);
    }

    activityAlerts.unshift({
      id: `alert_${Date.now()}`,
      userId: conn.senderId,
      type: 'connection_accepted',
      title: '🤝 Connection Request Accepted!',
      message: `${user?.name || 'Your peer'} accepted your connection request!`,
      createdAt: Date.now(),
    });
  }

  return {
    success: true,
    request: conn,
    message: status === 'accepted' ? 'Connection established!' : 'Connection declined.',
  };
}

/**
 * Mark all alerts as read
 */
export function markAlertsRead(userId = 'default') {
  activityAlerts.forEach((a) => {
    if (a.userId === userId || a.userId === 'default') {
      a.read = true;
    }
  });
  return { success: true };
}
