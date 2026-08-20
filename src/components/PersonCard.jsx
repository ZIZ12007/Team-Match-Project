import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Building2, GitMerge, Network, ArrowUpRight } from 'lucide-react';

export function PersonCard({
  person,
  onViewProfile,
  onExploreGraph,
  onFindPath,
  index = 0,
  currentUserId,
  selectedSkills = [],
}) {
  const rawSkills = person.skills || [];
  const connectionCount = person.connectionCount || 0;
  const isMe = person.isCurrentUser || (currentUserId && person.id === currentUserId);

  // Sort skills so matching skills appear first
  const skills = [...rawSkills].sort((a, b) => {
    const aMatch = selectedSkills.includes(a.name) ? 1 : 0;
    const bMatch = selectedSkills.includes(b.name) ? 1 : 0;
    return bMatch - aMatch;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 350,
        damping: 26,
        delay: Math.min(index * 0.035, 0.35),
      }}
      whileHover={{ y: -4 }}
      className={`brutal-card flex flex-col justify-between p-5 bg-white group hover:shadow-[6px_6px_0px_#08123B] transition-shadow ${
        isMe ? 'ring-3 ring-[#008A3E] bg-[#FAFCFA]' : ''
      }`}
    >
      {/* Top Header info */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="relative h-13 w-13 shrink-0 rounded-xl border-2 border-[#08123B] bg-[#F4F6FB] overflow-hidden shadow-[2px_2px_0px_#08123B]"
            >
              <img
                src={person.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`}
                alt={person.name}
                className="h-full w-full object-cover contrast-110 group-hover:scale-105 transition-transform duration-300 ease-out"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=08123B&color=ffffff&bold=true`;
                }}
              />
            </motion.div>
            <div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onViewProfile(person)}
                  className="text-left font-display text-base sm:text-lg font-extrabold text-[#08123B] hover:text-[#0052FF] transition-colors leading-tight line-clamp-1"
                >
                  {person.name}
                </button>
                {isMe && (
                  <span className="px-1.5 py-0.2 rounded bg-[#008A3E] text-white text-[9px] font-mono-code font-bold uppercase">
                    YOU
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-[#4A5578] line-clamp-1 mt-0.5">{person.title}</p>
            </div>
          </div>

          {/* Connection badge */}
          <motion.div
            whileHover={{ scale: 1.08 }}
            title={`${connectionCount} direct colleagues & network connections`}
            className="shrink-0 rounded-md border-2 border-[#08123B] bg-[#FF007A] px-2 py-0.5 text-[10px] font-mono-code font-bold uppercase text-white shadow-[1.5px_1.5px_0px_#08123B]"
          >
            {connectionCount} CONNECTIONS
          </motion.div>
        </div>

        {/* Company & Location */}
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono-code text-[#4A5578]">
          {person.companyName && (
            <div className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-[#0052FF]" />
              <span className="font-bold text-[#08123B]">{person.companyName}</span>
            </div>
          )}
          {person.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#7382A6]" />
              <span>{person.location}</span>
            </div>
          )}
        </div>

        {/* Bio summary */}
        {person.bio && (
          <p className="mb-4 text-xs text-[#2A3453] line-clamp-2 leading-relaxed font-normal">
            {person.bio}
          </p>
        )}

        {/* Skills Tag Cloud with Micro Hover bounce */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {skills.slice(0, 4).map((skill, idx) => {
            const isMatch = selectedSkills.includes(skill.name);
            return (
              <motion.span
                key={idx}
                whileHover={{ scale: 1.05, y: -1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                className={`rounded-md border px-2 py-0.5 text-[11px] font-mono-code font-semibold cursor-default transition-colors ${
                  isMatch
                    ? 'border-[#08123B] bg-[#0052FF] text-white font-bold shadow-[1.5px_1.5px_0px_#08123B]'
                    : 'border-[#08123B] bg-[#F4F6FB] text-[#08123B]'
                }`}
              >
                {isMatch && <span className="mr-1 text-[#FFC700] font-bold">✓</span>}
                {skill.name}
                {skill.level && (
                  <span
                    className={`ml-1 text-[10px] font-bold ${
                      isMatch ? 'text-white/80' : 'text-[#0052FF]'
                    }`}
                  >
                    L{skill.level}
                  </span>
                )}
              </motion.span>
            );
          })}
          {skills.length > 4 && (
            <span className="rounded-md border border-dashed border-[#7382A6] bg-[#FFFFFF] px-1.5 py-0.5 text-[10px] font-mono-code font-medium text-[#4A5578]">
              +{skills.length - 4}
            </span>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t-2 border-[#08123B]/15 flex items-center justify-between gap-1.5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onViewProfile(person)}
          className="brutal-btn flex-1 bg-[#08123B] text-[#FFFFFF] py-1.5 px-2 text-xs font-display font-extrabold uppercase flex items-center justify-center gap-1 hover:bg-[#0052FF]"
        >
          <span>PROFILE</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onExploreGraph(person)}
          title="Open interactive 2-hop graph neighborhood"
          className="brutal-btn bg-[#FFFFFF] text-[#08123B] py-1.5 px-2.5 text-xs font-display font-extrabold uppercase flex items-center justify-center gap-1 hover:bg-[#0052FF] hover:text-white"
        >
          <Network className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">GRAPH</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => onFindPath(person)}
          title="Find shortest path from seeker"
          className="brutal-btn bg-[#FFFFFF] text-[#08123B] py-1.5 px-2 text-xs font-display font-extrabold uppercase flex items-center justify-center gap-1 hover:bg-[#FF007A] hover:text-white"
        >
          <GitMerge className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">PATH</span>
        </motion.button>
      </div>
    </motion.div>
  );
}
